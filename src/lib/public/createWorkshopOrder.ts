/**
 * Create (or refresh) a pending_verification Order from Programs workshop registration.
 * Uses the landing open session so admin Approve/Reject + seats work like checkout.
 */
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Lead } from '@/models/Lead';
import { Session } from '@/models/Session';
import { connectToDatabase } from '@/lib/db';
import { PROGRAMS } from '@/data/programs';
import { WORKSHOP_PAYMENT } from '@/data/workshopRegistration';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { expireStaleOrders } from '@/lib/orders/expire';
import { withOrdersTransaction } from '@/lib/orders/tx';
import {
  extendHold,
  holdSeat,
  releaseHold,
  SeatError,
} from '@/lib/orders/seats';
import { isLiveForStatus } from '@/lib/orders/isLive';
import { deleteProof } from '@/lib/orders/gridfs';
import {
  createPublicToken,
  nextOrderNumber,
  normalizeEmail,
} from '@/lib/orders/tokens';
import { getSeatSummary } from '@/lib/sessions/seats';
import type { WorkshopRegistrationFields } from '@/lib/public/workshopRegistrationSchema';

function isDupKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}

export type WorkshopOrderProof = {
  fileId: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
};

export type CreateWorkshopOrderInput = WorkshopRegistrationFields & {
  proof: WorkshopOrderProof;
  leadId?: string;
};

export type CreateWorkshopOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      publicToken: string;
      alreadyExisted: boolean;
    }
  | { ok: false; status: number; code: string; message: string };

function workshopPlanId(programId: string) {
  return `workshop:${programId}`;
}

