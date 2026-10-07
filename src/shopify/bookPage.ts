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

export type BookPage = BookCard & {
  /** The description as blocks of native text; empty when the product has none. */
  readonly description: readonly RichTextBlock[];
  /** Genre names, as the website shows them, in Shopify's order; empty when there are none. */
  readonly genres: readonly string[];
};

/** The metaobject type behind `shopify.genre`. */
const GENRE_TYPE = 'shopify--genre';

/**
 * The genre labels. A reference that is not a genre metaobject (a node of another type comes
 * back as an empty object), or has no label, is skipped; repeated labels show once.
 */
export function genreLabels(genre: BookPageProduct['genre']): string[] {
  const labels: string[] = [];
  for (const node of genre?.references?.nodes ?? []) {
    if (node?.type !== GENRE_TYPE) continue;
    const label = node.label?.value?.trim() ?? '';
    if (label !== '' && !labels.includes(label)) labels.push(label);
  }
  return labels;
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
    genres: genreLabels(product.genre),
  };
}
