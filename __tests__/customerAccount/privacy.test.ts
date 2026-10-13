import {
  login,
  logout,
  refreshSession,
  resetCustomerSessionForTests,
  startCustomerSession,
} from '@/customerAccount/session';

import { TEST_SHOP_ID } from '../helpers/customerAccount';
import {
  authorizationParams,
  callbackUrl,
  exchangeAnswer,
  FakeShopify,
  formOf,
} from '../helpers/customerAccountMocks';

// No token, authorization code, PKCE verifier, nonce, state or email in any log line, analytics
// event or Sentry report (P7-01; D-121, `SECURITY.md`). The flows run through the real session
// module; only Shopify, the browser, the stores and the reporters are stand-ins.

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

let mockBrowser: (url: string) => Promise<{ type: 'success'; url: string } | { type: 'cancel' }>;
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (url: string) => mockBrowser(url),
}));

const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after-first-unlock-this-device-only',
  getItemAsync: async (key: string) => mockSecureStore.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    mockSecureStore.delete(key);
  },
}));

jest.mock('@/config', () => {
  const actual = jest.requireActual<typeof import('@/config')>('@/config');
  return {
    ...actual,
    getStoreConfig: () => ({ storeDomain: 'example-dev.myshopify.com' }),
    getCustomerAccountConfig: () =>
      actual.parseCustomerAccountConfig({
        EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
        EXPO_PUBLIC_SHOP_ID: '987654321012',
      }),
  };
});

const mockSentryCalls: unknown[][] = [];
jest.mock('@/crashReporting/sentry', () => ({
  reportCustomerAccountProblem: (...args: unknown[]) => mockSentryCalls.push(args),
  setCustomerTokenSource: () => undefined,
}));

// Analytics: the module the app's events go through. Login sends no event in P7-01 (D-123), and
// none may carry a token if one is added later.
const mockTrackCalls: unknown[][] = [];
jest.mock(
  '@/analytics/events',
  () =>
    new Proxy(
      {},
      {
        get:
          (_target, name) =>
          (...args: unknown[]) =>
            mockTrackCalls.push([String(name), ...args]),
      },
    ),
);

jest.mock('@/query/queryClient', () => ({ clearAllCaches: () => undefined }));

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;

let shopify: FakeShopify;
const secrets = new Set<string>();

function remember(...values: (string | undefined)[]): void {
  for (const value of values) if (value !== undefined && value.length >= 6) secrets.add(value);
}

beforeEach(() => {
  resetCustomerSessionForTests();
  shopify = new FakeShopify();
  global.fetch = shopify.fetch as unknown as typeof fetch;
  mockSecureStore.clear();
  mockSentryCalls.length = 0;
  mockTrackCalls.length = 0;
  secrets.clear();
  remember('reader@example.com');
  mockBrowser = async (url) => {
    const params = authorizationParams(url);
    const answer = exchangeAnswer(params.nonce!);
    shopify.tokenAnswers = [answer];
    if (answer !== 'network') {
      const body = answer.body as Record<string, string>;
      remember(body.access_token, body.refresh_token, body.id_token);
    }
    remember(params.nonce, params.state, params.code_challenge, 'test-code-1');
    return { type: 'success', url: callbackUrl({ code: 'test-code-1', state: params.state! }) };
  };
});

function everythingSent(consoleSpies: jest.SpyInstance[]): string {
  return JSON.stringify([
    consoleSpies.map((spy) => spy.mock.calls),
    mockSentryCalls,
    mockTrackCalls,
  ]);
}

it('never logs, reports or tracks a token, code, verifier, nonce, state or email', async () => {
  const spies = CONSOLE_METHODS.map((method) =>
    jest.spyOn(console, method).mockImplementation(() => undefined),
  );

  await startCustomerSession();
  // A login that fails at the exchange, then one that succeeds.
  mockBrowser = ((succeed) => async (url: string) => {
    const result = await succeed(url);
    shopify.tokenAnswers = [{ status: 401, body: { error: 'invalid_client' } }];
    return result;
  })(mockBrowser);
  await login();
  const firstExchange = shopify.tokenCalls()[0];
  remember(formOf(firstExchange!).code_verifier);

  resetCustomerSessionForTests();
  await startCustomerSession();
  mockBrowser = async (url) => {
    const params = authorizationParams(url);
    const answer = exchangeAnswer(params.nonce!);
    shopify.tokenAnswers = [answer];
    const body = (answer as { body: Record<string, string> }).body;
    remember(body.access_token, body.refresh_token, body.id_token, params.nonce, params.state);
    return { type: 'success', url: callbackUrl({ code: 'test-code-2', state: params.state! }) };
  };
  remember('test-code-2');
  await login();
  remember(formOf(shopify.tokenCalls().at(-1)!).code_verifier);

  // A refresh that rotates, one Shopify answers with a client error, then a refused one.
  shopify.tokenAnswers = [
    {
      status: 200,
      body: {
        access_token: 'shcat_test-access-0002',
        expires_in: 3600,
        refresh_token: 'shcrt_test-refresh-0002',
      },
    },
  ];
  remember('shcat_test-access-0002', 'shcrt_test-refresh-0002');
  await refreshSession();
  shopify.tokenAnswers = [{ status: 401, body: { error: 'invalid_client' } }];
  await refreshSession();
  shopify.tokenAnswers = [{ status: 400, body: { error: 'invalid_grant' } }];
  await refreshSession();

  // Log in again and log out with Shopify unreachable.
  await login();
  remember(formOf(shopify.tokenCalls().at(-1)!).code_verifier);
  shopify.logoutAnswer = 'network';
  await logout();

  expect(mockSentryCalls.length).toBeGreaterThan(0);
  const sent = everythingSent(spies);
  expect(secrets.size).toBeGreaterThan(10);
  for (const secret of secrets) expect(sent).not.toContain(secret);
  expect(sent).not.toContain(TEST_SHOP_ID);
  expect(sent).not.toMatch(/eyJ|shc[a-z]{1,4}_|code=|@/);
  expect(mockTrackCalls).toEqual([]);
});
