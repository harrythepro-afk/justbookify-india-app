/**
 * Hooks for the development test checkout screen (D-063): the screen reads through the app's
 * cache and never calls the Storefront client. Errors are reported by the cache (D-061).
 */

import { useMutation, useQuery } from '@tanstack/react-query';

import { freshness } from '@/query/freshness';

import {
  createDevCheckout,
  listDevCheckoutVariants,
  type DevCheckoutCart,
  type DevCheckoutLine,
} from '../devCheckout';
import { storefrontKeys } from '../queryKeys';

export {
  DevCheckoutError,
  MAX_DEV_CHECKOUT_QUANTITY,
  type DevCheckoutCart,
  type DevCheckoutLine,
  type DevCheckoutVariant,
} from '../devCheckout';

/**
 * The store's variants available for sale. They show availability and prices, so they use the
 * `liveStock` preset (D-062). Nothing is read while `enabled` is false.
 */
export function useDevCheckoutVariants(enabled: boolean) {
  return useQuery({
    queryKey: storefrontKeys.devCheckout.variants(),
    queryFn: ({ signal }) => listDevCheckoutVariants({ signal }),
    enabled,
    ...freshness.liveStock,
  });
}

/** Creates a test cart. Never retried (D-057). */
export function useCreateDevCheckout() {
  return useMutation<DevCheckoutCart, Error, readonly DevCheckoutLine[]>({
    mutationKey: storefrontKeys.devCheckout.createCart(),
    mutationFn: (lines) => createDevCheckout(lines),
  });
}
