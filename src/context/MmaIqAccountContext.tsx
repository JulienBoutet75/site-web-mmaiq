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
import { hasMmaIqLoginCallback, configureNativeMmaIqLogin, mmaIqInitializationOptions } from '../lib/mmaIqAuthentication';

interface MmaIqAccountContextValue {
  authenticated: boolean;
  loading: boolean;
  profile: KeycloakProfile | null;
  loginError: string | null;
  loginPending: boolean;
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
const LOGIN_RETRY_MESSAGE = 'La connexion n’a pas abouti. Réessaie pour continuer.';
const INITIAL_SESSION_TIMEOUT_MS = 5000;
// Capture before Keycloak removes the authorization parameters from the URL.
const returnedFromLogin = hasMmaIqLoginCallback(window.location.href);

function clearPendingActions() {
  try {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    sessionStorage.removeItem(PENDING_MANAGEMENT_KEY);
  } catch { /* Aucun parcours à reprendre si le stockage est indisponible. */ }
}

const keycloak = new Keycloak({
  url: import.meta.env.VITE_MMAIQ_OIDC_URL || 'https://auth.mmaiq.fr',
  realm: import.meta.env.VITE_MMAIQ_OIDC_REALM || 'MMA',
  // Client public dédié au site, Authorization Code + PKCE. Il doit être
  // créé dans Keycloak avec les redirect URIs de mmaiq.fr et du dev local.
  clientId: import.meta.env.VITE_MMAIQ_OIDC_CLIENT_ID || 'mmaiq-web',
});
configureNativeMmaIqLogin(keycloak);

// React StrictMode monte le provider deux fois en développement. Keycloak
// interdit deux appels à init() sur la même instance : partager la promesse
// garde le comportement identique en dev et en production.
let keycloakInitialization: Promise<boolean> | null = null;
let loginInitialization: Promise<void> | null = null;
function initializeKeycloak() {
  keycloakInitialization ??= keycloak.init(mmaIqInitializationOptions(window.location.origin, returnedFromLogin));
  return keycloakInitialization;
}

function readyForLogin() {
  // With our inline Keycloak config the adapter and endpoints are set up at
  // init(), before SSO starts. Give SSO time to recover the existing session,
  // then allow a top-level login even if a browser has blocked its iframe.
  loginInitialization ??= new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, INITIAL_SESSION_TIMEOUT_MS);
    initializeKeycloak().catch(() => false).finally(() => {
      window.clearTimeout(timeout);
      resolve();
    });
  });
  return loginInitialization;
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
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutErrorCode, setCheckoutErrorCode] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const resumedPending = useRef(false);
  const loginInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Only an actual login callback may resume an action from a previous page.
    // A fresh load (including Back from login) abandons older checkout intents.
    if (!returnedFromLogin) clearPendingActions();
    // La vérification SSO silencieuse passe par une iframe vers auth.mmaiq.fr.
    // Si le serveur l'interdit (CSP frame-ancestors), keycloak-js attend sans
    // fin : au-delà de ce délai on considère le visiteur non connecté, sans
    // interrompre l'initialisation (un retour de connexion reste traité).
    const initTimeout = window.setTimeout(() => {
      if (!cancelled) {
        if (returnedFromLogin) setLoginError(LOGIN_RETRY_MESSAGE);
        setLoading(false);
      }
    }, INITIAL_SESSION_TIMEOUT_MS);
    void readyForLogin();
    initializeKeycloak()
      .then(async (isAuthenticated) => {
        if (cancelled) return;
        setAuthenticated(isAuthenticated);
        if (isAuthenticated) {
          setLoginError(null);
          setLoginPending(false);
          const loaded = await keycloak.loadUserProfile().catch(() => null);
          if (!cancelled) setProfile(loaded);
        } else if (returnedFromLogin) {
          // A cancelled callback or lost OIDC state must offer a retry instead
          // of triggering another automatic login on the payment page.
          setLoginError(LOGIN_RETRY_MESSAGE);
          clearPendingActions();
        }
      })
      .catch((error) => {
        console.error('Initialisation du compte MMA IQ impossible', error);
        if (!cancelled) {
          setLoginError(LOGIN_RETRY_MESSAGE);
          clearPendingActions();
        }
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
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && loginInFlight.current && !keycloak.authenticated) {
        clearPendingActions();
        loginInFlight.current = null;
        setLoginPending(false);
        setLoginError(LOGIN_RETRY_MESSAGE);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => {
      cancelled = true;
      window.clearTimeout(initTimeout);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  const login = useCallback(async () => {
    if (loginInFlight.current) return loginInFlight.current;
    const attempt = (async () => {
      setLoginError(null);
      setLoginPending(true);
      try {
        await readyForLogin();
        if (keycloak.authenticated) {
          setAuthenticated(true);
          setLoginPending(false);
          return;
        }
        // No prompt=login: Keycloak can reuse a session even when silent SSO
        // could not see its cookie (Safari, Firefox privacy settings…).
        await keycloak.login({ redirectUri: window.location.href });
      } catch (error) {
        setLoginError(LOGIN_RETRY_MESSAGE);
        setLoginPending(false);
        throw error;
      }
    })();
    loginInFlight.current = attempt;
    try {
      await attempt;
    } finally {
      loginInFlight.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    clearPendingActions();
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
      clearPendingActions();
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(input));
      try {
        await login();
      } catch (error) {
        sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
        reportError(error, LOGIN_RETRY_MESSAGE);
        throw error;
      }
      return;
    }
    await runCheckout(input);
  }, [login, reportError, runCheckout]);

  const beginSubscriptionManagement = useCallback(async (options: PortalOptions = {}) => {
    clearCheckoutError();
    if (!keycloak.authenticated) {
      clearPendingActions();
      sessionStorage.setItem(PENDING_MANAGEMENT_KEY, JSON.stringify(options));
      try {
        await login();
      } catch (error) {
        sessionStorage.removeItem(PENDING_MANAGEMENT_KEY);
        reportError(error, LOGIN_RETRY_MESSAGE);
        throw error;
      }
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
    loginError,
    loginPending,
    checkoutError,
    checkoutErrorCode,
    checkoutPending,
    login,
    logout,
    getAccessToken: validAccessToken,
    beginSubscriptionCheckout,
    beginSubscriptionManagement,
    clearCheckoutError,
  }), [authenticated, loading, profile, loginError, loginPending, checkoutError, checkoutErrorCode, checkoutPending, login, logout, beginSubscriptionCheckout, beginSubscriptionManagement, clearCheckoutError]);

  return <MmaIqAccountContext.Provider value={value}>{children}</MmaIqAccountContext.Provider>;
}

export function useMmaIqAccount() {
  const value = useContext(MmaIqAccountContext);
  if (!value) throw new Error('useMmaIqAccount doit être utilisé dans MmaIqAccountProvider');
  return value;
}
