import type { OrderDocument } from '@/models/Order';
import { formatMoneyLabel } from '@/lib/plans/money';
import { digitsOnlyPhone } from '@/lib/orders/tokens';

export type AdminReservationDTO = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  phoneDigits: string;
  planName: string;
  amountLabel: string;
  currency: string;
  finalPrice: number;
  approvedAt: string | null;
  approvedLabel: string;
};

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

/** Latest "approved" event timestamp, if any. */
export function approvedAtFromEvents(
  events: Array<{ type?: string; at?: Date | string }> | null | undefined
): Date | null {
  let latest: Date | null = null;
  for (const e of events ?? []) {
    if (e.type !== 'approved' || !e.at) continue;
    const at = e.at instanceof Date ? e.at : new Date(e.at);
    if (Number.isNaN(at.getTime())) continue;
    if (!latest || at.getTime() > latest.getTime()) latest = at;
  }
  return latest;
}

export function serializeAdminReservation(doc: OrderDocument): AdminReservationDTO {
  const currency = doc.planSnapshot.currency;
  const finalPrice = doc.amounts.finalPrice;
  const approvedAt = approvedAtFromEvents(
    doc.events as Array<{ type?: string; at?: Date | string }>
  );
  const phone = doc.customer.phone || '';

  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber,
    customerName: doc.customer.name,
    customerEmail: doc.customer.email,
    phone,
    phoneDigits: digitsOnlyPhone(phone),
    planName: doc.planSnapshot.name,
    amountLabel: formatMoneyLabel(currency, finalPrice),
    currency,
    finalPrice,
    approvedAt: approvedAt ? approvedAt.toISOString() : null,
    approvedLabel: formatPkt(approvedAt) || formatPkt(doc.updatedAt),
  };
}
