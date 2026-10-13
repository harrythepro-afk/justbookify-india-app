/**
 * Catalogue reads for the book card (P6-02): a collection's books, page by page, by handle
 * (D-068), and one book by handle for the development preview; and for Home (P6-03), the handles
 * of every published collection; and for Browse (P6-04), a collection's books with "Available
 * now" and a sort, all books included: since P6-07 they are the collection that holds every book
 * (D-100); and for the book page (P6-05), one book with its description and genres; and for
 * search (P6-06), one page of the books matching a term; and for the Genre filter (P6-07), a
 * collection's genre values and the store's genre entries (D-101, D-102). All go through the
 * Storefront client (D-056), are typed by code generation (D-054) and select no personal field and
 * no rating (D-073, D-092).
 *
 * The four book operations select the same product fields (BookPage adds its own). They cannot
 * share a fragment, because an operation holds no `${}` interpolation (D-054); `toBookCard` takes
 * the CollectionBooks product type, so the type check fails if BookCardByHandle, SearchBooks or
 * BookPage stops matching it.
 */

import { reportUnexpectedDataError } from '@/crashReporting/sentry';
import { BROWSE_CONTENT, getStoreConfig, type BookSort, type SearchSort } from '@/config';

import { storeLocale, toBookCard, type BookCard, type BookCardProduct } from './bookCard';
import { toBookPage, type BookPage } from './bookPage';
import { storefrontQuery } from './client';
import type { CollectionHandlesQuery, GenreEntriesQuery } from './generated/storefront.generated';
import type { GenreEntry, GenreFilter, GenreFilterValue } from './genres';
import { collectionSort, searchSort } from './sort';

/** Books per page. `junior-readers` (26 books) takes two pages. */
export const CATALOGUE_PAGE_SIZE = 20;

export const COLLECTION_BOOKS_QUERY = `#graphql
query CollectionBooks(
  $handle: String!
  $first: Int!
  $after: String
  $sortKey: ProductCollectionSortKeys
  $reverse: Boolean
  $filters: [ProductFilter!]
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    id
    title
    products(
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      filters: $filters
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        vendor
        featuredImage {
          url(transform: { maxWidth: 600 })
          width
          height
          altText
        }
        variants(first: 1) {
          nodes {
            id
            availableForSale
            currentlyNotInStock
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
}` as const;

/**
 * The books matching a search term (P6-06, D-096): Storefront's `search`, books only (no articles
 * or pages), with a partial match on the last word as on the website (`prefix: LAST`), 20 at a
 * time, and Shopify's `totalCount` for the count line. `$unavailableProducts` is LAST with
 * "Available now" off (rented-out books after the others; with a price sort only among books of
 * the same price, D-096) and HIDE with it on: exactly the `availableForSale` books, checked on the
 * development store (`npm run check:dev-store`). The term is only ever a variable.
 */
export const SEARCH_BOOKS_QUERY = `#graphql
query SearchBooks(
  $query: String!
  $first: Int!
  $after: String
  $sortKey: SearchSortKeys
  $reverse: Boolean
  $unavailableProducts: SearchUnavailableProductsType
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  search(
    query: $query
    types: [PRODUCT]
    prefix: LAST
    first: $first
    after: $after
    sortKey: $sortKey
    reverse: $reverse
    unavailableProducts: $unavailableProducts
  ) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      __typename
      ... on Product {
        id
        handle
        title
        vendor
        featuredImage {
          url(transform: { maxWidth: 600 })
          width
          height
          altText
        }
        variants(first: 1) {
          nodes {
            id
            availableForSale
            currentlyNotInStock
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
}` as const;

export const BOOK_CARD_BY_HANDLE_QUERY = `#graphql
query BookCardByHandle($handle: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  product(handle: $handle) {
    id
    handle
    title
    vendor
    featuredImage {
      url(transform: { maxWidth: 600 })
      width
      height
      altText
    }
    variants(first: 1) {
      nodes {
        id
        availableForSale
        currentlyNotInStock
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
}` as const;

/**
 * One book's page (P6-05, D-090): the card's fields, a larger cover, the description as HTML
 * (shown as native text, D-091) and the genre labels. The genre metafield holds `shopify--genre`
 * metaobjects, whose `label` field is the name the website shows. No rating (D-092), and no
 * language, publisher, pages, binding or ISBN (owner, answer 1).
 */
