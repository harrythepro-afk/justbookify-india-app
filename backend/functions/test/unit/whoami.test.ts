import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { BackendConfig, BackendEnvironment } from '../../src/config/backendConfig.ts';
import { createIdentityCheck } from '../../src/identity/check.ts';
import { functionsLog, type Log, type LogEntry } from '../../src/log.ts';
import { handleWhoAmI, type WhoAmIDependencies } from '../../src/whoami.ts';
import {
  FAKE_CUSTOMER_ID,
  FAKE_SHOP_ID,
  FAKE_STORE_DOMAIN,
  FAKE_TOKEN,
  FakeResponse,
  captureOutput,
  customerReply,
  discoveryReply,
  fakeFetch,
  fakeRequest,
  jsonResponse,
  type FakeReply,
} from '../helpers/fakes.ts';

const AUTHORIZATION = { authorization: `Bearer ${FAKE_TOKEN}` };

function config(environment: BackendEnvironment = 'development'): BackendConfig {
  return { storeDomain: FAKE_STORE_DOMAIN, shopId: FAKE_SHOP_ID, environment };
}

function setUp(
  options: { config?: BackendConfig | undefined; replies?: FakeReply[]; log?: Log } = {},
) {
  const fake = fakeFetch(...(options.replies ?? []));
  const entries: LogEntry[] = [];
  const chosen = 'config' in options ? options.config : config();
  const dependencies: WhoAmIDependencies = {
    config: chosen,
    identityCheck:
      chosen === undefined
        ? undefined
        : createIdentityCheck({
            fetch: fake.fetch,
            storeDomain: chosen.storeDomain,
            shopId: chosen.shopId,
          }),
    log: options.log ?? { write: (entry) => entries.push(entry) },
    now: (() => {
      let tick = 0;
      return () => (tick += 7);
    })(),
  };
  return { dependencies, calls: fake.calls, entries };
}

