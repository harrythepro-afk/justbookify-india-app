import { safeErrorCode } from '@/crashReporting/errorCode';
import { reportAnalyticsProblem } from '@/crashReporting/sentry';

import { isAnalyticsConsentGranted } from './consent';
import { sendEvent, sendScreenView } from './firebase';
import { guardEvent, isSafeScreenName, type ParamKind } from './guard';
import type {
  AnalyticsCollectionId,
  AnalyticsOrderId,
  AnalyticsProductId,
  AnalyticsToken,
} from './ids';

/**
 * The events in `docs/ANALYTICS.md`, one typed function each (D-053). Snake-case names; IDs,
 * counts, amounts and fixed codes only. Every event passes the guard, and is sent only while
 * the customer's consent is `granted` (D-048). Most events are called by the screens built in
 * later phases.
 */
export const ANALYTICS_EVENTS = {
  app_open: { source: ['cold_start', 'foreground'] },
  sign_up: {},
  login: {},
  logout: {},
  search: { term_length: 'count', result_count: 'count' },
  filter_applied: { filter_type: 'token', value: 'token' },
  view_collection: { collection_id: 'collectionId' },
  view_book: { product_id: 'productId', available: 'yes/no' },
  select_book: { product_id: 'productId', cart_size: 'count' },
  remove_book: { product_id: 'productId', cart_size: 'count' },
  book_unavailable_shown: { product_id: 'productId', stage: 'token' },
  notify_me_requested: { product_id: 'productId' },
  view_cart: { book_count: 'count', cart_value: 'money' },
  order_cap_reached: { cart_value: 'money' },
  begin_checkout: { book_count: 'count', cart_value: 'money' },
  rental_order_success: { order_id: 'orderId', book_count: 'count', payment_type: 'token' },
  checkout_failed: { stage: 'token', error_code: 'token' },
  return_initiated: { book_count: 'count' },
  return_completed: { book_count: 'count' },
  repeat_rental: { rental_number: 'count' },
  review_submitted: { product_id: 'productId', rating: 'rating' },
  recommendation_quiz_completed: { result_count: 'count' },
  notification_received: { type: 'token' },
  notification_opened: { type: 'token', destination: 'token' },
  support_opened: { channel: 'token' },
} as const satisfies Record<string, Readonly<Record<string, ParamKind>>>;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

type KindValues = {
  count: number;
  /** Rupees. */
  money: number;
  rating: 1 | 2 | 3 | 4 | 5;
  'yes/no': boolean;
  productId: AnalyticsProductId;
  collectionId: AnalyticsCollectionId;
  orderId: AnalyticsOrderId;
  token: AnalyticsToken;
};

type ValueOf<Kind> = Kind extends readonly string[]
  ? Kind[number]
  : Kind extends keyof KindValues
    ? KindValues[Kind]
    : never;

export type AnalyticsEventParams<Name extends AnalyticsEventName> = {
  readonly [Param in keyof (typeof ANALYTICS_EVENTS)[Name]]: ValueOf<
    (typeof ANALYTICS_EVENTS)[Name][Param]
  >;
};

// Reported once per event and parameter in a session, so a bug cannot flood Sentry.
const reportedDrops = new Set<string>();

function reportDropped(event: string, param: string): void {
  const key = `${event}.${param}`;
  if (reportedDrops.has(key)) return;
  reportedDrops.add(key);
  reportAnalyticsProblem(`dropped ${event} (${param} failed the guard)`);
}

function reportSendFailure(error: unknown): void {
  reportAnalyticsProblem(`send failed (${safeErrorCode(error)})`);
}

/** The guard runs first, with or without consent, so a bad call shows up in development too. */
function track<Name extends AnalyticsEventName>(
  name: Name,
  params: AnalyticsEventParams<Name>,
): void {
  const result = guardEvent(ANALYTICS_EVENTS[name], params);
  if (!result.ok) {
    reportDropped(name, result.param);
    return;
  }
  if (!isAnalyticsConsentGranted()) return;
  sendEvent(name, result.params).catch(reportSendFailure);
}

/** A screen, named by its route (`screenTracking.ts`). */
export function trackScreenView(screenName: string): void {
  if (!isSafeScreenName(screenName)) {
    reportDropped('screen_view', 'screen_name');
    return;
  }
  if (!isAnalyticsConsentGranted()) return;
  sendScreenView(screenName).catch(reportSendFailure);
}

type Params<Name extends AnalyticsEventName> = AnalyticsEventParams<Name>;

export const trackAppOpen = (p: Params<'app_open'>) => track('app_open', p);
export const trackSignUp = () => track('sign_up', {});
export const trackLogin = () => track('login', {});
export const trackLogout = () => track('logout', {});
export const trackSearch = (p: Params<'search'>) => track('search', p);
export const trackFilterApplied = (p: Params<'filter_applied'>) => track('filter_applied', p);
export const trackViewCollection = (p: Params<'view_collection'>) => track('view_collection', p);
export const trackViewBook = (p: Params<'view_book'>) => track('view_book', p);
export const trackSelectBook = (p: Params<'select_book'>) => track('select_book', p);
export const trackRemoveBook = (p: Params<'remove_book'>) => track('remove_book', p);
export const trackBookUnavailableShown = (p: Params<'book_unavailable_shown'>) =>
  track('book_unavailable_shown', p);
export const trackNotifyMeRequested = (p: Params<'notify_me_requested'>) =>
  track('notify_me_requested', p);
export const trackViewCart = (p: Params<'view_cart'>) => track('view_cart', p);
export const trackOrderCapReached = (p: Params<'order_cap_reached'>) =>
  track('order_cap_reached', p);
export const trackBeginCheckout = (p: Params<'begin_checkout'>) => track('begin_checkout', p);
export const trackRentalOrderSuccess = (p: Params<'rental_order_success'>) =>
  track('rental_order_success', p);
export const trackCheckoutFailed = (p: Params<'checkout_failed'>) => track('checkout_failed', p);
export const trackReturnInitiated = (p: Params<'return_initiated'>) => track('return_initiated', p);
export const trackReturnCompleted = (p: Params<'return_completed'>) => track('return_completed', p);
export const trackRepeatRental = (p: Params<'repeat_rental'>) => track('repeat_rental', p);
export const trackReviewSubmitted = (p: Params<'review_submitted'>) => track('review_submitted', p);
export const trackRecommendationQuizCompleted = (p: Params<'recommendation_quiz_completed'>) =>
  track('recommendation_quiz_completed', p);
export const trackNotificationReceived = (p: Params<'notification_received'>) =>
  track('notification_received', p);
export const trackNotificationOpened = (p: Params<'notification_opened'>) =>
  track('notification_opened', p);
export const trackSupportOpened = (p: Params<'support_opened'>) => track('support_opened', p);
