import { Lead } from '@/models/Lead';
import { connectToDatabase } from '@/lib/db';
import { normalizeEmail } from '@/lib/orders/tokens';

function isDupKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}

export type LeadUtmInput = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

export type LeadProofInput = {
  fileId: string;
  contentType: string;
  size: number;
  uploadedAt: Date | null;
};

export type UpsertLeadFromSubmissionInput = {
  name: string;
  email: string;
  phone: string;
  profession?: string;
  city?: string;
  skillLevel?: string;
  learningGoals?: string[];
  message?: string;
  kind?: 'general' | 'workshop';
  programId?: string;
  programTitle?: string;
  paidConfirmed?: boolean;
  utm?: LeadUtmInput;
  referrer?: string;
  orderId?: string;
  /** Mark lead converted (approved seat / paid workshop registration). */
  markConverted?: boolean;
  proof?: LeadProofInput | null;
};

function normalizeSkillLevel(
  raw: string | undefined
): '' | 'beginner' | 'intermediate' | 'advanced' {
  const v = (raw || '').trim();
  if (v === 'beginner' || v === 'intermediate' || v === 'advanced') return v;
  return '';
}

/**
 * Idempotent lead create/update by email. Used for every public form submit
 * so Admin → Leads always has a row.
 */
export async function upsertLeadFromSubmission(
  input: UpsertLeadFromSubmissionInput
): Promise<{ leadId: string }> {
  await connectToDatabase();
  const emailNormalized = normalizeEmail(input.email);
  const now = new Date();

  const fields: Record<string, unknown> = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    profession: (input.profession || '').trim(),
    lastSeenAt: now,
  };

  if (input.city !== undefined) {
    fields.city = input.city.trim().slice(0, 80);
  }
  if (input.skillLevel !== undefined) {
    fields.skillLevel = normalizeSkillLevel(input.skillLevel);
  }
  if (input.learningGoals !== undefined) {
    fields.learningGoals = input.learningGoals.map(String).slice(0, 8);
  }
  if (input.message !== undefined) {
    fields.message = input.message.trim().slice(0, 500);
  }
  if (input.kind) fields.kind = input.kind;
  if (input.programId !== undefined) {
    fields.programId = input.programId.trim().slice(0, 80);
  }
  if (input.programTitle !== undefined) {
    fields.programTitle = input.programTitle.trim().slice(0, 120);
  }
  if (input.paidConfirmed !== undefined) {
    fields.paidConfirmed = Boolean(input.paidConfirmed);
  }
  if (input.referrer !== undefined) {
    fields.referrer = input.referrer.trim().slice(0, 500);
  }
  if (input.utm) {
    fields.utm = {
      source: (input.utm.source || '').trim().slice(0, 100),
      medium: (input.utm.medium || '').trim().slice(0, 100),
      campaign: (input.utm.campaign || '').trim().slice(0, 100),
      content: (input.utm.content || '').trim().slice(0, 100),
      term: (input.utm.term || '').trim().slice(0, 100),
    };
  }
  if (input.proof) {
    fields.proof = {
      fileId: input.proof.fileId,
      contentType: input.proof.contentType,
      size: input.proof.size,
      uploadedAt: input.proof.uploadedAt,
    };
  }

  const existing = await Lead.findOne({ emailNormalized });
  if (existing) {
    Object.assign(existing, fields);
    existing.submissionsCount = (existing.submissionsCount || 1) + 1;
    if (input.markConverted) {
      existing.status = 'converted';
      if (input.orderId) existing.convertedOrderId = input.orderId;
    }
    await existing.save();
    return { leadId: String(existing._id) };
  }

  try {
    const created = await Lead.create({
      ...fields,
      emailNormalized,
      status: input.markConverted ? 'converted' : 'new',
      convertedOrderId:
        input.markConverted && input.orderId ? input.orderId : '',
      submissionsCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
      kind: input.kind || 'general',
      message: (input.message || '').trim().slice(0, 500),
      city: (input.city || '').trim().slice(0, 80),
      skillLevel: normalizeSkillLevel(input.skillLevel),
      learningGoals: Array.isArray(input.learningGoals)
        ? input.learningGoals.map(String).slice(0, 8)
        : [],
      paidConfirmed: Boolean(input.paidConfirmed),
      programId: (input.programId || '').trim().slice(0, 80),
      programTitle: (input.programTitle || '').trim().slice(0, 120),
      utm: {
        source: (input.utm?.source || '').trim().slice(0, 100),
        medium: (input.utm?.medium || '').trim().slice(0, 100),
        campaign: (input.utm?.campaign || '').trim().slice(0, 100),
        content: (input.utm?.content || '').trim().slice(0, 100),
        term: (input.utm?.term || '').trim().slice(0, 100),
      },
      referrer: (input.referrer || '').trim().slice(0, 500),
      proof: input.proof
        ? {
            fileId: input.proof.fileId,
            contentType: input.proof.contentType,
            size: input.proof.size,
            uploadedAt: input.proof.uploadedAt,
          }
        : {},
    });
    return { leadId: String(created._id) };
  } catch (err) {
    if (!isDupKey(err)) throw err;
    const again = await Lead.findOne({ emailNormalized });
    if (!again) throw err;
    Object.assign(again, fields);
    again.submissionsCount = (again.submissionsCount || 1) + 1;
    if (input.markConverted) {
      again.status = 'converted';
      if (input.orderId) again.convertedOrderId = input.orderId;
    }
    await again.save();
    return { leadId: String(again._id) };
  }
}

/** Mark an existing lead converted for an approved order (no-op if missing). */
export async function markLeadConvertedForOrder(input: {
  email: string;
  orderId: string;
  name?: string;
  phone?: string;
  profession?: string;
}): Promise<void> {
  await upsertLeadFromSubmission({
    name: input.name || 'Customer',
    email: input.email,
    phone: input.phone || '',
    profession: input.profession,
    orderId: input.orderId,
    markConverted: true,
    paidConfirmed: true,
  });
}
