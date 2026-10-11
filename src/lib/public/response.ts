import { NextResponse } from 'next/server';
import { isAllowedOrigin } from '@/lib/auth/admin-session';

const NO_STORE = { 'Cache-Control': 'no-store' };

export function publicOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(
    { ok: true as const, data },
    { status: init?.status ?? 200, headers: NO_STORE }
  );
}

export function publicError(
  code: string,
  message: string,
  status: number,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { ok: false as const, error: { code, message } },
    {
      status,
      headers: { ...NO_STORE, ...(extraHeaders || {}) },
    }
  );
}

export function publicRateLimited(retryAfterSeconds: number) {
  return publicError(
    'rate_limited',
    'Too many requests. Please try again in a few minutes.',
    429,
    { 'Retry-After': String(retryAfterSeconds) }
  );
}

export function assertPublicOrigin(request: Request): boolean {
  return isAllowedOrigin(request);
}
