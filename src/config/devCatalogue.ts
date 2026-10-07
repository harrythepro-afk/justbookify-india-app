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

/** A handle no book has, so the book page's "not available" message can be opened (P6-05). */
export const DEV_MISSING_BOOK_HANDLE = 'no-such-book-p6-05';

/**
 * A description shaped like the live store's (architect, 8 October 2026; D-094): bold headings,
 * "•" lines and ✅ and ❌ lines in `p`, `br`, `strong` and `span`, with an entity and a link
 * that must show as plain text. Our own wording. The sample books' descriptions are short and
 * plain, so the development preview shows this one through the book page's parser.
 */
export const DEV_DESCRIPTION_SAMPLE_HTML = `<p><span style="font-weight: 400;">A gentle story about a small fox who learns to share the forest with everyone &amp; everything in it.</span></p>
<p><strong>Perfect for readers, who:</strong><br>• Enjoy animal stories with a warm ending<br>• Are starting to read longer chapters on their own<br>• Like pictures on every few pages</p>
<p><strong>Why You'll Love It:</strong><br>✅ Short chapters, ideal for bedtime<br>✅ Simple words with a few new ones to learn<br>❌ Not a book of facts about real foxes</p>
<p>More in the <a href="https://example.com/fox-series">Fox series</a>.</p>`;
