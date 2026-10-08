import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookGrid } from '@/components/BookGrid';
import { bookSortOptions, BookListControls, ListPicker } from '@/components/BookListControls';
import { GenrePicker, genreButtonShown } from '@/components/GenrePicker';
import { emptyMessageFor, NOT_FOUND_MESSAGE, ScreenMessage } from '@/components/ScreenMessage';
import { SearchButton } from '@/components/SearchButton';
import { BROWSE_CONTENT, effectiveSort, type BookSort, type CollectionLink } from '@/config';
import {
  useCollectionBooks,
  useCollectionHandles,
  useGenreOptions,
  type BookListOptions,
  type GenreOption,
} from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

type GroupKind = 'age-group' | 'series';

/** The one group a customer has chosen, an age group or a series (D-084). */
type Group = { readonly kind: GroupKind; readonly link: CollectionLink };

const GROUP_NAMES: Record<GroupKind, string> = { 'age-group': 'Age group', series: 'Series' };

/**
 * Browse, "Books for Rent" (P6-04; `PRODUCT_REQUIREMENTS.md`, "Screen layouts"): Age group, Genre
 * and Series buttons, the "Available now" switch, the sort, and two columns of book cards, 20 at a
 * time. With no group chosen it lists the collection that holds every book (D-100); choosing an
 * age group or a series replaces any earlier choice (D-084). A genre combines with the group,
 * "Available now" and the sort, and stays when they change (D-101). "Clear" resets the group and
 * the genre, and leaves "Available now" and the sort. "Available now" is on by default (D-086).
 * Settings live in the screen: the tab stays mounted, so they survive switching tabs. The tab bar
 * already leaves room for Android's navigation bar (D-080). Search sits under Browse: a search
 * button beside the title opens it (P6-06).
 */
export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [group, setGroup] = useState<Group | null>(null);
  const [genre, setGenre] = useState<GenreOption | null>(null);
  const [available, setAvailable] = useState(true);
  const [chosenSort, setChosenSort] = useState<BookSort | null>(null);
  const inGroup = group !== null;
  const sort = effectiveSort(chosenSort, inGroup);
  const genreFilter = genre?.filter ?? null;
  const list = useMemo(
    () => ({ available, sort, genre: genreFilter }),
    [available, sort, genreFilter],
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
        }}
        onGenre={setGenre}
        onGroup={setGroup}
      />
      <BookListControls
        available={available}
        onAvailableChange={setAvailable}
        onSort={setChosenSort}
        sort={sort}
        sortOptions={bookSortOptions(inGroup)}
      />
      <Books genreName={genre?.name} handle={handle} list={list} />
    </View>
  );
}

/**
 * "Age group", "Genre" and "Series", then "Clear". Age group and Series list only the configured
 * collections the store has (D-076); a button with none is not drawn, and the row is drawn only
 * once the store's handles are known. From then on the Genre button keeps its place: disabled while
 * its list loads, removed only when the list is known to be empty or cannot be read (D-101).
 * "Clear" shows whenever a group or a genre is chosen.
 */
function FilterButtons({
  handle,
  available,
  group,
  genre,
  onGroup,
  onGenre,
  onClear,
}: {
  readonly handle: string;
  readonly available: boolean;
  readonly group: Group | null;
  readonly genre: GenreOption | null;
  readonly onGroup: (group: Group) => void;
  readonly onGenre: (genre: GenreOption | null) => void;
  readonly onClear: () => void;
}) {
  const handles = useCollectionHandles();
  const genres = useGenreOptions(handle, available);
  const existing = handles.data;
  if (existing === undefined) return null;

  const offered = (kind: GroupKind, links: readonly CollectionLink[]) => {
    const present = links.filter((link) => existing.has(link.handle));
    return present.length > 0 ? { kind, links: present } : null;
  };
  const ageGroups = offered('age-group', BROWSE_CONTENT.ageGroups);
  const series = offered('series', BROWSE_CONTENT.series);
  const showGenre = genreButtonShown(genres, genre);
  const chosenAny = group !== null || genre !== null;
  if (ageGroups === null && series === null && !showGenre && !chosenAny) return null;

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
    <View style={styles.groups}>
      {groupButton(ageGroups)}
      <GenrePicker chosen={genre} onChoose={onGenre} state={genres} />
      {groupButton(series)}
      {chosenAny && (
        <Pressable
          accessibilityLabel="Clear filters, show all books"
          accessibilityRole="button"
          onPress={onClear}
          style={styles.clear}
          testID="clear-filters"
        >
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
}

/** The list's books: all books (D-100) or one group's collection by handle (D-068). */
function Books({
  handle,
  list,
  genreName,
}: {
  readonly handle: string;
  readonly list: BookListOptions;
  readonly genreName: string | undefined;
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
      emptyMessage={emptyMessageFor(list.available, genreName)}
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
  groups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  clear: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  clearText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.small,
    color: colors.onPrimaryButton,
  },
});
