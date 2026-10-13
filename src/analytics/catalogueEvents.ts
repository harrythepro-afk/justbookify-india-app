/**
 * The catalogue's usage events (P6-09, D-107): `view_collection`, `view_book` and
 * `filter_applied`, built from Shopify's IDs and the app's own codes. Screens call these with what
 * they already hold (a GID, a configured maximum, a sort); every value is turned into an ID or a
 * code here and passes the guard in `events.ts`. Nothing is sent without consent (D-048). A value
 * that cannot be made into an ID or a code drops the event, reported by event and parameter name
 * only. Screens decide when: only on the customer's own change, never for a default (D-107).
 */

import type { BookSort } from '@/config';

import {
  reportDropped,
  trackFilterApplied,
  trackViewBook,
  trackViewCollection,
  type FilterAppliedParams,
} from './events';
import {
  analyticsCollectionId,
  analyticsProductId,
  analyticsTaxonomyValueId,
  analyticsToken,
  type AnalyticsTaxonomyValueId,
  type AnalyticsToken,
} from './ids';

/** A group on Browse (D-084), as `filter_applied` names it. */
export type GroupFilterType = 'age_group' | 'series';

/** A sort's code: the app's own sort name in snake case, such as `price_descending`. */
export function sortCode(sort: BookSort): AnalyticsToken | undefined {
  return analyticsToken(sort.replace(/-/g, '_'));
}

/**
 * A price choice's code, built from the configured maximum (D-104), never typed by hand:
 * `up_to_49`, or `all` for "All prices".
 */
export function priceCode(max: number | null): AnalyticsToken | undefined {
  if (max === null) return analyticsToken('all');
  if (!Number.isFinite(max) || max < 0) return undefined;
  return analyticsToken(`up_to_${String(max).replace('.', '_')}`);
}

/** A genre's code: its taxonomy value's number, or `all` for "All genres" (D-102, D-107). */
export function genreCode(
  taxonomyValueGid: string | null,
): AnalyticsTaxonomyValueId | 'all' | undefined {
  return taxonomyValueGid === null ? 'all' : analyticsTaxonomyValueId(taxonomyValueGid);
}

function sendFilter(params: FilterAppliedParams | undefined): void {
  if (params === undefined) {
    reportDropped('filter_applied', 'value');
    return;
  }
  trackFilterApplied(params);
}

/** A collection screen showed its collection (opened from Home). */
export function trackCollectionShown(collectionGid: string): void {
  const id = analyticsCollectionId(collectionGid);
  if (id === undefined) {
    reportDropped('view_collection', 'collection_id');
    return;
  }
  trackViewCollection({ collection_id: id });
}

/** The book page showed its book; `orderable` is whether it can be ordered now. */
export function trackBookShown(productGid: string, orderable: boolean): void {
  const id = analyticsProductId(productGid);
  if (id === undefined) {
    reportDropped('view_book', 'product_id');
    return;
  }
  trackViewBook({ product_id: id, available: orderable });
}

/** An age group or a series was chosen on Browse: the collection is viewed and the filter set. */
export function trackGroupChosen(kind: GroupFilterType, collectionGid: string): void {
  const id = analyticsCollectionId(collectionGid);
  trackCollectionShown(collectionGid);
  sendFilter(id === undefined ? undefined : { filter_type: kind, value: id });
}

export function trackGenreChosen(taxonomyValueGid: string | null): void {
  const value = genreCode(taxonomyValueGid);
  sendFilter(value === undefined ? undefined : { filter_type: 'genre', value });
}

export function trackPriceChosen(max: number | null): void {
  const value = priceCode(max);
  sendFilter(value === undefined ? undefined : { filter_type: 'price', value });
}

export function trackAvailableChanged(available: boolean): void {
  sendFilter({ filter_type: 'available', value: available ? 'on' : 'off' });
}

export function trackSortChosen(sort: BookSort): void {
  const value = sortCode(sort);
  sendFilter(value === undefined ? undefined : { filter_type: 'sort', value });
}

/** "Clear" on Browse: one event, not one for each choice it resets (D-107). */
export function trackFiltersCleared(): void {
  sendFilter({ filter_type: 'clear', value: 'all' });
}
