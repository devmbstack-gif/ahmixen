import type { SettingDocument } from '@/models/Setting';

export type PaymentSettingsDTO = {
  key: 'payment';
  bankTransferEnabled: boolean;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  paymentInstructions: string;
  cardPaymentEnabled: boolean;
  version: number;
  updatedAt: string | null;
};

export function defaultPaymentSettings(): PaymentSettingsDTO {
  return {
    key: 'payment',
    bankTransferEnabled: false,
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    paymentInstructions: '',
    cardPaymentEnabled: false,
    version: 1,
    updatedAt: null,
  };
}

export function serializePaymentSettings(
  doc: SettingDocument | null
): PaymentSettingsDTO {
  if (!doc) return defaultPaymentSettings();
  return {
    key: 'payment',
    bankTransferEnabled: Boolean(doc.bankTransferEnabled),
    bankName: doc.bankName ?? '',
    accountTitle: doc.accountTitle ?? '',
    accountNumber: doc.accountNumber ?? '',
    iban: doc.iban ?? '',
    paymentInstructions: doc.paymentInstructions ?? '',
    cardPaymentEnabled: Boolean(doc.cardPaymentEnabled),
    version: doc.version ?? 1,
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : null,
  };
}
