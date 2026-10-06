/**
 * How long cached data counts as fresh (`staleTime`) and how long unused data is kept
 * (`gcTime`), as named presets (D-062). Every query uses one of these; `catalogue` is the
 * default. The cache is in memory only (D-059), so nothing outlives the app run.
 */

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export type FreshnessPreset = {
  readonly staleTime: number;
  readonly gcTime: number;
  /** 'always' refetches whenever a screen using the query opens, even if the data is fresh. */
  readonly refetchOnMount?: 'always';
};

export const freshness = {
  /** Catalogue lists, search and collections. */
  catalogue: { staleTime: 5 * MINUTE, gcTime: 30 * MINUTE },
  /**
   * A single book's page and anything showing cart contents. Most books have one copy, so
   * availability goes stale quickly.
   */
  liveStock: { staleTime: 30 * SECOND, gcTime: 5 * MINUTE, refetchOnMount: 'always' },
  /** Policies, FAQ and other content that rarely changes. */
  staticContent: { staleTime: 6 * HOUR, gcTime: 24 * HOUR },
  /** Checkout always reads fresh from Shopify and never from the cache. */
  checkout: { staleTime: 0, gcTime: 0, refetchOnMount: 'always' },
} as const satisfies Record<string, FreshnessPreset>;
