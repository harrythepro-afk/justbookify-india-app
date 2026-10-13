// Replaces the saved Customer Account API schema with the one Shopify publishes in its official
// npm package @shopify/hydrogen-react, then regenerates the operation types (P7-02, D-125). Run it
// only as a deliberate step after changing CUSTOMER_ACCOUNT_API_VERSION in
// src/config/shopifyApi.ts and HYDROGEN_REACT_VERSION below, and review the diff in a pull request.
//
// Why this source: the code generator's preset reads the Customer API schema from an address that
// refused the store's Headless client ID (13 October 2026), and shopify.dev names no public schema
// address for the Customer Account API. Hydrogen React ships the schema as a file, built for one
// API version: 2026.4.4 builds it with `CA_API_VERSION = '2026-04'` (its codegen.ts at the
// release's tag).
//
// What it does, and nothing more: reads the package's metadata for one exact version from the npm
// registry, downloads that version's archive into a new temporary folder, checks it against the
// registry's SHA-512 integrity value, extracts **only** `package/customer-account.schema.json`
// with the system's tar (no shell), checks that it is an introspection result, saves it as
// src/customerAccountApi/generated/customer-<version>.schema.json and runs the code generator.
// The package is never installed and none of its code is run. The temporary folder is deleted.
// On any failure the previous schema is put back.
//
// Run with `npm run schema:update:customer`. Node 24 strips the types from the imported .ts file.

import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { CUSTOMER_ACCOUNT_API_VERSION } from '../src/config/shopifyApi.ts';

/** The Hydrogen React release whose schema is saved. Its year and month name the API version. */
const HYDROGEN_REACT_VERSION = '2026.4.4';
const PACKAGE = '@shopify/hydrogen-react';
const MEMBER = 'package/customer-account.schema.json';

const GENERATED = join('src', 'customerAccountApi', 'generated');
const SCHEMA_FILE = /^customer-.+\.schema\.json$/;

function fail(message) {
  console.error(`${message} Nothing changed.`);
  process.exit(1);
}

// 2026.4.4 is built for 2026-04: the release's year and month must match the pinned version.
const [year, month] = HYDROGEN_REACT_VERSION.split('.');
if (`${year}-${month.padStart(2, '0')}` !== CUSTOMER_ACCOUNT_API_VERSION) {
  fail(
    `${PACKAGE} ${HYDROGEN_REACT_VERSION} is not built for Customer Account API ` +
      `${CUSTOMER_ACCOUNT_API_VERSION}.`,
  );
}

const metadataResponse = await fetch(
  `https://registry.npmjs.org/${PACKAGE}/${HYDROGEN_REACT_VERSION}`,
);
if (!metadataResponse.ok) fail(`The npm registry answered HTTP ${metadataResponse.status}.`);
const { dist } = await metadataResponse.json();
if (typeof dist?.tarball !== 'string' || typeof dist?.integrity !== 'string') {
  fail('The npm registry gave no archive address or integrity value.');
}
if (!dist.tarball.startsWith('https://registry.npmjs.org/')) {
  fail('The archive is not on the npm registry.');
}
if (!dist.integrity.startsWith('sha512-')) fail('The integrity value is not SHA-512.');

const folder = mkdtempSync(join(tmpdir(), 'hydrogen-react-'));
let schema;
try {
  const archiveResponse = await fetch(dist.tarball);
  if (!archiveResponse.ok) fail(`The archive download answered HTTP ${archiveResponse.status}.`);
  const archive = Buffer.from(await archiveResponse.arrayBuffer());
  const integrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
  if (integrity !== dist.integrity)
    fail("The archive does not match the registry's integrity value.");

  const archivePath = join(folder, 'package.tgz');
  writeFileSync(archivePath, archive);
  const extracted = spawnSync('tar', ['-xzf', archivePath, '-C', folder, MEMBER], {
    stdio: 'ignore',
  });
  if (extracted.status !== 0) fail(`tar could not extract ${MEMBER}.`);

  schema = readFileSync(join(folder, MEMBER));
  const parsed = JSON.parse(schema.toString('utf8'));
  if (!Array.isArray(parsed?.__schema?.types)) fail('The file is not an introspection result.');
} finally {
  rmSync(folder, { recursive: true, force: true });
}

// Every saved schema is removed first, including one for an older version. Each is kept in
// memory and put back if the generation fails.
const previous = new Map();
for (const name of readdirSync(GENERATED)) {
  if (!SCHEMA_FILE.test(name)) continue;
  const path = join(GENERATED, name);
  previous.set(path, readFileSync(path));
  rmSync(path);
}
writeFileSync(join(GENERATED, `customer-${CUSTOMER_ACCOUNT_API_VERSION}.schema.json`), schema);

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
  console.error('Code generation failed; the saved schema was put back. Nothing else changed.');
  process.exit(1);
}

console.log(
  `Saved the Customer Account API ${CUSTOMER_ACCOUNT_API_VERSION} schema from ${PACKAGE} ` +
    `${HYDROGEN_REACT_VERSION} (SHA-256 ${createHash('sha256').update(schema).digest('hex')}) ` +
    'and regenerated the types. Review the diff before committing.',
);
