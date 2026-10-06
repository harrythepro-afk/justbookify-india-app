import type { StoreConfig } from '@/config/store';
import {
  createDevCheckout,
  DEV_CHECKOUT_CART_CREATE_MUTATION,
  DEV_CHECKOUT_PRODUCT_QUERY,
  DevCheckoutError,
  listDevCheckoutVariants,
  type DevCheckoutLine,
} from '@/shopify/devCheckout';
import { StorefrontError } from '@/shopify/errors';

// Fake values only. The test checks they never reach an error message.
const STORE_DOMAIN = 'example-dev-store.myshopify.com';
const TOKEN = 'public-token-for-tests';
const CHECKOUT_URL = `https://${STORE_DOMAIN}/cart/c/test-cart?key=secret-key`;

const mockConfig: StoreConfig = {
  storeDomain: STORE_DOMAIN,
  storefrontAccessToken: TOKEN,
  currencyCode: 'INR',
  country: 'IN',
  language: 'EN',
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

const SOLD_OUT_PRODUCT = {
  title: 'Sold Out Book',
  variants: {
    nodes: [
      {
        id: 'gid://shopify/ProductVariant/1',
        title: 'Default Title',
        availableForSale: false,
        price: { amount: '49.0', currencyCode: 'INR' },
      },
    ],
  },
};

const PRODUCTS = {
  data: {
    products: {
      nodes: [
        SOLD_OUT_PRODUCT,
        {
          title: 'Picture Book',
          variants: {
            nodes: [
              {
                id: 'gid://shopify/ProductVariant/2',
                title: 'Default Title',
                availableForSale: true,
                price: { amount: '99.0', currencyCode: 'INR' },
              },
              {
                id: 'gid://shopify/ProductVariant/3',
                title: 'Hardcover',
                availableForSale: true,
                price: { amount: '149.5', currencyCode: 'INR' },
              },
            ],
          },
        },
      ],
    },
  },
};

const LINES: DevCheckoutLine[] = [
  { merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 3 },
  { merchandiseId: 'gid://shopify/ProductVariant/3', quantity: 1 },
];

const CART_CREATE = {
  cart: {
    checkoutUrl: CHECKOUT_URL,
    cost: { subtotalAmount: { amount: '446.5', currencyCode: 'INR' } },
  },
  userErrors: [],
  warnings: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
  } as Response;
}

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
});

function requestBody(call: number): { query: string; variables?: Record<string, unknown> } {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

async function expectDevCheckoutError(
  promise: Promise<unknown>,
  kind: DevCheckoutError['kind'],
): Promise<DevCheckoutError> {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(DevCheckoutError);
  const devError = error as DevCheckoutError;
  expect(devError.kind).toBe(kind);
  expect(devError.message).not.toContain(STORE_DOMAIN);
  expect(devError.message).not.toContain(TOKEN);
  return devError;
}

async function expectStorefrontError(
  promise: Promise<unknown>,
  kind: StorefrontError['kind'],
): Promise<StorefrontError> {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(StorefrontError);
  const storefrontError = error as StorefrontError;
  expect(storefrontError.kind).toBe(kind);
  for (const text of [storefrontError.message, JSON.stringify(storefrontError)]) {
    expect(text).not.toContain(STORE_DOMAIN);
    expect(text).not.toContain(TOKEN);
    expect(text).not.toContain(CHECKOUT_URL);
  }
  return storefrontError;
}

describe('listDevCheckoutVariants', () => {
  it('lists the variants available for sale with their titles and prices', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(PRODUCTS));

    await expect(listDevCheckoutVariants()).resolves.toEqual([
      {
        id: 'gid://shopify/ProductVariant/2',
        title: 'Picture Book',
        price: 99,
        currencyCode: 'INR',
      },
      {
        id: 'gid://shopify/ProductVariant/3',
        title: 'Picture Book (Hardcover)',
        price: 149.5,
        currencyCode: 'INR',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://${STORE_DOMAIN}/api/2026-10/graphql.json`);
    expect(init.method).toBe('POST');
    expect(init.headers['X-Shopify-Storefront-Access-Token']).toBe(TOKEN);
    expect(requestBody(0).query).toBe(DEV_CHECKOUT_PRODUCT_QUERY);
  });

  it('fails when no variant is available for sale', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: { products: { nodes: [SOLD_OUT_PRODUCT] } } }),
    );

    await expectDevCheckoutError(listDevCheckoutVariants(), 'no-available-variant');
  });

  it('sends the buyer context from the store configuration', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(PRODUCTS));

    await listDevCheckoutVariants();

    expect(requestBody(0).variables).toEqual({ country: 'IN', language: 'EN' });
  });

  it('fails without the host when the request does not complete, after retrying', async () => {
    // No wait between retries.
    jest.spyOn(Math, 'random').mockReturnValue(0);
    fetchMock.mockRejectedValue(new TypeError(`Network request to ${STORE_DOMAIN} failed`));

    await expectStorefrontError(listDevCheckoutVariants(), 'no-network');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('reports the HTTP status of a failed response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));

    const error = await expectStorefrontError(listDevCheckoutVariants(), 'http-error');
    expect(error.status).toBe(401);
  });

  it('fails on GraphQL errors without passing on their text', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ errors: [{ message: `Access denied for ${STORE_DOMAIN}` }] }),
    );

    await expectStorefrontError(listDevCheckoutVariants(), 'graphql-error');
  });
});

