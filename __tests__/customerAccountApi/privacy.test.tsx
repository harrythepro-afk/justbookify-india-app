import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MyBooksScreen from '@/app/(tabs)/my-books';
import { AccountProfile } from '@/components/AccountProfile';
import { ERROR_MESSAGE } from '@/components/ScreenMessage';
import type { CustomerSessionState, RefreshOutcome } from '@/customerAccount/session';
import { resetReportedCustomerAccountApiFaultsForTests } from '@/customerAccountApi/errors';
import { customerKeys } from '@/customerAccountApi/queryKeys';
import { clearAllCaches } from '@/query/queryClient';

import {
  jsonResponse,
  MARKERS,
  orderNode,
  ordersData,
  profileData,
  TEST_ACCESS_TOKEN,
  TEST_ENDPOINT,
  TEST_FRESH_TOKEN,
} from '../helpers/customerAccountApi';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';

// No profile or order value, and no token, in any log line, analytics event or Sentry report
// (P7-02; D-127, `SECURITY.md`). The real transport, client, mapping, query cache, hooks and both
// screens run; only Shopify, the session, the discovery read and the reporters are stand-ins.

void ScrollView;

let mockSession: CustomerSessionState = { status: 'signedIn' };
let mockTokens: (string | undefined)[] = [];
let mockRefresh: RefreshOutcome = 'refreshed';
jest.mock('@/customerAccount/session', () => ({
  useCustomerSession: () => mockSession,
  getCustomerSessionState: () => mockSession,
  getValidAccessToken: () => Promise.resolve(mockTokens.shift()),
  refreshSession: () => Promise.resolve(mockRefresh),
  login: () => undefined,
  logout: () => undefined,
}));

jest.mock('@/customerAccount/apiEndpoint', () => ({
  getCustomerAccountApiEndpoint: () =>
    Promise.resolve({
      ok: true,
      endpoint: 'https://shopify.com/987654321012/account/customer/api/2026-04/graphql',
    }),
}));

// Every Sentry entry point the data layer can reach.
const mockSentryCalls: unknown[][] = [];
jest.mock('@/crashReporting/sentry', () => ({
  reportCustomerAccountApiProblem: (...args: unknown[]) =>
    mockSentryCalls.push(['customerAccountApi', ...args]),
  reportCustomerAccountProblem: (...args: unknown[]) =>
    mockSentryCalls.push(['customerAccount', ...args]),
  reportStorefrontProblem: (...args: unknown[]) => mockSentryCalls.push(['storefront', ...args]),
  reportUnexpectedDataError: (...args: unknown[]) => mockSentryCalls.push(['unexpected', ...args]),
}));

// Analytics: no event is sent by these screens; none may carry a customer value.
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

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appEnv: 'development' } } },
}));

const SECRETS = [
  MARKERS.firstName,
  MARKERS.lastName,
  MARKERS.email,
  MARKERS.phone,
  ...MARKERS.addressLines,
  MARKERS.orderName,
  MARKERS.orderId,
  '7731',
  MARKERS.bookTitle,
  MARKERS.lineItemId,
  TEST_ACCESS_TOKEN,
  TEST_FRESH_TOKEN,
  TEST_ENDPOINT,
  '987654321012',
];

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;
const consoleCalls: unknown[][] = [];

const SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

let client: QueryClient;
let fetchMock: jest.SpyInstance;
// Queries emptied from the cache while their screens were still shown (a logout). Unmounting
// those screens later starts each one's garbage-collection timer, which nothing would clear and
// which would hold Jest open, so they are destroyed after the screens are gone.
let removedWhileShown: ReturnType<ReturnType<QueryClient['getQueryCache']>['findAll']> = [];

/** Logs out as session.ts does, with the screens still on show. */
async function logOutWhileShown(): Promise<void> {
  removedWhileShown = client.getQueryCache().findAll({ queryKey: customerKeys.all });
  mockSession = { status: 'signedOut', notice: 'none', loggingIn: false };
  await clearAllCaches(client);
}

