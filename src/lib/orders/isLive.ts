import type { OrderStatus } from '@/models/Order';

/** Keep isLive in sync with status on every transition. */
export function isLiveForStatus(status: OrderStatus): boolean {
  return (
    status === 'awaiting_payment' ||
    status === 'pending_verification' ||
    status === 'approved'
  );
}
