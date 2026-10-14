import type { PlanDocument } from '@/models/Plan';
import { installmentTotal, savingsPercent } from './money';
import {
  landingPlanSiteIssue,
  landingSiteIssueMessage,
  type LandingSiteIssue,
} from './landing';

export type PlanStatus = 'active' | 'hidden' | 'archived';
export type PlanType = 'one_time' | 'installment';
export type PlanCurrency = 'PKR' | 'USD';

export type AdminPlanDTO = {
  id: string;
  name: string;
  shortDescription: string;
  type: PlanType;
  currency: PlanCurrency;
  price: number;
  originalPrice: number | null;
  installmentsCount: number | null;
  features: string[];
  sessionId: string;
  sessionTitle: string | null;
  validUntil: string | null;
  validUntilLocal: string;
  status: PlanStatus;
  displayStatus: 'active' | 'hidden' | 'expired' | 'archived';
  isLandingPlan: boolean;
  /** When isLandingPlan: null = showing on site; else why not. */
  landingSiteIssue: LandingSiteIssue;
  landingSiteIssueMessage: string;
  sortOrder: number;
  version: number;
  savingsPercent: number | null;
  installmentTotal: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function toLocalDate(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function serializeAdminPlan(
  doc: PlanDocument,
  sessionTitle: string | null = null,
  now = new Date(),
  activeLandingSessionId: string | null = null
): AdminPlanDTO {
  const validUntil =
    doc.validUntil instanceof Date
      ? doc.validUntil
      : doc.validUntil
        ? new Date(doc.validUntil)
        : null;
  const status = doc.status as PlanStatus;
  let displayStatus: AdminPlanDTO['displayStatus'] = status;
  if (
    status === 'active' &&
    validUntil &&
    !Number.isNaN(validUntil.getTime()) &&
    validUntil.getTime() < now.getTime()
  ) {
    displayStatus = 'expired';
  }

  const price = doc.price;
  const original =
    doc.originalPrice == null || doc.originalPrice === undefined
      ? null
      : Number(doc.originalPrice);
  const installments =
    doc.installmentsCount == null || doc.installmentsCount === undefined
      ? null
      : Number(doc.installmentsCount);

  const isLandingPlan = Boolean(doc.isLandingPlan);
  const issue = landingPlanSiteIssue(
    {
      status,
      type: doc.type,
      validUntil,
      sessionId: doc.sessionId ?? '',
      isLandingPlan,
    },
    activeLandingSessionId,
    now
  );

  return {
    id: String(doc._id),
    name: doc.name,
    shortDescription: doc.shortDescription ?? '',
    type: doc.type as PlanType,
    currency: doc.currency as PlanCurrency,
    price,
    originalPrice: original,
    installmentsCount: installments,
    features: Array.isArray(doc.features) ? doc.features.map(String) : [],
    sessionId: doc.sessionId ?? '',
    sessionTitle,
    validUntil: validUntil ? validUntil.toISOString() : null,
    validUntilLocal: toLocalDate(validUntil),
    status,
    displayStatus,
    isLandingPlan,
    landingSiteIssue: issue,
    landingSiteIssueMessage: landingSiteIssueMessage(issue),
    sortOrder: doc.sortOrder ?? 0,
    version: doc.version ?? 1,
    savingsPercent: savingsPercent(price, original),
    installmentTotal:
      doc.type === 'installment' ? installmentTotal(price, installments) : null,
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : null,
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : null,
  };
}
