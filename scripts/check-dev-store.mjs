// Checks .env.local against the development store: the store configuration parses through the
// app's own getStoreConfig(), the store's currency matches EXPO_PUBLIC_STORE_CURRENCY, Shopify
// resolves the buyer context (EXPO_PUBLIC_STORE_COUNTRY and _LANGUAGE, D-058) to that country,
// language and currency, and the public Storefront token can read products published to the
// Headless channel.
//
// It then checks the sample catalogue (P6-01) against scripts/dev-store-catalogue.mjs: the
// visible products, the draft's absence, each collection's count by handle, the availability
// states, the covers, every product metafield the app may read, the metaobject labels behind
// the category metafields, ratings with and without a count, and one named book per case.
// For Browse (P6-04) it checks that a collection's Availability filter (`available: true`) gives
// exactly the availableForSale books; since P6-07 on the all-books collection, which must hold
// every visible book (D-100), as well as on a group.
// For the book page (P6-05) it reads one named book the way the app's BookPage operation does:
// genre labels resolve, the description parses through the app's own parser, and a handle no
// book has gives null. For search (P6-06) it reads Storefront's `search` with the app's arguments:
// a title word, an author's name, a term with no results, the draft never found, "Available now"
// (unavailableProducts HIDE) giving exactly the availableForSale books, and the price sort's order
// of rented-out books. For the Genre filter (P6-07) it reads the filter on all-books and on a group,
// lists the store's genre entries, joins them through the app's own toGenreOptions (the names the
// app shows), and checks that one built-in and one custom genre each list exactly their books,
// with "Available now" and under every sort. For the Price filter (P6-08) it reads the filter on
// all-books and on a group, checks that each maximum the app offers is inclusive (the books at
// exactly that price are returned, and left out just below it) and compares the rental price,
// and checks one combined count: a maximum, a genre and "Available now" under every sort.
//
// Run with `npm run check:dev-store`. Read-only: named queries, no mutations. Never prints the
// token or the domain. Not run in CI, which has no .env.local. Point it at a development store
// only, never the live store.
//
// Node 24 strips the types from the imported .ts files, so this checks the real config code.

import { STOREFRONT_API_VERSION, storefrontEndpoint } from '../src/config/shopifyApi.ts';
import { getStoreConfig, StoreConfigError } from '../src/config/store.ts';
import { toGenreOptions } from '../src/shopify/genres.ts';
import { parseDescriptionHtml } from '../src/shopify/richText.ts';
import {
  ALL_BOOKS_HANDLE,
  AVAILABILITY_COUNTS,
  AVAILABLE_FILTER_COLLECTION,
  AVAILABLE_PRODUCT_COUNT,
  COLLECTION_COUNTS,
  DRAFT_HANDLE,
  EXAMPLES,
  GENRE_EXAMPLES,
  GENRE_FILTER,
  GENRES,
  GROUP_GENRES,
  METAFIELDS,
  PRICE_COMBINED,
  PRICE_FILTER,
  PRICE_MAXIMA,
  NO_COVER_HANDLES,
  SEARCH,
  VISIBLE_PRODUCT_COUNT,
} from './dev-store-catalogue.mjs';

const QUERY = `query DevStoreCheck($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  localization {
    country {
      isoCode
      currency {
        isoCode
      }
    }
    language {
      isoCode
    }
  }
  shop {
    paymentSettings {
      currencyCode
    }
  }
  products(first: 5) {
    nodes {
      id
    }
  }
}`;

const METAFIELD_IDENTIFIERS = METAFIELDS.map(
  ({ namespace, key }) => `{ namespace: "${namespace}", key: "${key}" }`,
).join(', ');

// The largest page Shopify allows. The catalogue has 42 products, so one page is expected, but
// the loop follows pageInfo in case it grows.
const PRODUCTS_QUERY = `query DevStoreCatalogue(
  $country: CountryCode
  $language: LanguageCode
  $after: String
) @inContext(country: $country, language: $language) {
  products(first: 250, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      handle
      featuredImage {
        id
      }
      variants(first: 2) {
        nodes {
          availableForSale
          currentlyNotInStock
          price {
            amount
          }
        }
      }
      metafields(identifiers: [${METAFIELD_IDENTIFIERS}]) {
        namespace
        key
        value
        references(first: 10) {
          nodes {
            ... on Metaobject {
              type
              handle
              label: field(key: "label") {
                value
              }
              taxonomyReference: field(key: "taxonomy_reference") {
                value
              }
            }
          }
        }
      }
    }
  }
}`;

const DRAFT_QUERY = `query DevStoreDraft(
  $country: CountryCode
  $language: LanguageCode
  $handle: String!
) @inContext(country: $country, language: $language) {
  product(handle: $handle) {
    id
  }
}`;

