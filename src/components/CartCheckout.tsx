import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAnalyticsConsent } from '@/analytics/consent';
import { analyticsAfterLogin } from '@/analytics/loginConsent';
import {
  clearConfirmation,
  holdConsentRequest,
  releaseConsentRequest,
  useCheckoutState,
} from '@/checkout/state';
import { login, useCustomerSession } from '@/customerAccount/session';
import { openScreen } from '@/navigation/openGuard';
import { useIsOffline } from '@/shopify/hooks/catalogue';
import {
  isAtOrOverCap,
  orderCapAmount,
  usePendingCartChange,
  type Cart,
} from '@/shopify/hooks/cart';
import { useCheckout, type CheckoutEnd } from '@/shopify/hooks/checkout';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

import { LOGGING_IN_LABEL, LOGIN_FAILED_NOTICE } from './AccountLogin';
import { AnalyticsConsentRequest } from './AnalyticsConsentRequest';
import {
  CHECKOUT_LABEL,
  GO_TO_MY_BOOKS,
  LOG_IN_TO_CHECK_OUT_LABEL,
  LOG_IN_TO_CHECK_OUT_NOTE,
  OPENING_CHECKOUT_LABEL,
  orderPlacedMessage,
  showCheckoutError,
  showCheckoutFailure,
} from './cartMessages';

/** Whether the cart can go to checkout (D-148): books, none rented out, under the cap (D-134). */
export function canGoToCheckout(cart: Cart): boolean {
  return (
    cart.books.length > 0 &&
    !cart.hasRentedOut &&
    !isAtOrOverCap(cart.countedSubtotal, orderCapAmount())
  );
}

function onCheckoutEnd(end: CheckoutEnd): void {
  if (end === 'failed') showCheckoutError();
}

/**
 * The Cart tab's checkout (P9-01, D-148), under the pincode check: shown only when the cart can go
 * to checkout, the phone is online and no cart change runs; otherwise the lines above say why.
 * Signed in, "Checkout"; signed out, "Log in to check out", which logs in here (amending D-123 for
 * checkout) and keeps the cart (D-136). A first login here holds the consent request until an order
 * is confirmed (D-129); checkout ending without an order drops it for that login.
 */
export function CartCheckout({ cart }: { readonly cart: Cart }) {
  const session = useCustomerSession();
  const offline = useIsOffline();
  const change = usePendingCartChange();
  const checkout = useCheckout(onCheckoutEnd);

  if (session.status === 'loading' || session.status === 'notConfigured') return null;
  const preparing = change?.kind === 'checkout';
  if (!preparing && (offline || change !== null || !canGoToCheckout(cart))) return null;

  if (session.status === 'signedOut') {
    const logIn = async () => {
      if ((await login()) !== 'signedIn') return;
      if ((await analyticsAfterLogin()) === 'ask') holdConsentRequest();
    };
    return (
      <View style={styles.section}>
        <Text style={styles.text}>{LOG_IN_TO_CHECK_OUT_NOTE}</Text>
        {session.notice === 'loginFailed' && (
          <Text accessibilityLiveRegion="polite" style={styles.text}>
            {LOGIN_FAILED_NOTICE}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: session.loggingIn, busy: session.loggingIn }}
          disabled={session.loggingIn}
          onPress={() => void logIn()}
          style={styles.button}
          testID="cart-log-in"
        >
          <Text style={styles.buttonText}>
            {session.loggingIn ? LOGGING_IN_LABEL : LOG_IN_TO_CHECK_OUT_LABEL}
          </Text>
        </Pressable>
      </View>
    );
  }

  const start = async () => {
    const result = await checkout();
    if (result.kind === 'failed') showCheckoutFailure(result.offline);
  };

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: preparing, busy: preparing }}
        disabled={preparing}
        onPress={() => void start()}
        style={styles.button}
        testID="cart-checkout"
      >
        <Text style={styles.buttonText}>{preparing ? OPENING_CHECKOUT_LABEL : CHECKOUT_LABEL}</Text>
      </Pressable>
    </View>
  );
}

/**
 * The Cart tab's part of checkout's state, always mounted with the tab: the confirmation is
 * cleared when the tab loses focus, and a held consent request is dropped at logout (D-129: once
 * per login). Returns whether the confirmation is showing.
 */
export function useCheckoutScreen(): boolean {
  const { confirmation } = useCheckoutState();
  const session = useCustomerSession();
  useFocusEffect(useCallback(() => clearConfirmation, []));
  useEffect(() => {
    if (session.status !== 'signedIn' && session.status !== 'loading') releaseConsentRequest();
  }, [session.status]);
  return confirmation !== null;
}

/**
 * After an order (D-151): the confirmation in place of the empty cart, with "Go to My Books", and
 * the consent request held since a login on the Cart tab, still only while the choice is "not
 * asked" (D-129).
 */
export function CheckoutConfirmation() {
  const { confirmation, consentHeld } = useCheckoutState();
  const consent = useAnalyticsConsent().consent;

  if (confirmation === null) return null;
  return (
    <View style={styles.section} testID="checkout-confirmation">
      <Text accessibilityLiveRegion="polite" style={styles.text}>
        {orderPlacedMessage(confirmation.orderName)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => openScreen('/my-books', 'navigate')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{GO_TO_MY_BOOKS}</Text>
      </Pressable>
      <AnalyticsConsentRequest
        onDone={releaseConsentRequest}
        visible={consentHeld && consent === 'not asked'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg, gap: spacing.sm },
  text: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
  button: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.onPrimaryButton,
  },
});
