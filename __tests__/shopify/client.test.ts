import type { StoreConfig } from '@/config/store';
import {
  ATTEMPT_TIMEOUT_MS,
  CALL_TIME_LIMIT_MS,
  operationNameOf,
  storefrontMutation,
  storefrontQuery,
} from '@/shopify/client';
import { CART_CREATE_MUTATION, CART_READ_QUERY } from '@/shopify/cart';
import { StorefrontError } from '@/shopify/errors';

// Fake values only. The tests check that none of them reaches an error.
const STORE_DOMAIN = 'example-dev-store.myshopify.com';
const TOKEN = 'public-token-for-tests';
const VARIANT_ID = 'gid://shopify/ProductVariant/private-777';
const CART_ID = 'gid://shopify/Cart/test-cart?key=private-cart-key';
const SHOPIFY_TEXT = `Access denied for ${STORE_DOMAIN}`;
const SENSITIVE = [
  STORE_DOMAIN,
  TOKEN,
  VARIANT_ID,
  SHOPIFY_TEXT,
  'private-777',
  CART_ID,
  'private-cart-key',
];

const mockConfig: StoreConfig = {
  storeDomain: STORE_DOMAIN,
  storefrontAccessToken: TOKEN,
  currencyCode: 'INR',
  country: 'IN',
  language: 'EN',
  shippingFeePrepaid: 75,
  shippingFeeCod: 125,
  freeDeliveryThreshold: 200,
  shippingDiscount: 75,
  orderCap: 500,
  deliveryPincodeRanges: [{ from: 10, to: 13 }],
};

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => mockConfig,
}));

const PRODUCTS = { data: { products: { nodes: [] } } };
const LINES = [{ merchandiseId: VARIANT_ID, quantity: 1 }];
// The query the tests send: CartRead, which needs the cart's ID (P9-01 removed the test checkout
// screen's product query, which needed none).
const READ = { variables: { cartId: CART_ID } } as const;

function response(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

/** A fetch that never answers; it fails only when its signal aborts, as React Native's does. */
function hangingFetch(_url: string, init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () =>
      reject(new TypeError(`Aborted request to ${STORE_DOMAIN}`)),
    );
  });
}

