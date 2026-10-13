import {
  checkIdToken,
  decodeIdTokenClaims,
  MAX_CLOCK_SKEW_SECONDS,
} from '@/customerAccount/idToken';

import {
  makeIdToken,
  nowSeconds,
  TEST_CLIENT_ID,
  TEST_ISSUER,
  validClaims,
} from '../helpers/customerAccount';

const NONCE = 'nonce-from-the-login';

function expectation(overrides: Partial<Parameters<typeof checkIdToken>[1]> = {}) {
  return {
    issuer: TEST_ISSUER,
    clientId: TEST_CLIENT_ID,
    nonce: NONCE,
    nonceRequired: true,
    now: nowSeconds(),
    ...overrides,
  };
}

describe('checkIdToken (P7-01, D-121)', () => {
  it('accepts a token with the sent nonce, the issuer, the client ID and a future expiry', () => {
    const result = checkIdToken(makeIdToken(validClaims(NONCE)), expectation());
    expect(result.ok).toBe(true);
    expect(result.ok && result.claims.email).toBe('reader@example.com');
  });

  it('accepts an audience list that contains the client ID', () => {
    const token = makeIdToken(validClaims(NONCE, { aud: ['other-client', TEST_CLIENT_ID] }));
    expect(checkIdToken(token, expectation()).ok).toBe(true);
  });

  it('refuses a wrong nonce', () => {
    const token = makeIdToken(validClaims('a-different-nonce'));
    expect(checkIdToken(token, expectation())).toEqual({ ok: false, code: 'nonce_mismatch' });
  });

  it('refuses a token with no nonce at login', () => {
    const { nonce: _nonce, ...claims } = validClaims(NONCE);
    expect(checkIdToken(makeIdToken(claims), expectation())).toEqual({
      ok: false,
      code: 'nonce_mismatch',
    });
  });

  it('after a refresh, accepts a token with no nonce but still refuses a wrong one', () => {
    const { nonce: _nonce, ...claims } = validClaims(NONCE);
    expect(checkIdToken(makeIdToken(claims), expectation({ nonceRequired: false })).ok).toBe(true);
    expect(
      checkIdToken(makeIdToken(validClaims('other')), expectation({ nonceRequired: false })),
    ).toEqual({ ok: false, code: 'nonce_mismatch' });
  });

  it('refuses another issuer', () => {
    const token = makeIdToken(
      validClaims(NONCE, { iss: 'https://shopify.com/authentication/111111111111' }),
    );
    expect(checkIdToken(token, expectation())).toEqual({ ok: false, code: 'issuer_mismatch' });
  });

  it('refuses another audience', () => {
    const token = makeIdToken(validClaims(NONCE, { aud: 'another-client-id' }));
    expect(checkIdToken(token, expectation())).toEqual({ ok: false, code: 'audience_mismatch' });
  });

  it('refuses an expired token', () => {
    const token = makeIdToken(validClaims(NONCE, { exp: nowSeconds() - 1 }));
    expect(checkIdToken(token, expectation())).toEqual({ ok: false, code: 'id_token_expired' });
  });

  it('refuses a token issued more than 5 minutes in the future, and allows less', () => {
    const now = nowSeconds();
    const far = makeIdToken(validClaims(NONCE, { iat: now + MAX_CLOCK_SKEW_SECONDS + 1 }));
    const near = makeIdToken(validClaims(NONCE, { iat: now + MAX_CLOCK_SKEW_SECONDS }));
    expect(checkIdToken(far, expectation({ now }))).toEqual({
      ok: false,
      code: 'id_token_from_future',
    });
    expect(checkIdToken(near, expectation({ now })).ok).toBe(true);
  });

  it.each([
    ['not a JWT', 'not-a-token'],
    ['two parts', 'aaa.bbb'],
    ['a payload that is not base64url JSON', 'aaa.!!!.ccc'],
    ['a payload that is not an object', `aaa.${Buffer.from('"text"').toString('base64url')}.ccc`],
    ['claims of the wrong type', makeIdToken({ ...validClaims(NONCE), exp: 'soon' })],
  ])('refuses a malformed token: %s', (_case, token) => {
    expect(checkIdToken(token, expectation())).toEqual({ ok: false, code: 'id_token_malformed' });
  });
});

describe('decodeIdTokenClaims', () => {
  it('reads a non-ASCII email', () => {
    const claims = decodeIdTokenClaims(
      makeIdToken(validClaims(NONCE, { email: 'ānanda@example.com' })),
    );
    expect(claims?.email).toBe('ānanda@example.com');
  });

  it('leaves out an email claim that is not an email', () => {
    const claims = decodeIdTokenClaims(makeIdToken(validClaims(NONCE, { email: 'not an email' })));
    expect(claims).toBeDefined();
    expect(claims?.email).toBeUndefined();
  });
});
