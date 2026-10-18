import { NextResponse } from 'next/server';
import { Testimonial } from '@/models/Testimonial';
import { MediaAsset } from '@/models/MediaAsset';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { testimonialWriteSchema } from '@/lib/testimonials/schema';
import { serializeTestimonial } from '@/lib/testimonials/serialize';
import { revalidateContent } from '@/lib/content/cache';

async function avatarFor(id: string | null | undefined) {
  if (!id) return null;
  return MediaAsset.findById(id).lean();
}

export async function GET() {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const docs = await Testimonial.find().sort({ sortOrder: 1, createdAt: 1 });
    const items = await Promise.all(
      docs.map(async (doc) =>
        serializeTestimonial(doc, await avatarFor(doc.avatarAssetId))
      )
    );
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[admin testimonials GET]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function POST(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const body = await request.json().catch(() => null);
    const parsed = testimonialWriteSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const data = parsed.data;
    if (data.avatarAssetId) {
      const asset = await MediaAsset.findById(data.avatarAssetId);
      if (!asset) return badRequest('Choose a photo from the media library');
    }

    const maxOrder = await Testimonial.findOne()
      .sort({ sortOrder: -1 })
      .select({ sortOrder: 1 })
      .lean();
    const sortOrder = (maxOrder?.sortOrder ?? -1) + 1;

    const doc = await Testimonial.create({
      name: data.name,
      role: data.role ?? '',
      quote: data.quote,
      rating: data.rating ?? null,
      avatarAssetId: data.avatarAssetId || null,
      visible: data.visible ?? true,
      source: 'admin',
      sortOrder,
      version: 1,
      createdBy: gate.admin.sub,
      updatedBy: gate.admin.sub,
    });

    await logAudit({
      adminId: gate.admin.sub,
      action: 'testimonial.create',
      entity: 'testimonial',
      entityId: String(doc._id),
      meta: { visible: doc.visible },
    });

    revalidateContent('testimonials', 'media');

    return NextResponse.json(
      {
        item: serializeTestimonial(
          doc,
          await avatarFor(doc.avatarAssetId)
        ),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[admin testimonials POST]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
