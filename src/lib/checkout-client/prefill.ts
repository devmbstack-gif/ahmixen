import type { CheckoutPrefill } from './types';

const PREFILL_KEY = 'ahmixen_checkout_prefill';
const POPUP_DONE_KEY = 'ahmixen_popupDone';

export function setPopupDone() {
  try {
    localStorage.setItem(POPUP_DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isPopupDone(): boolean {
  try {
    return localStorage.getItem(POPUP_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveCheckoutPrefill(data: CheckoutPrefill) {
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function readCheckoutPrefill(): CheckoutPrefill | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutPrefill;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      name: String(parsed.name || ''),
      email: String(parsed.email || ''),
      phone: String(parsed.phone || ''),
      profession: String(parsed.profession || ''),
      couponCode: String(parsed.couponCode || ''),
    };
  } catch {
    return null;
  }
}

/** Clear only the stored coupon code (keeps name/email/phone). */
export function clearCheckoutCouponCode() {
  try {
    const current = readCheckoutPrefill();
    if (!current) return;
    saveCheckoutPrefill({ ...current, couponCode: '' });
  } catch {
    /* ignore */
  }
}

const COUPON_CHECK_CACHE_KEY = 'ahmixen_coupon_check_cache';
const COUPON_CHECK_TTL_MS = 10 * 60 * 1000;

export type CouponCheckCache = {
  code: string;
  planId: string;
  currency: string;
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  savedAt: number;
};

export function readCouponCheckCache(
  code: string,
  planId: string
): CouponCheckCache | null {
  try {
    const raw = sessionStorage.getItem(COUPON_CHECK_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CouponCheckCache;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.code !== code || parsed.planId !== planId) return null;
    if (Date.now() - Number(parsed.savedAt) > COUPON_CHECK_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCouponCheckCache(
  data: Omit<CouponCheckCache, 'savedAt'>
) {
  try {
    const payload: CouponCheckCache = { ...data, savedAt: Date.now() };
    sessionStorage.setItem(COUPON_CHECK_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearCouponCheckCache() {
  try {
    sessionStorage.removeItem(COUPON_CHECK_CACHE_KEY);
  } catch {
    /* ignore */
  }
}
