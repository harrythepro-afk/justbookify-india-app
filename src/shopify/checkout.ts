/**
 * Preparing the cart for checkout (P9-01, D-149): one Storefront mutation attaches the customer's
 * Customer Account API access token to the cart as its buyer identity and returns the cart and its
 * checkout URL. Shopify's "Authenticate checkouts" (Checkout Kit) and "Authenticate buyers in
 * checkout" (Customer Account API), read 15 October 2026: pass the access token as
 * `buyerIdentity.customerAccessToken` (`cartBuyerIdentityUpdate`), present the returned
 * `checkoutUrl` promptly ("Authenticated checkout URLs expire"), and update the cart again after a
 * token refresh. So this runs at every "Checkout" tap, and the URL is presented at once, never
 * kept or preloaded.
 *
 * **The token and the cart ID are secrets:** both are variables only, never in an error, a log, an
 * analytics event, a cache key or on screen; `buyerIdentity` is never selected (D-061). The checkout
 * URL carries the cart's key too: it goes from here to Checkout Kit or the browser only.
 */

import type { StoreConfig } from '@/config';

import { toCart, type Cart } from './cart';
import { storefrontMutation } from './client';
import { throwIfUserErrors } from './errors';

// The cart's selection is the same as the four cart operations' (`cart.ts`), copied because an
// operation holds no `${}` interpolation (D-054); `toCart` fails the type check if it drifts.
export const CART_CHECKOUT_PREPARE_MUTATION = `#graphql
mutation CartCheckoutPrepare(
  $cartId: ID!
  $customerAccessToken: String!
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  cartBuyerIdentityUpdate(
    cartId: $cartId
    buyerIdentity: { customerAccessToken: $customerAccessToken, countryCode: $country }
  ) {
    cart {
      checkoutUrl
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

export type PreparedCheckout = {
  readonly cart: Cart;
  /** Holds the cart's key: handed to Checkout Kit or the browser at once, never kept or shown. */
  readonly checkoutUrl: string;
};

type Config = Pick<StoreConfig, 'currencyCode' | 'language' | 'country'>;

/**
 * Attaches the customer to the cart and returns it with its checkout URL; null when Shopify no
 * longer has the cart (expired, or its order was placed). Throws a StorefrontError (user errors as
 * codes only) or a CartDataError. Never retried (D-057).
 */
export async function prepareCheckout(
  cartId: string,
  customerAccessToken: string,
  config: Config,
): Promise<PreparedCheckout | null> {
  const data = await storefrontMutation(CART_CHECKOUT_PREPARE_MUTATION, {
    variables: { cartId, customerAccessToken },
  });
  const payload = data.cartBuyerIdentityUpdate;
  // Refused (user errors as codes): the caller reads the cart to tell a gone cart from the rest.
  throwIfUserErrors('CartCheckoutPrepare', payload?.userErrors);
  const cart = payload?.cart;
  if (cart === null || cart === undefined) return null;
  return { cart: toCart(cart, config), checkoutUrl: cart.checkoutUrl };
}
