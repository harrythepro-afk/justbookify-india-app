/**
 * Hooks for the cart (P8-01, D-063): screens read the cart through the app's cache and change it
 * through these hooks only; errors are reported by the cache (D-061).
 *
 * - One query for the cart, under `['storefront', 'cart', 'current', <forgets>]`, with the
 *   `liveStock` preset (D-062): the Cart tab reads Shopify again every time it opens and every
 *   time it regains focus. Card buttons and the tab's count share the same data without reading
 *   on every mount. A forgotten cart gets a new key, so it is never shown again, even when the
 *   cache is emptied after the screens' last redraw ("Log out").
 * - **One change at a time, app-wide.** A second tap on any "Add to Cart" or "Remove" while a
 *   change runs is ignored (`busy`), synchronously, before anything else, so a double tap never
 *   adds twice and two quick adds never create two carts.
 * - Changes are mutations: never retried (D-057), never paused or queued offline (D-065).
 */

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import { getStoreConfig } from '@/config';
import { freshness } from '@/query/freshness';

import { formatPrice, storeLocale } from '../bookCard';
import { EMPTY_CART, type Cart } from '../cart';
import {
  addBookToCart,
  cartLineFor,
  readCartOrForget,
  removeBookFromCart,
  type AddOutcome,
  type BookToAdd,
  type RemoveOutcome,
} from '../cartChanges';
import {
  cartForgetCount,
  cartGeneration,
  getCartIdState,
  loadCartId,
  subscribeCartId,
} from '../cartId';
import { StorefrontError } from '../errors';
import { storefrontKeys } from '../queryKeys';

export { EMPTY_CART, type Cart, type CartBook } from '../cart';
export type { AddOutcome, BookToAdd, RemoveOutcome } from '../cartChanges';
export { fitsUnderCap, isAtOrOverCap, wholeAmountLeft } from '../orderCap';

/** The cart's cache key now: a new one each time a cart is forgotten (`cartId.ts`). */
function cartKey() {
  return storefrontKeys.cart.current(cartForgetCount());
}

/** The order cap (R2) from the store configuration, in the store's currency. */
export function orderCapAmount(): number {
  return getStoreConfig().orderCap;
}

/** An amount in the store's currency format, such as "₹500" (as the card's prices, P6-02). */
export function formatCartAmount(amount: number): string {
  const config = getStoreConfig();
  return formatPrice(amount, config.currencyCode, storeLocale(config));
}

/** The change running now, if any: which book is being added or which line removed. */
export type PendingCartChange =
  | { readonly kind: 'add'; readonly variantId: string }
  | { readonly kind: 'remove'; readonly lineId: string }
  | null;

let pending: PendingCartChange = null;
const pendingListeners = new Set<() => void>();

function setPending(next: PendingCartChange): void {
  pending = next;
  for (const listener of pendingListeners) listener();
}

function subscribePending(listener: () => void): () => void {
  pendingListeners.add(listener);
  return () => pendingListeners.delete(listener);
}

function getPending(): PendingCartChange {
  return pending;
}

/** Tests only: no change running. */
export function resetCartChangesForTests(): void {
  pending = null;
  pendingListeners.clear();
}

/** The change running now, for buttons that show "Adding…" or "Removing…". */
export function usePendingCartChange(): PendingCartChange {
  return useSyncExternalStore(subscribePending, getPending);
}

/** The cart ID's state: read once per launch (answer 4), never the ID itself to a screen. */
function useCartIdReady(): boolean {
  useEffect(() => {
    void loadCartId();
  }, []);
  return useSyncExternalStore(subscribeCartId, getCartIdState).status === 'ready';
}

async function fetchCart(signal: AbortSignal): Promise<Cart> {
  const startedAt = cartGeneration();
  const state = getCartIdState();
  if (state.status !== 'ready' || state.cartId === null) return EMPTY_CART;
  const cart = await readCartOrForget(state.cartId, { signal });
  // A logout during the read: the forgotten cart is never shown again.
  return cartGeneration() === startedAt ? cart : EMPTY_CART;
}

/**
 * The cart for the Cart tab: read again whenever the tab opens and whenever it regains focus
 * (`liveStock`, D-062), because a book in it can be rented out at any time (answer 5).
 */
