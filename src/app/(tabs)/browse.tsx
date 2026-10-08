import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookGrid } from '@/components/BookGrid';
import { bookSortOptions, BookListControls, ListPicker } from '@/components/BookListControls';
import { emptyMessageFor, NOT_FOUND_MESSAGE, ScreenMessage } from '@/components/ScreenMessage';
import { SearchButton } from '@/components/SearchButton';
import { BROWSE_CONTENT, effectiveSort, type BookSort, type CollectionLink } from '@/config';
import {
  useAllBooks,
  useCollectionBooks,
  useCollectionHandles,
  type BookListOptions,
} from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

type GroupKind = 'age-group' | 'series';

/** The one group a customer has chosen, an age group or a series (D-084). */
type Group = { readonly kind: GroupKind; readonly link: CollectionLink };

const GROUP_NAMES: Record<GroupKind, string> = { 'age-group': 'Age group', series: 'Series' };

/**
 * Browse, "Books for Rent" (P6-04; `PRODUCT_REQUIREMENTS.md`, "Screen layouts"): Age group and
 * Series buttons, the "Available now" switch, the sort, and two columns of book cards, 20 at a
 * time. With no group chosen it lists all books (D-083); choosing an age group or a series
 * replaces any earlier choice, and "Clear" returns to all books (D-084). "Available now" is on
 * by default (D-086). Settings live in the screen: the tab stays mounted, so they survive
 * switching tabs. The tab bar already leaves room for Android's navigation bar (D-080). Search
 * sits under Browse: a search button beside the title opens it (P6-06).
 */
export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [group, setGroup] = useState<Group | null>(null);
  const [available, setAvailable] = useState(true);
  const [chosenSort, setChosenSort] = useState<BookSort | null>(null);
  const inGroup = group !== null;
  const sort = effectiveSort(chosenSort, inGroup);
  const list = useMemo(() => ({ available, sort }), [available, sort]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={styles.title}>
          {BROWSE_CONTENT.title}
        </Text>
        <SearchButton testID="browse-search" />
      </View>
      <GroupButtons group={group} onClear={() => setGroup(null)} onGroup={setGroup} />
      <BookListControls
        available={available}
        onAvailableChange={setAvailable}
        onSort={setChosenSort}
        sort={sort}
        sortOptions={bookSortOptions(inGroup)}
      />
      {group === null ? (
        <AllBooks list={list} />
      ) : (
        <GroupBooks handle={group.link.handle} list={list} />
      )}
    </View>
  );
}

/**
 * "Age group" and "Series", each listing only the configured collections the store has (D-076);
 * a button with none is not drawn, and none is drawn until the store's handles are known. The
 * chosen group shows on its button, with "Clear" beside it. No Genre button until it works.
 */
function GroupButtons({
  group,
  onGroup,
  onClear,
}: {
  readonly group: Group | null;
  readonly onGroup: (group: Group) => void;
  readonly onClear: () => void;
}) {
  const handles = useCollectionHandles();
  const existing = handles.data;
  if (existing === undefined) return null;

  const lists: readonly { kind: GroupKind; links: readonly CollectionLink[] }[] = [
    { kind: 'age-group', links: BROWSE_CONTENT.ageGroups },
    { kind: 'series', links: BROWSE_CONTENT.series },
  ];
  const offered = lists
    .map(({ kind, links }) => ({ kind, links: links.filter((link) => existing.has(link.handle)) }))
    .filter(({ links }) => links.length > 0);
  if (offered.length === 0 && group === null) return null;

  return (
    <View style={styles.groups}>
      {offered.map(({ kind, links }) => {
        const chosen = group?.kind === kind ? group.link : null;
        const name = GROUP_NAMES[kind];
        return (
          <ListPicker
            accessibilityLabel={chosen === null ? name : `${name}, ${chosen.label}`}
            buttonLabel={chosen === null ? name : `${name}: ${chosen.label}`}
            key={kind}
            onSelect={(handle) => {
              const link = links.find((candidate) => candidate.handle === handle);
              if (link !== undefined) onGroup({ kind, link });
            }}
            options={links.map((link) => ({ value: link.handle, label: link.label }))}
            selected={chosen?.handle ?? null}
            testID={kind}
            title={name}
          />
        );
      })}
      {group !== null && (
        <Pressable
          accessibilityLabel="Clear, show all books"
          accessibilityRole="button"
          onPress={onClear}
          style={styles.clear}
          testID="clear-group"
        >
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
}

/** All books (D-083), sorted, with "Available now". */
function AllBooks({ list }: { readonly list: BookListOptions }) {
  const query = useAllBooks(list);
  const books = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.books),
    [query.data],
  );
  return (
    <BookGrid
      books={books}
      bottomInset={0}
      emptyMessage={emptyMessageFor(list.available)}
      error={query.error}
      hasData={query.data !== undefined}
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

/** One group's books: the store's collection by handle (D-068). */
function GroupBooks({ handle, list }: { readonly handle: string; readonly list: BookListOptions }) {
  const query = useCollectionBooks(handle, list);
  const first = query.data?.pages[0];
  const books = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => (page.kind === 'found' ? page.books : [])),
    [query.data],
  );
  // Removed from the store after the handles were read.
  if (first?.kind === 'not-found') return <ScreenMessage message={NOT_FOUND_MESSAGE} />;
  return (
    <BookGrid
      books={books}
      bottomInset={0}
      emptyMessage={emptyMessageFor(list.available)}
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
