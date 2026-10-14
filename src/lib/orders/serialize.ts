import type { OrderDocument, OrderStatus } from '@/models/Order';
import { formatMoneyLabel } from '@/lib/plans/money';
import { digitsOnlyPhone } from './tokens';
import { holdStillActive } from './seats';

export type AdminOrderListDTO = {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  createdLabel: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amountLabel: string;
  couponCode: string | null;
  installmentLabel: string | null;
  sessionTitle: string;
  sessionDateLabel: string;
  status: OrderStatus;
  statusLabel: string;
  isTestData: boolean;
  seatHoldExpired: boolean;
  currency: string;
  finalPrice: number;
  sourceKind: 'checkout' | 'workshop';
  programId: string;
  programTitle: string;
  /** Short label for admin tables, e.g. "Workshop" */
  bookingTypeLabel: string;
};

export type AdminOrderDetailDTO = AdminOrderListDTO & {
  publicToken: string;
  sessionId: string;
  planId: string;
  phone: string;
  phoneDigits: string;
  profession: string;
  planSnapshot: {
    name: string;
    type: 'one_time' | 'installment';
    currency: 'PKR' | 'USD';
    price: number;
    installmentsCount: number | null;
  };
  amounts: {
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    installmentsCount: number;
    totalAmount: number;
  };
  coupon: { couponId: string; code: string; discountAmount: number } | null;
  hasProof: boolean;
  proofContentType: string | null;
  rejectionReason: string;
  adminNote: string;
  events: Array<{ type: string; at: string; adminId: string; note: string }>;
  version: number;
  seatsLeft: number | null;
  verifyHint: string;
  sourceLabel: string;
  emailStatus: 'sent' | 'pending' | 'failed' | 'skipped' | 'not_sent';
  emailStatusLabel: string;
  emailReason: string;
  workshopMeta: {
    city: string;
    skillLevel: string;
    learningGoals: string[];
  } | null;
};

function statusLabel(status: OrderStatus): string {
  if (status === 'pending_verification') return 'Needs review';
  if (status === 'awaiting_payment') return 'Awaiting payment';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'expired') return 'Expired';
  return 'Cancelled';
}

function formatPkt(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function formatPktDate(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function serializeAdminOrderList(
  doc: OrderDocument,
  meta: {
    sessionTitle?: string;
    sessionStartsAt?: Date | null;
    sessionHolds?: Array<{ orderId?: string; expiresAt: Date | string }>;
    now?: Date;
  } = {}
): AdminOrderListDTO {
  const now = meta.now ?? new Date();
  const currency = doc.planSnapshot.currency;
  const finalPrice = doc.amounts.finalPrice;
  const installments = doc.amounts.installmentsCount ?? 1;
  const installmentLabel =
    doc.planSnapshot.type === 'installment' && installments > 1
      ? `${installments} × ${formatMoneyLabel(currency, finalPrice)}`
      : null;

  const seatHoldExpired =
    (doc.status === 'pending_verification' || doc.status === 'awaiting_payment') &&
    !holdStillActive(meta.sessionHolds, String(doc._id), now);

  const sourceKind =
    (doc as { sourceKind?: string }).sourceKind === 'workshop'
      ? 'workshop'
      : 'checkout';
  const programId = String((doc as { programId?: string }).programId || '');
  const programTitle = String(
    (doc as { programTitle?: string }).programTitle || ''
  ).trim();
  const displayPlanName =
    sourceKind === 'workshop'
      ? programTitle || doc.planSnapshot.name
      : doc.planSnapshot.name;

  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : null,
    createdLabel: formatPkt(doc.createdAt),
    customerName: doc.customer.name,
    customerEmail: doc.customer.email,
    planName: displayPlanName,
    amountLabel: formatMoneyLabel(currency, finalPrice),
    couponCode: doc.coupon?.code ?? null,
    installmentLabel,
    sessionTitle: meta.sessionTitle || 'Session',
    sessionDateLabel: formatPktDate(meta.sessionStartsAt ?? null),
    status: doc.status as OrderStatus,
    statusLabel: statusLabel(doc.status as OrderStatus),
    isTestData: Boolean(doc.isTestData),
    seatHoldExpired,
    currency,
    finalPrice,
    sourceKind,
    programId,
    programTitle,
    bookingTypeLabel: sourceKind === 'workshop' ? 'Workshop' : 'Checkout',
  };
}

export function serializeAdminOrderDetail(
  doc: OrderDocument,
  meta: {
    sessionTitle?: string;
    sessionStartsAt?: Date | null;
    sessionHolds?: Array<{ orderId?: string; expiresAt: Date | string }>;
    seatsLeft?: number | null;
    now?: Date;
    emailStatus?: 'sent' | 'pending' | 'failed' | 'skipped' | 'not_sent';
    emailStatusLabel?: string;
    emailReason?: string;
  } = {}
): AdminOrderDetailDTO {
  const base = serializeAdminOrderList(doc, meta);
  const phone = doc.customer.phone || '';
  return {
    ...base,
    publicToken: doc.publicToken,
    sessionId: doc.sessionId,
    planId: doc.planId,
    phone,
    phoneDigits: digitsOnlyPhone(phone),
    profession: doc.customer.profession || '',
    planSnapshot: {
      name: doc.planSnapshot.name,
      type: doc.planSnapshot.type as 'one_time' | 'installment',
      currency: doc.planSnapshot.currency as 'PKR' | 'USD',
      price: doc.planSnapshot.price,
      installmentsCount: doc.planSnapshot.installmentsCount ?? null,
    },
    amounts: {
      basePrice: doc.amounts.basePrice,
      discountAmount: doc.amounts.discountAmount,
      finalPrice: doc.amounts.finalPrice,
      installmentsCount: doc.amounts.installmentsCount,
      totalAmount: doc.amounts.totalAmount,
    },
    coupon: doc.coupon
      ? {
          couponId: doc.coupon.couponId,
          code: doc.coupon.code,
          discountAmount: doc.coupon.discountAmount,
        }
      : null,
    hasProof: Boolean(doc.proof?.fileId),
    proofContentType: doc.proof?.contentType ?? null,
    rejectionReason: doc.rejectionReason || '',
    adminNote: doc.adminNote || '',
    events: (doc.events ?? []).map((e) => ({
      type: e.type,
      at: e.at instanceof Date ? e.at.toISOString() : String(e.at),
      adminId: e.adminId || '',
      note: e.note || '',
    })),
    version: doc.version ?? 1,
    seatsLeft: meta.seatsLeft ?? null,
    verifyHint: `Check that ${base.amountLabel} was received from ${doc.customer.name}`,
    sourceLabel: (() => {
      const source = (doc.utm as { source?: string } | undefined)?.source?.trim();
      const campaign = (doc.utm as { campaign?: string } | undefined)?.campaign?.trim();
      if (source && campaign) return `${source} / ${campaign}`;
      if (source) return source;
      if (campaign) return campaign;
      return 'Direct';
    })(),
    emailStatus: meta.emailStatus ?? 'not_sent',
    emailStatusLabel: meta.emailStatusLabel ?? 'Not sent',
    emailReason: meta.emailReason ?? '',
    workshopMeta: (() => {
      const raw = (doc as { workshopMeta?: {
        city?: string;
        skillLevel?: string;
        learningGoals?: string[];
      } | null }).workshopMeta;
      if (!raw) return null;
      return {
        city: raw.city || '',
        skillLevel: raw.skillLevel || '',
        learningGoals: Array.isArray(raw.learningGoals) ? raw.learningGoals : [],
      };
    })(),
  };
}
