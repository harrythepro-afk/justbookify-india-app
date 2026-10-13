import {
  callLogoutEndpoint,
  formEncode,
  getJson,
  OAUTH_TIMEOUT_MILLIS,
  postTokenRequest,
} from '@/customerAccount/oauthHttp';

import { TEST_OPENID_CONFIGURATION } from '../helpers/customerAccount';

const TOKEN_ENDPOINT = TEST_OPENID_CONFIGURATION.token_endpoint;
const LOGOUT_ENDPOINT = TEST_OPENID_CONFIGURATION.end_session_endpoint;

const mockFetch = jest.fn<Promise<Response>, [string, RequestInit]>();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('postTokenRequest (P7-01, D-119, D-121)', () => {
  it('posts a form-encoded body with no Origin header, and reads the tokens', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        access_token: 'access-1',
        expires_in: 3600,
        refresh_token: 'refresh-1',
        id_token: 'id-1',
      }),
    );

    const result = await postTokenRequest(TOKEN_ENDPOINT, {
      grant_type: 'refresh_token',
      client_id: 'client id',
      refresh_token: 'refresh+0/=',
    });

    expect(result).toEqual({
      ok: true,
      tokens: {
        accessToken: 'access-1',
        expiresIn: 3600,
        refreshToken: 'refresh-1',
        idToken: 'id-1',
      },
    });
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe(TOKEN_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      'grant_type=refresh_token&client_id=client%20id&refresh_token=refresh%2B0%2F%3D',
    );
    expect(init.headers).toEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    });
  });

  it('accepts an answer with no refresh token or ID token (a refresh may send neither)', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { access_token: 'access-2', expires_in: 60 }));
    expect(await postTokenRequest(TOKEN_ENDPOINT, {})).toEqual({
      ok: true,
      tokens: { accessToken: 'access-2', expiresIn: 60 },
    });
  });

  // Change A: refused is invalid_grant only, whatever the status.
  it.each([400, 401, 403])('counts invalid_grant with HTTP %i as refused', async (status) => {
    mockFetch.mockResolvedValue(jsonResponse(status, { error: 'invalid_grant' }));
    expect(await postTokenRequest(TOKEN_ENDPOINT, {})).toEqual({
      ok: false,
      kind: 'refused',
      code: 'oauth_invalid_grant',
    });
  });

  it.each([
    [400, 'invalid_client'],
    [401, 'invalid_client'],
    [400, 'invalid_request'],
    [401, 'unauthorized_client'],
    [400, 'unsupported_grant_type'],
  ])('counts HTTP %i with %s as unavailable, by its code', async (status, error) => {
    mockFetch.mockResolvedValue(jsonResponse(status, { error, error_description: 'Some text' }));
    expect(await postTokenRequest(TOKEN_ENDPOINT, {})).toEqual({
      ok: false,
      kind: 'unavailable',
      code: `oauth_${error}`,
    });
  });

  it.each([400, 401, 403, 429, 500, 503])(
    'counts HTTP %i with no OAuth error as unavailable',
    async (status) => {
      mockFetch.mockResolvedValue(new Response('<html>Not JSON</html>', { status }));
      expect(await postTokenRequest(TOKEN_ENDPOINT, {})).toEqual({
        ok: false,
        kind: 'unavailable',
        code: `http_${status}`,
      });
    },
  );

  it('never echoes an error code that is not a plain OAuth code', async () => {
    mockFetch.mockResolvedValue(jsonResponse(400, { error: 'Contact reader@example.com' }));
    expect(await postTokenRequest(TOKEN_ENDPOINT, {})).toEqual({
      ok: false,
      kind: 'unavailable',
      code: 'http_400',
    });
  });

  it.each([
    ['no access token', { expires_in: 60 }],
    ['an empty access token', { access_token: '', expires_in: 60 }],
    ['no expiry', { access_token: 'a' }],
    ['a zero expiry', { access_token: 'a', expires_in: 0 }],
    ['an expiry as text', { access_token: 'a', expires_in: '60' }],
    ['a refresh token of the wrong type', { access_token: 'a', expires_in: 60, refresh_token: 5 }],
    ['an empty ID token', { access_token: 'a', expires_in: 60, id_token: '' }],
  ])('counts a 200 answer with %s as unavailable (malformed)', async (_case, body) => {
    mockFetch.mockResolvedValue(jsonResponse(200, body));
    expect(await postTokenRequest(TOKEN_ENDPOINT, {})).toEqual({
      ok: false,
      kind: 'unavailable',
      code: 'malformed_response',
    });
  });

  it('counts a 200 answer that is not JSON as unavailable', async () => {
    mockFetch.mockResolvedValue(new Response('not json', { status: 200 }));
    expect(await postTokenRequest(TOKEN_ENDPOINT, {})).toMatchObject({
      kind: 'unavailable',
      code: 'malformed_response',
    });
  });

  it('counts a network failure as unavailable, without its message', async () => {
    mockFetch.mockRejectedValue(new TypeError(`Network request failed: ${TOKEN_ENDPOINT}`));
    expect(await postTokenRequest(TOKEN_ENDPOINT, {})).toEqual({
      ok: false,
      kind: 'unavailable',
      code: 'network',
    });
  });

  it('gives up after 15 seconds as unavailable (timeout)', async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );

    const pending = postTokenRequest(TOKEN_ENDPOINT, {});
    jest.advanceTimersByTime(OAUTH_TIMEOUT_MILLIS - 1);
    expect(mockFetch.mock.calls[0]![1].signal?.aborted).toBe(false);
    jest.advanceTimersByTime(1);

    expect(await pending).toEqual({ ok: false, kind: 'unavailable', code: 'timeout' });
  });
});

