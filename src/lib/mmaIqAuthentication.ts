import type Keycloak from 'keycloak-js';
import type { KeycloakInitOptions } from 'keycloak-js';

export function mmaIqInitializationOptions(origin: string, returnedFromLogin: boolean): KeycloakInitOptions {
  return {
    pkceMethod: 'S256',
    checkLoginIframe: false,
    silentCheckSsoFallback: false,
    // A callback must be processed immediately. The cookie probe runs before
    // callback processing in keycloak-js and can otherwise block valid logins.
    // Omitting onLoad also prevents a lost callback state from starting SSO again.
    ...(returnedFromLogin ? {} : {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${origin}/silent-check-sso.html`,
    }),
  };
}

/** Keep both interactive login and silent SSO on MMA IQ's own login flow. */
export function configureNativeMmaIqLogin(keycloak: Pick<Keycloak, 'createLoginUrl'>) {
  const createLoginUrl = keycloak.createLoginUrl.bind(keycloak);
  keycloak.createLoginUrl = async (options) => {
    const url = new URL(await createLoginUrl(options));
    // Keycloak supports an empty hint to disable the realm's default social
    // redirect. keycloak-js 26 drops idpHint: '', so append it to the final URL.
    // Wrapping the URL builder also protects check-sso's hidden iframe.
    url.searchParams.set('kc_idp_hint', '');
    return url.toString();
  };
}

export function hasMmaIqLoginCallback(href: string) {
  const url = new URL(href);
  return [url.searchParams, new URLSearchParams(url.hash.slice(1))].some(
    (params) => params.has('state') && (params.has('code') || params.has('error')),
  );
}
