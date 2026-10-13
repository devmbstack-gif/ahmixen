/**
 * Internal order creation used by the seed (and later public checkout).
 * Holds a seat atomically, then inserts the order (with compensating release).
 */
import mongoose from 'mongoose';
import { Order, type OrderDocument } from '@/models/Order';
import { createPublicToken, nextOrderNumber, normalizeEmail } from './tokens';
import { holdSeat, releaseHold, SeatError, getCheckoutHoldMinutes } from './seats';
import { isLiveForStatus } from './isLive';
import { ensureOrderIndexes } from './syncIndexes';
import type { OrderStatus } from '@/models/Order';

export type CreateOrderInput = {
  sessionId: string;
  planId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    profession?: string;
  };
  planSnapshot: {
    name: string;
    type: 'one_time' | 'installment';
    currency: 'PKR' | 'USD';
    price: number;
    installmentsCount: number | null;
  };
  coupon?: {
    couponId: string;
    code: string;
    discountAmount: number;
  } | null;
  amounts: {
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    installmentsCount: number;
    totalAmount: number;
  };
  status?: OrderStatus;
  isTestData?: boolean;
  holdMinutes?: number;
  /** When true, skip holdSeat (for expired seed orders that should not hold). */
  skipHold?: boolean;
  proof?: {
    fileId: string;
    contentType: string;
    size: number;
    uploadedAt: Date;
  } | null;
  rejectionReason?: string;
  events?: Array<{
    type: 'created' | 'proof_uploaded' | 'approved' | 'rejected' | 'expired' | 'cancelled' | 'note';
    at: Date;
    adminId?: string;
    note?: string;
  }>;
};

export async function createOrderInternal(
  input: CreateOrderInput
): Promise<OrderDocument> {
  await ensureOrderIndexes();

  if (!mongoose.isValidObjectId(input.sessionId)) {
    throw new Error('Invalid session');
  }

  const orderId = new mongoose.Types.ObjectId();
  const status = input.status ?? 'awaiting_payment';
  const holdMinutes = input.holdMinutes ?? getCheckoutHoldMinutes();

  if (!input.skipHold && isLiveForStatus(status) && status !== 'approved') {
    await holdSeat(input.sessionId, String(orderId), holdMinutes);
  }

  try {
    const orderNumber = await nextOrderNumber();
    const doc = await Order.create({
      _id: orderId,
      orderNumber,
      publicToken: createPublicToken(),
      sessionId: input.sessionId,
      planId: input.planId,
      customer: {
        name: input.customer.name.trim(),
        email: input.customer.email.trim(),
        emailNormalized: normalizeEmail(input.customer.email),
        phone: input.customer.phone.trim(),
        profession: input.customer.profession?.trim() || '',
      },
      planSnapshot: input.planSnapshot,
      coupon: input.coupon ?? null,
      amounts: input.amounts,
      paymentMethod: 'bank_transfer',
      proof: input.proof ?? null,
      status,
      isLive: isLiveForStatus(status),
      rejectionReason: input.rejectionReason || '',
      adminNote: '',
      events: input.events?.length
        ? input.events
        : [{ type: 'created', at: new Date(), note: 'Booking created' }],
      isTestData: Boolean(input.isTestData),
      version: 1,
    });
    return doc;
  } catch (err) {
    if (!input.skipHold && isLiveForStatus(status) && status !== 'approved') {
      await releaseHold(input.sessionId, String(orderId)).catch(() => undefined);
    }
    throw err;
  }
}

export { SeatError };
