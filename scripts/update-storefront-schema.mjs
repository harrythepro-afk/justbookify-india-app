// Replaces the saved Storefront API schema with the one for STOREFRONT_API_VERSION, then
// regenerates the operation types (D-055). Run it only as a deliberate step after changing the
// version in src/config/shopifyApi.ts, and review the diff in a pull request.
//
// The schema comes from Shopify's public documentation endpoint
// (https://shopify.dev/storefront-graphql-direct-proxy/<version>), through the code generator's
// preset. No store and no token are involved. The generator runs only on this repository's own
// config, saved schema and operations (D-060).
//
// Node 24 strips the types from the imported .ts file.

import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { STOREFRONT_API_VERSION } from '../src/config/shopifyApi.ts';

const GENERATED = join('src', 'shopify', 'generated');
const SCHEMA_FILE = /^storefront-.+\.schema\.json$/;

// The preset downloads the schema only when no saved file exists for the version, so every
// saved schema is removed first, including one for an older version.
for (const name of readdirSync(GENERATED)) {
  if (SCHEMA_FILE.test(name)) rmSync(join(GENERATED, name));
}

execFileSync('npx', ['graphql-codegen', '--config', 'codegen.ts'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

console.log(
  `Saved the Storefront API ${STOREFRONT_API_VERSION} schema and regenerated the types. ` +
    'Review the diff before committing.',
);
