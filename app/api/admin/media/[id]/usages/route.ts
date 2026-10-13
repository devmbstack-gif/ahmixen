import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import {
  notFound,
  serverError,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { MediaAsset } from '@/models/MediaAsset';
import { findMediaUsages } from '@/lib/media/usages';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const exists = await MediaAsset.exists({ _id: id });
    if (!exists) return notFound();
    const usages = await findMediaUsages(id);
    return NextResponse.json({ usages, count: usages.length });
  } catch (err) {
    console.error('[admin media usages]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
