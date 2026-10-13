import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BookCard as BookCardData } from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, iconSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

import { AddToCartButton } from './AddToCartButton';
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
   * Draws "Add to Cart" (or "In cart") for a book that can be ordered (P8-01), wired to the cart.
   * Customer screens pass it; without it no cart button is drawn.
   */
  readonly cartButton?: boolean;
  /**
   * Called with the book when "Notify me" is tapped. Notify-me wires it later. Without it, the
   * button is not drawn: no customer screen shows a button that does nothing (D-081).
   */
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
 * through, and "Add to Cart" ("In cart" once it is in the cart, P8-01). A book that cannot be ordered has a
 * "Rented Out" badge on its cover and "Notify me" instead. A book orderable at zero stock looks
 * exactly like one in stock. "Notify me" is drawn only when its action is passed (D-081). With `onOpen`, the cover, title, author
 * and prices are one link to the book page (P6-05). Memoised: a long list re-renders a card only
 * when its book or actions change (P6-03 phone check, slow-list warning).
 */
export const BookCard = memo(function BookCard({ book, onOpen, cartButton, onNotifyMe }: Props) {
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
        ? cartButton === true && <AddToCartButton book={book} style={styles.cartButton} />
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
  cartButton: { marginTop: spacing.sm },
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
