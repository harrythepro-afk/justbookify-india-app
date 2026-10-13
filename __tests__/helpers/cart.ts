import { toCart, type Cart, type CartFields } from '@/shopify/cart';

import { bookProduct } from './catalogue';

type LineOverrides = Parameters<typeof bookProduct>[0] & {
  /** Shopify's quantity; 0 when it set an out-of-stock line to zero. */
  readonly quantity?: number;
};

export type CartLineNode = CartFields['lines']['nodes'][number];

/** Plainly made-up IDs: low entropy, so the secret scan never mistakes them for real keys. */
export const CART_ID = 'gid://shopify/Cart/test-cart-0001?key=test-key';
export const NEW_CART_ID = 'gid://shopify/Cart/test-cart-0002?key=test-key';

let nextLine = 1;

/** One cart line as the cart operations select it, for a book shaped like the sample books. */
export function cartLine(overrides: LineOverrides = {}): CartLineNode {
  const { quantity = 1, ...bookOverrides } = overrides;
  const product = bookProduct(bookOverrides);
  const variant = product.variants.nodes[0];
  if (variant === undefined) throw new Error('expected a variant');
  const { variants: _variants, ...productFields } = product;
  const amount = (Number(variant.price.amount) * quantity).toFixed(1);
  return {
    id: `gid://shopify/CartLine/line-${nextLine++}?cart=test-cart`,
    quantity,
    cost: { subtotalAmount: { amount, currencyCode: variant.price.currencyCode } },
    merchandise: { ...variant, product: productFields },
  };
}

/** A cart with these lines; the subtotal is Shopify's sum of the lines unless given. */
export function cartFields(lines: readonly CartLineNode[], subtotal?: number): CartFields {
  const sum = lines.reduce((total, line) => total + Number(line.cost.subtotalAmount.amount), 0);
  return {
    cost: { subtotalAmount: { amount: String(subtotal ?? sum), currencyCode: 'INR' } },
    lines: { nodes: [...lines] },
  };
}

export const CART_CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

/** The app's cart for these lines. */
export function cartOf(lines: readonly CartLineNode[], subtotal?: number): Cart {
  return toCart(cartFields(lines, subtotal), CART_CONFIG);
}

/** Books priced to reach a subtotal, such as [99, 99, 99, 99, 99] for ₹495. */
export function linesPriced(prices: readonly number[]): CartLineNode[] {
  return prices.map((price) => cartLine({ price: price.toFixed(1) }));
}
