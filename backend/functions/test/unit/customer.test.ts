import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CUSTOMER_IDENTITY_QUERY, verifyCustomerToken } from '../../src/identity/customer.ts';
import {
  FAKE_CUSTOMER_ID,
  FAKE_ENDPOINT,
  FAKE_TOKEN,
  customerReply,
  fakeFetch,
  jsonResponse,
  neverAnswers,
  type FakeReply,
} from '../helpers/fakes.ts';

async function verify(...replies: FakeReply[]) {
  const fake = fakeFetch(...replies);
  const result = await verifyCustomerToken(FAKE_TOKEN, {
    fetch: fake.fetch,
    endpoint: FAKE_ENDPOINT,
    timeoutMillis: 50,
  });
  return { result, calls: fake.calls };
}

describe('verifyCustomerToken', () => {
  it("returns the customer's ID from Shopify's answer", async () => {
    const { result } = await verify(customerReply());
    assert.deepEqual(result, { ok: true, customerId: FAKE_CUSTOMER_ID });
  });

  it('sends the named query with the token as Shopify documents it (no Bearer)', async () => {
    const { calls } = await verify(customerReply());
    assert.equal(calls.length, 1);
    const call = calls[0];
    assert.ok(call);
    assert.equal(call.url, FAKE_ENDPOINT);
    assert.equal(call.init.method, 'POST');
    assert.equal(call.init.redirect, 'error');
    const headers = call.init.headers as Record<string, string>;
    assert.equal(headers.Authorization, FAKE_TOKEN);
    assert.equal(headers['Content-Type'], 'application/json');
    assert.match(headers['User-Agent'] ?? '', /^JustBookifyIndiaBackend\//);
    assert.equal(typeof call.init.body, 'string');
    assert.deepEqual(JSON.parse(call.init.body as string), { query: CUSTOMER_IDENTITY_QUERY });
  });

  it('maps 401 to unauthenticated', async () => {
    const { result } = await verify(jsonResponse({}, 401));
    assert.deepEqual(result, { ok: false, code: 'unauthenticated' });
  });

  it('maps 429 and THROTTLED to shopify_busy', async () => {
    assert.deepEqual((await verify(jsonResponse({}, 429))).result, {
      ok: false,
      code: 'shopify_busy',
    });
    const throttled = jsonResponse({
      errors: [{ message: 'x', extensions: { code: 'THROTTLED' } }],
    });
    assert.deepEqual((await verify(throttled)).result, { ok: false, code: 'shopify_busy' });
  });

  it('maps 5xx, a network failure and a timeout to shopify_unavailable', async () => {
    for (const reply of [
      jsonResponse({}, 500),
      jsonResponse({}, 503),
      new TypeError('network'),
      neverAnswers(),
    ]) {
      assert.deepEqual((await verify(reply)).result, { ok: false, code: 'shopify_unavailable' });
    }
  });

  it('maps any other answer to shopify_unexpected', async () => {
    for (const reply of [
      jsonResponse({}, 403),
      jsonResponse({}, 302),
      new Response('not json', { status: 200 }),
      jsonResponse(null),
      jsonResponse({ errors: [{ message: 'Access denied' }] }),
      jsonResponse({ data: { customer: null } }),
      jsonResponse({ data: { customer: { id: 'gid://shopify/Order/1' } } }),
      jsonResponse({ data: { customer: { id: 7000000001 } } }),
      new Response(
        `{"data":{"customer":{"id":"${FAKE_CUSTOMER_ID}"}},"x":"${'a'.repeat(70_000)}"}`,
      ),
    ]) {
      assert.deepEqual((await verify(reply)).result, { ok: false, code: 'shopify_unexpected' });
    }
  });

  it('never puts the token or Shopify text in its result', async () => {
    const { result } = await verify(jsonResponse({ errors: [{ message: FAKE_TOKEN }] }));
    assert.doesNotMatch(JSON.stringify(result), new RegExp(FAKE_TOKEN));
  });
});