export const BOOK_PAGE_QUERY = `#graphql
query BookPage($handle: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  product(handle: $handle) {
    id
    handle
    title
    vendor
    descriptionHtml
    featuredImage {
      url(transform: { maxWidth: 1200 })
      width
      height
      altText
    }
    variants(first: 1) {
      nodes {
        id
        availableForSale
        currentlyNotInStock
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
    genre: metafield(namespace: "shopify", key: "genre") {
      references(first: 10) {
        nodes {
          ... on Metaobject {
            type
            label: field(key: "label") {
              value
            }
          }
        }
      }
    }
  }
}` as const;

/** The largest page Shopify allows. One page is expected; the loop follows `pageInfo` anyway. */
const COLLECTION_HANDLES_PAGE_SIZE = 250;

/**
 * The handle of every collection published to the app's channel, so Home shows only tiles that
 * lead somewhere (D-076). Storefront's `collections(query:)` cannot filter by handle, so one
 * listing is the fewest requests. Handles and IDs only: no title and no image (owner, P6-03); the
 * ID is what analytics sends for a chosen or matched collection (P6-09, D-107).
 */
export const COLLECTION_HANDLES_QUERY = `#graphql
query CollectionHandles(
  $first: Int!
  $after: String
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  collections(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      handle
    }
  }
}` as const;

/**
 * The values of a collection's Genre filter (P6-07, D-101): only the filter's id and each value's
 * count and input. Shopify's own value labels are its built-in names, which the app never shows
 * (D-102), so they are not read. `$filters` holds "Available now" when it is on, so the counts
 * are those of the current list; a chosen genre is never sent here.
 */
export const COLLECTION_GENRES_QUERY = `#graphql
query CollectionGenres(
  $handle: String!
  $filters: [ProductFilter!]
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    products(first: 1, filters: $filters) {
      filters {
        id
        values {
          count
          input
        }
      }
    }
  }
}` as const;

/** The largest page Shopify allows. One page is expected; the loop follows `pageInfo` anyway. */
const GENRE_ENTRIES_PAGE_SIZE = 250;

/**
 * The store's genre entries (P6-07, D-102): each one's `label`, the name the app shows, and its
 * `taxonomy_reference`, the taxonomy value the Genre filter gives. Checked on the development
 * store: the public token can list them (gate f, 8 October 2026).
 */
export const GENRE_ENTRIES_QUERY = `#graphql
query GenreEntries(
  $type: String!
  $first: Int!
  $after: String
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  metaobjects(type: $type, first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      label: field(key: "label") {
        value
      }
      taxonomyReference: field(key: "taxonomy_reference") {
        value
      }
    }
  }
}` as const;

/**
 * How a Browse or collection list is read (D-085, D-086, D-101, D-104). `available` is "Available
 * now": Shopify's `availableForSale`, so books orderable at zero stock are included. `genre` is the
 * chosen genre's filter, or null for all genres. `maxPrice` is the chosen price's maximum in the
 * store's currency (the rental price, inclusive), or null for all prices.
 */
export type BookListOptions = {
  readonly available: boolean;
  readonly sort: BookSort;
  readonly genre: GenreFilter | null;
  readonly maxPrice: number | null;
};

/** How a search is read (D-096): "Available now" and the sort. */
export type SearchOptions = { readonly available: boolean; readonly sort: SearchSort };

/** One page of a search. */
export type SearchBooksPage = {
  readonly books: readonly BookCard[];
  /** Shopify's count of every matching book, up to 1,000. */
  readonly totalCount: number;
  /** The cursor for the next page, or null on the last page. */
  readonly nextCursor: string | null;
};

export type CollectionBooksPage =
  | {
      readonly kind: 'found';
      /** The collection's GID, for analytics (P6-09, D-107). */
      readonly id: string;
      readonly title: string;
      readonly books: readonly BookCard[];
      /** The cursor for the next page, or null on the last page. */
      readonly nextCursor: string | null;
    }
  | { readonly kind: 'not-found' };

/**
 * A collection's Genre filter values, with the store's locale (D-058) that their names are sorted
 * in; `not-found` when the collection is missing.
 */
