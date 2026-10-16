import {
  reportStorefrontError,
  safeShopifyCodes,
  shouldReportStorefrontError,
  StorefrontError,
  throwIfUserErrors,
  type StorefrontErrorKind,
} from '@/shopify/errors';

const mockReportProblem = jest.fn<void, [string, string]>();

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: (code: string, operationName: string) =>
    mockReportProblem(code, operationName),
}));

const OPERATION = 'CartRead';

function error(kind: StorefrontErrorKind, status?: number, codes?: string[]): StorefrontError {
  return new StorefrontError(kind, { operationName: OPERATION, status, codes });
}

beforeEach(() => {
  mockReportProblem.mockClear();
});

describe('StorefrontError', () => {
  it('carries a code that safeErrorCode passes through, and fixed wording', () => {
    const thrown = error('http-error', 404);

    expect(thrown.name).toBe('StorefrontError');
    expect(thrown.code).toBe('storefront/http-error');
    expect(thrown.message).toBe(
      'The Storefront API answered with an HTTP error. (CartRead; HTTP 404)',
    );
    expect(thrown).not.toHaveProperty('cause');
  });

  it("keeps only Shopify's upper-case enum codes", () => {
    expect(safeShopifyCodes(['THROTTLED', 'ACCESS_DENIED', 'free text', 'lower', 7, null])).toEqual(
      ['THROTTLED', 'ACCESS_DENIED'],
    );
    expect(error('graphql-error', undefined, ['ok_not', 'INTERNAL_SERVER_ERROR']).codes).toEqual([
      'INTERNAL_SERVER_ERROR',
    ]);
  });

  it.each<[StorefrontErrorKind, number | undefined, boolean]>([
    ['no-network', undefined, true],
    ['timeout', undefined, true],
    ['throttled', 429, true],
    ['http-error', 500, true],
    ['http-error', 502, true],
    ['http-error', 503, true],
    ['http-error', 504, true],
    ['http-error', 501, false],
    ['http-error', 401, false],
    ['http-error', 404, false],
    ['cancelled', undefined, false],
    ['invalid-response', undefined, false],
    ['graphql-error', undefined, false],
    ['user-errors', undefined, false],
  ])('%s (status %p) is retryable: %p', (kind, status, retryable) => {
    expect(error(kind, status).retryable).toBe(retryable);
  });
});

describe('throwIfUserErrors', () => {
  it('does nothing without user errors', () => {
    expect(() => throwIfUserErrors(OPERATION, [])).not.toThrow();
    expect(() => throwIfUserErrors(OPERATION, null)).not.toThrow();
    expect(() => throwIfUserErrors(OPERATION, undefined)).not.toThrow();
  });

  it('throws user-errors with the codes only', () => {
    let thrown: unknown;
    try {
      throwIfUserErrors(OPERATION, [{ code: 'INVALID' }, { code: null }]);
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBeInstanceOf(StorefrontError);
    expect((thrown as StorefrontError).kind).toBe('user-errors');
    expect((thrown as StorefrontError).codes).toEqual(['INVALID', 'UNKNOWN']);
  });
});

describe('Sentry rule (D-057)', () => {
  it.each<[string, StorefrontError]>([
    ['no-network', error('no-network')],
    ['timeout', error('timeout')],
    ['cancelled', error('cancelled')],
    ['handled user errors', error('user-errors', undefined, ['INVALID'])],
  ])('does not report %s', (_name, thrown) => {
    expect(shouldReportStorefrontError(thrown, ['INVALID'])).toBe(false);
  });

  it.each<[string, StorefrontError]>([
    ['graphql-error', error('graphql-error')],
    ['invalid-response', error('invalid-response')],
    ['throttling that survived the retries', error('throttled', 429)],
    ['a server error that survived the retries', error('http-error', 503)],
    ['a configuration fault', error('http-error', 401)],
    ['an unhandled user-error code', error('user-errors', undefined, ['INVALID', 'OTHER'])],
    ['user errors without a code', error('user-errors')],
  ])('reports %s', (_name, thrown) => {
    expect(shouldReportStorefrontError(thrown, ['INVALID'])).toBe(true);
  });

  it('reports by code and operation name only', () => {
    reportStorefrontError(error('graphql-error', undefined, ['ACCESS_DENIED']));

    expect(mockReportProblem).toHaveBeenCalledWith('storefront/graphql-error', OPERATION);
  });

  it('ignores anything that is not a StorefrontError', () => {
    reportStorefrontError(new Error('https://example.myshopify.com failed'));

    expect(mockReportProblem).not.toHaveBeenCalled();
  });

  it('reports a configuration fault at most once per session for each status', () => {
    reportStorefrontError(error('http-error', 403));
    reportStorefrontError(error('http-error', 403));
    reportStorefrontError(error('http-error', 404));
    reportStorefrontError(error('http-error', 404));

    expect(mockReportProblem).toHaveBeenCalledTimes(2);
  });

  it('reports every server error that survived the retries', () => {
    reportStorefrontError(error('http-error', 503));
    reportStorefrontError(error('http-error', 503));

    expect(mockReportProblem).toHaveBeenCalledTimes(2);
  });
});
