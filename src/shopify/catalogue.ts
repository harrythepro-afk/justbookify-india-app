/**
 * Catalogue reads for the book card (P6-02): a collection's books, page by page, by handle
 * (D-068), and one book by handle for the development preview; and for Home (P6-03), the handles
 * of every published collection; and for Browse (P6-04), all books, page by page, through the root
 * `products` query (D-083), and a collection's books with "Available now" and a sort. All go through the Storefront client (D-056), are typed by code
 * generation (D-054) and select no personal field and no rating (the card shows none, D-073).
 *
 * The three book operations select the same product fields. They cannot share a fragment, because
 * an operation holds no `${}` interpolation (D-054); `toBookCard` takes the CollectionBooks product
 * type, so the type check fails if BookCardByHandle or AllBooks stops matching it.
 */

import { reportUnexpectedDataError } from '@/crashReporting/sentry';
import { getStoreConfig, type BookSort } from '@/config';

import { toBookCard, type BookCard, type BookCardProduct } from './bookCard';
import { storefrontQuery } from './client';
import type { CollectionHandlesQuery } from './generated/storefront.generated';
import { allBooksSort, collectionSort } from './sort';

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
  if (!reportedBookWithoutVariant) {
    reportedBookWithoutVariant = true;
    reportUnexpectedDataError(BOOK_WITHOUT_VARIANT);
  }
  return [];
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
