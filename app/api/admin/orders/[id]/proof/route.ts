import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import {
  notFound,
  serverError,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { openProofStream } from '@/lib/orders/gridfs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const doc = await Order.findById(id).select({ proof: 1 }).lean();
    if (!doc?.proof?.fileId) return notFound();

    const opened = await openProofStream(doc.proof.fileId);
    if (!opened) return notFound();

    const { stream, contentType } = opened;
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[orders proof]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
