import { setGlobalOptions } from 'firebase-functions';
import { onRequest } from 'firebase-functions/https';
import { defineString } from 'firebase-functions/params';

import { parseBackendConfig } from './config/backendConfig.ts';
import { createIdentityCheck } from './identity/check.ts';
import { functionsLog } from './log.ts';
import { handleWhoAmI, type WhoAmIDependencies } from './whoami.ts';

// Cloud Functions 2nd gen in Mumbai (D-007, D-160). maxInstances caps cost while nothing else
// limits traffic; rate limits and App Check come before any non-development deploy (SECURITY.md).
setGlobalOptions({
  region: 'asia-south1',
  memory: '256MiB',
  timeoutSeconds: 10,
  maxInstances: 5,
});

// Public values only (the app ships them too). Locally they come from the emulator project's
// .env file; secrets never come through params (D-160).
const storeDomain = defineString('SHOPIFY_STORE_DOMAIN', {
  description: "The store's myshopify domain, as in the app's EXPO_PUBLIC_STORE_DOMAIN",
});
const shopId = defineString('SHOPIFY_SHOP_ID', {
  description: "The store's shop ID, as in the app's EXPO_PUBLIC_SHOP_ID",
});
const backendEnvironment = defineString('BACKEND_ENVIRONMENT', {
  description: 'development, staging or production; whoami answers only in development',
  input: {
    select: {
      options: [{ value: 'development' }, { value: 'staging' }, { value: 'production' }],
    },
  },
});

let dependencies: WhoAmIDependencies | undefined;

/** Built on the first request, once per instance: params can be read only at run time. */
function getDependencies(): WhoAmIDependencies {
  if (dependencies !== undefined) return dependencies;
  let config: WhoAmIDependencies['config'];
  try {
    config = parseBackendConfig({
      storeDomain: storeDomain.value(),
      shopId: shopId.value(),
      environment: backendEnvironment.value(),
    });
  } catch {
    config = undefined;
  }
  dependencies = {
    config,
    identityCheck:
      config === undefined
        ? undefined
        : createIdentityCheck({
            fetch: (url, init) => fetch(url, init),
            storeDomain: config.storeDomain,
            shopId: config.shopId,
          }),
    log: functionsLog,
    now: () => performance.now(),
  };
  return dependencies;
}

// No CORS: the caller is the mobile app, never a browser page. The function is public because the
// app has no Google identity; every request is checked with the customer's own token (D-161).
export const whoami = onRequest({ cors: false, invoker: 'public' }, async (request, response) => {
  await handleWhoAmI(request, response, getDependencies());
});
