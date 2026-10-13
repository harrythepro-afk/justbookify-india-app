import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { CustomerSessionState } from '@/customerAccount/session';
import { useCustomerOrders, useCustomerProfile } from '@/customerAccountApi/hooks/customer';
import { CUSTOMER_ORDERS_QUERY } from '@/customerAccountApi/orders';
import { CUSTOMER_PROFILE_QUERY } from '@/customerAccountApi/profile';
import { customerKeys } from '@/customerAccountApi/queryKeys';
import { freshness } from '@/query/freshness';
import { clearAllCaches } from '@/query/queryClient';

import { MARKERS, orderNode, ordersData, profileData } from '../helpers/customerAccountApi';
import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../helpers/queryClient';

const mockQuery = jest.fn();
jest.mock('@/customerAccountApi/client', () => ({
  customerAccountQuery: (...args: unknown[]) => mockQuery(...args),
}));

let mockSession: CustomerSessionState = { status: 'signedIn' };
jest.mock('@/customerAccount/session', () => ({
  useCustomerSession: () => mockSession,
}));

// The hooks refetch on screen focus (D-079); `__tests__/query/screenFocus.test.tsx` covers that.
jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

jest.mock('@/crashReporting/sentry', () => ({
  reportCustomerAccountApiProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
  reportStorefrontProblem: jest.fn(),
}));

// 25 orders: 20, then 5.
const ORDERS = Array.from({ length: 25 }, (_, index) =>
  orderNode({ id: `gid://shopify/Order/${index + 1}`, name: `#${1000 + index}` }),
);

function ordersPage(after: string | null) {
  const start = after === null ? 0 : 20;
  const nodes = ORDERS.slice(start, start + 20);
  const hasNextPage = start + 20 < ORDERS.length;
  return ordersData(nodes, { hasNextPage, endCursor: `end-${start}` });
}

let client: QueryClient;

beforeEach(() => {
  client = createTestQueryClient();
  mockQuery.mockReset();
  mockSession = { status: 'signedIn' };
  mockQuery.mockImplementation(
    async (query: string, options?: { variables?: { after: string | null } }) =>
      query === CUSTOMER_PROFILE_QUERY
        ? profileData()
        : ordersPage(options?.variables?.after ?? null),
  );
});

afterEach(async () => {
  await tearDownQueryClient(client);
});

describe('useCustomerProfile', () => {
  it("reads the profile under the customer's own key root (D-127)", async () => {
    const { result } = await renderHook(() => useCustomerProfile(), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.data?.email).toBe(MARKERS.email));
    expect(mockQuery).toHaveBeenCalledWith(CUSTOMER_PROFILE_QUERY, {
      signal: expect.any(AbortSignal),
    });
    expect(client.getQueryData(customerKeys.profile())).toBeDefined();
    expect(customerKeys.profile()[0]).toBe('customer');
  });

  it.each([
    ['signed out', { status: 'signedOut', notice: 'none', loggingIn: false }],
    ['loading', { status: 'loading' }],
    ['not configured', { status: 'notConfigured' }],
  ] as [string, CustomerSessionState][])('reads nothing while %s', async (_name, session) => {
    mockSession = session;
    const { result } = await renderHook(() => useCustomerProfile(), {
      wrapper: withQueryClient(client),
    });

    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('uses the account freshness preset', async () => {
    await renderHook(() => useCustomerProfile(), { wrapper: withQueryClient(client) });

    await waitFor(() => expect(client.getQueryData(customerKeys.profile())).toBeDefined());
    const query = client.getQueryCache().find({ queryKey: customerKeys.profile() });
    // The cache's stored options type leaves out the observer settings it holds.
    const options = query?.options as { staleTime?: unknown; gcTime?: unknown } | undefined;
    expect(options?.staleTime).toBe(freshness.account.staleTime);
    expect(options?.gcTime).toBe(freshness.account.gcTime);
  });
});

describe('useCustomerOrders', () => {
  it('reads the latest 20, then the next page with the cursor', async () => {
    const { result } = await renderHook(() => useCustomerOrders(), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.data?.pages[0]?.orders).toHaveLength(20);
    expect(result.current.hasNextPage).toBe(true);
    expect(mockQuery).toHaveBeenLastCalledWith(CUSTOMER_ORDERS_QUERY, {
      variables: { first: 20, after: null, lineItems: 20 },
      signal: expect.any(AbortSignal),
    });

    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages[1]?.orders).toHaveLength(5);
    expect(result.current.hasNextPage).toBe(false);
    expect(mockQuery).toHaveBeenLastCalledWith(CUSTOMER_ORDERS_QUERY, {
      variables: { first: 20, after: 'end-0', lineItems: 20 },
      signal: expect.any(AbortSignal),
    });
  });

  it('reads nothing while signed out', async () => {
    mockSession = { status: 'signedOut', notice: 'none', loggingIn: false };
    await renderHook(() => useCustomerOrders(), { wrapper: withQueryClient(client) });

    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('logout (D-061, D-121)', () => {
  it('clearAllCaches empties every customer query', async () => {
    const profile = await renderHook(() => useCustomerProfile(), {
      wrapper: withQueryClient(client),
    });
    const orders = await renderHook(() => useCustomerOrders(), {
      wrapper: withQueryClient(client),
    });
    await waitFor(() => expect(profile.result.current.data).toBeDefined());
    await waitFor(() => expect(orders.result.current.data).toBeDefined());
    await profile.unmount();
    await orders.unmount();

    await clearAllCaches(client);

    expect(client.getQueryCache().findAll({ queryKey: customerKeys.all })).toEqual([]);
  });
});
