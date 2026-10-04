import { useEffect, useSyncExternalStore } from 'react';

import {
  defaultFeatureFlags,
  FLAG_ACTIVATION_TIMEOUT_MILLIS,
  getAppEnvironment,
  parseFeatureFlags,
  REMOTE_CONFIG_SETTINGS,
  type FeatureFlagSnapshot,
} from '@/config';
import { reportFeatureFlagProblem, reportMalformedFeatureFlag } from '@/crashReporting/sentry';

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
 */

/** How the background fetch ended. `failed` is an unexpected error, already reported. */
export type FeatureFlagFetchStatus = 'in progress' | 'success' | 'failure' | 'throttled' | 'failed';

export type FeatureFlagState =
  | { readonly status: 'not ready' }
  | {
      readonly status: 'ready';
      readonly snapshot: FeatureFlagSnapshot;
      /** Undefined when no fetch was started because activation failed. */
      readonly fetch: FeatureFlagFetchStatus | undefined;
    };

const NOT_READY: FeatureFlagState = { status: 'not ready' };

let state: FeatureFlagState = NOT_READY;
let loading: Promise<FeatureFlagSnapshot> | undefined;
const listeners = new Set<() => void>();

function setState(next: FeatureFlagState): void {
  state = next;
  for (const listener of listeners) listener();
}

// React Native Firebase errors carry a code such as `remoteConfig/failure`.
const FIREBASE_CODE = /^[A-Za-z]+\/[a-z_-]+$/;

/** A code that is safe to report: the Firebase code, or the error's class name. */
function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error;
    if (typeof code === 'string' && FIREBASE_CODE.test(code)) return code;
  }
  return error instanceof Error ? error.name : 'unknown';
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
  | { readonly kind: 'activated'; readonly snapshot: FeatureFlagSnapshot }
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
      (raw): Activation => ({ kind: 'activated', snapshot: parseFeatureFlags(raw) }),
      (error: unknown): Activation => ({ kind: 'failed', error }),
    );

  try {
    return await Promise.race([activation, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function fetchInBackground(snapshot: FeatureFlagSnapshot): void {
  setState({ status: 'ready', snapshot, fetch: 'in progress' });
  fetchForNextLaunch().then(
    () => setState({ status: 'ready', snapshot, fetch: 'success' }),
    (error: unknown) => {
      const code = errorCode(error);
      const expected = EXPECTED_FETCH_ERRORS[code];
      if (expected === undefined) reportFeatureFlagProblem(`fetch failed (${code})`);
      setState({ status: 'ready', snapshot, fetch: expected ?? 'failed' });
    },
  );
}

async function load(): Promise<FeatureFlagSnapshot> {
  const activation = await activateWithTimeout();

  if (activation.kind === 'activated') {
    const { snapshot } = activation;
    for (const name of snapshot.malformed) reportMalformedFeatureFlag(name);
    fetchInBackground(snapshot);
    return snapshot;
  }

  const snapshot = defaultFeatureFlags();
  if (activation.kind === 'timed out') {
    reportFeatureFlagProblem('activation timed out');
    // The values may still activate; they are fetched for, and used from, the next launch.
    fetchInBackground(snapshot);
  } else {
    reportFeatureFlagProblem(`activation failed (${errorCode(activation.error)})`);
    setState({ status: 'ready', snapshot, fetch: undefined });
  }
  return snapshot;
}

/**
 * Resolves with this session's flags once the snapshot is frozen, within
 * FLAG_ACTIVATION_TIMEOUT_MILLIS of the first call. It never rejects: every failure resolves
 * with the compiled defaults.
 */
export function loadFeatureFlags(): Promise<FeatureFlagSnapshot> {
  loading ??= load().catch((error: unknown) => {
    reportFeatureFlagProblem(`unexpected error (${errorCode(error)})`);
    const snapshot = defaultFeatureFlags();
    setState({ status: 'ready', snapshot, fetch: undefined });
    return snapshot;
  });
  return loading;
}

/** Called once at start-up, before the first render. Nothing waits for it. */
export function startFeatureFlags(): void {
  void loadFeatureFlags();
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