/** A fetch that answers after `ms`, unless its signal aborts first. */
function delayedFetch(ms: number, answer: Response) {
  return (_url: string, init: RequestInit): Promise<Response> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(answer), ms);
      init.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new TypeError('Aborted'));
      });
    });
}

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock = jest.spyOn(globalThis, 'fetch');
  // No jitter unless a test sets its own.
  jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function requestBody(call: number): { query: string; variables: Record<string, unknown> } {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

/** Starts a call and captures its outcome, so a rejection is never left unhandled. */
function settle<T>(promise: Promise<T>): Promise<{ value?: T; error?: unknown }> {
  return promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
}

function expectSafeError(error: unknown, kind: StorefrontError['kind']): StorefrontError {
  expect(error).toBeInstanceOf(StorefrontError);
  const storefrontError = error as StorefrontError;
  expect(storefrontError.kind).toBe(kind);
  expect(storefrontError.code).toBe(`storefront/${kind}`);
  for (const text of [storefrontError.message, JSON.stringify(storefrontError)]) {
    for (const value of SENSITIVE) expect(text).not.toContain(value);
  }
  return storefrontError;
}

describe('requests', () => {
  it('posts the operation to the pinned endpoint with the public token', async () => {
    fetchMock.mockResolvedValueOnce(response(PRODUCTS));

    await expect(storefrontQuery(CART_READ_QUERY, READ)).resolves.toEqual(PRODUCTS.data);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://${STORE_DOMAIN}/api/2026-10/graphql.json`);
    expect(init.method).toBe('POST');
    expect(init.headers['X-Shopify-Storefront-Access-Token']).toBe(TOKEN);
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(requestBody(0).query).toBe(CART_READ_QUERY);
  });

  it('adds the buyer context from the store configuration to every operation', async () => {
    fetchMock.mockResolvedValueOnce(response(PRODUCTS));
    fetchMock.mockResolvedValueOnce(response({ data: { cartCreate: null } }));

    await storefrontQuery(CART_READ_QUERY, READ);
    await storefrontMutation(CART_CREATE_MUTATION, { variables: { lines: LINES } });

    expect(requestBody(0).variables).toEqual({ cartId: CART_ID, country: 'IN', language: 'EN' });
    expect(requestBody(1).variables).toEqual({ lines: LINES, country: 'IN', language: 'EN' });
  });

  it('does not let a caller replace the buyer context', async () => {
    fetchMock.mockResolvedValueOnce(response({ data: { cartCreate: null } }));
    const variables = { lines: LINES, country: 'BH', language: 'AR' } as never;

    await storefrontMutation(CART_CREATE_MUTATION, { variables });

    expect(requestBody(0).variables).toMatchObject({ country: 'IN', language: 'EN' });
  });

  it("reads each operation's own name", () => {
    expect(operationNameOf(CART_READ_QUERY)).toBe('CartRead');
    expect(operationNameOf(CART_CREATE_MUTATION)).toBe('CartCreate');
    expect(operationNameOf('{ shop { name } }')).toBe('UnnamedOperation');
  });
});

describe('error mapping', () => {
  // Mutations are used where a query's retries would only repeat the same outcome.
  const mutate = () => storefrontMutation(CART_CREATE_MUTATION, { variables: { lines: LINES } });

  it('maps a failed fetch to no-network, without the underlying text', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError(`Network request to ${STORE_DOMAIN} failed`));

    const { error } = await settle(mutate());

    const storefrontError = expectSafeError(error, 'no-network');
    expect(storefrontError.operationName).toBe('CartCreate');
    expect(storefrontError.retryable).toBe(true);
  });

  it('maps an attempt that runs past 15 seconds to timeout', async () => {
    fetchMock.mockImplementation(hangingFetch);

    const outcome = settle(mutate());
    await jest.advanceTimersByTimeAsync(ATTEMPT_TIMEOUT_MS - 1);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    expectSafeError((await outcome).error, 'timeout');
  });

  it("maps the caller's cancel to cancelled", async () => {
    fetchMock.mockImplementation(hangingFetch);
    const controller = new AbortController();

    const outcome = settle(
      storefrontQuery(CART_READ_QUERY, { ...READ, signal: controller.signal }),
    );
    await jest.advanceTimersByTimeAsync(100);
    controller.abort();

    expectSafeError((await outcome).error, 'cancelled');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not call the store when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const { error } = await settle(
      storefrontQuery(CART_READ_QUERY, { ...READ, signal: controller.signal }),
    );

    expectSafeError(error, 'cancelled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps HTTP 429 to throttled', async () => {
    fetchMock.mockResolvedValueOnce(response(SHOPIFY_TEXT, 429));

    const error = expectSafeError((await settle(mutate())).error, 'throttled');
    expect(error.status).toBe(429);
  });

  it('maps a THROTTLED GraphQL error to throttled', async () => {
    fetchMock.mockResolvedValueOnce(
      response({ errors: [{ message: SHOPIFY_TEXT, extensions: { code: 'THROTTLED' } }] }),
    );

    const error = expectSafeError((await settle(mutate())).error, 'throttled');
    expect(error.codes).toEqual(['THROTTLED']);
  });

  it.each([401, 403, 404, 430, 500])(
    'maps HTTP %i to http-error with its status',
    async (status) => {
      fetchMock.mockResolvedValueOnce(response(SHOPIFY_TEXT, status));

      const error = expectSafeError((await settle(mutate())).error, 'http-error');
      expect(error.status).toBe(status);
      expect(error.message).toContain(`HTTP ${status}`);
    },
  );

  it.each([
    ['a body that is not JSON', `<html>${SHOPIFY_TEXT}</html>`],
    ['a JSON body that is not an object', '"text"'],
    ['no data', {}],
    ['null data', { data: null }],
  ])('maps %s to invalid-response', async (_name, body) => {
    fetchMock.mockResolvedValueOnce(response(body));

    expectSafeError((await settle(mutate())).error, 'invalid-response');
  });

  it("maps GraphQL errors to graphql-error, keeping only Shopify's enum codes", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        data: { cartCreate: null },
        errors: [
          { message: SHOPIFY_TEXT, extensions: { code: 'ACCESS_DENIED' } },
          { message: SHOPIFY_TEXT, extensions: { code: `denied for ${VARIANT_ID}` } },
          { message: SHOPIFY_TEXT },
        ],
      }),
    );

    const error = expectSafeError((await settle(mutate())).error, 'graphql-error');
    expect(error.codes).toEqual(['ACCESS_DENIED']);
    expect(error.retryable).toBe(false);
  });
});