describe('createDevCheckout', () => {
  it("creates a cart with the chosen quantities and returns Shopify's subtotal", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { cartCreate: CART_CREATE } }));

    await expect(createDevCheckout(LINES)).resolves.toEqual({
      checkoutUrl: CHECKOUT_URL,
      subtotal: 446.5,
      currencyCode: 'INR',
      warningCodes: [],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestBody(0)).toEqual({
      query: DEV_CHECKOUT_CART_CREATE_MUTATION,
      variables: { lines: LINES, country: 'IN', language: 'EN' },
    });
  });

  it("returns Shopify's warning codes, such as a quantity cut for stock", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          cartCreate: { ...CART_CREATE, warnings: [{ code: 'MERCHANDISE_NOT_ENOUGH_STOCK' }] },
        },
      }),
    );

    const cart = await createDevCheckout(LINES);
    expect(cart.warningCodes).toEqual(['MERCHANDISE_NOT_ENOUGH_STOCK']);
  });

  it('uses named operations only', () => {
    expect(DEV_CHECKOUT_PRODUCT_QUERY).toMatch(/^#graphql\nquery DevCheckoutProduct\(/);
    expect(DEV_CHECKOUT_CART_CREATE_MUTATION).toMatch(
      /^#graphql\nmutation DevCheckoutCartCreate\(/,
    );
  });

  it("creates the cart in the configured country's market", () => {
    expect(DEV_CHECKOUT_CART_CREATE_MUTATION).toContain('buyerIdentity: { countryCode: $country }');
  });

  it('never retries the cart mutation', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503));

    await expectStorefrontError(createDevCheckout(LINES), 'http-error');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each<[string, DevCheckoutLine[]]>([
    ['no lines', []],
    ['a zero quantity', [{ merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 0 }]],
    ['a quantity over 10', [{ merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 11 }]],
    ['a fractional quantity', [{ merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 1.5 }]],
  ])('refuses %s without calling the store', async (_name, lines) => {
    await expectDevCheckoutError(createDevCheckout(lines), 'invalid-lines');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails with the user-error codes when the store rejects the cart', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          cartCreate: {
            cart: null,
            userErrors: [{ code: 'INVALID_MERCHANDISE_LINE' }],
            warnings: [],
          },
        },
      }),
    );

    const error = await expectStorefrontError(createDevCheckout(LINES), 'user-errors');
    expect(error.codes).toEqual(['INVALID_MERCHANDISE_LINE']);
  });

  it('fails when the store returns no cart and no user errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { cartCreate: null } }));

    await expectDevCheckoutError(createDevCheckout(LINES), 'cart-rejected');
  });

  it('fails on GraphQL errors without passing on their text', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ errors: [{ message: `Cart failed for ${CHECKOUT_URL}` }] }),
    );

    await expectStorefrontError(createDevCheckout(LINES), 'graphql-error');
  });
});
