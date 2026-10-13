import type { LeadDocument } from '@/models/Lead';
import { digitsOnlyPhone } from '@/lib/orders/tokens';

export type LeadStatus = 'new' | 'contacted' | 'converted';

export type AdminLeadListDTO = {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneDigits: string;
  profession: string;
  message: string;
  status: LeadStatus;
  statusLabel: string;
  sourceLabel: string;
  utmSource: string;
  utmCampaign: string;
  utmMedium: string;
  utmContent: string;
  utmTerm: string;
  referrer: string;
  submissionsCount: number;
  firstSeenAt: string | null;
  firstSeenLabel: string;
  lastSeenAt: string | null;
  lastSeenLabel: string;
  showLastSeen: boolean;
  convertedOrderId: string;
  adminNote: string;
  version: number;
};

function statusLabel(status: string): string {
  if (status === 'contacted') return 'Contacted';
  if (status === 'converted') return 'Converted';
  return 'New';
}

function formatPkt(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function formatPktDate(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function serializeAdminLead(doc: LeadDocument): AdminLeadListDTO {
  const utm = doc.utm || { source: '', medium: '', campaign: '', content: '', term: '' };
  const source = (utm.source || '').trim();
  const campaign = (utm.campaign || '').trim();
  const first = doc.firstSeenAt instanceof Date ? doc.firstSeenAt : null;
  const last = doc.lastSeenAt instanceof Date ? doc.lastSeenAt : null;
  const showLastSeen =
    Boolean(first && last) && first!.getTime() !== last!.getTime();

  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    phoneDigits: digitsOnlyPhone(doc.phone || ''),
    profession: doc.profession || '',
    message: doc.message || '',
    status: (doc.status || 'new') as LeadStatus,
    statusLabel: statusLabel(doc.status || 'new'),
    sourceLabel: source || 'Direct',
    utmSource: source,
    utmCampaign: campaign,
    utmMedium: (utm.medium || '').trim(),
    utmContent: (utm.content || '').trim(),
    utmTerm: (utm.term || '').trim(),
    referrer: doc.referrer || '',
    submissionsCount: doc.submissionsCount ?? 1,
    firstSeenAt: first ? first.toISOString() : null,
    firstSeenLabel: formatPktDate(first) || formatPkt(first),
    lastSeenAt: last ? last.toISOString() : null,
    lastSeenLabel: formatPkt(last),
    showLastSeen,
    convertedOrderId: doc.convertedOrderId || '',
    adminNote: doc.adminNote || '',
    version: doc.version ?? 1,
  };
}
