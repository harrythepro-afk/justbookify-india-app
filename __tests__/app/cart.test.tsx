import type { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, ScrollView } from 'react-native';

import CartScreen from '@/app/(tabs)/cart';
import { resetCartIdForTests } from '@/shopify/cartId';
import { StorefrontError } from '@/shopify/errors';
import { resetCartChangesForTests } from '@/shopify/hooks/cart';

import { CART_ID, cartFields, cartLine, type CartLineNode } from '../helpers/cart';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { withScreen } from '../helpers/screen';

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

jest.mock('@/config', () => ({
  ...jest.requireActual('@/config'),
  getStoreConfig: () => ({ currencyCode: 'INR', language: 'EN', country: 'IN', orderCap: 500 }),
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

// The tab's focus: each opening runs the callback; leaving runs its cleanup.
type Focus = { readonly callback: () => (() => void) | void; cleanup?: (() => void) | void };
const mockFocus: Focus[] = [];
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => (() => void) | void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(() => {
      const entry: Focus = { callback };
      mockFocus.push(entry);
      entry.cleanup = callback();
    }, [callback]);
  },
}));

/** Leaves the tab and opens it again. */
async function reopenTab() {
  await act(async () => {
    for (const entry of mockFocus) {
      entry.cleanup?.();
      entry.cleanup = entry.callback();
    }
  });
}

const mockOpenScreen = jest.fn();
jest.mock('@/navigation/openGuard', () => ({
  ...jest.requireActual('@/navigation/openGuard'),
  openScreen: (...args: unknown[]) => mockOpenScreen(...args),
}));

let mockOffline = false;
const mockRecheckNetwork = jest.fn(() => Promise.resolve());
jest.mock('@/query/online', () => ({
  ...jest.requireActual('@/query/online'),
  useIsOffline: () => mockOffline,
  recheckNetwork: () => mockRecheckNetwork(),
}));

const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());
let mockConsent = true;
jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: () => Promise.resolve(),
}));
jest.mock('@/analytics/consent', () => ({ isAnalyticsConsentGranted: () => mockConsent }));

jest.mock('@/crashReporting/sentry', () => ({
  reportAnalyticsProblem: jest.fn(),
  reportCartProblem: jest.fn(),
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
}));

let mockLines: CartLineNode[] = [];
let mockSubtotal: number | undefined;
let mockReadError: Error | undefined;
let mockRemoveError: Error | undefined;
let mockGone = false;
const mockOperations: string[] = [];

function mockShopify(document: string, options?: { variables?: Record<string, unknown> }) {
  const operation = /(?:query|mutation)\s+(\w+)/.exec(document)?.[1] ?? '';
  mockOperations.push(operation);
  if (operation === 'CartRead') {
    if (mockReadError !== undefined) return Promise.reject(mockReadError);
    if (mockGone) return Promise.resolve({ cart: null });
    return Promise.resolve({ cart: cartFields(mockLines, mockSubtotal) });
  }
  if (operation === 'CartLinesRemove') {
    if (mockRemoveError !== undefined) return Promise.reject(mockRemoveError);
    const ids = options?.variables?.lineIds as string[];
    mockLines = mockLines.filter((line) => !ids.includes(line.id));
    return Promise.resolve({ cartLinesRemove: { cart: cartFields(mockLines), userErrors: [] } });
  }
  return Promise.reject(new Error(operation));
}

jest.mock('@/shopify/client', () => ({
  storefrontQuery: (document: string, options?: { variables?: Record<string, unknown> }) =>
    mockShopify(document, options),
  storefrontMutation: (document: string, options?: { variables?: Record<string, unknown> }) =>
    mockShopify(document, options),
}));

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

let client: QueryClient;

beforeEach(() => {
  client = createTestQueryClient();
  mockStore.clear();
  mockFocus.length = 0;
  mockOperations.length = 0;
  mockLines = [];
  mockSubtotal = undefined;
  mockReadError = undefined;
  mockRemoveError = undefined;
  mockGone = false;
  mockOffline = false;
  mockConsent = true;
  mockOpenScreen.mockReset();
  mockSendEvent.mockClear();
  mockRecheckNetwork.mockClear();
  alertSpy.mockClear();
  resetCartIdForTests();
  resetCartChangesForTests();
});

afterEach(async () => {
  await tearDownQueryClient(client);
});

/** A stored cart holding these books. */
function withCart(lines: CartLineNode[], subtotal?: number) {
  mockStore.set('cart_id', CART_ID);
  mockLines = lines;
  mockSubtotal = subtotal;
}

async function renderCart() {
  await render(<CartScreen />, { wrapper: withScreen(client) });
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
}

function events(name: string): unknown[] {
  return mockSendEvent.mock.calls.filter(([event]) => event === name).map(([, params]) => params);
}

