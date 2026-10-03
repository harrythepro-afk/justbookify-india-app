/**
 * Development-only helper for the test screen (P3-01, P3-02): lists the development store's
 * variants and builds a cart from chosen quantities over the Storefront API. The test screen
 * opens the cart's checkout URL in Checkout Kit and shows the subtotal Shopify reports, so the
 * tester can reach each cart bracket of early check 2.
 *
 * The two operations are typed by hand. Code generation arrives with the data layer and needs
 * its own decision, so these types cover only the fields read here.
 *
 * Errors carry a fixed kind and our own wording only. Shopify's raw messages, the store's
 * domain, the token and the checkout URL are never put into an error, a log or the screen.
 */

import { getStoreConfig, storefrontEndpoint } from '@/config';

const REQUEST_TIMEOUT_MS = 15_000;

/** Highest quantity of one variant the test screen puts in a cart. */
export const MAX_DEV_CHECKOUT_QUANTITY = 10;

// Shopify names a variant "Default Title" when its product has no options.
const DEFAULT_VARIANT_TITLE = 'Default Title';

export const DEV_CHECKOUT_PRODUCT_QUERY = `query DevCheckoutProduct {
  products(first: 10) {
    nodes {
      title
      variants(first: 5) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
}`;

export const DEV_CHECKOUT_CART_CREATE_MUTATION = `mutation DevCheckoutCartCreate($lines: [CartLineInput!]!) {
  cartCreate(input: { lines: $lines }) {
    cart {
      checkoutUrl
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
      }
    }
    userErrors {
      code
    }
    warnings {
      code
    }
  }
}`;

type Money = { amount: string; currencyCode: string };

type DevCheckoutProductData = {
  products: {
    nodes: {
      title: string;
      variants: { nodes: { id: string; title: string; availableForSale: boolean; price: Money }[] };
    }[];
  };
};

type DevCheckoutCartCreateData = {
  cartCreate: {
    cart: { checkoutUrl: string; cost: { subtotalAmount: Money } } | null;
    userErrors: { code: string | null }[];
    warnings: { code: string }[];
  } | null;
};

export type DevCheckoutVariant = {
  readonly id: string;
  /** Product title, plus the variant title when the product has options. */
  readonly title: string;
  /** Price in major currency units. */
  readonly price: number;
  readonly currencyCode: string;
};

export type DevCheckoutLine = { readonly merchandiseId: string; readonly quantity: number };

export type DevCheckoutCart = {
  readonly checkoutUrl: string;
  /** Shopify's subtotal, which reflects any quantity it adjusted for stock. */
  readonly subtotal: number;
  readonly currencyCode: string;
  /** Shopify's cart warning codes, such as MERCHANDISE_NOT_ENOUGH_STOCK. Enum values only. */
  readonly warningCodes: readonly string[];
};

export type DevCheckoutErrorKind =
  | 'request-failed'
  | 'http-error'
  | 'graphql-error'
  | 'no-available-variant'
  | 'invalid-lines'
  | 'cart-rejected';

const MESSAGES: Record<DevCheckoutErrorKind, string> = {
  'request-failed': 'The Storefront API request did not complete.',
  'http-error': 'The Storefront API answered with an HTTP error.',
  'graphql-error': 'The Storefront API returned GraphQL errors.',
  'no-available-variant': 'No product variant on the store is available for sale.',
  'invalid-lines': `The test cart needs at least one book, each with a quantity from 1 to ${MAX_DEV_CHECKOUT_QUANTITY}.`,
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

/** Lists the store's variants that are available for sale, in the store's product order. */
export async function listDevCheckoutVariants(): Promise<DevCheckoutVariant[]> {
  const data = await storefrontRequest<DevCheckoutProductData>(DEV_CHECKOUT_PRODUCT_QUERY);
  const variants = data.products.nodes.flatMap((product) =>
    product.variants.nodes
      .filter((variant) => variant.availableForSale)
      .map((variant) => ({
        id: variant.id,
        title:
          variant.title === DEFAULT_VARIANT_TITLE
            ? product.title
            : `${product.title} (${variant.title})`,
        price: Number(variant.price.amount),
        currencyCode: variant.price.currencyCode,
      })),
  );
  if (variants.length === 0) throw new DevCheckoutError('no-available-variant');
  return variants;
}

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_DEV_CHECKOUT_QUANTITY;
}

/** Creates a cart from the given lines and returns its checkout URL and Shopify's subtotal. */
export async function createDevCheckout(
  lines: readonly DevCheckoutLine[],
): Promise<DevCheckoutCart> {
  if (lines.length === 0 || !lines.every((line) => isValidQuantity(line.quantity))) {
    throw new DevCheckoutError('invalid-lines');
  }

  const data = await storefrontRequest<DevCheckoutCartCreateData>(
    DEV_CHECKOUT_CART_CREATE_MUTATION,
    { lines: lines.map(({ merchandiseId, quantity }) => ({ merchandiseId, quantity })) },
  );
  const result = data.cartCreate;
  const userErrors = result?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new DevCheckoutError(
      'cart-rejected',
      userErrors.map((error) => error.code ?? 'UNKNOWN').join(', '),
    );
  }
  const cart = result?.cart;
  if (cart === null || cart === undefined) throw new DevCheckoutError('cart-rejected');
  return {
    checkoutUrl: cart.checkoutUrl,
    subtotal: Number(cart.cost.subtotalAmount.amount),
    currencyCode: cart.cost.subtotalAmount.currencyCode,
    warningCodes: (result?.warnings ?? []).map((warning) => warning.code),
  };
}
