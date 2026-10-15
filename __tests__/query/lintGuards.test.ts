/**
 * @jest-environment node
 */

// Typed here because the project has no Node type definitions.
type SpawnSync = (
  command: string,
  args: string[],
  options: { cwd: string; input: string; encoding: 'utf8' },
) => { stdout: string; stderr: string };
const { spawnSync } = jest.requireActual<{ spawnSync: SpawnSync }>('node:child_process');

// Proves the import boundary in eslint.config.js is still in place (D-063): screens read data
// through hooks only, TanStack Query stays in src/query/ and hooks folders, and only src/shopify/
// calls the Storefront client. ESLint runs in its own process, because it loads its config with
// a dynamic import, which Jest's module system does not allow. One process lints every case, so
// the config is loaded once.
const RULE_ID = '@typescript-eslint/no-restricted-imports';

const LINT_CASES = `
const { ESLint } = require('eslint');
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', async () => {
  const eslint = new ESLint();
  const counts = [];
  for (const [source, filePath] of JSON.parse(input)) {
    const [result] = await eslint.lintText(source + '\\n', { filePath });
    counts.push(result.messages.filter((message) => message.ruleId === '${RULE_ID}').length);
  }
  process.stdout.write(JSON.stringify(counts));
});
`;

type Case = readonly [source: string, filePath: string];

/** The number of import-boundary errors for each case, in order. */
function importErrors(cases: readonly Case[]): number[] {
  const run = spawnSync('node', ['-e', LINT_CASES], {
    cwd: process.cwd(),
    input: JSON.stringify(cases),
    encoding: 'utf8',
  });
  if (run.stdout === '') throw new Error(`ESLint failed: ${run.stderr}`);
  return JSON.parse(run.stdout) as number[];
}

const SCREEN = 'src/app/example.tsx';
const COMPONENT = 'src/components/Example.tsx';

const FAILING: Case[] = [
  ["import { storefrontQuery } from '@/shopify/client';", SCREEN],
  ["import { readCart } from '@/shopify/cart';", SCREEN],
  ["import { clearStorefrontCache } from '@/shopify/cache';", SCREEN],
  ["import { storefrontKeys } from '@/shopify/queryKeys';", COMPONENT],
  ["import { appQueryClient } from '@/query/queryClient';", SCREEN],
  ["import { freshness } from '@/query/freshness';", COMPONENT],
  ["import { useQuery } from '@tanstack/react-query';", SCREEN],
  ["import { QueryClient } from '@tanstack/query-core';", COMPONENT],
  ["import { storefrontQuery } from '../shopify/client';", 'src/analytics/example.ts'],
  ["import { useQuery } from '@tanstack/react-query';", 'src/analytics/example.ts'],
  ["import { useQuery } from '@tanstack/react-query';", 'src/shopify/cart.ts'],
];

const PASSING: Case[] = [
  ["import { useCart } from '@/shopify/hooks/cart';", SCREEN],
  ["import { StorefrontError } from '@/shopify/errors';", SCREEN],
  ["import { AppQueryProvider } from '@/query/QueryProvider';", SCREEN],
  ["import type { Cart } from '@/shopify/cart';", COMPONENT],
  ["import type { UseQueryResult } from '@tanstack/react-query';", SCREEN],
  // This boundary's rule only; Checkout Kit's own rule (P9-01, D-151) is in the login guards' test.
  ["import { ShopifyCheckoutSheetProvider } from '@shopify/checkout-sheet-kit';", SCREEN],
  ["import { useQuery } from '@tanstack/react-query';", 'src/query/example.ts'],
  ["import { useQuery } from '@tanstack/react-query';", 'src/shopify/hooks/example.ts'],
  ["import { storefrontQuery } from './client';", 'src/shopify/example.ts'],
  ["import { clearAllCaches } from '@/query/queryClient';", 'src/analytics/example.ts'],
];

describe('query and data import boundary', () => {
  let counts: { failing: number[]; passing: number[] };

  beforeAll(() => {
    const all = importErrors([...FAILING, ...PASSING]);
    counts = { failing: all.slice(0, FAILING.length), passing: all.slice(FAILING.length) };
  }, 120_000);

  it.each(FAILING.map((testCase, index) => [...testCase, index] as const))(
    'fails `%s` in %s',
    (_source, _filePath, index) => {
      expect(counts.failing[index]).toBeGreaterThan(0);
    },
  );

  it.each(PASSING.map((testCase, index) => [...testCase, index] as const))(
    'passes `%s` in %s',
    (_source, _filePath, index) => {
      expect(counts.passing[index]).toBe(0);
    },
  );
});
