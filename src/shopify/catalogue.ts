/**
 * Catalogue reads for the book card (P6-02): a collection's books, page by page, by handle
 * (D-068), and one book by handle for the development preview; and for Home (P6-03), the handles
 * of every published collection; and for Browse (P6-04), all books, page by page, through the root
 * `products` query (D-083), and a collection's books with "Available now" and a sort; and for the
 * book page (P6-05), one book with its description and genres; and for search (P6-06), one page
 * of the books matching a term. All go through the Storefront client (D-056), are typed by code
 * generation (D-054) and select no personal field and no rating (D-073, D-092).
 *
 * The five book operations select the same product fields (BookPage adds its own). They cannot
 * share a fragment, because an operation holds no `${}` interpolation (D-054); `toBookCard` takes
 * the CollectionBooks product type, so the type check fails if BookCardByHandle, AllBooks,
 * SearchBooks or BookPage stops matching it.
 */

import { reportUnexpectedDataError } from '@/crashReporting/sentry';
import { getStoreConfig, type BookSort, type SearchSort } from '@/config';

import { toBookCard, type BookCard, type BookCardProduct } from './bookCard';
import { toBookPage, type BookPage } from './bookPage';
import { storefrontQuery } from './client';
import type { CollectionHandlesQuery } from './generated/storefront.generated';
import { allBooksSort, collectionSort, searchSort } from './sort';

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
 * All books, for Browse with no group chosen (D-083). The store has no "all" collection (the
 * website's `/collections/all` is a virtual page), so this reads the root `products` query.
 * `$query` is `available_for_sale:true` when "Available now" is on: the same books as a
 * collection's Availability filter, Shopify's `availableForSale` (checked on the development
 * store, 29 of 42; `npm run check:dev-store`).
 */
export const ALL_BOOKS_QUERY = `#graphql
query AllBooks(
  $first: Int!
  $after: String
  $sortKey: ProductSortKeys
  $reverse: Boolean
  $query: String
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
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

/** Shopify's search syntax for "Available now" on the root `products` query (D-083). */
export const AVAILABLE_FOR_SALE_QUERY = 'available_for_sale:true';

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
 * listing is the fewest requests. Handles only: no title and no image (owner, P6-03).
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
      handle
    }
  }
}` as const;

/**
 * How a Browse or collection list is read (D-085, D-086). `available` is "Available now":
 * Shopify's `availableForSale`, so books orderable at zero stock are included.
 */
export type BookListOptions = { readonly available: boolean; readonly sort: BookSort };

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

/** One page of all books. */
export type AllBooksPage = {
  readonly books: readonly BookCard[];
  /** The cursor for the next page, or null on the last page. */
  readonly nextCursor: string | null;
};

export type CollectionBooksPage =
  | {
      readonly kind: 'found';
      readonly title: string;
      readonly books: readonly BookCard[];
      /** The cursor for the next page, or null on the last page. */
      readonly nextCursor: string | null;
    }
  | { readonly kind: 'not-found' };

const BOOK_WITHOUT_VARIANT = 'catalogue/book-without-variant';
let reportedBookWithoutVariant = false;

/**
 * Shopify gives every product at least one variant, so a book without one is a data fault. It is
 * left out of the list and reported once per session, by code only.
 */
function cardOrNothing(product: BookCardProduct): BookCard[] {
  const card = toBookCard(product, getStoreConfig());
  if (card !== null) return [card];
  reportBookWithoutVariant();
  return [];
}

function reportBookWithoutVariant(): void {
  if (reportedBookWithoutVariant) return;
  reportedBookWithoutVariant = true;
  reportUnexpectedDataError(BOOK_WITHOUT_VARIANT);
}

/** For tests: lets the once-per-session report fire again. */
export function resetCatalogueReportsForTests(): void {
  reportedBookWithoutVariant = false;
}

/**
 * One page of a collection's books, by handle. A collection that does not exist (or is not
 * published to the app's channel) is `not-found`, not an error. Without `list`, every book in
 * the collection's own order (Home's New arrivals, the development preview); with it, the sort
 * and "Available now" (D-085, D-086). `signal` cancels the call; the query cache passes its own
 * (D-061).
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
            filters: list.available ? [{ available: true }] : null,
          }),
    },
    signal: options.signal,
  });
  const collection = data.collection;
  if (collection === null || collection === undefined) return { kind: 'not-found' };
  const { pageInfo, nodes } = collection.products;
  return {
    kind: 'found',
    title: collection.title,
    books: nodes.flatMap(cardOrNothing),
    nextCursor: pageInfo.hasNextPage ? (pageInfo.endCursor ?? null) : null,
  };
}

/** One page of all books (D-083), sorted, with "Available now" on or off. Never more than a page. */
export async function fetchAllBooksPage(options: {
  readonly after: string | null;
  readonly list: BookListOptions;
  readonly signal?: AbortSignal;
}): Promise<AllBooksPage> {
  const { list } = options;
  const data = await storefrontQuery(ALL_BOOKS_QUERY, {
    variables: {
      first: CATALOGUE_PAGE_SIZE,
      after: options.after,
      ...allBooksSort(list.sort),
      query: list.available ? AVAILABLE_FOR_SALE_QUERY : null,
    },
    signal: options.signal,
  });
  const { pageInfo, nodes } = data.products;
  return {
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

/** The handles of every collection the app's channel can read. `signal` cancels the listing. */
export async function fetchCollectionHandles(options: {
  readonly signal?: AbortSignal;
}): Promise<ReadonlySet<string>> {
  const handles = new Set<string>();
  let after: string | null = null;
  for (;;) {
    const data: CollectionHandlesQuery = await storefrontQuery(COLLECTION_HANDLES_QUERY, {
      variables: { first: COLLECTION_HANDLES_PAGE_SIZE, after },
      signal: options.signal,
    });
    const { pageInfo, nodes } = data.collections;
    for (const node of nodes) handles.add(node.handle);
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
  if (page === null) reportBookWithoutVariant();
  return page;
}
