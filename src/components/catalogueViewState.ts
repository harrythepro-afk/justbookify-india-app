import { StorefrontError } from '@/shopify/errors';

/**
 * What a catalogue screen, or one of its sections, shows (D-078): its data, a loading
 * indicator, the offline message with "Try again", or the general error with "Try again".
 */
export type CatalogueViewState = 'ready' | 'loading' | 'offline' | 'error';

/** True for a failure that means the phone could not reach Shopify at all. */
function isNoNetwork(error: unknown): boolean {
  return error instanceof StorefrontError && error.kind === 'no-network';
}

/**
 * Data on screen always wins: saved books stay visible offline and after a failed refetch. With
 * nothing to show, a fetch in progress is loading. Otherwise the phone being offline, or a
 * request that could not reach Shopify (the offline signal can be wrong, D-064), is offline, and
 * any other failure is an error. A query paused by TanStack offline is not fetching.
 */
export function catalogueViewState(input: {
  readonly hasData: boolean;
  readonly isFetching: boolean;
  readonly isOffline: boolean;
  readonly error: unknown;
}): CatalogueViewState {
  if (input.hasData) return 'ready';
  if (input.isFetching) return 'loading';
  if (input.isOffline || isNoNetwork(input.error)) return 'offline';
  if (input.error !== null && input.error !== undefined) return 'error';
  return 'loading';
}

/** Whether to show the thin offline notice above saved data (D-078). */
export function showsOfflineNotice(input: {
  readonly hasData: boolean;
  readonly isOffline: boolean;
  readonly error: unknown;
}): boolean {
  return input.hasData && (input.isOffline || isNoNetwork(input.error));
}
