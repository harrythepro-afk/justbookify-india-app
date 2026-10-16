/**
 * Checkout from the Cart tab (P9-01, D-148 to D-153): the one hook the screen uses.
 *
 * At the "Checkout" tap, as one cart change (no add, removal or second tap meanwhile; an add or
 * removal already running is waited for, and so is the cart ID's first read, so a tap is never lost):
 * 1. How checkout is presented, read afresh (`checkout_presentation`, D-150).
 * 2. The customer's access token (`getValidAccessToken`, which refreshes it when due). Signed out:
 *    the screen asks for a login; signed in but Shopify cannot be reached: a failure.
 * 3. `CartCheckoutPrepare`: the customer's identity on the cart, and the cart with its checkout URL
 *    (D-149). Refused: the cart is read again, so a gone cart is told from the rest.
 * 4. The gates again on Shopify's own cart (D-134, D-137): a rented-out book, or the counted
 *    subtotal at or over the cap, and checkout is not opened; the Cart tab shows why.
 * 5. A logout meanwhile (a new generation): nothing is presented.
 * 6. Presented at once, in the sheet or the browser; the URL is never kept.
 *
 * When it ends:
 * - **An order** (`completed`, or the cart gone on return with a new order found): the cart is
 *   forgotten (Shopify deletes a completed cart, D-136), the confirmation shows, the customer's
 *   orders are read again for the order's number, `rental_order_success`.
 * - **No order** (closed, or an error): the cart is kept and read again; `checkout_failed`.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import {
  checkoutErrorCode,
  trackCheckoutBegun,
  trackCheckoutStopped,
  trackOrderPlaced,
  type CheckoutPrepareCode,
} from '@/analytics/checkoutEvents';
import { openCheckoutInBrowser } from '@/checkout/browser';
import { presentCheckoutSheet, type CheckoutOutcome } from '@/checkout/sheet';
import { clearConfirmation, recordLastCheckout, showConfirmation } from '@/checkout/state';
import { getStoreConfig } from '@/config';
import { reportCheckoutProblem } from '@/crashReporting/sentry';
import { getCustomerSessionState, getValidAccessToken } from '@/customerAccount/session';
import {
  orderIdNumber,
  usePlacedOrderSearch,
  type PlacedOrder,
} from '@/customerAccountApi/hooks/customer';
import { loadCheckoutPresentation } from '@/featureFlags/session';

import { isUserErrors, readCart, type Cart } from '../cart';
import { cartGeneration, forgetGoneCart, getCartIdState, loadCartId } from '../cartId';
import { prepareCheckout } from '../checkout';
import { StorefrontError } from '../errors';
import { isAtOrOverCap } from '../orderCap';
import { storefrontKeys } from '../queryKeys';
import {
  cartKey,
  endCartChange,
  getPendingCartChange,
  orderCapAmount,
  tryBeginCartChange,
  waitForNoCartChange,
} from './cart';

/** How the "Checkout" tap ended, for the screen. */
export type CheckoutStart =
  /** Checkout is on screen (the sheet or the browser). */
  | { readonly kind: 'opened' }
  /** Another checkout is being prepared: the tap is ignored (its "Opening checkout…" shows). */
  | { readonly kind: 'busy' }
  /** No login: the screen offers "Log in to check out". */
  | { readonly kind: 'signed-out' }
  /** Shopify's cart changed (a rented-out book, the cap, or gone): the Cart tab shows why. */
  | { readonly kind: 'blocked' }
  /** A logout came first: nothing to show. */
  | { readonly kind: 'stale' }
  | { readonly kind: 'failed'; readonly offline: boolean };

/** How checkout ended without an order, for the screen's message; `placed` shows the confirmation. */
export type CheckoutEnd = 'placed' | 'closed' | 'failed';

/**
 * Checkout Kit's errors that need no report: the cart was completed or expired (handled as a gone
 * cart), or the development store's password page (D-030; the live store has none).
 */
const EXPECTED_CHECKOUT_ERRORS: ReadonlySet<string> = new Set([
  'closed',
  'cart_completed',
  'cart_expired',
  'storefront_password_required',
]);

function currentCartId(): string | null {
  const state = getCartIdState();
  return state.status === 'ready' ? state.cartId : null;
}

