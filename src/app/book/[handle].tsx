import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { trackBookShown } from '@/analytics/catalogueEvents';

import { BookCover } from '@/components/BookCover';
import { catalogueViewState, showsOfflineNotice } from '@/components/catalogueViewState';
import { RichText } from '@/components/RichText';
import {
  BOOK_NOT_FOUND_MESSAGE,
  NoDataState,
  OfflineNotice,
  ScreenMessage,
} from '@/components/ScreenMessage';
import { recheckNetwork, useBook, useIsOffline, type BookPage } from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, iconSize, letterSpacing, radius, spacing } from '@/theme/tokens';

/** The website's sentence for a rented-out book (architect, 8 October 2026; D-090). */
export const RENTED_OUT_SENTENCE =
  'Currently not available as another junior reader is enjoying this book.';

/** What the screen reader says for the price row, such as "₹49, retail price ₹350, Rent". */
export function priceSummary(book: Pick<BookPage, 'price' | 'retailPrice' | 'orderable'>): string {
  return [
    book.price,
    book.retailPrice === null ? undefined : `retail price ${book.retailPrice}`,
    book.orderable ? 'Rent' : 'Rented out',
  ]
    .filter((part) => part !== undefined)
    .join(', ');
}

/**
 * One book's page (P6-05, D-090), opened from any book card: the cover, author, title, the
 * website's sentence when the book is rented out, the prices with their badge, the description
 * and the genres, in the live page's order. A book orderable at zero stock has the "Rent" badge
 * and never the sentence (R8, D-073). No rating (D-092) and no cart buttons until Phase 8
 * (D-081). Shopify is read again every time the page opens (`liveStock`, D-093). A stack screen
 * with no tab bar, so the page leaves room for Android's navigation bar itself (D-080).
 * `view_book` is sent once per opening, when the page first shows its book, with whether it can
 * be ordered then; a refetch never sends it again (P6-09, D-107).
 */
export default function BookScreen() {
  const params = useLocalSearchParams<{ handle?: string | string[] }>();
  const handle = typeof params.handle === 'string' ? params.handle : '';
  return <Book handle={handle} />;
}

function Book({ handle }: { readonly handle: string }) {
  const insets = useSafeAreaInsets();
  const isOffline = useIsOffline();
  const query = useBook(handle);
  const hasData = query.data !== undefined;

  const viewed = useRef(false);
  const shown = query.data ?? null;
  useEffect(() => {
    if (viewed.current || shown === null) return;
    viewed.current = true;
    trackBookShown(shown.id, shown.orderable);
  }, [shown]);

  const header = (
    <Stack.Screen
      options={{
        headerShown: true,
        title: '',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    />
  );

  if (query.data === null) {
    return (
      <View style={styles.screen}>
        {header}
        <ScreenMessage message={BOOK_NOT_FOUND_MESSAGE} />
      </View>
    );
  }

  if (query.data === undefined) {
    const state = catalogueViewState({
      hasData,
      isFetching: query.isFetching,
      isOffline,
      error: query.error,
    });
    return (
      <View style={styles.screen}>
        {header}
        {state !== 'ready' && (
          <NoDataState
            onRetry={() => void recheckNetwork().then(() => query.refetch())}
            state={state}
          />
        )}
      </View>
    );
  }

  const book = query.data;
  return (
    <View style={styles.screen}>
      {header}
      {showsOfflineNotice({ hasData, isOffline, error: query.error }) && <OfflineNotice />}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        style={styles.screen}
        testID="book-page"
      >
        <BookCover book={book} iconSize={iconSize.pageCoverFallback} testID="book-page-cover" />
        {book.author !== '' && <Text style={styles.author}>{book.author}</Text>}
        <Text accessibilityRole="header" style={styles.title}>
          {book.title}
        </Text>
        {!book.orderable && <Text style={styles.sentence}>{RENTED_OUT_SENTENCE}</Text>}
        <View accessible accessibilityLabel={priceSummary(book)} style={styles.prices}>
          {book.retailPrice !== null && <Text style={styles.retailPrice}>{book.retailPrice}</Text>}
          <Text style={styles.price}>{book.price}</Text>
          {book.orderable ? (
            <View style={styles.rentBadge}>
              <Text style={styles.rentBadgeText}>Rent</Text>
            </View>
          ) : (
            <View style={styles.rentedOutBadge}>
              <Text style={styles.rentedOutBadgeText}>Rented Out</Text>
            </View>
          )}
        </View>
        {book.description.length > 0 && (
          <View style={styles.section}>
            <RichText blocks={book.description} testID="book-description" />
          </View>
        )}
        {book.genres.length > 0 && (
          <View style={styles.section} testID="book-genres">
            <Text style={styles.label}>Genre</Text>
            <View style={styles.chips}>
              {book.genres.map((genre) => (
                <View key={genre} style={styles.chip}>
                  <Text style={styles.chipText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  author: {
    marginTop: spacing.lg,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
    // Small capitals, as on the website. The screen reader reads the name as stored.
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.caps,
  },
  title: {
    marginTop: spacing.xs,
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.text,
  },
  sentence: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
  },
  prices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  retailPrice: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
    textDecorationLine: 'line-through',
  },
  price: { fontFamily: fonts.bodyBold, fontSize: fontSize.title, color: colors.text },
  rentBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.rentBadge,
  },
  rentBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.small,
    color: colors.onRentBadge,
  },
  rentedOutBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.onRentedOutBadge,
    backgroundColor: colors.rentedOutBadge,
  },
  rentedOutBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.small,
    color: colors.onRentedOutBadge,
  },
  section: { marginTop: spacing.xl },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.genreChipBorder,
    backgroundColor: colors.genreChip,
  },
  chipText: { fontFamily: fonts.body, fontSize: fontSize.small, color: colors.onGenreChip },
});
