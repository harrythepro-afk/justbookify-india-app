import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, StyleSheet } from 'react-native';

import { AddToCartButton } from '@/components/AddToCartButton';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { AddOutcome, CartButtonState, CartChangeFailure } from '@/shopify/hooks/cart';
import { EMPTY_CART } from '@/shopify/cart';

import { cartOf, linesPriced } from '../helpers/cart';
import { bookProduct, EXAMPLES } from '../helpers/catalogue';

// The button's state and the add come from the cart hooks, tested on their own
// (`__tests__/shopify/hooks/cart.test.tsx`); here they are stand-ins.
let mockState: CartButtonState = 'add';
const mockAdd = jest.fn<Promise<AddOutcome | CartChangeFailure>, [unknown]>();
jest.mock('@/shopify/hooks/cart', () => ({
  ...jest.requireActual('@/shopify/hooks/cart'),
  useCartButtonState: () => mockState,
  useAddToCart: () => mockAdd,
  orderCapAmount: () => 500,
}));

jest.mock('@/config', () => ({
  ...jest.requireActual('@/config'),
  getStoreConfig: () => ({ currencyCode: 'INR', language: 'EN', country: 'IN', orderCap: 500 }),
}));

// "Go to Cart" opens the Cart tab through the guard (D-099).
const mockOpenScreen = jest.fn();
jest.mock('@/navigation/openGuard', () => ({
  ...jest.requireActual('@/navigation/openGuard'),
  openScreen: (...args: unknown[]) => mockOpenScreen(...args),
}));

// The real events and guard run; only Firebase's send is recorded, and only under consent.
const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());
let mockConsent = true;
jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: () => Promise.resolve(),
}));
jest.mock('@/analytics/consent', () => ({ isAnalyticsConsentGranted: () => mockConsent }));
jest.mock('@/crashReporting/sentry', () => ({ reportAnalyticsProblem: jest.fn() }));

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(product = EXAMPLES.inStock()): BookCard {
  const result = toBookCard(product, CONFIG);
  if (result === null) throw new Error('expected a card');
  return result;
}

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

beforeEach(() => {
  mockState = 'add';
  mockAdd.mockReset();
  mockSendEvent.mockClear();
  mockOpenScreen.mockReset();
  mockConsent = true;
  alertSpy.mockClear();
});

type AlertButton = { text?: string; onPress?: () => void };

function lastAlert(): { title: string; message: string; buttons: AlertButton[] } {
  const call = alertSpy.mock.calls.at(-1);
  if (call === undefined) throw new Error('no alert');
  return { title: call[0], message: call[1] ?? '', buttons: (call[2] ?? []) as AlertButton[] };
}

async function press(book: BookCard) {
  await fireEvent.press(screen.getByRole('button', { name: `Add ${book.title} to cart` }));
}

