import { Lead } from '@/models/Lead';
import {
  badRequest,
  serverError,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { escapeRegex, sanitizeAdminSearch } from '@/lib/admin/search';
import { buildCsv, csvResponse } from '@/lib/admin/csv';
import { logAudit } from '@/lib/sessions/audit';
import {
  rateLimit,
  rateLimitIdentityKey,
} from '@/lib/public/rateLimit';
import { toLocalDateString } from '@/lib/dates/pkt';

const EXPORT_CAP = 5000;

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
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const rl = await rateLimit(
      rateLimitIdentityKey('admin-leads-export', gate.admin.sub),
      10,
      3600
    );
    if (!rl.ok) {
      return badRequest(
        `Export limit reached. Try again in about ${rl.retryAfterSeconds} seconds.`
      );
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all').trim();
    const source = (searchParams.get('source') || '').trim();
    const q = sanitizeAdminSearch(searchParams.get('q'));

    const filter = buildLeadFilter({ status, source, q });

    const docs = await Lead.find(filter)
      .sort({ firstSeenAt: -1 })
      .limit(EXPORT_CAP)
      .lean();

    const rows: Array<Array<string | number>> = [
      [
        'Name',
        'Email',
        'Phone',
        'Profession',
        'Status',
        'Source',
        'Campaign',
        'Message',
        'Submissions',
        'First seen',
        'Last seen',
      ],
    ];

    for (const d of docs) {
      const utm = d.utm || {};
      rows.push([
        d.name || '',
        d.email || '',
        d.phone || '',
        d.profession || '',
        d.status || '',
        (utm.source || '').trim() || 'Direct',
        (utm.campaign || '').trim(),
        d.message || '',
        d.submissionsCount ?? 1,
        d.firstSeenAt instanceof Date ? d.firstSeenAt.toISOString() : '',
        d.lastSeenAt instanceof Date ? d.lastSeenAt.toISOString() : '',
      ]);
    }

    const fileName = `leads-${toLocalDateString(new Date()) || 'export'}.csv`;
    const body = buildCsv(rows);

    await logAudit({
      adminId: gate.admin.sub,
      action: 'lead.export',
      entity: 'lead',
      entityId: 'export',
      meta: { rowCount: docs.length },
    });

    return csvResponse(body, fileName);
  } catch (err) {
    console.error('[leads export]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
