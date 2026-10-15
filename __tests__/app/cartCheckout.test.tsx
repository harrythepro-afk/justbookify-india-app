import type { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, AppState, ScrollView, type AppStateStatus } from 'react-native';

import CartScreen from '@/app/(tabs)/cart';
import { resetCheckoutSheetForTests } from '@/checkout/sheet';
import { resetCheckoutStateForTests } from '@/checkout/state';
import type { OrdersPage, OrderSummary } from '@/customerAccountApi/orders';
import { forgetCart, resetCartIdForTests } from '@/shopify/cartId';
import { StorefrontError } from '@/shopify/errors';
import { resetCartChangesForTests } from '@/shopify/hooks/cart';
import { forgetPincode } from '@/shopify/pincode';

import { CART_ID, cartFields, linesPriced, type CartLineNode } from '../helpers/cart';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { withScreen } from '../helpers/screen';

// Checkout from the Cart tab (P9-01, D-148 to D-153), with Shopify, the login, Checkout Kit, the
// browser and the customer's orders as stand-ins. Every value is made up.

void ScrollView;

const MOCK_STORE = {
  currencyCode: 'INR',
  language: 'EN',
  country: 'IN',
  orderCap: 500,
  shippingFeePrepaid: 75,
  shippingFeeCod: 125,
  freeDeliveryThreshold: 200,
  shippingDiscount: 75,
  deliveryPincodeRanges: [
    { from: 50, to: 53 },
    { from: 56, to: 69 },
  ],
};
jest.mock('@/config', () => ({
  ...jest.requireActual('@/config'),
  getStoreConfig: () => MOCK_STORE,
}));

const mockStore = new Map<string, string>();
jest.mock('@/shopify/cartStorage', () => ({
  readStoredCartId: () => Promise.resolve(mockStore.get('cart_id') ?? null),
  writeStoredCartId: (id: string) => {
    mockStore.set('cart_id', id);
    return Promise.resolve();
  },
  deleteStoredCartId: () => {
    mockStore.delete('cart_id');
    return Promise.resolve();
  },
}));

type Focus = { readonly callback: () => (() => void) | void; cleanup?: (() => void) | void };
const mockFocus: Focus[] = [];
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => (() => void) | void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(() => {
      const entry: Focus = { callback };
      mockFocus.push(entry);
      entry.cleanup = callback();
      return () => {
        entry.cleanup?.();
      };
    }, [callback]);
  },
}));

async function leaveTab() {
  await act(async () => {
    for (const entry of mockFocus) entry.cleanup?.();
  });
}

const mockOpenScreen = jest.fn();
jest.mock('@/navigation/openGuard', () => ({
  ...jest.requireActual('@/navigation/openGuard'),
  openScreen: (...args: unknown[]) => mockOpenScreen(...args),
}));

let mockOffline = false;
jest.mock('@/query/online', () => ({
  ...jest.requireActual('@/query/online'),
  useIsOffline: () => mockOffline,
  recheckNetwork: () => Promise.resolve(),
}));

// Analytics: the events reach this stand-in only under consent.
const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());
let mockConsent: 'granted' | 'not asked' | 'denied' = 'granted';
jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: () => Promise.resolve(),
}));
jest.mock('@/analytics/consent', () => ({
  isAnalyticsConsentGranted: () => mockConsent === 'granted',
  useAnalyticsConsent: () => ({ consent: mockConsent, busy: false, saveFailed: false }),
}));
const mockAfterLogin = jest.fn<Promise<'ask' | 'done'>, []>();
const mockAllow = jest.fn(() => Promise.resolve(true));
jest.mock('@/analytics/loginConsent', () => ({
  analyticsAfterLogin: () => mockAfterLogin(),
  allowAfterLogin: () => mockAllow(),
  denyAfterLogin: () => Promise.resolve(true),
}));

const mockSentry: Record<string, jest.Mock> = {};
jest.mock(
  '@/crashReporting/sentry',
  () =>
    new Proxy(
      {},
      {
        get: (_target, name: string) => {
          mockSentry[name] ??= jest.fn();
          return mockSentry[name];
        },
      },
    ),
);

// The customer's login: a small store, so the screen redraws when it changes.
type Session =
  | { status: 'loading' }
  | { status: 'signedOut'; notice: 'none' | 'loginFailed'; loggingIn: boolean }
  | { status: 'signedIn'; email?: string };