describe('retries', () => {
  it('retries a query after a server error and returns the later answer', async () => {
    fetchMock
      .mockResolvedValueOnce(response(SHOPIFY_TEXT, 503))
      .mockResolvedValueOnce(response(PRODUCTS));

    const outcome = settle(storefrontQuery(CART_READ_QUERY, READ));
    await jest.advanceTimersByTimeAsync(0);

    expect((await outcome).value).toEqual(PRODUCTS.data);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('tries a query at most three times', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const outcome = settle(storefrontQuery(CART_READ_QUERY, READ));
    await jest.advanceTimersByTimeAsync(100);

    expectSafeError((await outcome).error, 'no-network');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['throttling', () => response('', 429)],
    ['HTTP 500', () => response('', 500)],
    ['HTTP 502', () => response('', 502)],
    ['HTTP 504', () => response('', 504)],
  ])('retries a query after %s', async (_name, answer) => {
    fetchMock.mockResolvedValueOnce(answer()).mockResolvedValueOnce(response(PRODUCTS));

    const outcome = settle(storefrontQuery(CART_READ_QUERY, READ));
    await jest.advanceTimersByTimeAsync(0);

    expect((await outcome).value).toEqual(PRODUCTS.data);
  });

  it.each([
    ['HTTP 401', () => response('', 401)],
    ['HTTP 404', () => response('', 404)],
    ['a GraphQL error', () => response({ errors: [{ message: 'x' }] })],
    ['an invalid response', () => response('not json')],
  ])('does not retry a query after %s', async (_name, answer) => {
    fetchMock.mockResolvedValue(answer());

    await settle(storefrontQuery(CART_READ_QUERY, READ));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['no network', () => Promise.reject(new TypeError('Network request failed'))],
    ['HTTP 503', () => Promise.resolve(response('', 503))],
    ['throttling', () => Promise.resolve(response('', 429))],
  ])('never retries a mutation, even after %s', async (_name, answer) => {
    fetchMock.mockImplementation(answer);

    const outcome = settle(
      storefrontMutation(CART_CREATE_MUTATION, { variables: { lines: LINES } }),
    );
    await jest.advanceTimersByTimeAsync(CALL_TIME_LIMIT_MS);

    expect((await outcome).error).toBeInstanceOf(StorefrontError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('waits a random time within the backoff bounds: up to 0.5 s, then up to 1 s', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const outcome = settle(storefrontQuery(CART_READ_QUERY, READ));
    await jest.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(498);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(997);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    expectSafeError((await outcome).error, 'no-network');
  });

  it('honours a Retry-After of up to 10 seconds', async () => {
    fetchMock
      .mockResolvedValueOnce(response('', 503, { 'Retry-After': '3' }))
      .mockResolvedValueOnce(response(PRODUCTS));

    const outcome = settle(storefrontQuery(CART_READ_QUERY, READ));
    await jest.advanceTimersByTimeAsync(2_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);

    expect((await outcome).value).toEqual(PRODUCTS.data);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up when Retry-After asks for more than 10 seconds', async () => {
    fetchMock.mockResolvedValue(response('', 429, { 'Retry-After': '11' }));

    const error = expectSafeError(
      (await settle(storefrontQuery(CART_READ_QUERY, READ))).error,
      'throttled',
    );
    expect(error.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops waiting between retries when the caller cancels', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const controller = new AbortController();

    const outcome = settle(
      storefrontQuery(CART_READ_QUERY, { ...READ, signal: controller.signal }),
    );
    await jest.advanceTimersByTimeAsync(100);
    controller.abort();

    expectSafeError((await outcome).error, 'cancelled');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('the 30-second limit on one call', () => {
  it('ends a query whose attempts keep timing out by 30 seconds', async () => {
    fetchMock.mockImplementation(hangingFetch);

    const outcome = settle(storefrontQuery(CART_READ_QUERY, READ));
    await jest.advanceTimersByTimeAsync(CALL_TIME_LIMIT_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    let settled = false;
    void outcome.then(() => (settled = true));
    await jest.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);

    expectSafeError((await outcome).error, 'timeout');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shortens the last attempt to the time left', async () => {
    // 503 with Retry-After 10 s, then a 15-second timeout, leave 5 seconds for a third attempt.
    fetchMock
      .mockResolvedValueOnce(response('', 503, { 'Retry-After': '10' }))
      .mockImplementationOnce(hangingFetch)
      .mockImplementationOnce(hangingFetch);

    const outcome = settle(storefrontQuery(CART_READ_QUERY, READ));
    await jest.advanceTimersByTimeAsync(25_010);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const lastSignal = fetchMock.mock.calls[2][1].signal as AbortSignal;
    await jest.advanceTimersByTimeAsync(4_989);
    expect(lastSignal.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    expect(lastSignal.aborted).toBe(true);
    expectSafeError((await outcome).error, 'timeout');
  });

  it('starts no retry with less than 2 seconds left after its wait', async () => {
    // First attempt times out at 15 s; the second answers 503 at 27 s with Retry-After 2 s,
    // which would leave 1 second.
    fetchMock
      .mockImplementationOnce(hangingFetch)
      .mockImplementationOnce(delayedFetch(12_000, response('', 503, { 'Retry-After': '2' })));

    const outcome = settle(storefrontQuery(CART_READ_QUERY, READ));
    await jest.advanceTimersByTimeAsync(15_010);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(12_000);

    const error = expectSafeError((await outcome).error, 'http-error');
    expect(error.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
