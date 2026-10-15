import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ADMIN_COOKIE } from '@/lib/auth/constants';

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

const PUBLIC_ADMIN_PAGES = new Set([
  '/admin/login',
  '/admin/forgot-password',
  '/admin/verify-otp',
  '/admin/reset-password',
]);

const PUBLIC_ADMIN_APIS = new Set([
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
  '/api/admin/auth/warm',
  '/api/admin/auth/forgot-password',
  '/api/admin/auth/verify-otp',
  '/api/admin/auth/reset-password',
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminApi = pathname.startsWith('/api/admin');
  const isAdminPage = pathname.startsWith('/admin');
  const isPublicAuthApi = PUBLIC_ADMIN_APIS.has(pathname);
  const isPublicAuthPage = PUBLIC_ADMIN_PAGES.has(pathname);

  if (isPublicAuthApi) {
    return NextResponse.next();
  }

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const authed = await hasValidAdminSession(request);

  if (isPublicAuthPage) {
    if (authed && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
