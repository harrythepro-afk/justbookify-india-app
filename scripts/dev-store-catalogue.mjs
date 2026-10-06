// The development store's sample catalogue, as the architect loaded it on 7 October 2026 (D-069),
// seen through the Storefront API with the Headless channel's public token. Read by
// scripts/check-dev-store.mjs. Data only. The same facts are in docs/TESTING.md ("Sample
// catalogue (P6-01)"); change both together, and only when the development store changes.

// 3 older test products plus 39 of the 40 sample books. The 40th is a draft.
export const VISIBLE_PRODUCT_COUNT = 42;

// A draft: it must never reach the Headless channel.
export const DRAFT_HANDLE = 'the-giraffe-and-the-pelly-and-me';

// Storefront counts. The Admin API shows one more in emerging-readers, junior-readers and
// roald-dahl, because it also counts the draft.
export const COLLECTION_COUNTS = {
  'early-readers': 5,
  'emerging-readers': 22,
  'junior-readers': 26,
  'pre-teen-readers': 16,
  'teenage-readers': 8,
  'harry-potter-series': 4,
  'wimpy-kid-series': 4,
  'geronimo-stilton': 3,
  'my-hero-academia': 3,
  'secret-seven-series': 4,
  'read-it-yourself': 2,
  'manga-collections': 3,
  'cat-kid-comic-club': 3,
  'roald-dahl': 3,
  'ruskin-bond': 3,
  'enid-blyton': 4,
  'jeff-kinney': 4,
  'sudha-murthy': 2,
  'j-k-rowling': 7,
  'julia-donaldson': 3,
  'new-arrivals': 5,
  'tintin-series': 0,
  frontpage: 1,
};

// All 42 visible products. "orderableAtZero" is stock 0 with "continue selling" on.
export const AVAILABILITY_COUNTS = { inStock: 21, rentedOut: 13, orderableAtZero: 8 };

export const NO_COVER_HANDLES = [
  'ruskin-bond-great-stories-for-children',
  'peter-and-the-wolf-read-it-yourself',
  'harry-potter',
  'harry-potter-the-sorcerer-stone',
  'harry-potter-and-the-chamber-of-secrets',
];

// One fixed book per case, so phone checks have a known book to open.
export const EXAMPLES = {
  inStock: 'the-diary-of-a-wimpy-kid-no-brainer',
  rentedOut: 'the-gruffalo',
  orderableAtZero: 'harry-potter-and-the-deathly-hallows-book-7',
  // Stock above 0 with "continue selling" on: still in stock.
  inStockContinueSelling: 'sudha-murty-three-thousand-stitches',
  noCover: 'peter-and-the-wolf-read-it-yourself',
  hardcover: 'cat-kid-comic-club-on-purpose',
  missingPagesAndIsbn: 'jujutsu-kaisen-0',
  // Every metafield below except shopify.target-audience, plus a rating with a count.
  allMetafields: 'harry-potter-and-the-half-blood-prince-book-6',
  ratingWithoutCount: 'harry-potter-and-the-philosophers-stone-by-j-k-rowling',
};

// Every product metafield the app may read. No book uses shopify.target-audience.
export const METAFIELDS = [
  { namespace: 'shopify', key: 'genre', metaobjectType: 'shopify--genre' },
  { namespace: 'shopify', key: 'language-version', metaobjectType: 'shopify--language-version' },
  { namespace: 'shopify', key: 'book-cover-type', metaobjectType: 'shopify--book-cover-type' },
  {
    namespace: 'shopify',
    key: 'target-audience',
    metaobjectType: 'shopify--target-audience',
    unused: true,
  },
  { namespace: 'custom', key: 'publisher' },
  { namespace: 'custom', key: 'language' },
  { namespace: 'custom', key: 'net_quantity' },
  { namespace: 'custom', key: 'pages' },
  { namespace: 'custom', key: 'service_city' },
  { namespace: 'custom', key: 'isbn_13' },
  { namespace: 'reviews', key: 'rating' },
  { namespace: 'reviews', key: 'rating_count' },
];
