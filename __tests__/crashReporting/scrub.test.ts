import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

import {
  FILTERED,
  scrubBreadcrumb,
  scrubEvent,
  scrubString,
  STORE,
  type SensitiveValues,
} from '@/crashReporting/scrub';

// Made-up values shaped like the real ones. None is a real credential or person. The
// token-shaped lines carry gitleaks:allow because the CI secret scan cannot tell them from
// real keys; that marker belongs only on fixtures like these.
const STORE_DOMAIN = 'example-dev-store.myshopify.com';
const STOREFRONT_TOKEN = '0123456789abcdef0123456789abcdef'; // gitleaks:allow
const SENSITIVE: SensitiveValues = { storeDomain: STORE_DOMAIN, storefrontToken: STOREFRONT_TOKEN };

const EMAIL = 'asha.reader@example.com';
const PHONE = '+91 98765 43210';
const SECRET_TOKEN = 'shpat_abcdef0123456789abcdef0123456789'; // gitleaks:allow
const TOKEN_LIKE = 'Zx81Kq0LmN3pR7sT2uV5wY9aB4cD6eF'; // gitleaks:allow
const URL_WITH_QUERY = `https://${STORE_DOMAIN}/api/2026-10/graphql.json?email=${EMAIL}&key=1`;

const LEAKS = [
  EMAIL,
  PHONE,
  '98765 43210',
  SECRET_TOKEN,
  TOKEN_LIKE,
  STORE_DOMAIN,
  STOREFRONT_TOKEN,
];

function expectNoLeaks(value: unknown) {
  const text = JSON.stringify(value);
  for (const leak of LEAKS) expect(text).not.toContain(leak);
  expect(text).not.toContain('?email=');
  expect(text).not.toContain('Asha');
}

const FRAMES = [
  {
    filename: 'app:///index.android.bundle',
    function: 'onPress',
    lineno: 1,
    colno: 4242,
    in_app: true,
    vars: { email: EMAIL, customer: { phone: PHONE } },
  },
];

function sampleEvent(): ErrorEvent {
  return {
    type: undefined,
    event_id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    message: `Checkout failed for ${EMAIL}, phone ${PHONE}`,
    environment: 'development',
    release: 'com.justbookify.india.dev@1.0.0+1',
    server_name: 'Asha-laptop',
    user: { id: '42', email: EMAIL, username: 'Asha', ip_address: '203.0.113.7' },
    request: {
      url: URL_WITH_QUERY,
      method: 'POST',
      headers: { 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN, Cookie: 'session=abc' },
      cookies: { session: 'abc' },
      data: { email: EMAIL, address: '12 MG Road, Bengaluru 560001' },
      query_string: { email: EMAIL },
    },
    exception: {
      values: [
        {
          type: 'Error',
          value: `Request to ${URL_WITH_QUERY} failed with ${SECRET_TOKEN} and Bearer ${TOKEN_LIKE}`,
          stacktrace: { frames: FRAMES },
        },
      ],
    },
    breadcrumbs: [
      { category: 'console', message: `customer ${EMAIL}`, data: { arguments: [EMAIL] } },
      {
        type: 'http',
        category: 'fetch',
        data: {
          method: 'POST',
          status_code: 500,
          url: URL_WITH_QUERY,
          request_body: { email: EMAIL },
          response_body: { phone: PHONE },
        },
      },
      { category: 'navigation', data: { from: '/cart', to: `/account?email=${EMAIL}` } },
    ],
    tags: { note: `cart ${TOKEN_LIKE}` },
    extra: { customerName: 'Asha', detail: `call ${PHONE}`, nested: { email: EMAIL } },
    contexts: {
      device: { name: "Asha's phone", model: 'Pixel 9', family: 'Pixel' },
      os: { name: 'Android', version: '16' },
      app: { app_name: 'JustBookify (Dev)', app_version: '1.0.0' },
      trace: { trace_id: 'fedcba9876543210fedcba9876543210', span_id: 'fedcba9876543210' },
      store: { domain: STORE_DOMAIN },
    },
  };
}

