import {
  executeGraphql,
  type TransportErrorDetails,
  type TransportErrorKind,
} from '@/graphql/transport';

// The transport's rules are proven through the Storefront client's tests, which pass unchanged
// since the move (D-126), and the Customer Account API client's tests. These cover what only the
// transport has: the caller's error factory and a deadline shared by two calls.

class TestError extends Error {
  constructor(
    readonly kind: TransportErrorKind,
    readonly details: TransportErrorDetails,
  ) {
    super(kind);
  }
  get retryable(): boolean {
    return this.kind === 'no-network' || this.kind === 'timeout';
  }
}

const REQUEST = { url: 'https://example.test/graphql', headers: {}, body: '{}' };

function hangingFetch(_url: string, init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(new TypeError('aborted')));
  });
}

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock = jest.spyOn(globalThis, 'fetch');
  jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("fails with the caller's own error type and the operation's name", async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers(),
    text: async () => JSON.stringify({ errors: [{ extensions: { code: 'BAD_REQUEST' } }] }),
  } as Response);

  const outcome = executeGraphql(REQUEST, {
    operation: 'query',
    operationName: 'Example',
    makeError: (kind, details) => new TestError(kind, details),
  }).catch((error: unknown) => error);

  const error = (await outcome) as TestError;
  expect(error).toBeInstanceOf(TestError);
  expect(error.kind).toBe('graphql-error');
  expect(error.details).toEqual({
    operationName: 'Example',
    status: undefined,
    codes: ['BAD_REQUEST'],
  });
});

it("ends the call at the caller's deadline, not 30 seconds from its own start", async () => {
  fetchMock.mockImplementation(hangingFetch);

  const outcome = executeGraphql(REQUEST, {
    operation: 'query',
    operationName: 'Example',
    deadline: Date.now() + 3_000,
    makeError: (kind, details) => new TestError(kind, details),
  }).catch((error: unknown) => error);

  await jest.advanceTimersByTimeAsync(2_999);
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  await jest.advanceTimersByTimeAsync(1);

  // No retry: less than 2 seconds would be left.
  expect(((await outcome) as TestError).kind).toBe('timeout');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
