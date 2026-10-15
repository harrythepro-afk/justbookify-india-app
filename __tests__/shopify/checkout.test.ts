import { CartDataError } from '@/shopify/cart';
import { CART_CHECKOUT_PREPARE_MUTATION, prepareCheckout } from '@/shopify/checkout';
import { StorefrontError } from '@/shopify/errors';

import { CART_CONFIG, CART_ID, cartFields, linesPriced } from '../helpers/cart';

// Made-up values only: a test token, never a real one.
const TOKEN = 'test-customer-token';
const CHECKOUT_URL = 'https://example-dev.myshopify.com/cart/c/test-cart-0001?key=test-key';

let mockAnswer: unknown;
const mockMutation = jest.fn((_document: string, _options: unknown) =>
  mockAnswer instanceof Error ? Promise.reject(mockAnswer) : Promise.resolve(mockAnswer),
);
jest.mock('@/shopify/client', () => ({
  storefrontMutation: (document: string, options: unknown) => mockMutation(document, options),
  storefrontQuery: () => Promise.reject(new Error('no query expected')),
}));

beforeEach(() => mockMutation.mockClear());

describe('prepareCheckout (D-149)', () => {
  it("sends CartCheckoutPrepare with the cart's ID and the customer's token, and nothing else", async () => {
    mockAnswer = {
      cartBuyerIdentityUpdate: {
        cart: { ...cartFields(linesPriced([99, 49])), checkoutUrl: CHECKOUT_URL },
        userErrors: [],
      },
    };

    const prepared = await prepareCheckout(CART_ID, TOKEN, CART_CONFIG);

    expect(mockMutation).toHaveBeenCalledWith(CART_CHECKOUT_PREPARE_MUTATION, {
      variables: { cartId: CART_ID, customerAccessToken: TOKEN },
    });
    expect(prepared?.checkoutUrl).toBe(CHECKOUT_URL);
    expect(prepared?.cart.books).toHaveLength(2);
    expect(prepared?.cart.countedSubtotal).toBe(148);
  });

  it('attaches the token as the buyer identity, keeps the market and selects no identity', () => {
    expect(CART_CHECKOUT_PREPARE_MUTATION).toContain(
      'buyerIdentity: { customerAccessToken: $customerAccessToken, countryCode: $country }',
    );
    expect(CART_CHECKOUT_PREPARE_MUTATION).toContain('checkoutUrl');
    const selection = CART_CHECKOUT_PREPARE_MUTATION.split('countryCode: $country }')[1] ?? '';
    expect(selection).not.toMatch(/buyerIdentity|customer|email|phone/);
  });

  it('returns null when Shopify returns no cart', async () => {
    mockAnswer = { cartBuyerIdentityUpdate: { cart: null, userErrors: [] } };
    await expect(prepareCheckout(CART_ID, TOKEN, CART_CONFIG)).resolves.toBeNull();
  });

  it('throws user errors as codes only, never the token or the cart ID', async () => {
    mockAnswer = { cartBuyerIdentityUpdate: { cart: null, userErrors: [{ code: 'INVALID' }] } };

    const error = await prepareCheckout(CART_ID, TOKEN, CART_CONFIG).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StorefrontError);
    expect((error as StorefrontError).kind).toBe('user-errors');
    expect((error as StorefrontError).codes).toEqual(['INVALID']);
    const text = JSON.stringify(error) + String((error as Error).message);
    for (const secret of [TOKEN, CART_ID, CHECKOUT_URL]) expect(text).not.toContain(secret);
  });

  it('refuses a cart in another currency', async () => {
    const fields = cartFields(linesPriced([99]));
    mockAnswer = {
      cartBuyerIdentityUpdate: {
        cart: {
          ...fields,
          cost: { subtotalAmount: { amount: '99.0', currencyCode: 'BHD' } },
          checkoutUrl: CHECKOUT_URL,
        },
        userErrors: [],
      },
    };
    await expect(prepareCheckout(CART_ID, TOKEN, CART_CONFIG)).rejects.toBeInstanceOf(
      CartDataError,
    );
  });
});
