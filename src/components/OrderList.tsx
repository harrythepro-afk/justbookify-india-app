import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/BookCover';
import { catalogueViewState, showsOfflineNotice } from '@/components/catalogueViewState';
import { LoadMore } from '@/components/LoadMore';
import { NoDataState, OfflineNotice, ScreenMessage } from '@/components/ScreenMessage';
import {
  formatOrderDate,
  recheckNetwork,
  useIsOffline,
  type OrderStatus,
  type OrderSummary,
} from '@/customerAccountApi/hooks/customer';
import { colors, fonts, fontSize, iconSize, orderCoverWidth, spacing } from '@/theme/tokens';

// Proposed by Claude Code at P7-02's plan, for the owner's approval (D-128).
export const NO_ORDERS_MESSAGE = 'No orders yet.';
export const ORDERS_OFFLINE_NOTICE = "You're offline. Showing saved orders.";
export const MORE_BOOKS_LINE = 'and more books';

/** Shopify's order states in plain words (D-128; mapping in src/customerAccountApi/orders.ts). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order placed',
  partlyShipped: 'Partly shipped',
  shipped: 'Shipped',
  outForDelivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/** "Order #1001" from Shopify's order name "#1001". */
export function orderTitle(name: string): string {
  return `Order ${name}`;
}

/**
 * The customer's orders in My Books (P7-02, architect's answer 2): the latest first, each with
 * its number, date, plain status and its books (cover and title), with "Load more" after each 20.
 * No order opens anything yet (order details come in Phase 11). The states of D-078: loading,
 * offline or error with "Try again" while there is nothing to show, "No orders yet." for none, and
 * the offline notice over saved orders. Every "Try again", and "Load more" after a failed page,
 * re-reads the network first (D-082).
 */
export function OrderList({
  orders,
  hasData,
  isFetching,
  error,
  hasNextPage,
  isFetchingNextPage,
  loadMoreFailed,
  onRetry,
  onLoadMore,
}: {
  readonly orders: readonly OrderSummary[];
  /** True once the first page has arrived. */
  readonly hasData: boolean;
  readonly isFetching: boolean;
  readonly error: unknown;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  /** The last "Load more" failed. */
  readonly loadMoreFailed: boolean;
  readonly onRetry: () => unknown;
  readonly onLoadMore: () => unknown;
}) {
  const isOffline = useIsOffline();

  if (!hasData) {
    const state = catalogueViewState({ hasData, isFetching, isOffline, error });
    return state === 'ready' ? null : (
      <NoDataState onRetry={() => void recheckNetwork().then(() => onRetry())} state={state} />
    );
  }

  return (
    <>
      {showsOfflineNotice({ hasData, isOffline, error }) && (
        <OfflineNotice message={ORDERS_OFFLINE_NOTICE} />
      )}
      <FlatList
        contentContainerStyle={styles.content}
        data={orders}
        initialNumToRender={5}
        keyExtractor={orderKey}
        ListEmptyComponent={<ScreenMessage message={NO_ORDERS_MESSAGE} />}
        ListFooterComponent={
          <LoadMore
            failed={loadMoreFailed}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onPress={() => void recheckNetwork().then(() => onLoadMore())}
          />
        }
        renderItem={renderOrder}
        style={styles.list}
        testID="order-list"
      />
    </>
  );
}

// Defined once, so the list does not see a new function on every render (slow-list warning).
function orderKey(order: OrderSummary): string {
  return order.id;
}

function renderOrder({ item }: { readonly item: OrderSummary }) {
  return <OrderRow order={item} />;
}

function OrderRow({ order }: { readonly order: OrderSummary }) {
  return (
    <View style={styles.order} testID="order-row">
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>{orderTitle(order.name)}</Text>
        <Text style={styles.status}>{ORDER_STATUS_LABELS[order.status]}</Text>
      </View>
      <Text style={styles.date}>{formatOrderDate(order.processedAt)}</Text>
      {order.books.map((book) => (
        <View key={book.id} style={styles.book}>
          <View style={styles.cover}>
            <BookCover book={book} iconSize={iconSize.tab} testID="order-book-cover" />
          </View>
          <Text numberOfLines={2} style={styles.bookTitle}>
            {book.title}
          </Text>
        </View>
      ))}
      {order.moreBooks && <Text style={styles.date}>{MORE_BOOKS_LINE}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  order: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  orderTitle: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  status: { fontFamily: fonts.bodyBold, fontSize: fontSize.small, color: colors.text },
  date: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
  },
  book: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  cover: { width: orderCoverWidth },
  bookTitle: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
});
