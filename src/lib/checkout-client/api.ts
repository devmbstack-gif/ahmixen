import type { ApiError } from './types';

export const RATE_LIMIT_MESSAGE =
  'Too many attempts. Please try again in a few minutes.';
export const NETWORK_MESSAGE =
  'Something went wrong. Please check your connection and try again.';

export class CheckoutApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'CheckoutApiError';
    this.code = code;
    this.status = status;
  }
}

type OkBody<T> = { ok: true; data: T };
type ErrBody = { ok: false; error: ApiError };

export async function checkoutFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      cache: 'no-store',
      headers: {
        ...(init?.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new CheckoutApiError('network', NETWORK_MESSAGE, 0);
  }

  let json: OkBody<T> | ErrBody | null = null;
  try {
    json = (await res.json()) as OkBody<T> | ErrBody;
  } catch {
    json = null;
  }

  if (res.status === 429) {
    throw new CheckoutApiError('rate_limited', RATE_LIMIT_MESSAGE, 429);
  }

  if (!json || typeof json !== 'object') {
    throw new CheckoutApiError(
      'server_error',
      'Something went wrong',
      res.status
    );
  }

  if ('ok' in json && json.ok === true) {
    return json.data;
  }

  const err = (json as ErrBody).error;
  throw new CheckoutApiError(
    err?.code || 'error',
    err?.message || 'Something went wrong',
    res.status
  );
}

export async function fetchCheckoutConfig() {
  return checkoutFetch<import('./types').PublicCheckoutConfig>(
    '/api/public/checkout'
  );
}
