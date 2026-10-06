/**
 * Development-only helper for the test screen (P3-01, P3-02): lists the development store's
 * variants and builds a cart from chosen quantities over the Storefront API. The test screen
 * opens the cart's checkout URL in Checkout Kit and shows the subtotal Shopify reports, so the
 * tester can reach each cart bracket of early check 2.
 *
 * Both operations go through the Storefront client (src/shopify/client.ts) and are typed by
 * code generation (D-054). Transport failures and Shopify's user errors arrive as a
 * StorefrontError; this file's own checks throw a DevCheckoutError. Both carry our own wording
 * only: Shopify's raw messages, the store's domain, the token and the checkout URL are never put
 * into an error, a log or the screen.
 */

import { storefrontMutation, storefrontQuery } from './client';
import { throwIfUserErrors } from './errors';

/** Highest quantity of one variant the test screen puts in a cart. */
export const MAX_DEV_CHECKOUT_QUANTITY = 10;

// Shopify names a variant "Default Title" when its product has no options.
const DEFAULT_VARIANT_TITLE = 'Default Title';

export const DEV_CHECKOUT_PRODUCT_QUERY = `#graphql
query DevCheckoutProduct($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
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
}` as const;

// The cart's market comes from buyerIdentity, which Shopify saves with the cart (D-058).
export const DEV_CHECKOUT_CART_CREATE_MUTATION = `#graphql
mutation DevCheckoutCartCreate(
  $lines: [CartLineInput!]!
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: $country } }) {
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
}` as const;

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

export type DevCheckoutErrorKind = 'no-available-variant' | 'invalid-lines' | 'cart-rejected';

const MESSAGES: Record<DevCheckoutErrorKind, string> = {
  'no-available-variant': 'No product variant on the store is available for sale.',
  'invalid-lines': `The test cart needs at least one book, each with a quantity from 1 to ${MAX_DEV_CHECKOUT_QUANTITY}.`,
  'cart-rejected': 'The store did not create the cart.',
};

export class DevCheckoutError extends Error {
  readonly kind: DevCheckoutErrorKind;
  /** For crash reports: matches the pattern `safeErrorCode()` passes through (D-061). */
  readonly code: `devCheckout/${DevCheckoutErrorKind}`;

  constructor(kind: DevCheckoutErrorKind) {
    super(MESSAGES[kind]);
    this.name = 'DevCheckoutError';
    this.kind = kind;
    this.code = `devCheckout/${kind}`;
  }
}

/**
 * Lists the store's variants that are available for sale, in the store's product order.
 * `signal` cancels the call; the query cache passes its own (D-061).
 */
export async function listDevCheckoutVariants(
  options: { readonly signal?: AbortSignal } = {},
): Promise<DevCheckoutVariant[]> {
  const data = await storefrontQuery(DEV_CHECKOUT_PRODUCT_QUERY, { signal: options.signal });
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

  const data = await storefrontMutation(DEV_CHECKOUT_CART_CREATE_MUTATION, {
    variables: { lines: lines.map(({ merchandiseId, quantity }) => ({ merchandiseId, quantity })) },
  });
  const result = data.cartCreate;
  throwIfUserErrors('DevCheckoutCartCreate', result?.userErrors);
  const cart = result?.cart;
  if (cart === null || cart === undefined) throw new DevCheckoutError('cart-rejected');
  return {
    checkoutUrl: cart.checkoutUrl,
    subtotal: Number(cart.cost.subtotalAmount.amount),
    currencyCode: cart.cost.subtotalAmount.currencyCode,
    warningCodes: (result?.warnings ?? []).map((warning) => warning.code),
  };
}
