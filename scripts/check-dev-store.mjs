// Checks .env.local against the development store: the store configuration parses through the
// app's own getStoreConfig(), the store's currency matches EXPO_PUBLIC_STORE_CURRENCY, and the
// public Storefront token can read products published to the Headless channel.
//
// Run with `npm run check:dev-store`. Read-only: one named query, no mutations. Never prints
// the token or the domain. Not run in CI, which has no .env.local. Point it at a development
// store only, never the live store.
//
// Node 24 strips the types from the imported .ts files, so this checks the real config code.

import { STOREFRONT_API_VERSION, storefrontEndpoint } from '../src/config/shopifyApi.ts';
import { getStoreConfig, StoreConfigError } from '../src/config/store.ts';

const QUERY = `query DevStoreCheck {
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

// Thrown for an expected failure. process.exit() is avoided because on Windows it can abort
// Node while fetch still holds a socket; setting exitCode lets Node close it first.
class CheckFailure extends Error {}

function fail(message) {
  throw new CheckFailure(message);
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

  let response;
  try {
    response = await fetch(storefrontEndpoint(config.storeDomain), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
      body: JSON.stringify({ query: QUERY }),
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

  const storeCurrency = body.data?.shop?.paymentSettings?.currencyCode;
  if (storeCurrency !== config.currencyCode) {
    fail(
      `currency mismatch: the store uses ${storeCurrency ?? 'unknown'}, ` +
        `EXPO_PUBLIC_STORE_CURRENCY is ${config.currencyCode}.`,
    );
  }

  const productCount = body.data?.products?.nodes?.length ?? 0;
  if (productCount === 0) {
    fail('no products found. Publish some sample products to the Headless channel.');
  }

  console.log(
    `Storefront API ${STOREFRONT_API_VERSION}: currency ${storeCurrency} matches; ` +
      `read ${productCount} product${productCount === 1 ? '' : 's'}.`,
  );
}

try {
  await check();
  console.log('Dev store check passed.');
} catch (error) {
  if (!(error instanceof CheckFailure)) throw error;
  console.error(`Dev store check failed: ${error.message}`);
  process.exitCode = 1;
}
