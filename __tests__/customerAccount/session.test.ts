import { createHash } from 'node:crypto';

import { AuthRequest } from 'expo-auth-session';
import { AppState } from 'react-native';

import {
  getCustomerSessionState,
  getValidAccessToken,
  login,
  logout,
  refreshIfDue,
  refreshSession,
  resetCustomerSessionForTests,
  startCustomerSession,
} from '@/customerAccount/session';
import { readStoredSession, writeStoredSession } from '@/customerAccount/tokenStorage';

import {
  makeIdToken,
  TEST_CLIENT_ID,
  TEST_OPENID_CONFIGURATION,
  TEST_REDIRECT_URI,
  TEST_SHOP_ID,
  TEST_STORE_DOMAIN,
  validClaims,
} from '../helpers/customerAccount';
import {
  authorizationParams,
  callbackUrl,
  exchangeAnswer,
  FakeShopify,
  formOf,
  type TokenAnswer,
} from '../helpers/customerAccountMocks';

// --- Stand-ins -----------------------------------------------------------------------------

// expo-crypto, backed by Node's crypto, so the library's real PKCE code runs.
jest.mock('expo-crypto', () => {
  const nodeCrypto = jest.requireActual<typeof import('node:crypto')>('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    CryptoEncoding: { BASE64: 'base64', HEX: 'hex' },
    getRandomBytes: (size: number) => new Uint8Array(nodeCrypto.randomBytes(size)),
    getRandomValues: (array: Uint8Array) => {
      array.set(nodeCrypto.randomBytes(array.length));
      return array;
    },
    digestStringAsync: async (_algorithm: string, text: string, options: { encoding: string }) =>
      nodeCrypto
        .createHash('sha256')
        .update(text)
        .digest(options.encoding as 'base64' | 'hex'),
  };
});

// The system browser: each test says what the login page does with the authorization URL.
type BrowserResult = { type: 'success'; url: string } | { type: 'cancel' | 'dismiss' };
let mockBrowser: (authorizationUrl: string) => Promise<BrowserResult>;
const mockOpenAuthSession = jest.fn((url: string, _returnUrl: string) => mockBrowser(url));
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (url: string, returnUrl: string) => mockOpenAuthSession(url, returnUrl),
}));

// Secure storage in memory (the storage itself has its own tests).
const mockSecureStore = new Map<string, string>();
let mockSecureStoreReadFails = false;
let mockSecureStoreWriteFails = false;
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after-first-unlock-this-device-only',
  getItemAsync: async (key: string) => {
    if (mockSecureStoreReadFails) throw new Error('keystore unavailable');
    return mockSecureStore.get(key) ?? null;
  },
  setItemAsync: async (key: string, value: string) => {
    if (mockSecureStoreWriteFails) throw new Error('keystore unavailable');
    mockSecureStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    mockSecureStore.delete(key);
  },
}));

let mockLoginConfigured = true;
jest.mock('@/config', () => {
  const actual = jest.requireActual<typeof import('@/config')>('@/config');
  return {
    ...actual,
    getStoreConfig: () => ({ storeDomain: 'example-dev.myshopify.com' }),
    getCustomerAccountConfig: () => {
      if (!mockLoginConfigured)
        throw new actual.CustomerAccountConfigError(['EXPO_PUBLIC_SHOP_ID']);
      return actual.parseCustomerAccountConfig({
        EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
        EXPO_PUBLIC_SHOP_ID: '987654321012',
      });
    },
  };
});

const mockReport = jest.fn<void, [string]>();
// The session registers its token source when it is imported, before this file's own variables
// are set, so the source is kept inside the mock.
jest.mock('@/crashReporting/sentry', () => {
  const tokenSource = { current: (): readonly string[] => [] };
  return {
    tokenSource,
    reportCustomerAccountProblem: (code: string) => mockReport(code),
    setCustomerTokenSource: (source: () => readonly string[]) => {
      tokenSource.current = source;
    },
  };
});