describe('GET /whoami', () => {
  it('answers {"status":"ok"} for a token Shopify accepts, and nothing about the customer', async () => {
    const { dependencies, calls, entries } = setUp({
      replies: [discoveryReply(), customerReply()],
    });
    const response = new FakeResponse();
    await handleWhoAmI(fakeRequest({ headers: AUTHORIZATION }), response, dependencies);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { status: 'ok' });
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.equal(response.sends, 1);
    assert.doesNotMatch(JSON.stringify(response.body), /Customer|7000000001/);
    assert.equal(calls.length, 2);
    assert.deepEqual(entries, [{ event: 'whoami', outcome: 'ok', millis: 7 }]);
  });

  it('answers 401 unauthenticated without calling Shopify when the token is missing or malformed', async () => {
    for (const headers of [{}, { authorization: FAKE_TOKEN }, { authorization: 'Bearer short' }]) {
      const { dependencies, calls, entries } = setUp();
      const response = new FakeResponse();
      await handleWhoAmI(fakeRequest({ headers }), response, dependencies);
      assert.equal(response.statusCode, 401);
      assert.deepEqual(response.body, { error: 'unauthenticated' });
      assert.equal(calls.length, 0);
      assert.equal(entries[0]?.outcome, 'unauthenticated');
    }
  });

  it('answers 401 when Shopify refuses the token', async () => {
    const { dependencies } = setUp({ replies: [discoveryReply(), jsonResponse({}, 401)] });
    const response = new FakeResponse();
    await handleWhoAmI(fakeRequest({ headers: AUTHORIZATION }), response, dependencies);
    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { error: 'unauthenticated' });
  });

  it("passes Shopify's failures on as fixed codes", async () => {
    const cases: [FakeReply, number, string][] = [
      [jsonResponse({}, 429), 503, 'shopify_busy'],
      [jsonResponse({}, 500), 503, 'shopify_unavailable'],
      [jsonResponse({ errors: [{ message: 'x' }] }), 502, 'shopify_unexpected'],
    ];
    for (const [reply, status, code] of cases) {
      const { dependencies } = setUp({ replies: [discoveryReply(), reply] });
      const response = new FakeResponse();
      await handleWhoAmI(fakeRequest({ headers: AUTHORIZATION }), response, dependencies);
      assert.equal(response.statusCode, status, code);
      assert.deepEqual(response.body, { error: code });
    }
  });

  it('refuses another method with 405 and a body with 413, before any Shopify call', async () => {
    const post = setUp();
    const postResponse = new FakeResponse();
    await handleWhoAmI(
      fakeRequest({ method: 'POST', headers: AUTHORIZATION }),
      postResponse,
      post.dependencies,
    );
    assert.equal(postResponse.statusCode, 405);
    assert.equal(postResponse.headers.Allow, 'GET');
    assert.equal(post.calls.length, 0);

    const body = setUp();
    const bodyResponse = new FakeResponse();
    await handleWhoAmI(
      fakeRequest({
        headers: { ...AUTHORIZATION, 'content-length': '2' },
        rawBody: Buffer.from('{}'),
      }),
      bodyResponse,
      body.dependencies,
    );
    assert.equal(bodyResponse.statusCode, 413);
    assert.deepEqual(bodyResponse.body, { error: 'payload_too_large' });
    assert.equal(body.calls.length, 0);
  });

  it('answers 404 not_found outside development, before reading anything (development only)', async () => {
    for (const environment of ['staging', 'production'] as const) {
      const { dependencies, calls } = setUp({ config: config(environment) });
      const response = new FakeResponse();
      await handleWhoAmI(fakeRequest({ headers: AUTHORIZATION }), response, dependencies);
      assert.equal(response.statusCode, 404);
      assert.deepEqual(response.body, { error: 'not_found' });
      assert.equal(calls.length, 0);
    }
  });

  it('answers 503 not_configured without a valid configuration', async () => {
    const { dependencies } = setUp({ config: undefined });
    const response = new FakeResponse();
    await handleWhoAmI(fakeRequest({ headers: AUTHORIZATION }), response, dependencies);
    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.body, { error: 'not_configured' });
  });

  it('answers 500 internal if something throws, with no detail', async () => {
    const { dependencies, entries } = setUp();
    const throwing: WhoAmIDependencies = {
      ...dependencies,
      identityCheck: () => Promise.reject(new Error(`boom ${FAKE_TOKEN}`)),
    };
    const response = new FakeResponse();
    await handleWhoAmI(fakeRequest({ headers: AUTHORIZATION }), response, throwing);
    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, { error: 'internal' });
    assert.equal(entries[0]?.outcome, 'internal');
  });

  it('never writes the token, the customer ID, the store, the shop ID or a header to any output', async () => {
    const markers = [
      FAKE_TOKEN,
      FAKE_CUSTOMER_ID,
      '7000000001',
      FAKE_STORE_DOMAIN,
      FAKE_SHOP_ID,
      'Bearer',
    ];
    const runs: { replies: FakeReply[]; headers: Record<string, string>; method?: string }[] = [
      { replies: [discoveryReply(), customerReply()], headers: AUTHORIZATION },
      { replies: [discoveryReply(), jsonResponse({}, 401)], headers: AUTHORIZATION },
      {
        replies: [discoveryReply(), jsonResponse({ errors: [{ message: FAKE_TOKEN }] })],
        headers: AUTHORIZATION,
      },
      {
        replies: [discoveryReply(), new TypeError(`fetch failed ${FAKE_STORE_DOMAIN}`)],
        headers: AUTHORIZATION,
      },
      { replies: [new TypeError(`getaddrinfo ${FAKE_STORE_DOMAIN}`)], headers: AUTHORIZATION },
      { replies: [], headers: { authorization: FAKE_TOKEN } },
      { replies: [], headers: AUTHORIZATION, method: 'POST' },
    ];
    const output = await captureOutput(async () => {
      for (const run of runs) {
        // The real logger, so what Cloud Logging would receive is what is checked.
        const { dependencies } = setUp({ replies: run.replies, log: functionsLog });
        await handleWhoAmI(
          fakeRequest({
            method: run.method ?? 'GET',
            headers: { ...run.headers, 'x-forwarded-for': '203.0.113.9' },
          }),
          new FakeResponse(),
          dependencies,
        );
      }
    });
    assert.match(output, /whoami/, 'the logger wrote nothing, so the check proves nothing');
    for (const marker of [...markers, '203.0.113.9']) {
      assert.equal(output.includes(marker), false, `output contains ${marker}`);
    }
  });
});
