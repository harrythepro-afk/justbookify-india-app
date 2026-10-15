import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { trackBookUnavailable, trackCartShown } from '@/analytics/cartEvents';
import { trackDeliveryAreaChecked } from '@/analytics/events';
import { BookCover } from '@/components/BookCover';
import {
  afterRemove,
  capReachedMessage,
  codLine,
  DELIVERY_NOTE,
  deliveryLine,
  EMPTY_CART_MESSAGE,
  FREE_DELIVERY,
  freeDeliveryHint,
  overCapMessage,
  PINCODE_CHECK,
  PINCODE_CLEAR,
  PINCODE_HINT,
  PINCODE_INVALID_MESSAGE,
  PINCODE_LABEL,
  PINCODE_OUTSIDE_MESSAGE,
  pincodeInAreaMessage,
  RENTED_OUT_IN_CART_MESSAGE,
  roomLeftMessage,
} from '@/components/cartMessages';
import { catalogueViewState, showsOfflineNotice } from '@/components/catalogueViewState';
import { openBook } from '@/components/openBook';
import { NoDataState, OfflineNotice } from '@/components/ScreenMessage';
import { openScreen } from '@/navigation/openGuard';
import { recheckNetwork, useIsOffline } from '@/shopify/hooks/catalogue';
import {
  formatCartAmount,
  isAtOrOverCap,
  orderCapAmount,
  usePendingCartChange,
  useCart,
  useRemoveFromCart,
  wholeAmountLeft,
  type Cart,
  type CartBook,
} from '@/shopify/hooks/cart';
import {
  cartDeliveryEstimate,
  checkCartPincode,
  editPincode,
  forgetPincode,
  freeDeliveryThresholdAmount,
  usePincode,
  type PincodeState,
} from '@/shopify/hooks/delivery';
import {
  cartCoverWidth,
  colors,
  fonts,
  fontSize,
  iconSize,
  minTouchTarget,
  radius,
  spacing,
} from '@/theme/tokens';

export const CART_TITLE = 'Cart';
export const SUBTOTAL_LABEL = 'Subtotal';
// The same words as Home's banner button, which also opens Browse (P6-03).
export const BROWSE_BUTTON_LABEL = 'Books for Rent';

/**
 * The Cart tab (P8-01): each book with its cover, title, author and rental price and "Remove";
 * a book rented out since it was added shows "Rented Out", is not counted, and the line above the
 * subtotal asks for its removal (answer 5); the subtotal Shopify reports for the books that can be
 * ordered, and how much more fits under the order cap (R2), or that the cart is over it. Read
 * again from Shopify every time the tab opens. Empty, loading, offline and error states in the
 * catalogue's wording (D-078). No checkout yet (Phase 9).
 *
 * Under the subtotal (P8-02): the delivery fee hint (R4, D-141), the free-delivery hint, and the
 * optional pincode check (R3, D-142), whose pincode stays in memory only. None of it needs the
 * network, so it also shows under the offline notice over a saved cart.
 *
 * Events under consent: `view_cart` once per opening, an empty cart included, and
 * `book_unavailable_shown` (`cart`) once per rented-out book per opening; `delivery_area_checked`
 * with the pincode check's result, never the pincode (D-143).
 */
export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const isOffline = useIsOffline();
  const query = useCart();
  const cart = query.data;
  useCartViewEvents(cart);

  const header = (
    <Text accessibilityRole="header" style={styles.title}>
      {CART_TITLE}
    </Text>
  );

  if (cart === undefined) {
    const state = catalogueViewState({
      hasData: false,
      isFetching: query.isFetching,
      isOffline,
      error: query.error,
    });
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.header}>{header}</View>
        {state !== 'ready' && (
          <NoDataState
            onRetry={() => void recheckNetwork().then(() => query.refetch())}
            state={state}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {showsOfflineNotice({ hasData: true, isOffline, error: query.error }) && (
        <View style={{ paddingTop: insets.top }}>
          <OfflineNotice />
        </View>
      )}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
        // A tap on "Check" or "Remove" works while the pincode keyboard is open.
        keyboardShouldPersistTaps="handled"
        style={styles.screen}
        testID="cart-screen"
      >
        {header}
        {cart.books.length === 0 ? <EmptyCart /> : <CartContents cart={cart} />}
      </ScrollView>
    </View>
  );
}

function EmptyCart() {
  return (
    <View>
      <Text style={styles.text}>{EMPTY_CART_MESSAGE}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => openScreen('/browse', 'navigate')}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>{BROWSE_BUTTON_LABEL}</Text>
      </Pressable>
    </View>
  );
}

