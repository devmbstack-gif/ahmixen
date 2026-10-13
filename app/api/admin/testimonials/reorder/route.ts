import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Testimonial } from '@/models/Testimonial';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';
import { testimonialReorderSchema } from '@/lib/testimonials/schema';
import { revalidateContent } from '@/lib/content/cache';

export async function POST(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const body = await request.json().catch(() => null);
    const parsed = testimonialReorderSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const { orderedIds } = parsed.data;
    const unique = new Set(orderedIds);
    if (unique.size !== orderedIds.length) {
      return badRequest('Each testimonial can appear only once in the order');
    }

    const existing = await Testimonial.find().select({ _id: 1 }).lean();
    const existingIds = new Set(existing.map((d) => String(d._id)));
    if (existingIds.size !== orderedIds.length) {
      return badRequest('Send every testimonial id in the new order');
    }
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        return badRequest('One of the testimonials was not found — reload the list');
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      for (let i = 0; i < orderedIds.length; i += 1) {
        await Testimonial.updateOne(
          { _id: orderedIds[i] },
          { $set: { sortOrder: i, updatedBy: gate.admin.sub }, $inc: { version: 1 } },
          { session }
        );
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    await logAudit({
      adminId: gate.admin.sub,
      action: 'testimonial.reorder',
      entity: 'testimonial',
      entityId: 'bulk',
      meta: { count: orderedIds.length },
    });

    revalidateContent('testimonials');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin testimonials reorder]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
