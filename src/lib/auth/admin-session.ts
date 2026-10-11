import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_MAX_AGE_SECONDS } from './constants';

export { ADMIN_COOKIE, SESSION_MAX_AGE_SECONDS };

export type AdminSessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
};

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_SECRET environment variable.');
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    const name = typeof payload.name === 'string' ? payload.name : null;
    const role = typeof payload.role === 'string' ? payload.role : null;
    if (!sub || !email || !name || !role) return null;
    return { sub, email, name, role };
  } catch {
    return null;
  }
}

export function adminCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function applyAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, '', adminCookieOptions(0));
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** Defense-in-depth: use in server components and API routes. */
export async function requireAdmin(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Hosts that may legitimately issue browser Origin for this app. */
function allowedHostsForRequest(request: Request): Set<string> {
  const hosts = new Set<string>();

  const add = (raw: string | null | undefined) => {
    if (!raw) return;
    const host = normalizeHost(raw.split(',')[0] || '');
    if (host) hosts.add(host);
  };

  try {
    add(new URL(request.url).host);
  } catch {
    /* ignore */
  }
  add(request.headers.get('x-forwarded-host'));
  add(request.headers.get('host'));
  add(process.env.SITE_URL);
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_BRANCH_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  return hosts;
}

/**
 * CSRF-ish Origin check for mutating public/admin APIs.
 * Works on localhost, custom domains, and Vercel (incl. preview) via
 * request host, x-forwarded-host, SITE_URL, and Vercel URL env vars.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    // Same-origin navigations / some clients omit Origin.
    return true;
  }
  try {
    const originHost = normalizeHost(new URL(origin).host);
    if (!originHost) return false;
    return allowedHostsForRequest(request).has(originHost);
  } catch {
    return false;
  }
}
