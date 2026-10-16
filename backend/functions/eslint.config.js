// ESLint for the backend (D-159). Prettier runs on its own (`npm run format:check`);
// eslint-config-prettier only switches off the rules that would fight it.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const LOG_MESSAGE =
  'Log through src/log.ts only: an event name, a fixed code and a duration, never request data (D-162).';
const FETCH_MESSAGE =
  'Only src/index.ts reads the global fetch and passes it in, so tests can fake Shopify (D-161).';

export default tseslint.config(
  { ignores: ['lib/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': ['error'],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: [{ name: 'firebase-functions/logger', message: LOG_MESSAGE }] },
      ],
      'no-restricted-globals': ['error', { name: 'fetch', message: FETCH_MESSAGE }],
    },
  },
  {
    // node:test's describe and it return promises the runner itself awaits.
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            { from: 'package', package: 'node:test', name: ['describe', 'it', 'test'] },
          ],
        },
      ],
    },
  },
  {
    files: ['src/log.ts'],
    rules: { '@typescript-eslint/no-restricted-imports': 'off' },
  },
  {
    files: ['src/index.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  prettier,
);
