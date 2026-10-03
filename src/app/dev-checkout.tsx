import { ShopifyCheckoutSheetProvider, useShopifyCheckoutSheet } from '@shopify/checkout-sheet-kit';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getAppEnvironment, getStoreConfigStatus } from '@/config';
import {
  createDevCheckout,
  DevCheckoutError,
  listDevCheckoutVariants,
  MAX_DEV_CHECKOUT_QUANTITY,
  type DevCheckoutCart,
  type DevCheckoutVariant,
} from '@/shopify/devCheckout';

type Status =
  | { state: 'idle' }
  | { state: 'creating-cart' }
  | { state: 'presented' }
  | { state: 'completed' }
  | { state: 'closed' }
  | { state: 'error'; message: string };

type Variants =
  | { state: 'loading' }
  | { state: 'loaded'; variants: readonly DevCheckoutVariant[] }
  | { state: 'failed'; message: string };

const STATUS_TEXT: Record<Exclude<Status['state'], 'error'>, string> = {
  idle: 'Ready.',
  'creating-cart': 'Creating a cart on the development store…',
  presented: 'Checkout is open.',
  completed: 'Checkout completed: the order was placed.',
  closed: 'Checkout closed without an order.',
};

// A DevCheckoutError's text is ours; any other error's text could carry the store's URL.
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof DevCheckoutError ? error.message : fallback;
}

function formatAmount(amount: number, currencyCode: string): string {
  return `${currencyCode} ${amount.toFixed(2)}`;
}

function cartSummary(cart: DevCheckoutCart): string {
  const subtotal = `Cart subtotal from Shopify: ${formatAmount(cart.subtotal, cart.currencyCode)}.`;
  return cart.warningCodes.length === 0
    ? subtotal
    : `${subtotal} Shopify warnings: ${cart.warningCodes.join(', ')}.`;
}

/**
 * Test screen for early checks (P3-01, P3-02): builds a cart on the development store from
 * chosen quantities and opens its checkout in Checkout Kit. It exists only in development
 * builds; any other build is sent back to the start screen. It never shows the checkout URL,
 * the store's domain or the token.
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
  const [variants, setVariants] = useState<Variants>({ state: 'loading' });
  const [quantities, setQuantities] = useState<Readonly<Record<string, number>>>({});
  const [cart, setCart] = useState<DevCheckoutCart | undefined>(undefined);
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

  useEffect(() => {
    if (!configured) return;
    let active = true;
    listDevCheckoutVariants().then(
      (loaded) => {
        if (active) setVariants({ state: 'loaded', variants: loaded });
      },
      (error: unknown) => {
        if (active) {
          setVariants({ state: 'failed', message: errorMessage(error, 'Unexpected error.') });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [configured]);

  const loaded = variants.state === 'loaded' ? variants.variants : [];
  const lines = loaded
    .filter((variant) => (quantities[variant.id] ?? 0) > 0)
    .map((variant) => ({ merchandiseId: variant.id, quantity: quantities[variant.id] ?? 0 }));
  const estimate = loaded.reduce(
    (sum, variant) => sum + variant.price * (quantities[variant.id] ?? 0),
    0,
  );

  function changeQuantity(id: string, change: number) {
    setQuantities((current) => {
      const next = Math.min(MAX_DEV_CHECKOUT_QUANTITY, Math.max(0, (current[id] ?? 0) + change));
      return { ...current, [id]: next };
    });
  }

  async function openCheckout() {
    setStatus({ state: 'creating-cart' });
    setCart(undefined);
    try {
      const created = await createDevCheckout(lines);
      setCart(created);
      checkout.present(created.checkoutUrl);
      setStatus({ state: 'presented' });
    } catch (error) {
      setStatus({
        state: 'error',
        message: errorMessage(error, 'Unexpected error opening checkout.'),
      });
    }
  }

  const busy = status.state === 'creating-cart';
  const canOpen = !busy && lines.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Test checkout
      </Text>
      <Text style={styles.body}>
        Development store only. Choose quantities, then open the cart in Checkout Kit.
      </Text>
      {!configured ? (
        <Text style={styles.status}>Store configuration: not configured</Text>
      ) : variants.state === 'loading' ? (
        <Text style={styles.status}>Loading books from the store…</Text>
      ) : variants.state === 'failed' ? (
        <Text style={styles.status}>{variants.message}</Text>
      ) : (
        <>
          {variants.variants.map((variant) => {
            const quantity = quantities[variant.id] ?? 0;
            return (
              <View key={variant.id} style={styles.row}>
                <Text style={styles.rowTitle}>
                  {variant.title}, {formatAmount(variant.price, variant.currencyCode)}
                </Text>
                <Pressable
                  accessibilityLabel={`Remove one ${variant.title}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: quantity === 0 }}
                  disabled={quantity === 0}
                  onPress={() => changeQuantity(variant.id, -1)}
                  style={[styles.stepper, quantity === 0 && styles.buttonDisabled]}
                >
                  <Text style={styles.buttonText}>−</Text>
                </Pressable>
                <Text accessibilityLabel={`Quantity of ${variant.title}`} style={styles.quantity}>
                  {quantity}
                </Text>
                <Pressable
                  accessibilityLabel={`Add one ${variant.title}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: quantity === MAX_DEV_CHECKOUT_QUANTITY }}
                  disabled={quantity === MAX_DEV_CHECKOUT_QUANTITY}
                  onPress={() => changeQuantity(variant.id, 1)}
                  style={[
                    styles.stepper,
                    quantity === MAX_DEV_CHECKOUT_QUANTITY && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.buttonText}>+</Text>
                </Pressable>
              </View>
            );
          })}
          <Text style={styles.status}>
            Estimated subtotal: {formatAmount(estimate, variants.variants[0]?.currencyCode ?? '')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canOpen }}
            disabled={!canOpen}
            onPress={() => void openCheckout()}
            style={[styles.button, !canOpen && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Open test checkout</Text>
          </Pressable>
        </>
      )}
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {status.state === 'error' ? status.message : STATUS_TEXT[status.state]}
      </Text>
      {cart !== undefined && <Text style={styles.status}>{cartSummary(cart)}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: 12 },
  rowTitle: { flex: 1, fontSize: 14 },
  stepper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  quantity: { width: 32, fontSize: 16, textAlign: 'center' },
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