let mockSession: Session = { status: 'signedIn' };
const mockSessionListeners = new Set<() => void>();
function setSession(next: Session) {
  mockSession = next;
  for (const listener of mockSessionListeners) listener();
}
let mockToken: string | undefined = 'test-customer-token';
const mockLogin = jest.fn<Promise<string>, []>();
jest.mock('@/customerAccount/session', () => {
  const { useSyncExternalStore } = jest.requireActual<typeof import('react')>('react');
  return {
    useCustomerSession: () =>
      useSyncExternalStore(
        (listener: () => void) => {
          mockSessionListeners.add(listener);
          return () => mockSessionListeners.delete(listener);
        },
        () => mockSession,
      ),
    getCustomerSessionState: () => mockSession,
    getValidAccessToken: () => Promise.resolve(mockToken),
    login: () => mockLogin(),
  };
});

// Shopify's Storefront API.
const CHECKOUT_URL = 'https://example-dev.myshopify.com/cart/c/test-cart-0001?key=test-key';
let mockLines: CartLineNode[] = [];
let mockGone = false;
let mockPrepareLines: CartLineNode[] | undefined;
let mockPrepareError: Error | undefined;
let mockPrepareHold: Promise<void> | undefined;
const mockOperations: string[] = [];
const mockVariables: unknown[] = [];
function mockShopify(document: string, options?: { variables?: Record<string, unknown> }) {
  const operation = /(?:query|mutation)\s+(\w+)/.exec(document)?.[1] ?? '';
  mockOperations.push(operation);
  mockVariables.push(options?.variables);
  if (operation === 'CartRead') {
    return Promise.resolve({ cart: mockGone ? null : cartFields(mockLines) });
  }
  if (operation === 'CartCheckoutPrepare') {
    if (mockPrepareHold !== undefined) {
      const hold = mockPrepareHold;
      mockPrepareHold = undefined;
      return hold.then(() => mockShopifyAfterHold(document, options));
    }
    if (mockPrepareError !== undefined) return Promise.reject(mockPrepareError);
    if (mockGone)
      return Promise.resolve({ cartBuyerIdentityUpdate: { cart: null, userErrors: [] } });
    return Promise.resolve({
      cartBuyerIdentityUpdate: {
        cart: { ...cartFields(mockPrepareLines ?? mockLines), checkoutUrl: CHECKOUT_URL },
        userErrors: [],
      },
    });
  }
  return Promise.reject(new Error(operation));
}
function mockShopifyAfterHold(
  document: string,
  options?: { variables?: Record<string, unknown> },
): Promise<unknown> {
  mockOperations.pop();
  mockVariables.pop();
  return mockShopify(document, options);
}
jest.mock('@/shopify/client', () => ({
  storefrontQuery: (document: string, options?: { variables?: Record<string, unknown> }) =>
    mockShopify(document, options),
  storefrontMutation: (document: string, options?: { variables?: Record<string, unknown> }) =>
    mockShopify(document, options),
}));

// The customer's orders (Customer Account API).
let mockOrders: OrderSummary[] = [];
const mockOrderReads = jest.fn();
jest.mock('@/customerAccountApi/orders', () => ({
  ...jest.requireActual('@/customerAccountApi/orders'),
  fetchCustomerOrdersPage: (): Promise<OrdersPage> => {
    mockOrderReads();
    return Promise.resolve({ orders: [...mockOrders], nextCursor: null });
  },
}));
function order(number: number): OrderSummary {
  return {
    id: `gid://shopify/Order/${number}`,
    name: `#${number}`,
    processedAt: new Date().toISOString(),
    status: 'placed',
    books: [],
    moreBooks: false,
  };
}

// How checkout is presented (D-150).
let mockPresentation: 'sheet' | 'browser' = 'sheet';
jest.mock('@/featureFlags/session', () => ({
  loadCheckoutPresentation: () => Promise.resolve(mockPresentation),
}));

