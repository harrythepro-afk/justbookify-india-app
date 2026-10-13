import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MyBooksScreen, { LOG_IN_TO_SEE_ORDERS } from '@/app/(tabs)/my-books';
import { LOGIN_NOT_SET_UP } from '@/components/AccountLogin';
import {
  MORE_BOOKS_LINE,
  NO_ORDERS_MESSAGE,
  ORDER_STATUS_LABELS,
  ORDERS_OFFLINE_NOTICE,
} from '@/components/OrderList';
import { ERROR_MESSAGE, OFFLINE_MESSAGE } from '@/components/ScreenMessage';
import type { CustomerSessionState } from '@/customerAccount/session';
import { CustomerAccountApiError } from '@/customerAccountApi/errors';
import { toOrderSummary, type OrderSummary } from '@/customerAccountApi/orders';

import { MARKERS, orderNode } from '../helpers/customerAccountApi';

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

let mockSession: CustomerSessionState = { status: 'signedIn' };
jest.mock('@/customerAccount/session', () => ({
  useCustomerSession: () => mockSession,
}));

type OrdersState = {
  data: { pages: { orders: OrderSummary[]; nextCursor: string | null }[] } | undefined;
  error: unknown;
  isFetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
};
let mockOrders: OrdersState;
let mockOffline = false;
const mockRefetch = jest.fn();
const mockFetchNextPage = jest.fn();
const mockRecheck = jest.fn(() => Promise.resolve());
jest.mock('@/customerAccountApi/hooks/customer', () => ({
  useCustomerOrders: () => ({
    ...mockOrders,
    refetch: () => mockRefetch(),
    fetchNextPage: () => mockFetchNextPage(),
  }),
  useIsOffline: () => mockOffline,
  recheckNetwork: () => mockRecheck(),
  formatOrderDate: (iso: string) =>
    jest.requireActual('@/customerAccountApi/orders').formatOrderDate(iso),
}));

const mockOpenScreen = jest.fn();
// The login labels come from the Account tab's login section, which loads the analytics layer
// since P7-03; Firebase's native module is replaced, and these screens send no event.
jest.mock('@/analytics/firebase', () => ({}));

jest.mock('@/navigation/openGuard', () => ({
  ...jest.requireActual('@/navigation/openGuard'),
  openScreen: (...args: unknown[]) => mockOpenScreen(...args),
}));

let mockAppEnv = 'development';
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appEnv: mockAppEnv } };
    },
  },
}));

const SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function SafeArea({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={SAFE_AREA}>{children}</SafeAreaProvider>;
}

function loaded(orders: OrderSummary[], extra: Partial<OrdersState> = {}): OrdersState {
  return {
    data: { pages: [{ orders, nextCursor: null }] },
    error: null,
    isFetching: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    ...extra,
  };
}

const NO_DATA: OrdersState = {
  data: undefined,
  error: null,
  isFetching: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
};

beforeEach(() => {
  mockSession = { status: 'signedIn' };
  mockOrders = loaded([toOrderSummary(orderNode())]);
  mockOffline = false;
  mockAppEnv = 'development';
  jest.clearAllMocks();
});

function expectNoDeadSections() {
  expect(screen.queryByText(/At home/)).toBeNull();
  expect(screen.queryByText(/Returns/)).toBeNull();
}

describe('My Books when not signed in (architect, answer 2)', () => {
  it('asks the customer to log in, and the button opens the Account tab', async () => {
    mockSession = { status: 'signedOut', notice: 'none', loggingIn: false };
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(LOG_IN_TO_SEE_ORDERS)).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Orders' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Log in' }));

    expect(mockOpenScreen).toHaveBeenCalledWith('/account', 'navigate');
    expectNoDeadSections();
  });

  it('shows a spinner while the stored login is read', async () => {
    mockSession = { status: 'loading' };
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Log in' })).toBeNull();
  });

  it('says login is not set up on a development build without it, and nothing on production', async () => {
    mockSession = { status: 'notConfigured' };
    await render(<MyBooksScreen />, { wrapper: SafeArea });
    expect(screen.getByText(LOGIN_NOT_SET_UP)).toBeTruthy();

    mockAppEnv = 'production';
    await render(<MyBooksScreen />, { wrapper: SafeArea });
    expect(screen.queryByText(LOGIN_NOT_SET_UP)).toBeNull();
  });
});

describe('My Books: Orders (architect, answer 2; D-128)', () => {
  it('shows each order with its number, date, plain status and its books', async () => {
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(`Order ${MARKERS.orderName}`)).toBeTruthy();
    expect(screen.getByText(ORDER_STATUS_LABELS.placed)).toBeTruthy();
    expect(screen.getByText(MARKERS.bookTitle)).toBeTruthy();
    expect(screen.getByText(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/)).toBeTruthy();
    expect(screen.getByTestId('order-book-cover')).toBeTruthy();
    expectNoDeadSections();
  });

  it.each(Object.entries(ORDER_STATUS_LABELS))('shows %s as "%s"', async (status, label) => {
    mockOrders = loaded([
      { ...toOrderSummary(orderNode()), status: status as OrderSummary['status'] },
    ]);
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(label)).toBeTruthy();
  });

  it('says "and more books" when an order holds more than were read', async () => {
    mockOrders = loaded([{ ...toOrderSummary(orderNode()), moreBooks: true }]);
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(MORE_BOOKS_LINE)).toBeTruthy();
  });

  it('says "No orders yet." when there are none', async () => {
    mockOrders = loaded([]);
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(NO_ORDERS_MESSAGE)).toBeTruthy();
  });

  it('shows a spinner while the first page loads', async () => {
    mockOrders = { ...NO_DATA, isFetching: true };
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('offline with nothing saved: the offline message, and "Try again" re-reads the network first', async () => {
    mockOffline = true;
    mockOrders = NO_DATA;
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mockRefetch).toHaveBeenCalledTimes(1));
    expect(mockRecheck).toHaveBeenCalledTimes(1);
  });

  it('a request that could not reach Shopify counts as offline too', async () => {
    mockOrders = {
      ...NO_DATA,
      error: new CustomerAccountApiError('no-network', { operationName: 'CustomerOrders' }),
    };
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy();
  });

  it('any other failure with nothing saved: the general error with "Try again"', async () => {
    mockOrders = {
      ...NO_DATA,
      error: new CustomerAccountApiError('graphql-error', { operationName: 'CustomerOrders' }),
    };
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(ERROR_MESSAGE)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('keeps saved orders on screen offline, with the orders notice', async () => {
    mockOffline = true;
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(ORDERS_OFFLINE_NOTICE)).toBeTruthy();
    expect(screen.getByText(`Order ${MARKERS.orderName}`)).toBeTruthy();
  });

  it('offers "Load more" while there is a next page, and keeps it as the retry after a failure', async () => {
    mockOrders = loaded([toOrderSummary(orderNode())], {
      hasNextPage: true,
      isFetchNextPageError: true,
    });
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.getByText(ERROR_MESSAGE)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Load more' }));
    await waitFor(() => expect(mockFetchNextPage).toHaveBeenCalledTimes(1));
    expect(mockRecheck).toHaveBeenCalledTimes(1);
  });

  it('shows no "Load more" on the last page', async () => {
    await render(<MyBooksScreen />, { wrapper: SafeArea });

    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });
});
