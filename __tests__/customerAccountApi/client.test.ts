import type { EndpointResult } from '@/customerAccount/apiEndpoint';
import type { CustomerSessionState, RefreshOutcome } from '@/customerAccount/session';
import { customerAccountQuery } from '@/customerAccountApi/client';
import { CustomerAccountApiError } from '@/customerAccountApi/errors';
import { CUSTOMER_ORDERS_QUERY } from '@/customerAccountApi/orders';
import { CUSTOMER_PROFILE_QUERY } from '@/customerAccountApi/profile';
import { ATTEMPT_TIMEOUT_MS, CALL_TIME_LIMIT_MS } from '@/graphql/transport';

import {
  jsonResponse,
  MARKERS,
  profileData,
  TEST_ACCESS_TOKEN,
  TEST_ENDPOINT,
  TEST_FRESH_TOKEN,
} from '../helpers/customerAccountApi';

let mockEndpoint: EndpointResult = { ok: true, endpoint: TEST_ENDPOINT };
let mockTokens: (string | undefined)[] = [];
let mockRefresh: RefreshOutcome = 'refreshed';
let mockState: CustomerSessionState = { status: 'signedIn' };
const mockRefreshCalls = jest.fn();

jest.mock('@/customerAccount/apiEndpoint', () => ({
  getCustomerAccountApiEndpoint: () => Promise.resolve(mockEndpoint),
}));
jest.mock('@/customerAccount/session', () => ({
  getValidAccessToken: () => Promise.resolve(mockTokens.shift()),
  refreshSession: () => {
    mockRefreshCalls();
    return Promise.resolve(mockRefresh);
  },
  getCustomerSessionState: () => mockState,
}));

const SENSITIVE = [
  TEST_ACCESS_TOKEN,
  TEST_FRESH_TOKEN,
  TEST_ENDPOINT,
  'shopify.com',
  MARKERS.email,
  MARKERS.firstName,
  MARKERS.phone,
];

const PROFILE = { data: profileData() };

/** A fetch that never answers; it fails only when its signal aborts, as React Native's does. */
function hangingFetch(_url: string, init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(new TypeError(`Aborted ${TEST_ENDPOINT}`)));
  });
}

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock = jest.spyOn(globalThis, 'fetch');
  jest.spyOn(Math, 'random').mockReturnValue(0);
  mockEndpoint = { ok: true, endpoint: TEST_ENDPOINT };
  mockTokens = [TEST_ACCESS_TOKEN, TEST_FRESH_TOKEN];
  mockRefresh = 'refreshed';
  mockState = { status: 'signedIn' };
  mockRefreshCalls.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function settle<T>(promise: Promise<T>): Promise<{ value?: T; error?: unknown }> {
  return promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
}

function expectSafeError(
  error: unknown,
  kind: CustomerAccountApiError['kind'],
): CustomerAccountApiError {
  expect(error).toBeInstanceOf(CustomerAccountApiError);
  const apiError = error as CustomerAccountApiError;
  expect(apiError.kind).toBe(kind);
  expect(apiError.code).toBe(`customer-account-api/${kind}`);
  for (const text of [apiError.message, JSON.stringify(apiError)]) {
    for (const value of SENSITIVE) expect(text).not.toContain(value);
  }
  return apiError;
}

function authorizationOf(call: number): unknown {
  return (fetchMock.mock.calls[call][1].headers as Record<string, string>).Authorization;
}

describe('requests', () => {
  it('posts the operation to the endpoint with the access token as it is, no Bearer', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(PROFILE));

    await expect(customerAccountQuery(CUSTOMER_PROFILE_QUERY)).resolves.toEqual(PROFILE.data);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TEST_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(authorizationOf(0)).toBe(TEST_ACCESS_TOKEN);
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({
      query: CUSTOMER_PROFILE_QUERY,
      variables: {},
    });
  });

  it("sends the caller's variables", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: { customer: { orders: { pageInfo: {}, nodes: [] } } } }),
    );

    await customerAccountQuery(CUSTOMER_ORDERS_QUERY, {
      variables: { first: 20, after: 'cursor-1', lineItems: 20 },
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).variables).toEqual({
      first: 20,
      after: 'cursor-1',
      lineItems: 20,
    });
  });
});

