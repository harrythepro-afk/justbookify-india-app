import type { CodegenConfig } from '@graphql-codegen/cli';
import { ApiType, pluckConfig, shopifyApiTypes } from '@shopify/api-codegen-preset';

import { CUSTOMER_ACCOUNT_API_VERSION, STOREFRONT_API_VERSION } from './src/config/shopifyApi';

/**
 * The preset refuses a Customer API project without a key, even when the saved schema exists and
 * the key is never used. The schema is always the saved file (D-125), so this placeholder is never
 * sent anywhere; no real key is used.
 */
const SAVED_SCHEMA_ONLY = 'saved-schema-only';

/**
 * Types every Storefront API operation in src/shopify/ (D-054) and every Customer Account API
 * operation in src/customerAccountApi/ (P7-02). Each schema is read from its saved file in that
 * folder's generated/, so this needs neither a store nor a token (D-055). `npm run schema:update`
 * and `npm run schema:update:customer` replace those files at a version change.
 */
const config: CodegenConfig = {
  overwrite: true,
  // Shopify's pluck settings find `#graphql` template strings. They are typed for
  // graphql-config, whose type does not overlap the CLI's, hence the cast.
  pluckConfig: pluckConfig as unknown as CodegenConfig['pluckConfig'],
  generates: {
    ...shopifyApiTypes({
      apiType: ApiType.Storefront,
      apiVersion: STOREFRONT_API_VERSION,
      outputDir: './src/shopify/generated',
      documents: ['./src/shopify/**/*.ts', '!./src/shopify/generated/**'],
      // The interfaces that src/shopify/client.ts reads its operation types from (D-056).
      module: '@/shopify/storefrontTypes',
      enumsAsConst: true,
    }),
    ...shopifyApiTypes({
      apiType: ApiType.Customer,
      apiVersion: CUSTOMER_ACCOUNT_API_VERSION,
      apiKey: SAVED_SCHEMA_ONLY,
      outputDir: './src/customerAccountApi/generated',
      documents: ['./src/customerAccountApi/**/*.ts', '!./src/customerAccountApi/generated/**'],
      // The interfaces that src/customerAccountApi/client.ts reads its operation types from.
      module: '@/customerAccountApi/customerAccountTypes',
      enumsAsConst: true,
    }),
  },
};

export default config;
