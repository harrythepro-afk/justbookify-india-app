import * as Network from 'expo-network';
import { AppState } from 'react-native';
import { useSyncExternalStore } from 'react';

/**
 * Development builds only: what the platform says about the network, so a wrong "offline" can
 * be traced on the phone (P6-03 phone check). It keeps the last change events, when the app
 * went to the background and came back, and a fresh read the moment the app returns to the
 * foreground and another a few seconds later. Nothing here changes what the app does, and nothing
 * personal is kept.
 */

export const LATER_READ_DELAY_MS = 3_000;
/** How many change events are kept, newest first. */
export const KEPT_EVENTS = 10;

export type NetworkReading = {
  /** Local time of day, "hh:mm:ss". */
  readonly at: string;
  readonly isConnected: boolean | undefined;
  readonly isInternetReachable: boolean | undefined;
  readonly type: string | undefined;
};

export type NetworkLog = {
  /** The last change events from the platform, newest first. */
  readonly events: readonly NetworkReading[];
  readonly backgroundAt: string | null;
  readonly returnAt: string | null;
  readonly readOnReturn: NetworkReading | null;
  readonly readLater: NetworkReading | null;
};

const EMPTY: NetworkLog = {
  events: [],
  backgroundAt: null,
  returnAt: null,
  readOnReturn: null,
  readLater: null,
};

let log: NetworkLog = EMPTY;
const listeners = new Set<() => void>();

function update(change: Partial<NetworkLog>): void {
  log = { ...log, ...change };
  listeners.forEach((listener) => listener());
}

function timeOfDay(): string {
  return new Date().toTimeString().slice(0, 8);
}

function reading(state: Network.NetworkState): NetworkReading {
  return {
    at: timeOfDay(),
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
  };
}

async function read(): Promise<NetworkReading | null> {
  try {
    return reading(await Network.getNetworkStateAsync());
  } catch {
    return null;
  }
}

/** Starts recording; returns a function that stops and forgets. */
export function startNetworkLog(): () => void {
  let laterTimer: ReturnType<typeof setTimeout> | undefined;
  const events = Network.addNetworkStateListener((state) =>
    update({ events: [reading(state), ...log.events].slice(0, KEPT_EVENTS) }),
  );
  const appState = AppState.addEventListener('change', (status) => {
    if (status === 'background') {
      update({ backgroundAt: timeOfDay() });
      return;
    }
    if (status !== 'active') return;
    update({ returnAt: timeOfDay() });
    void read().then((value) => update({ readOnReturn: value }));
    clearTimeout(laterTimer);
    laterTimer = setTimeout(() => {
      void read().then((value) => update({ readLater: value }));
    }, LATER_READ_DELAY_MS);
  });
  return () => {
    clearTimeout(laterTimer);
    events.remove();
    appState.remove();
    update(EMPTY);
  };
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function snapshot(): NetworkLog {
  return log;
}

/** The current log, for the development tools on Home. */
export function useNetworkLog(): NetworkLog {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** One reading as one line: "11:22:31 connected=true reachable=false type=WIFI". */
export function describeReading(value: NetworkReading | null): string {
  if (value === null) return 'none';
  return `${value.at} connected=${String(value.isConnected)} reachable=${String(
    value.isInternetReachable,
  )} type=${value.type ?? 'unknown'}`;
}
