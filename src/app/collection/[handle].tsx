import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  trackAvailableChanged,
  trackCollectionShown,
  trackGenreChosen,
  trackPriceChosen,
  trackSortChosen,
} from '@/analytics/catalogueEvents';

import { BookGrid } from '@/components/BookGrid';
import { bookSortOptions, BookListControls } from '@/components/BookListControls';
import { FilterRow } from '@/components/FilterRow';
import { GenrePicker, genreButtonShown } from '@/components/GenrePicker';
import { PricePicker } from '@/components/PricePicker';
import { emptyMessageFor, NOT_FOUND_MESSAGE, ScreenMessage } from '@/components/ScreenMessage';
import { BROWSE_CONTENT, effectiveSort, type BookSort } from '@/config';
import {
  genreCodeFromParam,
  genreOptionForCode,
  useCollectionBooks,
  useGenreOptions,
  usePriceOptions,
  type GenreOption,
  type PriceOption,
} from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize } from '@/theme/tokens';

/**
 * One collection's books (P6-03, D-080), opened from a series tile, an age chip or "See all":
 * two columns, "Load more". "Available now" is on by default and the sort starts at Featured,
 * the collection's own order (P6-04, D-085, D-086). Genre and Price buttons above them in one row
 * that scrolls sideways (P6-07, P6-08; D-101, D-104, D-105): Genre drawn from the start, disabled
 * while its list loads; "All genres" and "All prices" reset each. No "Clear" here. A stack screen
 * with no tab bar, so the list leaves room for Android's navigation bar itself. Usage events
 * (P6-09, D-107): `view_collection` once per opening, when the collection is shown, and
 * `filter_applied` for each change the customer makes, never for a default or the same choice.
 * A book page's genre chip opens this screen for all books (`all-books`) with a `genre`
 * parameter, the genre's taxonomy value number (P6-10, D-113): it is read once, chosen only if
 * this screen's Genre list offers it (with one `filter_applied`), and the books are not read
 * until then. All books are no group, so they start at "Alphabetically, A-Z", offer no Featured
 * and send no `view_collection` (D-085, D-107).
 */
export default function CollectionScreen() {
  const params = useLocalSearchParams<{ handle?: string | string[]; genre?: string | string[] }>();
  const handle = typeof params.handle === 'string' ? params.handle : '';
  return <Collection genreParam={params.genre} handle={handle} />;
}

function Collection({
  handle,
  genreParam,
}: {
  readonly handle: string;
  readonly genreParam: unknown;
}) {
  const insets = useSafeAreaInsets();
  // All books are no group: no Featured, A-Z first, and no view_collection (D-085, D-107, D-113).
  const inGroup = handle !== BROWSE_CONTENT.allBooksHandle;
  const [available, setAvailable] = useState(true);
  const [chosenSort, setChosenSort] = useState<BookSort | null>(null);
  const [genre, setGenre] = useState<GenreOption | null>(null);
  const [price, setPrice] = useState<PriceOption | null>(null);
  // A genre code from a book page's chip, read once, when the screen opens (D-113).
  const [linkedGenre] = useState(() => genreCodeFromParam(genreParam));
  const [linkedGenreSettled, setLinkedGenreSettled] = useState(linkedGenre === null);
  const sort = effectiveSort(chosenSort, inGroup);
  const genreFilter = genre?.filter ?? null;
  const maxPrice = price?.max ?? null;
  const list = useMemo(
    () => ({ available, sort, genre: genreFilter, maxPrice }),
    [available, sort, genreFilter, maxPrice],
  );
  // Held back until a linked genre is applied, so all books never show first (D-113).
  const query = useCollectionBooks(handle, list, { enabled: linkedGenreSettled });
  const genres = useGenreOptions(handle, available);

  // The linked genre is chosen only if this screen's Genre list offers it; otherwise all books
  // show with no genre. Either way, once the list is known or cannot be read. Settled while
  // drawing, as the title below, so the books are read with the genre from their first read.
  const [linkedGenreChosen, setLinkedGenreChosen] = useState<string | null>(null);
  if (!linkedGenreSettled && genres.kind !== 'loading') {
    const option =
      genres.kind === 'ready' && linkedGenre !== null
        ? genreOptionForCode(genres.options, linkedGenre)
        : null;
    setLinkedGenreSettled(true);
    if (option !== null) {
      setGenre(option);
      setLinkedGenreChosen(option.filter.value);
    }
  }
  // One filter_applied for the linked genre (D-113), sent once it is chosen, never while drawing.
  useEffect(() => {
    if (linkedGenreChosen !== null) trackGenreChosen(linkedGenreChosen);
  }, [linkedGenreChosen]);

  const prices = usePriceOptions();
  const first = query.data?.pages[0];
  // Built only when the pages change, so the list does not see a new array on every render.
  const books = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => (page.kind === 'found' ? page.books : [])),
    [query.data],
  );

  // The title stays while a changed toggle or sort loads its first page.
  const [title, setTitle] = useState('');
  if (first?.kind === 'found' && first.title !== title) setTitle(first.title);

  // Once per opening, not again when a filter, the sort or "Load more" reads another page.
  const viewed = useRef(false);
  const shownId = first?.kind === 'found' ? first.id : null;
  useEffect(() => {
    if (viewed.current || shownId === null || !inGroup) return;
    viewed.current = true;
    trackCollectionShown(shownId);
  }, [shownId, inGroup]);

  const onGenre = (next: GenreOption | null) => {
    setGenre(next);
    const nextValue = next?.filter.value ?? null;
    if (nextValue !== (genre?.filter.value ?? null)) trackGenreChosen(nextValue);
  };
  const onPrice = (next: PriceOption | null) => {
    setPrice(next);
    const nextMax = next?.max ?? null;
    if (nextMax !== maxPrice) trackPriceChosen(nextMax);
  };
  const onAvailable = (next: boolean) => {
    setAvailable(next);
    if (next !== available) trackAvailableChanged(next);
  };
  const onSort = (next: BookSort) => {
    setChosenSort(next);
    if (next !== sort) trackSortChosen(next);
  };

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
      {(genreButtonShown(genres, genre) || prices !== null) && (
        <FilterRow onClear={null}>
          <GenrePicker chosen={genre} onChoose={onGenre} state={genres} />
          <PricePicker chosen={price} onChoose={onPrice} options={prices} />
        </FilterRow>
      )}
      <BookListControls
        available={available}
        onAvailableChange={onAvailable}
        onSort={onSort}
        sort={sort}
        sortOptions={bookSortOptions(inGroup)}
      />
      <BookGrid
        books={books}
        bottomInset={insets.bottom}
        emptyMessage={emptyMessageFor(available, genre?.name, price?.phrase)}
        error={query.error}
        hasData={first !== undefined}
        hasNextPage={query.hasNextPage}
        isFetching={query.isFetching}
        isFetchingNextPage={query.isFetchingNextPage}
        loadMoreFailed={query.isFetchNextPageError}
        onLoadMore={() => query.fetchNextPage()}
        // While a linked genre waits for its list, "Try again" only re-reads the network (which
        // resumes the paused list); a forced read now would show all books first.
        onRetry={() => (linkedGenreSettled ? query.refetch() : undefined)}
        testID="collection-books"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
