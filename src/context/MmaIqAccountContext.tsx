import { createContext, type ReactNode, useContext, useState } from 'react';

type SubscriptionCheckoutInput = {
  planKey: 'essentiel' | 'performance' | 'elite' | 'coach_suite';
  interval: 'monthly' | 'yearly';
  gymCode?: string | null;
};

type MmaIqAccountContextValue = {
  loading: boolean;
  checkoutPending: boolean;
  checkoutError: string | null;
  beginSubscriptionCheckout: (input: SubscriptionCheckoutInput) => Promise<void>;
  beginSubscriptionManagement: () => Promise<void>;
};

const MmaIqAccountContext = createContext<MmaIqAccountContextValue | undefined>(undefined);

export function MmaIqAccountProvider({ children }: { children: ReactNode }) {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const unavailable = async () => {
    const error = new Error("Les abonnements ne sont pas encore ouverts.");
    setCheckoutError(error.message);
    throw error;
  };

  return (
    <MmaIqAccountContext.Provider value={{
      loading: false,
      checkoutPending: false,
      checkoutError,
      beginSubscriptionCheckout: unavailable,
      beginSubscriptionManagement: unavailable,
    }}>
      {children}
    </MmaIqAccountContext.Provider>
  );
}

export function useMmaIqAccount() {
  const value = useContext(MmaIqAccountContext);
  if (!value) throw new Error('useMmaIqAccount doit être utilisé dans un MmaIqAccountProvider');
  return value;
}
