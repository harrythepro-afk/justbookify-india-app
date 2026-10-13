import { AuthRequest, CodeChallengeMethod, ResponseType } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { getCustomerAccountConfig, getStoreConfig, type CustomerAccountConfig } from '@/config';
import { reportCustomerAccountProblem, setCustomerTokenSource } from '@/crashReporting/sentry';
import { clearAllCaches } from '@/query/queryClient';

import { parseOpenIdConfiguration, type CustomerAccountDiscovery } from './discoveryDocument';
import { checkIdToken, decodeIdTokenClaims } from './idToken';
import { callLogoutEndpoint, getJson, postTokenRequest } from './oauthHttp';
import {
  deleteStoredSession,
  readStoredSession,
  storedLengths,
  TokenStorageError,
  writeStoredSession,
  type StoredSession,
} from './tokenStorage';

/**
 * The customer's login (P7-01; D-119 to D-123). The only module screens use for it: they see
 * `{ status, email }` and the actions, never a token.
 *
 * - **Login** only from the Account tab (architect, answer 1), in the system browser with PKCE,
 *   `state` and a nonce; the app returns to the Account tab (answer 2).
 * - **Tokens** in memory here and in `tokenStorage.ts`, nowhere else. Never logged, never in
 *   analytics, never in Sentry (the scrubber also removes them by value).
 * - **Refresh** when the access token has 5 minutes or less left, one refresh in flight.
 * - **Logging out** happens only when the customer taps "Log out", or when Shopify refuses the
 *   refresh token (`invalid_grant`, answer 3 and change A). A website logout does not log the app
 *   out; nothing here asks about the website session.
 */

export type LoginNotice = 'none' | 'refused' | 'loginFailed';

export type CustomerSessionState =
  | { readonly status: 'loading' }
  | { readonly status: 'notConfigured' }
  | { readonly status: 'signedOut'; readonly notice: LoginNotice; readonly loggingIn: boolean }
  | { readonly status: 'signedIn'; readonly email?: string };

export type RefreshOutcome = 'refreshed' | 'refused' | 'unavailable' | 'signedOut';

/** A refresh starts when the access token has this much time left, or less. */
export const REFRESH_MARGIN_MILLIS = 5 * 60 * 1000;

let state: CustomerSessionState = { status: 'loading' };
let session: StoredSession | undefined;
let discovery: CustomerAccountDiscovery | undefined;
let refreshInFlight: Promise<RefreshOutcome> | undefined;
let loginInFlight = false;
let started = false;
let removeAppStateListener: (() => void) | undefined;
const listeners = new Set<() => void>();

setCustomerTokenSource(() =>
  session === undefined ? [] : [session.accessToken, session.refreshToken, session.idToken],
);

