import {
  callbackSchemeFor,
  CUSTOMER_ACCOUNT_SCOPES,
  CustomerAccountConfigError,
  parseCustomerAccountConfig,
  SHOP_ID_PATTERN,
  type RawCustomerAccountEnv,
} from '@/config/customerAccount';

// Invented values in the shapes Shopify uses: a UUID-like client ID and a numeric shop ID.
const VALID: RawCustomerAccountEnv = {
  EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  EXPO_PUBLIC_SHOP_ID: '987654321012',
};

function errorOf(env: RawCustomerAccountEnv): CustomerAccountConfigError {
  try {
    parseCustomerAccountConfig(env);
  } catch (error) {
    if (error instanceof CustomerAccountConfigError) return error;
    throw error;
  }
  throw new Error('expected a CustomerAccountConfigError');
}

describe('parseCustomerAccountConfig (P7-01, D-120)', () => {
  it('derives the callback scheme, redirect URI and scopes from the shop ID', () => {
    expect(parseCustomerAccountConfig(VALID)).toEqual({
      clientId: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
      shopId: '987654321012',
      callbackScheme: 'shop.987654321012.app',
      redirectUri: 'shop.987654321012.app://callback',
      scopes: ['openid', 'email', 'customer-account-api:full'],
    });
    expect(CUSTOMER_ACCOUNT_SCOPES).toEqual(['openid', 'email', 'customer-account-api:full']);
  });

  it('trims surrounding spaces', () => {
    const config = parseCustomerAccountConfig({
      EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID: '  shp_0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d ',
      EXPO_PUBLIC_SHOP_ID: ' 12345 ',
    });
    expect(config.clientId).toBe('shp_0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d');
    expect(config.redirectUri).toBe('shop.12345.app://callback');
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['with a space inside', 'abc def ghi jkl'],
    ['too short', 'abc1234'],
    ['with other characters', 'abc!def#ghi$jkl'],
    ['a Shopify admin token', 'shpat_test0000000000'],
    ['a Shopify shared secret', 'shpss_test0000000000'],
  ])('refuses a client ID that is %s, naming the variable only', (_case, value) => {
    const error = errorOf({ ...VALID, EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID: value });
    expect(error.invalid).toEqual(['EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID']);
    expect(error.message).toBe(
      'Missing or invalid login configuration: EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID.',
    );
    if (value !== undefined && value !== '') expect(error.message).not.toContain(value);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['not digits', 'shop123'],
    ['a scheme instead of an ID', 'shop.123.app'],
    ['negative', '-123'],
    ['too long', '123456789012345678901'],
  ])('refuses a shop ID that is %s, naming the variable only', (_case, value) => {
    const error = errorOf({ ...VALID, EXPO_PUBLIC_SHOP_ID: value });
    expect(error.invalid).toEqual(['EXPO_PUBLIC_SHOP_ID']);
    if (value !== undefined && value !== '') expect(error.message).not.toContain(value);
  });

  it('names both variables when both are missing', () => {
    expect(
      errorOf({ EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID: undefined, EXPO_PUBLIC_SHOP_ID: undefined })
        .invalid,
    ).toEqual(['EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID', 'EXPO_PUBLIC_SHOP_ID']);
  });

  it('makes the scheme Shopify requires for mobile clients, shop.<shop ID>.*', () => {
    expect(callbackSchemeFor('42')).toBe('shop.42.app');
    expect(SHOP_ID_PATTERN.test('42')).toBe(true);
  });
});
