import { NextResponse } from 'next/server';
import { SiteContent } from '@/models/SiteContent';
import { logAudit } from '@/lib/sessions/audit';
import {
  conflict,
  notFound,
  serverError,
  withAdminMutating,
  badRequest,
} from '@/lib/sessions/api-helpers';
import { CONTENT_REGISTRY, isContentKey } from '@/lib/content/registry';
import { revalidateContentKey } from '@/lib/content/cache';
import { z } from 'zod';

type Ctx = { params: Promise<{ key: string }> };

const resetBodySchema = z.object({
  version: z.number().int().positive(),
});

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { key } = await ctx.params;
    if (!isContentKey(key)) return notFound();

    const entry = CONTENT_REGISTRY[key];
    const body = await request.json().catch(() => null);
    const parsed = resetBodySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    let doc = await SiteContent.findOne({ key });
    if (!doc) {
      doc = new SiteContent({
        key,
        data: entry.staticDefault,
        version: 1,
      });
    }

    if (parsed.data.version !== (doc.version ?? 1)) {
      return conflict('This was changed elsewhere, reload');
    }

    doc.data = structuredClone(entry.staticDefault);
    doc.version = (doc.version ?? 1) + 1;
    doc.updatedBy = gate.admin.sub;
    doc.updatedByName = gate.admin.name;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'content.reset',
      entity: 'siteContent',
      entityId: key,
      meta: { key },
    });

    revalidateContentKey(key);

    return NextResponse.json({
      key,
      label: entry.label,
      description: entry.description,
      version: doc.version,
      data: doc.data,
      updatedAt: doc.updatedAt?.toISOString?.() ?? null,
      updatedByName: doc.updatedByName || '',
    });
  } catch (err) {
    console.error('[admin content reset]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
