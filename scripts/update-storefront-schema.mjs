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
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { STOREFRONT_API_VERSION } from '../src/config/shopifyApi.ts';

const GENERATED = join('src', 'shopify', 'generated');
const SCHEMA_FILE = /^storefront-.+\.schema\.json$/;

// The preset downloads the schema only when no saved file exists for the version, so every
// saved schema is removed first, including one for an older version. Each is kept in memory and
// put back if the download or the generation fails.
const previous = new Map();
for (const name of readdirSync(GENERATED)) {
  if (!SCHEMA_FILE.test(name)) continue;
  const path = join(GENERATED, name);
  previous.set(path, readFileSync(path));
  rmSync(path);
}

// Runs the code generator's own CLI with this Node.js, without a shell.
const require = createRequire(import.meta.url);
const cliPackage = require.resolve('@graphql-codegen/cli/package.json');
const codegenBin = join(dirname(cliPackage), require(cliPackage).bin['graphql-codegen']);

try {
  execFileSync(process.execPath, [codegenBin, '--config', 'codegen.ts'], { stdio: 'inherit' });
} catch {
  for (const name of readdirSync(GENERATED)) {
    if (SCHEMA_FILE.test(name)) rmSync(join(GENERATED, name));
  }
  for (const [path, content] of previous) writeFileSync(path, content);
  console.error('Schema update failed; the saved schema was put back. Nothing else changed.');
  process.exit(1);
}

console.log(
  `Saved the Storefront API ${STOREFRONT_API_VERSION} schema and regenerated the types. ` +
    'Review the diff before committing.',
);
