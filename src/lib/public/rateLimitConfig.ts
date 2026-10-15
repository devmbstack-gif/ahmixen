/**
 * All public API rate limits in one place.
 * Each value is overridable via env (see keys below). Defaults suit shared campus IPs.
 */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.trunc(n);
}

export type RateLimitRule = {
  limit: number;
  windowSeconds: number;
};

/** Per-IP (and shared) limits */
export const PUBLIC_RATE_LIMITS = {
  /** GET /api/public/checkout — RATE_LIMIT_CHECKOUT_IP / _WINDOW */
  checkout: {
    limit: intEnv('RATE_LIMIT_CHECKOUT_IP', 120),
    windowSeconds: intEnv('RATE_LIMIT_CHECKOUT_WINDOW', 600),
  },
  /** POST /api/public/leads */
  leadsIp: {
    limit: intEnv('RATE_LIMIT_LEADS_IP', 30),
    windowSeconds: intEnv('RATE_LIMIT_LEADS_IP_WINDOW', 600),
  },
  leadsEmail: {
    limit: intEnv('RATE_LIMIT_LEADS_EMAIL', 5),
    windowSeconds: intEnv('RATE_LIMIT_LEADS_EMAIL_WINDOW', 3600),
  },
  /** POST /api/public/orders */
  ordersIp: {
    limit: intEnv('RATE_LIMIT_ORDERS_IP', 20),
    windowSeconds: intEnv('RATE_LIMIT_ORDERS_IP_WINDOW', 3600),
  },
  ordersEmail: {
    limit: intEnv('RATE_LIMIT_ORDERS_EMAIL', 5),
    windowSeconds: intEnv('RATE_LIMIT_ORDERS_EMAIL_WINDOW', 3600),
  },
  /** GET /api/public/orders/[token] */
  orderStatus: {
    limit: intEnv('RATE_LIMIT_ORDER_STATUS_IP', 120),
    windowSeconds: intEnv('RATE_LIMIT_ORDER_STATUS_WINDOW', 600),
  },
  /** GET .../payment-info */
  paymentInfo: {
    limit: intEnv('RATE_LIMIT_PAYMENT_INFO_IP', 60),
    windowSeconds: intEnv('RATE_LIMIT_PAYMENT_INFO_WINDOW', 600),
  },
  /** POST .../proof */
  proofIp: {
    limit: intEnv('RATE_LIMIT_PROOF_IP', 30),
    windowSeconds: intEnv('RATE_LIMIT_PROOF_IP_WINDOW', 3600),
  },
  proofToken: {
    limit: intEnv('RATE_LIMIT_PROOF_TOKEN', 10),
    windowSeconds: intEnv('RATE_LIMIT_PROOF_TOKEN_WINDOW', 3600),
  },
} as const satisfies Record<string, RateLimitRule>;