function isOffline(error: unknown): boolean {
  return error instanceof StorefrontError && error.kind === 'no-network';
}

type Started = {
  readonly cartId: string;
  readonly startedAt: number;
  readonly generation: number;
  readonly bookCount: number;
  readonly presentation: 'sheet' | 'browser';
  readonly knownOrderIds: Promise<ReadonlySet<string> | undefined>;
};

/**
 * The "Checkout" tap. `onEnd` is called once checkout is over: `placed` (the confirmation is
 * showing), `closed` (the cart is kept) or `failed` (the cart is kept; the screen says so).
 */
export function useCheckout(onEnd: (end: CheckoutEnd) => void): () => Promise<CheckoutStart> {
  const queryClient = useQueryClient();
  const { remember, find } = usePlacedOrderSearch();
  // The cart's ID, the customer's token and the checkout URL are secrets (D-121, D-133): they pass
  // the mutation through these refs, never as its variables or its data, so the cache never holds
  // them; the mutation's data is the cart only, and it is dropped once unused (gcTime 0).
  const input = useRef<{ readonly cartId: string; readonly token: string } | undefined>(undefined);
  const checkoutUrl = useRef<string | undefined>(undefined);
  const { mutateAsync } = useMutation<Cart | null, Error, void>({
    mutationKey: storefrontKeys.checkout.prepare(),
    gcTime: 0,
    mutationFn: async () => {
      const value = input.current;
      input.current = undefined;
      checkoutUrl.current = undefined;
      if (value === undefined) return null;
      const prepared = await prepareCheckout(value.cartId, value.token, getStoreConfig());
      checkoutUrl.current = prepared?.checkoutUrl;
      return prepared?.cart ?? null;
    },
  });

  const readCartAgain = useCallback(
    () => queryClient.refetchQueries({ queryKey: storefrontKeys.cart.all(), type: 'active' }),
    [queryClient],
  );

  /** An order was placed: forget the cart, confirm, find its number. */
  const placed = useCallback(
    async (started: Started, orderNumber: string | undefined, found?: PlacedOrder) => {
      await forgetGoneCart(started.cartId);
      showConfirmation({ orderName: found?.name });
      if (found !== undefined) return found;
      const order = await find({
        orderNumber,
        startedAt: started.startedAt,
        knownOrderIds: await started.knownOrderIds,
      });
      if (order !== undefined) showConfirmation({ orderName: order.name });
      return order;
    },
    [find],
  );

  /**
   * Checkout ended without a `completed` event: if Shopify no longer has the cart and a new order
   * is found, it was placed; otherwise the cart is kept.
   */
  const endedWithoutEvent = useCallback(
    async (started: Started, code: 'closed' | ReturnType<typeof checkoutErrorCode>) => {
      let gone = false;
      try {
        gone = (await readCart(started.cartId, getStoreConfig())) === null;
      } catch {
        // Unknown: keep the cart.
      }
      if (started.generation !== cartGeneration()) return;
      if (gone) {
        const order = await find({
          startedAt: started.startedAt,
          knownOrderIds: await started.knownOrderIds,
        });
        if (order !== undefined) {
          await placed(started, undefined, order);
          trackOrderPlaced(orderIdNumber(order.id), started.bookCount, 'unknown');
          recordLastCheckout({
            presentation: started.presentation,
            ended: 'placed',
            orderFound: true,
          });
          onEnd('placed');
          return;
        }
        await forgetGoneCart(started.cartId);
      }
      // A held consent request keeps waiting for the first order in this login (D-148).
      if (!EXPECTED_CHECKOUT_ERRORS.has(code)) reportCheckoutProblem(code);
      trackCheckoutStopped('checkout', code);
      recordLastCheckout({
        presentation: started.presentation,
        ended: code === 'closed' ? 'closed' : 'failed',
      });
      void readCartAgain();
      onEnd(code === 'closed' || gone ? 'closed' : 'failed');
    },
    [find, onEnd, placed, readCartAgain],
  );

  const sheetEnded = useCallback(
    async (started: Started, outcome: CheckoutOutcome) => {
      if (outcome.kind !== 'completed') {
        await endedWithoutEvent(started, outcome.kind === 'closed' ? 'closed' : outcome.code);
        return;
      }
      if (started.generation !== cartGeneration()) return;
      trackOrderPlaced(outcome.orderNumber, started.bookCount, outcome.paymentType);
      recordLastCheckout({
        presentation: 'sheet',
        ended: 'placed',
        orderIdForm: outcome.orderIdForm,
      });
      onEnd('placed');
      const order = await placed(started, outcome.orderNumber);
      recordLastCheckout({
        presentation: 'sheet',
        ended: 'placed',
        orderIdForm: outcome.orderIdForm,
        orderFound: order !== undefined,
      });
    },
    [endedWithoutEvent, onEnd, placed],
  );

  return useCallback(async (): Promise<CheckoutStart> => {
    // Never a silent tap (architect's review of PR #30): an add or removal still running is waited
    // for, then checkout goes on; only a second checkout is ignored (its "Opening checkout…" shows).
    while (!tryBeginCartChange({ kind: 'checkout' })) {
      if (getPendingCartChange()?.kind === 'checkout') return { kind: 'busy' };
      await waitForNoCartChange();
    }
    const stop = (code: CheckoutPrepareCode) => trackCheckoutStopped('prepare', code);
    try {
      // The cart's ID is read once per launch; a tap before that read ends waits for it.
      await loadCartId();
      const generation = cartGeneration();
      const startedAt = Date.now();
      const cartId = currentCartId();
      if (cartId === null) {
        stop('cart_gone');
        void readCartAgain();
        return { kind: 'blocked' };
      }
      const presentation = await loadCheckoutPresentation();
      const token = await getValidAccessToken();
      if (token === undefined) {
        if (getCustomerSessionState().status !== 'signedIn') {
          stop('signed_out');
          return { kind: 'signed-out' };
        }
        stop('token_unavailable');
        return { kind: 'failed', offline: false };
      }

      let prepared: Cart | null;
      try {
        input.current = { cartId, token };
        prepared = await mutateAsync();
      } catch (error) {
        if (generation !== cartGeneration()) return { kind: 'stale' };
        if (isUserErrors(error)) {
          const again = await readCart(cartId, getStoreConfig()).catch(() => undefined);
          if (again === null) prepared = null;
          else {
            stop('shopify_error');
            return { kind: 'failed', offline: false };
          }
        } else {
          stop(isOffline(error) ? 'no_network' : 'shopify_error');
          return { kind: 'failed', offline: isOffline(error) };
        }
      }
      if (generation !== cartGeneration()) return { kind: 'stale' };
      if (prepared === null) {
        await forgetGoneCart(cartId);
        stop('cart_gone');
        return { kind: 'blocked' };
      }

      const cart: Cart = prepared;
      const url = checkoutUrl.current;
      checkoutUrl.current = undefined;
      if (url === undefined) {
        stop('shopify_error');
        return { kind: 'failed', offline: false };
      }
      queryClient.setQueryData(cartKey(), cart);
      if (cart.books.length === 0) {
        stop('cart_gone');
        return { kind: 'blocked' };
      }
      if (cart.hasRentedOut) {
        stop('rented_out');
        return { kind: 'blocked' };
      }
      if (isAtOrOverCap(cart.countedSubtotal, orderCapAmount())) {
        stop('over_cap');
        return { kind: 'blocked' };
      }

      const started: Started = {
        cartId,
        startedAt,
        generation,
        bookCount: cart.books.length,
        presentation,
        knownOrderIds: remember(),
      };
      clearConfirmation();
      recordLastCheckout({ presentation, ended: 'open' });
      if (presentation === 'browser') {
        await openCheckoutInBrowser(url, () => {
          void endedWithoutEvent(started, 'closed');
        });
      } else {
        await presentCheckoutSheet(url, (outcome) => {
          void sheetEnded(started, outcome);
        });
      }
      trackCheckoutBegun(cart.books.length, cart.countedSubtotal);
      return { kind: 'opened' };
    } catch {
      // The sheet or the browser could not be presented (no message or value is kept).
      reportCheckoutProblem('present_failed');
      stop('shopify_error');
      return { kind: 'failed', offline: false };
    } finally {
      endCartChange();
    }
  }, [endedWithoutEvent, mutateAsync, queryClient, readCartAgain, remember, sheetEnded]);
}