export type CollectionGenres =
  | {
      readonly kind: 'found';
      readonly values: readonly GenreFilterValue[];
      readonly locale: string;
    }
  | { readonly kind: 'not-found' };

const BOOK_WITHOUT_VARIANT = 'catalogue/book-without-variant';
// Configuration names a collection that holds every book (D-100); the store must have it.
const ALL_BOOKS_MISSING = 'catalogue/all-books-missing';
const reportedFaults = new Set<string>();

/** Reports a catalogue data fault by code only, once per session (D-061). */
export function reportCatalogueFaultOnce(code: string): void {
  if (reportedFaults.has(code)) return;
  reportedFaults.add(code);
  reportUnexpectedDataError(code);
}

/**
 * Shopify gives every product at least one variant, so a book without one is a data fault. It is
 * left out of the list and reported once per session, by code only.
 */
function cardOrNothing(product: BookCardProduct): BookCard[] {
  const card = toBookCard(product, getStoreConfig());
  if (card !== null) return [card];
  reportCatalogueFaultOnce(BOOK_WITHOUT_VARIANT);
  return [];
}

/** For tests: lets the once-per-session reports fire again. */
export function resetCatalogueReportsForTests(): void {
  reportedFaults.clear();
}

/**
 * The filters for a list: the chosen genre, the chosen price (a maximum only, so Shopify's minimum
 * stays 0; D-104), then "Available now"; null when none is on.
 */
function listFilters(list: BookListOptions) {
  const filters = [
    ...(list.genre === null ? [] : [{ taxonomyMetafield: list.genre }]),
    ...(list.maxPrice === null ? [] : [{ price: { max: list.maxPrice } }]),
    ...(list.available ? [{ available: true }] : []),
  ];
  return filters.length === 0 ? null : filters;
}

/**
 * One page of a collection's books, by handle. A collection that does not exist (or is not
 * published to the app's channel) is `not-found`, not an error; for the collection that holds
 * every book (D-100) it is also reported once, because configuration names it. Without `list`,
 * every book in the collection's own order (Home's New arrivals, the development preview); with
 * it, the sort, "Available now", the genre and the price (D-085, D-086, D-101, D-104). `signal`
 * cancels the call;
 * the query cache passes its own (D-061).
 */
export async function fetchCollectionBooksPage(options: {
  readonly handle: string;
  readonly after: string | null;
  readonly list?: BookListOptions;
  readonly signal?: AbortSignal;
}): Promise<CollectionBooksPage> {
  const { list } = options;
  const data = await storefrontQuery(COLLECTION_BOOKS_QUERY, {
    variables: {
      handle: options.handle,
      first: CATALOGUE_PAGE_SIZE,
      after: options.after,
      ...(list === undefined
        ? {}
        : {
            ...collectionSort(list.sort),
            filters: listFilters(list),
          }),
    },
    signal: options.signal,
  });
  const collection = data.collection;
  if (collection === null || collection === undefined) {
    if (options.handle === BROWSE_CONTENT.allBooksHandle) {
      reportCatalogueFaultOnce(ALL_BOOKS_MISSING);
    }
    return { kind: 'not-found' };
  }
  const { pageInfo, nodes } = collection.products;
  return {
    kind: 'found',
    id: collection.id,
    title: collection.title,
    books: nodes.flatMap(cardOrNothing),
    nextCursor: pageInfo.hasNextPage ? (pageInfo.endCursor ?? null) : null,
  };
}

/**
 * One page of the books matching `term` (P6-06, D-096), which the caller has already cleaned
 * (`cleanSearchTerm`). Only books are kept, should Shopify send anything else.
 */
export async function fetchSearchPage(options: {
  readonly term: string;
  readonly after: string | null;
  readonly search: SearchOptions;
  readonly signal?: AbortSignal;
}): Promise<SearchBooksPage> {
  const { search } = options;
  const data = await storefrontQuery(SEARCH_BOOKS_QUERY, {
    variables: {
      query: options.term,
      first: CATALOGUE_PAGE_SIZE,
      after: options.after,
      ...searchSort(search.sort),
      unavailableProducts: search.available ? 'HIDE' : 'LAST',
    },
    signal: options.signal,
  });
  const { pageInfo, nodes, totalCount } = data.search;
  return {
    books: nodes.flatMap((node) => (node.__typename === 'Product' ? cardOrNothing(node) : [])),
    totalCount,
    nextCursor: pageInfo.hasNextPage ? (pageInfo.endCursor ?? null) : null,
  };
}