describe('scrubEvent', () => {
  it('removes the email, phone number, tokens, store domain and query strings', () => {
    expectNoLeaks(scrubEvent(sampleEvent(), SENSITIVE));
  });

  it('removes the user, server name, request headers, cookies, body and query', () => {
    const event = scrubEvent(sampleEvent(), SENSITIVE);

    expect(event.user).toBeUndefined();
    expect(event.server_name).toBeUndefined();
    expect(event.request).toEqual({
      method: 'POST',
      url: `https://${STORE}/api/2026-10/graphql.json`,
    });
  });

  it('removes the device name but keeps the model and OS', () => {
    const { contexts } = scrubEvent(sampleEvent(), SENSITIVE);

    expect(contexts?.device).toEqual({ model: 'Pixel 9', family: 'Pixel' });
    expect(contexts?.os).toEqual({ name: 'Android', version: '16' });
    expect(contexts?.app).toEqual({ app_name: 'JustBookify (Dev)', app_version: '1.0.0' });
  });

  it('keeps the trace context, whose IDs Sentry validates', () => {
    const { contexts } = scrubEvent(sampleEvent(), SENSITIVE);

    expect(contexts?.trace).toEqual(sampleEvent().contexts?.trace);
  });

  it('keeps stack frames intact apart from local variables', () => {
    const frame = scrubEvent(sampleEvent(), SENSITIVE).exception?.values?.[0]?.stacktrace
      ?.frames?.[0];

    expect(frame).toEqual({
      filename: 'app:///index.android.bundle',
      function: 'onPress',
      lineno: 1,
      colno: 4242,
      in_app: true,
    });
  });

  it('keeps the event ID, environment, release and error type', () => {
    const event = scrubEvent(sampleEvent(), SENSITIVE);

    expect(event.event_id).toBe('a1b2c3d4e5f60718293a4b5c6d7e8f90');
    expect(event.environment).toBe('development');
    expect(event.release).toBe('com.justbookify.india.dev@1.0.0+1');
    expect(event.exception?.values?.[0]?.type).toBe('Error');
  });

  it('drops extra keys that name personal data, whatever their value', () => {
    const { extra } = scrubEvent(sampleEvent(), SENSITIVE);

    expect(extra?.customerName).toBe(FILTERED);
    expect(extra?.nested).toEqual({ email: FILTERED });
    expect(extra?.detail).toBe(`call ${FILTERED}`);
  });

  it('drops console breadcrumbs and strips HTTP breadcrumbs to method, status and path', () => {
    const { breadcrumbs } = scrubEvent(sampleEvent(), SENSITIVE);

    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs?.[0]?.data).toEqual({
      method: 'POST',
      status_code: 500,
      url: `https://${STORE}/api/2026-10/graphql.json`,
    });
  });

  it('scrubs by pattern when the store is not configured', () => {
    const event = scrubEvent(sampleEvent(), {});
    const text = JSON.stringify(event);

    expect(text).not.toContain(EMAIL);
    expect(text).not.toContain(SECRET_TOKEN);
    expect(text).not.toContain(STORE_DOMAIN);
    expect(text).not.toContain(STOREFRONT_TOKEN);
  });
});

describe('scrubBreadcrumb', () => {
  it('drops console breadcrumbs', () => {
    expect(scrubBreadcrumb({ category: 'console', message: EMAIL }, SENSITIVE)).toBeNull();
  });

  it.each(['fetch', 'xhr'])('keeps only method, status and path for %s', (category) => {
    const breadcrumb: Breadcrumb = {
      category,
      data: { method: 'GET', status_code: 200, url: URL_WITH_QUERY, response_body: EMAIL },
    };

    expect(scrubBreadcrumb(breadcrumb, SENSITIVE)?.data).toEqual({
      method: 'GET',
      status_code: 200,
      url: `https://${STORE}/api/2026-10/graphql.json`,
    });
  });

  it('scrubs other breadcrumbs field by field', () => {
    const breadcrumb: Breadcrumb = {
      category: 'navigation',
      message: `opened by ${EMAIL}`,
      data: { from: '/cart', to: '/account?tab=orders', token: 'abc' },
    };

    expect(scrubBreadcrumb(breadcrumb, SENSITIVE)).toEqual({
      category: 'navigation',
      message: `opened by ${FILTERED}`,
      data: { from: '/cart', to: '/account', token: FILTERED },
    });
  });
});

describe('scrubString', () => {
  it.each([
    ['an email address', `mail ${EMAIL} now`, `mail ${FILTERED} now`],
    ['an Indian mobile with +91', 'call +919876543210', `call ${FILTERED}`],
    ['an Indian mobile with spaces', `call ${PHONE}.`, `call ${FILTERED}.`],
    ['a bare Indian mobile', 'call 9876543210', `call ${FILTERED}`],
    ['a landline', 'office 011-23456789', `office ${FILTERED}`],
    ['an international number', 'call +1 (415) 555-0100', `call ${FILTERED}`],
    ['a Shopify secret token', `key ${SECRET_TOKEN}`, `key ${FILTERED}`],
    ['a bearer token', 'Authorization: Bearer abc.def-ghi', `Authorization: Bearer ${FILTERED}`],
    ['a JWT', 'jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln', `jwt ${FILTERED}`],
    ['a long token-like run', `cart ${TOKEN_LIKE}`, `cart ${FILTERED}`],
    ['a customer GID', 'gid://shopify/Customer/7612', `gid://shopify/Customer/${FILTERED}`],
    // P8-01: a cart's ID holds Shopify's secret key for the cart; a line's ID the cart's token.
    [
      'a cart ID',
      'cart gid://shopify/Cart/test-cart?key=test-key',
      `cart gid://shopify/Cart/${FILTERED}`,
    ],
    [
      'a cart line ID',
      'line gid://shopify/CartLine/line-1?cart=test-cart',
      `line gid://shopify/CartLine/${FILTERED}`,
    ],
    ['a myshopify host', 'other-shop.myshopify.com down', `${STORE} down`],
    ['a URL query string', 'https://example.com/a/b?x=1#frag end', 'https://example.com/a/b end'],
    ['an app path query string', 'opened /account?tab=orders', 'opened /account'],
  ])('removes %s', (_label, input, expected) => {
    expect(scrubString(input, {})).toBe(expected);
  });

  it('removes the configured store domain and storefront token by value', () => {
    expect(scrubString(`${STORE_DOMAIN.toUpperCase()} ${STOREFRONT_TOKEN}`, SENSITIVE)).toBe(
      `${STORE} ${FILTERED}`,
    );
  });

  it.each([
    ['a timestamp', 'at 1791056087963 ms'],
    ['a product GID', 'gid://shopify/Product/123'],
    ['a UUID', 'session 0b7d6c2e-4f1a-4c3b-9e8d-7a6b5c4d3e2f'],
    ['a short number', 'index 12345 of 67890'],
    ['a path', 'https://example.com/products/harry-potter-1'],
  ])('leaves %s alone', (_label, input) => {
    expect(scrubString(input, {})).toBe(input);
  });
});

