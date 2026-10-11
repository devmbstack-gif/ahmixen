import { z } from 'zod';

export const paymentSettingsSchema = z
  .object({
    bankTransferEnabled: z.boolean(),
    bankName: z.string().trim().max(120).optional().default(''),
    accountTitle: z.string().trim().max(160).optional().default(''),
    accountNumber: z.string().trim().max(40).optional().default(''),
    iban: z.string().trim().max(40).optional().default(''),
    paymentInstructions: z.string().trim().max(500).optional().default(''),
    cardPaymentEnabled: z.boolean().optional().default(false),
    version: z.number().int().min(1),
  })
  .superRefine((data, ctx) => {
    const ibanRaw = (data.iban || '').replace(/\s+/g, '').toUpperCase();
    const accountRaw = (data.accountNumber || '').trim();

    if (ibanRaw) {
      if (!/^[A-Z0-9]{15,34}$/.test(ibanRaw)) {
        ctx.addIssue({
          code: 'custom',
          path: ['iban'],
          message: 'IBAN must be 15–34 letters and digits (no spaces)',
        });
      }
    }

    if (accountRaw) {
      if (!/^[0-9-]{6,30}$/.test(accountRaw)) {
        ctx.addIssue({
          code: 'custom',
          path: ['accountNumber'],
          message: 'Account number must be 6–30 digits or dashes',
        });
      }
    }

    if (data.bankTransferEnabled) {
      if (!data.bankName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['bankName'],
          message: 'Enter the bank name',
        });
      }
      if (!data.accountTitle?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['accountTitle'],
          message: 'Enter the account title',
        });
      }
      if (!accountRaw && !ibanRaw) {
        ctx.addIssue({
          code: 'custom',
          path: ['accountNumber'],
          message: 'Enter an account number or IBAN',
        });
      }
    }
  });

export type PaymentSettingsInput = z.infer<typeof paymentSettingsSchema>;
