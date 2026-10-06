// CI check (D-055): regenerates the Storefront API types from the saved schema, then fails if
// any operation did not validate (the generator exits with an error) or if the files in
// src/shopify/generated differ from the committed ones, including a new untracked file.
// It reads only the saved schema; it needs neither the store nor a token.

import { execFileSync } from 'node:child_process';

const GENERATED = 'src/shopify/generated';
const shell = process.platform === 'win32';

execFileSync('npx', ['graphql-codegen', '--config', 'codegen.ts'], { stdio: 'inherit', shell });

const changed = execFileSync('git', ['status', '--porcelain', '--', GENERATED], {
  encoding: 'utf8',
}).trim();

if (changed !== '') {
  console.error(
    `The generated Storefront API types are out of date:\n${changed}\n` +
      'Run `npm run codegen` and commit the result.',
  );
  process.exitCode = 1;
} else {
  console.log('Generated Storefront API types are current.');
}
