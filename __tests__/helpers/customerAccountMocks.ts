/**
 * Shared stand-ins for the session tests (P7-01): Shopify's endpoints answered by a fake `fetch`,
 * and the browser returning to the app. Used with the `jest.mock` calls in each test file.
 */
import {
  makeIdToken,
  TEST_OPENID_CONFIGURATION,
  TEST_REDIRECT_URI,
  TEST_STORE_DOMAIN,
  validClaims,
} from './customerAccount';

export type FetchCall = { readonly url: string; readonly init: RequestInit };

export type TokenAnswer = { readonly status: number; readonly body: unknown } | 'network';

export class FakeShopify {
  readonly calls: FetchCall[] = [];
  /** The next token endpoint answers, in order; the last one repeats. */
  tokenAnswers: TokenAnswer[] = [];
  discovery: unknown = TEST_OPENID_CONFIGURATION;
  logoutAnswer: TokenAnswer = { status: 200, body: {} };
  /** Lets a test hold the token endpoint's answer until it calls `release`. */
  holdToken = false;
  private held: (() => void)[] = [];

  readonly fetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
    this.calls.push({ url, init });
    if (url === `https://${TEST_STORE_DOMAIN}/.well-known/openid-configuration`) {
      return json(200, this.discovery);
    }
    if (url === TEST_OPENID_CONFIGURATION.token_endpoint) {
      if (this.holdToken) await new Promise<void>((resolve) => this.held.push(resolve));
      const answer =
        this.tokenAnswers.length > 1 ? this.tokenAnswers.shift()! : this.tokenAnswers[0];
      return answerWith(answer ?? { status: 500, body: {} });
    }
    if (url.startsWith(TEST_OPENID_CONFIGURATION.end_session_endpoint)) {
      return answerWith(this.logoutAnswer);
    }
    throw new Error(`unexpected fetch in a test: ${url}`);
  };

  release(): void {
    this.holdToken = false;
    for (const resolve of this.held.splice(0)) resolve();
  }

  tokenCalls(): FetchCall[] {
    return this.calls.filter((call) => call.url === TEST_OPENID_CONFIGURATION.token_endpoint);
  }

  logoutCalls(): FetchCall[] {
    return this.calls.filter((call) =>
      call.url.startsWith(TEST_OPENID_CONFIGURATION.end_session_endpoint),
    );
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function answerWith(answer: TokenAnswer): Response {
  if (answer === 'network') throw new TypeError('Network request failed');
  return json(answer.status, answer.body);
}

/** The form body of a token request, as an object. */
export function formOf(call: FetchCall): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(String(call.init.body)));
}

/** The query of the authorization URL the browser was asked to open. */
export function authorizationParams(url: string): Record<string, string> {
  return Object.fromEntries(new URL(url).searchParams);
}

/** Shopify's answer to the code exchange, with an ID token carrying `nonce`. */
export function exchangeAnswer(
  nonce: string,
  overrides: Record<string, unknown> = {},
  claims: Record<string, unknown> = {},
): TokenAnswer {
  return {
    status: 200,
    body: {
      access_token: 'shcat_test-access-token-0001',
      expires_in: 3600,
      refresh_token: 'shcrt_test-refresh-token-0001',
      id_token: makeIdToken(validClaims(nonce, claims)),
      ...overrides,
    },
  };
}

export function callbackUrl(params: Record<string, string>): string {
  return `${TEST_REDIRECT_URI}?${new URLSearchParams(params).toString()}`;
}
