import type { CheckoutPrefill } from './types';

const PREFILL_KEY = 'ahmixen_checkout_prefill';

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
    };
  } catch {
    return null;
  }
}
