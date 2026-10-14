import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { Lead } from '@/models/Lead';
import { openProofStream } from '@/lib/orders/gridfs';
import {
  notFound,
  serverError,
  withAdminRead,
} from '@/lib/sessions/api-helpers';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const lead = await Lead.findById(id).select({ proof: 1 }).lean();
    const fileId = lead?.proof?.fileId;
    if (!fileId) return notFound();

    const opened = await openProofStream(fileId);
    if (!opened) return notFound();

    const { stream, contentType } = opened;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error(
      '[admin leads proof]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}
