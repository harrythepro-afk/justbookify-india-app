/**
 * Our backend's address (P10-02, D-166): the Cloud Functions base URL of the development Firebase
 * project, such as `https://asia-south1-<project ID>.cloudfunctions.net`. Public configuration:
 * the address is not a secret, and every request is checked with the customer's own token on the
 * backend (D-161). Only the base comes from configuration; each function's path is in
 * `src/backend/client.ts`, so a second store or project needs no code change.
 *
 * **Development builds only:** the only endpoint so far, `whoami`, is deployed only to the
 * development project (D-162), so staging and production builds have no backend address even if
 * the variable is set. Static `process.env.NAME` read, for the reason given in `store.ts`.
 */

import type { AppEnvironment } from './appEnvironment';
import { getAppEnvironment } from './environment';

export type BackendConfig = { readonly baseUrl: string };

export const BACKEND_URL_ENV_NAME = 'EXPO_PUBLIC_BACKEND_URL';

// https and a bare host name with at least one dot: no port, path, query, fragment or credentials.
const BASE_URL =
  /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * Undefined, silently, outside development, when the variable is unset or blank, and when it is
 * not an https base URL. One trailing slash is dropped; the value is never echoed.
 */
export function parseBackendConfig(env: {
  readonly url: string | undefined;
  readonly appEnv: AppEnvironment;
}): BackendConfig | undefined {
  if (env.appEnv !== 'development') return undefined;
  const url = env.url?.trim().toLowerCase().replace(/\/$/, '');
  if (url === undefined || !BASE_URL.test(url)) return undefined;
  return { baseUrl: url };
}

export function getBackendConfig(): BackendConfig | undefined {
  return parseBackendConfig({
    url: process.env.EXPO_PUBLIC_BACKEND_URL,
    appEnv: getAppEnvironment(),
  });
}