describe('what it shows (answers 1 and 6)', () => {
  it('says "Add to Cart" for a book not in the cart', async () => {
    const book = card();
    await render(<AddToCartButton book={book} />);
    expect(screen.getByText('Add to Cart')).toBeOnTheScreen();
  });

  it('says "Adding…" and cannot be pressed while Shopify answers', async () => {
    mockState = 'adding';
    const book = card();
    await render(<AddToCartButton book={book} />);

    const button = screen.getByRole('button', { name: `Add ${book.title} to cart` });
    expect(screen.getByText('Adding…')).toBeOnTheScreen();
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('says "In cart" for a book already in the cart, and does nothing', async () => {
    mockState = 'in-cart';
    const book = card();
    await render(<AddToCartButton book={book} />);

    const button = screen.getByRole('button', { name: `${book.title} is in your cart` });
    expect(screen.getByText('In cart')).toBeOnTheScreen();
    expect(screen.queryByText('Add to Cart')).not.toBeOnTheScreen();
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('gives each state a touch target of at least 44 points', async () => {
    const book = card();
    for (const state of ['add', 'in-cart'] as const) {
      mockState = state;
      await render(<AddToCartButton book={book} />);
      const style = StyleSheet.flatten(screen.getByRole('button').props.style) as {
        minHeight?: number;
      };
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('after "Add to Cart"', () => {
  it('stays on the screen with no message, and sends select_book with the cart size', async () => {
    const book = card();
    mockAdd.mockResolvedValue({ kind: 'added', cart: cartOf(linesPriced([49, 74])) });
    await render(<AddToCartButton book={book} />);

    await press(book);

    await waitFor(() =>
      expect(mockSendEvent).toHaveBeenCalledWith('select_book', {
        product_id: book.id.split('/').at(-1),
        cart_size: 2,
      }),
    );
    expect(mockAdd).toHaveBeenCalledWith(book);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockOpenScreen).not.toHaveBeenCalled();
  });

  it('shows the cap message with "Go to Cart" and sends order_cap_reached (R2)', async () => {
    const book = card();
    mockAdd.mockResolvedValue({
      kind: 'cap',
      cart: cartOf(linesPriced([99, 99, 99, 99, 99])),
      undone: true,
    });
    await render(<AddToCartButton book={book} />);

    await press(book);

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    const alert = lastAlert();
    // The owner's title (14 October 2026, D-140); the message is unchanged.
    expect(alert.title).toBe('Order limit reached');
    expect(alert.message).toBe(
      'Each order can have books worth less than ₹500. Remove a book to add this one.',
    );
    expect(alert.buttons.map((button) => button.text)).toEqual(['OK', 'Go to Cart']);
    expect(mockSendEvent).toHaveBeenCalledWith('order_cap_reached', { cart_value: 495 });
    expect(mockSendEvent).not.toHaveBeenCalledWith('select_book', expect.anything());

    alert.buttons[1]?.onPress?.();
    expect(mockOpenScreen).toHaveBeenCalledWith('/cart', 'navigate');
  });

  it('shows the cap message when an undone add left the cart over the cap too', async () => {
    const book = card();
    mockAdd.mockResolvedValue({ kind: 'cap', cart: cartOf(linesPriced([450, 50])), undone: false });
    await render(<AddToCartButton book={book} />);

    await press(book);

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(lastAlert().title).toBe('Order limit reached');
    expect(lastAlert().message).toMatch(/^Each order can have books worth less than ₹500/);
    expect(mockSendEvent).toHaveBeenCalledWith('order_cap_reached', { cart_value: 500 });
  });

  it('says the book has just been rented out, with book_unavailable_shown (add_to_cart)', async () => {
    const book = card();
    mockAdd.mockResolvedValue({ kind: 'rented-out', cart: EMPTY_CART });
    await render(<AddToCartButton book={book} />);

    await press(book);

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(lastAlert()).toEqual({
      title: '',
      message: 'This book has just been rented out.',
      buttons: [{ text: 'OK' }],
    });
    expect(mockSendEvent).toHaveBeenCalledWith('book_unavailable_shown', {
      product_id: book.id.split('/').at(-1),
      stage: 'add_to_cart',
    });
  });

  it.each([
    [true, "You're offline. Check your connection and try again."],
    [false, 'Something went wrong. Please try again.'],
  ])('shows the offline or error message (offline %s), and no event', async (offline, text) => {
    const book = card();
    mockAdd.mockResolvedValue({ kind: 'failed', offline });
    await render(<AddToCartButton book={book} />);

    await press(book);

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(lastAlert().title).toBe('');
    expect(lastAlert().message).toBe(text);
    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it.each([
    { kind: 'busy' } as const,
    { kind: 'stale' } as const,
    { kind: 'in-cart', cart: EMPTY_CART } as const,
  ])('shows nothing and sends nothing for $kind', async (outcome) => {
    const book = card();
    mockAdd.mockResolvedValue(outcome);
    await render(<AddToCartButton book={book} />);

    await press(book);
    await waitFor(() => expect(mockAdd).toHaveBeenCalled());

    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockSendEvent).not.toHaveBeenCalled();
  });
});

describe('events only under consent (D-048)', () => {
  it('sends nothing without consent, but still shows the cap message', async () => {
    mockConsent = false;
    const book = card(bookProduct({ title: 'Kid' }));
    mockAdd.mockResolvedValue({ kind: 'cap', cart: cartOf(linesPriced([99])), undone: true });
    await render(<AddToCartButton book={book} />);

    await press(book);

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it('never sends a title, a handle or a cart ID', async () => {
    const book = card();
    mockAdd.mockResolvedValue({ kind: 'added', cart: cartOf(linesPriced([49])) });
    await render(<AddToCartButton book={book} />);

    await press(book);
    await waitFor(() => expect(mockSendEvent).toHaveBeenCalled());

    const sent = JSON.stringify(mockSendEvent.mock.calls);
    expect(sent).not.toContain(book.title);
    expect(sent).not.toContain(book.handle);
    expect(sent).not.toMatch(/gid:|Cart|test-cart/);
  });
});
