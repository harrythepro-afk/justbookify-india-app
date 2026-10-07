import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookGrid } from '@/components/BookGrid';
import { bookSortOptions, BookListControls } from '@/components/BookListControls';
import { emptyMessageFor, NOT_FOUND_MESSAGE, ScreenMessage } from '@/components/ScreenMessage';
import { effectiveSort, type BookSort } from '@/config';
import { useCollectionBooks } from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize } from '@/theme/tokens';

/**
 * One collection's books (P6-03, D-080), opened from a series tile, an age chip or "See all":
 * two columns, "Load more". "Available now" is on by default and the sort starts at Featured,
 * the collection's own order (P6-04, D-085, D-086). A stack screen with no tab bar, so the list
 * leaves room for Android's navigation bar itself.
 */
export default function CollectionScreen() {
  const params = useLocalSearchParams<{ handle?: string | string[] }>();
  const handle = typeof params.handle === 'string' ? params.handle : '';
  return <Collection handle={handle} />;
}

function Collection({ handle }: { readonly handle: string }) {
  const insets = useSafeAreaInsets();
  const [available, setAvailable] = useState(true);
  const [chosenSort, setChosenSort] = useState<BookSort | null>(null);
  const sort = effectiveSort(chosenSort, true);
  const list = useMemo(() => ({ available, sort }), [available, sort]);
  const query = useCollectionBooks(handle, list);
  const first = query.data?.pages[0];
  // Built only when the pages change, so the list does not see a new array on every render.
  const books = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => (page.kind === 'found' ? page.books : [])),
    [query.data],
  );

  // The title stays while a changed toggle or sort loads its first page.
  const [title, setTitle] = useState('');
  if (first?.kind === 'found' && first.title !== title) setTitle(first.title);

  const header = (
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

  if (first?.kind === 'not-found') {
    return (
      <View style={styles.screen}>
        {header}
        <ScreenMessage message={NOT_FOUND_MESSAGE} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header}
      <BookListControls
        available={available}
        onAvailableChange={setAvailable}
        onSort={setChosenSort}
        sort={sort}
        sortOptions={bookSortOptions(true)}
      />
      <BookGrid
        books={books}
        bottomInset={insets.bottom}
        emptyMessage={emptyMessageFor(available)}
        error={query.error}
        hasData={first !== undefined}
        hasNextPage={query.hasNextPage}
        isFetching={query.isFetching}
        isFetchingNextPage={query.isFetchingNextPage}
        loadMoreFailed={query.isFetchNextPageError}
        onLoadMore={() => query.fetchNextPage()}
        onRetry={() => query.refetch()}
        testID="collection-books"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
