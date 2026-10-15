import { useEffect, useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { parseWantedList, type WantedList } from '@/analytics/wantedList';
import {
  CHECKOUT_FLAG_TIMEOUT_MILLIS,
  defaultFeatureFlags,
  FLAG_ACTIVATION_TIMEOUT_MILLIS,
  getAppEnvironment,
  parseFeatureFlags,
  REMOTE_CONFIG_SETTINGS,
  SEARCH_CONTENT,
  WANTED_LIST,
  type FeatureFlagSnapshot,
  type FeatureFlagSource,
  type RawRemoteConfigValue,
} from '@/config';
import { safeErrorCode as errorCode } from '@/crashReporting/errorCode';
import {
  reportFeatureFlagProblem,
  reportMalformedFeatureFlag,
  reportMalformedRemoteConfigList,
} from '@/crashReporting/sentry';

import { activateLastFetched, fetchForNextLaunch } from './remoteConfig';

/**
 * Feature flags for one session (D-046). The app never waits for Remote Config: it renders
 * at once, and flag consumers wait for `loadFeatureFlags()`. One snapshot is frozen per
 * launch, at the first of these:
 * - the values fetched in an earlier session are activated from storage (no network);
 * - activation fails: the compiled defaults;
 * - activation takes longer than FLAG_ACTIVATION_TIMEOUT_MILLIS: the compiled defaults.
 * Nothing changes a frozen snapshot. New values are then fetched in the background and apply
 * from the next cold start, so a flag never changes in the middle of a session.
 *
 * One exception (D-150): checkout reads `checkout_presentation` afresh each time it opens
 * (`loadCheckoutPresentation()`), and new values are also fetched on each return to the
 * foreground, so the kill switch (D-033) acts without waiting for two restarts.
 *
 * The wanted list (P6-11, D-115) is frozen with the flags, from the same activated values, on the
 * same timing: an empty list whenever the flags fall back to their defaults.
 */

/** How the background fetch ended. `failed` is an unexpected error, already reported. */
export type FeatureFlagFetchStatus = 'in progress' | 'success' | 'failure' | 'throttled' | 'failed';

/** This session's wanted list (D-115) and where it came from. */
export type WantedListSnapshot = {
  readonly list: WantedList;
  readonly source: FeatureFlagSource;
};

export type FeatureFlagState =
  | { readonly status: 'not ready' }
  | {
      readonly status: 'ready';
      readonly snapshot: FeatureFlagSnapshot;
      readonly wantedList: WantedListSnapshot;
      /** Undefined when no fetch was started because activation failed. */
      readonly fetch: FeatureFlagFetchStatus | undefined;
    };

/** What one launch freezes. */
type Frozen = { readonly snapshot: FeatureFlagSnapshot; readonly wantedList: WantedListSnapshot };

const NO_WANTED_LIST: WantedListSnapshot = { list: [], source: 'default' };

function defaults(): Frozen {
  return { snapshot: defaultFeatureFlags(), wantedList: NO_WANTED_LIST };
}

const NOT_READY: FeatureFlagState = { status: 'not ready' };

let state: FeatureFlagState = NOT_READY;
let loading: Promise<FeatureFlagSnapshot> | undefined;
const listeners = new Set<() => void>();

function setState(next: FeatureFlagState): void {
  state = next;
  for (const listener of listeners) listener();
}

/**
 * Every failed fetch reaches JavaScript as `remoteConfig/failure` (no network, a timeout or a
 * server error; they cannot be told apart) or `remoteConfig/throttled`. Both are expected
 * and never reported (D-046).
 */
const EXPECTED_FETCH_ERRORS: Record<string, FeatureFlagFetchStatus> = {
  'remoteConfig/failure': 'failure',
  'remoteConfig/throttled': 'throttled',
};

type Activation =
  | {
      readonly kind: 'activated';
      readonly raw: Readonly<Record<string, RawRemoteConfigValue | undefined>>;
    }
  | { readonly kind: 'failed'; readonly error: unknown }
  | { readonly kind: 'timed out' };

async function activateWithTimeout(): Promise<Activation> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Activation>((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'timed out' }), FLAG_ACTIVATION_TIMEOUT_MILLIS);
  });
  // Started inside a promise chain, so a synchronous throw (no native module) is caught too.
  const activation = Promise.resolve()
    .then(() => activateLastFetched(REMOTE_CONFIG_SETTINGS[getAppEnvironment()]))
    .then(
      (raw): Activation => ({ kind: 'activated', raw }),
      (error: unknown): Activation => ({ kind: 'failed', error }),
    );

  try {
    return await Promise.race([activation, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function fetchInBackground(frozen: Frozen): void {
  setState({ status: 'ready', ...frozen, fetch: 'in progress' });
  fetchForNextLaunch().then(
    () => setState({ status: 'ready', ...frozen, fetch: 'success' }),
    (error: unknown) => {
      const code = errorCode(error);
      const expected = EXPECTED_FETCH_ERRORS[code];
      if (expected === undefined) reportFeatureFlagProblem(`fetch failed (${code})`);
      setState({ status: 'ready', ...frozen, fetch: expected ?? 'failed' });
    },
  );
}

/**
 * The flags and the wanted list from the activated values. Problems are reported here, and
 * `load()` runs once per launch, so each is reported at most once per launch (D-046, D-116).
 */
function freeze(raw: Readonly<Record<string, RawRemoteConfigValue | undefined>>): Frozen {
  const snapshot = parseFeatureFlags(raw);
  for (const name of snapshot.malformed) reportMalformedFeatureFlag(name);
  const wanted = parseWantedList(raw[WANTED_LIST.parameter], SEARCH_CONTENT.matchCommonWords);
  if (wanted.problem !== undefined) {
    reportMalformedRemoteConfigList(WANTED_LIST.parameter, wanted.problem);
  }
  return { snapshot, wantedList: { list: wanted.list, source: wanted.source } };
}

async function load(): Promise<FeatureFlagSnapshot> {
  const activation = await activateWithTimeout();

  if (activation.kind === 'activated') {
    const frozen = freeze(activation.raw);
    fetchInBackground(frozen);
    return frozen.snapshot;
  }

  const frozen = defaults();
  if (activation.kind === 'timed out') {
    reportFeatureFlagProblem('activation timed out');
    // The values may still activate; they are fetched for, and used from, the next launch.
    fetchInBackground(frozen);
  } else {
    reportFeatureFlagProblem(`activation failed (${errorCode(activation.error)})`);
    setState({ status: 'ready', ...frozen, fetch: undefined });
  }
  return frozen.snapshot;
}

/**
 * Resolves with this session's flags once the snapshot is frozen, within
 * FLAG_ACTIVATION_TIMEOUT_MILLIS of the first call. It never rejects: every failure resolves
 * with the compiled defaults.
 */
export function loadFeatureFlags(): Promise<FeatureFlagSnapshot> {
  loading ??= load().catch((error: unknown) => {
    reportFeatureFlagProblem(`unexpected error (${errorCode(error)})`);
    const frozen = defaults();
    setState({ status: 'ready', ...frozen, fetch: undefined });
    return frozen.snapshot;
  });
  return loading;
}

/**
 * Resolves with this session's wanted list (D-115) once the snapshot is frozen, on the same timing
 * as `loadFeatureFlags()`. It never rejects: every failure resolves with the empty default.
 */
export async function loadWantedList(): Promise<WantedListSnapshot> {
  await loadFeatureFlags();
  return state.status === 'ready' ? state.wantedList : NO_WANTED_LIST;
}

/** How checkout is presented (D-033), as checkout reads it (D-150). */
export type CheckoutPresentation = FeatureFlagSnapshot['values']['checkout_presentation'];

/** The value checkout read last in this session, for Home's development line (D-150). */
let checkoutRead:
  { readonly value: CheckoutPresentation; readonly source: FeatureFlagSource } | undefined;

/**
 * **The checkout-only exception to "no change in the middle of a session" (D-046, D-150).** Each
 * time checkout opens it activates the values fetched since launch (a local read, at most
 * CHECKOUT_FLAG_TIMEOUT_MILLIS) and reads `checkout_presentation` from them, so the kill switch
 * acts at the next checkout after a fetch saw it, with no restart. Every other consumer keeps the
 * snapshot frozen at launch. On a failure or a timeout, the frozen value. Never rejects; a
 * malformed value was already reported at launch and is not reported again.
 */
export async function loadCheckoutPresentation(): Promise<CheckoutPresentation> {
  const frozen = await loadFeatureFlags();
  const fallback = {
    value: frozen.values.checkout_presentation,
    source: frozen.sources.checkout_presentation,
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), CHECKOUT_FLAG_TIMEOUT_MILLIS);
  });
  const activation = Promise.resolve()
    .then(() => activateLastFetched(REMOTE_CONFIG_SETTINGS[getAppEnvironment()]))
    .then(
      (raw) => {
        const parsed = parseFeatureFlags(raw);
        return {
          value: parsed.values.checkout_presentation,
          source: parsed.sources.checkout_presentation,
        };
      },
      () => undefined,
    );
  try {
    checkoutRead = (await Promise.race([activation, timeout])) ?? fallback;
  } finally {
    clearTimeout(timer);
  }
  notify();
  return checkoutRead.value;
}

