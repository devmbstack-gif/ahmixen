export type PublicCheckoutConfig = {
  reservationsOpen: boolean;
  holdMinutes: number;
  landingPlanId: string | null;
  mentorshipPlanId: string | null;
  workshopPlanId: string | null;
  session: {
    startsAt: string;
    durationMinutes: number;
    timezone: string;
    seatsAvailable: number;
    soldOut: boolean;
    showLimitedSeatsBadge: boolean;
  } | null;
  plans: Array<{
    id: string;
    name: string;
    shortDescription: string;
    type: 'one_time' | 'installment';
    currency: 'PKR' | 'USD';
    price: number;
    originalPrice: number | null;
    savingsPercent: number | null;
    features: string[];
  }>;
};

export type ApiError = {
  code: string;
  message: string;
};

export type CheckoutPrefill = {
  name: string;
  email: string;
  phone: string;
  profession: string;
};

export type UtmPayload = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
};
