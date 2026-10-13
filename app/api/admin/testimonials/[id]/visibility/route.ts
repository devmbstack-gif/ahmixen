import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Testimonial } from '@/models/Testimonial';
import { MediaAsset } from '@/models/MediaAsset';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';
import { testimonialVisibilitySchema } from '@/lib/testimonials/schema';
import { serializeTestimonial } from '@/lib/testimonials/serialize';
import { revalidateContent } from '@/lib/content/cache';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const body = await request.json().catch(() => null);
    const parsed = testimonialVisibilitySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const doc = await Testimonial.findById(id);
    if (!doc) return notFound();
    if (parsed.data.version !== doc.version) {
      return conflict('This was changed elsewhere, reload');
    }

    doc.visible = parsed.data.visible;
    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'testimonial.visibility',
      entity: 'testimonial',
      entityId: id,
      meta: { visible: doc.visible },
    });

    revalidateContent('testimonials');

    const avatar = doc.avatarAssetId
      ? await MediaAsset.findById(doc.avatarAssetId).lean()
      : null;

    return NextResponse.json({ item: serializeTestimonial(doc, avatar) });
  } catch (err) {
    console.error('[admin testimonials visibility]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
