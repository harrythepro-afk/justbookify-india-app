/**
 * The catalogue's usage events (P6-09, D-107, D-108): for each event, nothing is sent without
 * consent; with consent every value is an ID or a code; and the guard drops an event with a bad
 * value, telling Sentry the event and parameter only.
 */

import {
  genreCode,
  priceCode,
  sortCode,
  trackAvailableChanged,
  trackBookShown,
  trackCollectionShown,
  trackFiltersCleared,
  trackGenreChosen,
  trackGroupChosen,
  trackPriceChosen,
  trackSortChosen,
} from '@/analytics/catalogueEvents';
import { trackFilterApplied, trackSearch, type FilterAppliedParams } from '@/analytics/events';
import { analyticsCollectionId, analyticsToken, type AnalyticsCollectionId } from '@/analytics/ids';
import { BROWSE_CONTENT, type BookSort } from '@/config';

let mockGranted = true;
const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());
const mockReportProblem = jest.fn();

jest.mock('@/analytics/consent', () => ({
  isAnalyticsConsentGranted: () => mockGranted,
}));

jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: () => Promise.resolve(),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportAnalyticsProblem: (problem: string) => mockReportProblem(problem),
}));

const COLLECTION = 'gid://shopify/Collection/412345678901';
const PRODUCT = 'gid://shopify/Product/8123456789012';
const MANGA = 'gid://shopify/TaxonomyValue/15730';

/** An ID or one of the app's codes: what every sent value must be. */
const ID_OR_CODE = /^(\d{1,20}|[a-z][a-z0-9_]{0,39})$/;

const EVERY_EVENT: readonly [string, () => void][] = [
  ['view_collection', () => trackCollectionShown(COLLECTION)],
  ['view_book', () => trackBookShown(PRODUCT, true)],
  ['filter_applied (age group)', () => trackGroupChosen('age_group', COLLECTION)],
  ['filter_applied (series)', () => trackGroupChosen('series', COLLECTION)],
  ['filter_applied (genre)', () => trackGenreChosen(MANGA)],
  ['filter_applied (all genres)', () => trackGenreChosen(null)],
  ['filter_applied (price)', () => trackPriceChosen(49)],
  ['filter_applied (all prices)', () => trackPriceChosen(null)],
  ['filter_applied (available)', () => trackAvailableChanged(false)],
  ['filter_applied (sort)', () => trackSortChosen('price-descending')],
  ['filter_applied (clear)', () => trackFiltersCleared()],
  ['search (other)', () => trackSearch({ term_length: 5, result_count: 0, match_type: 'other' })],
  [
    'search (series)',
    () =>
      trackSearch({
        term_length: 5,
        result_count: 7,
        match_type: 'series',
        match_id: analyticsCollectionId(COLLECTION) as AnalyticsCollectionId,
      }),
  ],
];

beforeEach(() => {
  mockGranted = true;
  mockSendEvent.mockClear();
  mockReportProblem.mockClear();
});

describe('consent (D-048)', () => {
  it.each(EVERY_EVENT)('sends nothing for %s without consent', (_name, send) => {
    mockGranted = false;
    send();
    expect(mockSendEvent).not.toHaveBeenCalled();
    expect(mockReportProblem).not.toHaveBeenCalled();
  });

  it.each(EVERY_EVENT)('sends only IDs, codes and counts for %s with consent', (_name, send) => {
    send();
    expect(mockSendEvent).toHaveBeenCalled();
    for (const [, params] of mockSendEvent.mock.calls) {
      for (const value of Object.values(params as Record<string, unknown>)) {
        if (typeof value === 'number') expect(Number.isInteger(value)).toBe(true);
        else expect(String(value)).toMatch(ID_OR_CODE);
      }
    }
  });
});

describe('what each event sends', () => {
  it('view_collection: the collection’s number', () => {
    trackCollectionShown(COLLECTION);
    expect(mockSendEvent.mock.calls).toEqual([
      ['view_collection', { collection_id: '412345678901' }],
    ]);
  });

  it('view_book: the product’s number and whether it can be ordered', () => {
    trackBookShown(PRODUCT, false);
    expect(mockSendEvent.mock.calls).toEqual([
      ['view_book', { product_id: '8123456789012', available: 'no' }],
    ]);
  });

  it('a group chosen on Browse: view_collection, then filter_applied with the same number', () => {
    trackGroupChosen('age_group', COLLECTION);
    expect(mockSendEvent.mock.calls).toEqual([
      ['view_collection', { collection_id: '412345678901' }],
      ['filter_applied', { filter_type: 'age_group', value: '412345678901' }],
    ]);
  });

  it.each([
    [() => trackGenreChosen(MANGA), { filter_type: 'genre', value: '15730' }],
    [() => trackGenreChosen(null), { filter_type: 'genre', value: 'all' }],
    [() => trackPriceChosen(34), { filter_type: 'price', value: 'up_to_34' }],
    [() => trackPriceChosen(null), { filter_type: 'price', value: 'all' }],
    [() => trackAvailableChanged(true), { filter_type: 'available', value: 'on' }],
    [() => trackAvailableChanged(false), { filter_type: 'available', value: 'off' }],
    [() => trackSortChosen('price-descending'), { filter_type: 'sort', value: 'price_descending' }],
    [() => trackFiltersCleared(), { filter_type: 'clear', value: 'all' }],
  ])('filter_applied %#', (send, params) => {
    send();
    expect(mockSendEvent.mock.calls).toEqual([['filter_applied', params]]);
  });
});

