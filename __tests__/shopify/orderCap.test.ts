import { fitsUnderCap, isAtOrOverCap, wholeAmountLeft } from '@/shopify/orderCap';

// R2 (P8-01, answer 2): the store's checkout blocks a subtotal of ₹500 or more, so a cart's
// subtotal must stay strictly under the cap.
const CAP = 500;

describe('fitsUnderCap', () => {
  it('allows a book that brings the cart to ₹499', () => {
    expect(fitsUnderCap(450, 49, CAP)).toBe(true);
  });

  it('refuses a book that brings the cart to exactly ₹500', () => {
    expect(fitsUnderCap(451, 49, CAP)).toBe(false);
  });

  it('refuses a book that takes the cart past the cap', () => {
    expect(fitsUnderCap(495, 34, CAP)).toBe(false);
  });

  it('allows the first book in an empty cart', () => {
    expect(fitsUnderCap(0, 99, CAP)).toBe(true);
  });

  it('allows ₹499.99 and refuses ₹500.00 with paise', () => {
    expect(fitsUnderCap(450.5, 49.49, CAP)).toBe(true);
    expect(fitsUnderCap(450.51, 49.49, CAP)).toBe(false);
  });

  it('is not misled by floating-point sums', () => {
    // 0.1 + 0.2 is 0.30000000000000004 in floating point.
    expect(fitsUnderCap(0.1, 0.2, 0.31)).toBe(true);
    expect(fitsUnderCap(0.1, 0.2, 0.3)).toBe(false);
  });

  it('follows the configured cap, not a fixed ₹500', () => {
    expect(fitsUnderCap(250, 49, 300)).toBe(true);
    expect(fitsUnderCap(251, 49, 300)).toBe(false);
  });
});

describe('isAtOrOverCap', () => {
  it('is false at ₹499 and true at ₹500 and over', () => {
    expect(isAtOrOverCap(499, CAP)).toBe(false);
    expect(isAtOrOverCap(500, CAP)).toBe(true);
    expect(isAtOrOverCap(539, CAP)).toBe(true);
  });
});

describe('wholeAmountLeft', () => {
  it('is ₹199 with ₹300 in the cart, because exactly ₹200 more would reach the cap', () => {
    expect(wholeAmountLeft(300, CAP)).toBe(199);
  });

  it('is ₹499 for an empty cart', () => {
    expect(wholeAmountLeft(0, CAP)).toBe(499);
  });

  it('is ₹4 with ₹495 in the cart', () => {
    expect(wholeAmountLeft(495, CAP)).toBe(4);
  });

  it('is 0 at ₹499 and at or over the cap', () => {
    expect(wholeAmountLeft(499, CAP)).toBe(0);
    expect(wholeAmountLeft(500, CAP)).toBe(0);
    expect(wholeAmountLeft(539, CAP)).toBe(0);
  });

  it('counts a part-rupee room as its whole rupees', () => {
    // ₹199.50 of room: ₹199 still fits, since 300.50 + 199 = 499.50.
    expect(wholeAmountLeft(300.5, CAP)).toBe(199);
  });
});
