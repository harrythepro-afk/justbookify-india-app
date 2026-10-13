import { useEffect, useSyncExternalStore } from 'react';

import { getAppEnvironment } from '@/config/environment';
import { safeErrorCode } from '@/crashReporting/errorCode';
import { reportAnalyticsProblem } from '@/crashReporting/sentry';

import { deleteStoredConsent, readStoredConsent, writeStoredConsent } from './consentStorage';
import { clearAnalyticsData, turnCollectionOff, turnCollectionOn } from './firebase';

/**
 * The customer's analytics consent (D-048). Opt-in: collection is on only while the choice is
 * `granted`. Firebase keeps its own collection setting across launches, so every launch syncs it
 * to the stored choice. A stored value that cannot be read counts as `not asked`.
 */

export type AnalyticsConsent = 'not asked' | 'granted' | 'denied';

export type AnalyticsConsentState = {
  /** `loading` until the stored choice has been read at start-up. */
  readonly consent: AnalyticsConsent | 'loading';
  /** A change is being applied; the Account switch waits for it. */
  readonly busy: boolean;
  /** The last change could not be saved on the phone. */
  readonly saveFailed: boolean;
};

let state: AnalyticsConsentState = { consent: 'loading', busy: false, saveFailed: false };
let loading: Promise<AnalyticsConsent> | undefined;
const listeners = new Set<() => void>();

function setState(next: AnalyticsConsentState): void {
  state = next;
  for (const listener of listeners) listener();
}

function report(step: string, error: unknown): void {
  reportAnalyticsProblem(`${step} failed (${safeErrorCode(error)})`);
}

async function readConsent(): Promise<AnalyticsConsent> {
  try {
    const stored = await readStoredConsent();
    return stored === 'granted' || stored === 'denied' ? stored : 'not asked';
  } catch (error) {
    report('consent read', error);
    return 'not asked';
  }
}

async function load(): Promise<AnalyticsConsent> {
  const consent = await readConsent();
  try {
    if (consent === 'granted') await turnCollectionOn();
    else await turnCollectionOff();
  } catch (error) {
    report('collection sync', error);
  }
  setState({ consent, busy: false, saveFailed: false });
  return consent;
}

/** Resolves with the stored choice once Firebase has been synced to it. It never rejects. */
export function loadAnalyticsConsent(): Promise<AnalyticsConsent> {
  loading ??= load();
  return loading;
}

/** True only while the choice is `granted`; nothing is sent before the choice is read. */
export function isAnalyticsConsentGranted(): boolean {
  return state.consent === 'granted';
}

/** The customer turns usage sharing on. The choice is saved first, then collection starts. */
export async function grantAnalyticsConsent(): Promise<void> {
  const current = await loadAnalyticsConsent().then(() => state);
  if (current.busy || current.consent === 'granted') return;
  setState({ ...current, busy: true });

  try {
    await writeStoredConsent('granted');
  } catch (error) {
    report('consent save', error);
    setState({ ...current, busy: false, saveFailed: true });
    return;
  }

  try {
    await turnCollectionOn();
  } catch (error) {
    report('collection on', error);
  }
  setState({ consent: 'granted', busy: false, saveFailed: false });
}

/**
 * The customer turns usage sharing off. Collection stops at once, the analytics data on the
 * phone is cleared, then `denied` is saved. If that save fails, the stored value is deleted,
 * which also leaves collection off at the next launch (`not asked`).
 */
export async function withdrawAnalyticsConsent(): Promise<void> {
  const current = await loadAnalyticsConsent().then(() => state);
  if (current.busy) return;
  // From here on nothing is sent (`isAnalyticsConsentGranted`).
  setState({ consent: 'denied', busy: true, saveFailed: false });

  try {
    await turnCollectionOff();
  } catch (error) {
    report('collection off', error);
  }
  try {
    await clearAnalyticsData();
  } catch (error) {
    report('data reset', error);
  }

  try {
    await writeStoredConsent('denied');
    setState({ consent: 'denied', busy: false, saveFailed: false });
    return;
  } catch (error) {
    report('consent save', error);
  }
  try {
    await deleteStoredConsent();
    setState({ consent: 'not asked', busy: false, saveFailed: false });
  } catch (error) {
    report('consent delete', error);
    setState({ consent: 'denied', busy: false, saveFailed: true });
  }
}

/**
 * Development builds only (P7-03, D-131): back to `not asked`, for phone checks of the consent
 * request. Sending stops at once, collection is switched off, the analytics data on the phone is
 * cleared, then the stored value is deleted. Does nothing on any other build.
 */
export async function resetAnalyticsConsent(): Promise<void> {
  if (getAppEnvironment() !== 'development') return;
  const current = await loadAnalyticsConsent().then(() => state);
  if (current.busy) return;
  setState({ consent: 'not asked', busy: true, saveFailed: false });

  try {
    await turnCollectionOff();
  } catch (error) {
    report('collection off', error);
  }
  try {
    await clearAnalyticsData();
  } catch (error) {
    report('data reset', error);
  }
  try {
    await deleteStoredConsent();
    setState({ consent: 'not asked', busy: false, saveFailed: false });
  } catch (error) {
    report('consent delete', error);
    setState({ consent: 'not asked', busy: false, saveFailed: true });
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): AnalyticsConsentState {
  return state;
}

/** The choice now, outside React: the consent request reads it after a login (P7-03). */
export function getAnalyticsConsentState(): AnalyticsConsentState {
  return state;
}

/** For tests that render screens with this module: back to a fresh launch. */
export function resetAnalyticsConsentForTests(): void {
  state = { consent: 'loading', busy: false, saveFailed: false };
  loading = undefined;
}

export function useAnalyticsConsent(): AnalyticsConsentState {
  useEffect(() => {
    void loadAnalyticsConsent();
  }, []);
  return useSyncExternalStore(subscribe, getState, getState);
}