describe('no token or no endpoint: no request', () => {
  it('fails signed-out when the customer is signed out', async () => {
    mockTokens = [undefined];
    mockState = { status: 'signedOut', notice: 'none', loggingIn: false };

    expectSafeError(
      (await settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY))).error,
      'signed-out',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails unavailable when still signed in but no fresh token could be had (D-121)', async () => {
    mockTokens = [undefined];

    expectSafeError(
      (await settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY))).error,
      'unavailable',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['no-network', 'timeout', 'unavailable'] as const)(
    'fails %s when the endpoint could not be read that way',
    async (reason) => {
      mockEndpoint = { ok: false, reason };

      expectSafeError((await settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY))).error, reason);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('does not call Shopify when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const { error } = await settle(
      customerAccountQuery(CUSTOMER_PROFILE_QUERY, { signal: controller.signal }),
    );

    expectSafeError(error, 'cancelled');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('a 401 refreshes once, then follows D-121', () => {
  it('refreshes and tries once more with the new token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse('', 401));
    fetchMock.mockResolvedValueOnce(jsonResponse(PROFILE));

    await expect(customerAccountQuery(CUSTOMER_PROFILE_QUERY)).resolves.toEqual(PROFILE.data);

    expect(mockRefreshCalls).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authorizationOf(0)).toBe(TEST_ACCESS_TOKEN);
    expect(authorizationOf(1)).toBe(TEST_FRESH_TOKEN);
  });

  it('fails unauthorized after a second 401, without a second refresh', async () => {
    fetchMock.mockResolvedValue(jsonResponse('', 401));

    const apiError = expectSafeError(
      (await settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY))).error,
      'unauthorized',
    );

    expect(apiError.status).toBe(401);
    expect(mockRefreshCalls).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(['refused', 'signedOut'] as const)(
    'fails signed-out when the refresh answers %s, with no second request',
    async (outcome) => {
      mockRefresh = outcome;
      fetchMock.mockResolvedValue(jsonResponse('', 401));

      expectSafeError(
        (await settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY))).error,
        'signed-out',
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it('fails unauthorized, and does not sign out, when the refresh is unavailable', async () => {
    mockRefresh = 'unavailable';
    fetchMock.mockResolvedValue(jsonResponse('', 401));

    expectSafeError(
      (await settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY))).error,
      'unauthorized',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for a 403', async () => {
    fetchMock.mockResolvedValue(jsonResponse('', 403));

    const apiError = expectSafeError(
      (await settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY))).error,
      'http-error',
    );

    expect(apiError.status).toBe(403);
    expect(mockRefreshCalls).not.toHaveBeenCalled();
  });
});

describe('retries for queries (D-057, the shared transport)', () => {
  it('retries a server error twice, then fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse('', 503));

    const outcome = settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY));
    await jest.advanceTimersByTimeAsync(10_000);

    expectSafeError((await outcome).error, 'http-error');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('honours Retry-After on a 429, the per-customer limit', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse('', 429, { 'Retry-After': '2' }));
    fetchMock.mockResolvedValueOnce(jsonResponse(PROFILE));

    const outcome = settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY));
    await jest.advanceTimersByTimeAsync(1_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);

    expect((await outcome).value).toEqual(PROFILE.data);
  });

  it('retries THROTTLED sent with HTTP 200, the cost limit', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }] }),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(PROFILE));

    const outcome = settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY));
    await jest.advanceTimersByTimeAsync(1_000);

    expect((await outcome).value).toEqual(PROFILE.data);
  });

  it("keeps Shopify's codes but never its messages", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        errors: [
          {
            message: `Field error for ${MARKERS.email} with ${TEST_ACCESS_TOKEN}`,
            extensions: { code: 'ACCESS_DENIED' },
          },
        ],
      }),
    );

    const apiError = expectSafeError(
      (await settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY))).error,
      'graphql-error',
    );
    expect(apiError.codes).toEqual(['ACCESS_DENIED']);
    expect(apiError.operationName).toBe('CustomerProfile');
  });

  it('times out one attempt after 15 seconds and ends the call within 30', async () => {
    fetchMock.mockImplementation(hangingFetch);

    const outcome = settle(customerAccountQuery(CUSTOMER_PROFILE_QUERY));
    await jest.advanceTimersByTimeAsync(ATTEMPT_TIMEOUT_MS);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    await jest.advanceTimersByTimeAsync(CALL_TIME_LIMIT_MS);

    expectSafeError((await outcome).error, 'timeout');
  });
});