// Checkout Kit.
type Callback = (data?: unknown) => void;
const mockListeners = new Map<string, Set<Callback>>();
const mockPresent = jest.fn();
jest.mock('@shopify/checkout-sheet-kit', () => ({
  ColorScheme: { web: 'web_default' },
  ShopifyCheckoutSheet: class {
    addEventListener(name: string, callback: Callback) {
      const set = mockListeners.get(name) ?? new Set<Callback>();
      set.add(callback);
      mockListeners.set(name, set);
      return { remove: () => set.delete(callback) };
    }
    present(url: string) {
      mockPresent(url);
    }
    initiateGeolocationRequest() {
      return Promise.resolve();
    }
  },
}));
async function emit(name: string, data?: unknown) {
  await act(async () => {
    for (const callback of [...(mockListeners.get(name) ?? [])]) callback(data);
  });
}

// The browser (D-152).
const mockOpenBrowser = jest.fn((_url: string, _options: unknown) =>
  Promise.resolve({ type: 'opened' }),
);
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (url: string, options: unknown) => mockOpenBrowser(url, options),
}));
const appStateListeners = new Set<(state: AppStateStatus) => void>();
jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
  const typed = listener as (state: AppStateStatus) => void;
  appStateListeners.add(typed);
  return { remove: () => appStateListeners.delete(typed) } as never;
});
async function appState(next: AppStateStatus) {
  await act(async () => {
    for (const listener of [...appStateListeners]) listener(next);
  });
}

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

let client: QueryClient;

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  client = createTestQueryClient();
  resetCartIdForTests();
  resetCartChangesForTests();
  resetCheckoutStateForTests();
  resetCheckoutSheetForTests();
  forgetPincode();
  mockStore.clear();
  mockStore.set('cart_id', CART_ID);
  mockFocus.length = 0;
  mockLines = linesPriced([99, 49]);
  mockGone = false;
  mockPrepareLines = undefined;
  mockPrepareError = undefined;
  mockPrepareHold = undefined;
  mockOperations.length = 0;
  mockVariables.length = 0;
  mockOrders = [order(1001)];
  mockOrderReads.mockClear();
  mockPresentation = 'sheet';
  mockListeners.clear();
  mockPresent.mockClear();
  mockOpenBrowser.mockClear();
  appStateListeners.clear();
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  mockOffline = false;
  mockSession = { status: 'signedIn' };
  mockToken = 'test-customer-token';
  mockLogin.mockReset();
  mockAfterLogin.mockReset();
  mockAfterLogin.mockResolvedValue('done');
  mockAllow.mockClear();
  mockConsent = 'granted';
  mockSendEvent.mockClear();
  mockOpenScreen.mockClear();
  alertSpy.mockClear();
  for (const mock of Object.values(mockSentry)) mock.mockClear();
});

afterEach(async () => {
  // Fake timers would hold the teardown's own wait; reads still waiting are dropped with them.
  jest.useRealTimers();
  await tearDownQueryClient(client);
});

async function renderCart() {
  await render(<CartScreen />, { wrapper: withScreen(client) });
  await screen.findByTestId('cart-subtotal');
}

function events(name: string): unknown[] {
  return mockSendEvent.mock.calls.filter(([event]) => event === name).map(([, params]) => params);
}

async function tapCheckout() {
  await fireEvent.press(screen.getByTestId('cart-checkout'));
}

/** Lets the orders be read again (3 reads, 3 seconds apart). */
async function letOrdersSettle() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10_000);
  });
}

describe('the Checkout button (D-148)', () => {
  it('shows "Checkout" under the pincode check when signed in', async () => {
    await renderCart();
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeOnTheScreen();
    expect(screen.queryByText('Log in to check out')).not.toBeOnTheScreen();
  });

  it('is not offered with a rented-out book in the cart', async () => {
    mockLines = [
      ...linesPriced([99]),
      ...linesPriced([49]).map((line) => ({ ...line, quantity: 0 })),
    ];
    await renderCart();
    expect(
      screen.getByText('A book in your cart has been rented out. Remove it to continue.'),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('cart-checkout')).not.toBeOnTheScreen();
  });

  it('is not offered at or over the cap (₹500), and is at ₹499', async () => {
    mockLines = linesPriced([99, 99, 99, 99, 99, 5]);
    await renderCart();
    expect(screen.queryByTestId('cart-checkout')).not.toBeOnTheScreen();
  });

  it('is offered at ₹499, the most under the cap', async () => {
    mockLines = linesPriced([99, 99, 99, 99, 99, 4]);
    await renderCart();
    expect(screen.getByTestId('cart-checkout')).toBeOnTheScreen();
  });

  it('is not offered offline', async () => {
    mockOffline = true;
    await renderCart();
    expect(screen.queryByTestId('cart-checkout')).not.toBeOnTheScreen();
  });

  it('is not offered while the login is still being read', async () => {
    mockSession = { status: 'loading' };
    await renderCart();
    expect(screen.queryByTestId('cart-checkout')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('cart-log-in')).not.toBeOnTheScreen();
  });
});

