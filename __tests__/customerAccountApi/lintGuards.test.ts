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

// Proves the P7-02 boundaries in eslint.config.js (D-126, D-127): the GraphQL transport is used
// only by the two clients and is the network's way in; the Customer Account API client is called
// only inside src/customerAccountApi/; its operations live there; screens and components read
// customer data through its hooks and errors only. ESLint runs in its own process, as in
// __tests__/query/lintGuards.test.ts.
const RULE_IDS = [
  '@typescript-eslint/no-restricted-imports',
  'no-restricted-globals',
  'no-restricted-syntax',
];

const LINT_CASES = `
const { ESLint } = require('eslint');
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', async () => {
  const eslint = new ESLint();
  const rules = ${JSON.stringify(RULE_IDS)};
  const counts = [];
  for (const [source, filePath] of JSON.parse(input)) {
    const [result] = await eslint.lintText(source + '\\n', { filePath });
    counts.push(result.messages.filter((message) => rules.includes(message.ruleId)).length);
  }
  process.stdout.write(JSON.stringify(counts));
});
`;

type Case = readonly [source: string, filePath: string];

function boundaryErrors(cases: readonly Case[]): number[] {
  const run = spawnSync('node', ['-e', LINT_CASES], {
    cwd: process.cwd(),
    input: JSON.stringify(cases),
    encoding: 'utf8',
  });
  if (run.stdout === '') throw new Error(`ESLint failed: ${run.stderr}`);
  return JSON.parse(run.stdout) as number[];
}

const TRANSPORT = "import { executeGraphql } from '@/graphql/transport';\nvoid executeGraphql;";
const CUSTOMER_CLIENT =
  "import { customerAccountQuery } from '@/customerAccountApi/client';\nvoid customerAccountQuery;";
const CUSTOMER_PROFILE =
  "import { fetchCustomerProfile } from '@/customerAccountApi/profile';\nvoid fetchCustomerProfile;";
const CUSTOMER_HOOKS =
  "import { useCustomerOrders } from '@/customerAccountApi/hooks/customer';\nvoid useCustomerOrders;";
const CUSTOMER_ERRORS =
  "import { CustomerAccountApiError } from '@/customerAccountApi/errors';\nvoid CustomerAccountApiError;";
const OPERATION = 'export const Q = `#graphql\nquery CustomerExample { customer { id } }\n`;';
const FETCH = "export const load = () => fetch('https://example.com');";

const FAILING: Case[] = [
  [TRANSPORT, 'src/app/example.tsx'],
  [TRANSPORT, 'src/shopify/catalogue.ts'],
  [TRANSPORT, 'src/customerAccountApi/orders.ts'],
  [TRANSPORT, 'src/customerAccountApi/hooks/customer.ts'],
  [TRANSPORT, 'src/analytics/example.ts'],
  [CUSTOMER_CLIENT, 'src/app/example.tsx'],
  [CUSTOMER_CLIENT, 'src/components/Example.tsx'],
  [CUSTOMER_CLIENT, 'src/shopify/catalogue.ts'],
  [CUSTOMER_CLIENT, 'src/customerAccountApi/hooks/customer.ts'],
  [CUSTOMER_CLIENT, 'src/analytics/example.ts'],
  [CUSTOMER_PROFILE, 'src/app/example.tsx'],
  [CUSTOMER_PROFILE, 'src/components/Example.tsx'],
  [OPERATION, 'src/app/example.tsx'],
  [OPERATION, 'src/customerAccount/session.ts'],
  [FETCH, 'src/customerAccountApi/client.ts'],
  [FETCH, 'src/customerAccountApi/orders.ts'],
];

const PASSING: Case[] = [
  [TRANSPORT, 'src/shopify/client.ts'],
  [TRANSPORT, 'src/customerAccountApi/client.ts'],
  [CUSTOMER_CLIENT, 'src/customerAccountApi/orders.ts'],
  [CUSTOMER_HOOKS, 'src/app/example.tsx'],
  [CUSTOMER_HOOKS, 'src/components/Example.tsx'],
  [CUSTOMER_ERRORS, 'src/components/Example.tsx'],
  [OPERATION, 'src/customerAccountApi/example.ts'],
  [FETCH, 'src/graphql/transport.ts'],
];

describe('Customer Account API boundaries (P7-02)', () => {
  let counts: { failing: number[]; passing: number[] };

  beforeAll(() => {
    const all = boundaryErrors([...FAILING, ...PASSING]);
    counts = { failing: all.slice(0, FAILING.length), passing: all.slice(FAILING.length) };
  }, 240_000);

  it.each(FAILING.map((testCase, index) => [testCase[1], testCase[0], index] as const))(
    'refuses in %s: %s',
    (_path, _source, index) => {
      expect(counts.failing[index]).toBeGreaterThan(0);
    },
  );

  it.each(PASSING.map((testCase, index) => [testCase[1], testCase[0], index] as const))(
    'allows in %s: %s',
    (_path, _source, index) => {
      expect(counts.passing[index]).toBe(0);
    },
  );
});
