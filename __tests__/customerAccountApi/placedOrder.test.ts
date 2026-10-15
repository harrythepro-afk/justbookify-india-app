import type { OrderSummary } from '@/customerAccountApi/orders';
import {
  findPlacedOrder,
  orderIdForm,
  orderIdNumber,
  PLACED_ORDER_CLOCK_SKEW_MILLIS,
} from '@/customerAccountApi/placedOrder';

const STARTED = Date.parse('2026-10-15T10:00:00Z');

function order(id: number, name: string, processedAt: string): OrderSummary {
  return {
    id: `gid://shopify/Order/${id}`,
    name,
    processedAt,
    status: 'placed',
    books: [],
    moreBooks: false,
  };
}

const OLDER = order(1001, '#1001', '2026-10-14T09:00:00Z');
const EARLIER_TODAY = order(1002, '#1002', '2026-10-15T09:58:00Z');
const NEW = order(1003, '#1003', '2026-10-15T10:03:00Z');

describe('the order ID from checkout (D-151)', () => {
  it.each([
    ['gid://shopify/Order/1003', 'Order', '1003'],
    ['gid://shopify/OrderIdentity/1003', 'OrderIdentity', '1003'],
    ['gid://shopify/OrderIdentity/1003?key=abc', 'OrderIdentity', '1003'],
    ['gid://shopify/Cart/1003', 'other', undefined],
    ['1003', 'other', undefined],
    [undefined, 'other', undefined],
  ])('reads %p as form %p and number %p', (id, form, number) => {
    expect(orderIdForm(id)).toBe(form);
    expect(orderIdNumber(id)).toBe(number);
  });
});

describe('findPlacedOrder (D-151)', () => {
  it('finds the order by the number in the completed event, in either ID form', () => {
    const orders = [NEW, EARLIER_TODAY, OLDER];
    expect(findPlacedOrder(orders, { orderNumber: '1003', startedAt: STARTED })).toBe(NEW);
    expect(findPlacedOrder(orders, { orderNumber: '1001', startedAt: STARTED })).toBe(OLDER);
  });

  it('without a match by number, takes the newest order that was not there at the start', () => {
    const known = new Set([EARLIER_TODAY.id, OLDER.id]);
    expect(
      findPlacedOrder([NEW, EARLIER_TODAY, OLDER], { startedAt: STARTED, knownOrderIds: known }),
    ).toBe(NEW);
    expect(
      findPlacedOrder([NEW, EARLIER_TODAY], {
        orderNumber: '9999',
        startedAt: STARTED,
        knownOrderIds: known,
      }),
    ).toBe(NEW);
  });

  it('never takes an order that was already there, even one placed minutes earlier', () => {
    const known = new Set([EARLIER_TODAY.id, OLDER.id]);
    expect(
      findPlacedOrder([EARLIER_TODAY, OLDER], { startedAt: STARTED, knownOrderIds: known }),
    ).toBeUndefined();
  });

  it('makes no guess without the orders read at the start', () => {
    expect(findPlacedOrder([NEW, EARLIER_TODAY], { startedAt: STARTED })).toBeUndefined();
  });

  it('allows the phone clock to be ahead of Shopify by the allowance, and no more', () => {
    const skewed = order(1004, '#1004', new Date(STARTED - 60_000).toISOString());
    const tooOld = order(
      1005,
      '#1005',
      new Date(STARTED - PLACED_ORDER_CLOCK_SKEW_MILLIS - 1).toISOString(),
    );
    const known = new Set<string>();
    expect(findPlacedOrder([skewed], { startedAt: STARTED, knownOrderIds: known })).toBe(skewed);
    expect(findPlacedOrder([tooOld], { startedAt: STARTED, knownOrderIds: known })).toBeUndefined();
  });
});
