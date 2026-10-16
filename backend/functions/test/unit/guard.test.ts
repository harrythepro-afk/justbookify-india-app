import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_MAX_BODY_BYTES, guardRequest, sendError } from '../../src/http/guard.ts';
import { FakeResponse, fakeRequest } from '../helpers/fakes.ts';

const GET_ONLY = { methods: ['GET'], maxBodyBytes: 0 } as const;

describe('guardRequest', () => {
  it('passes an allowed method with no body', () => {
    assert.equal(guardRequest(fakeRequest(), GET_ONLY), undefined);
  });

  it('refuses another method', () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']) {
      assert.equal(guardRequest(fakeRequest({ method }), GET_ONLY), 'method_not_allowed', method);
    }
  });

  it('refuses a declared body over the limit, or a malformed length', () => {
    for (const length of ['1', '-1', '1.5', 'abc', '99999999999999999999']) {
      assert.equal(
        guardRequest(fakeRequest({ headers: { 'content-length': length } }), GET_ONLY),
        'payload_too_large',
        length,
      );
    }
    assert.equal(
      guardRequest(fakeRequest({ headers: { 'content-length': '0' } }), GET_ONLY),
      undefined,
    );
  });

  it('refuses a body over the limit even without a declared length', () => {
    assert.equal(
      guardRequest(fakeRequest({ rawBody: Buffer.from('x') }), GET_ONLY),
      'payload_too_large',
    );
  });

  it('applies a per-endpoint limit, 16 KB by default for JSON bodies', () => {
    const post = { methods: ['POST'], maxBodyBytes: DEFAULT_MAX_BODY_BYTES };
    const atLimit = Buffer.alloc(DEFAULT_MAX_BODY_BYTES);
    const overLimit = Buffer.alloc(DEFAULT_MAX_BODY_BYTES + 1);
    assert.equal(guardRequest(fakeRequest({ method: 'POST', rawBody: atLimit }), post), undefined);
    assert.equal(
      guardRequest(fakeRequest({ method: 'POST', rawBody: overLimit }), post),
      'payload_too_large',
    );
  });
});

describe('sendError', () => {
  it('sends the fixed code with its status and no-store', () => {
    const response = new FakeResponse();
    sendError(response, 'unauthenticated');
    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { error: 'unauthenticated' });
    assert.equal(response.headers['Cache-Control'], 'no-store');
  });

  it('names the allowed methods on a 405', () => {
    const response = new FakeResponse();
    sendError(response, 'method_not_allowed', ['GET']);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'GET');
  });
});