describe('signed out: "Log in to check out" (D-148, D-129)', () => {
  beforeEach(() => {
    mockSession = { status: 'signedOut', notice: 'none', loggingIn: false };
  });

  it('asks for a login here, with the cart kept, and no Checkout button', async () => {
    await renderCart();
    expect(
      screen.getByText('Log in to place your order. Your cart will be kept.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Log in to check out' })).toBeOnTheScreen();
    expect(screen.queryByTestId('cart-checkout')).not.toBeOnTheScreen();
  });

  it('logs in on the Cart tab and then offers Checkout, the cart unchanged', async () => {
    mockLogin.mockImplementation(async () => {
      setSession({ status: 'signedIn' });
      return 'signedIn';
    });
    await renderCart();

    await fireEvent.press(screen.getByTestId('cart-log-in'));

    expect(await screen.findByRole('button', { name: 'Checkout' })).toBeOnTheScreen();
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Subtotal ₹148')).toBeOnTheScreen();
    expect(mockOpenScreen).not.toHaveBeenCalled();
  });

  it('shows the login notice after a failed login, and "Logging in…" while it runs', async () => {
    mockSession = { status: 'signedOut', notice: 'loginFailed', loggingIn: false };
    await renderCart();
    expect(screen.getByText("Login didn't finish. Please try again.")).toBeOnTheScreen();

    await act(async () => setSession({ status: 'signedOut', notice: 'none', loggingIn: true }));
    expect(screen.getByRole('button', { name: 'Logging in…' })).toBeDisabled();
  });

  it('holds the consent request after a first login here, until an order is confirmed', async () => {
    mockConsent = 'not asked';
    mockAfterLogin.mockResolvedValue('ask');
    mockLogin.mockImplementation(async () => {
      setSession({ status: 'signedIn' });
      return 'signedIn';
    });
    await renderCart();
    await fireEvent.press(screen.getByTestId('cart-log-in'));
    await screen.findByTestId('cart-checkout');

    expect(screen.queryByText('Help us improve the app?')).not.toBeOnTheScreen();

    await tapCheckout();
    mockOrders = [order(1004), order(1001)];
    await emit('completed', { orderDetails: { id: 'gid://shopify/Order/1004' } });
    await emit('close');
    await letOrdersSettle();

    expect(screen.getByText('Help us improve the app?')).toBeOnTheScreen();
  });

  it('drops the held consent request when checkout is closed without an order', async () => {
    mockConsent = 'not asked';
    mockAfterLogin.mockResolvedValue('ask');
    mockLogin.mockImplementation(async () => {
      setSession({ status: 'signedIn' });
      return 'signedIn';
    });
    await renderCart();
    await fireEvent.press(screen.getByTestId('cart-log-in'));
    await screen.findByTestId('cart-checkout');
    await tapCheckout();
    await emit('close');
    await letOrdersSettle();

    // A later order in the same login: no request.
    await tapCheckout();
    mockOrders = [order(1004), order(1001)];
    await emit('completed', { orderDetails: { id: 'gid://shopify/Order/1004' } });
    await letOrdersSettle();

    expect(screen.getByText(/Thank you! Your order #1004 is placed/)).toBeOnTheScreen();
    expect(screen.queryByText('Help us improve the app?')).not.toBeOnTheScreen();
  });
});

describe('checkout in the sheet (D-149, D-151)', () => {
  it("attaches the customer's token to the cart and presents its URL at once", async () => {
    await renderCart();
    await tapCheckout();

    expect(mockOperations).toContain('CartCheckoutPrepare');
    expect(mockVariables[mockOperations.indexOf('CartCheckoutPrepare')]).toEqual({
      cartId: CART_ID,
      customerAccessToken: 'test-customer-token',
    });
    expect(mockPresent).toHaveBeenCalledWith(CHECKOUT_URL);
    expect(events('begin_checkout')).toEqual([{ book_count: 2, cart_value: 148 }]);
  });

  it('confirms the order, forgets the cart, and finds the order number', async () => {
    await renderCart();
    await tapCheckout();
    mockOrders = [order(1004), order(1001)];
    mockGone = true;

    await emit('completed', {
      orderDetails: { id: 'gid://shopify/OrderIdentity/1004', paymentMethods: [{ type: 'COD' }] },
    });

    expect(await screen.findByText(/Thank you! Your order/)).toBeOnTheScreen();
    await letOrdersSettle();
    expect(
      screen.getByText("Thank you! Your order #1004 is placed. We'll deliver your books soon."),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('cart-subtotal')).not.toBeOnTheScreen();
    expect(mockStore.has('cart_id')).toBe(false);
    expect(events('rental_order_success')).toEqual([
      { order_id: '1004', book_count: 2, payment_type: 'cash_on_delivery' },
    ]);

    await emit('close');
    expect(events('checkout_failed')).toEqual([]);
    expect(screen.getByText(/Your order #1004 is placed/)).toBeOnTheScreen();
  });

  it('shows the confirmation without a number when the order cannot be found', async () => {
    await renderCart();
    await tapCheckout();
    mockGone = true;

    await emit('completed', { orderDetails: { id: 'gid://shopify/Order/1004' } });
    await letOrdersSettle();

    expect(
      screen.getByText("Thank you! Your order is placed. We'll deliver your books soon."),
    ).toBeOnTheScreen();
    expect(mockOrderReads.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('never shows an earlier order as the new one', async () => {
    mockOrders = [order(1003), order(1001)];
    await renderCart();
    await tapCheckout();
    mockGone = true;

    // An event with an ID of an unknown form: only a new order may be taken.
    await emit('completed', { orderDetails: { id: 'not-an-order-id' } });
    await letOrdersSettle();

    expect(screen.getByText(/Thank you! Your order is placed/)).toBeOnTheScreen();
    expect(screen.queryByText(/#1003/)).not.toBeOnTheScreen();
  });

  it('"Go to My Books" opens My Books; leaving the tab clears the confirmation', async () => {
    await renderCart();
    await tapCheckout();
    mockOrders = [order(1004), order(1001)];
    mockGone = true;
    await emit('completed', { orderDetails: { id: 'gid://shopify/Order/1004' } });
    await letOrdersSettle();

    await fireEvent.press(screen.getByRole('button', { name: 'Go to My Books' }));
    expect(mockOpenScreen).toHaveBeenCalledWith('/my-books', 'navigate');

    await leaveTab();
    expect(screen.queryByTestId('checkout-confirmation')).not.toBeOnTheScreen();
  });

  it('keeps the cart when checkout is closed without an order', async () => {
    await renderCart();
    await tapCheckout();

    await emit('close');
    await letOrdersSettle();

    expect(screen.getByLabelText('Subtotal ₹148')).toBeOnTheScreen();
    expect(mockStore.get('cart_id')).toBe(CART_ID);
    expect(screen.queryByTestId('checkout-confirmation')).not.toBeOnTheScreen();
    expect(events('checkout_failed')).toEqual([{ stage: 'checkout', error_code: 'closed' }]);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('treats a close with the cart gone and a new order as an order (a lost event)', async () => {
    await renderCart();
    await tapCheckout();
    mockGone = true;
    mockOrders = [order(1004), order(1001)];

    await emit('close');
    await letOrdersSettle();

    expect(screen.getByText(/Your order #1004 is placed/)).toBeOnTheScreen();
    expect(events('rental_order_success')).toEqual([
      { order_id: '1004', book_count: 2, payment_type: 'unknown' },
    ]);
  });

  it("keeps the cart and says so after Checkout Kit's error, reported by code only", async () => {
    await renderCart();
    await tapCheckout();

    await emit('error', {
      code: 'render_process_gone',
      recoverable: false,
      message: 'parent@example.com',
    });
    await letOrdersSettle();

    expect(alertSpy).toHaveBeenCalledWith('', "Checkout couldn't be opened. Please try again.", [
      { text: 'OK' },
    ]);
    expect(mockSentry.reportCheckoutProblem?.mock.calls).toEqual([['render_process_gone']]);
    expect(screen.getByLabelText('Subtotal ₹148')).toBeOnTheScreen();
    expect(events('checkout_failed')).toEqual([
      { stage: 'checkout', error_code: 'render_process_gone' },
    ]);
  });
});

describe('before checkout opens (D-148, D-149)', () => {
  it('ignores a second tap and every cart change while it prepares', async () => {
    let release!: () => void;
    mockPrepareHold = new Promise<void>((resolve) => (release = resolve));
    await renderCart();

    await fireEvent.press(screen.getByTestId('cart-checkout'));
    expect(await screen.findByRole('button', { name: 'Opening checkout…' })).toBeDisabled();
    await fireEvent.press(screen.getByTestId('cart-checkout'));
    await act(async () => {
      release();
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(mockOperations.filter((name) => name === 'CartCheckoutPrepare')).toHaveLength(1);
    expect(mockPresent).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeOnTheScreen();
  });

  it('presents nothing when a logout comes while checkout prepares', async () => {
    let release!: () => void;
    mockPrepareHold = new Promise<void>((resolve) => (release = resolve));
    await renderCart();

    await fireEvent.press(screen.getByTestId('cart-checkout'));
    await act(async () => {
      await forgetCart();
      release();
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(mockPresent).not.toHaveBeenCalled();
    expect(mockOpenBrowser).not.toHaveBeenCalled();
    expect(events('begin_checkout')).toEqual([]);
  });

  it('opens nothing when Shopify finds a rented-out book, and shows why', async () => {
    mockPrepareLines = [
      ...linesPriced([99]),
      ...linesPriced([49]).map((line) => ({ ...line, quantity: 0 })),
    ];
    await renderCart();
    await tapCheckout();

    expect(mockPresent).not.toHaveBeenCalled();
    expect(
      await screen.findByText('A book in your cart has been rented out. Remove it to continue.'),
    ).toBeOnTheScreen();
    expect(events('checkout_failed')).toEqual([{ stage: 'prepare', error_code: 'rented_out' }]);
  });

  it("opens nothing when Shopify's subtotal is at the cap", async () => {
    mockPrepareLines = linesPriced([99, 99, 99, 99, 99, 5]);
    await renderCart();
    await tapCheckout();

    expect(mockPresent).not.toHaveBeenCalled();
    expect(events('checkout_failed')).toEqual([{ stage: 'prepare', error_code: 'over_cap' }]);
  });

  it('shows the empty cart when Shopify no longer has it', async () => {
    await renderCart();
    mockGone = true;
    await tapCheckout();

    expect(mockPresent).not.toHaveBeenCalled();
    expect(await screen.findByText('Your cart is empty.')).toBeOnTheScreen();
    expect(events('checkout_failed')).toEqual([{ stage: 'prepare', error_code: 'cart_gone' }]);
  });

  it('says it is offline when Shopify cannot be reached', async () => {
    mockPrepareError = new StorefrontError('no-network', { operationName: 'CartCheckoutPrepare' });
    await renderCart();
    await tapCheckout();

    expect(mockPresent).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      '',
      "You're offline. Check your connection and try again.",
      [{ text: 'OK' }],
    );
    expect(events('checkout_failed')).toEqual([{ stage: 'prepare', error_code: 'no_network' }]);
  });

  it('says something went wrong when the login cannot be refreshed', async () => {
    mockToken = undefined;
    await renderCart();
    await tapCheckout();

    expect(mockOperations).not.toContain('CartCheckoutPrepare');
    expect(alertSpy).toHaveBeenCalledWith('', 'Something went wrong. Please try again.', [
      { text: 'OK' },
    ]);
    expect(events('checkout_failed')).toEqual([
      { stage: 'prepare', error_code: 'token_unavailable' },
    ]);
  });

  it('sends no checkout event without consent', async () => {
    mockConsent = 'denied';
    await renderCart();
    await tapCheckout();
    mockGone = true;
    await emit('completed', { orderDetails: { id: 'gid://shopify/Order/1004' } });
    await letOrdersSettle();

    expect(mockSendEvent).not.toHaveBeenCalled();
  });
});

describe('checkout in the browser (D-152)', () => {
  beforeEach(() => {
    mockPresentation = 'browser';
  });

  it("opens the checkout URL in the browser in the app's own task, not the sheet", async () => {
    await renderCart();
    await tapCheckout();

    expect(mockOpenBrowser).toHaveBeenCalledWith(CHECKOUT_URL, {
      createTask: false,
      showTitle: true,
    });
    expect(mockPresent).not.toHaveBeenCalled();
  });

  it('keeps the cart when the customer comes back without an order', async () => {
    await renderCart();
    await tapCheckout();

    await appState('background');
    await appState('active');
    await letOrdersSettle();

    expect(screen.getByLabelText('Subtotal ₹148')).toBeOnTheScreen();
    expect(screen.queryByTestId('checkout-confirmation')).not.toBeOnTheScreen();
  });

  it('confirms a new order when the cart is gone on return', async () => {
    await renderCart();
    await tapCheckout();
    mockGone = true;
    mockOrders = [order(1005), order(1001)];

    await appState('background');
    await appState('active');
    await letOrdersSettle();

    expect(screen.getByText(/Your order #1005 is placed/)).toBeOnTheScreen();
    expect(mockStore.has('cart_id')).toBe(false);
  });

  it('shows the empty cart, and no confirmation, when the cart is gone but no new order is found', async () => {
    await renderCart();
    await tapCheckout();
    mockGone = true;

    await appState('background');
    await appState('active');
    await letOrdersSettle();

    expect(screen.queryByTestId('checkout-confirmation')).not.toBeOnTheScreen();
    expect(await screen.findByText('Your cart is empty.')).toBeOnTheScreen();
  });
});

describe('the completed payload (owner, plan approval)', () => {
  const PERSONAL = [
    'parent.test@example.com',
    '+91 98765 43210',
    'Made-up Parent',
    '12 Test Street',
    'Testville',
    '560001',
    'made-up-payment-detail',
    'Harry Potter test title',
  ];

  it('never lets its email, phone, addresses or payment details reach the console, Sentry, the cache or storage', async () => {
    const consoleCalls: unknown[] = [];
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      jest.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        consoleCalls.push(args);
      }),
    );
    await renderCart();
    await tapCheckout();
    mockGone = true;
    mockOrders = [order(1004), order(1001)];

    const address = {
      address1: '12 Test Street',
      city: 'Testville',
      postalCode: '560001',
      firstName: 'Made-up',
      lastName: 'Parent',
      name: 'Made-up Parent',
      phone: '+91 98765 43210',
    };
    await emit('completed', {
      orderDetails: {
        id: 'gid://shopify/OrderIdentity/1004',
        email: 'parent.test@example.com',
        phone: '+91 98765 43210',
        billingAddress: address,
        deliveries: [
          { method: 'SHIPPING', details: { name: 'Made-up Parent', location: address } },
        ],
        paymentMethods: [{ type: 'COD', details: { card: 'made-up-payment-detail' } }],
        cart: {
          token: 'test-cart-0001',
          lines: [{ title: 'Harry Potter test title', quantity: 1, price: { amount: 99 } }],
          price: { total: { amount: 224, currencyCode: 'INR' } },
        },
      },
    });
    await emit('close');
    await letOrdersSettle();

    const cached = JSON.stringify([
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.state.data),
      client
        .getMutationCache()
        .getAll()
        .map((mutation) => mutation.state),
    ]);
    const everywhere = [
      JSON.stringify(consoleCalls),
      JSON.stringify(Object.values(mockSentry).map((mock) => mock.mock.calls)),
      cached,
      JSON.stringify([...mockStore.entries()]),
      JSON.stringify(mockSendEvent.mock.calls),
    ];
    for (const place of everywhere) {
      for (const value of PERSONAL) expect(place).not.toContain(value);
    }
    expect(events('rental_order_success')).toEqual([
      { order_id: '1004', book_count: 2, payment_type: 'cash_on_delivery' },
    ]);
    for (const spy of spies) spy.mockRestore();
  });

  it("never puts the customer's token or the checkout URL into an event, a report or the cache", async () => {
    await renderCart();
    await tapCheckout();
    await emit('close');
    await letOrdersSettle();

    const places = [
      JSON.stringify(mockSendEvent.mock.calls),
      JSON.stringify(Object.values(mockSentry).map((mock) => mock.mock.calls)),
      JSON.stringify(
        client
          .getQueryCache()
          .getAll()
          .map((query) => [query.queryKey, query.state.data]),
      ),
      JSON.stringify(
        client
          .getMutationCache()
          .getAll()
          .map((mutation) => [mutation.options.mutationKey, mutation.state]),
      ),
    ];
    for (const place of places) {
      expect(place).not.toContain('test-customer-token');
      expect(place).not.toContain(CHECKOUT_URL);
      expect(place).not.toContain('test-key');
    }
  });
});
