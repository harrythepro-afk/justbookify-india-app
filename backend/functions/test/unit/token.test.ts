import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseBearerToken } from '../../src/identity/token.ts';
import { FAKE_TOKEN } from '../helpers/fakes.ts';

describe('parseBearerToken', () => {
  it('reads one bearer token', () => {
    assert.equal(parseBearerToken(`Bearer ${FAKE_TOKEN}`), FAKE_TOKEN);
  });

  it('accepts the scheme in any case', () => {
    assert.equal(parseBearerToken(`bearer ${FAKE_TOKEN}`), FAKE_TOKEN);
  });

  it('refuses a missing or non-string header', () => {
    assert.equal(parseBearerToken(undefined), undefined);
    assert.equal(parseBearerToken([`Bearer ${FAKE_TOKEN}`]), undefined);
  });

  it('refuses another scheme or the bare token', () => {
    assert.equal(parseBearerToken(`Basic ${FAKE_TOKEN}`), undefined);
    assert.equal(parseBearerToken(FAKE_TOKEN), undefined);
  });

  it('refuses two tokens, spaces and control characters', () => {
    assert.equal(parseBearerToken(`Bearer ${FAKE_TOKEN} ${FAKE_TOKEN}`), undefined);
    assert.equal(parseBearerToken(`Bearer  ${FAKE_TOKEN}`), undefined);
    assert.equal(parseBearerToken(`Bearer ${FAKE_TOKEN}\n`), undefined);
    assert.equal(parseBearerToken(`Bearer ${FAKE_TOKEN}é`), undefined);
  });

  it('refuses a token shorter than 20 or longer than 4,096 characters', () => {
    assert.equal(parseBearerToken(`Bearer ${'a'.repeat(19)}`), undefined);
    assert.equal(parseBearerToken(`Bearer ${'a'.repeat(20)}`), 'a'.repeat(20));
    assert.equal(parseBearerToken(`Bearer ${'a'.repeat(4096)}`), 'a'.repeat(4096));
    assert.equal(parseBearerToken(`Bearer ${'a'.repeat(4097)}`), undefined);
  });
});
