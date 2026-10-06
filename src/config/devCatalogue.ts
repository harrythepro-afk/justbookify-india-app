/**
 * The development store's named example books (`TESTING.md`, "Sample catalogue (P6-01)") and
 * the collection the book card preview pages through (P6-02, D-074). Development builds only:
 * these handles belong to the development store's sample catalogue, not to a customer screen.
 */

export type DevCatalogueExample = { readonly label: string; readonly handle: string };

export const DEV_CATALOGUE_EXAMPLES: readonly DevCatalogueExample[] = [
  { label: 'In stock', handle: 'the-diary-of-a-wimpy-kid-no-brainer' },
  { label: 'Rented out', handle: 'the-gruffalo' },
  { label: 'Orderable at zero stock', handle: 'harry-potter-and-the-deathly-hallows-book-7' },
  { label: 'In stock, continue selling on', handle: 'sudha-murty-three-thousand-stitches' },
  { label: 'No cover', handle: 'peter-and-the-wolf-read-it-yourself' },
  { label: 'Hardcover', handle: 'cat-kid-comic-club-on-purpose' },
  { label: 'Missing pages and ISBN', handle: 'jujutsu-kaisen-0' },
  { label: 'Every metafield', handle: 'harry-potter-and-the-half-blood-prince-book-6' },
  {
    label: 'Rating without a count',
    handle: 'harry-potter-and-the-philosophers-stone-by-j-k-rowling',
  },
];

/** 26 books on the development store, so two pages of 20. */
export const DEV_CATALOGUE_COLLECTION = 'junior-readers';
