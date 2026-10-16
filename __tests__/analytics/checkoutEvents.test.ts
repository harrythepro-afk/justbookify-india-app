import {
  checkoutErrorCode,
  paymentTypeOf,
  trackCheckoutBegun,
  trackCheckoutStopped,
  trackOrderPlaced,
} from '@/analytics/checkoutEvents';

const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());
let mockGranted = true;
const mockReportProblem = jest.fn();

jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: () => Promise.resolve(),
}));
jest.mock('@/analytics/consent', () => ({ isAnalyticsConsentGranted: () => mockGranted }));
jest.mock('@/crashReporting/sentry', () => ({
  reportAnalyticsProblem: (message: string) => mockReportProblem(message),
}));

beforeEach(() => {
  mockSendEvent.mockClear();
  mockReportProblem.mockClear();
  mockGranted = true;
});

describe('the checkout events (D-153)', () => {
  it('sends begin_checkout with the count and the amount in rupees', () => {
    trackCheckoutBegun(3, 247.004);
    expect(mockSendEvent.mock.calls).toEqual([
      ['begin_checkout', { book_count: 3, cart_value: 247 }],
    ]);
  });

  it("sends rental_order_success with the order's number, the count and a fixed payment code", () => {
    trackOrderPlaced('1004', 2, 'cash_on_delivery');
    expect(mockSendEvent.mock.calls).toEqual([
      [
        'rental_order_success',
        { order_id: '1004', book_count: 2, payment_type: 'cash_on_delivery' },
      ],
    ]);
  });

  it('drops rental_order_success without an order number, reported by parameter only', () => {
    trackOrderPlaced(undefined, 2, 'unknown');
    expect(mockSendEvent).not.toHaveBeenCalled();
    expect(mockReportProblem).toHaveBeenCalledWith(
      'dropped rental_order_success (order_id failed the guard)',
    );
  });

  it('sends checkout_failed with a stage and a fixed code', () => {
    trackCheckoutStopped('prepare', 'no_network');
    trackCheckoutStopped('checkout', 'closed');
    trackCheckoutStopped('checkout', 'render_process_gone');
    expect(mockSendEvent.mock.calls).toEqual([
      ['checkout_failed', { stage: 'prepare', error_code: 'no_network' }],
      ['checkout_failed', { stage: 'checkout', error_code: 'closed' }],
      ['checkout_failed', { stage: 'checkout', error_code: 'render_process_gone' }],
    ]);
  });

  it('sends nothing without consent', () => {
    mockGranted = false;
    trackCheckoutBegun(1, 99);
    trackOrderPlaced('1004', 1, 'cash_on_delivery');
    trackCheckoutStopped('checkout', 'closed');
    expect(mockSendEvent).not.toHaveBeenCalled();
  });
});

describe('fixed codes', () => {
  it("keeps Checkout Kit's own error codes and turns anything else into unknown", () => {
    expect(checkoutErrorCode('cart_expired')).toBe('cart_expired');
    expect(checkoutErrorCode('render_process_gone')).toBe('render_process_gone');
    expect(checkoutErrorCode('closed')).toBe('unknown');
    expect(checkoutErrorCode('Something about parent@example.com')).toBe('unknown');
    expect(checkoutErrorCode(undefined)).toBe('unknown');
  });

  it.each([
    ['Cash on Delivery (COD)', 'cash_on_delivery'],
    ['manual', 'cash_on_delivery'],
    ['CREDIT_CARD', 'prepaid'],
    ['upi', 'prepaid'],
    ['shop_pay', 'prepaid'],
    ['something new', 'unknown'],
    [undefined, 'unknown'],
    [7, 'unknown'],
  ])('maps the payment type %p to %p', (type, code) => {
    expect(paymentTypeOf(type)).toBe(code);
  });
});