// The book page's own selection (src/shopify/catalogue.ts, BookPage), less the card fields.
const BOOK_PAGE_QUERY = `query DevStoreBookPage(
  $country: CountryCode
  $language: LanguageCode
  $handle: String!
) @inContext(country: $country, language: $language) {
  product(handle: $handle) {
    handle
    descriptionHtml
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
}`;

/** A handle no book has, as in the development preview (src/config/devCatalogue.ts). */
const MISSING_BOOK_HANDLE = 'no-such-book-p6-05';

const COLLECTION_QUERY = `query DevStoreCollection(
  $country: CountryCode
  $language: LanguageCode
  $handle: String!
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    products(first: 250) {
      pageInfo {
        hasNextPage
      }
      nodes {
        id
      }
    }
  }
}`;

// A collection's books with filters and a sort, every page (P6-04, P6-07).
const FILTERED_COLLECTION_QUERY = `query DevStoreFilteredCollection(
  $country: CountryCode
  $language: LanguageCode
  $handle: String!
  $filters: [ProductFilter!]
  $sortKey: ProductCollectionSortKeys
  $reverse: Boolean
  $after: String
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    products(first: 250, after: $after, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        availableForSale
      }
    }
  }
}`;

// The Genre filter's values, as the app's CollectionGenres reads them, plus Shopify's own label,
// which the app never reads (P6-07): the check records that it differs from the store's name.
const COLLECTION_FILTERS_QUERY = `query DevStoreCollectionFilters(
  $country: CountryCode
  $language: LanguageCode
  $handle: String!
  $filters: [ProductFilter!]
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    products(first: 1, filters: $filters) {
      filters {
        id
        label
        type
        values {
          label
          count
          input
        }
      }
    }
  }
}`;

// The store's genre entries, as the app's GenreEntries reads them (P6-07, D-102).
const GENRE_ENTRIES_QUERY = `query DevStoreGenreEntries(
  $country: CountryCode
  $language: LanguageCode
  $type: String!
  $after: String
) @inContext(country: $country, language: $language) {
  metaobjects(type: $type, first: 250, after: $after) {
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
}`;

// The collection sorts the app sends (src/shopify/sort.ts, D-085).
const COLLECTION_SORTS = [
  ['COLLECTION_DEFAULT', false],
  ['BEST_SELLING', false],
  ['TITLE', false],
  ['TITLE', true],
  ['PRICE', false],
  ['PRICE', true],
  ['CREATED', false],
  ['CREATED', true],
];

// A group with "Available now" on: the collection's Availability filter.
const AVAILABLE_COLLECTION_QUERY = `query DevStoreAvailableCollection(
  $country: CountryCode
  $language: LanguageCode
  $handle: String!
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    products(first: 250, filters: [{ available: true }]) {
      nodes {
        handle
        availableForSale
      }
    }
    all: products(first: 250) {
      nodes {
        handle
        availableForSale
      }
    }
  }
}`;

// Thrown for an expected failure. process.exit() is avoided because on Windows it can abort
// Node while fetch still holds a socket; setting exitCode lets Node close it first.
class CheckFailure extends Error {}

function fail(message) {
  throw new CheckFailure(message);
}

