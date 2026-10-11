import { NextResponse } from 'next/server';
import { requireAdmin, isAllowedOrigin } from '@/lib/auth/admin-session';
import { connectToDatabase } from '@/lib/db';

export async function withAdminMutating(request: Request) {
  if (!isAllowedOrigin(request)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      admin: null as null,
    };
  }
  try {
    const admin = await requireAdmin();
    await connectToDatabase();
    return { error: null, admin };
  } catch {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      admin: null as null,
    };
  }
}

export async function withAdminRead() {
  try {
    const admin = await requireAdmin();
    await connectToDatabase();
    return { error: null, admin };
  } catch {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      admin: null as null,
    };
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError() {
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}
