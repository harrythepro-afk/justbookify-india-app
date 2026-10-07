import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BookCard as BookCardData } from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, iconSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

import { BookCover } from './BookCover';

type Props = {
  readonly book: BookCardData;
  /**
   * Called with the book when the card's cover, title, author or prices are tapped: the book
   * page opens (P6-05). Without it, that part of the card is not a link. Pass a stable function,
   * so the memoised card does not redraw.
   */
  readonly onOpen?: (book: BookCardData) => void;
  /**
   * Called with the book when "Add to Cart" is tapped. The cart wires it (Phase 8). Without it,
   * the button is not drawn: no customer screen shows a button that does nothing (D-081).
   */
  readonly onAddToCart?: (book: BookCardData) => void;
  /** Called with the book when "Notify me" is tapped. Notify-me wires it later. Same rule. */
  readonly onNotifyMe?: (book: BookCardData) => void;
};

/** What a screen reader says for the card's cover, title, author and prices. */
export function bookCardSummary(book: BookCardData): string {
  return [
    book.title,
    book.author === '' ? undefined : `by ${book.author}`,
    book.price,
    book.retailPrice === null ? undefined : `retail price ${book.retailPrice}`,
    book.orderable ? undefined : 'Rented out',
  ]
    .filter((part) => part !== undefined)
    .join(', ');
}

/**
 * The book card used on every catalogue screen (`PRODUCT_REQUIREMENTS.md`, "Screen layouts";
 * D-073): cover, title on one line, author, the rental price in bold with the retail price struck
 * through, and "Add to Cart". A book that cannot be ordered has a "Rented Out" badge on its cover
 * and "Notify me" instead. A book orderable at zero stock looks exactly like one in stock. A
 * button is drawn only when its action is passed (D-081). With `onOpen`, the cover, title, author
 * and prices are one link to the book page (P6-05). Memoised: a long list re-renders a card only
 * when its book or actions change (P6-03 phone check, slow-list warning).
 */
export const BookCard = memo(function BookCard({ book, onOpen, onAddToCart, onNotifyMe }: Props) {
  const summary = (
    <>
      <BookCover book={book} iconSize={iconSize.coverFallback} testID="book-card-cover">
        {!book.orderable && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Rented Out</Text>
          </View>
        )}
      </BookCover>
      <Text numberOfLines={1} style={styles.title}>
        {book.title}
      </Text>
      <Text numberOfLines={1} style={styles.author}>
        {book.author}
      </Text>
      <View style={styles.prices}>
        <Text style={styles.price}>{book.price}</Text>
        {book.retailPrice !== null && <Text style={styles.retailPrice}>{book.retailPrice}</Text>}
      </View>
    </>
  );
  return (
    <View style={styles.card}>
      {onOpen === undefined ? (
        <View accessible accessibilityLabel={bookCardSummary(book)}>
          {summary}
        </View>
      ) : (
        <Pressable
          accessibilityLabel={bookCardSummary(book)}
          accessibilityRole="link"
          onPress={() => onOpen(book)}
          testID={`book-card-open-${book.handle}`}
        >
          {summary}
        </Pressable>
      )}
      {book.orderable
        ? onAddToCart !== undefined && (
            <Pressable
              accessibilityLabel={`Add ${book.title} to cart`}
              accessibilityRole="button"
              onPress={() => onAddToCart(book)}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={styles.primaryButtonText}>Add to Cart</Text>
            </Pressable>
          )
        : onNotifyMe !== undefined && (
            <Pressable
              accessibilityLabel={`Notify me when ${book.title} is back`}
              accessibilityRole="button"
              onPress={() => onNotifyMe(book)}
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={styles.secondaryButtonText}>Notify me</Text>
            </Pressable>
          )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.background },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.onRentedOutBadge,
    backgroundColor: colors.rentedOutBadge,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.small,
    color: colors.onRentedOutBadge,
  },
  title: {
    marginTop: spacing.sm,
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  author: { fontFamily: fonts.body, fontSize: fontSize.small, color: colors.text },
  prices: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs },
  price: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  retailPrice: {
    marginLeft: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
    textDecorationLine: 'line-through',
  },
  button: {
    minHeight: minTouchTarget,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  primaryButton: { backgroundColor: colors.primaryButton },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.onPrimaryButton,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.secondaryButtonBorder,
    backgroundColor: colors.background,
  },
  secondaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.secondaryButtonText,
  },
});
