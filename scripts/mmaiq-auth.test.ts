import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import Keycloak from 'keycloak-js';
import { hasMmaIqLoginCallback, configureNativeMmaIqLogin, mmaIqInitializationOptions } from '../src/lib/mmaIqAuthentication';

function mockBrowser(t: TestContext, cookies: 'supported' | 'unsupported' = 'supported') {
  const listeners = new Set<(event: unknown) => void>();
  const authRequests: URL[] = [];
  const iframeRequests: URL[] = [];
  const location = { href: 'https://mmaiq.fr/paiement?plan=performance&interval=yearly', origin: 'https://mmaiq.fr', assign: (_url: string) => {} };
  const navigation = new Promise<URL>((resolve) => { location.assign = (url) => resolve(new URL(url)); });
  const storage = Object.create(null);
  Object.defineProperties(storage, {
    getItem: { value: (key: string) => storage[key] ?? null },
    setItem: { value: (key: string, value: string) => { storage[key] = value; } },
    removeItem: { value: (key: string) => { delete storage[key]; } },
  });
  const globals = {
    isSecureContext: true,
    location,
    localStorage: storage,
    window: {
      location,
      history: { state: null, replaceState(_state: unknown, _title: string, url: string) { location.href = url; } },
      setTimeout,
      addEventListener: (_name: string, callback: (event: unknown) => void) => listeners.add(callback),
      removeEventListener: (_name: string, callback: (event: unknown) => void) => listeners.delete(callback),
    },
    document: {
      createElement: () => ({ src: '', style: {}, contentWindow: {}, setAttribute(name: string, value: string) { this[name] = value; } }),
      body: {
        appendChild(iframe: { src: string; contentWindow: object }) {
          const url = new URL(iframe.src);
          iframeRequests.push(url);
          const cookieCheck = url.pathname.endsWith('/3p-cookies/step1.html');
          if (!cookieCheck) authRequests.push(url);
          const data = cookieCheck ? cookies : `${url.searchParams.get('redirect_uri')}#error=login_required&state=${url.searchParams.get('state')}`;
          queueMicrotask(() => {
            for (const callback of listeners) callback({ source: iframe.contentWindow, origin: location.origin, data });
          });
        },
        removeChild() {},
      },
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  return { authRequests, iframeRequests, location, navigation };
}

test('the real Keycloak adapter keeps silent SSO and login on MMA IQ, preserving PKCE and the chosen plan', { timeout: 2000 }, async (t) => {
  const browser = mockBrowser(t);
  const keycloak = new Keycloak({ url: 'https://auth.mmaiq.fr', realm: 'MMA', clientId: 'mmaiq-web' });
  configureNativeMmaIqLogin(keycloak);
  assert.equal(await keycloak.init(mmaIqInitializationOptions(browser.location.origin, false)), false);

  const [silentUrl] = browser.authRequests;
  assert.equal(silentUrl.searchParams.has('kc_idp_hint'), true);
  assert.equal(silentUrl.searchParams.get('kc_idp_hint'), '');
  assert.equal(silentUrl.searchParams.get('prompt'), 'none');
  assert.equal(silentUrl.searchParams.get('redirect_uri'), 'https://mmaiq.fr/silent-check-sso.html');

  void keycloak.login({ redirectUri: browser.location.href });
  const loginUrl = await browser.navigation;
  assert.equal(loginUrl.searchParams.has('kc_idp_hint'), true);
  assert.equal(loginUrl.searchParams.get('kc_idp_hint'), '');
  assert.equal(loginUrl.searchParams.has('prompt'), false, 'existing SSO must be reusable');
  assert.equal(loginUrl.searchParams.get('redirect_uri'), browser.location.href);
  assert.equal(loginUrl.searchParams.get('code_challenge_method'), 'S256');
  assert.match(loginUrl.searchParams.get('code_challenge') ?? '', /^[A-Za-z0-9_-]{43}$/);
  assert.ok(loginUrl.searchParams.get('state'));
  assert.ok(loginUrl.searchParams.get('nonce'));
});

test('blocked third-party cookies still allow native login without forcing credentials', { timeout: 2000 }, async (t) => {
  const browser = mockBrowser(t, 'unsupported');
  const keycloak = new Keycloak({ url: 'https://auth.mmaiq.fr', realm: 'MMA', clientId: 'mmaiq-web' });
  configureNativeMmaIqLogin(keycloak);
  assert.equal(await keycloak.init(mmaIqInitializationOptions(browser.location.origin, false)), false);
  for (const url of browser.authRequests) {
    assert.equal(url.searchParams.get('kc_idp_hint'), '');
    assert.equal(url.searchParams.get('prompt'), 'none');
  }
  void keycloak.login({ redirectUri: browser.location.href });
  const loginUrl = await browser.navigation;
  assert.equal(loginUrl.searchParams.get('kc_idp_hint'), '');
  assert.equal(loginUrl.searchParams.has('prompt'), false);
});

test('login return detection covers cancellation and both OIDC response modes', () => {
  assert.equal(hasMmaIqLoginCallback('https://mmaiq.fr/paiement?plan=elite#state=123&error=access_denied'), true);
  assert.equal(hasMmaIqLoginCallback('https://mmaiq.fr/paiement?plan=elite&state=123&code=abc'), true);
  assert.equal(hasMmaIqLoginCallback('https://mmaiq.fr/paiement?plan=elite&code=PROMO'), false);
  assert.equal(hasMmaIqLoginCallback('https://mmaiq.fr/paiement?plan=elite&interval=monthly'), false);
});

test('a valid login callback exchanges the code without a cookie probe and retains its original checkout URL', { timeout: 2000 }, async (t) => {
  const browser = mockBrowser(t, 'unsupported');
  const config = { url: 'https://auth.mmaiq.fr', realm: 'MMA', clientId: 'mmaiq-web' };
  const beforeRedirect = new Keycloak(config);
  configureNativeMmaIqLogin(beforeRedirect);
  await beforeRedirect.init(mmaIqInitializationOptions(browser.location.origin, true));
  const destination = browser.location.href;
  const authUrl = new URL(await beforeRedirect.createLoginUrl({ redirectUri: destination }));
  browser.location.href = `${destination}#code=test-code&state=${authUrl.searchParams.get('state')}`;

  const originalFetch = globalThis.fetch;
  let tokenRequests = 0;
  globalThis.fetch = async (input, options) => {
    tokenRequests++;
    assert.equal(input, 'https://auth.mmaiq.fr/realms/MMA/protocol/openid-connect/token');
    const body = options?.body as URLSearchParams;
    assert.equal(body.get('code'), 'test-code');
    assert.equal(body.get('redirect_uri'), destination);
    assert.ok(body.get('code_verifier'));
    const claims = { sub: 'test-account', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, nonce: authUrl.searchParams.get('nonce') };
    const token = `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.test-signature`;
    return Response.json({ access_token: token, refresh_token: token, id_token: token });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const afterRedirect = new Keycloak(config);
  configureNativeMmaIqLogin(afterRedirect);
  assert.equal(await afterRedirect.init(mmaIqInitializationOptions(browser.location.origin, true)), true);
  assert.equal(tokenRequests, 1);
  assert.equal(browser.iframeRequests.length, 0);
  assert.equal(browser.location.href, destination);
  assert.equal(afterRedirect.subject, 'test-account');
});

test('cancelled or lost-state callbacks stop without another SSO attempt', { timeout: 2000 }, async (t) => {
  const browser = mockBrowser(t);
  const config = { url: 'https://auth.mmaiq.fr', realm: 'MMA', clientId: 'mmaiq-web' };
  const beforeRedirect = new Keycloak(config);
  await beforeRedirect.init(mmaIqInitializationOptions(browser.location.origin, true));
  const destination = browser.location.href;
  const authUrl = new URL(await beforeRedirect.createLoginUrl({ redirectUri: destination }));
  browser.location.href = `${destination}#error=access_denied&state=${authUrl.searchParams.get('state')}`;
  await assert.rejects(new Keycloak(config).init(mmaIqInitializationOptions(browser.location.origin, true)), { error: 'access_denied' });

  browser.location.href = `${destination}#code=test-code&state=missing-state`;
  assert.equal(await new Keycloak(config).init(mmaIqInitializationOptions(browser.location.origin, true)), false);
  assert.equal(browser.iframeRequests.length, 0);
  assert.equal(browser.location.href, destination);
});
