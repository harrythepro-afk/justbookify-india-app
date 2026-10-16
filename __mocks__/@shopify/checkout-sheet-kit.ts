/**
 * Jest only: Checkout Kit reaches its native module as soon as it is imported, which a test has
 * not got. Every test that renders the Cart tab gets this stand-in without asking for it; a test
 * of checkout itself replaces it with its own `jest.mock` (P9-01).
 */

export const ColorScheme = {
  automatic: 'automatic',
  light: 'light',
  dark: 'dark',
  web: 'web_default',
};

export class ShopifyCheckoutSheet {
  addEventListener(): undefined {
    throw new Error(
      'Checkout Kit is not available in this test: mock @shopify/checkout-sheet-kit.',
    );
  }

  present(): void {
    throw new Error(
      'Checkout Kit is not available in this test: mock @shopify/checkout-sheet-kit.',
    );
  }

  initiateGeolocationRequest(): Promise<void> {
    return Promise.resolve();
  }
}
