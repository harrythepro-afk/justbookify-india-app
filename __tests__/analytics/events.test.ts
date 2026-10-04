import {
  ANALYTICS_EVENTS,
  trackAppOpen,
  trackCheckoutFailed,
  trackLogin,
  trackRentalOrderSuccess,
  trackScreenView,
  trackSearch,
  trackViewBook,
} from '@/analytics/events';
import {
  analyticsOrderId,
  analyticsProductId,
  analyticsToken,
  type AnalyticsToken,
} from '@/analytics/ids';

let mockGranted = false;
const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());
const mockSendScreenView = jest.fn((_name: string) => Promise.resolve());
const mockReportProblem = jest.fn();

jest.mock('@/analytics/consent', () => ({
  isAnalyticsConsentGranted: () => mockGranted,
}));

jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: (name: string) => mockSendScreenView(name),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportAnalyticsProblem: (problem: string) => mockReportProblem(problem),
}));

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('test value refused');
  return value;
}

const PRODUCT = required(analyticsProductId('gid://shopify/Product/8123456789012'));

describe('analytics events', () => {
  beforeEach(() => {
    mockGranted = false;
    jest.clearAllMocks();
  });

  it('covers every event in docs/ANALYTICS.md', () => {
    expect(Object.keys(ANALYTICS_EVENTS)).toHaveLength(25);
  });

  it.each(Object.keys(ANALYTICS_EVENTS))('names %s in snake case within 40 characters', (name) => {
    expect(name).toMatch(/^[a-z][a-z_]{0,39}$/);
  });

  it('sends nothing while consent is not granted', () => {
    trackAppOpen({ source: 'cold_start' });
    trackLogin();
    trackScreenView('account');

    expect(mockSendEvent).not.toHaveBeenCalled();
    expect(mockSendScreenView).not.toHaveBeenCalled();
  });

  it('sends a valid event with only its documented parameters once consent is granted', () => {
    mockGranted = true;

    trackAppOpen({ source: 'cold_start' });
    trackViewBook({ product_id: PRODUCT, available: false });
    trackSearch({ term_length: 7, result_count: 0 });
    trackLogin();

    expect(mockSendEvent.mock.calls).toEqual([
      ['app_open', { source: 'cold_start' }],
      ['view_book', { product_id: '8123456789012', available: 'no' }],
      ['search', { term_length: 7, result_count: 0 }],
      ['login', {}],
    ]);
  });

  it('sends a screen view by route name', () => {
    mockGranted = true;

    trackScreenView('my-books');

    expect(mockSendScreenView).toHaveBeenCalledWith('my-books');
  });

  it('drops an event that fails the guard, and reports the parameter once, never the value', () => {
    mockGranted = true;
    // A cast gets past the types; the guard still stops it.
    const smuggled = 'parent@example.com' as AnalyticsToken;

    trackCheckoutFailed({ stage: smuggled, error_code: required(analyticsToken('timeout')) });
    trackCheckoutFailed({ stage: smuggled, error_code: required(analyticsToken('timeout')) });

    expect(mockSendEvent).not.toHaveBeenCalled();
    expect(mockReportProblem).toHaveBeenCalledTimes(1);
    expect(mockReportProblem).toHaveBeenCalledWith(
      'dropped checkout_failed (stage failed the guard)',
    );
    expect(JSON.stringify(mockReportProblem.mock.calls)).not.toContain('@');
  });

  it('drops a screen name that carries a parameter value', () => {
    mockGranted = true;

    trackScreenView('book/8123456789012');

    expect(mockSendScreenView).not.toHaveBeenCalled();
    expect(mockReportProblem).toHaveBeenCalledWith(
      'dropped screen_view (screen_name failed the guard)',
    );
  });

  it('reports a failed send by code only', async () => {
    mockGranted = true;
    mockSendEvent.mockRejectedValueOnce(
      Object.assign(new Error('native detail for parent@example.com'), {
        code: 'analytics/unknown',
      }),
    );

    trackLogin();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockReportProblem).toHaveBeenCalledWith('send failed (analytics/unknown)');
  });

  it('rules out personal data by type', () => {
    mockGranted = false;

    // @ts-expect-error: a product ID is built from a Shopify GID, never a raw string.
    trackViewBook({ product_id: 'The Gruffalo', available: true });
    // @ts-expect-error: a token is built by analyticsToken(), never free text.
    trackCheckoutFailed({ stage: 'Priya Sharma', error_code: 'timeout' });
    trackRentalOrderSuccess({
      // @ts-expect-error: an order ID is not a product ID.
      order_id: PRODUCT,
      book_count: 2,
      payment_type: required(analyticsToken('cash_on_delivery')),
    });
    // @ts-expect-error: no event takes an email.
    trackLogin({ email: 'parent@example.com' });
    // @ts-expect-error: app_open takes only the listed sources.
    trackAppOpen({ source: 'parent@example.com' });

    expect(required(analyticsOrderId('gid://shopify/Order/1'))).toBe('1');
  });
});