function Screens({ children }: { readonly children?: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={SAFE_AREA}>
      <QueryClientProvider client={client}>
        <MyBooksScreen />
        <AccountProfile />
        {children}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** Shopify's answer to each operation, by name. */
function answerBy(answer: (operation: 'profile' | 'orders') => Response | Promise<Response>) {
  fetchMock.mockImplementation((_url: string, init: RequestInit) => {
    const { query } = JSON.parse(init.body as string) as { query: string };
    return Promise.resolve(answer(query.includes('CustomerProfile') ? 'profile' : 'orders'));
  });
}

const GOOD = (operation: 'profile' | 'orders') =>
  jsonResponse({
    data: operation === 'profile' ? profileData() : ordersData([orderNode()]),
  });

// Shopify's error text holding every marker: it must never be passed on.
const LEAKY_ERRORS = jsonResponse({
  errors: [{ message: SECRETS.join(' | '), extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
});

beforeEach(() => {
  client = createTestQueryClient();
  fetchMock = jest.spyOn(globalThis, 'fetch');
  jest.spyOn(Math, 'random').mockReturnValue(0);
  for (const method of CONSOLE_METHODS) {
    jest.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      consoleCalls.push([method, ...args]);
    });
  }
  mockSession = { status: 'signedIn' };
  mockTokens = [TEST_ACCESS_TOKEN, TEST_FRESH_TOKEN, TEST_FRESH_TOKEN, TEST_FRESH_TOKEN];
  mockRefresh = 'refreshed';
  mockSentryCalls.length = 0;
  mockTrackCalls.length = 0;
  consoleCalls.length = 0;
  resetReportedCustomerAccountApiFaultsForTests();
});

afterEach(async () => {
  await tearDownQueryClient(client);
  for (const query of removedWhileShown) query.destroy();
  removedWhileShown = [];
  jest.restoreAllMocks();
});

function expectNothingLeaked(): void {
  const sent = JSON.stringify([mockSentryCalls, mockTrackCalls, consoleCalls]);
  for (const secret of SECRETS) expect(sent).not.toContain(secret);
  expect(sent).not.toMatch(/shcat_|@example\.com|gid:\/\/shopify/);
  expect(mockTrackCalls).toEqual([]);
}

it('shows the profile and orders on screen, and nowhere else', async () => {
  answerBy(GOOD);
  await render(<Screens />);

  await screen.findByText(MARKERS.email);
  await screen.findByText(MARKERS.bookTitle);
  expectNothingLeaked();
});

it("reports Shopify's GraphQL errors by code only", async () => {
  answerBy(() => LEAKY_ERRORS);
  await render(<Screens />);

  await waitFor(() => expect(screen.getAllByText(ERROR_MESSAGE)).toHaveLength(2));
  expect(mockSentryCalls).toContainEqual([
    'customerAccountApi',
    'customer-account-api/graphql-error',
    'CustomerProfile',
  ]);
  expectNothingLeaked();
});

it('reports server errors after the retries by code only', async () => {
  answerBy(() => jsonResponse(SECRETS.join(' '), 503));
  await render(<Screens />);

  await waitFor(() => expect(screen.getAllByText(ERROR_MESSAGE)).toHaveLength(2));
  expect(fetchMock).toHaveBeenCalledTimes(6);
  expect(mockSentryCalls.length).toBeGreaterThan(0);
  expectNothingLeaked();
});

it.each<[RefreshOutcome, number]>([
  ['refreshed', 1],
  ['refused', 0],
  ['unavailable', 1],
])('after a 401 and a refresh that is %s, nothing leaks', async (outcome) => {
  mockRefresh = outcome;
  answerBy(() => jsonResponse(SECRETS.join(' '), 401));
  await render(<Screens />);

  await waitFor(() => expect(screen.getAllByText(ERROR_MESSAGE)).toHaveLength(2));
  expectNothingLeaked();
});

it('a refresh that works shows the data with the new token', async () => {
  let calls = 0;
  answerBy((operation) => {
    calls += 1;
    return calls <= 2 ? jsonResponse('', 401) : GOOD(operation);
  });
  await render(<Screens />);

  await screen.findByText(MARKERS.email);
  await screen.findByText(MARKERS.bookTitle);
  expectNothingLeaked();
});

it('logout during a read leaves no customer data in the cache (D-061, D-121)', async () => {
  fetchMock.mockImplementation(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new TypeError('aborted')));
      }),
  );
  await render(<Screens />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

  await logOutWhileShown();

  expect(client.getQueryCache().findAll({ queryKey: customerKeys.all })).toEqual([]);
  expectNothingLeaked();
});

it('after logout with data on screen, the cache holds no customer data', async () => {
  answerBy(GOOD);
  const view = await render(<Screens />);
  await screen.findByText(MARKERS.bookTitle);

  await logOutWhileShown();
  await view.rerender(<Screens />);

  expect(client.getQueryCache().findAll({ queryKey: customerKeys.all })).toEqual([]);
  expect(screen.queryByText(MARKERS.bookTitle)).toBeNull();
  expect(screen.queryByText(MARKERS.email)).toBeNull();
  expectNothingLeaked();
});
