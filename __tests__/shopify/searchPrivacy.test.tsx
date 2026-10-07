/**
 * The search term is never logged and never reaches Sentry (owner, P6-06; D-097). A failed search
 * runs through the real Storefront client and the app's query cache, whose one error handler
 * reports to Sentry (D-061); every Sentry entry point is recorded here, and none may carry the
 * term, even when Shopify's own error text repeats it.
 */

import type { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useSearchBooks } from '@/shopify/hooks/search';

import { bookProduct } from '../helpers/catalogue';
import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../helpers/queryClient';

const TERM = 'zzqxv-private-term';

const mockSentry = {
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
  reportFeatureFlagProblem: jest.fn(),
  reportMalformedFeatureFlag: jest.fn(),
  reportAnalyticsProblem: jest.fn(),
};

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: (...args: unknown[]) => mockSentry.reportStorefrontProblem(...args),
  reportUnexpectedDataError: (...args: unknown[]) => mockSentry.reportUnexpectedDataError(...args),
  reportFeatureFlagProblem: (...args: unknown[]) => mockSentry.reportFeatureFlagProblem(...args),
  reportMalformedFeatureFlag: (...args: unknown[]) =>
    mockSentry.reportMalformedFeatureFlag(...args),
  reportAnalyticsProblem: (...args: unknown[]) => mockSentry.reportAnalyticsProblem(...args),
}));

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => ({
    storeDomain: 'example-dev.myshopify.com',
    storefrontAccessToken: 'public-token-for-tests',
    currencyCode: 'INR',
    country: 'IN',
    language: 'EN',
  }),
}));

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

let client: QueryClient;
let fetchMock: jest.SpyInstance;
let consoleSpies: jest.SpyInstance[];

beforeEach(() => {
  client = createTestQueryClient();
  for (const mock of Object.values(mockSentry)) mock.mockReset();
  fetchMock = jest.spyOn(globalThis, 'fetch');
  jest.spyOn(Math, 'random').mockReturnValue(0);
  consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((name) =>
    jest.spyOn(console, name).mockImplementation(() => undefined),
  );
});

afterEach(async () => {
  await tearDownQueryClient(client);
  jest.restoreAllMocks();
});

/** Everything handed to Sentry or the console during the test, as text. */
function everythingReported(): string {
  const calls = [
    ...Object.values(mockSentry).flatMap((mock) => mock.mock.calls),
    ...consoleSpies.flatMap((spy) => spy.mock.calls),
  ];
  return JSON.stringify(calls);
}

async function failedSearch() {
  const { result } = await renderHook(
    () => useSearchBooks(TERM, { available: false, sort: 'relevance' }),
    { wrapper: withQueryClient(client) },
  );
  await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 10_000 });
  // The term did go to Shopify, in the request body only.
  expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).variables.query).toBe(TERM);
}

it('reports a GraphQL error by code and operation name only, never the term', async () => {
  fetchMock.mockResolvedValue(
    response({ errors: [{ message: `Unexpected term ${TERM}`, extensions: { code: 'BAD' } }] }),
  );

  await failedSearch();

  expect(mockSentry.reportStorefrontProblem).toHaveBeenCalledWith(
    'storefront/graphql-error',
    'SearchBooks',
  );
  expect(everythingReported()).not.toContain(TERM);
});

it('reports a server error that survived the retries without the term', async () => {
  fetchMock.mockResolvedValue(response(`Server error for ${TERM}`, 500));

  await failedSearch();

  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(mockSentry.reportStorefrontProblem).toHaveBeenCalledWith(
    'storefront/http-error',
    'SearchBooks',
  );
  expect(everythingReported()).not.toContain(TERM);
});

it('reports an unreadable answer without the term', async () => {
  fetchMock.mockResolvedValue(response(`<html>${TERM}</html>`));

  await failedSearch();

  expect(mockSentry.reportStorefrontProblem).toHaveBeenCalledWith(
    'storefront/invalid-response',
    'SearchBooks',
  );
  expect(everythingReported()).not.toContain(TERM);
});

it('reports a data fault in the results by code only', async () => {
  fetchMock.mockResolvedValue(
    response({
      data: {
        search: {
          totalCount: 1,
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [{ __typename: 'Product', ...bookProduct({ noVariant: true, handle: TERM }) }],
        },
      },
    }),
  );
  const { result } = await renderHook(
    () => useSearchBooks(TERM, { available: false, sort: 'relevance' }),
    { wrapper: withQueryClient(client) },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(everythingReported()).not.toContain(TERM);
});
