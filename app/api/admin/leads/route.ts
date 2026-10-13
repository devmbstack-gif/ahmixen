import { NextResponse } from 'next/server';
import { Lead } from '@/models/Lead';
import { serverError, withAdminRead } from '@/lib/sessions/api-helpers';
import { serializeAdminLead } from '@/lib/leads/serialize';
import { escapeRegex, sanitizeAdminSearch } from '@/lib/admin/search';

const PAGE_SIZE = 25;

function buildLeadFilter(opts: {
  status: string;
  source: string;
  q: string;
}): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  if (opts.status === 'new' || opts.status === 'contacted' || opts.status === 'converted') {
    filter.status = opts.status;
  }

  if (opts.source === 'direct') {
    and.push({
      $or: [
        { 'utm.source': { $exists: false } },
        { 'utm.source': '' },
        { 'utm.source': null },
      ],
    });
  } else if (opts.source) {
    filter['utm.source'] = opts.source;
  }

  if (opts.q) {
    const re = new RegExp(escapeRegex(opts.q), 'i');
    and.push({
      $or: [
        { name: re },
        { email: re },
        { emailNormalized: re },
        { phone: re },
      ],
    });
  }

  if (and.length === 1) {
    Object.assign(filter, and[0]);
  } else if (and.length > 1) {
    filter.$and = and;
  }

  return filter;
}

export async function GET(request: Request) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'new').trim();
    const source = (searchParams.get('source') || '').trim();
    const q = sanitizeAdminSearch(searchParams.get('q'));
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);

    const filter = buildLeadFilter({ status, source, q });

    const [total, docs, countsAgg, sources] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .sort({ firstSeenAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      Lead.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.distinct('utm.source'),
    ]);

    const countMap = new Map(countsAgg.map((c) => [c._id, c.count]));
    const counts = {
      new: countMap.get('new') ?? 0,
      contacted: countMap.get('contacted') ?? 0,
      converted: countMap.get('converted') ?? 0,
      all: Array.from(countMap.values()).reduce((a, b) => a + b, 0),
    };

    const utmSources = (sources as string[])
      .map((s) => (s || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const leads = docs.map((d) =>
      serializeAdminLead(d as unknown as Parameters<typeof serializeAdminLead>[0])
    );

    return NextResponse.json({
      leads,
      page,
      limit: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      counts,
      sources: utmSources,
    });
  } catch (err) {
    console.error('[leads list]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