export function useCart() {
  const ready = useCartIdReady();
  const query = useQuery({
    queryKey: cartKey(),
    queryFn: ({ signal }) => fetchCart(signal),
    enabled: ready,
    ...freshness.liveStock,
  });
  const queryClient = useQueryClient();
  const firstFocus = useRef(true);
  // A tab stays mounted, so its opening is a focus: the first one is the mount's own read.
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void queryClient.refetchQueries({ queryKey: storefrontKeys.cart.all(), type: 'active' });
    }, [queryClient]),
  );
  return query;
}

/**
 * The cart for book buttons and the tab's count: the same data, read once and then only when
 * stale (30 seconds) on the app's return to the foreground, never on every card's mount.
 */
export function useCartSummary(): Cart | undefined {
  const ready = useCartIdReady();
  return useQuery({
    queryKey: cartKey(),
    queryFn: ({ signal }) => fetchCart(signal),
    enabled: ready,
    ...freshness.liveStock,
    refetchOnMount: false,
  }).data;
}

/** The number of books in the cart, rented-out ones included (plan review, answer (b)). */
export function useCartCount(): number {
  return useCartSummary()?.books.length ?? 0;
}

/** What a book's cart button shows (answers 1 and 6). */
export type CartButtonState = 'add' | 'adding' | 'in-cart';

export function useCartButtonState(variantId: string): CartButtonState {
  const cart = useCartSummary();
  const change = usePendingCartChange();
  if (change?.kind === 'add' && change.variantId === variantId) return 'adding';
  return cart !== undefined && cartLineFor(cart, variantId) !== undefined ? 'in-cart' : 'add';
}

/** How a change ended for the screen: Shopify's answer, ignored, or not reached. */
export type CartChangeFailure =
  { readonly kind: 'busy' } | { readonly kind: 'failed'; readonly offline: boolean };

function isOfflineFailure(error: unknown): boolean {
  return error instanceof StorefrontError && error.kind === 'no-network';
}

function saveCart(queryClient: QueryClient, outcome: AddOutcome | RemoveOutcome): void {
  if (outcome.kind !== 'stale') queryClient.setQueryData(cartKey(), outcome.cart);
}

/**
 * Adds a book (`cartChanges.ts`). Resolves with how it ended; never throws. A book found rented
 * out marks the catalogue stale, so its card and page show "Rented Out" when they next read.
 */
export function useAddToCart(): (book: BookToAdd) => Promise<AddOutcome | CartChangeFailure> {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation<AddOutcome, Error, BookToAdd>({
    mutationKey: storefrontKeys.cart.change(),
    mutationFn: (book) => addBookToCart(book, queryClient.getQueryData<Cart>(cartKey())),
  });
  return useCallback(
    async (book) => {
      if (pending !== null) return { kind: 'busy' };
      setPending({ kind: 'add', variantId: book.variantId });
      try {
        const outcome = await mutateAsync(book);
        saveCart(queryClient, outcome);
        if (outcome.kind === 'rented-out') {
          void queryClient.invalidateQueries({ queryKey: [...storefrontKeys.all, 'catalogue'] });
        }
        return outcome;
      } catch (error) {
        return { kind: 'failed', offline: isOfflineFailure(error) };
      } finally {
        setPending(null);
      }
    },
    [mutateAsync, queryClient],
  );
}

/** Removes a book's line (`cartChanges.ts`). Resolves with how it ended; never throws. */
export function useRemoveFromCart(): (
  lineId: string,
) => Promise<RemoveOutcome | CartChangeFailure> {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation<RemoveOutcome, Error, string>({
    mutationKey: storefrontKeys.cart.change(),
    mutationFn: (lineId) => removeBookFromCart(lineId),
  });
  return useCallback(
    async (lineId) => {
      if (pending !== null) return { kind: 'busy' };
      setPending({ kind: 'remove', lineId });
      try {
        const outcome = await mutateAsync(lineId);
        saveCart(queryClient, outcome);
        return outcome;
      } catch (error) {
        return { kind: 'failed', offline: isOfflineFailure(error) };
      } finally {
        setPending(null);
      }
    },
    [mutateAsync, queryClient],
  );
}
