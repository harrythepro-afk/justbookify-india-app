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
  // P6-07 (D-100): the automated collection that holds every visible book (price greater than 0),
  // added by the owner on 8 October 2026. Browse reads it when no group is chosen.
  'all-books': 42,
};

// All 42 visible products. "orderableAtZero" is stock 0 with "continue selling" on.
export const AVAILABILITY_COUNTS = { inStock: 21, rentedOut: 13, orderableAtZero: 8 };

// "Available now" (P6-04; since P6-07 read from the all-books collection, D-100): a collection's
// Availability filter (filters: [{ available: true }]) must return exactly the in-stock and
// orderable-at-zero products. All books: 21 + 8 = 29 of 42. junior-readers: 21 of 26 (P6-01's
// probe counted 21 "In stock" there).
export const AVAILABLE_PRODUCT_COUNT =
  AVAILABILITY_COUNTS.inStock + AVAILABILITY_COUNTS.orderableAtZero;
export const ALL_BOOKS_HANDLE = 'all-books';
export const AVAILABLE_FILTER_COLLECTION = { handle: 'junior-readers', count: 21 };

// The Genre filter (P6-07, D-101, D-102), after the development store changes of 8 October 2026
// (Genre filter switched on; the five custom genres re-based on the live store's values).
export const GENRE_FILTER = {
  id: 'filter.v.t.shopify.genre',
  label: 'Genre',
  type: 'LIST',
  entryType: 'shopify--genre',
};

// Every value on all-books: the taxonomy value, Shopify's filter label (its built-in name), the
// store's name (the genre entry's label, which the app shows), and the number of books without
// and with "Available now". Shopify's label differs from the store's for the five custom genres.
export const GENRES = [
  {
    taxonomyValue: 15724,
    filterLabel: 'Action & adventure',
    storeName: 'Action & adventure',
    count: 16,
    available: 12,
  },
  {
    taxonomyValue: 15726,
    filterLabel: 'Biography',
    storeName: 'Biography',
    count: 1,
    available: 1,
  },
  {
    taxonomyValue: 15727,
    filterLabel: 'Children',
    storeName: 'Picture book',
    count: 3,
    available: 1,
  },
  {
    taxonomyValue: 15728,
    filterLabel: 'Comics & graphic novels',
    storeName: 'Comics & graphic novels',
    count: 3,
    available: 3,
  },
  {
    taxonomyValue: 15729,
    filterLabel: 'Crime & mystery',
    storeName: 'Crime & mystery',
    count: 4,
    available: 3,
  },
  { taxonomyValue: 15730, filterLabel: 'Design', storeName: 'Manga', count: 4, available: 2 },
  {
    taxonomyValue: 15731,
    filterLabel: 'Documentary',
    storeName: 'Non-fiction',
    count: 1,
    available: 1,
  },
  {
    taxonomyValue: 15732,
    filterLabel: 'Drama',
    storeName: 'Realistic fiction',
    count: 14,
    available: 9,
  },
  { taxonomyValue: 15733, filterLabel: 'Family', storeName: 'Fairy tale', count: 2, available: 1 },
  { taxonomyValue: 20853, filterLabel: 'Fantasy', storeName: 'Fantasy', count: 13, available: 10 },
  {
    taxonomyValue: 15741,
    filterLabel: 'Humor & comedy',
    storeName: 'Humor & comedy',
    count: 13,
    available: 12,
  },
];

// A group's Genre list: the store's names the app shows, A-Z, with "Available now" off.
export const GROUP_GENRES = {
  handle: 'junior-readers',
  storeNames: [
    'Action & adventure',
    'Biography',
    'Comics & graphic novels',
    'Crime & mystery',
    'Fantasy',
    'Humor & comedy',
    'Non-fiction',
    'Realistic fiction',
  ],
};

// One built-in and one custom genre, filtered on all-books and checked book by book.
export const GENRE_EXAMPLES = { builtIn: 20853, custom: 15730 };

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

// Search (P6-06, D-096), read with the app's arguments: books only, prefix LAST. A title word and
// an author's name; a term with no results; terms that would find the draft if it were visible;
// "Available now" (unavailableProducts HIDE) giving exactly the availableForSale books; and the
// price sort, where Shopify puts rented-out books last only among books of the same price.
export const SEARCH = {
  titleWord: { term: 'harry', count: 7, available: 6, rentedOutLast: 'harry-potter' },
  author: {
    term: 'dahl',
    handles: ['danny-the-champion-of-the-world', 'james-and-the-giant-peach', 'the-bfg'],
  },
  noResults: 'zzqxv',
  draftTerms: ['pelly', 'giraffe', 'the'],
  availableNow: [
    { term: 'harry', count: 6 },
    { term: 'the', count: AVAILABLE_PRODUCT_COUNT },
  ],
  priceSort: { term: 'harry', rentedOut: 'harry-potter' },
};