/**
 * Every collection the app's channel can read: each handle with the collection's GID. `signal`
 * cancels the listing.
 */
export async function fetchCollectionHandles(options: {
  readonly signal?: AbortSignal;
}): Promise<ReadonlyMap<string, string>> {
  const handles = new Map<string, string>();
  let after: string | null = null;
  for (;;) {
    const data: CollectionHandlesQuery = await storefrontQuery(COLLECTION_HANDLES_QUERY, {
      variables: { first: COLLECTION_HANDLES_PAGE_SIZE, after },
      signal: options.signal,
    });
    const { pageInfo, nodes } = data.collections;
    for (const node of nodes) handles.set(node.handle, node.id);
    const next = pageInfo.endCursor ?? null;
    if (!pageInfo.hasNextPage || next === null) return handles;
    after = next;
  }
}

/** One book's card, by handle, or null when no such book is published to the app's channel. */
export async function fetchBookCard(options: {
  readonly handle: string;
  readonly signal?: AbortSignal;
}): Promise<BookCard | null> {
  const data = await storefrontQuery(BOOK_CARD_BY_HANDLE_QUERY, {
    variables: { handle: options.handle },
    signal: options.signal,
  });
  const product = data.product;
  if (product === null || product === undefined) return null;
  return cardOrNothing(product)[0] ?? null;
}

/**
 * One book's page, by handle (P6-05), or null when no such book is published to the app's
 * channel. A book without a variant is a data fault: reported once per session, like the card,
 * and shown as not available.
 */
export async function fetchBook(options: {
  readonly handle: string;
  readonly signal?: AbortSignal;
}): Promise<BookPage | null> {
  const data = await storefrontQuery(BOOK_PAGE_QUERY, {
    variables: { handle: options.handle },
    signal: options.signal,
  });
  const product = data.product;
  if (product === null || product === undefined) return null;
  const page = toBookPage(product, getStoreConfig());
  if (page === null) reportCatalogueFaultOnce(BOOK_WITHOUT_VARIANT);
  return page;
}

/**
 * A collection's Genre filter values (P6-07, D-101), for the list with "Available now" on or off.
 * A collection without the filter gives no values; one that does not exist is `not-found`.
 */
export async function fetchCollectionGenres(options: {
  readonly handle: string;
  readonly available: boolean;
  readonly signal?: AbortSignal;
}): Promise<CollectionGenres> {
  const data = await storefrontQuery(COLLECTION_GENRES_QUERY, {
    variables: {
      handle: options.handle,
      filters: options.available ? [{ available: true }] : null,
    },
    signal: options.signal,
  });
  const collection = data.collection;
  if (collection === null || collection === undefined) return { kind: 'not-found' };
  const genre = collection.products.filters.find(
    (filter) => filter.id === BROWSE_CONTENT.genre.filterId,
  );
  return {
    kind: 'found',
    values: (genre?.values ?? []).map(({ count, input }) => ({ count, input })),
    // Read here, not while a screen draws, so a configuration fault is a failed read.
    locale: storeLocale(getStoreConfig()),
  };
}

/** Every genre entry of the store (P6-07, D-102), following `pageInfo`. */
export async function fetchGenreEntries(options: {
  readonly signal?: AbortSignal;
}): Promise<readonly GenreEntry[]> {
  const entries: GenreEntry[] = [];
  let after: string | null = null;
  for (;;) {
    const data: GenreEntriesQuery = await storefrontQuery(GENRE_ENTRIES_QUERY, {
      variables: { type: BROWSE_CONTENT.genre.entryType, first: GENRE_ENTRIES_PAGE_SIZE, after },
      signal: options.signal,
    });
    const { pageInfo, nodes } = data.metaobjects;
    for (const node of nodes) {
      entries.push({
        label: node.label?.value ?? null,
        taxonomyReference: node.taxonomyReference?.value ?? null,
      });
    }
    const next = pageInfo.endCursor ?? null;
    if (!pageInfo.hasNextPage || next === null) return entries;
    after = next;
  }
}
