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
// For Browse (P6-04) it checks that "available" means the same in the root products query
// (`available_for_sale:true`) as in a collection's Availability filter (`available: true`).
//
// Run with `npm run check:dev-store`. Read-only: named queries, no mutations. Never prints the
// token or the domain. Not run in CI, which has no .env.local. Point it at a development store
// only, never the live store.
//
// Node 24 strips the types from the imported .ts files, so this checks the real config code.

import { STOREFRONT_API_VERSION, storefrontEndpoint } from '../src/config/shopifyApi.ts';
import { getStoreConfig, StoreConfigError } from '../src/config/store.ts';
import {
  AVAILABILITY_COUNTS,
  AVAILABLE_FILTER_COLLECTION,
  AVAILABLE_PRODUCT_COUNT,
  COLLECTION_COUNTS,
  DRAFT_HANDLE,
  EXAMPLES,
  METAFIELDS,
  NO_COVER_HANDLES,
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

// Browse's "all books" with "Available now" on (P6-04): the root products query filtered through
// Shopify's search syntax.
const AVAILABLE_PRODUCTS_QUERY = `query DevStoreAvailableProducts(
  $country: CountryCode
  $language: LanguageCode
  $after: String
) @inContext(country: $country, language: $language) {
  products(first: 250, after: $after, query: "available_for_sale:true") {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      handle
      availableForSale
    }
  }
}`;

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

async function checkAvailableNow(config, products, problems) {
  const available = [];
  let after = null;
  do {
    const data = await storefrontRequest(config, AVAILABLE_PRODUCTS_QUERY, { after });
    const page = data?.products;
    available.push(...(page?.nodes ?? []));
    after = page?.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  checkCounts(
    'root products, available_for_sale:true',
    available.length,
    AVAILABLE_PRODUCT_COUNT,
    problems,
  );
  sameHandles(
    'root products, available_for_sale:true,',
    new Set(available.map((product) => product.handle)),
    new Set(products.filter((p) => availabilityOf(p) !== 'rentedOut').map((p) => p.handle)),
    problems,
  );

  const { handle, count } = AVAILABLE_FILTER_COLLECTION;
  const data = await storefrontRequest(config, AVAILABLE_COLLECTION_QUERY, { handle });
  const filtered = data?.collection?.products?.nodes ?? [];
  const all = data?.collection?.all?.nodes ?? [];
  checkCounts(`collection ${handle}, available: true`, filtered.length, count, problems);
  sameHandles(
    `collection ${handle}, available: true,`,
    new Set(filtered.map((product) => product.handle)),
    new Set(all.filter((product) => product.availableForSale).map((product) => product.handle)),
    problems,
  );
  console.log(
    `Available now: root query ${available.length} of ${products.length}; ` +
      `${handle} filter ${filtered.length} of ${all.length}.`,
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
