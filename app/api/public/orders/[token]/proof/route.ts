import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { connectToDatabase } from '@/lib/db';
import { deleteProof, saveProof } from '@/lib/orders/gridfs';
import {
  extendHold,
  holdSeat,
  holdStillActive,
  SeatError,
} from '@/lib/orders/seats';
import { withOrdersTransaction } from '@/lib/orders/tx';
import { isLiveForStatus } from '@/lib/orders/isLive';
import {
  assertPublicOrigin,
  publicError,
  publicOk,
  publicRateLimited,
} from '@/lib/public/response';
import {
  rateLimit,
  rateLimitIdentityKey,
  rateLimitKey,
} from '@/lib/public/rateLimit';
import { PUBLIC_RATE_LIMITS } from '@/lib/public/rateLimitConfig';
import { notifyAdminNewBooking } from '@/lib/email/outbox';
import { upsertLeadFromSubmission } from '@/lib/leads/upsert';

type Ctx = { params: Promise<{ token: string }> };

const MAX_BYTES = 2 * 1024 * 1024;
const EARLY_CONTENT_LENGTH = 3 * 1024 * 1024;

export async function POST(request: Request, ctx: Ctx) {
  let newFileId: string | null = null;
  try {
    if (!assertPublicOrigin(request)) {
      return publicError('forbidden', 'Forbidden', 403);
    }

    const { token } = await ctx.params;
    if (!token || token.length < 32) {
      return publicError('not_found', 'Booking not found', 404);
    }

    const ipRule = PUBLIC_RATE_LIMITS.proofIp;
    const rlIp = await rateLimit(
      rateLimitKey('public:proof', request),
      ipRule.limit,
      ipRule.windowSeconds
    );
    if (!rlIp.ok) return publicRateLimited(rlIp.retryAfterSeconds);

    const tokenRule = PUBLIC_RATE_LIMITS.proofToken;
    const rlToken = await rateLimit(
      rateLimitIdentityKey('public:proof:token', token),
      tokenRule.limit,
      tokenRule.windowSeconds
    );
    if (!rlToken.ok) return publicRateLimited(rlToken.retryAfterSeconds);

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > EARLY_CONTENT_LENGTH) {
      return publicError(
        'file_too_large',
        'The image is too large. Use a file under 2 MB',
        400
      );
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!file || !(file instanceof File)) {
      return publicError(
        'missing_file',
        'Choose a payment screenshot to upload',
        400
      );
    }
    if (file.size <= 0) {
      return publicError(
        'missing_file',
        'Choose a payment screenshot to upload',
        400
      );
    }
    if (file.size > MAX_BYTES) {
      return publicError(
        'file_too_large',
        'The image is too large. Use a file under 2 MB',
        400
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length <= 0) {
      return publicError(
        'missing_file',
        'Choose a payment screenshot to upload',
        400
      );
    }
    if (buffer.length > MAX_BYTES) {
      return publicError(
        'file_too_large',
        'The image is too large. Use a file under 2 MB',
        400
      );
    }

    await connectToDatabase();
    const order = await Order.findOne({ publicToken: token });
    if (!order) {
      return publicError('not_found', 'Booking not found', 404);
    }

    if (
      order.status !== 'awaiting_payment' &&
      order.status !== 'pending_verification'
    ) {
      return publicError(
        'conflict',
        'This order can no longer accept a payment screenshot',
        409
      );
    }

    const uploadCount = order.proof?.uploadCount ?? 0;
    if (uploadCount >= 3) {
      return publicError(
        'upload_limit',
        'You have reached the upload limit for this booking',
        409
      );
    }

    let saved;
    try {
      saved = await saveProof(buffer, { orderId: String(order._id) });
      newFileId = saved.fileId;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Upload a JPEG, PNG or WebP image (max 2 MB)';
      return publicError('invalid_file', msg, 400);
    }

    const previousFileId = order.proof?.fileId || null;
    const sessionDoc = await Session.findById(order.sessionId);
    if (!sessionDoc) {
      await deleteProof(saved.fileId);
      newFileId = null;
      return publicError('server_error', 'Something went wrong', 500);
    }

    const holdHours = Math.max(1, Number(sessionDoc.holdHours) || 24);
    const newExpiry = new Date(Date.now() + holdHours * 3600_000);
    const orderId = String(order._id);

    try {
      await withOrdersTransaction(async (mongoSession) => {
        const hasHold = holdStillActive(sessionDoc.holds, orderId);
        if (!hasHold) {
          try {
            await holdSeat(order.sessionId, orderId, holdHours * 60, {
              session: mongoSession,
            });
          } catch (seatErr) {
            if (seatErr instanceof SeatError) {
              const err = new Error('SOLD_OUT_AFTER_PAY');
              (err as Error & { code: string }).code = 'SOLD_OUT_AFTER_PAY';
              throw err;
            }
            throw seatErr;
          }
        }
        await extendHold(order.sessionId, orderId, newExpiry, {
          session: mongoSession,
        });

        const updated = await Order.findOneAndUpdate(
          {
            _id: order._id,
            status: { $in: ['awaiting_payment', 'pending_verification'] },
          },
          {
            $set: {
              status: 'pending_verification',
              isLive: isLiveForStatus('pending_verification'),
              proof: {
                fileId: saved.fileId,
                contentType: saved.contentType,
                size: saved.size,
                uploadedAt: new Date(),
                uploadCount: uploadCount + 1,
              },
            },
            $inc: { version: 1 },
            $push: {
              events: {
                type: 'proof_uploaded',
                at: new Date(),
                note: 'Payment screenshot uploaded',
              },
            },
          },
          {
            new: true,
            ...(mongoSession ? { session: mongoSession } : {}),
          }
        );

        if (!updated) {
          const err = new Error('CONFLICT');
          (err as Error & { code: string }).code = 'CONFLICT';
          throw err;
        }
      });
    } catch (err) {
      await deleteProof(saved.fileId);
      newFileId = null;
      if (
        err instanceof Error &&
        (err as { code?: string }).code === 'SOLD_OUT_AFTER_PAY'
      ) {
        return publicError(
          'sold_out',
          'Sorry, this session just sold out. If you already paid, please contact us.',
          409
        );
      }
      if (err instanceof Error && (err as { code?: string }).code === 'CONFLICT') {
        return publicError(
          'conflict',
          'This order can no longer accept a payment screenshot',
          409
        );
      }
      throw err;
    }

    if (previousFileId && previousFileId !== saved.fileId) {
      await deleteProof(previousFileId);
    }
    newFileId = null;

    try {
      const { leadId } = await upsertLeadFromSubmission({
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
        profession: order.customer.profession || '',
        kind: order.sourceKind === 'workshop' ? 'workshop' : 'general',
        programId: order.programId || '',
        programTitle: order.programTitle || '',
        city: order.workshopMeta?.city || '',
        skillLevel: order.workshopMeta?.skillLevel || '',
        learningGoals: order.workshopMeta?.learningGoals || [],
        paidConfirmed: true,
        markConverted: false,
        orderId,
        utm: order.utm,
        message:
          order.sourceKind === 'workshop'
            ? `Workshop booking: ${order.programTitle || 'program'}`
            : 'Payment screenshot uploaded',
        proof: {
          fileId: saved.fileId,
          contentType: saved.contentType,
          size: saved.size,
          uploadedAt: new Date(),
        },
      });
      if (!order.leadId) {
        order.leadId = leadId;
        await order.save().catch(() => undefined);
      }
    } catch (err) {
      console.error(
        '[public proof lead]',
        err instanceof Error ? err.message : 'upsert failed'
      );
    }

    await notifyAdminNewBooking(orderId);

    return publicOk({
      status: 'pending_verification',
      proofUploaded: true,
    });
  } catch (err) {
    if (newFileId) await deleteProof(newFileId).catch(() => undefined);
    console.error('[public proof]', err instanceof Error ? err.name : 'error');
    return publicError('server_error', 'Something went wrong', 500);
  }
}
