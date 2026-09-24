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
  BillingError,
  createSubscriptionCheckout,
  createSubscriptionPortal,
  PortalOptions,
  SubscriptionCheckoutInput,
} from '../services/stripeService';

interface MmaIqAccountContextValue {
  authenticated: boolean;
  loading: boolean;
  profile: KeycloakProfile | null;
  checkoutError: string | null;
  /** Code métier de la dernière erreur (already_subscribed, payment_pending, consent_required…). */
  checkoutErrorCode: string | null;
  checkoutPending: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  beginSubscriptionCheckout: (input: SubscriptionCheckoutInput) => Promise<void>;
  beginSubscriptionManagement: (options?: PortalOptions) => Promise<void>;
  clearCheckoutError: () => void;
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
    // Sans cookies tiers (Safari…), keycloak-js redirigerait toute la page vers
    // auth.mmaiq.fr pour tester la session : on s'en passe, le visiteur est
    // considéré non connecté et se connecte au moment de payer.
    silentCheckSsoFallback: false,
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
  const [checkoutErrorCode, setCheckoutErrorCode] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const resumedPending = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // La vérification SSO silencieuse passe par une iframe vers auth.mmaiq.fr.
    // Si le serveur l'interdit (CSP frame-ancestors), keycloak-js attend sans
    // fin : au-delà de ce délai on considère le visiteur non connecté, sans
    // interrompre l'initialisation (un retour de connexion reste traité).
    const initTimeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);
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
        window.clearTimeout(initTimeout);
        if (!cancelled) setLoading(false);
      });

    keycloak.onAuthLogout = () => {
      setAuthenticated(false);
      setProfile(null);
    };
    // Jeton impossible à renouveler : on repasse en visiteur sans rediriger
    // vers la connexion (elle sera demandée au moment utile).
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => {
        keycloak.clearToken();
        setAuthenticated(false);
        setProfile(null);
      });
    };
    return () => {
      cancelled = true;
      window.clearTimeout(initTimeout);
    };
  }, []);

  const login = useCallback(async () => {
    await keycloak.login({ redirectUri: window.location.href });
  }, []);

  const logout = useCallback(async () => {
    await keycloak.logout({ redirectUri: `${window.location.origin}/tarifs` });
  }, []);

  const reportError = useCallback((error: unknown, fallback: string) => {
    setCheckoutError(error instanceof Error ? error.message : fallback);
    setCheckoutErrorCode(error instanceof BillingError ? error.code : null);
  }, []);

  const clearCheckoutError = useCallback(() => {
    setCheckoutError(null);
    setCheckoutErrorCode(null);
  }, []);

  const runCheckout = useCallback(async (input: SubscriptionCheckoutInput) => {
    clearCheckoutError();
    setCheckoutPending(true);
    try {
      const token = await validAccessToken();
      await createSubscriptionCheckout(input, token);
    } catch (error) {
      reportError(error, 'Impossible de démarrer le paiement.');
      throw error;
    } finally {
      setCheckoutPending(false);
    }
  }, [clearCheckoutError, reportError]);

  const beginSubscriptionCheckout = useCallback(async (input: SubscriptionCheckoutInput) => {
    if (!keycloak.authenticated) {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(input));
      await login();
      return;
    }
    await runCheckout(input);
  }, [login, runCheckout]);

  const beginSubscriptionManagement = useCallback(async (options: PortalOptions = {}) => {
    clearCheckoutError();
    if (!keycloak.authenticated) {
      sessionStorage.setItem(PENDING_MANAGEMENT_KEY, JSON.stringify(options));
      await login();
      return;
    }
    setCheckoutPending(true);
    try {
      await createSubscriptionPortal(await validAccessToken(), options);
    } catch (error) {
      reportError(error, "Impossible d'ouvrir la gestion de l'abonnement.");
      throw error;
    } finally {
      setCheckoutPending(false);
    }
  }, [clearCheckoutError, login, reportError]);

  useEffect(() => {
    if (loading || !authenticated || resumedPending.current) return;
    const pendingManagement = sessionStorage.getItem(PENDING_MANAGEMENT_KEY);
    if (pendingManagement) {
      resumedPending.current = true;
      sessionStorage.removeItem(PENDING_MANAGEMENT_KEY);
      let options: PortalOptions = {};
      try {
        const parsed = JSON.parse(pendingManagement);
        if (parsed && typeof parsed === 'object') options = parsed;
      } catch {
        // ancien marqueur « 1 » : accueil du portail
      }
      beginSubscriptionManagement(options).catch(() => {});
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
    checkoutErrorCode,
    checkoutPending,
    login,
    logout,
    getAccessToken: validAccessToken,
    beginSubscriptionCheckout,
    beginSubscriptionManagement,
    clearCheckoutError,
  }), [authenticated, loading, profile, checkoutError, checkoutErrorCode, checkoutPending, login, logout, beginSubscriptionCheckout, beginSubscriptionManagement, clearCheckoutError]);

  return <MmaIqAccountContext.Provider value={value}>{children}</MmaIqAccountContext.Provider>;
}

export function useMmaIqAccount() {
  const value = useContext(MmaIqAccountContext);
  if (!value) throw new Error('useMmaIqAccount doit être utilisé dans MmaIqAccountProvider');
  return value;
}
