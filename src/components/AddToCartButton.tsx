import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import type { BookCard as BookCardData } from '@/shopify/hooks/catalogue';
import { useAddToCart, useCartButtonState } from '@/shopify/hooks/cart';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

import { afterAdd } from './cartMessages';

/**
 * "Add to Cart" for a book that can be ordered (P8-01), on the book card and the book page. One
 * copy per book: a book in the cart shows "In cart", which does nothing (answer 1). After the add
 * the customer stays on the screen (answer 6); the button turns to "In cart" and the Cart tab's
 * count goes up. "Adding…" while Shopify answers; a second tap anywhere is ignored meanwhile.
 */
export function AddToCartButton({
  book,
  style,
}: {
  readonly book: BookCardData;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const state = useCartButtonState(book.variantId);
  const addToCart = useAddToCart();

  if (state === 'in-cart') {
    return (
      <Pressable
        accessibilityLabel={`${book.title} is in your cart`}
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        disabled
        style={[styles.button, styles.inCart, style]}
        testID={`in-cart-${book.handle}`}
      >
        <Text style={styles.inCartText}>In cart</Text>
      </Pressable>
    );
  }
  const adding = state === 'adding';
  return (
    <Pressable
      accessibilityLabel={`Add ${book.title} to cart`}
      accessibilityRole="button"
      accessibilityState={{ disabled: adding, busy: adding }}
      disabled={adding}
      onPress={() => void addToCart(book).then((result) => afterAdd(book.id, result))}
      style={[styles.button, styles.add, style]}
      testID={`add-to-cart-${book.handle}`}
    >
      <Text style={styles.addText}>{adding ? 'Adding…' : 'Add to Cart'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  add: { backgroundColor: colors.primaryButton },
  addText: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.onPrimaryButton },
  inCart: {
    borderWidth: 1,
    borderColor: colors.secondaryButtonBorder,
    backgroundColor: colors.background,
  },
  inCartText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.secondaryButtonText,
  },
});
