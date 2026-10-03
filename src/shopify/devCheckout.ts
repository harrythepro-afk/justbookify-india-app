/**
 * Development-only helper for P3-01: builds a one-item cart on the development store over the
 * Storefront API and returns its checkout URL, which the test screen opens in Checkout Kit.
 *
 * The two operations are typed by hand. Code generation arrives with the data layer and needs
 * its own decision, so these types cover only the fields read here.
 *
 * Errors carry a fixed kind and our own wording only. Shopify's raw messages, the store's
 * domain, the token and the checkout URL are never put into an error, a log or the screen.
 */

import { getStoreConfig, storefrontEndpoint } from '@/config';

const REQUEST_TIMEOUT_MS = 15_000;

export const DEV_CHECKOUT_PRODUCT_QUERY = `query DevCheckoutProduct {
  products(first: 10) {
    nodes {
      variants(first: 5) {
        nodes {
          id
          availableForSale
        }
      }
    }
  }
}`;

export const DEV_CHECKOUT_CART_CREATE_MUTATION = `mutation DevCheckoutCartCreate($lines: [CartLineInput!]!) {
  cartCreate(input: { lines: $lines }) {
    cart {
      checkoutUrl
    }
    userErrors {
      code
    }
  }
}`;

type DevCheckoutProductData = {
  products: {
    nodes: { variants: { nodes: { id: string; availableForSale: boolean }[] } }[];
  };
};

type DevCheckoutCartCreateData = {
  cartCreate: {
    cart: { checkoutUrl: string } | null;
    userErrors: { code: string | null }[];
  } | null;
};

export type DevCheckoutErrorKind =
  'request-failed' | 'http-error' | 'graphql-error' | 'no-available-variant' | 'cart-rejected';

const MESSAGES: Record<DevCheckoutErrorKind, string> = {
  'request-failed': 'The Storefront API request did not complete.',
  'http-error': 'The Storefront API answered with an HTTP error.',
  'graphql-error': 'The Storefront API returned GraphQL errors.',
  'no-available-variant': 'No product variant on the store is available for sale.',
  'cart-rejected': 'The store did not create the cart.',
};

export class DevCheckoutError extends Error {
  readonly kind: DevCheckoutErrorKind;
  /** HTTP status or Shopify's user-error codes. Codes are enum values, never free text. */
  readonly detail: string | undefined;

  constructor(kind: DevCheckoutErrorKind, detail?: string) {
    super(detail === undefined ? MESSAGES[kind] : `${MESSAGES[kind]} (${detail})`);
    this.name = 'DevCheckoutError';
    this.kind = kind;
    this.detail = detail;
  }
}

async function storefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { storeDomain, storefrontAccessToken } = getStoreConfig();

  // AbortController rather than AbortSignal.timeout, which React Native does not provide.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(storefrontEndpoint(storeDomain), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
  } catch {
    // The underlying error can name the host, so it is not passed on.
    throw new DevCheckoutError('request-failed');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new DevCheckoutError('http-error', `HTTP ${response.status}`);

  const body = (await response.json()) as { data?: T; errors?: unknown[] };
  if ((Array.isArray(body.errors) && body.errors.length > 0) || body.data === undefined) {
    throw new DevCheckoutError('graphql-error');
  }
  return body.data;
}

/** Creates a cart holding one unit of the first variant available for sale. */
export async function createDevCheckoutUrl(): Promise<string> {
  const productData = await storefrontRequest<DevCheckoutProductData>(DEV_CHECKOUT_PRODUCT_QUERY);
  const variant = productData.products.nodes
    .flatMap((product) => product.variants.nodes)
    .find((candidate) => candidate.availableForSale);
  if (variant === undefined) throw new DevCheckoutError('no-available-variant');

  const cartData = await storefrontRequest<DevCheckoutCartCreateData>(
    DEV_CHECKOUT_CART_CREATE_MUTATION,
    { lines: [{ merchandiseId: variant.id, quantity: 1 }] },
  );
  const result = cartData.cartCreate;
  const userErrors = result?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new DevCheckoutError(
      'cart-rejected',
      userErrors.map((error) => error.code ?? 'UNKNOWN').join(', '),
    );
  }
  const checkoutUrl = result?.cart?.checkoutUrl;
  if (checkoutUrl === undefined) throw new DevCheckoutError('cart-rejected');
  return checkoutUrl;
}