describe('the customer login (P7-01, D-121)', () => {
  const SHOP_ID = '987654321012';
  const ACCESS_TOKEN = 'shcat_Zx81Kq0LmN3pR7sT2uV5wY9a'; // gitleaks:allow
  // Opaque, with no shape the patterns know: only removal by value catches it.
  const OPAQUE_TOKEN = 'opaque-refresh-value-for-tests';
  const ID_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJlbWFpbCI6ImFAYi5jIn0.c2lnbmF0dXJl'; // gitleaks:allow
  const LOGIN: SensitiveValues = {
    ...SENSITIVE,
    shopId: SHOP_ID,
    customerTokens: [ACCESS_TOKEN, OPAQUE_TOKEN, ID_TOKEN],
  };

  it.each([
    ['a customer access token', `token ${ACCESS_TOKEN} sent`, `token ${FILTERED} sent`],
    ['another shc… token', 'refresh shcrt_abc-def_123 sent', `refresh ${FILTERED} sent`],
    ['an ID token', `id ${ID_TOKEN}`, `id ${FILTERED}`],
    [
      'the login callback with its code',
      `opened shop.${SHOP_ID}.app://callback?code=abc123&state=xyz`,
      `opened ${FILTERED}`,
    ],
    [
      "another app scheme's query",
      'opened com.justbookify.india.dev://account?code=abc#x end',
      'opened com.justbookify.india.dev://account end',
    ],
  ])('removes %s by pattern', (_label, input, expected) => {
    expect(scrubString(input, {})).toBe(expected);
  });

  it('removes the tokens held in memory by value, whatever their shape', () => {
    expect(scrubString(`a ${OPAQUE_TOKEN} b`, LOGIN)).toBe(`a ${FILTERED} b`);
    expect(scrubString(`hint=${OPAQUE_TOKEN}`, LOGIN)).not.toContain(OPAQUE_TOKEN);
  });

  it('ignores a token value shorter than 8 characters, so it cannot blank ordinary words', () => {
    expect(scrubString('a short word', { customerTokens: ['short'] })).toBe('a short word');
  });

  it('removes the shop ID as a whole number only', () => {
    expect(scrubString(`shop ${SHOP_ID} failed`, LOGIN)).toBe(`shop ${STORE} failed`);
    expect(scrubString(`id 1${SHOP_ID}5`, LOGIN)).toBe(`id 1${SHOP_ID}5`);
  });

  it("drops the login's own values by key name", () => {
    const breadcrumb = scrubBreadcrumb(
      {
        category: 'auth',
        data: {
          nonce: 'n',
          code_verifier: 'v',
          code_challenge: 'c',
          code: 'abc',
          state: 's',
          id_token_hint: 'h',
          refresh_token: 'r',
          access_token: 'a',
          status: 'kept',
        },
      },
      LOGIN,
    );
    expect(breadcrumb?.data).toEqual({
      nonce: FILTERED,
      code_verifier: FILTERED,
      code_challenge: FILTERED,
      code: FILTERED,
      state: FILTERED,
      id_token_hint: FILTERED,
      refresh_token: FILTERED,
      access_token: FILTERED,
      status: 'kept',
    });
  });

  it('removes every login value from a whole event', () => {
    const event = scrubEvent(
      {
        type: undefined,
        message: `refresh failed for ${OPAQUE_TOKEN} at shop.${SHOP_ID}.app://callback?code=1`,
        extra: { detail: `Bearer ${ACCESS_TOKEN}` },
        breadcrumbs: [
          {
            type: 'http',
            category: 'fetch',
            data: {
              method: 'GET',
              status_code: 200,
              url: `https://shopify.com/authentication/${SHOP_ID}/logout?id_token_hint=${ID_TOKEN}`,
            },
          },
        ],
      },
      LOGIN,
    );
    const text = JSON.stringify(event);
    for (const value of [OPAQUE_TOKEN, ACCESS_TOKEN, ID_TOKEN, SHOP_ID, 'code=1']) {
      expect(text).not.toContain(value);
    }
  });
});
