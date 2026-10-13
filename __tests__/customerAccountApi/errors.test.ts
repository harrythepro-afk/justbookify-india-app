import {
  CustomerAccountApiError,
  reportCustomerAccountApiError,
  resetReportedCustomerAccountApiFaultsForTests,
  type CustomerAccountApiErrorKind,
} from '@/customerAccountApi/errors';
import { reportQueryError } from '@/query/errorReporting';

const mockProblems: [string, string][] = [];
const mockUnexpected: string[] = [];
jest.mock('@/crashReporting/sentry', () => ({
  reportCustomerAccountApiProblem: (code: string, operationName: string) =>
    mockProblems.push([code, operationName]),
  reportUnexpectedDataError: (code: string) => mockUnexpected.push(code),
  reportStorefrontProblem: () => undefined,
}));

function error(kind: CustomerAccountApiErrorKind, status?: number) {
  return new CustomerAccountApiError(kind, { operationName: 'CustomerOrders', status });
}

beforeEach(() => {
  mockProblems.length = 0;
  mockUnexpected.length = 0;
  resetReportedCustomerAccountApiFaultsForTests();
});

describe('CustomerAccountApiError', () => {
  it('is retryable only after network trouble, a timeout, throttling or a 5xx', () => {
    expect(error('no-network').retryable).toBe(true);
    expect(error('timeout').retryable).toBe(true);
    expect(error('throttled').retryable).toBe(true);
    expect(error('http-error', 503).retryable).toBe(true);
    expect(error('http-error', 401).retryable).toBe(false);
    expect(error('graphql-error').retryable).toBe(false);
    expect(error('signed-out').retryable).toBe(false);
    expect(error('unauthorized', 401).retryable).toBe(false);
  });

  it('keeps only upper-case Shopify codes', () => {
    const apiError = new CustomerAccountApiError('graphql-error', {
      operationName: 'CustomerProfile',
      codes: ['ACCESS_DENIED', 'reader@example.com', 'lower_case'],
    });
    expect(apiError.codes).toEqual(['ACCESS_DENIED']);
    expect(apiError.message).not.toContain('example.com');
  });
});

describe('reportCustomerAccountApiError', () => {
  it.each(['no-network', 'timeout', 'cancelled', 'signed-out', 'unavailable'] as const)(
    'does not report %s',
    (kind) => {
      reportCustomerAccountApiError(error(kind));
      expect(mockProblems).toEqual([]);
    },
  );

  it.each(['throttled', 'invalid-response', 'graphql-error'] as const)(
    'reports %s by code and operation name, every time',
    (kind) => {
      reportCustomerAccountApiError(error(kind));
      reportCustomerAccountApiError(error(kind));
      expect(mockProblems).toEqual([
        [`customer-account-api/${kind}`, 'CustomerOrders'],
        [`customer-account-api/${kind}`, 'CustomerOrders'],
      ]);
    },
  );

  it('reports a server error every time', () => {
    reportCustomerAccountApiError(error('http-error', 502));
    reportCustomerAccountApiError(error('http-error', 502));
    expect(mockProblems).toHaveLength(2);
  });

  it('reports a configuration fault once per session per kind and status', () => {
    reportCustomerAccountApiError(error('unauthorized', 401));
    reportCustomerAccountApiError(error('unauthorized', 401));
    reportCustomerAccountApiError(error('http-error', 403));
    reportCustomerAccountApiError(error('http-error', 403));
    reportCustomerAccountApiError(error('http-error', 404));
    expect(mockProblems).toEqual([
      ['customer-account-api/unauthorized', 'CustomerOrders'],
      ['customer-account-api/http-error', 'CustomerOrders'],
      ['customer-account-api/http-error', 'CustomerOrders'],
    ]);
  });

  it('ignores anything that is not its own error', () => {
    reportCustomerAccountApiError(new Error('other'));
    expect(mockProblems).toEqual([]);
  });
});

describe('the query cache reports it in one place (D-061)', () => {
  it('sends a CustomerAccountApiError through its own rule, not as unexpected', () => {
    reportQueryError(error('graphql-error'));
    reportQueryError(error('no-network'));
    expect(mockProblems).toEqual([['customer-account-api/graphql-error', 'CustomerOrders']]);
    expect(mockUnexpected).toEqual([]);
  });
});
