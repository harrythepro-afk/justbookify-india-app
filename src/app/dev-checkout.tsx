import { ShopifyCheckoutSheetProvider, useShopifyCheckoutSheet } from '@shopify/checkout-sheet-kit';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAppEnvironment, getStoreConfigStatus } from '@/config';
import { createDevCheckoutUrl, DevCheckoutError } from '@/shopify/devCheckout';

type Status =
  | { state: 'idle' }
  | { state: 'creating-cart' }
  | { state: 'presented' }
  | { state: 'completed' }
  | { state: 'closed' }
  | { state: 'error'; message: string };

const STATUS_TEXT: Record<Exclude<Status['state'], 'error'>, string> = {
  idle: 'Ready.',
  'creating-cart': 'Creating a cart on the development store…',
  presented: 'Checkout is open.',
  completed: 'Checkout completed: the order was placed.',
  closed: 'Checkout closed without an order.',
};

/**
 * P3-01 test screen: opens the development store's checkout in Checkout Kit. It exists only in
 * development builds; any other build is sent back to the start screen. It never shows the
 * checkout URL, the store's domain or the token.
 */
export default function DevCheckoutScreen() {
  if (getAppEnvironment() !== 'development') return <Redirect href="/" />;

  // The provider lives here, not in the root layout, so no other screen creates a checkout
  // instance until the real checkout flow is built.
  return (
    <ShopifyCheckoutSheetProvider>
      <DevCheckout />
    </ShopifyCheckoutSheetProvider>
  );
}

function DevCheckout() {
  const checkout = useShopifyCheckoutSheet();
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const configured = getStoreConfigStatus() === 'configured';

  useEffect(() => {
    const subscriptions = [
      checkout.addEventListener('completed', () => setStatus({ state: 'completed' })),
      checkout.addEventListener('close', () =>
        // A close follows a completed checkout too; keep the completed result on screen.
        setStatus((current) => (current.state === 'completed' ? current : { state: 'closed' })),
      ),
      // Only the error code is shown: Shopify's message text could carry the store's URL.
      checkout.addEventListener('error', (error) =>
        setStatus({ state: 'error', message: `Checkout error: ${error.code}.` }),
      ),
    ];
    return () => subscriptions.forEach((subscription) => subscription?.remove());
  }, [checkout]);

  async function openCheckout() {
    setStatus({ state: 'creating-cart' });
    try {
      const checkoutUrl = await createDevCheckoutUrl();
      checkout.present(checkoutUrl);
      setStatus({ state: 'presented' });
    } catch (error) {
      // Any other error's text is not ours to show: it could carry the store's URL.
      const message =
        error instanceof DevCheckoutError ? error.message : 'Unexpected error opening checkout.';
      setStatus({ state: 'error', message });
    }
  }

  const busy = status.state === 'creating-cart';

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Test checkout
      </Text>
      <Text style={styles.body}>
        Development store only. Builds a one-book cart and opens its checkout in Checkout Kit.
      </Text>
      {configured ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => void openCheckout()}
          style={[styles.button, busy && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Open test checkout</Text>
        </Pressable>
      ) : (
        <Text style={styles.status}>Store configuration: not configured</Text>
      )}
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {status.state === 'error' ? status.message : STATUS_TEXT[status.state]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 16, textAlign: 'center' },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  status: { fontSize: 14, marginTop: 16, color: '#666', textAlign: 'center' },
});
