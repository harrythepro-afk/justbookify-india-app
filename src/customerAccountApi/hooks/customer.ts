/**
 * The hooks screens use for the customer's own data (P7-02, D-127): the profile and the orders.
 * Both are enabled only while the customer is signed in, use the `account` freshness preset and
 * refetch stale data when their screen regains focus. Screens import values from here only
 * (D-063).
 */

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { getCustomerSessionState, useCustomerSession } from '@/customerAccount/session';
import { freshness } from '@/query/freshness';
import { useRefetchStaleOnFocus } from '@/query/screenFocus';

import { fetchCustomerOrdersPage, type OrdersPage, type OrderSummary } from '../orders';
import { findPlacedOrder, type PlacedOrderSearch } from '../placedOrder';
import { fetchCustomerProfile } from '../profile';
import { customerKeys } from '../queryKeys';

export { recheckNetwork, useIsOffline } from '@/query/online';
export { formatOrderDate } from '../orders';
export {
  orderIdForm,
  orderIdNumber,
  type OrderIdForm,
  type PlacedOrderSearch,
} from '../placedOrder';
export type { OrderBook, OrderStatus, OrderSummary, OrdersPage } from '../orders';
export type { CustomerProfile } from '../profile';

function useSignedIn(): boolean {
  return useCustomerSession().status === 'signedIn';
}

export function useCustomerProfile() {
  const queryKey = customerKeys.profile();
  useRefetchStaleOnFocus(queryKey);
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchCustomerProfile(signal),
    ...freshness.account,
    enabled: useSignedIn(),
  });
}

/** How many times, and how far apart, the orders are read for a just-placed order (D-151). */
export const PLACED_ORDER_READS = 3;
export const PLACED_ORDER_READ_GAP_MILLIS = 3000;

function wait(millis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

/** The customer's first page of orders, read now (also refreshing My Books's cache). */
async function readLatestOrders(queryClient: QueryClient): Promise<readonly OrderSummary[]> {
  // Always read now (staleTime 0); pages My Books already loaded are read again with the first.
  const data: InfiniteData<OrdersPage, string | null> = await queryClient.fetchInfiniteQuery({
    queryKey: customerKeys.orders(),
    queryFn: ({ pageParam, signal }) => fetchCustomerOrdersPage({ after: pageParam, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: OrdersPage) => lastPage.nextCursor,
    ...freshness.account,
    staleTime: 0,
  });
  return data.pages[0]?.orders ?? [];
}

export type PlacedOrder = Pick<OrderSummary, 'id' | 'name'>;

/**
 * Finding the order a checkout placed (P9-01, D-151). `remember()` reads the customer's orders
 * when checkout starts (their IDs only, kept by the caller in memory); `find()` reads them again
 * after it, up to PLACED_ORDER_READS times, since a new order can take a few seconds to appear.
 * Both never throw: a failed read counts as nothing remembered or found. Signed out: nothing.
 */
export function usePlacedOrderSearch(): {
  readonly remember: () => Promise<ReadonlySet<string> | undefined>;
  readonly find: (search: PlacedOrderSearch) => Promise<PlacedOrder | undefined>;
} {
  const queryClient = useQueryClient();
  const remember = useCallback(async () => {
    if (getCustomerSessionState().status !== 'signedIn') return undefined;
    try {
      return new Set((await readLatestOrders(queryClient)).map((order) => order.id));
    } catch {
      return undefined;
    }
  }, [queryClient]);
  const find = useCallback(
    async (search: PlacedOrderSearch) => {
      for (let read = 0; read < PLACED_ORDER_READS; read += 1) {
        if (getCustomerSessionState().status !== 'signedIn') return undefined;
        if (read > 0) await wait(PLACED_ORDER_READ_GAP_MILLIS);
        try {
          const found = findPlacedOrder(await readLatestOrders(queryClient), search);
          if (found !== undefined) return { id: found.id, name: found.name };
        } catch {
          // Reported by the cache (D-061); read again or give up quietly.
        }
      }
      return undefined;
    },
    [queryClient],
  );
  return { remember, find };
}

export function useCustomerOrders() {
  const queryKey = customerKeys.orders();
  useRefetchStaleOnFocus(queryKey);
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchCustomerOrdersPage({ after: pageParam, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...freshness.account,
    enabled: useSignedIn(),
  });
}
