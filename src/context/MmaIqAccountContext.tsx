import Keycloak, { KeycloakProfile } from 'keycloak-js';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createSubscriptionCheckout,
  createSubscriptionPortal,
  SubscriptionCheckoutInput,
} from '../services/stripeService';

interface MmaIqAccountContextValue {
  authenticated: boolean;
  loading: boolean;
  profile: KeycloakProfile | null;
  checkoutError: string | null;
  checkoutPending: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  beginSubscriptionCheckout: (input: SubscriptionCheckoutInput) => Promise<void>;
  beginSubscriptionManagement: () => Promise<void>;
}

const MmaIqAccountContext = createContext<MmaIqAccountContextValue | undefined>(undefined);
const PENDING_CHECKOUT_KEY = 'mmaiq_pending_subscription_checkout';
const PENDING_MANAGEMENT_KEY = 'mmaiq_pending_subscription_management';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_MMAIQ_OIDC_URL || 'https://auth.mmaiq.fr',
  realm: import.meta.env.VITE_MMAIQ_OIDC_REALM || 'MMA',
  // Client public dédié au site, Authorization Code + PKCE. Il doit être
  // créé dans Keycloak avec les redirect URIs de mmaiq.fr et du dev local.
  clientId: import.meta.env.VITE_MMAIQ_OIDC_CLIENT_ID || 'mmaiq-web',
});

// React StrictMode monte le provider deux fois en développement. Keycloak
// interdit deux appels à init() sur la même instance : partager la promesse
// garde le comportement identique en dev et en production.
let keycloakInitialization: Promise<boolean> | null = null;
function initializeKeycloak() {
  keycloakInitialization ??= keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  });
  return keycloakInitialization;
}

async function validAccessToken(): Promise<string> {
  await keycloak.updateToken(30);
  if (!keycloak.token) throw new Error('Ta session MMA IQ a expiré. Reconnecte-toi.');
  return keycloak.token;
}

export function MmaIqAccountProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<KeycloakProfile | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const resumedPending = useRef(false);

  useEffect(() => {
    let cancelled = false;
    initializeKeycloak()
      .then(async (isAuthenticated) => {
        if (cancelled) return;
        setAuthenticated(isAuthenticated);
        if (isAuthenticated) {
          const loaded = await keycloak.loadUserProfile().catch(() => null);
          if (!cancelled) setProfile(loaded);
        }
      })
      .catch((error) => {
        console.error('Initialisation du compte MMA IQ impossible', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    keycloak.onAuthLogout = () => {
      setAuthenticated(false);
      setProfile(null);
    };
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => keycloak.login());
    };
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    await keycloak.login({ redirectUri: window.location.href });
  }, []);

  const logout = useCallback(async () => {
    await keycloak.logout({ redirectUri: `${window.location.origin}/tarifs` });
  }, []);

  const runCheckout = useCallback(async (input: SubscriptionCheckoutInput) => {
    setCheckoutError(null);
    setCheckoutPending(true);
    try {
      const token = await validAccessToken();
      await createSubscriptionCheckout(input, token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de démarrer le paiement.';
      setCheckoutError(message);
      throw error;
    } finally {
      setCheckoutPending(false);
    }
  }, []);

  const beginSubscriptionCheckout = useCallback(async (input: SubscriptionCheckoutInput) => {
    if (!keycloak.authenticated) {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(input));
      await login();
      return;
    }
    await runCheckout(input);
  }, [login, runCheckout]);

  const beginSubscriptionManagement = useCallback(async () => {
    setCheckoutError(null);
    if (!keycloak.authenticated) {
      sessionStorage.setItem(PENDING_MANAGEMENT_KEY, '1');
      await login();
      return;
    }
    setCheckoutPending(true);
    try {
      await createSubscriptionPortal(await validAccessToken());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'ouvrir la gestion de l'abonnement.";
      setCheckoutError(message);
      throw error;
    } finally {
      setCheckoutPending(false);
    }
  }, [login]);

  useEffect(() => {
    if (loading || !authenticated || resumedPending.current) return;
    if (sessionStorage.getItem(PENDING_MANAGEMENT_KEY)) {
      resumedPending.current = true;
      sessionStorage.removeItem(PENDING_MANAGEMENT_KEY);
      beginSubscriptionManagement().catch(() => {});
      return;
    }
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return;
    resumedPending.current = true;
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    try {
      const input = JSON.parse(raw) as SubscriptionCheckoutInput;
      runCheckout(input).catch(() => {});
    } catch {
      setCheckoutError('La formule sélectionnée a expiré. Choisis-la à nouveau.');
    }
  }, [authenticated, beginSubscriptionManagement, loading, runCheckout]);

  const value = useMemo<MmaIqAccountContextValue>(() => ({
    authenticated,
    loading,
    profile,
    checkoutError,
    checkoutPending,
    login,
    logout,
    getAccessToken: validAccessToken,
    beginSubscriptionCheckout,
    beginSubscriptionManagement,
  }), [authenticated, loading, profile, checkoutError, checkoutPending, login, logout, beginSubscriptionCheckout, beginSubscriptionManagement]);

  return <MmaIqAccountContext.Provider value={value}>{children}</MmaIqAccountContext.Provider>;
}

export function useMmaIqAccount() {
  const value = useContext(MmaIqAccountContext);
  if (!value) throw new Error('useMmaIqAccount doit être utilisé dans MmaIqAccountProvider');
  return value;
}
