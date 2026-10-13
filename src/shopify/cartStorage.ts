import * as SecureStore from 'expo-secure-store';

/**
 * The only file that keeps the cart's ID on the phone (P8-01, answer 4): in `expo-secure-store`
 * (Android Keystore, iOS Keychain; D-052), under its own key, never moved to another device by a
 * backup. The ID holds Shopify's secret key for the cart, so it is never logged or sent anywhere
 * but Shopify. A stored value that is not a cart ID is deleted.
 */

const KEY = 'cart_id';

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

// Shopify says cart tokens may change format and length, so only the prefix is fixed, with a
// generous limit far below the store's 2,048-byte warning (D-121).
const CART_ID = /^gid:\/\/shopify\/Cart\/\S+$/;
const MAX_LENGTH = 1_000;

/** Whether a value looks like a Shopify cart ID. */
export function isCartId(value: string): boolean {
  return value.length <= MAX_LENGTH && CART_ID.test(value);
}

/** The stored cart ID, or null when there is none or the value is not a cart ID. */
export async function readStoredCartId(): Promise<string | null> {
  const value = await SecureStore.getItemAsync(KEY, OPTIONS);
  if (value === null) return null;
  if (isCartId(value)) return value;
  await SecureStore.deleteItemAsync(KEY, OPTIONS);
  return null;
}

export function writeStoredCartId(cartId: string): Promise<void> {
  return SecureStore.setItemAsync(KEY, cartId, OPTIONS);
}

export function deleteStoredCartId(): Promise<void> {
  return SecureStore.deleteItemAsync(KEY, OPTIONS);
}
