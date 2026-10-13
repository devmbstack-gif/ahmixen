import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { MediaAsset } from '@/models/MediaAsset';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { validateMediaBuffer } from '@/lib/media/validate';
import { saveMediaFile } from '@/lib/media/gridfs';
import { serializeMediaAsset } from '@/lib/media/serialize';
import { findMediaUsages } from '@/lib/media/usages';
import { hasHtmlTags, trimPlain } from '@/lib/content/plainText';
import { revalidateContent } from '@/lib/content/cache';

const PAGE_SIZE = 24;

export async function GET(request: Request) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);

    const filter: Record<string, unknown> = {};
    if (q) {
      filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const [total, docs] = await Promise.all([
      MediaAsset.countDocuments(filter),
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE),
    ]);

    const items = await Promise.all(
      docs.map(async (doc) => {
        const usages = await findMediaUsages(String(doc._id));
        return serializeMediaAsset(doc, usages.length);
      })
    );

    return NextResponse.json({
      items,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (err) {
    console.error('[admin media GET]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function POST(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const form = await request.formData().catch(() => null);
    if (!form) return badRequest('Upload an image file');

    const file = form.get('file');
    if (!(file instanceof File)) {
      return badRequest('Upload an image file using the file field');
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const checked = validateMediaBuffer(buf);
    if (!checked.ok) return badRequest(checked.error);

    let name = trimPlain(form.get('name') ?? file.name.replace(/\.[^.]+$/, ''));
    if (!name) name = 'Untitled image';
    if (name.length > 120) name = name.slice(0, 120);
    if (hasHtmlTags(name)) {
      return badRequest('Name must be plain text — remove any HTML tags');
    }

    let altText = trimPlain(form.get('altText') ?? '');
    if (altText.length > 160) altText = altText.slice(0, 160);
    if (hasHtmlTags(altText)) {
      return badRequest('Alt text must be plain text — remove any HTML tags');
    }

    const assetId = new mongoose.Types.ObjectId();
    const fileId = await saveMediaFile(buf, {
      filename: `media-${assetId.toString()}`,
      contentType: checked.contentType,
      assetId: assetId.toString(),
      width: checked.width,
      height: checked.height,
    });

    const doc = await MediaAsset.create({
      _id: assetId,
      kind: 'upload',
      fileId,
      staticPath: null,
      name,
      altText,
      contentType: checked.contentType,
      size: buf.length,
      width: checked.width,
      height: checked.height,
      uploadedBy: gate.admin.sub,
      version: 1,
    });

    await logAudit({
      adminId: gate.admin.sub,
      action: 'media.upload',
      entity: 'mediaAsset',
      entityId: String(doc._id),
      meta: { kind: 'upload', contentType: checked.contentType, size: buf.length },
    });

    revalidateContent('media');

    return NextResponse.json(
      { asset: serializeMediaAsset(doc, 0) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[admin media POST]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
