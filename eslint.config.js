const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

// A string that starts like a colour: #rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl() or hsla().
const COLOUR_LITERAL = String.raw`/^\s*(#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/`;
const COLOUR_LITERAL_MESSAGE =
  'Colours come from src/theme/tokens.ts only (D-037). Use a colour role from `colors`.';
const COLOUR_RULES = [
  { selector: `Literal[value=${COLOUR_LITERAL}]`, message: COLOUR_LITERAL_MESSAGE },
  { selector: `TemplateElement[value.raw=${COLOUR_LITERAL}]`, message: COLOUR_LITERAL_MESSAGE },
];

// A string that starts like a GraphQL operation: `#graphql`, or `query Name {` / `mutation Name(`.
const GRAPHQL_LITERAL = String.raw`/^\s*(#graphql|(query|mutation)\s+[A-Za-z_]\w*\s*[({])/`;
const GRAPHQL_LITERAL_MESSAGE =
  'Shopify API operations live in src/shopify/ (Storefront, D-056) and src/customerAccountApi/ (Customer Account API, D-126) only. Call a function from there.';
const GRAPHQL_RULES = [
  { selector: `Literal[value=${GRAPHQL_LITERAL}]`, message: GRAPHQL_LITERAL_MESSAGE },
  { selector: `TemplateElement[value.raw=${GRAPHQL_LITERAL}]`, message: GRAPHQL_LITERAL_MESSAGE },
];

// The app's one query cache (D-061) and the boundary around it (D-063). TanStack Query is used
// only in src/query/ and in a data source's hooks folder; only src/shopify/ calls the Storefront
// client; screens and components import values only from hooks, the error types and the
// provider. Type-only imports are allowed everywhere.
const TANSTACK_MESSAGE =
  'TanStack Query is used only in src/query/ and in hooks folders such as src/shopify/hooks/ (D-063).';
const TANSTACK_PATHS = ['@tanstack/react-query', '@tanstack/query-core'].map((name) => ({
  name,
  message: TANSTACK_MESSAGE,
  allowTypeImports: true,
}));
const CLIENT_PATTERN = {
  group: ['**/shopify/client'],
  message:
    'Only src/shopify/ calls the Storefront client (D-063). Use a hook from src/shopify/hooks/.',
  allowTypeImports: true,
};
// The Customer Account API client (P7-02, D-126), used only inside src/customerAccountApi/, and
// the shared transport, used only by the two clients.
const CUSTOMER_CLIENT_PATTERN = {
  group: ['**/customerAccountApi/client'],
  message:
    'Only src/customerAccountApi/ calls the Customer Account API client (D-126). Use a hook from src/customerAccountApi/hooks/.',
  allowTypeImports: true,
};
const TRANSPORT_PATTERN = {
  group: ['**/graphql/transport'],
  message:
    'Only src/shopify/client.ts and src/customerAccountApi/client.ts use the GraphQL transport (D-126).',
  allowTypeImports: true,
};
const CLIENT_PATTERNS = [CLIENT_PATTERN, CUSTOMER_CLIENT_PATTERN, TRANSPORT_PATTERN];
const SCREEN_PATTERNS = [
  {
    group: ['**/shopify/*', '!**/shopify/hooks', '!**/shopify/errors'],
    message:
      'Screens read Storefront data through hooks only (D-063). Import from src/shopify/hooks/.',
    allowTypeImports: true,
  },
  {
    group: ['**/query/*', '!**/query/QueryProvider'],
    message: 'Screens use the query cache through hooks only (D-063).',
    allowTypeImports: true,
  },
  {
    group: [
      '**/customerAccountApi/*',
      '!**/customerAccountApi/hooks',
      '!**/customerAccountApi/errors',
    ],
    message:
      'Screens read customer data through hooks only (D-063, D-127). Import from src/customerAccountApi/hooks/.',
    allowTypeImports: true,
  },
];

const FETCH_MESSAGE =
  'Only src/graphql/transport.ts, src/customerAccount/oauthHttp.ts and src/backend/client.ts call the network (D-056, D-119, D-126, D-166). Use storefrontQuery, storefrontMutation, customerAccountQuery, src/customerAccount/session.ts or src/backend/client.ts.';

// The customer's login (P7-01). Tokens reach secure storage only through tokenStorage.ts (and
// the analytics consent through consentStorage.ts, D-052, and the cart's ID through
// src/shopify/cartStorage.ts, P8-01); the login library and the browser it
// opens are used only in src/customerAccount/ (D-119, D-121). The core rule is used, so these
// blocks do not replace the TypeScript rule's options above.
const SECURE_STORE_PATH = {
  name: 'expo-secure-store',
  message:
    'Only src/customerAccount/tokenStorage.ts, src/analytics/consentStorage.ts and src/shopify/cartStorage.ts use secure storage (D-052, D-121, P8-01).',
};
const LOGIN_LIBRARY_PATHS = ['expo-auth-session', 'expo-web-browser'].map((name) => ({
  name,
  message: 'Login is used through src/customerAccount/session.ts only (D-119).',
}));
// Checkout (P9-01): Checkout Kit only in src/checkout/ (D-151), and the browser for checkout only in
// src/checkout/browser.ts (D-152).
const CHECKOUT_KIT_PATH = {
  name: '@shopify/checkout-sheet-kit',
  message: 'Checkout Kit is used through src/checkout/ only (D-151).',
};

const FETCH_PROPERTIES = [
  { object: 'globalThis', property: 'fetch', message: FETCH_MESSAGE },
  { object: 'window', property: 'fetch', message: FETCH_MESSAGE },
  { object: 'global', property: 'fetch', message: FETCH_MESSAGE },
];

