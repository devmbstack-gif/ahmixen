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
  isPopupDone,
  type PublicCheckoutConfig,
} from '@/lib/checkout-client';
import { DiscountPopup } from './DiscountPopup';

function isAdminPath(pathname: string | null): boolean {
  return Boolean(pathname?.startsWith('/admin'));
}

type ReserveFlowContextValue = {
  config: PublicCheckoutConfig | null;
  configLoading: boolean;
  refreshConfig: () => Promise<void>;
  startReserveFlow: () => void;
  reserveCta: {
    label: string;
    disabled: boolean;
  };
};

const ReserveFlowContext = createContext<ReserveFlowContextValue | null>(null);

function ctaFromConfig(config: PublicCheckoutConfig | null): {
  label: string;
  disabled: boolean;
} {
  if (!config) {
    return { label: 'Reserve', disabled: false };
  }
  if (!config.reservationsOpen) {
    return { label: 'Reservations closed', disabled: true };
  }
  if (config.session?.soldOut) {
    return { label: 'Sold out', disabled: true };
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
  const [popupOpen, setPopupOpen] = useState(false);

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
      setPopupOpen(false);
      return;
    }
    captureAttributionFromUrl(
      typeof window !== 'undefined' ? window.location.search : '',
      typeof document !== 'undefined' ? document.referrer : ''
    );
    void refreshConfig();
  }, [adminRoute, refreshConfig]);

  const goReserve = useCallback(() => {
    setPopupOpen(false);
    router.push('/reserve');
  }, [router]);

  const startReserveFlow = useCallback(() => {
    if (!config?.reservationsOpen) return;
    if (config.session?.soldOut) return;
    if (config.popupCoupon && !isPopupDone()) {
      setPopupOpen(true);
      return;
    }
    router.push('/reserve');
  }, [config, router]);

  const reserveCta = useMemo(() => ctaFromConfig(config), [config]);

  const value = useMemo(
    () => ({
      config,
      configLoading,
      refreshConfig,
      startReserveFlow,
      reserveCta,
    }),
    [config, configLoading, refreshConfig, startReserveFlow, reserveCta]
  );

  return (
    <ReserveFlowContext.Provider value={value}>
      {children}
      {!adminRoute && (
        <DiscountPopup
          open={popupOpen}
          label={config?.popupCoupon?.label || 'your discount'}
          onClose={() => setPopupOpen(false)}
          onDone={goReserve}
        />
      )}
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
