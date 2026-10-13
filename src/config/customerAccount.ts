/**
 * Login with the store's own customer account (Customer Account API; D-005, D-120). Both values
 * come from EXPO_PUBLIC_ variables, so the Bahrain app brings its own shop ID and client ID with
 * no code change. Neither is secret: a public client has a client ID and no client secret.
 *
 * Kept apart from `getStoreConfig()`, so a build without login values still shows the catalogue.
 * Static `process.env.NAME` reads, for the reason given in `store.ts`.
 */

export type CustomerAccountConfig = {
  /** The public client ID of the store's Headless channel, mobile client type. */
  readonly clientId: string;
  /** The shop's numeric ID, which names the callback scheme Shopify requires for mobile apps. */
  readonly shopId: string;
  /** `shop.<shopId>.app`, also registered in `app.config.ts`. */
  readonly callbackScheme: string;
  /** `shop.<shopId>.app://callback`, added as a Callback URI in the Headless channel. */
  readonly redirectUri: string;
  readonly scopes: readonly string[];
};

export const CUSTOMER_ACCOUNT_ENV_NAMES = [
  'EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID',
  'EXPO_PUBLIC_SHOP_ID',
] as const;

export type CustomerAccountEnvName = (typeof CUSTOMER_ACCOUNT_ENV_NAMES)[number];

export type RawCustomerAccountEnv = Readonly<Record<CustomerAccountEnvName, string | undefined>>;

/** Shopify's customer account scopes for login and the customer's own data (`SHOPIFY_INTEGRATION.md`). */
export const CUSTOMER_ACCOUNT_SCOPES = ['openid', 'email', 'customer-account-api:full'] as const;

/** Carries variable names only. Values are never echoed, so a bad value cannot leak. */
export class CustomerAccountConfigError extends Error {
  readonly invalid: readonly CustomerAccountEnvName[];

  constructor(invalid: readonly CustomerAccountEnvName[]) {
    super(`Missing or invalid login configuration: ${invalid.join(', ')}.`);
    this.name = 'CustomerAccountConfigError';
    this.invalid = invalid;
  }
}

// The same rule is repeated in app.config.ts, which cannot import this file; a test keeps the
// two in step.
export const SHOP_ID_PATTERN = /^\d{1,20}$/;
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
// Shopify's secret tokens carry a prefix such as shpat_ or shpss_ (see store.ts). A client ID
// never does, so one that looks like a secret is refused rather than bundled.
const SECRET_TOKEN_PREFIX = /^shp[a-z]{2}_/i;

/** `shop.<id>.app`: Shopify requires `shop.{shop_id}.*` for mobile clients; `.app` is its default. */
export function callbackSchemeFor(shopId: string): string {
  return `shop.${shopId}.app`;
}

export function parseCustomerAccountConfig(env: RawCustomerAccountEnv): CustomerAccountConfig {
  const clientId = env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID?.trim();
  const shopId = env.EXPO_PUBLIC_SHOP_ID?.trim();

  const invalid: CustomerAccountEnvName[] = [];
  if (
    clientId === undefined ||
    !CLIENT_ID_PATTERN.test(clientId) ||
    SECRET_TOKEN_PREFIX.test(clientId)
  ) {
    invalid.push('EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID');
  }
  if (shopId === undefined || !SHOP_ID_PATTERN.test(shopId)) invalid.push('EXPO_PUBLIC_SHOP_ID');

  if (invalid.length > 0 || clientId === undefined || shopId === undefined) {
    throw new CustomerAccountConfigError(invalid);
  }

  const callbackScheme = callbackSchemeFor(shopId);
  return {
    clientId,
    shopId,
    callbackScheme,
    redirectUri: `${callbackScheme}://callback`,
    scopes: CUSTOMER_ACCOUNT_SCOPES,
  };
}

let cached: CustomerAccountConfig | undefined;

/** Parsed on first use, so a build without login values still starts. */
export function getCustomerAccountConfig(): CustomerAccountConfig {
  cached ??= parseCustomerAccountConfig({
    EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID: process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID,
    EXPO_PUBLIC_SHOP_ID: process.env.EXPO_PUBLIC_SHOP_ID,
  });
  return cached;
}

export type CustomerAccountConfigStatus = 'configured' | 'not configured';

/** Whether login is set up on this build. It never exposes a value. */
export function getCustomerAccountConfigStatus(): CustomerAccountConfigStatus {
  try {
    getCustomerAccountConfig();
    return 'configured';
  } catch (error) {
    if (error instanceof CustomerAccountConfigError) return 'not configured';
    throw error;
  }
}
