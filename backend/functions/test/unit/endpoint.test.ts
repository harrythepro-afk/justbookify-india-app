import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createEndpointResolver,
  graphqlEndpointFromDiscovery,
} from '../../src/identity/endpoint.ts';
import {
  FAKE_DISCOVERED_URL,
  FAKE_ENDPOINT,
  FAKE_SHOP_ID,
  FAKE_STORE_DOMAIN,
  discoveryReply,
  fakeFetch,
  jsonResponse,
  neverAnswers,
  type FakeReply,
} from '../helpers/fakes.ts';

describe('graphqlEndpointFromDiscovery', () => {
  const read = (graphqlApi: unknown) =>
    graphqlEndpointFromDiscovery({ graphql_api: graphqlApi }, '2026-04', FAKE_SHOP_ID);

  it("keeps Shopify's URL up to /customer/api/ and pins the version", () => {
    assert.equal(read(FAKE_DISCOVERED_URL), FAKE_ENDPOINT);
    assert.equal(
      read('https://example-store.example/customer/api/2026-10/graphql'),
      'https://example-store.example/customer/api/2026-04/graphql',
    );
  });

  it("refuses http, another shape, or another shop's ID", () => {
    assert.equal(read(FAKE_DISCOVERED_URL.replace('https:', 'http:')), undefined);
    assert.equal(read('https://accounts.example/graphql'), undefined);
    assert.equal(
      read('https://accounts.example/2000000002/account/customer/api/2026-10/graphql'),
      undefined,
    );
    assert.equal(read(42), undefined);
    assert.equal(graphqlEndpointFromDiscovery(null, '2026-04', FAKE_SHOP_ID), undefined);
  });
});

function resolver(...replies: FakeReply[]) {
  const fake = fakeFetch(...replies);
  const resolve = createEndpointResolver({
    fetch: fake.fetch,
    storeDomain: FAKE_STORE_DOMAIN,
    shopId: FAKE_SHOP_ID,
    version: '2026-04',
    timeoutMillis: 50,
  });
  return { resolve, calls: fake.calls };
}

describe('createEndpointResolver', () => {
  it("reads the store's discovery document once and keeps the endpoint", async () => {
    const { resolve, calls } = resolver(discoveryReply());
    assert.deepEqual(await resolve(), { ok: true, endpoint: FAKE_ENDPOINT });
    assert.deepEqual(await resolve(), { ok: true, endpoint: FAKE_ENDPOINT });
    assert.equal(calls.length, 1);
    const [call] = calls;
    assert.ok(call);
    assert.equal(call.url, `https://${FAKE_STORE_DOMAIN}/.well-known/customer-account-api`);
    assert.equal(call.init.method, 'GET');
  });

  it('shares one read between requests that arrive together', async () => {
    const { resolve, calls } = resolver(discoveryReply());
    const results = await Promise.all([resolve(), resolve()]);
    assert.equal(calls.length, 1);
    assert.deepEqual(results[0], results[1]);
  });

  it('does not keep a failed read, so the next request tries again', async () => {
    const { resolve, calls } = resolver(new TypeError('network'), discoveryReply());
    assert.deepEqual(await resolve(), { ok: false, code: 'shopify_unavailable' });
    assert.deepEqual(await resolve(), { ok: true, endpoint: FAKE_ENDPOINT });
    assert.equal(calls.length, 2);
  });

  it('maps a timeout and a server error to shopify_unavailable', async () => {
    assert.deepEqual(await resolver(neverAnswers()).resolve(), {
      ok: false,
      code: 'shopify_unavailable',
    });
    assert.deepEqual(await resolver(jsonResponse({}, 503)).resolve(), {
      ok: false,
      code: 'shopify_unavailable',
    });
  });

  it('maps another status, bad JSON or a refused URL to shopify_unexpected', async () => {
    for (const reply of [
      jsonResponse({}, 404),
      new Response('not json', { status: 200 }),
      jsonResponse({ graphql_api: 'http://accounts.example/customer/api/2026-10/graphql' }),
    ]) {
      assert.deepEqual(await resolver(reply).resolve(), { ok: false, code: 'shopify_unexpected' });
    }
  });
});
