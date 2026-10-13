/**
 * What the book page shows, mapped from a Storefront product (P6-05, D-090). The card's fields
 * come from `toBookCard`, so prices and availability follow the card's rules (D-073); the page
 * adds the description as native text (D-091) and the genre labels.
 */

import type { StoreConfig } from '@/config';

import { toBookCard, type BookCard } from './bookCard';
import type { BookPageQuery } from './generated/storefront.generated';
import { parseDescriptionHtml, type RichTextBlock } from './richText';

/** One product as the BookPage operation selects it. */
export type BookPageProduct = NonNullable<BookPageQuery['product']>;

/** One of a book's genres: the name the website shows and the taxonomy value it stands for. */
export type BookGenre = {
  readonly name: string;
  /** The `taxonomy_reference`, such as `gid://shopify/TaxonomyValue/20853`; null when blank. */
  readonly taxonomyValue: string | null;
};

export type BookPage = BookCard & {
  /** The description as blocks of native text; empty when the product has none. */
  readonly description: readonly RichTextBlock[];
  /** Genres, named as the website shows them, in Shopify's order; empty when there are none. */
  readonly genres: readonly BookGenre[];
};

/** The metaobject type behind `shopify.genre`. */
const GENRE_TYPE = 'shopify--genre';

/**
 * The genres, each with its taxonomy value (P6-10, D-113). A reference that is not a genre
 * metaobject (a node of another type comes back as an empty object), or has no label, is skipped;
 * a repeated label shows once, with the first entry's value.
 */
export function bookGenres(genre: BookPageProduct['genre']): BookGenre[] {
  const genres: BookGenre[] = [];
  for (const node of genre?.references?.nodes ?? []) {
    if (node?.type !== GENRE_TYPE) continue;
    const name = node.label?.value?.trim() ?? '';
    if (name === '' || genres.some((known) => known.name === name)) continue;
    const taxonomyValue = node.taxonomyReference?.value?.trim() ?? '';
    genres.push({ name, taxonomyValue: taxonomyValue === '' ? null : taxonomyValue });
  }
  return genres;
}

/**
 * The page for one product, or null when the product has no variant. A price in another
 * currency than the store's throws, as on the card.
 */
export function toBookPage(
  product: BookPageProduct,
  config: Pick<StoreConfig, 'currencyCode' | 'language' | 'country'>,
): BookPage | null {
  const card = toBookCard(product, config);
  if (card === null) return null;
  return {
    ...card,
    description: parseDescriptionHtml(product.descriptionHtml),
    genres: bookGenres(product.genre),
  };
}
