'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  captureAttributionFromUrl,
  fetchCheckoutConfig,
  type PublicCheckoutConfig,
} from '@/lib/checkout-client';
import {
  buildReservePath,
  type ReserveContext,
  type ReserveIntent,
} from '@/lib/checkout-client/reserveIntent';

function isAdminPath(pathname: string | null): boolean {
  return Boolean(pathname?.startsWith('/admin'));
}

type ReserveFlowContextValue = {
  config: PublicCheckoutConfig | null;
  configLoading: boolean;
  refreshConfig: () => Promise<void>;
  /** @deprecated Prefer startWorkshopReserveFlow or startMentorshipReserveFlow */
  startReserveFlow: () => void;
  /** Optional planId overrides the default workshop plan (per-program cards). */
  startWorkshopReserveFlow: (
    planId?: string | null,
    context?: ReserveContext
  ) => void;
  startMentorshipReserveFlow: (context?: ReserveContext) => void;
  reserveCta: {
    label: string;
    disabled: boolean;
  };
  workshopCta: {
    label: string;
    disabled: boolean;
  };
  mentorshipCta: {
    label: string;
    disabled: boolean;
  };
};

const ReserveFlowContext = createContext<ReserveFlowContextValue | null>(null);

function ctaFromConfig(
  config: PublicCheckoutConfig | null,
  planId: string | null | undefined
): { label: string; disabled: boolean } {
  if (!config) {
    return { label: 'Reserve', disabled: false };
  }
  if (!config.reservationsOpen) {
    return { label: 'Reservations closed', disabled: true };
  }
  if (config.session?.soldOut) {
    return { label: 'Sold out', disabled: true };
  }
  if (!planId) {
    return { label: 'Reserve', disabled: true };
  }
  return { label: 'Reserve', disabled: false };
}

export function ReserveFlowProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const adminRoute = isAdminPath(pathname);
  const [config, setConfig] = useState<PublicCheckoutConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const refreshConfig = useCallback(async () => {
    if (adminRoute) {
      setConfigLoading(false);
      return;
    }
    try {
      const data = await fetchCheckoutConfig();
      setConfig(data);
    } catch {
      /* keep previous */
    } finally {
      setConfigLoading(false);
    }
  }, [adminRoute]);

  useEffect(() => {
    if (adminRoute) {
      setConfigLoading(false);
      return;
    }
    captureAttributionFromUrl(
      typeof window !== 'undefined' ? window.location.search : '',
      typeof document !== 'undefined' ? document.referrer : ''
    );
    void refreshConfig();
  }, [adminRoute, refreshConfig]);

  const beginReserve = useCallback(
    (
      intent: ReserveIntent,
      planId: string | null | undefined,
      context?: ReserveContext
    ) => {
      if (!config?.reservationsOpen) return;
      if (config.session?.soldOut) return;
      if (!planId) return;

      const planName =
        config.plans.find((p) => p.id === planId)?.name || null;
      const path = buildReservePath(intent, planId, {
        programId: context?.programId,
        forTitle: context?.forTitle?.trim() || planName,
      });
      router.push(path);
    },
    [config, router]
  );

  const startWorkshopReserveFlow = useCallback(
    (planId?: string | null, context?: ReserveContext) => {
      const mentorshipId =
        config?.mentorshipPlanId || config?.landingPlanId || null;
      const requested = planId?.trim() || null;
      // Never send workshop CTAs to the Mentorship plan when another plan exists.
      const resolved =
        requested && requested !== mentorshipId
          ? requested
          : config?.workshopPlanId && config.workshopPlanId !== mentorshipId
            ? config.workshopPlanId
            : requested || config?.workshopPlanId || null;
      beginReserve('workshop', resolved, context);
    },
    [
      beginReserve,
      config?.workshopPlanId,
      config?.mentorshipPlanId,
      config?.landingPlanId,
    ]
  );

  const startMentorshipReserveFlow = useCallback(
    (context?: ReserveContext) => {
      const mentorshipId =
        config?.mentorshipPlanId || config?.landingPlanId || null;
      const planName =
        mentorshipId != null
          ? config?.plans.find((p) => p.id === mentorshipId)?.name
          : null;
      beginReserve('mentorship', mentorshipId, {
        forTitle: context?.forTitle?.trim() || planName || 'Mentorship',
      });
    },
    [beginReserve, config?.mentorshipPlanId, config?.landingPlanId, config?.plans]
  );

  /** Default = workshop so legacy callers don't open mentorship. */
  const startReserveFlow = startWorkshopReserveFlow;

  const workshopCta = useMemo(
    () => ctaFromConfig(config, config?.workshopPlanId),
    [config]
  );
  const mentorshipCta = useMemo(
    () =>
      ctaFromConfig(
        config,
        config?.mentorshipPlanId || config?.landingPlanId
      ),
    [config]
  );
  const reserveCta = workshopCta;

  const value = useMemo(
    () => ({
      config,
      configLoading,
      refreshConfig,
      startReserveFlow,
      startWorkshopReserveFlow,
      startMentorshipReserveFlow,
      reserveCta,
      workshopCta,
      mentorshipCta,
    }),
    [
      config,
      configLoading,
      refreshConfig,
      startReserveFlow,
      startWorkshopReserveFlow,
      startMentorshipReserveFlow,
      reserveCta,
      workshopCta,
      mentorshipCta,
    ]
  );

  return (
    <ReserveFlowContext.Provider value={value}>
      {children}
    </ReserveFlowContext.Provider>
  );
}

export function useReserveFlow(): ReserveFlowContextValue {
  const ctx = useContext(ReserveFlowContext);
  if (!ctx) {
    throw new Error('useReserveFlow must be used within ReserveFlowProvider');
  }
  return ctx;
}

/** Safe for optional contexts (should not be needed once provider wraps the app). */
export function useReserveFlowOptional(): ReserveFlowContextValue | null {
  return useContext(ReserveFlowContext);
}
