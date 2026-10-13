/**
 * The hooks screens use for the customer's own data (P7-02, D-127): the profile and the orders.
 * Both are enabled only while the customer is signed in, use the `account` freshness preset and
 * refetch stale data when their screen regains focus. Screens import values from here only
 * (D-063).
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useCustomerSession } from '@/customerAccount/session';
import { freshness } from '@/query/freshness';
import { useRefetchStaleOnFocus } from '@/query/screenFocus';

import { fetchCustomerOrdersPage } from '../orders';
import { fetchCustomerProfile } from '../profile';
import { customerKeys } from '../queryKeys';

export { recheckNetwork, useIsOffline } from '@/query/online';
export { formatOrderDate } from '../orders';
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
