import { guardEvent, isSafeScreenName } from '@/analytics/guard';

describe('guardEvent', () => {
  it('passes valid parameters and converts them to what is sent', () => {
    const result = guardEvent(
      { product_id: 'productId', available: 'yes/no', cart_value: 'money', rating: 'rating' },
      { product_id: '8123456789012', available: true, cart_value: 349.999, rating: 5 },
    );

    expect(result).toEqual({
      ok: true,
      params: { product_id: '8123456789012', available: 'yes', cart_value: 350, rating: 5 },
    });
  });

  it('accepts an event with no parameters', () => {
    expect(guardEvent({}, {})).toEqual({ ok: true, params: {} });
  });

  it.each([
    ['an email in a token', { stage: 'token' }, { stage: 'parent@example.com' }, 'stage'],
    ['a phone number in a token', { stage: 'token' }, { stage: '9876543210' }, 'stage'],
    ['free text in a token', { stage: 'token' }, { stage: 'Priya Sharma' }, 'stage'],
    ['an email as an ID', { product_id: 'productId' }, { product_id: 'a@b.in' }, 'product_id'],
    ['a GID as an ID', { order_id: 'orderId' }, { order_id: 'gid://shopify/Order/1' }, 'order_id'],
    ['a value outside the list', { source: ['cold_start'] }, { source: 'push' }, 'source'],
    ['an unknown parameter', {}, { email: 'parent@example.com' }, 'email'],
    ['a missing parameter', { book_count: 'count' }, {}, 'book_count'],
    ['a negative count', { book_count: 'count' }, { book_count: -1 }, 'book_count'],
    ['a fractional count', { book_count: 'count' }, { book_count: 1.5 }, 'book_count'],
    ['a number as a token', { stage: 'token' }, { stage: 9876543210 }, 'stage'],
    ['a rating of 6', { rating: 'rating' }, { rating: 6 }, 'rating'],
    ['a non-finite amount', { cart_value: 'money' }, { cart_value: Infinity }, 'cart_value'],
    ['an over-long token', { stage: 'token' }, { stage: 'a'.repeat(41) }, 'stage'],
  ] as const)('drops %s, naming only the parameter', (_case, schema, params, param) => {
    const result = guardEvent(schema, params);

    expect(result).toEqual({ ok: false, param });
    expect(JSON.stringify(result)).not.toMatch(/@|9876543210|Priya/);
  });

  it.each([null, undefined, 'source=cold_start'])('drops parameters given as %p', (params) => {
    expect(guardEvent({}, params)).toEqual({ ok: false, param: '(parameters)' });
  });
});

describe('isSafeScreenName', () => {
  it.each(['index', 'account', 'my-books', 'book/[id]', 'shop/[...slug]'])('accepts %p', (name) => {
    expect(isSafeScreenName(name)).toBe(true);
  });

  it.each([
    '',
    'book/8123456789012',
    'book/the-gruffalo?ref=parent@example.com',
    'Account',
    'search/priya sharma',
    'a'.repeat(101),
  ])('refuses %p', (name) => {
    expect(isSafeScreenName(name)).toBe(false);
  });
});
