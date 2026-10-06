import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BookCard as BookCardData } from '@/shopify/hooks/catalogue';
import {
  colors,
  coverAspectRatio,
  fonts,
  fontSize,
  iconSize,
  minTouchTarget,
  radius,
  spacing,
} from '@/theme/tokens';

type Props = {
  readonly book: BookCardData;
  /** Called with the book when "Add to Cart" is tapped. The cart wires it (Phase 8). */
  readonly onAddToCart: (book: BookCardData) => void;
  /** Called with the book when "Notify me" is tapped. Notify-me wires it later. */
  readonly onNotifyMe: (book: BookCardData) => void;
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
 * and "Notify me" instead. A book orderable at zero stock looks exactly like one in stock.
 */
export function BookCard({ book, onAddToCart, onNotifyMe }: Props) {
  return (
    <View style={styles.card}>
      <View accessible accessibilityLabel={bookCardSummary(book)}>
        <View style={styles.coverFrame}>
          {book.cover === null ? (
            <View
              accessibilityLabel={book.title}
              style={styles.coverFallback}
              testID="book-card-cover-fallback"
            >
              <Ionicons color={colors.text} name="book-outline" size={iconSize.coverFallback} />
            </View>
          ) : (
            <Image
              accessibilityLabel={book.cover.altText ?? book.title}
              cachePolicy="memory-disk"
              contentFit="contain"
              recyclingKey={book.id}
              source={{ uri: book.cover.url }}
              style={StyleSheet.absoluteFill}
              testID="book-card-cover"
              transition={150}
            />
          )}
          {!book.orderable && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Rented Out</Text>
            </View>
          )}
        </View>
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
      </View>
      {book.orderable ? (
        <Pressable
          accessibilityLabel={`Add ${book.title} to cart`}
          accessibilityRole="button"
          onPress={() => onAddToCart(book)}
          style={[styles.button, styles.primaryButton]}
        >
          <Text style={styles.primaryButtonText}>Add to Cart</Text>
        </Pressable>
      ) : (
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
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.background },
  coverFrame: {
    aspectRatio: coverAspectRatio,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.coverFrame,
  },
  coverFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
