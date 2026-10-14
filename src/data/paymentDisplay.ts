/**
 * Public payment display on the pay page.
 * Bank transfer fields stay in admin/settings for future use —
 * only JazzCash / Easypaisa is shown to customers for now.
 */
export const SHOW_BANK_TRANSFER_DETAILS = false;

export const WALLET_PAYMENT = {
  label: 'JazzCash / Easypaisa',
  number: '03214359182',
  accountName: 'Hafiz Ahmad Ali',
  instructions:
    'Send the exact amount via JazzCash or Easypaisa, then upload your payment screenshot below.',
} as const;
