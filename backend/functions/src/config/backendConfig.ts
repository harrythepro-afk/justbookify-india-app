/**
 * The backend's configuration, checked before use (D-160). Every value here is public: the store's
 * domain and shop ID also ship inside the app. Secrets never come through here; from P10-02 they
 * live only in Secret Manager.
 */

export type BackendEnvironment = 'development' | 'staging' | 'production';

export interface BackendConfig {
  readonly storeDomain: string;
  readonly shopId: string;
  readonly environment: BackendEnvironment;
}

export interface RawBackendConfig {
  readonly storeDomain: string;
  readonly shopId: string;
  readonly environment: string;
}

// A bare host name with at least one dot: no scheme, port, path or credentials.
const HOST =
  /^(?=.{4,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const SHOP_ID = /^\d{1,20}$/;
const ENVIRONMENTS: readonly string[] = ['development', 'staging', 'production'];

function isEnvironment(value: string): value is BackendEnvironment {
  return ENVIRONMENTS.includes(value);
}

/** Undefined when any value is missing or malformed: the endpoint then answers `not_configured`. */
export function parseBackendConfig(raw: RawBackendConfig): BackendConfig | undefined {
  const storeDomain = raw.storeDomain.trim().toLowerCase();
  const shopId = raw.shopId.trim();
  const environment = raw.environment.trim();
  if (!HOST.test(storeDomain) || !SHOP_ID.test(shopId) || !isEnvironment(environment)) {
    return undefined;
  }
  return { storeDomain, shopId, environment };
}
