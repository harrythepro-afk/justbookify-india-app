import { CancelledError } from '@tanstack/react-query';

import { reportQueryError } from '@/query/errorReporting';
import { DevCheckoutError } from '@/shopify/devCheckout';
import { StorefrontError, type StorefrontErrorKind } from '@/shopify/errors';

const mockStorefrontProblem = jest.fn<void, [string, string]>();
const mockUnexpected = jest.fn<void, [string]>();

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: (code: string, operationName: string) =>
    mockStorefrontProblem(code, operationName),
  reportUnexpectedDataError: (code: string) => mockUnexpected(code),
}));

function storefrontError(kind: StorefrontErrorKind, codes?: string[]): StorefrontError {
  return new StorefrontError(kind, { operationName: 'DevCheckoutProduct', codes });
}

function reported(): string[] {
  return [
    ...mockStorefrontProblem.mock.calls.map((call) => call.join(' ')),
    ...mockUnexpected.mock.calls.map((call) => call.join(' ')),
  ];
}

beforeEach(() => {
  mockStorefrontProblem.mockClear();
  mockUnexpected.mockClear();
});

describe('reportQueryError', () => {
  it('sends a Storefront error through the D-057 rule', () => {
    reportQueryError(storefrontError('graphql-error'));
    reportQueryError(storefrontError('no-network'));
    reportQueryError(storefrontError('timeout'));

    expect(mockStorefrontProblem.mock.calls).toEqual([
      ['storefront/graphql-error', 'DevCheckoutProduct'],
    ]);
    expect(mockUnexpected).not.toHaveBeenCalled();
  });

  it("skips user-error codes the caller handles, and reports the ones it doesn't", () => {
    reportQueryError(storefrontError('user-errors', ['INVALID']), ['INVALID']);
    expect(reported()).toEqual([]);

    reportQueryError(storefrontError('user-errors', ['INVALID', 'OTHER']), ['INVALID']);
    expect(reported()).toEqual(['storefront/user-errors DevCheckoutProduct']);
  });

  it.each([
    ['a Storefront cancel', storefrontError('cancelled')],
    ["TanStack's cancel", new CancelledError()],
    ['an abort error', Object.assign(new Error('Aborted'), { name: 'AbortError' })],
  ])('never reports %s', (_name, error) => {
    reportQueryError(error);

    expect(reported()).toEqual([]);
  });

  it('reports any other error as unexpected, by its code only', () => {
    reportQueryError(new DevCheckoutError('no-available-variant'));
    reportQueryError(new TypeError('https://example-dev-store.myshopify.com/api failed'));
    reportQueryError('a thrown string');

    expect(mockUnexpected.mock.calls).toEqual([
      ['devCheckout/no-available-variant'],
      ['TypeError'],
      ['unknown'],
    ]);
    expect(reported().join(' ')).not.toContain('myshopify');
  });
});
