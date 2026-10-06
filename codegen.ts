import type { CodegenConfig } from '@graphql-codegen/cli';
import { ApiType, pluckConfig, shopifyApiTypes } from '@shopify/api-codegen-preset';

import { STOREFRONT_API_VERSION } from './src/config/shopifyApi';

/**
 * Types every Storefront API operation in src/shopify/ (D-054). The schema is read from the
 * saved file src/shopify/generated/storefront-<version>.schema.json, so this needs neither the
 * store nor a token (D-055). `npm run schema:update` replaces that file at a version change.
 */
const config: CodegenConfig = {
  overwrite: true,
  // Shopify's pluck settings find `#graphql` template strings. They are typed for
  // graphql-config, whose type does not overlap the CLI's, hence the cast.
  pluckConfig: pluckConfig as unknown as CodegenConfig['pluckConfig'],
  generates: shopifyApiTypes({
    apiType: ApiType.Storefront,
    apiVersion: STOREFRONT_API_VERSION,
    outputDir: './src/shopify/generated',
    documents: ['./src/shopify/**/*.ts', '!./src/shopify/generated/**'],
    // The interfaces that src/shopify/client.ts reads its operation types from (D-056).
    module: '@/shopify/storefrontTypes',
    enumsAsConst: true,
  }),
};

export default config;
