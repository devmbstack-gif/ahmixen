import { Lead } from '@/models/Lead';
import { connectToDatabase } from '@/lib/db';
import {
  deleteProof,
  saveProof,
  WORKSHOP_PROOF_MAX_BYTES,
} from '@/lib/orders/gridfs';
import { createWorkshopOrder } from '@/lib/public/createWorkshopOrder';
import { workshopRegistrationFieldsSchema } from '@/lib/public/workshopRegistrationSchema';
import {
  assertPublicOrigin,
  publicError,
  publicOk,
  publicRateLimited,
} from '@/lib/public/response';
import {
  rateLimit,
  rateLimitIdentityKey,
  rateLimitKey,
} from '@/lib/public/rateLimit';
import { PUBLIC_RATE_LIMITS } from '@/lib/public/rateLimitConfig';

export const runtime = 'nodejs';

const EARLY_CONTENT_LENGTH = WORKSHOP_PROOF_MAX_BYTES + 512 * 1024;

function isDupKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}

function parseLearningGoals(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export async function POST(request: Request) {
  let newFileId: string | null = null;
  try {
    if (!assertPublicOrigin(request)) {
      return publicError('forbidden', 'Forbidden', 403);
    }

    const ipRule = PUBLIC_RATE_LIMITS.leadsIp;
    const rlIp = await rateLimit(
      rateLimitKey('public:workshop-register', request),
      ipRule.limit,
      ipRule.windowSeconds
    );
    if (!rlIp.ok) return publicRateLimited(rlIp.retryAfterSeconds);

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > EARLY_CONTENT_LENGTH) {
      return publicError(
        'file_too_large',
        'The image is too large. Use a file under 10 MB',
        400
      );
    }

    const form = await request.formData().catch(() => null);
    if (!form) {
      return publicError('invalid_input', 'Invalid form submission', 400);
    }

    const file = form.get('proof');
    if (!file || !(file instanceof File)) {
      return publicError(
        'missing_file',
        'Upload your payment screenshot',
        400
      );
    }
    if (file.size <= 0) {
      return publicError(
        'missing_file',
        'Upload your payment screenshot',
        400
      );
    }
    if (file.size > WORKSHOP_PROOF_MAX_BYTES) {
      return publicError(
        'file_too_large',
        'The image is too large. Use a file under 10 MB',
        400
      );
    }

    const paidRaw = String(form.get('paidConfirmed') || '').toLowerCase();
    const paidConfirmed =
      paidRaw === 'true' || paidRaw === '1' || paidRaw === 'yes';

    const parsed = workshopRegistrationFieldsSchema.safeParse({
      name: form.get('name'),
      phone: form.get('phone'),
      email: form.get('email'),
      profession: form.get('profession'),
      city: form.get('city'),
      skillLevel: form.get('skillLevel'),
      learningGoals: parseLearningGoals(form.get('learningGoals')),
      paidConfirmed: paidConfirmed ? true : false,
      programId: form.get('programId'),
      programTitle: form.get('programTitle'),
      website: form.get('website') || '',
      referrer: form.get('referrer') || '',
    });

    if (!parsed.success) {
      return publicError(
        'invalid_input',
        parsed.error.issues[0]?.message || 'Invalid input',
        400
      );
    }

    const data = parsed.data;
    if (data.website && data.website.trim()) {
      return publicOk({ ok: true });
    }

    const emailRule = PUBLIC_RATE_LIMITS.leadsEmail;
    const rlEmail = await rateLimit(
      rateLimitIdentityKey('public:workshop-register:email', data.email),
      emailRule.limit,
      emailRule.windowSeconds
    );
    if (!rlEmail.ok) return publicRateLimited(rlEmail.retryAfterSeconds);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length <= 0 || buffer.length > WORKSHOP_PROOF_MAX_BYTES) {
      return publicError(
        'file_too_large',
        'The image is too large. Use a file under 10 MB',
        400
      );
    }

    await connectToDatabase();
    const now = new Date();
    const emailNormalized = data.email;

    const existing = await Lead.findOne({ emailNormalized });
    const previousLeadProofId = existing?.proof?.fileId || '';

    let saved;
    try {
      saved = await saveProof(
        buffer,
        { leadId: existing ? String(existing._id) : emailNormalized },
        { maxBytes: WORKSHOP_PROOF_MAX_BYTES }
      );
      newFileId = saved.fileId;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Could not save payment screenshot';
      return publicError('invalid_file', msg, 400);
    }

    const leadFields = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      profession: data.profession,
      city: data.city,
      skillLevel: data.skillLevel,
      learningGoals: data.learningGoals,
      paidConfirmed: true,
      programId: data.programId,
      programTitle: data.programTitle,
      kind: 'workshop' as const,
      message: `Workshop registration: ${data.programTitle}`,
      referrer: data.referrer || '',
      lastSeenAt: now,
      utm: {
        source: 'workshop_registration',
        medium: 'programs',
        campaign: data.programId,
        content: '',
        term: '',
      },
      proof: {
        fileId: saved.fileId,
        contentType: saved.contentType,
        size: saved.size,
        uploadedAt: now,
      },
    };

    let leadId = existing ? String(existing._id) : '';

    if (existing) {
      Object.assign(existing, leadFields);
      existing.submissionsCount = (existing.submissionsCount || 1) + 1;
      if (existing.status !== 'converted') {
        existing.status = 'new';
      }
      await existing.save();
      if (previousLeadProofId && previousLeadProofId !== saved.fileId) {
        await deleteProof(previousLeadProofId);
      }
      leadId = String(existing._id);
    } else {
      try {
        const created = await Lead.create({
          ...leadFields,
          emailNormalized,
          status: 'new',
          convertedOrderId: '',
          submissionsCount: 1,
          firstSeenAt: now,
        });
        leadId = String(created._id);
      } catch (err) {
        if (!isDupKey(err)) {
          if (newFileId) await deleteProof(newFileId);
          throw err;
        }
        await Lead.updateOne(
          { emailNormalized },
          {
            $set: leadFields,
            $inc: { submissionsCount: 1 },
          }
        );
        const again = await Lead.findOne({ emailNormalized }).select({ _id: 1 });
        leadId = again ? String(again._id) : '';
      }
    }

    const orderResult = await createWorkshopOrder({
      ...data,
      leadId,
      proof: {
        fileId: saved.fileId,
        contentType: saved.contentType,
        size: saved.size,
        uploadedAt: now,
      },
    });

    if (!orderResult.ok) {
      // Keep lead for CRM; proof stays on lead. Order was not created.
      return publicError(orderResult.code, orderResult.message, orderResult.status);
    }

    if (leadId) {
      await Lead.updateOne(
        { _id: leadId },
        {
          $set: {
            status: 'converted',
            convertedOrderId: orderResult.orderId,
            lastSeenAt: now,
          },
        }
      );
    }

    newFileId = null; // owned by order + lead now
    return publicOk({
      ok: true,
      orderNumber: orderResult.orderNumber,
      message:
        'Registration submitted. We will confirm your seat after verifying payment.',
    });
  } catch (err) {
    if (newFileId) await deleteProof(newFileId).catch(() => undefined);
    console.error(
      '[public workshop-register]',
      err instanceof Error ? err.name : 'error'
    );
    return publicError('server_error', 'Something went wrong', 500);
  }
}