function mockTokenSource(): readonly string[] {
  return jest
    .requireMock<{ tokenSource: { current: () => readonly string[] } }>('@/crashReporting/sentry')
    .tokenSource.current();
}

const mockClearAllCaches = jest.fn();
jest.mock('@/query/queryClient', () => ({ clearAllCaches: () => mockClearAllCaches() }));

// --- Helpers -------------------------------------------------------------------------------

let shopify: FakeShopify;

/** The login page signs the customer in and returns to the app with the request's own state. */
function browserSignsIn(answer?: (nonce: string) => TokenAnswer): void {
  mockBrowser = async (url) => {
    const params = authorizationParams(url);
    shopify.tokenAnswers = [answer?.(params.nonce!) ?? exchangeAnswer(params.nonce!)];
    return { type: 'success', url: callbackUrl({ code: 'test-code-1', state: params.state! }) };
  };
}

const NONCE = 'stored-login-nonce';

/** A stored session from an earlier launch, expiring in `minutes`. */
async function storeSession(minutes: number, idClaims: Record<string, unknown> = {}) {
  await writeStoredSession({
    accessToken: 'shcat_stored-access-token',
    refreshToken: 'shcrt_stored-refresh-token',
    idToken: makeIdToken(validClaims(NONCE, idClaims)),
    expiresAt: Date.now() + minutes * 60_000,
    nonce: NONCE,
  });
}

function refreshAnswer(overrides: Record<string, unknown> = {}): TokenAnswer {
  return {
    status: 200,
    body: { access_token: 'shcat_refreshed-access-token', expires_in: 3600, ...overrides },
  };
}

