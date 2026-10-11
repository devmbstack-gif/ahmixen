import { NextResponse } from 'next/server';
import { Setting } from '@/models/Setting';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  conflict,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { paymentSettingsSchema } from '@/lib/settings/schema';
import {
  defaultPaymentSettings,
  serializePaymentSettings,
} from '@/lib/settings/serialize';

const KEY = 'payment';

export async function GET() {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const doc = await Setting.findOne({ key: KEY });
    return NextResponse.json({
      settings: serializePaymentSettings(doc),
    });
  } catch (err) {
    console.error('[settings payment GET]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function PUT(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const body = await request.json().catch(() => null);
    const parsed = paymentSettingsSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Invalid input';
      return badRequest(msg);
    }

    const data = parsed.data;
    let doc = await Setting.findOne({ key: KEY });
    if (!doc) {
      const defaults = defaultPaymentSettings();
      doc = new Setting({
        key: KEY,
        bankTransferEnabled: defaults.bankTransferEnabled,
        bankName: defaults.bankName,
        accountTitle: defaults.accountTitle,
        accountNumber: defaults.accountNumber,
        iban: defaults.iban,
        paymentInstructions: defaults.paymentInstructions,
        cardPaymentEnabled: false,
        version: 1,
      });
    }

    if (data.version !== (doc.version ?? 1)) {
      return conflict('These settings were changed elsewhere, reload');
    }

    const iban = (data.iban || '').replace(/\s+/g, '').toUpperCase();

    doc.bankTransferEnabled = data.bankTransferEnabled;
    doc.bankName = data.bankName?.trim() ?? '';
    doc.accountTitle = data.accountTitle?.trim() ?? '';
    doc.accountNumber = data.accountNumber?.trim() ?? '';
    doc.iban = iban;
    doc.paymentInstructions = data.paymentInstructions?.trim() ?? '';
    // Card stays off — never accept enabling from API for now
    doc.cardPaymentEnabled = false;
    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'settings.payment.update',
      entity: 'settings',
      entityId: KEY,
      meta: { bankTransferEnabled: doc.bankTransferEnabled },
    });

    return NextResponse.json({ settings: serializePaymentSettings(doc) });
  } catch (err) {
    console.error('[settings payment PUT]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
