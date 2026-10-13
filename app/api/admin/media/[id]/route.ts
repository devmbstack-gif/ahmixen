import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
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
import { mediaPatchSchema } from '@/lib/media/schema';
import { serializeMediaAsset } from '@/lib/media/serialize';
import { findMediaUsages } from '@/lib/media/usages';
import { deleteMediaFile } from '@/lib/media/gridfs';
import { revalidateContent } from '@/lib/content/cache';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const doc = await MediaAsset.findById(id);
    if (!doc) return notFound();
    const usages = await findMediaUsages(id);
    return NextResponse.json({
      asset: { ...serializeMediaAsset(doc, usages.length), usages },
    });
  } catch (err) {
    console.error('[admin media GET id]', err instanceof Error ? err.message : 'error');
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
    const parsed = mediaPatchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const doc = await MediaAsset.findById(id);
    if (!doc) return notFound();

    if (parsed.data.version !== doc.version) {
      return conflict('This was changed elsewhere, reload');
    }

    if (parsed.data.name !== undefined) doc.name = parsed.data.name;
    if (parsed.data.altText !== undefined) doc.altText = parsed.data.altText;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'media.update',
      entity: 'mediaAsset',
      entityId: id,
      meta: {
        fields: Object.keys(parsed.data).filter((k) => k !== 'version'),
      },
    });

    revalidateContent('media', 'instructor', 'testimonials');

    const usages = await findMediaUsages(id);
    return NextResponse.json({
      asset: serializeMediaAsset(doc, usages.length),
    });
  } catch (err) {
    console.error('[admin media PATCH]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const doc = await MediaAsset.findById(id);
    if (!doc) return notFound();

    const usages = await findMediaUsages(id);
    if (usages.length > 0) {
      return NextResponse.json(
        {
          error: 'This image is in use. Remove it from those places first.',
          usages,
        },
        { status: 409 }
      );
    }

    if (doc.kind === 'upload' && doc.fileId) {
      await deleteMediaFile(doc.fileId);
    }
    // static: only remove the record, never delete /public files

    await MediaAsset.deleteOne({ _id: doc._id });

    await logAudit({
      adminId: gate.admin.sub,
      action: 'media.delete',
      entity: 'mediaAsset',
      entityId: id,
      meta: { kind: doc.kind },
    });

    revalidateContent('media');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin media DELETE]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