async function storefrontRequest(config, query, variables = {}) {
  let response;
  try {
    response = await fetch(storefrontEndpoint(config.storeDomain), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
      body: JSON.stringify({
        query,
        variables: { country: config.country, language: config.language, ...variables },
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    // The cause can carry the host name, so only its code is shown.
    fail(`request did not complete (${error.cause?.code ?? error.name}).`);
  }

  if (!response.ok) {
    await response.body?.cancel();
    const hint =
      response.status === 401 || response.status === 403
        ? ' Check that the token is the Headless channel PUBLIC token and has product access.'
        : '';
    fail(`Storefront API answered HTTP ${response.status}.${hint}`);
  }

  const body = await response.json();
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    fail(`GraphQL errors: ${body.errors.map((error) => error.message).join('; ')}`);
  }
  return body.data;
}

async function checkStore(config) {
  const data = await storefrontRequest(config, QUERY);

  const storeCurrency = data?.shop?.paymentSettings?.currencyCode;
  if (storeCurrency !== config.currencyCode) {
    fail(
      `currency mismatch: the store uses ${storeCurrency ?? 'unknown'}, ` +
        `EXPO_PUBLIC_STORE_CURRENCY is ${config.currencyCode}.`,
    );
  }

  // Shopify falls back to the store's primary market for a country it does not sell to, so the
  // resolved context is compared with the configuration.
  const localization = data?.localization;
  const resolved = {
    country: localization?.country?.isoCode,
    currency: localization?.country?.currency?.isoCode,
    language: localization?.language?.isoCode,
  };
  if (
    resolved.country !== config.country ||
    resolved.currency !== config.currencyCode ||
    resolved.language !== config.language
  ) {
    fail(
      `buyer context mismatch: Shopify resolved ${resolved.country ?? 'unknown'}, ` +
        `${resolved.currency ?? 'unknown'}, ${resolved.language ?? 'unknown'}; the configuration ` +
        `asks for ${config.country}, ${config.currencyCode}, ${config.language}.`,
    );
  }

  const productCount = data?.products?.nodes?.length ?? 0;
  if (productCount === 0) {
    fail('no products found. Publish some sample products to the Headless channel.');
  }

  console.log(
    `Storefront API ${STOREFRONT_API_VERSION}: currency ${storeCurrency} matches; buyer ` +
      `context ${resolved.country}, ${resolved.language} resolves to ${resolved.currency}; ` +
      `read ${productCount} product${productCount === 1 ? '' : 's'}.`,
  );
}

async function fetchAllProducts(config) {
  const products = [];
  let after = null;
  do {
    const data = await storefrontRequest(config, PRODUCTS_QUERY, { after });
    const page = data?.products;
    products.push(...(page?.nodes ?? []));
    after = page?.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return products;
}

// Each book has one variant. In stock: orderable and not at zero. Rented out: not orderable.
// Orderable at zero: stock 0 with "continue selling" on. quantityAvailable is not used: it needs
// an inventory scope the public token does not have.
function availabilityOf(product) {
  const variant = product.variants.nodes[0];
  if (!variant?.availableForSale) return 'rentedOut';
  return variant.currentlyNotInStock ? 'orderableAtZero' : 'inStock';
}

function metafieldOf(product, namespace, key) {
  return product.metafields.find((field) => field?.namespace === namespace && field.key === key);
}

// A rating metafield's value is JSON: {"scale_min":"1.0","scale_max":"5.0","value":"5.0"}.
function parseRating(field) {
  try {
    const rating = JSON.parse(field.value);
    const [min, max, value] = [rating.scale_min, rating.scale_max, rating.value].map(Number);
    return min === 1 && max === 5 && value >= min && value <= max ? value : null;
  } catch {
    return null;
  }
}

// Category metafields hold metaobject IDs. Null references mean the token cannot read
// metaobjects: the owner must grant that permission on the Headless channel. Never worked around.
function metaobjectLabels(field, metaobjectType, handle, problems) {
  const nodes = field.references?.nodes ?? [];
  const resolved = nodes.filter(
    (node) => node?.type === metaobjectType && typeof node.label?.value === 'string',
  );
  if (resolved.length === 0 || resolved.length !== nodes.length) {
    problems.push(
      `${field.namespace}.${field.key} on ${handle} does not resolve to ${metaobjectType} ` +
        'labels. The Headless token may lack metaobject read permission; the owner must grant ' +
        'it. Do not work around this.',
    );
  }
  return resolved;
}

function checkCounts(label, actual, expected, problems) {
  if (actual !== expected) problems.push(`${label}: expected ${expected}, found ${actual}.`);
}

function sameHandles(label, actual, expected, problems) {
  const missing = [...expected].filter((handle) => !actual.has(handle));
  const extra = [...actual].filter((handle) => !expected.has(handle));
  if (missing.length > 0) problems.push(`${label} leaves out ${missing.join(', ')}.`);
  if (extra.length > 0) problems.push(`${label} also returns ${extra.join(', ')}.`);
}

async function collectionHandles(config, handle, filters = null, sort = [null, false]) {
  const nodes = [];
  let after = null;
  do {
    const data = await storefrontRequest(config, FILTERED_COLLECTION_QUERY, {
      handle,
      filters,
      sortKey: sort[0],
      reverse: sort[1],
      after,
    });
    const page = data?.collection?.products;
    if (!page) return null;
    nodes.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}

async function checkAvailableNow(config, products, problems) {
  // All books (D-100): the all-books collection holds every visible book; "Available now" on it
  // gives exactly the availableForSale ones.
  const all = await collectionHandles(config, ALL_BOOKS_HANDLE);
  const available = await collectionHandles(config, ALL_BOOKS_HANDLE, [{ available: true }]);
  if (all === null || available === null) {
    problems.push(
      `collection ${ALL_BOOKS_HANDLE} is missing or not published to the Headless channel.`,
    );
    return;
  }
  sameHandles(
    `collection ${ALL_BOOKS_HANDLE}`,
    new Set(all.map((product) => product.handle)),
    new Set(products.map((product) => product.handle)),
    problems,
  );
  checkCounts(
    `collection ${ALL_BOOKS_HANDLE}, available: true`,
    available.length,
    AVAILABLE_PRODUCT_COUNT,
    problems,
  );
  sameHandles(
    `collection ${ALL_BOOKS_HANDLE}, available: true,`,
    new Set(available.map((product) => product.handle)),
    new Set(products.filter((p) => availabilityOf(p) !== 'rentedOut').map((p) => p.handle)),
    problems,
  );

  const { handle, count } = AVAILABLE_FILTER_COLLECTION;
  const data = await storefrontRequest(config, AVAILABLE_COLLECTION_QUERY, { handle });
  const filtered = data?.collection?.products?.nodes ?? [];
  const group = data?.collection?.all?.nodes ?? [];
  checkCounts(`collection ${handle}, available: true`, filtered.length, count, problems);
  sameHandles(
    `collection ${handle}, available: true,`,
    new Set(filtered.map((product) => product.handle)),
    new Set(group.filter((product) => product.availableForSale).map((product) => product.handle)),
    problems,
  );
  console.log(
    `Available now: ${ALL_BOOKS_HANDLE} ${available.length} of ${all.length}; ` +
      `${handle} filter ${filtered.length} of ${group.length}.`,
  );
}

const taxonomyGid = (id) => `gid://shopify/TaxonomyValue/${id}`;

function genreFilterOf(data) {
  return data?.collection?.products?.filters?.find((filter) => filter.id === GENRE_FILTER.id);
}

function genreValueOf(value) {
  try {
    return JSON.parse(value.input)?.taxonomyMetafield?.value ?? null;
  } catch {
    return null;
  }
}

// The books whose shopify.genre holds an entry for this taxonomy value.
function booksOfGenre(products, gid) {
  return new Set(
    products
      .filter((product) =>
        (metafieldOf(product, 'shopify', 'genre')?.references?.nodes ?? []).some(
          (node) => node?.taxonomyReference?.value === gid,
        ),
      )
      .map((product) => product.handle),
  );
}

async function checkGenres(config, products, problems) {
  const locale = `${config.language.toLowerCase()}-${config.country}`;

  // The store's genre entries can be listed (gate f).
  const entries = [];
  let after = null;
  do {
    const data = await storefrontRequest(config, GENRE_ENTRIES_QUERY, {
      type: GENRE_FILTER.entryType,
      after,
    });
    const page = data?.metaobjects;
    for (const node of page?.nodes ?? []) {
      entries.push({
        label: node.label?.value ?? null,
        taxonomyReference: node.taxonomyReference?.value ?? null,
      });
    }
    after = page?.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  if (entries.length === 0) {
    problems.push(
      `genres: the ${GENRE_FILTER.entryType} entries cannot be listed with the public token.`,
    );
  }

  // The filter on all-books, without and with "Available now" (gates b and c).
  for (const available of [false, true]) {
    const filters = available ? [{ available: true }] : null;
    const data = await storefrontRequest(config, COLLECTION_FILTERS_QUERY, {
      handle: ALL_BOOKS_HANDLE,
      filters,
    });
    const genre = genreFilterOf(data);
    const label = `genres on ${ALL_BOOKS_HANDLE}${available ? ', available' : ''}`;
    if (!genre) {
      problems.push(`${label}: no ${GENRE_FILTER.id} filter.`);
      continue;
    }
    if (genre.label !== GENRE_FILTER.label || genre.type !== GENRE_FILTER.type) {
      problems.push(`${label}: the filter is "${genre.label}" ${genre.type}.`);
    }
    checkCounts(`${label}, values`, genre.values.length, GENRES.length, problems);
    for (const expected of GENRES) {
      const value = genre.values.find(
        (v) => genreValueOf(v) === taxonomyGid(expected.taxonomyValue),
      );
      if (!value) {
        problems.push(`${label}: no value for ${expected.storeName} (${expected.taxonomyValue}).`);
        continue;
      }
      if (value.label !== expected.filterLabel) {
        problems.push(
          `${label}: Shopify labels ${expected.taxonomyValue} "${value.label}", expected ` +
            `"${expected.filterLabel}".`,
        );
      }
      const count = available ? expected.available : expected.count;
      checkCounts(`${label}, ${expected.storeName}`, value.count, count, problems);
    }

    // The names the app shows, through the app's own join (D-102).
    const { options, faults } = toGenreOptions(genre.values, entries, locale);
    const names = options.map((option) => option.name);
    const expectedNames = GENRES.map((g) => g.storeName).sort((a, b) =>
      a.localeCompare(b, locale, { sensitivity: 'base' }),
    );
    if (JSON.stringify(names) !== JSON.stringify(expectedNames)) {
      problems.push(`${label}: the app would show ${names.join(', ')}.`);
    }
    if (faults.length > 0) problems.push(`${label}: join faults ${faults.join(', ')}.`);
  }

  // A group offers the filter too, named by the store.
  const groupData = await storefrontRequest(config, COLLECTION_FILTERS_QUERY, {
    handle: GROUP_GENRES.handle,
    filters: null,
  });
  const groupGenre = genreFilterOf(groupData);
  if (!groupGenre) {
    problems.push(`genres on ${GROUP_GENRES.handle}: no ${GENRE_FILTER.id} filter.`);
  } else {
    const names = toGenreOptions(groupGenre.values, entries, locale).options.map((o) => o.name);
    if (JSON.stringify(names) !== JSON.stringify(GROUP_GENRES.storeNames)) {
      problems.push(`genres on ${GROUP_GENRES.handle}: the app would show ${names.join(', ')}.`);
    }
  }

  // One built-in and one custom genre list exactly their books, with "Available now" and under
  // every sort (gates d and e).
  for (const id of [GENRE_EXAMPLES.builtIn, GENRE_EXAMPLES.custom]) {
    const gid = taxonomyGid(id);
    const name = GENRES.find((g) => g.taxonomyValue === id)?.storeName ?? String(id);
    const genreFilter = { taxonomyMetafield: { namespace: 'shopify', key: 'genre', value: gid } };
    const expected = booksOfGenre(products, gid);
    const got = await collectionHandles(config, ALL_BOOKS_HANDLE, [genreFilter]);
    sameHandles(`genre ${name}`, new Set((got ?? []).map((p) => p.handle)), expected, problems);
    const expectedAvailable = new Set(
      products
        .filter((p) => expected.has(p.handle) && availabilityOf(p) !== 'rentedOut')
        .map((p) => p.handle),
    );
    for (const sort of COLLECTION_SORTS) {
      const sorted = await collectionHandles(
        config,
        ALL_BOOKS_HANDLE,
        [genreFilter, { available: true }],
        sort,
      );
      sameHandles(
        `genre ${name}, available, ${sort[0]}${sort[1] ? ' reversed' : ''},`,
        new Set((sorted ?? []).map((p) => p.handle)),
        expectedAvailable,
        problems,
      );
    }
  }
  console.log(
    `Genres: ${entries.length} entries listed; ${GENRES.length} values on ${ALL_BOOKS_HANDLE} ` +
      `named by the store; ${GROUP_GENRES.handle} offers ${GROUP_GENRES.storeNames.length}; ` +
      `${GENRE_EXAMPLES.builtIn} and ${GENRE_EXAMPLES.custom} checked book by book under every sort.`,
  );
}

// The rental price, Shopify's `price`: what the Price filter compares (P6-08 gate b).
const priceOf = (product) => Number(product.variants.nodes[0]?.price?.amount);

const handlesOf = (nodes) => new Set((nodes ?? []).map((product) => product.handle));

async function checkPrices(config, products, problems) {
  // The filter is offered on all-books and on a group (gate a).
  for (const handle of [ALL_BOOKS_HANDLE, PRICE_FILTER.groupHandle]) {
    const data = await storefrontRequest(config, COLLECTION_FILTERS_QUERY, {
      handle,
      filters: null,
    });
    const filter = data?.collection?.products?.filters?.find((f) => f.id === PRICE_FILTER.id);
    if (!filter) {
      problems.push(`price on ${handle}: no ${PRICE_FILTER.id} filter.`);
    } else if (filter.type !== PRICE_FILTER.type) {
      problems.push(`price on ${handle}: the filter is ${filter.type}.`);
    }
  }

  // Each maximum is inclusive and compares the rental price (gate b): exactly the books at or
  // below it, with and without "Available now"; the books at exactly that price leave just below.
  for (const { max, count, available } of PRICE_MAXIMA) {
    const atOrBelow = new Set(products.filter((p) => priceOf(p) <= max).map((p) => p.handle));
    checkCounts(`price up to ${max}`, atOrBelow.size, count, problems);
    const got = handlesOf(await collectionHandles(config, ALL_BOOKS_HANDLE, [{ price: { max } }]));
    sameHandles(`price up to ${max}`, got, atOrBelow, problems);
    const availableSet = new Set(
      products
        .filter((p) => atOrBelow.has(p.handle) && availabilityOf(p) !== 'rentedOut')
        .map((p) => p.handle),
    );
    checkCounts(`price up to ${max}, available`, availableSet.size, available, problems);
    const gotAvailable = handlesOf(
      await collectionHandles(config, ALL_BOOKS_HANDLE, [{ price: { max } }, { available: true }]),
    );
    sameHandles(`price up to ${max}, available,`, gotAvailable, availableSet, problems);
    const below = handlesOf(
      await collectionHandles(config, ALL_BOOKS_HANDLE, [{ price: { max: max - 0.01 } }]),
    );
    const atMax = products.filter((p) => priceOf(p) === max).map((p) => p.handle);
    if (atMax.length === 0) problems.push(`price: no book at exactly ${max}.`);
    const leaked = atMax.filter((handle) => below.has(handle));
    if (leaked.length > 0) {
      problems.push(`price up to ${max - 0.01} still returns ${leaked.join(', ')}.`);
    }
  }

  // One combined count: a maximum, a genre and "Available now", the same under every sort (gate c).
  const { max, genre, count } = PRICE_COMBINED;
  const gid = taxonomyGid(genre);
  const filters = [
    { taxonomyMetafield: { namespace: 'shopify', key: 'genre', value: gid } },
    { price: { max } },
    { available: true },
  ];
  const expected = new Set(
    [...booksOfGenre(products, gid)].filter((handle) => {
      const product = products.find((p) => p.handle === handle);
      return priceOf(product) <= max && availabilityOf(product) !== 'rentedOut';
    }),
  );
  checkCounts(`genre ${genre}, price up to ${max}, available`, expected.size, count, problems);
  for (const sort of COLLECTION_SORTS) {
    const got = handlesOf(await collectionHandles(config, ALL_BOOKS_HANDLE, filters, sort));
    sameHandles(
      `genre ${genre}, price up to ${max}, available, ${sort[0]}${sort[1] ? ' reversed' : ''},`,
      got,
      expected,
      problems,
    );
  }
  console.log(
    `Price: ${PRICE_FILTER.id} on ${ALL_BOOKS_HANDLE} and ${PRICE_FILTER.groupHandle}; up to ` +
      `${PRICE_MAXIMA.map((m) => `${m.max} (${m.count}, ${m.available} available)`).join(', ')}, ` +
      `inclusive; genre ${genre} up to ${max} with "Available now": ${count} under every sort.`,
  );
}

async function checkBookPage(config, problems) {
  const handle = EXAMPLES.allMetafields;
  const data = await storefrontRequest(config, BOOK_PAGE_QUERY, { handle });
  const product = data?.product;
  if (!product) {
    problems.push(`book page: ${handle} is not visible.`);
    return;
  }
  const genres = (product.genre?.references?.nodes ?? []).filter(
    (node) => node?.type === 'shopify--genre' && node.label?.value?.trim(),
  );
  if (genres.length === 0) problems.push(`book page: ${handle} shows no genre label.`);
  const blocks = parseDescriptionHtml(product.descriptionHtml ?? '');
  if (blocks.length === 0) problems.push(`book page: ${handle} has no description to show.`);

  const missing = await storefrontRequest(config, BOOK_PAGE_QUERY, {
    handle: MISSING_BOOK_HANDLE,
  });
  if (missing?.product !== null) problems.push(`book page: ${MISSING_BOOK_HANDLE} is not null.`);
  console.log(
    `Book page: ${handle} has ${genres.length} genre label(s) and ${blocks.length} ` +
      `description block(s); ${MISSING_BOOK_HANDLE} gives null.`,
  );
}

const SEARCH_QUERY = `query DevStoreSearch(
  $query: String!
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
    first: 250
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
      ... on Product {
        handle
        availableForSale
        priceRange {
          minVariantPrice {
            amount
          }
        }
      }
    }
  }
}`;

async function search(config, term, options = {}) {
  const nodes = [];
  let totalCount = 0;
  let after = null;
  for (;;) {
    const data = await storefrontRequest(config, SEARCH_QUERY, {
      query: term,
      after,
      sortKey: 'RELEVANCE',
      reverse: false,
      unavailableProducts: 'LAST',
      ...options,
    });
    totalCount = data.search.totalCount;
    nodes.push(...data.search.nodes);
    if (!data.search.pageInfo.hasNextPage) return { totalCount, nodes };
    after = data.search.pageInfo.endCursor;
  }
}

/** Prices in order, and within each price orderable books before rented-out ones (D-096). */
function checkPriceOrder(label, nodes, reverse, problems) {
  const price = (node) => Number(node.priceRange.minVariantPrice.amount);
  for (let index = 1; index < nodes.length; index += 1) {
    const before = nodes[index - 1];
    const next = nodes[index];
    const inOrder = reverse ? price(before) >= price(next) : price(before) <= price(next);
    if (!inOrder) problems.push(`${label}: prices out of order at ${next.handle}.`);
    if (price(before) === price(next) && !before.availableForSale && next.availableForSale) {
      problems.push(`${label}: rented-out ${before.handle} before orderable ${next.handle}.`);
    }
  }
}

async function checkSearch(config, products, problems) {
  const { titleWord, author, noResults, draftTerms, availableNow, priceSort } = SEARCH;

  const title = await search(config, titleWord.term);
  checkCounts(`search "${titleWord.term}"`, title.nodes.length, titleWord.count, problems);
  checkCounts(`search "${titleWord.term}" totalCount`, title.totalCount, titleWord.count, problems);
  const orderable = title.nodes.filter((node) => node.availableForSale).length;
  checkCounts(`search "${titleWord.term}" orderable`, orderable, titleWord.available, problems);
  if (title.nodes.at(-1)?.handle !== titleWord.rentedOutLast) {
    problems.push(`search "${titleWord.term}": ${titleWord.rentedOutLast} is not last.`);
  }

  const byAuthor = await search(config, author.term);
  sameHandles(
    `search "${author.term}"`,
    new Set(byAuthor.nodes.map((node) => node.handle)),
    new Set(author.handles),
    problems,
  );

  const none = await search(config, noResults);
  checkCounts(`search "${noResults}"`, none.totalCount, 0, problems);

  for (const term of draftTerms) {
    const found = await search(config, term);
    if (found.nodes.some((node) => node.handle === DRAFT_HANDLE)) {
      problems.push(`search "${term}" finds the draft ${DRAFT_HANDLE}.`);
    }
  }

  // "Available now": HIDE must give exactly the availableForSale books among LAST's results.
  const orderableHandles = new Set(
    products.filter((product) => availabilityOf(product) !== 'rentedOut').map((p) => p.handle),
  );
  const availableSummary = [];
  for (const { term, count } of availableNow) {
    const all = await search(config, term);
    const hidden = await search(config, term, { unavailableProducts: 'HIDE' });
    const expected = all.nodes
      .filter((node) => node.availableForSale && orderableHandles.has(node.handle))
      .map((node) => node.handle);
    if (all.nodes.length === 0) problems.push(`search "${term}" finds nothing to compare.`);
    sameHandles(
      `search "${term}" with HIDE`,
      new Set(hidden.nodes.map((node) => node.handle)),
      new Set(expected),
      problems,
    );
    checkCounts(
      `search "${term}" with HIDE totalCount`,
      hidden.totalCount,
      hidden.nodes.length,
      problems,
    );
    // Exact numbers only for specific terms; broad words are checked for meaning only.
    if (count !== undefined) {
      checkCounts(`search "${term}" with HIDE`, hidden.nodes.length, count, problems);
    }
    availableSummary.push(`"${term}" ${hidden.nodes.length} of ${all.nodes.length}`);
  }

  // The price sort: rented-out books come last only among books of the same price (D-096).
  let rising = [];
  for (const reverse of [false, true]) {
    const label = `search "${priceSort.term}" by price${reverse ? ', high to low' : ''}`;
    const sorted = await search(config, priceSort.term, { sortKey: 'PRICE', reverse });
    checkPriceOrder(label, sorted.nodes, reverse, problems);
    if (!reverse) rising = sorted.nodes;
  }
  if (rising.at(-1)?.handle === priceSort.rentedOut) {
    problems.push(
      `search "${priceSort.term}" by price: ${priceSort.rentedOut} is last overall; ` +
        'Shopify may now put rented-out books last with a price sort too (review D-096).',
    );
  }

  console.log(
    `Search: "${titleWord.term}" ${title.totalCount} (${orderable} orderable, rented-out last), ` +
      `"${author.term}" ${byAuthor.totalCount}, "${noResults}" ${none.totalCount}; the draft ` +
      'never found; "Available now" (HIDE) gives exactly the orderable books ' +
      `(${availableSummary.join(', ')}); price sort checked.`,
  );
}

async function checkCatalogue(config) {
  const problems = [];
  const products = await fetchAllProducts(config);
  const byHandle = new Map(products.map((product) => [product.handle, product]));

  // Visible products and the draft.
  checkCounts('visible products', products.length, VISIBLE_PRODUCT_COUNT, problems);
  const draft = await storefrontRequest(config, DRAFT_QUERY, { handle: DRAFT_HANDLE });
  if (draft?.product !== null || byHandle.has(DRAFT_HANDLE)) {
    problems.push(`the draft ${DRAFT_HANDLE} is visible to the Headless channel.`);
  }
  console.log(`Catalogue: ${products.length} visible products; the draft is absent.`);

  // Collections by handle.
  for (const [handle, expected] of Object.entries(COLLECTION_COUNTS)) {
    const data = await storefrontRequest(config, COLLECTION_QUERY, { handle });
    if (!data?.collection) {
      problems.push(`collection ${handle} is missing or not published to the Headless channel.`);
      continue;
    }
    checkCounts(`collection ${handle}`, data.collection.products.nodes.length, expected, problems);
  }
  console.log(`Collections: ${Object.keys(COLLECTION_COUNTS).length} checked by handle.`);

  // Availability.
  const availability = { inStock: 0, rentedOut: 0, orderableAtZero: 0 };
  for (const product of products) availability[availabilityOf(product)] += 1;
  for (const [state, expected] of Object.entries(AVAILABILITY_COUNTS)) {
    checkCounts(`availability ${state}`, availability[state], expected, problems);
  }
  console.log(
    `Availability: ${availability.inStock} in stock, ${availability.rentedOut} rented out, ` +
      `${availability.orderableAtZero} orderable at zero.`,
  );

  // "Available now" (P6-04): the root query and a collection's filter mean availableForSale.
  await checkAvailableNow(config, products, problems);

  // Covers.
  const noCover = products.filter((product) => !product.featuredImage).map((p) => p.handle);
  checkCounts(
    'products with a cover',
    products.length - noCover.length,
    VISIBLE_PRODUCT_COUNT - NO_COVER_HANDLES.length,
    problems,
  );
  checkCounts('products without a cover', noCover.length, NO_COVER_HANDLES.length, problems);
  for (const handle of noCover) {
    if (!NO_COVER_HANDLES.includes(handle)) problems.push(`${handle} has no cover.`);
  }
  console.log(`Covers: ${products.length - noCover.length} with, ${noCover.length} without.`);

  // Named examples, one per case.
  const example = (name) => {
    const product = byHandle.get(EXAMPLES[name]);
    if (!product) problems.push(`example ${name} (${EXAMPLES[name]}) is not visible.`);
    return product;
  };
  for (const name of ['inStock', 'rentedOut', 'orderableAtZero', 'inStockContinueSelling']) {
    const product = example(name);
    const expected = name === 'inStockContinueSelling' ? 'inStock' : name;
    if (product && availabilityOf(product) !== expected) {
      problems.push(`${product.handle} is ${availabilityOf(product)}, expected ${expected}.`);
    }
  }
  const noCoverExample = example('noCover');
  if (noCoverExample?.featuredImage) problems.push(`${noCoverExample.handle} has a cover.`);
  const hardcover = example('hardcover');
  if (hardcover) {
    const field = metafieldOf(hardcover, 'shopify', 'book-cover-type');
    const labels = field
      ? metaobjectLabels(field, 'shopify--book-cover-type', hardcover.handle, problems)
      : [];
    if (!labels.some((node) => node.handle === 'hardcover')) {
      problems.push(`${hardcover.handle} is not a hardcover.`);
    }
  }
  const missing = example('missingPagesAndIsbn');
  if (missing) {
    for (const key of ['pages', 'isbn_13']) {
      if (metafieldOf(missing, 'custom', key))
        problems.push(`${missing.handle} has custom.${key}.`);
    }
  }

  // Every metafield on one named book, with the metaobject labels behind the category fields.
  const full = example('allMetafields');
  if (full) {
    for (const { namespace, key, metaobjectType, unused } of METAFIELDS) {
      const field = metafieldOf(full, namespace, key);
      // No book uses it, so null is the expected answer; the query itself was accepted.
      if (unused) continue;
      if (!field?.value) {
        problems.push(`${namespace}.${key} is not readable on ${full.handle}.`);
        continue;
      }
      if (metaobjectType) metaobjectLabels(field, metaobjectType, full.handle, problems);
    }
    const rating = metafieldOf(full, 'reviews', 'rating');
    const count = metafieldOf(full, 'reviews', 'rating_count');
    if (rating && parseRating(rating) === null) {
      problems.push(`reviews.rating on ${full.handle} is not a rating from 1 to 5.`);
    }
    if (count && !/^\d+$/.test(count.value)) {
      problems.push(`reviews.rating_count on ${full.handle} is not an integer.`);
    }
  }
  const noCount = example('ratingWithoutCount');
  if (noCount) {
    const rating = metafieldOf(noCount, 'reviews', 'rating');
    if (!rating || parseRating(rating) === null) {
      problems.push(`reviews.rating on ${noCount.handle} is not a rating from 1 to 5.`);
    }
    if (metafieldOf(noCount, 'reviews', 'rating_count')) {
      problems.push(`${noCount.handle} has a rating count; it should have none.`);
    }
  }
  console.log(
    `Metafields: ${METAFIELDS.length} queried on ${EXAMPLES.allMetafields}; ` +
      `${Object.keys(EXAMPLES).length} named examples checked.`,
  );

  // The book page (P6-05).
  await checkBookPage(config, problems);

  // Search (P6-06).
  await checkSearch(config, products, problems);

  // The Genre filter (P6-07).
  await checkGenres(config, products, problems);

  // The Price filter (P6-08).
  await checkPrices(config, products, problems);

  if (problems.length > 0) {
    fail(`the sample catalogue differs:\n- ${problems.join('\n- ')}`);
  }
}

async function check() {
  let config;
  try {
    config = getStoreConfig();
  } catch (error) {
    if (error instanceof StoreConfigError) {
      fail(`${error.message} Copy .env.example to .env.local and fill it in.`);
    }
    throw error;
  }
  console.log('Store configuration: valid.');

  await checkStore(config);
  await checkCatalogue(config);
}

try {
  await check();
  console.log('Dev store check passed.');
} catch (error) {
  if (!(error instanceof CheckFailure)) throw error;
  console.error(`Dev store check failed: ${error.message}`);
  process.exitCode = 1;
}