/** The value checkout read last in this session; undefined before the first checkout. */
export function useCheckoutPresentationRead():
  { readonly value: CheckoutPresentation; readonly source: FeatureFlagSource } | undefined {
  return useSyncExternalStore(subscribe, getCheckoutRead, getCheckoutRead);
}

function getCheckoutRead() {
  return checkoutRead;
}

/**
 * Fetches new values when the app returns to the foreground (D-150), so an app left running also
 * gets a change for its next checkout. The SDK skips it within the minimum fetch interval.
 * Expected failures are not reported (D-046); the snapshot and the fetch line are unchanged.
 */
export function fetchFlagsOnForeground(): void {
  if (state.status !== 'ready') return;
  fetchForNextLaunch().catch((error: unknown) => {
    const code = errorCode(error);
    if (EXPECTED_FETCH_ERRORS[code] === undefined)
      reportFeatureFlagProblem(`fetch failed (${code})`);
  });
}

function notify(): void {
  for (const listener of listeners) listener();
}

let removeForegroundListener: (() => void) | undefined;

/**
 * Called once at start-up, before the first render. Nothing waits for it. Also fetches again on
 * each return to the foreground, for checkout's next read (D-150).
 */
export function startFeatureFlags(): void {
  void loadFeatureFlags();
  if (removeForegroundListener !== undefined) return;
  let previous: AppStateStatus = AppState.currentState;
  const subscription = AppState.addEventListener('change', (next) => {
    if (next === 'active' && previous !== 'active') fetchFlagsOnForeground();
    previous = next;
  });
  removeForegroundListener = () => subscription.remove();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): FeatureFlagState {
  return state;
}

/** `not ready` until the session's snapshot is frozen, then `ready` with it. */
export function useFeatureFlags(): FeatureFlagState {
  useEffect(() => {
    void loadFeatureFlags();
  }, []);
  return useSyncExternalStore(subscribe, getState, getState);
}

/**
 * This session's wanted list (P6-11, D-115): null until the snapshot is frozen, then the same
 * list for the rest of the launch.
 */
export function useWantedList(): WantedList | null {
  const flags = useFeatureFlags();
  return flags.status === 'ready' ? flags.wantedList.list : null;
}
