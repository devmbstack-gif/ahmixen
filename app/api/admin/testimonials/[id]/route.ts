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
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import {
  testimonialPatchSchema,
  testimonialWriteSchema,
} from '@/lib/testimonials/schema';
import { serializeTestimonial } from '@/lib/testimonials/serialize';
import { revalidateContent } from '@/lib/content/cache';

type Ctx = { params: Promise<{ id: string }> };

async function avatarFor(id: string | null | undefined) {
  if (!id) return null;
  return MediaAsset.findById(id).lean();
}

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const doc = await Testimonial.findById(id);
    if (!doc) return notFound();
    return NextResponse.json({
      item: serializeTestimonial(doc, await avatarFor(doc.avatarAssetId)),
    });
  } catch (err) {
    console.error('[admin testimonials GET id]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const body = await request.json().catch(() => null);
    const parsed = testimonialPatchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const doc = await Testimonial.findById(id);
    if (!doc) return notFound();

    const data = parsed.data;
    if (data.version !== doc.version) {
      return conflict('This was changed elsewhere, reload');
    }

    const merged = {
      name: data.name ?? doc.name,
      role: data.role !== undefined ? data.role : doc.role || '',
      quote: data.quote ?? doc.quote,
      rating:
        data.rating !== undefined ? data.rating : (doc.rating ?? null),
      avatarAssetId:
        data.avatarAssetId !== undefined
          ? data.avatarAssetId || null
          : doc.avatarAssetId || null,
      visible: data.visible !== undefined ? data.visible : doc.visible,
    };

    const full = testimonialWriteSchema.safeParse(merged);
    if (!full.success) {
      return badRequest(full.error.issues[0]?.message || 'Invalid input');
    }

    if (full.data.avatarAssetId) {
      const asset = await MediaAsset.findById(full.data.avatarAssetId);
      if (!asset) return badRequest('Choose a photo from the media library');
    }

    doc.name = full.data.name;
    doc.role = full.data.role ?? '';
    doc.quote = full.data.quote;
    doc.rating = full.data.rating ?? null;
    doc.avatarAssetId = full.data.avatarAssetId || null;
    doc.visible = full.data.visible ?? true;
    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'testimonial.update',
      entity: 'testimonial',
      entityId: id,
      meta: { fields: Object.keys(data).filter((k) => k !== 'version') },
    });

    revalidateContent('testimonials', 'media');

    return NextResponse.json({
      item: serializeTestimonial(doc, await avatarFor(doc.avatarAssetId)),
    });
  } catch (err) {
    console.error('[admin testimonials PATCH]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const doc = await Testimonial.findById(id);
    if (!doc) return notFound();

    await Testimonial.deleteOne({ _id: doc._id });

    await logAudit({
      adminId: gate.admin.sub,
      action: 'testimonial.delete',
      entity: 'testimonial',
      entityId: id,
      meta: {},
    });

    revalidateContent('testimonials', 'media');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin testimonials DELETE]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
