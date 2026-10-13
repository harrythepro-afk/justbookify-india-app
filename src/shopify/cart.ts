/**
 * The customer's cart on Shopify (P8-01): one read and three changes over the Storefront Cart API,
 * through the Storefront client (D-056), typed by code generation (D-054). Shopify holds the cart;
 * the app keeps only its ID, in secure storage (`cartStorage.ts`). Mutations are never retried
 * (D-057) and never queued offline (D-065).
 *
 * **The cart ID holds a secret** (`gid://shopify/Cart/<token>?key=<secret>`; Shopify's "Create
 * and update a cart" guide says to treat it like a password). It is passed only as a variable, so
 * it never reaches an error, a log, an analytics event, a cache key or the screen. Line IDs carry
 * the cart's token too and stay in memory.
 *
 * The four operations select the same cart fields. They cannot share a fragment, because an
 * operation holds no `${}` interpolation (D-054); `toCart` takes the CartRead type, so the type
 * check fails if another operation stops matching it. No personal field is selected: no buyer
 * identity, no delivery address, no note (D-061).
 */

import type { StoreConfig } from '@/config';

import { toBookCard, type BookCard, type BookCardProduct } from './bookCard';
import { storefrontMutation, storefrontQuery } from './client';
import { StorefrontError, throwIfUserErrors } from './errors';
import type { CartReadQuery } from './generated/storefront.generated';

/** More lines than any cart under the order cap can hold (R2: ₹500 at ₹34 or more a book). */
export const CART_LINES_LIMIT = 100;

export const CART_READ_QUERY = `#graphql
query CartRead($cartId: ID!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  cart(id: $cartId) {
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            availableForSale
            currentlyNotInStock
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            product {
              id
              handle
              title
              vendor
              featuredImage {
                url(transform: { maxWidth: 600 })
                width
                height
                altText
              }
            }
          }
        }
      }
    }
  }
}` as const;

// The cart's market comes from buyerIdentity, which Shopify saves with the cart (D-058). The
// customer's identity is attached at checkout, in Phase 9.
export const CART_CREATE_MUTATION = `#graphql
mutation CartCreate($lines: [CartLineInput!]!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: $country } }) {
    cart {
      id
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
      }
      lines(first: 100) {
        nodes {
          id
          quantity
          cost {
            subtotalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              availableForSale
              currentlyNotInStock
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              product {
                id
                handle
                title
                vendor
                featuredImage {
                  url(transform: { maxWidth: 600 })
                  width
                  height
                  altText
                }
              }
            }
          }
        }
      }
    }
    userErrors {
      code
    }
  }
}` as const;

export const CART_LINES_ADD_MUTATION = `#graphql
mutation CartLinesAdd(
  $cartId: ID!
  $lines: [CartLineInput!]!
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
      }
      lines(first: 100) {
        nodes {
          id
          quantity
          cost {
            subtotalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              availableForSale
              currentlyNotInStock
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              product {
                id
                handle
                title
                vendor
                featuredImage {
                  url(transform: { maxWidth: 600 })
                  width
                  height
                  altText
                }
              }
            }
          }
        }
      }
    }
    userErrors {
      code
    }
  }
}` as const;

export const CART_LINES_REMOVE_MUTATION = `#graphql
mutation CartLinesRemove(
  $cartId: ID!
  $lineIds: [ID!]!
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
    cart {
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
      }
      lines(first: 100) {
        nodes {
          id
          quantity
          cost {
            subtotalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              availableForSale
              currentlyNotInStock
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              product {
                id
                handle
                title
                vendor
                featuredImage {
                  url(transform: { maxWidth: 600 })
                  width
                  height
                  altText
                }
              }
            }
          }
        }
      }
    }
    userErrors {
      code
    }
  }
}` as const;

/** The cart as one of the four operations selects it. */
export type CartFields = NonNullable<CartReadQuery['cart']>;

/** One book in the cart: the card's fields, with the line it sits on. */
export type CartBook = BookCard & {
  /** The cart line's ID. Carries the cart's token: memory only, never shown or sent. */
  readonly lineId: string;
  /**
   * Rented out now: Shopify no longer sells the book, or set its line to zero (P8-01, answer 5).
   * Shown with "Rented Out" and "Remove", and not counted in the subtotal shown.
   */
  readonly rentedOut: boolean;
  /** Shopify's amount for the line, in the store's currency; 0 for a rented-out book. */
  readonly countedAmount: number;
};

export type Cart = {
  readonly books: readonly CartBook[];
  /** Shopify's own `cost.subtotalAmount`. */
  readonly shopifySubtotal: number;
  /**
   * The subtotal the app shows and checks the cap against: Shopify's subtotal, or with a
   * rented-out book in the cart, the sum of Shopify's amounts for the books that can be ordered.
   */
  readonly countedSubtotal: number;
  readonly hasRentedOut: boolean;
};

/** The cart a customer has before adding anything, or after the stored one is gone. */
export const EMPTY_CART: Cart = {
  books: [],
  shopifySubtotal: 0,
  countedSubtotal: 0,
  hasRentedOut: false,
};

export type CartDataErrorKind = 'currency-mismatch' | 'cart-rejected';