function setState(next: CustomerSessionState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getState(): CustomerSessionState {
  return state;
}

export function getCustomerSessionState(): CustomerSessionState {
  return state;
}

export function useCustomerSession(): CustomerSessionState {
  return useSyncExternalStore(subscribe, getState, getState);
}

function signedInState(current: StoredSession): CustomerSessionState {
  const email = decodeIdTokenClaims(current.idToken)?.email;
  return email === undefined ? { status: 'signedIn' } : { status: 'signedIn', email };
}

function signedOut(notice: LoginNotice): CustomerSessionState {
  return { status: 'signedOut', notice, loggingIn: false };
}

type Setup = { readonly config: CustomerAccountConfig; readonly storeDomain: string };

/** Both configurations, or undefined when login is not set up on this build. */
function setupOrUndefined(): Setup | undefined {
  try {
    return { config: getCustomerAccountConfig(), storeDomain: getStoreConfig().storeDomain };
  } catch {
    return undefined;
  }
}

/** Shopify's endpoints, from the store's discovery document once per launch (D-120). */
async function loadDiscovery(setup: Setup): Promise<CustomerAccountDiscovery | undefined> {
  if (discovery !== undefined) return discovery;
  const result = await getJson(`https://${setup.storeDomain}/.well-known/openid-configuration`);
  if (!result.ok) {
    reportCustomerAccountProblem(`discovery_${result.code}`);
    return undefined;
  }
  const check = parseOpenIdConfiguration(result.body, setup.config.shopId);
  if (!check.ok) {
    reportCustomerAccountProblem(check.code);
    return undefined;
  }
  discovery = check.discovery;
  return discovery;
}

/** 32 random bytes as base64url, for the nonce and `state`. */
function randomUrlSafe(): string {
  const bytes = Crypto.getRandomBytes(32);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Signs out on this phone: the session leaves memory, the stored tokens are deleted and every
 * cache is emptied (D-061). `notice` is what the Account tab says.
 */
async function endSession(notice: LoginNotice): Promise<void> {
  session = undefined;
  setState(signedOut(notice));
  try {
    await deleteStoredSession();
  } catch (error) {
    reportCustomerAccountProblem(
      error instanceof TokenStorageError ? `storage_${error.code}` : 'storage_delete_failed',
    );
  }
  clearAllCaches();
}

function onAppStateChange(next: string): void {
  if (next === 'active') void refreshIfDue();
}

/**
 * Reads the stored session at launch (`_layout.tsx`). Signed in at once from storage, without
 * asking Shopify; a refresh follows in the background when the access token is due.
 */
export async function startCustomerSession(): Promise<void> {
  if (started) return;
  started = true;

  if (setupOrUndefined() === undefined) {
    setState({ status: 'notConfigured' });
    return;
  }

  const stored = await readStoredSession();
  switch (stored.kind) {
    case 'session':
      session = stored.session;
      setState(signedInState(stored.session));
      break;
    case 'invalid':
      reportCustomerAccountProblem('storage_invalid');
      await endSession('none');
      break;
    case 'unreadable':
      // Signed out for this launch only; nothing is deleted, as the failure may pass.
      reportCustomerAccountProblem('storage_unreadable');
      setState(signedOut('none'));
      break;
    case 'none':
      setState(signedOut('none'));
      break;
  }

  const subscription = AppState.addEventListener('change', onAppStateChange);
  removeAppStateListener = () => subscription.remove();
  await refreshIfDue();
}

function isDue(current: StoredSession): boolean {
  return current.expiresAt - Date.now() <= REFRESH_MARGIN_MILLIS;
}

/** At launch and on every return to the foreground. */
export async function refreshIfDue(): Promise<void> {
  if (session !== undefined && isDue(session)) await refreshSession();
}

/**
 * A valid access token, refreshed first when due; undefined when signed out, or when the token
 * has expired and Shopify cannot be reached. For the Customer Account API calls from P7-02.
 */
export async function getValidAccessToken(): Promise<string | undefined> {
  if (session !== undefined && isDue(session)) await refreshSession();
  if (session === undefined) return undefined;
  return session.expiresAt > Date.now() ? session.accessToken : undefined;
}

/** One refresh at a time: every caller during a refresh shares its result. */
export function refreshSession(): Promise<RefreshOutcome> {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = undefined;
  });
  return refreshInFlight;
}

async function runRefresh(): Promise<RefreshOutcome> {
  const current = session;
  const setup = setupOrUndefined();
  if (current === undefined || setup === undefined) return 'signedOut';

  const endpoints = await loadDiscovery(setup);
  if (endpoints === undefined) return 'unavailable';

  const result = await postTokenRequest(endpoints.tokenEndpoint, {
    grant_type: 'refresh_token',
    client_id: setup.config.clientId,
    refresh_token: current.refreshToken,
  });
  // A logout or a new login while the request was out wins over its answer.
  if (session !== current) return 'signedOut';

  if (!result.ok) {
    if (result.kind === 'refused') {
      reportCustomerAccountProblem('refresh_refused');
      await endSession('refused');
      return 'refused';
    }
    // Offline or a timeout is ordinary on a phone and is not reported.
    if (result.code !== 'network' && result.code !== 'timeout') {
      reportCustomerAccountProblem(`refresh_${result.code}`);
    }
    return 'unavailable';
  }

  let idToken = current.idToken;
  if (result.tokens.idToken !== undefined) {
    const check = checkIdToken(result.tokens.idToken, {
      issuer: endpoints.issuer,
      clientId: setup.config.clientId,
      nonce: current.nonce,
      nonceRequired: false,
      now: Math.floor(Date.now() / 1000),
    });
    if (check.ok) idToken = result.tokens.idToken;
    else reportCustomerAccountProblem(`refresh_${check.code}`);
  }

  const next: StoredSession = {
    accessToken: result.tokens.accessToken,
    // Shopify may send a new refresh token with each refresh; the old one is kept otherwise.
    refreshToken: result.tokens.refreshToken ?? current.refreshToken,
    idToken,
    expiresAt: Date.now() + result.tokens.expiresIn * 1000,
    nonce: current.nonce,
  };
  session = next;
  setState(signedInState(next));
  try {
    await writeStoredSession(next);
  } catch (error) {
    // This launch goes on with the new tokens in memory; the stored set is the previous one.
    reportCustomerAccountProblem(
      error instanceof TokenStorageError ? `storage_${error.code}` : 'storage_write_failed',
    );
  }
  return 'refreshed';
}

async function failLogin(code: string): Promise<void> {
  reportCustomerAccountProblem(code);
  setState(signedOut('loginFailed'));
}

/**
 * Opens Shopify's login in the system browser (D-119). Ignored while a login is running or when
 * already signed in. A login the customer closes leaves "Log in" with no message.
 */
