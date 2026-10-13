import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSearchEvent, type ShownSearchResults } from '@/analytics/searchEvent';
import { BookGrid } from '@/components/BookGrid';
import { BookListControls } from '@/components/BookListControls';
import { openBook } from '@/components/openBook';
import { ScreenMessage } from '@/components/ScreenMessage';
import { noResultsMessage, resultCountLabel, SEARCH_CONTENT, type SearchSort } from '@/config';
import type { BookCard } from '@/shopify/hooks/catalogue';
import { useWantedList } from '@/featureFlags/session';
import { searchableTerm, useSearchBooks, useSearchMatchLists } from '@/shopify/hooks/search';
import { colors, fonts, fontSize, iconSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

const SORT_OPTIONS = SEARCH_CONTENT.sortOptions.map((option) => ({
  value: option.sort,
  label: option.label,
}));

/**
 * Search (P6-06, D-096 to D-098): a stack screen opened from Home's header and from Browse. The
 * results appear as the customer types: from 3 letters or digits, after a 300 ms pause; the
 * keyboard's search key searches at once, from 2. There is no separate suggestion list. Results
 * are book cards in two columns, 20 at a time, with the website's count line, "Available now" (off)
 * and the sort (Relevance). While a new term loads, the previous results stay, with no count line
 * and no "no results" line. A card opens the book page; Back returns here with the term and the
 * results kept, because this screen stays mounted under the book page. While the field has text,
 * a clear button empties it, brings the hint back and keeps the keyboard open (P6-06 review).
 *
 * The term is untrusted text and private: it lives in this screen's state and the in-memory cache
 * only. It is never a route parameter (screen views are logged as `search`), never logged, never
 * sent to analytics and never reported to Sentry (D-097). The `search` usage event carries only the
 * term's length, Shopify's count and the store's own catalogue item the term matched, as its ID
 * or code (P6-09, D-108, D-109; `src/analytics/searchEvent.ts`), or, for a search that finds
 * nothing, the code of the name it matched on the store's wanted list (P6-11, D-117).
 */
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [term, setTerm] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [sort, setSort] = useState<SearchSort>(SEARCH_CONTENT.defaultSort);
  const search = useMemo(() => ({ available, sort }), [available, sort]);
  const query = useSearchBooks(term, search);
  // The store's series, age groups and genres, for the usage event's catalogue match (D-109).
  const matchLists = useSearchMatchLists();
  // This launch's wanted list (P6-11, D-117), for a search that finds nothing.
  const wantedList = useWantedList();
  const field = useRef<TextInput>(null);

  // The pause after typing. A newer keystroke or the search key replaces it.
  const pause = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopPause = useCallback(() => {
    if (pause.current !== null) clearTimeout(pause.current);
    pause.current = null;
  }, []);
  useEffect(() => stopPause, [stopPause]);

  // The keyboard closes when the screen loses focus, so it does not stay over the book page.
  useFocusEffect(useCallback(() => () => Keyboard.dismiss(), []));

  const onChangeText = (value: string) => {
    setText(value);
    stopPause();
    const next = searchableTerm(value, 'typing');
    // Too short to search while typing: the hint shows at once.
    if (next === null) {
      setTerm(null);
      return;
    }
    pause.current = setTimeout(() => {
      pause.current = null;
      setTerm(next);
    }, SEARCH_CONTENT.typingPauseMs);
  };

  const onSubmitEditing = () => {
    stopPause();
    const next = searchableTerm(text, 'search-key');
    setTerm(next);
    if (next !== null) searchEvent.sendWhenShown(next);
  };

  // Empties the field and shows the hint; the field keeps its focus, so the keyboard stays open.
  const onClear = () => {
    stopPause();
    setText('');
    setTerm(null);
    field.current?.focus();
  };

  const books = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.books),
    [query.data],
  );
  // Results for an earlier term or setting are shown while the new ones load; what they say about
  // the count, or about finding nothing, would be wrong for the term now typed.
  const loadingNewList = query.isPlaceholderData;
  // If the new term fails, the earlier results go, so the error and "Try again" show (D-078).
  const hasData = query.data !== undefined && !(loadingNewList && query.isError);
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  // The term's own first page once it has arrived: never an earlier term's results standing in.
  const firstPage = query.data?.pages[0];
  const shown = useMemo<ShownSearchResults | null>(
    () =>
      term === null || firstPage === undefined || loadingNewList
        ? null
        : { term, totalCount: firstPage.totalCount, books: firstPage.books, available },
    [term, firstPage, loadingNewList, available],
  );
  const searchEvent = useSearchEvent({
    term,
    shown,
    failed: term !== null && !hasData && query.isError,
    lists: matchLists,
    wanted: wantedList,
  });
  const { sendNow } = searchEvent;
  // A book opened before the 2 seconds are up still counts the term's search (owner, plan review).
  const onOpenBook = useCallback(
    (book: BookCard) => {
      sendNow();
      openBook(book);
    },
    [sendNow],
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: SEARCH_CONTENT.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.heading, fontSize: fontSize.title },
          headerShadowVisible: false,
        }}
      />
      <View style={styles.field}>
        <TextInput
          accessibilityLabel={SEARCH_CONTENT.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          maxLength={SEARCH_CONTENT.maxTermLength}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={SEARCH_CONTENT.placeholder}
          placeholderTextColor={colors.searchPlaceholder}
          ref={field}
          returnKeyType="search"
          style={styles.input}
          testID="search-field"
          value={text}
        />
        {text.length > 0 && (
          <Pressable
            accessibilityLabel={SEARCH_CONTENT.clearLabel}
            accessibilityRole="button"
            onPress={onClear}
            style={styles.clear}
            testID="search-clear"
          >
            <Ionicons color={colors.onSearchField} name="close-circle" size={iconSize.search} />
          </Pressable>
        )}
      </View>
      {term === null ? (
        <ScreenMessage message={SEARCH_CONTENT.hint} />
      ) : (
        <>
          <BookListControls
            available={available}
            onAvailableChange={setAvailable}
            onSort={setSort}
            sort={sort}
            sortOptions={SORT_OPTIONS}
          />
          {!loadingNewList && totalCount > 0 && (
            <Text accessibilityLiveRegion="polite" style={styles.count} testID="search-count">
              {resultCountLabel(totalCount)}
            </Text>
          )}
          <BookGrid
            books={books}
            bottomInset={insets.bottom}
            emptyMessage={loadingNewList ? null : noResultsMessage(term, available)}
            error={query.error}
            hasData={hasData}
            hasNextPage={!loadingNewList && query.hasNextPage}
            isFetching={query.isFetching}
            isFetchingNextPage={query.isFetchingNextPage}
            loadMoreFailed={query.isFetchNextPageError}
            onLoadMore={() => query.fetchNextPage()}
            onOpenBook={onOpenBook}
            onRetry={() => query.refetch()}
            testID="search-books"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // The outlined field holds the text input and, while there is text, the clear button.
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.searchFieldBorder,
    borderRadius: radius.md,
    backgroundColor: colors.searchField,
  },
  input: {
    flex: 1,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.onSearchField,
  },
  clear: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
  },
});