const MESSAGES: Record<CartDataErrorKind, string> = {
  'currency-mismatch': "The cart's amounts are not in the configured currency.",
  'cart-rejected': 'The store did not return the cart.',
};

/** A cart response the app must not use. Our own wording only, never Shopify's values. */
export class CartDataError extends Error {
  readonly kind: CartDataErrorKind;
  /** For crash reports: matches the pattern `safeErrorCode()` passes through (D-061). */
  readonly code: `cart/${CartDataErrorKind}`;

  constructor(kind: CartDataErrorKind) {
    super(MESSAGES[kind]);
    this.name = 'CartDataError';
    this.kind = kind;
    this.code = `cart/${kind}`;
  }
}

type Money = { readonly amount: unknown; readonly currencyCode: string };
type Config = Pick<StoreConfig, 'currencyCode' | 'language' | 'country'>;

function amountIn(money: Money, currencyCode: string): number {
  if (money.currencyCode !== currencyCode) throw new CartDataError('currency-mismatch');
  return Number(money.amount);
}

type CartLineNode = CartFields['lines']['nodes'][number];

function toCartBook(line: CartLineNode, config: Config): CartBook | null {
  const variant = line.merchandise;
  // Every line the app adds is a product variant; anything else is skipped.
  if (!('product' in variant) || variant.product === undefined) return null;
  const { product, ...variantFields } = variant;
  const shaped: BookCardProduct = { ...product, variants: { nodes: [variantFields] } };
  const card = toBookCard(shaped, config);
  if (card === null) return null;
  const lineAmount = amountIn(line.cost.subtotalAmount, config.currencyCode);
  const rentedOut = !card.orderable || line.quantity <= 0;
  return { ...card, lineId: line.id, rentedOut, countedAmount: rentedOut ? 0 : lineAmount };
}

/** What the app shows for a cart, with the subtotal it counts (P8-01, answer 5). */
export function toCart(cart: CartFields, config: Config): Cart {
  const shopifySubtotal = amountIn(cart.cost.subtotalAmount, config.currencyCode);
  const books = cart.lines.nodes
    .map((line) => toCartBook(line, config))
    .filter((book): book is CartBook => book !== null);
  const hasRentedOut = books.some((book) => book.rentedOut);
  const countedSubtotal = hasRentedOut
    ? books.reduce((sum, book) => sum + book.countedAmount, 0)
    : shopifySubtotal;
  return { books, shopifySubtotal, countedSubtotal, hasRentedOut };
}

type Signal = { readonly signal?: AbortSignal };

/** Reads the cart; null when Shopify has no such cart (expired, or its order was placed). */
export async function readCart(
  cartId: string,
  config: Config,
  { signal }: Signal = {},
): Promise<Cart | null> {
  const data = await storefrontQuery(CART_READ_QUERY, { variables: { cartId }, signal });
  return data.cart === null || data.cart === undefined ? null : toCart(data.cart, config);
}

/** Creates a cart holding one copy of the variant; returns its ID and the cart. */
export async function createCart(
  variantId: string,
  config: Config,
): Promise<{ readonly cartId: string; readonly cart: Cart }> {
  const data = await storefrontMutation(CART_CREATE_MUTATION, {
    variables: { lines: [{ merchandiseId: variantId, quantity: 1 }] },
  });
  throwIfUserErrors('CartCreate', data.cartCreate?.userErrors);
  const cart = data.cartCreate?.cart;
  if (cart === null || cart === undefined) throw new CartDataError('cart-rejected');
  return { cartId: cart.id, cart: toCart(cart, config) };
}

/** Adds one copy of the variant to the cart. */
export async function addCartLine(
  cartId: string,
  variantId: string,
  config: Config,
): Promise<Cart> {
  const data = await storefrontMutation(CART_LINES_ADD_MUTATION, {
    variables: { cartId, lines: [{ merchandiseId: variantId, quantity: 1 }] },
  });
  throwIfUserErrors('CartLinesAdd', data.cartLinesAdd?.userErrors);
  const cart = data.cartLinesAdd?.cart;
  if (cart === null || cart === undefined) throw new CartDataError('cart-rejected');
  return toCart(cart, config);
}

/** Removes one line from the cart. */
export async function removeCartLine(
  cartId: string,
  lineId: string,
  config: Config,
): Promise<Cart> {
  const data = await storefrontMutation(CART_LINES_REMOVE_MUTATION, {
    variables: { cartId, lineIds: [lineId] },
  });
  throwIfUserErrors('CartLinesRemove', data.cartLinesRemove?.userErrors);
  const cart = data.cartLinesRemove?.cart;
  if (cart === null || cart === undefined) throw new CartDataError('cart-rejected');
  return toCart(cart, config);
}

/** Shopify's code for merchandise that cannot be added, such as a book just rented out. */
export const MERCHANDISE_NOT_APPLICABLE = 'MERCHANDISE_NOT_APPLICABLE';

/** Whether a failed change was refused by Shopify (user errors), not lost on the way. */
export function isUserErrors(error: unknown): error is StorefrontError {
  return error instanceof StorefrontError && error.kind === 'user-errors';
}
