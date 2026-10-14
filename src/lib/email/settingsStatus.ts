import {
  fromAddressMismatch,
  getEmailAllowlist,
  getEmailFrom,
  getEmailMode,
  getSmtpConfig,
  isSmtpConfigured,
  maskEmail,
  parseEmailAddress,
} from './config';

export type EmailSettingsPublicStatus = {
  mode: 'log' | 'smtp';
  configured: boolean;
  smtpUserMasked: string;
  allowlistActive: boolean;
  fromMismatch: boolean;
  fromMismatchWarning: string;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string;
};

export function buildEmailSettingsStatus(meta?: {
  lastTestAt?: Date | string | null;
  lastTestOk?: boolean | null;
  lastTestMessage?: string;
}): EmailSettingsPublicStatus {
  const mode = getEmailMode();
  const { user } = getSmtpConfig();
  const configured = mode === 'log' ? true : isSmtpConfigured();
  const allowlist = getEmailAllowlist();
  const mismatch = fromAddressMismatch();

  return {
    mode,
    configured,
    smtpUserMasked: user ? maskEmail(user) : '',
    allowlistActive: allowlist.length > 0,
    fromMismatch: mismatch,
    fromMismatchWarning: mismatch
      ? 'The From address differs from the login mailbox. Some email providers replace it.'
      : '',
    lastTestAt: meta?.lastTestAt
      ? new Date(meta.lastTestAt).toISOString()
      : null,
    lastTestOk:
      typeof meta?.lastTestOk === 'boolean' ? meta.lastTestOk : null,
    lastTestMessage: meta?.lastTestMessage || '',
  };
}

export function publicFromHint(): string {
  return parseEmailAddress(getEmailFrom()) || '';
}
