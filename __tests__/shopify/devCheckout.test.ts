import type { StoreConfig } from '@/config/store';
import {
  createDevCheckoutUrl,
  DEV_CHECKOUT_CART_CREATE_MUTATION,
  DEV_CHECKOUT_PRODUCT_QUERY,
  DevCheckoutError,
} from '@/shopify/devCheckout';

// Fake values only. The test checks they never reach an error message.
const STORE_DOMAIN = 'example-dev-store.myshopify.com';
const TOKEN = 'public-token-for-tests';
const CHECKOUT_URL = `https://${STORE_DOMAIN}/cart/c/test-cart?key=secret-key`;

const mockConfig: StoreConfig = {
  storeDomain: STORE_DOMAIN,
  storefrontAccessToken: TOKEN,
  currencyCode: 'INR',
  shippingFeePrepaid: 75,
  shippingFeeCod: 125,
  freeDeliveryThreshold: 200,
  orderCap: 500,
  deliveryPincodeRanges: [{ from: 10, to: 13 }],
};

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => mockConfig,
}));

const PRODUCTS = {
  data: {
    products: {
      nodes: [
        {
          variants: { nodes: [{ id: 'gid://shopify/ProductVariant/1', availableForSale: false }] },
        },
        { variants: { nodes: [{ id: 'gid://shopify/ProductVariant/2', availableForSale: true }] } },
      ],
    },
  },
};

const CART_CREATED = {
  data: { cartCreate: { cart: { checkoutUrl: CHECKOUT_URL }, userErrors: [] } },
};

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  fetchMock.mockRestore();
});

function requestBody(call: number): { query: string; variables?: Record<string, unknown> } {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

async function expectDevCheckoutError(kind: DevCheckoutError['kind']): Promise<DevCheckoutError> {
  const error: unknown = await createDevCheckoutUrl().catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(DevCheckoutError);
  const devError = error as DevCheckoutError;
  expect(devError.kind).toBe(kind);
  expect(devError.message).not.toContain(STORE_DOMAIN);
  expect(devError.message).not.toContain(TOKEN);
  return devError;
}

describe('createDevCheckoutUrl', () => {
  it('creates a one-item cart with the first available variant and returns its checkout URL', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(PRODUCTS))
      .mockResolvedValueOnce(jsonResponse(CART_CREATED));

    await expect(createDevCheckoutUrl()).resolves.toBe(CHECKOUT_URL);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://${STORE_DOMAIN}/api/2026-10/graphql.json`);
    expect(init.method).toBe('POST');
    expect(init.headers['X-Shopify-Storefront-Access-Token']).toBe(TOKEN);
    expect(requestBody(0).query).toBe(DEV_CHECKOUT_PRODUCT_QUERY);
    expect(requestBody(1)).toEqual({
      query: DEV_CHECKOUT_CART_CREATE_MUTATION,
      variables: { lines: [{ merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 1 }] },
    });
  });

  it('uses named operations only', () => {
    expect(DEV_CHECKOUT_PRODUCT_QUERY).toMatch(/^query DevCheckoutProduct /);
    expect(DEV_CHECKOUT_CART_CREATE_MUTATION).toMatch(/^mutation DevCheckoutCartCreate\(/);
  });

  it('fails without the host when the request does not complete', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError(`Network request to ${STORE_DOMAIN} failed`));

    await expectDevCheckoutError('request-failed');
  });

  it('reports the HTTP status of a failed response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));

    const error = await expectDevCheckoutError('http-error');
    expect(error.detail).toBe('HTTP 401');
  });

  it('fails on GraphQL errors without passing on their text', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ errors: [{ message: `Access denied for ${STORE_DOMAIN}` }] }),
    );

    await expectDevCheckoutError('graphql-error');
  });

  it('fails when no variant is available for sale', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          products: {
            nodes: [
              {
                variants: {
                  nodes: [{ id: 'gid://shopify/ProductVariant/1', availableForSale: false }],
                },
              },
            ],
          },
        },
      }),
    );

    await expectDevCheckoutError('no-available-variant');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails with the user-error codes when the store rejects the cart', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(PRODUCTS)).mockResolvedValueOnce(
      jsonResponse({
        data: { cartCreate: { cart: null, userErrors: [{ code: 'INVALID_MERCHANDISE_LINE' }] } },
      }),
    );

    const error = await expectDevCheckoutError('cart-rejected');
    expect(error.detail).toBe('INVALID_MERCHANDISE_LINE');
  });

  it('fails when the store returns no cart and no user errors', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(PRODUCTS))
      .mockResolvedValueOnce(jsonResponse({ data: { cartCreate: null } }));

    await expectDevCheckoutError('cart-rejected');
  });
});
