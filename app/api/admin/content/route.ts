import { NextResponse } from 'next/server';
import { SiteContent } from '@/models/SiteContent';
import {
  serverError,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import {
  CONTENT_REGISTRY,
  LANDING_CONTENT_KEYS,
} from '@/lib/content/registry';

export async function GET() {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const docs = await SiteContent.find({
      key: { $in: LANDING_CONTENT_KEYS },
    })
      .select({ key: 1, version: 1, updatedAt: 1, updatedByName: 1 })
      .lean();

    const byKey = new Map(docs.map((d) => [d.key, d]));

    const items = LANDING_CONTENT_KEYS.map((key) => {
      const entry = CONTENT_REGISTRY[key];
      const doc = byKey.get(key);
      return {
        key,
        label: entry.label,
        description: entry.description,
        group: entry.group,
        publicPath: entry.publicPath || null,
        publicAnchor: entry.publicAnchor || null,
        version: doc?.version ?? null,
        updatedAt: doc?.updatedAt
          ? new Date(doc.updatedAt).toISOString()
          : null,
        updatedByName: doc?.updatedByName || '',
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[admin content list]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
