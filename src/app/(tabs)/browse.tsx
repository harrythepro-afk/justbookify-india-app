import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookGrid } from '@/components/BookGrid';
import { bookSortOptions, BookListControls, ListPicker } from '@/components/BookListControls';
import { FilterRow } from '@/components/FilterRow';
import { GenrePicker, genreButtonShown } from '@/components/GenrePicker';
import { PricePicker } from '@/components/PricePicker';
import { emptyMessageFor, NOT_FOUND_MESSAGE, ScreenMessage } from '@/components/ScreenMessage';
import { SearchButton } from '@/components/SearchButton';
import { BROWSE_CONTENT, effectiveSort, type BookSort, type CollectionLink } from '@/config';
import {
  useCollectionBooks,
  useCollectionHandles,
  useGenreOptions,
  usePriceOptions,
  type BookListOptions,
  type GenreOption,
  type PriceOption,
} from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

type GroupKind = 'age-group' | 'series';

/** The one group a customer has chosen, an age group or a series (D-084). */
type Group = { readonly kind: GroupKind; readonly link: CollectionLink };

const GROUP_NAMES: Record<GroupKind, string> = { 'age-group': 'Age group', series: 'Series' };

/**
 * Browse, "Books for Rent" (P6-04; `PRODUCT_REQUIREMENTS.md`, "Screen layouts"): Age group,
 * Genre, Price and Series buttons in one row that scrolls sideways, with "Clear" pinned at its
 * right edge (D-105), the "Available now" switch, the sort, and two columns of book cards, 20 at a
 * time. With no group chosen it lists the collection that holds every book (D-100); choosing an
 * age group or a series replaces any earlier choice (D-084). A genre and a price combine with the
 * group, "Available now", the sort and each other, and stay when they change (D-101, D-104).
 * "Clear" resets the group, the genre and the price, and leaves "Available now" and the sort.
 * "Available now" is on by default (D-086). Settings live in the screen: the tab stays mounted, so
 * they survive switching tabs. The tab bar already leaves room for Android's navigation bar
 * (D-080). Search sits under Browse: a search button beside the title opens it (P6-06).
 */
export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [group, setGroup] = useState<Group | null>(null);
  const [genre, setGenre] = useState<GenreOption | null>(null);
  const [price, setPrice] = useState<PriceOption | null>(null);
  const [available, setAvailable] = useState(true);
  const [chosenSort, setChosenSort] = useState<BookSort | null>(null);
  const inGroup = group !== null;
  const sort = effectiveSort(chosenSort, inGroup);
  const genreFilter = genre?.filter ?? null;
  const maxPrice = price?.max ?? null;
  const list = useMemo(
    () => ({ available, sort, genre: genreFilter, maxPrice }),
    [available, sort, genreFilter, maxPrice],
  );
  const handle = group?.link.handle ?? BROWSE_CONTENT.allBooksHandle;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={styles.title}>
          {BROWSE_CONTENT.title}
        </Text>
        <SearchButton testID="browse-search" />
      </View>
      <FilterButtons
        available={available}
        genre={genre}
        group={group}
        handle={handle}
        onClear={() => {
          setGroup(null);
          setGenre(null);
          setPrice(null);
        }}
        onGenre={setGenre}
        onGroup={setGroup}
        onPrice={setPrice}
        price={price}
      />
      <BookListControls
        available={available}
        onAvailableChange={setAvailable}
        onSort={setChosenSort}
        sort={sort}
        sortOptions={bookSortOptions(inGroup)}
      />
      <Books genreName={genre?.name} handle={handle} list={list} pricePhrase={price?.phrase} />
    </View>
  );
}

/**
 * "Age group", "Genre", "Price" and "Series" in one row that scrolls sideways, then "Clear"
 * pinned at the right edge (D-105). Age group and Series list only the configured collections the
 * store has (D-076); a button with none is not drawn, and the row is drawn only once the store's
 * handles are known. From then on the Genre button keeps its place: disabled while its list loads,
 * removed only when the list is known to be empty or cannot be read (D-101). The Price button
 * needs no read (D-104). "Clear" shows whenever a group, a genre or a price is chosen.
 */