const OPEN_MESSAGE =
  'Open screens through openScreen() or guardLinkPress in src/navigation/openGuard.ts, so a double tap opens once (D-099).';
const ROUTER_PROPERTIES = ['push', 'navigate', 'replace'].map((property) => ({
  object: 'router',
  property,
  message: OPEN_MESSAGE,
}));

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // expo-env.d.ts is generated by the Expo CLI and gitignored. src/shopify/generated and
    // src/customerAccountApi/generated hold the code generator's output (D-054, D-125). backend/
    // is its own package with its own lint (D-159).
    ignores: [
      'backend/**',
      'dist/*',
      '.expo/*',
      'coverage/*',
      'node_modules/*',
      'expo-env.d.ts',
      'src/shopify/generated/*',
      'src/customerAccountApi/generated/*',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/tokens.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...COLOUR_RULES],
    },
  },
  {
    // The same rule again, with operation strings added, for everything outside src/shopify/
    // and src/customerAccountApi/. A later block replaces the rule's options, so the colour rules
    // are repeated.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/tokens.ts', 'src/shopify/**', 'src/customerAccountApi/**'],
    rules: {
      'no-restricted-syntax': ['error', ...COLOUR_RULES, ...GRAPHQL_RULES],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    // src/shopify/client.ts keeps the permission it had before the transport moved out of it
    // (D-126), so the existing lint tests are unchanged; it no longer calls fetch itself.
    ignores: [
      'src/graphql/transport.ts',
      'src/shopify/client.ts',
      'src/customerAccount/oauthHttp.ts',
      'src/backend/client.ts',
    ],
    rules: {
      'no-restricted-globals': ['error', { name: 'fetch', message: FETCH_MESSAGE }],
      'no-restricted-properties': ['error', ...FETCH_PROPERTIES, ...ROUTER_PROPERTIES],
    },
  },
  {
    // The backend client calls fetch (P10-02, D-166) but, like every other file, opens no screen.
    files: ['src/backend/client.ts'],
    rules: {
      'no-restricted-properties': ['error', ...ROUTER_PROPERTIES],
    },
  },
  {
    // The double-tap guard is the one place that opens screens (D-099).
    files: ['src/navigation/openGuard.ts'],
    rules: {
      'no-restricted-properties': ['error', ...FETCH_PROPERTIES],
    },
  },
  // Each block below covers different files, because a later block replaces the rule's options.
  {
    // Everything else in src/: no TanStack, no client, no transport.
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/query/**',
      'src/*/hooks/**',
      'src/shopify/**',
      'src/customerAccountApi/**',
      'src/app/**',
      'src/components/**',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: TANSTACK_PATHS, patterns: CLIENT_PATTERNS },
      ],
    },
  },
  {
    // Hooks folders: TanStack, but neither client nor the transport directly.
    files: ['src/*/hooks/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: CLIENT_PATTERNS }],
    },
  },
  {
    // src/shopify/ may call its client, but uses TanStack only in its hooks folder; only its
    // client uses the transport.
    files: ['src/shopify/**/*.{ts,tsx}'],
    ignores: ['src/shopify/hooks/**', 'src/shopify/client.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: TANSTACK_PATHS, patterns: [CUSTOMER_CLIENT_PATTERN, TRANSPORT_PATTERN] },
      ],
    },
  },
  {
    files: ['src/shopify/client.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: TANSTACK_PATHS, patterns: [CUSTOMER_CLIENT_PATTERN] },
      ],
    },
  },
  {
    // The same for src/customerAccountApi/ (D-126, D-127).
    files: ['src/customerAccountApi/**/*.{ts,tsx}'],
    ignores: ['src/customerAccountApi/hooks/**', 'src/customerAccountApi/client.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: TANSTACK_PATHS, patterns: [CLIENT_PATTERN, TRANSPORT_PATTERN] },
      ],
    },
  },
  {
    files: ['src/customerAccountApi/client.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: TANSTACK_PATHS, patterns: [CLIENT_PATTERN] },
      ],
    },
  },
  {
    // Secure storage and the login library, outside their own files (P7-01).
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/customerAccount/**',
      'src/analytics/consentStorage.ts',
      'src/shopify/cartStorage.ts',
      'src/checkout/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [SECURE_STORE_PATH, ...LOGIN_LIBRARY_PATHS, CHECKOUT_KIT_PATH] },
      ],
    },
  },
  {
    files: ['src/customerAccount/**/*.{ts,tsx}'],
    ignores: ['src/customerAccount/tokenStorage.ts'],
    rules: {
      'no-restricted-imports': ['error', { paths: [SECURE_STORE_PATH, CHECKOUT_KIT_PATH] }],
    },
  },
  {
    files: ['src/analytics/consentStorage.ts', 'src/shopify/cartStorage.ts'],
    rules: {
      'no-restricted-imports': ['error', { paths: [...LOGIN_LIBRARY_PATHS, CHECKOUT_KIT_PATH] }],
    },
  },
  {
    // Checkout (P9-01): Checkout Kit here; the browser only in browser.ts; never secure storage.
    files: ['src/checkout/**/*.{ts,tsx}'],
    ignores: ['src/checkout/browser.ts'],
    rules: {
      'no-restricted-imports': ['error', { paths: [SECURE_STORE_PATH, ...LOGIN_LIBRARY_PATHS] }],
    },
  },
  {
    files: ['src/checkout/browser.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            SECURE_STORE_PATH,
            ...LOGIN_LIBRARY_PATHS.filter((path) => path.name !== 'expo-web-browser'),
          ],
        },
      ],
    },
  },
  {
    // Screens and components: hooks, error types and the provider only.
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: TANSTACK_PATHS, patterns: [...CLIENT_PATTERNS, ...SCREEN_PATTERNS] },
      ],
    },
  },
]);
