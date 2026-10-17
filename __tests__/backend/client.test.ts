import {
  BACKEND_ERROR_CODES,
  BACKEND_TIMEOUT_MILLIS,
  checkBackendIdentity,
  hasBackend,
} from '@/backend/client';
import type { BackendConfig } from '@/config';
import type { CustomerSessionState } from '@/customerAccount/session';

// Made-up values only: no real backend, project or token (P10-02, D-166).
const BASE = 'https://asia-south1-example-project.cloudfunctions.net';
const TOKEN = 'made-up-access-token-MARKER-0123456789';

let mockConfig: BackendConfig | undefined = { baseUrl: BASE };
jest.mock('@/config', () => ({
  ...jest.requireActual('@/config'),
  getBackendConfig: () => mockConfig,
}));

let mockSession: CustomerSessionState = { status: 'signedOut', notice: 'none', loggingIn: false };
const mockGetValidAccessToken = jest.fn<Promise<string | undefined>, []>();
jest.mock('@/customerAccount/session', () => ({
  getCustomerSessionState: () => mockSession,
  getValidAccessToken: () => mockGetValidAccessToken(),
}));

const mockFetch = jest.fn<Promise<Response>, [string, RequestInit]>();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;
let consoleSpies: jest.SpyInstance[];

beforeEach(() => {
  mockConfig = { baseUrl: BASE };
  mockSession = { status: 'signedOut', notice: 'none', loggingIn: false };
  mockGetValidAccessToken.mockReset();
  mockGetValidAccessToken.mockResolvedValue(TOKEN);
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  consoleSpies = CONSOLE_METHODS.map((name) =>
    jest.spyOn(console, name).mockImplementation(() => {}),
  );
});

afterEach(() => {
  // Nothing is logged on any path (D-166): no token, URL or body can reach a log line.
  for (const spy of consoleSpies) {
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  }
  jest.useRealTimers();
});

function signIn() {
  mockSession = { status: 'signedIn' };
}

describe('hasBackend', () => {
  it('follows the configuration', () => {
    expect(hasBackend()).toBe(true);
    mockConfig = undefined;
    expect(hasBackend()).toBe(false);
  });
});

describe('checkBackendIdentity (P10-02, D-166)', () => {
  it('signed out: calls GET /whoami with no Authorization header, and shows the answer', async () => {
    mockFetch.mockResolvedValue(jsonResponse(401, { error: 'unauthenticated' }));

    await expect(checkBackendIdentity()).resolves.toBe('unauthenticated');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe(`${BASE}/whoami`);
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(mockGetValidAccessToken).not.toHaveBeenCalled();
  });

  it('signed in: sends the current access token as a Bearer token', async () => {
    signIn();
    mockFetch.mockResolvedValue(jsonResponse(200, { status: 'ok' }));

    await expect(checkBackendIdentity()).resolves.toBe('ok');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.headers).toEqual({ Accept: 'application/json', Authorization: `Bearer ${TOKEN}` });
  });

  it('signed in without a usable token: sends nothing', async () => {
    signIn();
    mockGetValidAccessToken.mockResolvedValue(undefined);

    await expect(checkBackendIdentity()).resolves.toBe('token_unavailable');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('without a backend address: sends nothing', async () => {
    mockConfig = undefined;

    await expect(checkBackendIdentity()).resolves.toBe('app_not_configured');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each(BACKEND_ERROR_CODES.map((code) => [code] as const))(
    "passes on the backend's own code %s",
    async (code) => {
      signIn();
      mockFetch.mockResolvedValue(jsonResponse(503, { error: code }));
      await expect(checkBackendIdentity()).resolves.toBe(code);
    },
  );

  it.each([
    [403, '<html>Forbidden</html>', 'http_403'],
    [404, { error: 'something else' }, 'http_404'],
    [500, { message: TOKEN }, 'http_500'],
    [200, { status: 'fine' }, 'unexpected'],
    [200, 'not json', 'unexpected'],
  ] as const)('maps %s %j to %s, never the body', async (status, body, expected) => {
    signIn();
    mockFetch.mockResolvedValue(
      typeof body === 'string' ? new Response(body, { status }) : jsonResponse(status, body),
    );
    await expect(checkBackendIdentity()).resolves.toBe(expected);
  });

  it('gives network when the request fails, without its message', async () => {
    signIn();
    mockFetch.mockRejectedValue(new TypeError(`Network request failed for ${BASE} ${TOKEN}`));

    const result = await checkBackendIdentity();

    expect(result).toBe('network');
  });

  it('gives timeout after the limit, and aborts the request', async () => {
    jest.useFakeTimers();
    signIn();
    let signal: AbortSignal | undefined;
    mockFetch.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          signal = init.signal ?? undefined;
          signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    const pending = checkBackendIdentity();
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(BACKEND_TIMEOUT_MILLIS);

    await expect(pending).resolves.toBe('timeout');
    expect(signal?.aborted).toBe(true);
  });

  it('keeps its limit above the function timeout of 10 seconds (D-160)', () => {
    expect(BACKEND_TIMEOUT_MILLIS).toBeGreaterThan(10_000);
  });

  it('never returns the token, the address or a body on any path', async () => {
    signIn();
    const answers: Response[] = [
      jsonResponse(200, { status: 'ok', token: TOKEN }),
      jsonResponse(401, { error: TOKEN }),
      new Response(`${BASE} ${TOKEN}`, { status: 502 }),
    ];
    for (const answer of answers) {
      mockFetch.mockResolvedValueOnce(answer);
      const result = await checkBackendIdentity();
      expect(result).not.toContain('MARKER');
      expect(result).not.toContain('example-project');
    }
  });
});