export async function createWorkshopOrder(
  input: CreateWorkshopOrderInput
): Promise<CreateWorkshopOrderResult> {
  await connectToDatabase();
  await ensureOrderIndexes();
  await expireStaleOrders();

  const program = PROGRAMS.find((p) => p.id === input.programId);
  if (!program || program.status !== 'open') {
    return {
      ok: false,
      status: 400,
      code: 'invalid_program',
      message: 'This program is not open for registration',
    };
  }

  const programTitle = (input.programTitle || program.title).trim();
  const amount = WORKSHOP_PAYMENT.amountPkr;

  const sessionDoc = await Session.findOne({
    isLandingActive: true,
    status: 'open',
  });
  if (!sessionDoc) {
    return {
      ok: false,
      status: 409,
      code: 'sold_out',
      message: 'Sorry, registrations are closed right now',
    };
  }

  const sessionId = String(sessionDoc._id);
  const seats = getSeatSummary(sessionDoc);
  if (seats.available <= 0) {
    return {
      ok: false,
      status: 409,
      code: 'sold_out',
      message: 'Sorry, all seats are taken',
    };
  }

  const emailNormalized = normalizeEmail(input.email);
  const holdHours = Math.max(1, Number(sessionDoc.holdHours) || 24);
  const holdMinutes = holdHours * 60;
  const newExpiry = new Date(Date.now() + holdHours * 3600_000);

  const existingLive = await Order.findOne({
    sessionId,
    'customer.emailNormalized': emailNormalized,
    isLive: true,
  });

  if (existingLive) {
    if (existingLive.status === 'approved') {
      return {
        ok: false,
        status: 409,
        code: 'already_confirmed',
        message: 'You already have a confirmed seat for this session',
      };
    }

    const isSameWorkshop =
      existingLive.sourceKind === 'workshop' &&
      existingLive.programId === input.programId;

    if (!isSameWorkshop) {
      return {
        ok: false,
        status: 409,
        code: 'conflict',
        message:
          'You already have an open booking for this session. Finish that payment first, or contact us.',
      };
    }

    // Refresh proof + details on existing workshop booking
    const previousOrderProofId = existingLive.proof?.fileId || '';
    try {
      await withOrdersTransaction(async (mongoSession) => {
        const orderId = String(existingLive._id);
        const hasHold = (sessionDoc.holds ?? []).some(
          (h) =>
            String(h.orderId) === orderId &&
            new Date(h.expiresAt).getTime() > Date.now()
        );
        if (!hasHold) {
          await holdSeat(sessionId, orderId, holdMinutes, {
            session: mongoSession,
          });
        }
        await extendHold(sessionId, orderId, newExpiry, {
          session: mongoSession,
        });

        const updated = await Order.findOneAndUpdate(
          {
            _id: existingLive._id,
            status: { $in: ['awaiting_payment', 'pending_verification'] },
            isLive: true,
          },
          {
            $set: {
              status: 'pending_verification',
              isLive: isLiveForStatus('pending_verification'),
              customer: {
                name: input.name.trim(),
                email: input.email.trim(),
                emailNormalized,
                phone: input.phone.trim(),
                profession: input.profession.trim(),
              },
              planSnapshot: {
                name: programTitle,
                type: 'one_time',
                currency: 'PKR',
                price: amount,
                installmentsCount: null,
              },
              amounts: {
                basePrice: amount,
                discountAmount: 0,
                finalPrice: amount,
                installmentsCount: 1,
                totalAmount: amount,
              },
              proof: {
                fileId: input.proof.fileId,
                contentType: input.proof.contentType,
                size: input.proof.size,
                uploadedAt: input.proof.uploadedAt,
                uploadCount: (existingLive.proof?.uploadCount ?? 0) + 1,
              },
              sourceKind: 'workshop',
              programId: input.programId,
              programTitle,
              workshopMeta: {
                city: input.city,
                skillLevel: input.skillLevel,
                learningGoals: input.learningGoals,
              },
              utm: {
                source: 'workshop_registration',
                medium: 'programs',
                campaign: input.programId,
                content: '',
                term: '',
              },
              leadId: input.leadId || existingLive.leadId || '',
            },
            $inc: { version: 1 },
            $push: {
              events: {
                type: 'proof_uploaded',
                at: new Date(),
                note: `Workshop registration updated: ${programTitle}`,
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

      if (
        previousOrderProofId &&
        previousOrderProofId !== input.proof.fileId
      ) {
        await deleteProof(previousOrderProofId).catch(() => undefined);
      }
    } catch (err) {
      if (err instanceof SeatError) {
        return {
          ok: false,
          status: 409,
          code: 'sold_out',
          message: 'Sorry, all seats are taken',
        };
      }
      if (
        err instanceof Error &&
        (err as { code?: string }).code === 'CONFLICT'
      ) {
        return {
          ok: false,
          status: 409,
          code: 'conflict',
          message: 'Could not update your booking. Please try again.',
        };
      }
      throw err;
    }

    return {
      ok: true,
      orderId: String(existingLive._id),
      orderNumber: existingLive.orderNumber,
      publicToken: existingLive.publicToken,
      alreadyExisted: true,
    };
  }

  const orderId = new mongoose.Types.ObjectId();
  const publicToken = createPublicToken();

  try {
    const { result } = await withOrdersTransaction(async (mongoSession) => {
      await holdSeat(sessionId, String(orderId), holdMinutes, {
        session: mongoSession,
      });
      await extendHold(sessionId, String(orderId), newExpiry, {
        session: mongoSession,
      });

      const orderNumber = await nextOrderNumber(mongoSession);
      const [doc] = await Order.create(
        [
          {
            _id: orderId,
            orderNumber,
            publicToken,
            sessionId,
            planId: workshopPlanId(input.programId),
            customer: {
              name: input.name.trim(),
              email: input.email.trim(),
              emailNormalized,
              phone: input.phone.trim(),
              profession: input.profession.trim(),
            },
            planSnapshot: {
              name: programTitle,
              type: 'one_time',
              currency: 'PKR',
              price: amount,
              installmentsCount: null,
            },
            coupon: null,
            amounts: {
              basePrice: amount,
              discountAmount: 0,
              finalPrice: amount,
              installmentsCount: 1,
              totalAmount: amount,
            },
            paymentMethod: 'bank_transfer',
            proof: {
              fileId: input.proof.fileId,
              contentType: input.proof.contentType,
              size: input.proof.size,
              uploadedAt: input.proof.uploadedAt,
              uploadCount: 1,
            },
            status: 'pending_verification',
            isLive: isLiveForStatus('pending_verification'),
            rejectionReason: '',
            adminNote: '',
            events: [
              {
                type: 'created',
                at: new Date(),
                note: `Workshop booking: ${programTitle}`,
              },
              {
                type: 'proof_uploaded',
                at: new Date(),
                note: 'Payment screenshot uploaded',
              },
            ],
            utm: {
              source: 'workshop_registration',
              medium: 'programs',
              campaign: input.programId,
              content: '',
              term: '',
            },
            leadId: input.leadId || '',
            sourceKind: 'workshop',
            programId: input.programId,
            programTitle,
            workshopMeta: {
              city: input.city,
              skillLevel: input.skillLevel,
              learningGoals: input.learningGoals,
            },
            isTestData: emailNormalized.endsWith('@checkout-test.invalid'),
            version: 1,
          },
        ],
        { session: mongoSession ?? undefined }
      );

      return { doc: doc! };
    });

    const orderDoc = result.doc;

    // Link / create lead as converted
    let lead = await Lead.findOne({ emailNormalized });
    if (lead) {
      lead.status = 'converted';
      lead.convertedOrderId = String(orderDoc._id);
      lead.lastSeenAt = new Date();
      lead.kind = 'workshop';
      lead.programId = input.programId;
      lead.programTitle = programTitle;
      await lead.save();
      if (!orderDoc.leadId) {
        orderDoc.leadId = String(lead._id);
        await orderDoc.save();
      }
    }

    return {
      ok: true,
      orderId: String(orderDoc._id),
      orderNumber: orderDoc.orderNumber,
      publicToken: orderDoc.publicToken,
      alreadyExisted: false,
    };
  } catch (err) {
    await releaseHold(sessionId, String(orderId)).catch(() => undefined);

    if (err instanceof SeatError) {
      return {
        ok: false,
        status: 409,
        code: 'sold_out',
        message: 'Sorry, all seats are taken',
      };
    }

    if (isDupKey(err)) {
      const existing = await Order.findOne({
        sessionId,
        'customer.emailNormalized': emailNormalized,
        isLive: true,
      });
      if (existing) {
        return {
          ok: true,
          orderId: String(existing._id),
          orderNumber: existing.orderNumber,
          publicToken: existing.publicToken,
          alreadyExisted: true,
        };
      }
      return {
        ok: false,
        status: 409,
        code: 'conflict',
        message: 'Could not create your booking. Please try again.',
      };
    }

    throw err;
  }
}
