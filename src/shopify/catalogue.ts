/**
 * Catalogue reads for the book card (P6-02): a collection's books, page by page, by handle
 * (D-068), and one book by handle for the development preview. Both go through the Storefront
 * client (D-056), are typed by code generation (D-054) and select no personal field and no
 * rating (the card shows none, D-073).
 *
 * The two operations select the same product fields. They cannot share a fragment, because an
 * operation holds no `${}` interpolation (D-054); `toBookCard` takes the CollectionBooks product
 * type, so the type check fails if BookCardByHandle stops matching it.
 */

import { reportUnexpectedDataError } from '@/crashReporting/sentry';
import { getStoreConfig } from '@/config';

import { toBookCard, type BookCard, type BookCardProduct } from './bookCard';
import { storefrontQuery } from './client';

/** Books per page. `junior-readers` (26 books) takes two pages. */
export const CATALOGUE_PAGE_SIZE = 20;

export const COLLECTION_BOOKS_QUERY = `#graphql
query CollectionBooks(
  $handle: String!
  $first: Int!
  $after: String
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    title
    products(first: $first, after: $after) {
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
 * published to the app's channel) is `not-found`, not an error. `signal` cancels the call; the
 * query cache passes its own (D-061).
 */
export async function fetchCollectionBooksPage(options: {
  readonly handle: string;
  readonly after: string | null;
  readonly signal?: AbortSignal;
}): Promise<CollectionBooksPage> {
  const data = await storefrontQuery(COLLECTION_BOOKS_QUERY, {
    variables: { handle: options.handle, first: CATALOGUE_PAGE_SIZE, after: options.after },
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
