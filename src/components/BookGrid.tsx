import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { catalogueViewState, showsOfflineNotice } from '@/components/catalogueViewState';
import {
  ERROR_MESSAGE,
  NoDataState,
  OfflineNotice,
  ScreenMessage,
} from '@/components/ScreenMessage';
import {
  recheckNetwork,
  useIsOffline,
  type BookCard as BookCardData,
} from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

/**
 * A list of books in two columns with "Load more" (P6-03, D-080), shared by Browse and the
 * collection screen (P6-04), with the states of D-078: loading, offline or error with "Try
 * again" while there is nothing to show, and the offline notice over saved books. Every "Try
 * again", and "Load more" after a failed page, re-reads the network first (D-082).
 */
export function BookGrid({
  books,
  hasData,
  isFetching,
  error,
  hasNextPage,
  isFetchingNextPage,
  loadMoreFailed,
  onRetry,
  onLoadMore,
  emptyMessage,
  bottomInset,
  testID,
}: {
  readonly books: readonly BookCardData[];
  /** True once the first page has arrived. */
  readonly hasData: boolean;
  readonly isFetching: boolean;
  readonly error: unknown;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  /** The last "Load more" failed. */
  readonly loadMoreFailed: boolean;
  /** Reads the list again. */
  readonly onRetry: () => unknown;
  /** Reads the next page. */
  readonly onLoadMore: () => unknown;
  readonly emptyMessage: string;
  /** Room for Android's navigation bar on a stack screen; 0 on a tab screen (D-080). */
  readonly bottomInset: number;
  readonly testID: string;
}) {
  const isOffline = useIsOffline();
  const listStyle = useMemo(
    () => [styles.content, { paddingBottom: bottomInset + spacing.xl }],
    [bottomInset],
  );

  if (!hasData) {
    const state = catalogueViewState({ hasData, isFetching, isOffline, error });
    return state === 'ready' ? null : (
      <NoDataState onRetry={() => void recheckNetwork().then(() => onRetry())} state={state} />
    );
  }

  return (
    <>
      {showsOfflineNotice({ hasData, isOffline, error }) && <OfflineNotice />}
      <FlatList
        columnWrapperStyle={styles.row}
        testID={testID}
        contentContainerStyle={listStyle}
        data={books}
        // Rows of two: about two screens are kept around the visible rows, and rows are added
        // a few at a time, so a long list stays light (slow-list warning, P6-03).
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        keyExtractor={bookKey}
        ListEmptyComponent={<ScreenMessage message={emptyMessage} />}
        ListFooterComponent={
          <LoadMore
            failed={loadMoreFailed}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            // After a failed page this is the retry, so it re-reads the network first (D-082).
            onPress={() => void recheckNetwork().then(() => onLoadMore())}
          />
        }
        numColumns={2}
        renderItem={renderBook}
        style={styles.list}
      />
    </>
  );
}

// Defined once, so the list does not see a new function on every render (slow-list warning).
function bookKey(book: BookCardData): string {
  return book.id;
}

function renderBook({ item }: { readonly item: BookCardData }) {
  return (
    <View style={styles.cell}>
      <BookCard book={item} />
    </View>
  );
}

/** "Load more" while there is a next page. After a failed page it stays, as the retry. */
function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  failed,
  onPress,
}: {
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly failed: boolean;
  readonly onPress: () => void;
}) {
  if (!hasNextPage) return null;
  return (
    <>
      {failed && !isFetchingNextPage && (
        <Text accessibilityLiveRegion="polite" style={styles.footerMessage}>
          {ERROR_MESSAGE}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isFetchingNextPage }}
        disabled={isFetchingNextPage}
        onPress={onPress}
        style={[styles.loadMore, isFetchingNextPage && styles.disabled]}
      >
        <Text style={styles.loadMoreText}>{isFetchingNextPage ? 'Loading…' : 'Load more'}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.sm },
  row: { alignItems: 'flex-start' },
  cell: { width: '50%', padding: spacing.sm },
  footerMessage: {
    marginTop: spacing.lg,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'center',
  },
  loadMore: {
    minHeight: minTouchTarget,
    marginTop: spacing.lg,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  disabled: { opacity: 0.5 },
  loadMoreText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.onPrimaryButton,
  },
});
