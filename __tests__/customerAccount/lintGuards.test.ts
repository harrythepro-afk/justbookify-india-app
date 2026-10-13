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

// Proves the login boundaries in eslint.config.js (P7-01; D-119, D-121): tokens reach secure
// storage only through tokenStorage.ts (and the consent through consentStorage.ts), the login
// library and the browser are used only in src/customerAccount/, and only oauthHttp.ts there
// calls the network. ESLint runs in its own process, as in __tests__/query/lintGuards.test.ts.
const RULE_IDS = ['no-restricted-imports', 'no-restricted-globals'];

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

const SECURE_STORE = "import * as SecureStore from 'expo-secure-store';";
const AUTH_SESSION = "import { AuthRequest } from 'expo-auth-session';";
const WEB_BROWSER = "import * as WebBrowser from 'expo-web-browser';";
const FETCH = "export const load = () => fetch('https://example.com');";

const FAILING: Case[] = [
  [SECURE_STORE, 'src/app/example.tsx'],
  [SECURE_STORE, 'src/components/Example.tsx'],
  [SECURE_STORE, 'src/analytics/example.ts'],
  [SECURE_STORE, 'src/customerAccount/session.ts'],
  [SECURE_STORE, 'src/shopify/cartId.ts'],
  [SECURE_STORE, 'src/shopify/hooks/cart.ts'],
  [AUTH_SESSION, 'src/shopify/cartStorage.ts'],
  [AUTH_SESSION, 'src/app/example.tsx'],
  [AUTH_SESSION, 'src/analytics/consentStorage.ts'],
  [WEB_BROWSER, 'src/components/Example.tsx'],
  [WEB_BROWSER, 'src/shopify/example.ts'],
  [FETCH, 'src/customerAccount/session.ts'],
  [FETCH, 'src/app/example.tsx'],
];

const PASSING: Case[] = [
  [SECURE_STORE, 'src/customerAccount/tokenStorage.ts'],
  [SECURE_STORE, 'src/analytics/consentStorage.ts'],
  // The cart's ID (P8-01).
  [SECURE_STORE, 'src/shopify/cartStorage.ts'],
  [AUTH_SESSION, 'src/customerAccount/session.ts'],
  [WEB_BROWSER, 'src/customerAccount/example.ts'],
  [FETCH, 'src/customerAccount/oauthHttp.ts'],
  [FETCH, 'src/shopify/client.ts'],
  ["import { login } from '@/customerAccount/session';", 'src/components/Example.tsx'],
];

describe('login import and network boundary', () => {
  let counts: { failing: number[]; passing: number[] };

  beforeAll(() => {
    const all = boundaryErrors([...FAILING, ...PASSING]);
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
