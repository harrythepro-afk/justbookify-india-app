import type { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

import DevCheckoutScreen from '@/app/dev-checkout';
import type { StoreConfigStatus } from '@/config/store';
import {
  DevCheckoutError,
  type DevCheckoutCart,
  type DevCheckoutLine,
  type DevCheckoutVariant,
} from '@/shopify/devCheckout';
import { StorefrontError } from '@/shopify/errors';

import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../helpers/queryClient';

let mockAppEnv = 'development';
let mockStoreStatus: StoreConfigStatus = 'configured';
const mockListVariants = jest.fn<Promise<DevCheckoutVariant[]>, []>();
const mockCreateDevCheckout = jest.fn<Promise<DevCheckoutCart>, [readonly DevCheckoutLine[]]>();
const mockPresent = jest.fn();
const mockRemove = jest.fn();
const mockListeners = new Map<string, (event?: unknown) => void>();

jest.mock('@shopify/checkout-sheet-kit', () => {
  const checkout = {
    present: (url: string) => mockPresent(url),
    addEventListener: (name: string, callback: (event?: unknown) => void) => {
      mockListeners.set(name, callback);
      return { remove: mockRemove };
    },
  };
  return {
    ShopifyCheckoutSheetProvider: ({ children }: { children: ReactNode }) => children,
    useShopifyCheckoutSheet: () => checkout,
  };
});

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return { Redirect: ({ href }: { href: string }) => <Text>Redirect to {href}</Text> };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appEnv: mockAppEnv } };
    },
  },
}));

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfigStatus: () => mockStoreStatus,
}));

jest.mock('@/shopify/devCheckout', () => ({
  ...jest.requireActual('@/shopify/devCheckout'),
  listDevCheckoutVariants: () => mockListVariants(),
  createDevCheckout: (lines: readonly DevCheckoutLine[]) => mockCreateDevCheckout(lines),
}));

const CHECKOUT_URL = 'https://example-dev-store.myshopify.com/cart/c/test-cart';

const VARIANTS: DevCheckoutVariant[] = [
  { id: 'gid://shopify/ProductVariant/2', title: 'Picture Book', price: 99, currencyCode: 'INR' },
  { id: 'gid://shopify/ProductVariant/3', title: 'Rare Atlas', price: 149.5, currencyCode: 'INR' },
];

const CART: DevCheckoutCart = {
  checkoutUrl: CHECKOUT_URL,
  subtotal: 198,
  currencyCode: 'INR',
  warningCodes: [],
};

// Testing Library 14's act and fireEvent are asynchronous and must be awaited.
async function emit(name: string, event?: unknown) {
  const listener = mockListeners.get(name);
  if (listener === undefined) throw new Error(`No listener for ${name}`);
  await act(async () => listener(event));
}

async function press(name: string, times = 1) {
  for (let i = 0; i < times; i += 1) {
    await fireEvent.press(screen.getByRole('button', { name }));
  }
}

let queryClient: QueryClient;

// The screen reads through the app's query cache (D-061); each test gets a fresh one.
function renderScreen() {
  queryClient = createTestQueryClient();
  return render(<DevCheckoutScreen />, { wrapper: withQueryClient(queryClient) });
}

async function renderLoaded() {
  await renderScreen();
  await screen.findByText('Picture Book, INR 99.00');
}

/** Renders the screen, puts two Picture Books in the cart and opens checkout. */
async function openWithTwoBooks() {
  await renderLoaded();
  await press('Add one Picture Book', 2);
  await press('Open test checkout');
}

