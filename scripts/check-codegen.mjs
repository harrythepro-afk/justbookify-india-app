// CI check (D-055): regenerates the Storefront API types from the saved schema, then fails if
// any operation did not validate (the generator exits with an error) or if the files in
// src/shopify/generated differ from the committed ones, including a new untracked file.
// It reads only the saved schema; it needs neither the store nor a token.

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const GENERATED = 'src/shopify/generated';

// Runs the code generator's own CLI with this Node.js, without a shell.
const require = createRequire(import.meta.url);
const cliPackage = require.resolve('@graphql-codegen/cli/package.json');
const codegenBin = join(dirname(cliPackage), require(cliPackage).bin['graphql-codegen']);

execFileSync(process.execPath, [codegenBin, '--config', 'codegen.ts'], { stdio: 'inherit' });

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