beforeEach(() => {
  resetCustomerSessionForTests();
  shopify = new FakeShopify();
  global.fetch = shopify.fetch as unknown as typeof fetch;
  mockSecureStore.clear();
  mockSecureStoreReadFails = false;
  mockSecureStoreWriteFails = false;
  mockLoginConfigured = true;
  mockOpenAuthSession.mockClear();
  mockReport.mockClear();
  mockClearAllCaches.mockClear();
  browserSignsIn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// --- Tests ---------------------------------------------------------------------------------

describe('starting a launch (P7-01, D-121)', () => {
  it('is signed out when nothing is stored, and does not call Shopify', async () => {
    await startCustomerSession();
    expect(getCustomerSessionState()).toEqual({
      status: 'signedOut',
      notice: 'none',
      loggingIn: false,
    });
    expect(shopify.calls).toEqual([]);
  });

  it('is signed in from storage with the email from the ID token, with no refresh when not due', async () => {
    await storeSession(60);
    await startCustomerSession();
    expect(getCustomerSessionState()).toEqual({ status: 'signedIn', email: 'reader@example.com' });
    expect(shopify.calls).toEqual([]);
  });

  it('is signed in without an email when the ID token has none', async () => {
    await storeSession(60, { email: undefined });
    await startCustomerSession();
    expect(getCustomerSessionState()).toEqual({ status: 'signedIn' });
  });

  it('says login is not set up when the configuration is missing, and login does nothing', async () => {
    mockLoginConfigured = false;
    await startCustomerSession();
    expect(getCustomerSessionState()).toEqual({ status: 'notConfigured' });
    await login();
    expect(mockOpenAuthSession).not.toHaveBeenCalled();
  });

  it('deletes a stored set that is not complete and is signed out', async () => {
    mockSecureStore.set('customer_session_active', 'a');
    mockSecureStore.set('customer_session_a_header', '2:10');
    await startCustomerSession();
    expect(getCustomerSessionState()).toMatchObject({ status: 'signedOut' });
    expect(mockSecureStore.size).toBe(0);
    expect(mockReport).toHaveBeenCalledWith('storage_invalid');
  });

  it('is signed out for the launch, deleting nothing, when the store cannot be read', async () => {
    await storeSession(60);
    const keys = [...mockSecureStore.keys()];
    mockSecureStoreReadFails = true;
    await startCustomerSession();
    expect(getCustomerSessionState()).toMatchObject({ status: 'signedOut', notice: 'none' });
    expect([...mockSecureStore.keys()]).toEqual(keys);
    expect(mockReport).toHaveBeenCalledWith('storage_unreadable');
  });
});

describe('login (P7-01, D-119)', () => {
  beforeEach(async () => {
    await startCustomerSession();
  });

  it('opens the system browser with PKCE (S256), state and nonce, and stores the tokens', async () => {
    await login();

    expect(mockOpenAuthSession).toHaveBeenCalledTimes(1);
    const [url, returnUrl] = mockOpenAuthSession.mock.calls[0]!;
    expect(returnUrl).toBe(TEST_REDIRECT_URI);
    expect(url.startsWith(`${TEST_OPENID_CONFIGURATION.authorization_endpoint}?`)).toBe(true);
    const params = authorizationParams(url);
    expect(params).toMatchObject({
      client_id: TEST_CLIENT_ID,
      redirect_uri: TEST_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email customer-account-api:full',
      code_challenge_method: 'S256',
    });
    // 32 random bytes in base64url: 43 characters each.
    expect(params.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(params.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(params.nonce).not.toBe(params.state);

    // The exchange sends the verifier whose SHA-256 is the challenge, unpadded base64url.
    const [exchange] = shopify.tokenCalls();
    const form = formOf(exchange!);
    expect(form).toMatchObject({
      grant_type: 'authorization_code',
      client_id: TEST_CLIENT_ID,
      redirect_uri: TEST_REDIRECT_URI,
      code: 'test-code-1',
    });
    expect(form.code_verifier!.length).toBeGreaterThanOrEqual(43);
    expect(form.code_verifier!.length).toBeLessThanOrEqual(128);
    expect(params.code_challenge).toBe(
      createHash('sha256').update(form.code_verifier!).digest('base64url'),
    );
    expect(params.code_challenge).not.toMatch(/[=+/]/);

    expect(getCustomerSessionState()).toEqual({ status: 'signedIn', email: 'reader@example.com' });
    const stored = await readStoredSession();
    expect(stored).toMatchObject({
      kind: 'session',
      session: {
        accessToken: 'shcat_test-access-token-0001',
        refreshToken: 'shcrt_test-refresh-token-0001',
        nonce: params.nonce,
      },
    });
    expect(mockReport).not.toHaveBeenCalled();
  });

  it('discovers the endpoints from the store, once per launch', async () => {
    await login();
    await logout();
    await login();
    const discoveries = shopify.calls.filter((call) =>
      call.url.endsWith('/.well-known/openid-configuration'),
    );
    expect(discoveries).toHaveLength(1);
    expect(discoveries[0]!.url).toBe(
      `https://${TEST_STORE_DOMAIN}/.well-known/openid-configuration`,
    );
  });

  it('refuses a wrong state returned to the app: nothing stored, the failure line', async () => {
    mockBrowser = async () => ({
      type: 'success',
      url: callbackUrl({ code: 'test-code-1', state: 'a-state-from-elsewhere' }),
    });

    await login();

    expect(shopify.tokenCalls()).toEqual([]);
    expect(getCustomerSessionState()).toEqual({
      status: 'signedOut',
      notice: 'loginFailed',
      loggingIn: false,
    });
    expect(await readStoredSession()).toEqual({ kind: 'none' });
    expect(mockReport).toHaveBeenCalledWith('state_mismatch');
  });

  it("refuses a wrong state itself, even if the library's own check let it through", async () => {
    jest.spyOn(AuthRequest.prototype, 'parseReturnUrl').mockReturnValue({
      type: 'success',
      error: null,
      url: 'x',
      params: { code: 'test-code-1', state: 'a-state-from-elsewhere' },
      authentication: null,
      errorCode: null,
    });

    await login();

    expect(shopify.tokenCalls()).toEqual([]);
    expect(getCustomerSessionState()).toMatchObject({ notice: 'loginFailed' });
    expect(mockReport).toHaveBeenCalledWith('state_mismatch');
  });

  it('refuses an ID token with another nonce: nothing stored', async () => {
    browserSignsIn(() => exchangeAnswer('a-different-nonce'));

    await login();

    expect(getCustomerSessionState()).toMatchObject({ status: 'signedOut', notice: 'loginFailed' });
    expect(await readStoredSession()).toEqual({ kind: 'none' });
    expect(mockReport).toHaveBeenCalledWith('nonce_mismatch');
  });

  it.each([
    ['another issuer', { iss: 'https://shopify.com/authentication/111' }, 'issuer_mismatch'],
    ['another audience', { aud: 'another-client' }, 'audience_mismatch'],
  ])('refuses an ID token with %s', async (_case, claims, code) => {
    browserSignsIn((nonce) => exchangeAnswer(nonce, {}, claims));
    await login();
    expect(getCustomerSessionState()).toMatchObject({ notice: 'loginFailed' });
    expect(mockReport).toHaveBeenCalledWith(code);
  });

  it.each(['cancel', 'dismiss'] as const)(
    'goes back to "Log in" with no message when the browser returns %s',
    async (type) => {
      mockBrowser = async () => ({ type });
      await login();
      expect(getCustomerSessionState()).toEqual({
        status: 'signedOut',
        notice: 'none',
        loggingIn: false,
      });
      expect(mockReport).not.toHaveBeenCalled();
    },
  );

  it('ignores a second tap while a login is running', async () => {
    let finish: (() => void) | undefined;
    mockBrowser = (url) =>
      new Promise((resolve) => {
        const params = authorizationParams(url);
        shopify.tokenAnswers = [exchangeAnswer(params.nonce!)];
        finish = () =>
          resolve({ type: 'success', url: callbackUrl({ code: 'c', state: params.state! }) });
      });

    const first = login();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getCustomerSessionState()).toMatchObject({ status: 'signedOut', loggingIn: true });
    await login();
    finish?.();
    await first;

    expect(mockOpenAuthSession).toHaveBeenCalledTimes(1);
    expect(getCustomerSessionState()).toMatchObject({ status: 'signedIn' });
  });

  it.each([
    [
      'refused grant',
      { status: 400, body: { error: 'invalid_grant' } },
      'exchange_oauth_invalid_grant',
    ],
    [
      'client error',
      { status: 401, body: { error: 'invalid_client' } },
      'exchange_oauth_invalid_client',
    ],
    ['server error', { status: 500, body: {} }, 'exchange_http_500'],
    ['network failure', 'network', 'exchange_network'],
  ] as const)(
    'shows the failure line when the exchange meets a %s',
    async (_case, answer, code) => {
      browserSignsIn(() => answer);
      await login();
      expect(getCustomerSessionState()).toMatchObject({ notice: 'loginFailed' });
      expect(await readStoredSession()).toEqual({ kind: 'none' });
      expect(mockReport).toHaveBeenCalledWith(code);
    },
  );

  it('refuses a login with no refresh token (a client set up outside the Headless channel)', async () => {
    browserSignsIn((nonce) => exchangeAnswer(nonce, { refresh_token: undefined }));
    await login();
    expect(getCustomerSessionState()).toMatchObject({ notice: 'loginFailed' });
    expect(mockReport).toHaveBeenCalledWith('exchange_no_refresh_token');
  });

  it('shows the failure line when discovery names another shop', async () => {
    shopify.discovery = {
      ...TEST_OPENID_CONFIGURATION,
      issuer: 'https://shopify.com/authentication/111111111111',
    };
    await login();
    expect(mockOpenAuthSession).not.toHaveBeenCalled();
    expect(getCustomerSessionState()).toMatchObject({ notice: 'loginFailed' });
    expect(mockReport).toHaveBeenCalledWith('discovery_mismatch');
  });

  it('a new login after a failure clears the failure line while it runs', async () => {
    browserSignsIn(() => ({ status: 500, body: {} }));
    await login();
    browserSignsIn();
    await login();
    expect(getCustomerSessionState()).toEqual({ status: 'signedIn', email: 'reader@example.com' });
  });
});

// The consent request follows only a `signedIn` outcome (P7-03, D-129).
describe('how a login ended (P7-03)', () => {
  it('is signedIn for a login that succeeded, and ignored for a tap while signed in', async () => {
    await startCustomerSession();
    await expect(login()).resolves.toBe('signedIn');
    await expect(login()).resolves.toBe('ignored');
  });

  it.each(['cancel', 'dismiss'] as const)(
    'is cancelled when the browser returns %s',
    async (type) => {
      await startCustomerSession();
      mockBrowser = async () => ({ type });
      await expect(login()).resolves.toBe('cancelled');
    },
  );

  it('is failed for a refused state, a failed exchange, a failed save or a failed discovery', async () => {
    await startCustomerSession();
    mockBrowser = async () => ({
      type: 'success',
      url: callbackUrl({ code: 'test-code-1', state: 'a-state-from-elsewhere' }),
    });
    await expect(login()).resolves.toBe('failed');

    browserSignsIn(() => ({ status: 500, body: {} }));
    await expect(login()).resolves.toBe('failed');

    browserSignsIn();
    mockSecureStoreWriteFails = true;
    await expect(login()).resolves.toBe('failed');
    mockSecureStoreWriteFails = false;

    shopify.discovery = {
      ...TEST_OPENID_CONFIGURATION,
      issuer: 'https://shopify.com/authentication/111111111111',
    };
    resetCustomerSessionForTests();
    await startCustomerSession();
    await expect(login()).resolves.toBe('failed');
    expect(getCustomerSessionState()).toMatchObject({ status: 'signedOut' });
  });

  it('is ignored for a second tap while a login runs, and when login is not set up', async () => {
    await startCustomerSession();
    let finish: (() => void) | undefined;
    mockBrowser = (url) =>
      new Promise((resolve) => {
        const params = authorizationParams(url);
        shopify.tokenAnswers = [exchangeAnswer(params.nonce!)];
        finish = () =>
          resolve({ type: 'success', url: callbackUrl({ code: 'c', state: params.state! }) });
      });
    const first = login();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(login()).resolves.toBe('ignored');
    finish?.();
    await expect(first).resolves.toBe('signedIn');

    resetCustomerSessionForTests();
    mockLoginConfigured = false;
    await startCustomerSession();
    await expect(login()).resolves.toBe('ignored');
  });
});

describe('refresh (D-121)', () => {
  it('refreshes at launch when the access token has 5 minutes or less left', async () => {
    await storeSession(4);
    shopify.tokenAnswers = [refreshAnswer()];

    await startCustomerSession();

    const [call] = shopify.tokenCalls();
    expect(formOf(call!)).toEqual({
      grant_type: 'refresh_token',
      client_id: TEST_CLIENT_ID,
      refresh_token: 'shcrt_stored-refresh-token',
    });
    const stored = await readStoredSession();
    expect(stored).toMatchObject({
      kind: 'session',
      session: {
        accessToken: 'shcat_refreshed-access-token',
        // No new refresh token in the answer: the old one is kept.
        refreshToken: 'shcrt_stored-refresh-token',
      },
    });
    expect(await getValidAccessToken()).toBe('shcat_refreshed-access-token');
  });

  it('does not refresh with 10 minutes left', async () => {
    await storeSession(10);
    await startCustomerSession();
    expect(await getValidAccessToken()).toBe('shcat_stored-access-token');
    expect(shopify.tokenCalls()).toEqual([]);
  });

  it('refreshes when the app returns to the foreground and the token is due', async () => {
    const addListener = jest.spyOn(AppState, 'addEventListener');
    await storeSession(10);
    await startCustomerSession();
    const listener = addListener.mock.calls[0]![1] as (state: string) => void;
    expect(shopify.tokenCalls()).toEqual([]);

    // Six minutes later the token has four left: coming back to the foreground refreshes it.
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60_000);
    shopify.tokenAnswers = [refreshAnswer()];
    listener('background');
    expect(shopify.tokenCalls()).toEqual([]);
    listener('active');
    await refreshSession();

    expect(shopify.tokenCalls()).toHaveLength(1);
    // Refreshed for an hour: not due again.
    await refreshIfDue();
    expect(shopify.tokenCalls()).toHaveLength(1);
  });

  it('runs one refresh for callers that ask at the same time', async () => {
    await storeSession(60);
    await startCustomerSession();
    shopify.tokenAnswers = [refreshAnswer()];
    shopify.holdToken = true;

    const outcomes = Promise.all([refreshSession(), refreshSession(), refreshSession()]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    shopify.release();

    expect(await outcomes).toEqual(['refreshed', 'refreshed', 'refreshed']);
    expect(shopify.tokenCalls()).toHaveLength(1);
  });

  it('saves a new refresh token when Shopify sends one', async () => {
    await storeSession(60);
    await startCustomerSession();
    shopify.tokenAnswers = [refreshAnswer({ refresh_token: 'shcrt_rotated-refresh-token' })];

    expect(await refreshSession()).toBe('refreshed');
    expect(await readStoredSession()).toMatchObject({
      session: { refreshToken: 'shcrt_rotated-refresh-token' },
    });
  });

  it('keeps the old ID token when a refreshed one fails its checks', async () => {
    await storeSession(60);
    await startCustomerSession();
    const before = await readStoredSession();
    shopify.tokenAnswers = [
      refreshAnswer({ id_token: makeIdToken(validClaims(NONCE, { aud: 'another-client' })) }),
    ];

    expect(await refreshSession()).toBe('refreshed');
    const after = await readStoredSession();
    expect(after.kind === 'session' && before.kind === 'session').toBe(true);
    if (after.kind === 'session' && before.kind === 'session') {
      expect(after.session.idToken).toBe(before.session.idToken);
    }
    expect(mockReport).toHaveBeenCalledWith('refresh_audience_mismatch');
  });

  // Answer 3 and change A: only Shopify's invalid_grant logs out.
  it('logs out with the one-line message when Shopify refuses the refresh (invalid_grant)', async () => {
    await storeSession(60);
    await startCustomerSession();
    shopify.tokenAnswers = [{ status: 400, body: { error: 'invalid_grant' } }];

    expect(await refreshSession()).toBe('refused');

    expect(getCustomerSessionState()).toEqual({
      status: 'signedOut',
      notice: 'refused',
      loggingIn: false,
    });
    expect(mockSecureStore.size).toBe(0);
    expect(mockClearAllCaches).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith('refresh_refused');
    expect(await getValidAccessToken()).toBeUndefined();
  });

  it.each([
    [400, 'invalid_client'],
    [401, 'invalid_client'],
    [400, 'invalid_request'],
  ])(
    'stays logged in when the refresh meets HTTP %i %s, reporting its code',
    async (status, error) => {
      await storeSession(60);
      await startCustomerSession();
      const before = new Map(mockSecureStore);
      shopify.tokenAnswers = [{ status, body: { error } }];

      expect(await refreshSession()).toBe('unavailable');

      expect(getCustomerSessionState()).toEqual({
        status: 'signedIn',
        email: 'reader@example.com',
      });
      expect(mockSecureStore).toEqual(before);
      expect(mockClearAllCaches).not.toHaveBeenCalled();
      expect(mockReport).toHaveBeenCalledWith(`refresh_oauth_${error}`);
    },
  );

  it.each([
    ['offline', 'network' as const, undefined],
    ['a server error', { status: 503, body: {} }, 'refresh_http_503'],
    ['too many requests', { status: 429, body: {} }, 'refresh_http_429'],
  ])('stays logged in when the refresh meets %s', async (_case, answer, report) => {
    await storeSession(60);
    await startCustomerSession();
    shopify.tokenAnswers = [answer];

    expect(await refreshSession()).toBe('unavailable');
    expect(getCustomerSessionState()).toMatchObject({ status: 'signedIn' });
    expect(mockClearAllCaches).not.toHaveBeenCalled();
    if (report === undefined) expect(mockReport).not.toHaveBeenCalled();
    else expect(mockReport).toHaveBeenCalledWith(report);
  });

  it('gives no access token once it has expired and Shopify cannot be reached', async () => {
    await storeSession(-1);
    shopify.tokenAnswers = ['network'];
    await startCustomerSession();
    expect(getCustomerSessionState()).toMatchObject({ status: 'signedIn' });
    expect(await getValidAccessToken()).toBeUndefined();
  });

  it('ignores a refresh answer that arrives after a logout', async () => {
    await storeSession(60);
    await startCustomerSession();
    shopify.tokenAnswers = [refreshAnswer()];
    shopify.holdToken = true;

    const outcome = refreshSession();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await logout();
    shopify.release();

    expect(await outcome).toBe('signedOut');
    expect(getCustomerSessionState()).toMatchObject({ status: 'signedOut' });
    expect(mockSecureStore.size).toBe(0);
  });
});

describe('logout (D-122)', () => {
  it("deletes the tokens, empties every cache, then calls Shopify's logout with the ID token", async () => {
    await storeSession(60);
    await startCustomerSession();
    const stored = await readStoredSession();

    await logout();

    expect(getCustomerSessionState()).toEqual({
      status: 'signedOut',
      notice: 'none',
      loggingIn: false,
    });
    expect(mockSecureStore.size).toBe(0);
    expect(mockClearAllCaches).toHaveBeenCalledTimes(1);
    const [call] = shopify.logoutCalls();
    expect(call!.init.method).toBe('GET');
    const hint = new URL(call!.url).searchParams.get('id_token_hint');
    expect(stored.kind === 'session' && hint === stored.session.idToken).toBe(true);
    expect(mockTokenSource()).toEqual([]);
  });

  it('logs out on the phone even when Shopify cannot be reached, reporting the code only', async () => {
    await storeSession(60);
    await startCustomerSession();
    shopify.logoutAnswer = 'network';

    await logout();

    expect(getCustomerSessionState()).toMatchObject({ status: 'signedOut', notice: 'none' });
    expect(mockSecureStore.size).toBe(0);
    expect(mockClearAllCaches).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith('logout_network');
  });

  it('a cold start after logout stays logged out', async () => {
    await storeSession(60);
    await startCustomerSession();
    await logout();

    resetCustomerSessionForTests();
    await startCustomerSession();

    expect(getCustomerSessionState()).toMatchObject({ status: 'signedOut', notice: 'none' });
  });

  it('does nothing when already signed out', async () => {
    await startCustomerSession();
    await logout();
    expect(shopify.calls).toEqual([]);
    expect(mockClearAllCaches).not.toHaveBeenCalled();
  });
});

describe('the scrubber source', () => {
  it('gives the tokens held in memory while signed in', async () => {
    await storeSession(60);
    await startCustomerSession();
    expect(mockTokenSource()).toHaveLength(3);
    expect(mockTokenSource()).toContain('shcat_stored-access-token');
    expect(TEST_SHOP_ID).toBe('987654321012');
  });
});
