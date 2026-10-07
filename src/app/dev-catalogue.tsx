import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCard } from '@/components/BookCard';
import {
  DEV_CATALOGUE_COLLECTION,
  DEV_CATALOGUE_EXAMPLES,
  getAppEnvironment,
  getStoreConfigStatus,
  type DevCatalogueExample,
} from '@/config';
import { StorefrontError } from '@/shopify/errors';
import {
  CatalogueDataError,
  useBookCard,
  useCollectionBooks,
  type BookCard as BookCardData,
} from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

// The text of these errors is ours; any other error's text could carry the store's URL.
function errorMessage(error: unknown): string {
  return error instanceof StorefrontError || error instanceof CatalogueDataError
    ? error.message
    : 'Unexpected error.';
}

type CardActions = {
  readonly onAddToCart: (book: BookCardData) => void;
  readonly onNotifyMe: (book: BookCardData) => void;
};

/**
 * Development-only preview of the book card (P6-02, D-074): the development store's named
 * example books, and one collection paged through the catalogue hook. Any other build is sent
 * back to the start screen. The buttons only change the status line.
 */
export default function DevCatalogueScreen() {
  if (getAppEnvironment() !== 'development') return <Redirect href="/" />;
  return <DevCatalogue />;
}

function DevCatalogue() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('No button tapped yet.');
  const configured = getStoreConfigStatus() === 'configured';
  const actions: CardActions = {
    onAddToCart: (book) => setStatus(`Add to Cart tapped: ${book.title}`),
    onNotifyMe: (book) => setStatus(`Notify me tapped: ${book.title}`),
  };

  return (
    // The bottom inset keeps the last row and "Load more" clear of Android's navigation bar.
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
      testID="dev-catalogue-scroll"
      style={styles.screen}
    >
      <Text accessibilityRole="header" style={styles.title}>
        Book card preview
      </Text>
      <Text style={styles.body}>Development store only.</Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {status}
      </Text>
      {!configured ? (
        <Text style={styles.status}>Store configuration: not configured</Text>
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.section}>
            Named examples
          </Text>
          <View style={styles.grid}>
            {DEV_CATALOGUE_EXAMPLES.map((example) => (
              <ExampleCell actions={actions} example={example} key={example.handle} />
            ))}
          </View>
          <CollectionPreview actions={actions} handle={DEV_CATALOGUE_COLLECTION} />
        </>
      )}
    </ScrollView>
  );
}

function ExampleCell({
  example,
  actions,
}: {
  readonly example: DevCatalogueExample;
  readonly actions: CardActions;
}) {
  const query = useBookCard(example.handle);
  return (
    <View style={styles.cell}>
      <Text style={styles.caption}>{example.label}</Text>
      {query.data !== undefined ? (
        query.data === null ? (
          <Text style={styles.note}>Not found: {example.handle}</Text>
        ) : (
          <BookCard book={query.data} {...actions} />
        )
      ) : query.isError ? (
        <Text style={styles.note}>{errorMessage(query.error)}</Text>
      ) : (
        <Text style={styles.note}>Loading…</Text>
      )}
    </View>
  );
}

function CollectionPreview({
  handle,
  actions,
}: {
  readonly handle: string;
  readonly actions: CardActions;
}) {
  const query = useCollectionBooks(handle);
  const pages = query.data?.pages ?? [];
  const first = pages[0];

  if (first === undefined) {
    return (
      <Text style={styles.status}>
        {query.isError ? errorMessage(query.error) : `Loading ${handle}…`}
      </Text>
    );
  }
  if (first.kind === 'not-found') {
    return <Text style={styles.status}>Collection not found: {handle}</Text>;
  }

  const books = pages.flatMap((page) => (page.kind === 'found' ? page.books : []));
  return (
    <>
      <Text accessibilityRole="header" style={styles.section}>
        {first.title}
      </Text>
      <Text style={styles.note}>Showing {books.length} books</Text>
      <View style={styles.grid}>
        {books.map((book) => (
          <View key={book.id} style={styles.cell}>
            <BookCard book={book} {...actions} />
          </View>
        ))}
      </View>
      {query.isFetchNextPageError && <Text style={styles.status}>{errorMessage(query.error)}</Text>}
      {query.hasNextPage && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: query.isFetchingNextPage }}
          disabled={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
          style={[styles.loadMore, query.isFetchingNextPage && styles.disabled]}
        >
          <Text style={styles.loadMoreText}>
            {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Text>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  container: { padding: spacing.lg },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  section: {
    fontFamily: fonts.heading,
    fontSize: fontSize.title,
    color: colors.text,
    marginTop: spacing.xl,
  },
  body: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
  status: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
    marginTop: spacing.md,
  },
  note: { fontFamily: fonts.body, fontSize: fontSize.small, color: colors.text },
  caption: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.small,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm },
  cell: { width: '50%', padding: spacing.sm },
  loadMore: {
    minHeight: minTouchTarget,
    marginTop: spacing.lg,
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
