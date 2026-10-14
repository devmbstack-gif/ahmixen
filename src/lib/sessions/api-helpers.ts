import { NextResponse } from 'next/server';
import { requireAdmin, isAllowedOrigin } from '@/lib/auth/admin-session';
import { connectToDatabase } from '@/lib/db';

async function requireAdminWithDb() {
  // Auth and DB are separate — never mask a DB failure as Unauthorized.
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      admin: null as null,
    };
  }

  try {
    await connectToDatabase();
  } catch (err) {
    console.error(
      '[admin api] database',
      err instanceof Error ? err.message : 'connect failed'
    );
    return {
      error: NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      ),
      admin: null as null,
    };
  }

  return { error: null, admin };
}

export async function withAdminMutating(request: Request) {
  if (!isAllowedOrigin(request)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      admin: null as null,
    };
  }
  return requireAdminWithDb();
}

export async function withAdminRead() {
  return requireAdminWithDb();
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
