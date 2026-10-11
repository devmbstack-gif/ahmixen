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