describe('codes (D-107)', () => {
  it.each(BROWSE_CONTENT.sortOptions.map((option) => option.sort))(
    'gives the sort %s a snake-case code',
    (sort: BookSort) => {
      expect(sortCode(sort)).toBe(sort.replace(/-/g, '_'));
    },
  );

  it('builds each price code from the configured maxima, never by hand', () => {
    expect(BROWSE_CONTENT.price.maxima.map(priceCode)).toEqual([
      'up_to_34',
      'up_to_49',
      'up_to_74',
    ]);
    expect(priceCode(99)).toBe('up_to_99');
    expect(priceCode(49.5)).toBe('up_to_49_5');
    expect(priceCode(null)).toBe('all');
  });

  it('gives no code for a price that is not a price', () => {
    expect(priceCode(-1)).toBeUndefined();
    expect(priceCode(Number.NaN)).toBeUndefined();
  });

  it('gives a genre its taxonomy number, never its name', () => {
    expect(genreCode(MANGA)).toBe('15730');
    expect(genreCode(null)).toBe('all');
    expect(genreCode('Manga')).toBeUndefined();
  });
});

describe('the guard (D-053, D-110)', () => {
  it.each([
    [
      'a GID that is not a collection',
      () => trackCollectionShown(PRODUCT),
      'view_collection',
      'collection_id',
    ],
    [
      'a GID that is not a product',
      () => trackBookShown(COLLECTION, true),
      'view_book',
      'product_id',
    ],
    ['a genre name', () => trackGenreChosen('Manga'), 'filter_applied', 'value'],
  ] as const)('drops %s, naming the parameter only', (_case, send, event, param) => {
    send();
    expect(mockSendEvent).not.toHaveBeenCalled();
    expect(mockReportProblem).toHaveBeenCalledWith(`dropped ${event} (${param} failed the guard)`);
    expect(JSON.stringify(mockReportProblem.mock.calls)).not.toMatch(/Manga|Product\//);
  });

  // filter_applied.value was reported above; a drop is reported once per session (D-053).
  it('drops a price that is not a price', () => {
    trackPriceChosen(Number.NaN);
    expect(mockSendEvent).not.toHaveBeenCalled();
    expect(JSON.stringify(mockReportProblem.mock.calls)).not.toMatch(/NaN/);
  });

  it.each([
    ['a store name as an age group', { filter_type: 'age_group', value: 'Up to 5 years' }],
    ['a handle as a series', { filter_type: 'series', value: 'harry-potter-series' }],
    ['an email as a sort', { filter_type: 'sort', value: 'parent@example.com' }],
    ['a phone number as a price', { filter_type: 'price', value: 'up_to_9876543210' }],
    ['a value for clear other than all', { filter_type: 'clear', value: 'on' }],
  ])('drops filter_applied with %s, even past the types', (_case, params) => {
    trackFilterApplied(params as unknown as FilterAppliedParams);
    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it.each([
    ['the term as the match', { match_type: 'author', match_id: 'Roald Dahl' }],
    ['an ID with other', { match_type: 'other', match_id: '412345678901' }],
    ['no ID for a title', { match_type: 'title' }],
    ['a code for a series', { match_type: 'series', match_id: 'harry_potter' }],
    ['an unknown type', { match_type: 'publisher', match_id: 'puffin' }],
  ])('drops search with %s, even past the types', (_case, match) => {
    trackSearch({ term_length: 5, result_count: 1, ...match } as unknown as Parameters<
      typeof trackSearch
    >[0]);
    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it('rules out a wrong pairing by type', () => {
    mockGranted = false;
    // @ts-expect-error: an age group's value is a collection ID, never a code.
    trackFilterApplied({ filter_type: 'age_group', value: 'all' });
    // @ts-expect-error: "Available now" is on or off.
    trackFilterApplied({ filter_type: 'available', value: 'yes' });
    // @ts-expect-error: other carries no match_id.
    trackSearch({ term_length: 5, result_count: 0, match_type: 'other', match_id: 'zzqxv' });
    // @ts-expect-error: a title needs its product ID.
    trackSearch({ term_length: 5, result_count: 0, match_type: 'title' });
    expect(mockSendEvent).not.toHaveBeenCalled();
  });
});

describe('the wanted match (P6-11, D-118)', () => {
  it('sends wanted with the listed name’s code', () => {
    const code = analyticsToken('david_walliams');
    if (code === undefined) throw new Error('expected a code');

    trackSearch({ term_length: 8, result_count: 0, match_type: 'wanted', match_id: code });

    expect(mockSendEvent.mock.calls).toEqual([
      [
        'search',
        { term_length: 8, result_count: 0, match_type: 'wanted', match_id: 'david_walliams' },
      ],
    ]);
  });

  it.each([
    ['the name as typed', { match_type: 'wanted', match_id: 'David Walliams' }],
    ['a collection ID', { match_type: 'wanted', match_id: '528439279891' }],
    ['no code', { match_type: 'wanted' }],
    ['a run of seven digits', { match_type: 'wanted', match_id: 'asha_9876543210' }],
    ['an email', { match_type: 'wanted', match_id: 'asha.rao@example.com' }],
  ])('drops search with wanted and %s, even past the types', (_case, match) => {
    trackSearch({ term_length: 8, result_count: 0, ...match } as unknown as Parameters<
      typeof trackSearch
    >[0]);

    expect(mockSendEvent).not.toHaveBeenCalled();
    expect(JSON.stringify(mockReportProblem.mock.calls)).not.toMatch(/walliams|asha|528439/i);
  });

  it('rules out a wrong pairing by type', () => {
    mockGranted = false;
    // @ts-expect-error: wanted needs the listed name's code.
    trackSearch({ term_length: 8, result_count: 0, match_type: 'wanted' });
    // @ts-expect-error: a code is built by analyticsToken(), never free text.
    trackSearch({ term_length: 8, result_count: 0, match_type: 'wanted', match_id: 'walliams' });
    expect(mockSendEvent).not.toHaveBeenCalled();
  });
});