export async function login(): Promise<void> {
  if (loginInFlight || state.status !== 'signedOut') return;
  const setup = setupOrUndefined();
  if (setup === undefined) return;

  loginInFlight = true;
  setState({ status: 'signedOut', notice: 'none', loggingIn: true });
  try {
    await runLogin(setup);
  } finally {
    loginInFlight = false;
  }
}

async function runLogin(setup: Setup): Promise<void> {
  const { config } = setup;
  const endpoints = await loadDiscovery(setup);
  if (endpoints === undefined) {
    setState(signedOut('loginFailed'));
    return;
  }

  const nonce = randomUrlSafe();
  const expectedState = randomUrlSafe();
  const request = new AuthRequest({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scopes: [...config.scopes],
    responseType: ResponseType.Code,
    usePKCE: true,
    codeChallengeMethod: CodeChallengeMethod.S256,
    state: expectedState,
    extraParams: { nonce },
  });

  let result;
  try {
    result = await request.promptAsync({ authorizationEndpoint: endpoints.authorizationEndpoint });
  } catch {
    await failLogin('browser_failed');
    return;
  }

  if (result.type !== 'success' && result.type !== 'error') {
    // cancel, dismiss (including Android ending the app while the page was open) or locked.
    setState(signedOut('none'));
    return;
  }
  if (result.type === 'error') {
    const code = result.error?.code;
    await failLogin(
      code === 'state_mismatch'
        ? 'state_mismatch'
        : `authorize_${typeof code === 'string' && /^[a-z_]{1,40}$/.test(code) ? code : 'error'}`,
    );
    return;
  }
  // The library compares state too; the app checks it again itself.
  if (result.params.state !== expectedState) {
    await failLogin('state_mismatch');
    return;
  }
  const code = result.params.code;
  const verifier = request.codeVerifier;
  if (typeof code !== 'string' || code === '' || verifier === undefined) {
    await failLogin('authorize_no_code');
    return;
  }

  const exchange = await postTokenRequest(endpoints.tokenEndpoint, {
    grant_type: 'authorization_code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code,
    code_verifier: verifier,
  });
  if (!exchange.ok) {
    await failLogin(`exchange_${exchange.code}`);
    return;
  }
  const { accessToken, expiresIn, refreshToken, idToken } = exchange.tokens;
  // A client set up outside the Headless channel gets no refresh token (Shopify's reference).
  if (refreshToken === undefined) {
    await failLogin('exchange_no_refresh_token');
    return;
  }
  if (idToken === undefined) {
    await failLogin('exchange_no_id_token');
    return;
  }
  const check = checkIdToken(idToken, {
    issuer: endpoints.issuer,
    clientId: config.clientId,
    nonce,
    nonceRequired: true,
    now: Math.floor(Date.now() / 1000),
  });
  if (!check.ok) {
    await failLogin(check.code);
    return;
  }

  const next: StoredSession = {
    accessToken,
    refreshToken,
    idToken,
    expiresAt: Date.now() + expiresIn * 1000,
    nonce,
  };
  try {
    await writeStoredSession(next);
  } catch (error) {
    await failLogin(
      error instanceof TokenStorageError ? `storage_${error.code}` : 'storage_write_failed',
    );
    return;
  }
  session = next;
  setState(signedInState(next));
}

/**
 * "Log out" (D-122): signed out on the phone first (tokens deleted, every cache emptied), then
 * Shopify's logout for mobile clients with the ID token. If Shopify cannot be reached, the phone
 * is signed out all the same; the failure is reported by code only and not shown.
 */
export async function logout(): Promise<void> {
  if (state.status !== 'signedIn') return;
  const idToken = session?.idToken;
  await endSession('none');

  const setup = setupOrUndefined();
  if (idToken === undefined || setup === undefined) return;
  const endpoints = await loadDiscovery(setup);
  if (endpoints === undefined) return;
  const result = await callLogoutEndpoint(endpoints.endSessionEndpoint, idToken);
  if (!result.ok) reportCustomerAccountProblem(`logout_${result.code}`);
}

export type DevelopmentSessionInfo = {
  readonly expiresInMinutes: number;
  readonly lengths: ReturnType<typeof storedLengths>;
};

/** Development builds only (Home's development tools): never a token, only its length. */
export function getDevelopmentSessionInfo(): DevelopmentSessionInfo | undefined {
  if (session === undefined) return undefined;
  return {
    expiresInMinutes: Math.floor((session.expiresAt - Date.now()) / 60_000),
    lengths: storedLengths(session),
  };
}

/** For tests: back to a fresh launch. */
export function resetCustomerSessionForTests(): void {
  removeAppStateListener?.();
  removeAppStateListener = undefined;
  state = { status: 'loading' };
  session = undefined;
  discovery = undefined;
  refreshInFlight = undefined;
  loginInFlight = false;
  started = false;
  listeners.clear();
}
