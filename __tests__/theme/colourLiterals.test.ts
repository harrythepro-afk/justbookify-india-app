/**
 * @jest-environment node
 */

// Typed here because the project has no Node type definitions.
type SpawnSync = (
  command: string,
  args: string[],
  options: { cwd: string; input: string; encoding: 'utf8' },
) => { stdout: string };
const { spawnSync } = jest.requireActual<{ spawnSync: SpawnSync }>('node:child_process');

// Proves the lint rule in eslint.config.js is still in place: a colour literal in a screen fails,
// and the tokens file is the one place allowed to hold them. ESLint runs in its own process
// because it loads its config with a dynamic import, which Jest's module system does not allow.
const ESLINT = `${process.cwd()}/node_modules/eslint/bin/eslint.js`;
const RULE_ID = 'no-restricted-syntax';

type LintResult = { messages: { ruleId: string | null }[] };

function colourErrors(source: string, filePath: string): number {
  const run = spawnSync(
    'node',
    [ESLINT, '--stdin', '--stdin-filename', filePath, '--format', 'json'],
    { cwd: process.cwd(), input: source, encoding: 'utf8' },
  );
  const [result] = JSON.parse(run.stdout) as LintResult[];
  return result?.messages.filter((message) => message.ruleId === RULE_ID).length ?? 0;
}

describe('colour literal lint rule', () => {
  it.each([
    "const style = { color: '#fff' };",
    "const style = { color: '#910F3F' };",
    "const style = { color: '#910F3F80' };",
    "const style = { color: 'rgb(0, 0, 0)' };",
    "const style = { color: 'rgba(0, 0, 0, 0.5)' };",
    "const style = { color: 'hsl(0, 0%, 0%)' };",
    'const style = { color: `#fff` };',
  ])('fails `%s` in a screen', (source) => {
    expect(colourErrors(`${source}\nexport default style;\n`, 'src/app/example.tsx')).toBe(1);
  });

  it('allows colour literals in src/theme/tokens.ts', () => {
    expect(colourErrors("export const style = { color: '#fff' };\n", 'src/theme/tokens.ts')).toBe(
      0,
    );
  });

  it('allows text that only mentions a hash', () => {
    expect(colourErrors("export const label = 'Order #1001';\n", 'src/app/example.tsx')).toBe(0);
  });
});
