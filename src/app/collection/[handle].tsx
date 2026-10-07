import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCard } from '@/components/BookCard';
import { catalogueViewState, showsOfflineNotice } from '@/components/catalogueViewState';
import {
  EMPTY_MESSAGE,
  ERROR_MESSAGE,
  NoDataState,
  NOT_FOUND_MESSAGE,
  OfflineNotice,
  ScreenMessage,
} from '@/components/ScreenMessage';
import {
  recheckNetwork,
  useCollectionBooks,
  useIsOffline,
  type BookCard as BookCardData,
} from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

/**
 * One collection's books (P6-03, D-080), opened from a series tile, an age chip or "See all":
 * every book in the collection's own order, two columns, "Load more". No filters yet; the
 * "Available now" toggle comes with Browse and will apply here too. A stack screen with no tab
 * bar, so the list leaves room for Android's navigation bar itself.
 */
export default function CollectionScreen() {
  const params = useLocalSearchParams<{ handle?: string | string[] }>();
  const handle = typeof params.handle === 'string' ? params.handle : '';
  return <Collection handle={handle} />;
}

function Collection({ handle }: { readonly handle: string }) {
  const insets = useSafeAreaInsets();
  const isOffline = useIsOffline();
  const query = useCollectionBooks(handle);
  const first = query.data?.pages[0];
  const hasData = first !== undefined;
  // Built only when the pages change, so the list does not see a new array on every render.
  const books = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => (page.kind === 'found' ? page.books : [])),
    [query.data],
  );
  const listStyle = useMemo(
    () => [styles.list, { paddingBottom: insets.bottom + spacing.xl }],
    [insets.bottom],
  );

  const header = (title: string) => (
    <Stack.Screen
      options={{
        headerShown: true,
        title,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.heading, fontSize: fontSize.title },
        headerShadowVisible: false,
      }}
    />
  );

  if (first === undefined) {
    const state = catalogueViewState({
      hasData,
      isFetching: query.isFetching,
      isOffline,
      error: query.error,
    });
    return (
      <View style={styles.screen}>
        {header('')}
        {state !== 'ready' && (
          <NoDataState
            onRetry={() => void recheckNetwork().then(() => query.refetch())}
            state={state}
          />
        )}
      </View>
    );
  }

  if (first.kind === 'not-found') {
    return (
      <View style={styles.screen}>
        {header('')}
        <ScreenMessage message={NOT_FOUND_MESSAGE} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header(first.title)}
      {showsOfflineNotice({ hasData, isOffline, error: query.error }) && <OfflineNotice />}
      <FlatList
        columnWrapperStyle={styles.row}
        testID="collection-books"
        contentContainerStyle={listStyle}
        data={books}
        // Rows of two: about two screens are kept around the visible rows, and rows are added
        // a few at a time, so a long collection stays light (slow-list warning, P6-03).
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        keyExtractor={bookKey}
        ListEmptyComponent={<ScreenMessage message={EMPTY_MESSAGE} />}
        ListFooterComponent={
          <LoadMore
            failed={query.isFetchNextPageError}
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            // After a failed page this is the retry, so it re-reads the network first (D-082).
            onPress={() => void recheckNetwork().then(() => query.fetchNextPage())}
          />
        }
        numColumns={2}
        renderItem={renderBook}
        style={styles.screen}
      />
    </View>
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
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.sm },
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