function CartContents({ cart }: { readonly cart: Cart }) {
  const cap = orderCapAmount();
  const counted = cart.countedSubtotal;
  const left = wholeAmountLeft(counted, cap);
  let capLine: string;
  if (isAtOrOverCap(counted, cap)) {
    capLine = overCapMessage(formatCartAmount(counted), formatCartAmount(cap));
  } else if (left > 0) {
    capLine = roomLeftMessage(formatCartAmount(left));
  } else {
    capLine = capReachedMessage(formatCartAmount(cap));
  }

  return (
    <View>
      {cart.books.map((book) => (
        <CartRow book={book} key={book.lineId} />
      ))}
      <View style={styles.summary}>
        {cart.hasRentedOut && (
          <Text accessibilityLiveRegion="polite" style={styles.text}>
            {RENTED_OUT_IN_CART_MESSAGE}
          </Text>
        )}
        <View
          accessible
          accessibilityLabel={`${SUBTOTAL_LABEL} ${formatCartAmount(counted)}`}
          style={styles.subtotal}
          testID="cart-subtotal"
        >
          <Text style={styles.subtotalText}>{SUBTOTAL_LABEL}</Text>
          <Text style={styles.subtotalText}>{formatCartAmount(counted)}</Text>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.text} testID="cart-cap-line">
          {capLine}
        </Text>
        <DeliveryHints counted={counted} />
        <PincodeCheck />
      </View>
    </View>
  );
}

/** A delivery rate in the store's format, or "Free" when the discount takes all of it. */
function feeText(amount: number): string {
  return amount === 0 ? FREE_DELIVERY : formatCartAmount(amount);
}

/**
 * The delivery fee hint (R4, D-141): the prepaid fee prominently, one smaller line for cash on
 * delivery, the note that checkout sets the final amount, and how much more makes prepaid delivery
 * free (never past the order cap). Counted on the subtotal the app counts (D-134).
 */
function DeliveryHints({ counted }: { readonly counted: number }) {
  const estimate = cartDeliveryEstimate(counted);
  const prepaid = deliveryLine(feeText(estimate.prepaid));
  const cod = estimate.fromThreshold
    ? codLine(feeText(estimate.cod))
    : codLine(feeText(estimate.cod), {
        fee: feeText(estimate.codFromThreshold),
        threshold: formatCartAmount(freeDeliveryThresholdAmount()),
      });

  return (
    <View style={styles.delivery}>
      <Text style={styles.deliveryText} testID="cart-delivery">
        {prepaid}
      </Text>
      <Text style={styles.smallText} testID="cart-delivery-cod">
        {cod}
      </Text>
      <Text style={styles.smallText}>{DELIVERY_NOTE}</Text>
      {estimate.freeDeliveryShortfall !== undefined && (
        <Text accessibilityLiveRegion="polite" style={styles.text} testID="cart-free-delivery">
          {freeDeliveryHint(formatCartAmount(estimate.freeDeliveryShortfall))}
        </Text>
      )}
    </View>
  );
}

function pincodeMessage(state: PincodeState): string | undefined {
  switch (state.result) {
    case 'in_area':
      return pincodeInAreaMessage(state.text);
    case 'outside_area':
      return PINCODE_OUTSIDE_MESSAGE;
    case 'invalid':
      return PINCODE_INVALID_MESSAGE;
    case undefined:
      return undefined;
  }
}

/**
 * The optional pincode check (R3, D-142): digits only, at most six; "Check" or the keyboard's key
 * closes the keyboard and shows the result. The pincode stays in memory for the app's session and
 * is never recorded; `delivery_area_checked` carries only the result (D-143).
 */
