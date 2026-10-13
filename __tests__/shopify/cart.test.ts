import {
  addCartLine,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_READ_QUERY,
  CartDataError,
  createCart,
  readCart,
  removeCartLine,
  toCart,
} from '@/shopify/cart';
import { StorefrontError } from '@/shopify/errors';

import { CART_CONFIG, CART_ID, cartFields, cartLine, NEW_CART_ID } from '../helpers/cart';

const mockQuery = jest.fn();
const mockMutation = jest.fn();
jest.mock('@/shopify/client', () => ({
  storefrontQuery: (...args: unknown[]) => mockQuery(...args),
  storefrontMutation: (...args: unknown[]) => mockMutation(...args),
}));

beforeEach(() => {
  mockQuery.mockReset();
  mockMutation.mockReset();
});

describe('toCart', () => {
  it("maps each line to the card's fields with its line", () => {
    const line = cartLine({ handle: 'the-gruffalo', title: 'The Gruffalo', price: '74.0' });
    const cart = toCart(cartFields([line]), CART_CONFIG);
    expect(cart.books).toHaveLength(1);
    expect(cart.books[0]).toMatchObject({
      handle: 'the-gruffalo',
      title: 'The Gruffalo',
      price: '₹74',
      priceAmount: 74,
      lineId: line.id,
      rentedOut: false,
      countedAmount: 74,
      orderable: true,
    });
    expect(cart.books[0]?.variantId).toMatch(/^gid:\/\/shopify\/ProductVariant\//);
  });

  it("counts Shopify's subtotal when every book can be ordered", () => {
    const cart = toCart(cartFields([cartLine(), cartLine()], 98), CART_CONFIG);
    expect(cart).toMatchObject({ shopifySubtotal: 98, countedSubtotal: 98, hasRentedOut: false });
  });

  it("uses Shopify's subtotal, not the app's sum, when they differ", () => {
    // Shopify's figure wins (answer 2).
    const cart = toCart(cartFields([cartLine({ price: '49.0' })], 52), CART_CONFIG);
    expect(cart.countedSubtotal).toBe(52);
  });

  it('marks a book Shopify no longer sells as rented out and leaves it out of the count', () => {
    const lines = [
      cartLine({ price: '99.0' }),
      cartLine({ price: '74.0', availableForSale: false }),
    ];
    const cart = toCart(cartFields(lines), CART_CONFIG);
    expect(cart.books.map((book) => book.rentedOut)).toEqual([false, true]);
    expect(cart).toMatchObject({ shopifySubtotal: 173, countedSubtotal: 99, hasRentedOut: true });
    expect(cart.books[1]?.countedAmount).toBe(0);
  });

  it('marks a line Shopify set to zero as rented out', () => {
    // Shopify's "Cart warnings" guide: an out-of-stock line can be set to quantity 0.
    const lines = [cartLine({ price: '49.0' }), cartLine({ price: '34.0', quantity: 0 })];
    const cart = toCart(cartFields(lines), CART_CONFIG);
    expect(cart.books[1]?.rentedOut).toBe(true);
    expect(cart.countedSubtotal).toBe(49);
  });

  it('keeps a book orderable at zero stock as orderable', () => {
    const cart = toCart(
      cartFields([cartLine({ currentlyNotInStock: true, price: '49.0' })]),
      CART_CONFIG,
    );
    expect(cart.books[0]?.rentedOut).toBe(false);
    expect(cart.countedSubtotal).toBe(49);
  });

  it('skips a line that is not a product variant', () => {
    const fields = cartFields([cartLine()]);
    const odd = {
      ...fields.lines.nodes[0]!,
      merchandise: {},
    } as unknown as (typeof fields.lines.nodes)[number];
    const cart = toCart({ ...fields, lines: { nodes: [odd] } }, CART_CONFIG);
    expect(cart.books).toEqual([]);
  });

  it('refuses amounts in another currency', () => {
    // A book's own prices fail as on the card (CatalogueDataError); the cart's amounts as cart data.
    expect(() => toCart(cartFields([cartLine({ currencyCode: 'BHD' })]), CART_CONFIG)).toThrow(
      /not in the configured currency/,
    );
    const fields = cartFields([cartLine()]);
    expect(() =>
      toCart(
        { ...fields, cost: { subtotalAmount: { amount: '49.0', currencyCode: 'USD' } } },
        CART_CONFIG,
      ),
    ).toThrow(CartDataError);
  });
});

describe('readCart', () => {
  it('reads the cart by its ID', async () => {
    mockQuery.mockResolvedValue({ cart: cartFields([cartLine()]) });
    const cart = await readCart(CART_ID, CART_CONFIG);
    expect(cart?.books).toHaveLength(1);
    expect(mockQuery).toHaveBeenCalledWith(CART_READ_QUERY, {
      variables: { cartId: CART_ID },
      signal: undefined,
    });
  });

  it('is null when Shopify has no such cart (expired, or its order was placed)', async () => {
    mockQuery.mockResolvedValue({ cart: null });
    await expect(readCart(CART_ID, CART_CONFIG)).resolves.toBeNull();
  });
});

describe('changes', () => {
  it('creates a cart with one copy of the book', async () => {
    mockMutation.mockResolvedValue({
      cartCreate: { cart: { ...cartFields([cartLine()]), id: NEW_CART_ID }, userErrors: [] },
    });
    const result = await createCart('gid://shopify/ProductVariant/9', CART_CONFIG);
    expect(result.cartId).toBe(NEW_CART_ID);
    expect(result.cart.books).toHaveLength(1);
    expect(mockMutation).toHaveBeenCalledWith(CART_CREATE_MUTATION, {
      variables: { lines: [{ merchandiseId: 'gid://shopify/ProductVariant/9', quantity: 1 }] },
    });
  });

  it('adds one copy of the book to the cart', async () => {
    mockMutation.mockResolvedValue({
      cartLinesAdd: { cart: cartFields([cartLine()]), userErrors: [] },
    });
    await addCartLine(CART_ID, 'gid://shopify/ProductVariant/9', CART_CONFIG);
    expect(mockMutation).toHaveBeenCalledWith(CART_LINES_ADD_MUTATION, {
      variables: {
        cartId: CART_ID,
        lines: [{ merchandiseId: 'gid://shopify/ProductVariant/9', quantity: 1 }],
      },
    });
  });

  it('removes one line', async () => {
    mockMutation.mockResolvedValue({ cartLinesRemove: { cart: cartFields([]), userErrors: [] } });
    const cart = await removeCartLine(CART_ID, 'gid://shopify/CartLine/line-x?cart=t', CART_CONFIG);
    expect(cart.books).toEqual([]);
    expect(mockMutation).toHaveBeenCalledWith(CART_LINES_REMOVE_MUTATION, {
      variables: { cartId: CART_ID, lineIds: ['gid://shopify/CartLine/line-x?cart=t'] },
    });
  });

  it("turns Shopify's user errors into a StorefrontError with the codes only", async () => {
    mockMutation.mockResolvedValue({
      cartLinesAdd: { cart: null, userErrors: [{ code: 'MERCHANDISE_NOT_APPLICABLE' }] },
    });
    const error = await addCartLine(CART_ID, 'gid://shopify/ProductVariant/9', CART_CONFIG).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(StorefrontError);
    expect(error).toMatchObject({ kind: 'user-errors', codes: ['MERCHANDISE_NOT_APPLICABLE'] });
    expect(String((error as Error).message)).not.toContain('test-cart');
  });

  it('refuses a change that returns no cart and no error', async () => {
    mockMutation.mockResolvedValue({ cartLinesRemove: { cart: null, userErrors: [] } });
    await expect(removeCartLine(CART_ID, 'line', CART_CONFIG)).rejects.toThrow(CartDataError);
    mockMutation.mockResolvedValue({ cartCreate: { cart: null, userErrors: [] } });
    await expect(createCart('variant', CART_CONFIG)).rejects.toThrow(CartDataError);
  });
});
