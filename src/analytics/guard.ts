import type { AnalyticsWireValue } from './firebase';
import { ANALYTICS_ID_PATTERN, ANALYTICS_TOKEN_PATTERN, LONG_DIGIT_RUN } from './ids';

/**
 * The runtime check every event passes before it is sent (D-053). The types in `events.ts`
 * already rule out personal data; this catches a value that slipped past them (a cast, an
 * untyped caller). An event that fails is dropped whole, never sent with the value removed.
 */

/** What a parameter may hold. A list means one of those exact strings. */
export type ParamKind =
  | 'count'
  | 'money'
  | 'rating'
  | 'yes/no'
  | 'productId'
  | 'collectionId'
  | 'orderId'
  | 'token'
  | readonly string[];

export type EventSchema = Readonly<Record<string, ParamKind>>;

export type GuardResult =
  | { readonly ok: true; readonly params: Readonly<Record<string, AnalyticsWireValue>> }
  | { readonly ok: false; readonly param: string };

const MAX_COUNT = 1_000_000;
const MAX_RUPEES = 10_000_000;

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT;
}

/** The value as sent, or undefined when it does not fit its kind. */
function toWire(kind: ParamKind, value: unknown): AnalyticsWireValue | undefined {
  if (typeof kind !== 'string') {
    return typeof value === 'string' && kind.includes(value) ? value : undefined;
  }
  switch (kind) {
    case 'count':
      return isCount(value) ? value : undefined;
    case 'money':
      return typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= MAX_RUPEES
        ? Math.round(value * 100) / 100
        : undefined;
    case 'rating':
      return isCount(value) && value >= 1 && value <= 5 ? value : undefined;
    case 'yes/no':
      return typeof value === 'boolean' ? (value ? 'yes' : 'no') : undefined;
    case 'productId':
    case 'collectionId':
    case 'orderId':
      return typeof value === 'string' && ANALYTICS_ID_PATTERN.test(value) ? value : undefined;
    case 'token':
      return typeof value === 'string' &&
        ANALYTICS_TOKEN_PATTERN.test(value) &&
        !LONG_DIGIT_RUN.test(value)
        ? value
        : undefined;
  }
}

/**
 * Checks an event's parameters against its schema: every parameter present, none unknown, each
 * of its kind. Names the first parameter that fails; the value is never returned.
 */
export function guardEvent(schema: EventSchema, params: unknown): GuardResult {
  if (typeof params !== 'object' || params === null) return { ok: false, param: '(parameters)' };

  for (const name of Object.keys(params)) {
    if (!Object.prototype.hasOwnProperty.call(schema, name)) return { ok: false, param: name };
  }

  const wire: Record<string, AnalyticsWireValue> = {};
  for (const [name, kind] of Object.entries(schema)) {
    const value = toWire(kind, (params as Record<string, unknown>)[name]);
    if (value === undefined) return { ok: false, param: name };
    wire[name] = value;
  }
  return { ok: true, params: wire };
}

/**
 * A screen name is the route's file path with groups removed (`screenTracking.ts`): lowercase
 * letters, digits, `_`, `-`, `/`, and the brackets and dots of a dynamic segment such as `[id]`.
 */
const SCREEN_NAME = /^[a-z0-9_\-/[\].]{1,100}$/;

export function isSafeScreenName(name: string): boolean {
  return SCREEN_NAME.test(name) && !LONG_DIGIT_RUN.test(name) && !name.includes('@');
}