function PincodeCheck() {
  const pincode = usePincode();
  const field = useRef<TextInput>(null);
  const message = pincodeMessage(pincode);

  const onCheck = () => {
    Keyboard.dismiss();
    const result = checkCartPincode();
    if (result === 'in_area' || result === 'outside_area') trackDeliveryAreaChecked({ result });
  };

  // Empties the field; it keeps its focus, so the keyboard stays open for the next pincode.
  const onClear = () => {
    forgetPincode();
    field.current?.focus();
  };

  return (
    <View style={styles.pincode}>
      <Text style={styles.pincodeLabel}>{PINCODE_LABEL}</Text>
      <View style={styles.pincodeRow}>
        <View style={styles.pincodeField}>
          <TextInput
            accessibilityHint={PINCODE_HINT}
            accessibilityLabel={PINCODE_LABEL}
            autoComplete="off"
            autoCorrect={false}
            importantForAutofill="no"
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={editPincode}
            onSubmitEditing={onCheck}
            ref={field}
            returnKeyType="done"
            style={styles.pincodeInput}
            testID="pincode-field"
            value={pincode.text}
          />
          {pincode.text.length > 0 && (
            <Pressable
              accessibilityLabel={PINCODE_CLEAR}
              accessibilityRole="button"
              onPress={onClear}
              style={styles.pincodeClear}
              testID="pincode-clear"
            >
              <Ionicons color={colors.onSearchField} name="close-circle" size={iconSize.search} />
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onCheck}
          style={styles.checkButton}
          testID="pincode-check"
        >
          <Text style={styles.primaryButtonText}>{PINCODE_CHECK}</Text>
        </Pressable>
      </View>
      {message !== undefined && (
        <Text accessibilityLiveRegion="polite" style={styles.text} testID="pincode-message">
          {message}
        </Text>
      )}
    </View>
  );
}

function CartRow({ book }: { readonly book: CartBook }) {
  const remove = useRemoveFromCart();
  const change = usePendingCartChange();
  const removing = change?.kind === 'remove' && change.lineId === book.lineId;

  return (
    <View style={styles.row} testID={`cart-row-${book.handle}`}>
      <Pressable
        accessibilityLabel={[book.title, book.rentedOut ? 'Rented out' : book.price].join(', ')}
        accessibilityRole="link"
        onPress={() => openBook(book)}
        style={styles.book}
      >
        <View style={styles.cover}>
          <BookCover book={book} iconSize={iconSize.coverFallback} testID="cart-row-cover" />
        </View>
        <View style={styles.details}>
          <Text numberOfLines={2} style={styles.bookTitle}>
            {book.title}
          </Text>
          {book.author !== '' && (
            <Text numberOfLines={1} style={styles.author}>
              {book.author}
            </Text>
          )}
          {book.rentedOut ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Rented Out</Text>
            </View>
          ) : (
            <Text style={styles.price}>{book.price}</Text>
          )}
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel={`Remove ${book.title} from cart`}
        accessibilityRole="button"
        accessibilityState={{ disabled: removing, busy: removing }}
        disabled={removing}
        onPress={() => void remove(book.lineId).then((result) => afterRemove(book.id, result))}
        style={styles.removeButton}
        testID={`remove-${book.handle}`}
      >
        <Text style={styles.removeText}>{removing ? 'Removing…' : 'Remove'}</Text>
      </Pressable>
    </View>
  );
}

/**
 * `view_cart` once per opening of the tab, as soon as a cart is on screen (an empty cart counts),
 * and `book_unavailable_shown` (`cart`) once per rented-out book per opening, including a book
 * found rented out by a read during the visit.
 */
function useCartViewEvents(cart: Cart | undefined): void {
  const visit = useRef({ focused: false, viewed: false, unavailable: new Set<string>() });
  const shown = useRef(cart);

  const send = useCallback(() => {
    const current = visit.current;
    const data = shown.current;
    if (!current.focused || data === undefined) return;
    if (!current.viewed) {
      current.viewed = true;
      trackCartShown(data.books.length, data.countedSubtotal);
    }
    for (const book of data.books) {
      if (!book.rentedOut || current.unavailable.has(book.id)) continue;
      current.unavailable.add(book.id);
      trackBookUnavailable(book.id, 'cart');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      visit.current = { focused: true, viewed: false, unavailable: new Set() };
      send();
      return () => {
        visit.current.focused = false;
      };
    }, [send]),
  );

  useEffect(() => {
    shown.current = cart;
    send();
  }, [cart, send]);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl },
  content: { padding: spacing.xl },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  text: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
  primaryButton: {
    minHeight: minTouchTarget,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.onPrimaryButton,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  book: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cover: { width: cartCoverWidth },
  details: { flex: 1 },
  bookTitle: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  author: { fontFamily: fonts.body, fontSize: fontSize.small, color: colors.text },
  price: {
    marginTop: spacing.xs,
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
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
  removeButton: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.secondaryButtonBorder,
    backgroundColor: colors.background,
  },
  removeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.secondaryButtonText,
  },
  summary: { marginTop: spacing.lg, gap: spacing.sm },
  delivery: { marginTop: spacing.sm, gap: spacing.xs },
  deliveryText: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  smallText: { fontFamily: fonts.body, fontSize: fontSize.small, color: colors.text },
  pincode: { marginTop: spacing.md, gap: spacing.xs },
  pincodeLabel: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  pincodeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // The outlined field holds the input and, while there is text, the clear button (as search's).
  pincodeField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderColor: colors.searchFieldBorder,
    borderRadius: radius.md,
    backgroundColor: colors.searchField,
  },
  pincodeInput: {
    flex: 1,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.onSearchField,
  },
  pincodeClear: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  subtotal: { flexDirection: 'row', justifyContent: 'space-between' },
  subtotalText: { fontFamily: fonts.bodyBold, fontSize: fontSize.title, color: colors.text },
});
