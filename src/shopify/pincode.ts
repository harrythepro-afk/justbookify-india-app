/**
 * The pincode check (R3, P8-02, D-142). The store's checkout delivers only to pincodes whose first
 * two digits fall in the configured ranges (`deliveryPincodeRanges`: 50 to 53 and 56 to 69 for the
 * India store; `SHOPIFY_AUDIT.md`, "Rule: Shipping Restriction"). The Cart tab checks it before
 * checkout, as a hint; the field is optional.
 *
 * A pincode is personal data. It is kept in this module's memory only, for the app's session: never
 * stored, logged, reported or sent to analytics. A cold start forgets it, and so does a logout
 * (`forgetPincode()` in `endSession()`, owner at plan time: a shared phone).
 */

import { useSyncExternalStore } from 'react';

import type { PincodePrefixRange } from '@/config';

export type PincodeResult = 'invalid' | 'in_area' | 'outside_area';

const PINCODE_PATTERN = /^\d{6}$/;

/** Removes everything but digits, so the field accepts digits only, at most six. */
export function pincodeDigits(text: string): string {
  return text.replace(/\D/g, '').slice(0, 6);
}

/** Exactly six digits, whose first two fall inside a configured range (inclusive). */
export function checkPincode(text: string, ranges: readonly PincodePrefixRange[]): PincodeResult {
  if (!PINCODE_PATTERN.test(text)) return 'invalid';
  const prefix = Number(text.slice(0, 2));
  return ranges.some((range) => prefix >= range.from && prefix <= range.to)
    ? 'in_area'
    : 'outside_area';
}

export type PincodeState = {
  /** What the field holds: digits only. */
  readonly text: string;
  /** The result shown for `text`, or `undefined` before a check or after an edit. */
  readonly result: PincodeResult | undefined;
};

const EMPTY: PincodeState = { text: '', result: undefined };

let state: PincodeState = EMPTY;
const listeners = new Set<() => void>();

function setState(next: PincodeState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The field's text and result now, outside React (logout and tests). */
export function getPincodeState(): PincodeState {
  return state;
}

/** The field's text and result, kept while the app runs; the same for every reader. */
export function usePincode(): PincodeState {
  return useSyncExternalStore(subscribe, getPincodeState);
}

/** The field changed: digits only, and any result shown is cleared. */
export function editPincode(text: string): void {
  const digits = pincodeDigits(text);
  if (digits === state.text) return;
  setState({ text: digits, result: undefined });
}

/**
 * Checks the field's pincode. Returns the result when it is new, so the caller records it once;
 * `undefined` when the same unchanged pincode was already checked.
 */
export function submitPincode(ranges: readonly PincodePrefixRange[]): PincodeResult | undefined {
  if (state.result !== undefined) return undefined;
  const result = checkPincode(state.text, ranges);
  setState({ text: state.text, result });
  return result;
}

/** Forgets the pincode: at logout, and from the field's clear button. */
export function forgetPincode(): void {
  if (state === EMPTY) return;
  setState(EMPTY);
}