describe('an empty cart', () => {
  it('says "Your cart is empty." with "Books for Rent", which opens Browse', async () => {
    await renderCart();

    expect(screen.getByRole('header', { name: 'Cart' })).toBeOnTheScreen();
    expect(screen.getByText('Your cart is empty.')).toBeOnTheScreen();
    expect(screen.queryByTestId('cart-subtotal')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Books for Rent' }));
    expect(mockOpenScreen).toHaveBeenCalledWith('/browse', 'navigate');
  });

  it('sends view_cart with 0 books and ₹0 (plan review, answer (c))', async () => {
    await renderCart();
    await waitFor(() => expect(events('view_cart')).toEqual([{ book_count: 0, cart_value: 0 }]));
  });

  it('is empty when the stored cart has expired, with no message', async () => {
    mockStore.set('cart_id', CART_ID);
    // A cart Shopify no longer has reads as null.
    mockGone = true;
    await renderCart();

    expect(await screen.findByText('Your cart is empty.')).toBeOnTheScreen();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockStore.has('cart_id')).toBe(false);
  });
});

describe('a cart with books', () => {
  it('shows each book with its cover, title, author, price and "Remove"', async () => {
    withCart([
      cartLine({ title: 'The Gruffalo', vendor: 'Julia Donaldson', price: '74.0' }),
      cartLine({ title: 'Matilda', vendor: 'Roald Dahl', price: '99.0' }),
    ]);
    await renderCart();

    expect(await screen.findByText('The Gruffalo')).toBeOnTheScreen();
    expect(screen.getByText('Matilda')).toBeOnTheScreen();
    expect(screen.getByText('Roald Dahl')).toBeOnTheScreen();
    expect(screen.getByText('₹74')).toBeOnTheScreen();
    expect(screen.getAllByTestId('cart-row-cover')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Remove The Gruffalo from cart' })).toBeOnTheScreen();
  });

  it("shows Shopify's subtotal and how much more fits under the cap", async () => {
    // ₹300: 99 + 99 + 102.
    withCart([
      cartLine({ price: '99.0' }),
      cartLine({ price: '99.0' }),
      cartLine({ price: '102.0' }),
    ]);
    await renderCart();

    expect(await screen.findByTestId('cart-subtotal')).toHaveAccessibleName('Subtotal ₹300');
    expect(screen.getByText('₹300')).toBeOnTheScreen();
    // ₹199, not ₹200: exactly ₹500 is refused (plan review).
    expect(screen.getByText('You can add books worth up to ₹199 more.')).toBeOnTheScreen();
  });

  it('says only the cap when no whole amount fits any more (₹499)', async () => {
    withCart([cartLine({ price: '400.0' }), cartLine({ price: '99.0' })]);
    await renderCart();

    expect(
      await screen.findByText('Each order can have books worth less than ₹500.'),
    ).toBeOnTheScreen();
  });

  it("says the cart is over the cap when Shopify's subtotal reaches it (message 5)", async () => {
    withCart([cartLine({ price: '450.0' }), cartLine({ price: '49.0' })], 500);
    await renderCart();

    expect(
      await screen.findByText(
        'Your books are worth ₹500. Each order can have books worth less than ₹500. Remove a book to continue.',
      ),
    ).toBeOnTheScreen();
  });

  it('opens a book page from its row', async () => {
    withCart([cartLine({ handle: 'the-gruffalo', title: 'The Gruffalo' })]);
    await renderCart();

    await fireEvent.press(await screen.findByRole('link', { name: /^The Gruffalo/ }));
    expect(mockOpenScreen).toHaveBeenCalledWith({
      pathname: '/book/[handle]',
      params: { handle: 'the-gruffalo' },
    });
  });

  it('sends view_cart once per opening, with the count and the counted subtotal', async () => {
    withCart([cartLine({ price: '49.0' }), cartLine({ price: '74.0' })]);
    await renderCart();
    await waitFor(() => expect(events('view_cart')).toHaveLength(1));
    expect(events('view_cart')[0]).toEqual({ book_count: 2, cart_value: 123 });

    // Shopify's newer read on the same visit sends nothing more.
    await act(async () => {
      await client.refetchQueries();
    });
    expect(events('view_cart')).toHaveLength(1);

    await reopenTab();
    await waitFor(() => expect(events('view_cart')).toHaveLength(2));
  });
});

describe('a book rented out while in the cart (answer 5)', () => {
  it('shows "Rented Out" with "Remove", leaves it out of the subtotal and asks for its removal', async () => {
    withCart([
      cartLine({ title: 'Matilda', price: '99.0' }),
      cartLine({ title: 'The Gruffalo', price: '74.0', availableForSale: false }),
    ]);
    await renderCart();

    expect(await screen.findByText('Rented Out')).toBeOnTheScreen();
    expect(screen.queryByText('₹74')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Remove The Gruffalo from cart' })).toBeOnTheScreen();
    expect(screen.getByTestId('cart-subtotal')).toHaveAccessibleName('Subtotal ₹99');
    expect(
      screen.getByText('A book in your cart has been rented out. Remove it to continue.'),
    ).toBeOnTheScreen();
  });

  it('sends book_unavailable_shown (cart) once per book per opening', async () => {
    const gone = cartLine({ price: '74.0', availableForSale: false });
    withCart([cartLine({ price: '99.0' }), gone]);
    await renderCart();
    await waitFor(() => expect(events('book_unavailable_shown')).toHaveLength(1));
    expect(events('book_unavailable_shown')[0]).toEqual({
      product_id: gone.merchandise.product.id.split('/').at(-1),
      stage: 'cart',
    });
    expect(events('view_cart')[0]).toEqual({ book_count: 2, cart_value: 99 });

    await act(async () => {
      await client.refetchQueries();
    });
    expect(events('book_unavailable_shown')).toHaveLength(1);

    await reopenTab();
    await waitFor(() => expect(events('book_unavailable_shown')).toHaveLength(2));
  });

  it('shows the cart as ready to go again once the book is removed', async () => {
    const gone = cartLine({ title: 'The Gruffalo', price: '74.0', availableForSale: false });
    withCart([cartLine({ price: '99.0' }), gone]);
    await renderCart();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Remove The Gruffalo from cart' }),
    );

    await waitFor(() => expect(screen.queryByText('Rented Out')).not.toBeOnTheScreen());
    expect(screen.queryByText(/has been rented out/)).not.toBeOnTheScreen();
  });
});

describe('removing a book', () => {
  it('removes it and sends remove_book with the cart size afterwards', async () => {
    const matilda = cartLine({ title: 'Matilda', price: '99.0' });
    withCart([matilda, cartLine({ title: 'The Gruffalo', price: '74.0' })]);
    await renderCart();

    await fireEvent.press(await screen.findByRole('button', { name: 'Remove Matilda from cart' }));

    await waitFor(() => expect(screen.queryByText('Matilda')).not.toBeOnTheScreen());
    expect(events('remove_book')).toEqual([
      { product_id: matilda.merchandise.product.id.split('/').at(-1), cart_size: 1 },
    ]);
    expect(screen.getByTestId('cart-subtotal')).toHaveAccessibleName('Subtotal ₹74');
  });

  it('says so when it fails offline, and keeps the book', async () => {
    withCart([cartLine({ title: 'Matilda', price: '99.0' })]);
    mockRemoveError = new StorefrontError('no-network', { operationName: 'CartLinesRemove' });
    await renderCart();

    await fireEvent.press(await screen.findByRole('button', { name: 'Remove Matilda from cart' }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(alertSpy.mock.calls[0]?.[1]).toBe(
      "You're offline. Check your connection and try again.",
    );
    expect(screen.getByText('Matilda')).toBeOnTheScreen();
    expect(events('remove_book')).toEqual([]);
  });
});

describe('loading, offline and error states', () => {
  it('shows the offline message with "Try again" when the cart cannot be read', async () => {
    withCart([cartLine()]);
    mockReadError = new StorefrontError('no-network', { operationName: 'CartRead' });
    await renderCart();

    expect(
      await screen.findByText("You're offline. Check your connection and try again."),
    ).toBeOnTheScreen();

    mockReadError = undefined;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('cart-subtotal')).toBeOnTheScreen();
    expect(mockRecheckNetwork).toHaveBeenCalled();
  });

  it('shows the error message for any other failure', async () => {
    withCart([cartLine()]);
    mockReadError = new StorefrontError('graphql-error', { operationName: 'CartRead' });
    await renderCart();

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
    expect(events('view_cart')).toEqual([]);
  });

  it('keeps the saved cart under the offline notice', async () => {
    withCart([cartLine({ title: 'Matilda' })]);
    await renderCart();
    expect(await screen.findByText('Matilda')).toBeOnTheScreen();

    mockOffline = true;
    await reopenTab();

    expect(await screen.findByText("You're offline. Showing saved books.")).toBeOnTheScreen();
    expect(screen.getByText('Matilda')).toBeOnTheScreen();
  });
});

describe('events only under consent (D-048)', () => {
  it('sends nothing without consent', async () => {
    mockConsent = false;
    withCart([cartLine(), cartLine({ availableForSale: false })]);
    await renderCart();
    expect(await screen.findByText('Rented Out')).toBeOnTheScreen();

    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it('never sends a title, a handle, a line or a cart ID', async () => {
    const line = cartLine({ title: 'Matilda', handle: 'matilda' });
    withCart([line, cartLine({ availableForSale: false })]);
    await renderCart();
    await fireEvent.press(await screen.findByRole('button', { name: 'Remove Matilda from cart' }));
    await waitFor(() => expect(events('remove_book')).toHaveLength(1));

    const sent = JSON.stringify(mockSendEvent.mock.calls);
    expect(sent).not.toMatch(/Matilda|matilda|gid:|test-cart|test-key/);
  });
});