describe('getJson', () => {
  it('reads a JSON document', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { a: 1 }));
    expect(await getJson('https://example.com/doc')).toEqual({ ok: true, body: { a: 1 } });
    expect(mockFetch.mock.calls[0]![1].method).toBe('GET');
  });

  it('gives the status of a failed answer, and malformed for a page that is not JSON', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, {}));
    expect(await getJson('https://example.com/doc')).toEqual({ ok: false, code: 'http_404' });
    mockFetch.mockResolvedValueOnce(new Response('<html>password page</html>', { status: 200 }));
    expect(await getJson('https://example.com/doc')).toEqual({
      ok: false,
      code: 'malformed_response',
    });
  });
});

describe('callLogoutEndpoint (D-122)', () => {
  it("calls Shopify's logout with the ID token as id_token_hint, and accepts 200", async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 200 }));

    expect(await callLogoutEndpoint(LOGOUT_ENDPOINT, 'id.token.value')).toEqual({ ok: true });
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe(`${LOGOUT_ENDPOINT}?id_token_hint=id.token.value`);
    expect(init.method).toBe('GET');
  });

  it('adds the hint after an existing query', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 200 }));
    await callLogoutEndpoint(`${LOGOUT_ENDPOINT}?locale=en`, 'abc');
    expect(mockFetch.mock.calls[0]![0]).toBe(`${LOGOUT_ENDPOINT}?locale=en&id_token_hint=abc`);
  });

  it('reports a failed answer or the network by code only', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 400 }));
    expect(await callLogoutEndpoint(LOGOUT_ENDPOINT, 'abc')).toEqual({
      ok: false,
      code: 'http_400',
    });
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await callLogoutEndpoint(LOGOUT_ENDPOINT, 'abc')).toEqual({
      ok: false,
      code: 'network',
    });
  });
});

describe('formEncode', () => {
  it('encodes every key and value', () => {
    expect(formEncode({ 'a b': 'c&d', e: 'é' })).toBe('a%20b=c%26d&e=%C3%A9');
  });
});
