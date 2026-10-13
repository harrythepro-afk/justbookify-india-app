import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LOG_IN_LABEL, LOGIN_NOT_SET_UP } from '@/components/AccountLogin';
import { OrderList } from '@/components/OrderList';
import { getAppEnvironment } from '@/config';
import { useCustomerSession } from '@/customerAccount/session';
import { useCustomerOrders } from '@/customerAccountApi/hooks/customer';
import { openScreen } from '@/navigation/openGuard';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

// Proposed by Claude Code at P7-02's plan, for the owner's approval (D-128).
export const LOG_IN_TO_SEE_ORDERS = 'Log in to see your orders.';
export const ORDERS_HEADING = 'Orders';

/**
 * My Books (P7-02, architect's answer 2): the customer's orders only, under "Orders". "At home"
 * and "Returns" are not shown until they work (Phase 11): no empty or dead sections. Signed out,
 * it asks the customer to log in, with a button that opens the Account tab, where login starts
 * (D-123).
 */
export default function MyBooksScreen() {
  const session = useCustomerSession();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          My Books
        </Text>
        <Text accessibilityRole="header" style={styles.section}>
          {ORDERS_HEADING}
        </Text>
      </View>
      {session.status === 'signedIn' ? <SignedInOrders /> : <NotSignedIn status={session.status} />}
    </View>
  );
}

function SignedInOrders() {
  const query = useCustomerOrders();
  const orders = query.data?.pages.flatMap((page) => page.orders) ?? [];
  return (
    <OrderList
      error={query.error}
      hasData={query.data !== undefined}
      hasNextPage={query.hasNextPage}
      isFetching={query.isFetching}
      isFetchingNextPage={query.isFetchingNextPage}
      loadMoreFailed={query.isFetchNextPageError}
      onLoadMore={() => query.fetchNextPage()}
      onRetry={() => query.refetch()}
      orders={orders}
    />
  );
}

function NotSignedIn({ status }: { readonly status: 'loading' | 'notConfigured' | 'signedOut' }) {
  switch (status) {
    case 'loading':
      return (
        <View style={styles.body}>
          <ActivityIndicator accessibilityLabel="Loading" color={colors.text} />
        </View>
      );
    case 'notConfigured':
      // A production build cannot be made without login (app.config.ts, D-120).
      return getAppEnvironment() === 'production' ? null : (
        <View style={styles.body}>
          <Text style={styles.text}>{LOGIN_NOT_SET_UP}</Text>
        </View>
      );
    case 'signedOut':
      return (
        <View style={styles.body}>
          <Text style={styles.text}>{LOG_IN_TO_SEE_ORDERS}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => openScreen('/account', 'navigate')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{LOG_IN_LABEL}</Text>
          </Pressable>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl },
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
  },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  text: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
  button: {
    minHeight: minTouchTarget,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    alignSelf: 'flex-start',
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
