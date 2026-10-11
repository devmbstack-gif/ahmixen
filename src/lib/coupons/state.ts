export type CouponStoredStatus = 'active' | 'paused' | 'archived';

export type CouponComputedState =
  | 'paused'
  | 'archived'
  | 'scheduled'
  | 'expired'
  | 'used up'
  | 'active';

export function computeCouponState(input: {
  status: CouponStoredStatus;
  startsAt: Date | null | undefined;
  endsAt: Date | null | undefined;
  usageLimit: number | null | undefined;
  usedCount: number;
  now?: Date;
}): CouponComputedState {
  const now = input.now ?? new Date();
  if (input.status === 'archived') return 'archived';
  if (input.status === 'paused') return 'paused';

  if (
    input.startsAt instanceof Date &&
    !Number.isNaN(input.startsAt.getTime()) &&
    input.startsAt.getTime() > now.getTime()
  ) {
    return 'scheduled';
  }

  if (
    input.endsAt instanceof Date &&
    !Number.isNaN(input.endsAt.getTime()) &&
    input.endsAt.getTime() < now.getTime()
  ) {
    return 'expired';
  }

  if (
    input.usageLimit != null &&
    Number.isInteger(input.usageLimit) &&
    input.usageLimit >= 1 &&
    input.usedCount >= input.usageLimit
  ) {
    return 'used up';
  }

  return 'active';
}
