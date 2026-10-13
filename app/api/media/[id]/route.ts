import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { MediaAsset } from '@/models/MediaAsset';
import { openMediaStream } from '@/lib/media/gridfs';

type Ctx = { params: Promise<{ id: string }> };

async function serveMedia(request: Request, ctx: Ctx, headOnly: boolean) {
  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) {
      return new NextResponse('Not found', { status: 404 });
    }

    await connectToDatabase();
    const asset = await MediaAsset.findById(id).lean();
    if (!asset || asset.kind !== 'upload' || !asset.fileId) {
      return new NextResponse('Not found', { status: 404 });
    }

    const opened = await openMediaStream(asset.fileId);
    if (!opened) {
      return new NextResponse('Not found', { status: 404 });
    }

    const etag = `"media-${id}-${asset.version ?? 1}"`;
    const inm = request.headers.get('if-none-match');
    if (inm && inm === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const headers = new Headers({
      'Content-Type': asset.contentType || opened.contentType,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    if (opened.length) {
      headers.set('Content-Length', String(opened.length));
    }

    if (headOnly) {
      opened.stream.destroy();
      return new NextResponse(null, { status: 200, headers });
    }

    const webStream = new ReadableStream({
      start(controller) {
        opened.stream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        opened.stream.on('end', () => controller.close());
        opened.stream.on('error', (err) => controller.error(err));
      },
      cancel() {
        opened.stream.destroy();
      },
    });

    return new NextResponse(webStream, { status: 200, headers });
  } catch (err) {
    console.error(
      '[api/media]',
      err instanceof Error ? err.message : 'error'
    );
    return new NextResponse('Not found', { status: 404 });
  }
}

export async function GET(request: Request, ctx: Ctx) {
  return serveMedia(request, ctx, false);
}

export async function HEAD(request: Request, ctx: Ctx) {
  return serveMedia(request, ctx, true);
}