function FilterButtons({
  handle,
  available,
  group,
  genre,
  price,
  onGroup,
  onGenre,
  onPrice,
  onClear,
}: {
  readonly handle: string;
  readonly available: boolean;
  readonly group: Group | null;
  readonly genre: GenreOption | null;
  readonly price: PriceOption | null;
  readonly onGroup: (group: Group) => void;
  readonly onGenre: (genre: GenreOption | null) => void;
  readonly onPrice: (price: PriceOption | null) => void;
  readonly onClear: () => void;
}) {
  const handles = useCollectionHandles();
  const genres = useGenreOptions(handle, available);
  const prices = usePriceOptions();
  const existing = handles.data;
  if (existing === undefined) return null;

  const offered = (kind: GroupKind, links: readonly CollectionLink[]) => {
    const present = links.filter((link) => existing.has(link.handle));
    return present.length > 0 ? { kind, links: present } : null;
  };
  const ageGroups = offered('age-group', BROWSE_CONTENT.ageGroups);
  const series = offered('series', BROWSE_CONTENT.series);
  const showGenre = genreButtonShown(genres, genre);
  const chosenAny = group !== null || genre !== null || price !== null;
  if (ageGroups === null && series === null && !showGenre && prices === null && !chosenAny) {
    return null;
  }

  const groupButton = (offer: { kind: GroupKind; links: readonly CollectionLink[] } | null) => {
    if (offer === null) return null;
    const { kind, links } = offer;
    const chosen = group?.kind === kind ? group.link : null;
    const name = GROUP_NAMES[kind];
    return (
      <ListPicker
        accessibilityLabel={chosen === null ? name : `${name}, ${chosen.label}`}
        buttonLabel={chosen === null ? name : `${name}: ${chosen.label}`}
        key={kind}
        onSelect={(selected) => {
          const link = links.find((candidate) => candidate.handle === selected);
          if (link !== undefined) onGroup({ kind, link });
        }}
        options={links.map((link) => ({ value: link.handle, label: link.label }))}
        selected={chosen?.handle ?? null}
        testID={kind}
        title={name}
      />
    );
  };

  return (
    <FilterRow onClear={chosenAny ? onClear : null}>
      {groupButton(ageGroups)}
      <GenrePicker chosen={genre} onChoose={onGenre} state={genres} />
      <PricePicker chosen={price} onChoose={onPrice} options={prices} />
      {groupButton(series)}
    </FilterRow>
  );
}

/** The list's books: all books (D-100) or one group's collection by handle (D-068). */
function Books({
  handle,
  list,
  genreName,
  pricePhrase,
}: {
  readonly handle: string;
  readonly list: BookListOptions;
  readonly genreName: string | undefined;
  readonly pricePhrase: string | undefined;
}) {
  const query = useCollectionBooks(handle, list);
  const first = query.data?.pages[0];
  const books = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => (page.kind === 'found' ? page.books : [])),
    [query.data],
  );
  // A group removed from the store after the handles were read, or a missing all-books collection.
  if (first?.kind === 'not-found') return <ScreenMessage message={NOT_FOUND_MESSAGE} />;
  return (
    <BookGrid
      books={books}
      bottomInset={0}
      emptyMessage={emptyMessageFor(list.available, genreName, pricePhrase)}
      error={query.error}
      hasData={first !== undefined}
      hasNextPage={query.hasNextPage}
      isFetching={query.isFetching}
      isFetchingNextPage={query.isFetchingNextPage}
      loadMoreFailed={query.isFetchNextPageError}
      onLoadMore={() => query.fetchNextPage()}
      onRetry={() => query.refetch()}
      testID="browse-books"
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.text,
  },
});
