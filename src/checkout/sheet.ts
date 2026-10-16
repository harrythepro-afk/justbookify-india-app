/**
 * Checkout in Shopify's Checkout Kit sheet (P9-01, D-151): the in-app presentation, the default of
 * `checkout_presentation` (D-033). The only file that imports `@shopify/checkout-sheet-kit` besides
 * `src/checkout/` itself (ESLint).
 *
 * - **One sheet, made on first use** (not a provider at the root, so no other screen loads it):
 *   preloading off (an authenticated checkout URL expires, so it is presented at once, D-149), the
 *   website's own colours (`web`), and **no location permission**: the package's default asks for
 *   Android's location permission at checkout; here every request is answered "no", and the app
 *   declares no location permission.
 * - **Listeners per presentation**, removed when it ends. `close` after `completed` is the customer
 *   leaving Shopify's thank-you page, not a second outcome. A recoverable error is left to Checkout
 *   Kit, which retries; an unrecoverable one ends the presentation.
 * - **The `completed` payload holds the customer's email, phone, addresses and payment details.**
 *   Only the order ID's number and form and the payment method's `type` code are read, and the
 *   payload is never logged, reported or stored (owner, plan approval). The listener never throws:
 *   Checkout Kit 3.9.1 logs an event's raw data with `console.error` when its callback throws.
 */

import {
  ColorScheme,
  ShopifyCheckoutSheet,
  type CheckoutException,
} from '@shopify/checkout-sheet-kit';

import { orderIdForm, orderIdNumber, type OrderIdForm } from '@/customerAccountApi/placedOrder';

import {
  checkoutErrorCode,
  paymentTypeOf,
  type CheckoutErrorCode,
  type PaymentType,
} from './codes';

/** How one presentation of checkout ended. */
export type CheckoutOutcome =
  | {
      readonly kind: 'completed';
      /** The number in the order's ID; undefined when the ID has an unknown form. */
      readonly orderNumber: string | undefined;
      readonly orderIdForm: OrderIdForm;
      readonly paymentType: PaymentType;
    }
  | { readonly kind: 'closed' }
  | { readonly kind: 'failed'; readonly code: CheckoutErrorCode };

type Subscription = { remove(): void } | undefined;

let sheet: ShopifyCheckoutSheet | undefined;

function getSheet(): ShopifyCheckoutSheet {
  if (sheet === undefined) {
    const created = new ShopifyCheckoutSheet(
      { preloading: false, colorScheme: ColorScheme.web },
      { handleGeolocationRequests: false },
    );
    created.addEventListener('geolocationRequest', () => {
      void created.initiateGeolocationRequest(false);
    });
    sheet = created;
  }
  return sheet;
}

/** Tests only: a fresh sheet on the next presentation. */
export function resetCheckoutSheetForTests(): void {
  sheet = undefined;
}

type Field = Readonly<Record<string, unknown>> | undefined;

function field(value: unknown, name: string): unknown {
  return typeof value === 'object' && value !== null ? (value as Field)?.[name] : undefined;
}

/** Only the order ID's number and form and the payment type's code; nothing else is read. */
export function completedOutcome(event: unknown): CheckoutOutcome {
  try {
    const details = field(event, 'orderDetails');
    const rawId = field(details, 'id');
    const id = typeof rawId === 'string' ? rawId : undefined;
    const methods = field(details, 'paymentMethods');
    const type = Array.isArray(methods) ? field(methods[0], 'type') : undefined;
    return {
      kind: 'completed',
      orderNumber: orderIdNumber(id),
      orderIdForm: orderIdForm(id),
      paymentType: paymentTypeOf(type),
    };
  } catch {
    return {
      kind: 'completed',
      orderNumber: undefined,
      orderIdForm: 'other',
      paymentType: 'unknown',
    };
  }
}

/**
 * Presents the checkout URL in the sheet. `onEnd` is called once, with how it ended: at
 * `completed` (the sheet still shows Shopify's thank-you page until the customer closes it), at
 * `close`, or at an unrecoverable error. Rejects only if the sheet cannot be presented at all.
 */
export async function presentCheckoutSheet(
  checkoutUrl: string,
  onEnd: (outcome: CheckoutOutcome) => void,
): Promise<void> {
  const checkout = getSheet();
  const subscriptions: Subscription[] = [];
  let ended = false;
  const removeAll = () => {
    for (const subscription of subscriptions.splice(0)) subscription?.remove();
  };
  const end = (outcome: CheckoutOutcome) => {
    if (ended) return;
    ended = true;
    try {
      onEnd(outcome);
    } catch {
      // Never let a throw reach Checkout Kit, which would log the event's raw data.
    }
  };

  subscriptions.push(
    checkout.addEventListener('completed', (event: unknown) => end(completedOutcome(event))),
    checkout.addEventListener('close', () => {
      end({ kind: 'closed' });
      removeAll();
    }),
    checkout.addEventListener('error', (error: unknown) => {
      try {
        const exception = error as Partial<CheckoutException> | undefined;
        if (exception?.recoverable === true) return;
        end({ kind: 'failed', code: checkoutErrorCode(exception?.code) });
      } catch {
        end({ kind: 'failed', code: 'unknown' });
      }
      removeAll();
    }),
  );
  try {
    checkout.present(checkoutUrl);
  } catch (error) {
    removeAll();
    throw error;
  }
}
