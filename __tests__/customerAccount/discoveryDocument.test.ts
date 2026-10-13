import {
  hasCustomerAccountGraphqlApi,
  parseOpenIdConfiguration,
} from '@/customerAccount/discoveryDocument';

import { TEST_OPENID_CONFIGURATION, TEST_SHOP_ID } from '../helpers/customerAccount';

describe('parseOpenIdConfiguration (P7-01, D-120)', () => {
  it("takes Shopify's endpoints from the document", () => {
    expect(parseOpenIdConfiguration(TEST_OPENID_CONFIGURATION, TEST_SHOP_ID)).toEqual({
      ok: true,
      discovery: {
        issuer: TEST_OPENID_CONFIGURATION.issuer,
        authorizationEndpoint: TEST_OPENID_CONFIGURATION.authorization_endpoint,
        tokenEndpoint: TEST_OPENID_CONFIGURATION.token_endpoint,
        endSessionEndpoint: TEST_OPENID_CONFIGURATION.end_session_endpoint,
      },
    });
  });

  it("accepts endpoints on the store's own accounts domain", () => {
    const document = {
      ...TEST_OPENID_CONFIGURATION,
      token_endpoint: 'https://account.example.in/authentication/oauth/token?x=1',
    };
    expect(parseOpenIdConfiguration(document, TEST_SHOP_ID).ok).toBe(true);
  });

  it('accepts an issuer with one trailing slash', () => {
    const document = {
      ...TEST_OPENID_CONFIGURATION,
      issuer: `${TEST_OPENID_CONFIGURATION.issuer}/`,
    };
    expect(parseOpenIdConfiguration(document, TEST_SHOP_ID).ok).toBe(true);
  });

  it.each(['authorization_endpoint', 'token_endpoint', 'end_session_endpoint', 'issuer'] as const)(
    'refuses the document when %s is missing',
    (field) => {
      const { [field]: _removed, ...document } = TEST_OPENID_CONFIGURATION;
      expect(parseOpenIdConfiguration(document, TEST_SHOP_ID)).toEqual({
        ok: false,
        code: 'discovery_invalid',
      });
    },
  );

  it.each([
    ['http', 'http://shopify.com/authentication/987654321012/oauth/token'],
    ['a custom scheme', 'shop.987654321012.app://token'],
    ['whitespace', 'https://shopify.com/oauth/ token'],
    ['a number', 42],
  ])('refuses a token endpoint with %s', (_case, tokenEndpoint) => {
    const document = { ...TEST_OPENID_CONFIGURATION, token_endpoint: tokenEndpoint };
    expect(parseOpenIdConfiguration(document, TEST_SHOP_ID)).toEqual({
      ok: false,
      code: 'discovery_invalid',
    });
  });

  it.each([
    ['another shop', 'https://shopify.com/authentication/111111111111'],
    ['a longer ID that contains it', 'https://shopify.com/authentication/9876543210123'],
    ['no shop ID', 'https://shopify.com/authentication'],
  ])(
    'refuses an issuer naming %s, which catches a client ID and shop ID from different stores',
    (_case, issuer) => {
      const document = { ...TEST_OPENID_CONFIGURATION, issuer };
      expect(parseOpenIdConfiguration(document, TEST_SHOP_ID)).toEqual({
        ok: false,
        code: 'discovery_mismatch',
      });
    },
  );

  it.each([null, 'text', 42, []])('refuses a body that is not an object: %p', (body) => {
    expect(parseOpenIdConfiguration(body, TEST_SHOP_ID).ok).toBe(false);
  });
});

describe('hasCustomerAccountGraphqlApi', () => {
  it('needs an https GraphQL URL', () => {
    expect(
      hasCustomerAccountGraphqlApi({
        graphql_api: 'https://shopify.com/987654321012/account/customer/api/2026-10/graphql',
      }),
    ).toBe(true);
    expect(hasCustomerAccountGraphqlApi({ graphql_api: 'http://example.com/graphql' })).toBe(false);
    expect(hasCustomerAccountGraphqlApi({})).toBe(false);
    expect(hasCustomerAccountGraphqlApi(null)).toBe(false);
  });
});