describe('DevCheckoutScreen', () => {
  // React Native loads ScrollView's module tree on first access. On a cold Jest cache (CI) that
  // takes several seconds, so it is loaded here, with its own time limit, and every test keeps
  // the default one.
  beforeAll(() => {
    expect(ScrollView).toBeDefined();
  }, 60_000);

  beforeEach(() => {
    mockAppEnv = 'development';
    mockStoreStatus = 'configured';
    mockListVariants.mockReset().mockResolvedValue(VARIANTS);
    mockCreateDevCheckout.mockReset().mockResolvedValue(CART);
    mockPresent.mockReset();
    mockRemove.mockReset();
    mockListeners.clear();
  });

  afterEach(async () => {
    await tearDownQueryClient(queryClient);
  });

  it.each(['staging', 'production'])('sends a %s build back to the start screen', async (env) => {
    mockAppEnv = env;

    await renderScreen();

    expect(screen.getByText('Redirect to /')).toBeOnTheScreen();
    expect(screen.queryByText('Test checkout')).not.toBeOnTheScreen();
    expect(mockListeners.size).toBe(0);
    expect(mockListVariants).not.toHaveBeenCalled();
  });

  it('lists the available books and offers no checkout until one is chosen', async () => {
    await renderLoaded();

    expect(screen.getByText('Rare Atlas, INR 149.50')).toBeOnTheScreen();
    expect(screen.getByText('Estimated subtotal: INR 0.00')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open test checkout' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove one Picture Book' })).toBeDisabled();
  });

  it('keeps each quantity between 0 and 10 and estimates the subtotal', async () => {
    await renderLoaded();

    await press('Add one Picture Book', 11);
    expect(screen.getByLabelText('Quantity of Picture Book')).toHaveTextContent('10');
    expect(screen.getByRole('button', { name: 'Add one Picture Book' })).toBeDisabled();

    await press('Remove one Picture Book', 8);
    await press('Add one Rare Atlas');
    expect(screen.getByLabelText('Quantity of Picture Book')).toHaveTextContent('2');
    expect(screen.getByText('Estimated subtotal: INR 347.50')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open test checkout' })).toBeEnabled();
  });

  it("creates a cart from the chosen lines, presents it and shows Shopify's subtotal", async () => {
    await renderLoaded();
    await press('Add one Picture Book', 2);
    await press('Add one Rare Atlas');
    await press('Remove one Rare Atlas');

    await press('Open test checkout');

    expect(mockCreateDevCheckout).toHaveBeenCalledWith([
      { merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 2 },
    ]);
    expect(mockPresent).toHaveBeenCalledWith(CHECKOUT_URL);
    expect(screen.getByText('Checkout is open.')).toBeOnTheScreen();
    expect(screen.getByText('Cart subtotal from Shopify: INR 198.00.')).toBeOnTheScreen();
    expect(screen.queryByText(/myshopify/)).not.toBeOnTheScreen();
  });

  it("shows Shopify's cart warning codes", async () => {
    mockCreateDevCheckout.mockResolvedValueOnce({
      ...CART,
      subtotal: 99,
      warningCodes: ['MERCHANDISE_NOT_ENOUGH_STOCK'],
    });

    await openWithTwoBooks();

    expect(
      screen.getByText(
        'Cart subtotal from Shopify: INR 99.00. Shopify warnings: MERCHANDISE_NOT_ENOUGH_STOCK.',
      ),
    ).toBeOnTheScreen();
  });

  it('shows the completed result and keeps it when checkout then closes', async () => {
    await openWithTwoBooks();

    await emit('completed', { orderDetails: { id: 'gid://shopify/OrderIdentity/1' } });
    expect(screen.getByText('Checkout completed: the order was placed.')).toBeOnTheScreen();

    await emit('close');
    expect(screen.getByText('Checkout completed: the order was placed.')).toBeOnTheScreen();
  });

  it('says when checkout closes without an order', async () => {
    await openWithTwoBooks();

    await emit('close');

    expect(screen.getByText('Checkout closed without an order.')).toBeOnTheScreen();
  });

  it('shows only the code of a checkout error', async () => {
    await renderLoaded();

    await emit('error', { code: 'storefront_password_required', message: CHECKOUT_URL });

    expect(screen.getByText('Checkout error: storefront_password_required.')).toBeOnTheScreen();
    expect(screen.queryByText(/myshopify/)).not.toBeOnTheScreen();
  });

  it('shows a cart error and does not present checkout', async () => {
    mockCreateDevCheckout.mockRejectedValueOnce(new DevCheckoutError('cart-rejected'));

    await openWithTwoBooks();

    expect(mockPresent).not.toHaveBeenCalled();
    expect(screen.getByText('The store did not create the cart.')).toBeOnTheScreen();
  });

  it("shows a Storefront error's own wording and codes", async () => {
    mockCreateDevCheckout.mockRejectedValueOnce(
      new StorefrontError('user-errors', {
        operationName: 'DevCheckoutCartCreate',
        codes: ['INVALID'],
      }),
    );

    await openWithTwoBooks();

    expect(mockPresent).not.toHaveBeenCalled();
    expect(
      screen.getByText('The store did not accept the request. (DevCheckoutCartCreate; INVALID)'),
    ).toBeOnTheScreen();
  });

  it('hides the text of an unexpected error', async () => {
    mockCreateDevCheckout.mockRejectedValueOnce(new Error(`failed at ${CHECKOUT_URL}`));

    await openWithTwoBooks();

    expect(screen.getByText('Unexpected error opening checkout.')).toBeOnTheScreen();
    expect(screen.queryByText(/myshopify/)).not.toBeOnTheScreen();
  });

  it('shows why the books could not be listed', async () => {
    mockListVariants.mockRejectedValueOnce(new DevCheckoutError('no-available-variant'));

    await renderScreen();

    expect(
      await screen.findByText('No product variant on the store is available for sale.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Open test checkout' })).not.toBeOnTheScreen();
  });

  it('hides the text of an unexpected listing error', async () => {
    mockListVariants.mockRejectedValueOnce(new Error(`failed at ${CHECKOUT_URL}`));

    await renderScreen();

    expect(await screen.findByText('Unexpected error.')).toBeOnTheScreen();
    expect(screen.queryByText(/myshopify/)).not.toBeOnTheScreen();
  });

  it('offers no button and reads nothing when the store is not configured', async () => {
    mockStoreStatus = 'not configured';

    await renderScreen();

    expect(screen.queryByRole('button', { name: 'Open test checkout' })).not.toBeOnTheScreen();
    expect(screen.getByText('Store configuration: not configured')).toBeOnTheScreen();
    expect(mockListVariants).not.toHaveBeenCalled();
  });

  it('removes its checkout listeners when it unmounts', async () => {
    const { unmount } = await renderScreen();

    await act(async () => unmount());

    expect(mockRemove).toHaveBeenCalledTimes(3);
  });
});
