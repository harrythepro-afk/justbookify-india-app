// Node.js types for fs and path come with Jest's own @types/node; the app's type check does not
// load them globally, so this test asks for them.
/// <reference types="node" />

/**
 * Every Storefront API operation in src/shopify/ (D-054, D-055, D-058, D-061): it validates
 * against the saved schema, is named, carries the buyer context and selects no personal field.
 * Code generation in CI checks the first point too; this test makes all of them fail fast under
 * `npm test`.
 */

import { readdirSync, readFileSync } from 'fs';
import {
  buildClientSchema,
  Kind,
  parse,
  validate,
  visit,
  type IntrospectionQuery,
  type OperationDefinitionNode,
} from 'graphql';
import { join, relative } from 'path';

import { STOREFRONT_API_VERSION } from '@/config/shopifyApi';

const ROOT = join(__dirname, '..', '..');
const SHOPIFY_DIR = join(ROOT, 'src', 'shopify');
const GENERATED_DIR = join(SHOPIFY_DIR, 'generated');
const SCHEMA_FILE = join(GENERATED_DIR, `storefront-${STOREFRONT_API_VERSION}.schema.json`);

// A `#graphql` template string: from the backtick to the next backtick.
const OPERATION_LITERAL = /`(#graphql[\s\S]*?)`/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return path === GENERATED_DIR ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

type Found = { readonly file: string; readonly document: string };

const operations: Found[] = sourceFiles(SHOPIFY_DIR).flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(OPERATION_LITERAL)].map((match) => ({
    file: relative(ROOT, file),
    document: match[1] ?? '',
  })),
);

// Doc comments in client.ts and storefrontTypes.ts mention `#graphql` without an operation.
const realOperations = operations.filter(({ document }) => /\b(query|mutation)\b/.test(document));

const schema = buildClientSchema(
  JSON.parse(readFileSync(SCHEMA_FILE, 'utf8')) as IntrospectionQuery,
);

function definitions(document: string): OperationDefinitionNode[] {
  return parse(document).definitions.filter(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === Kind.OPERATION_DEFINITION,
  );
}

// Fields that hold a customer's personal data. Query results are cached (D-061), and the
// Storefront cache must hold nothing personal. `buyerIdentity` may be set as an input, which is
// not a selection.
const PERSONAL_FIELDS = new Set([
  'email',
  'phone',
  'firstName',
  'lastName',
  'address1',
  'address2',
  'zip',
  'customer',
  'customerAccessToken',
  'buyerIdentity',
]);

/** The personal fields an operation selects. */
function personalFieldsIn(document: string): string[] {
  const found: string[] = [];
  visit(parse(document), {
    Field(node) {
      if (PERSONAL_FIELDS.has(node.name.value)) found.push(node.name.value);
    },
  });
  return found;
}

it('finds the operations in src/shopify/', () => {
  expect(realOperations.map(({ document }) => definitions(document)[0]?.name?.value)).toEqual(
    expect.arrayContaining([
      'DevCheckoutProduct',
      'DevCheckoutCartCreate',
      'CollectionBooks',
      'BookCardByHandle',
      'CollectionHandles',
    ]),
  );
});

// The book card shows no rating (owner, P6-02; D-073): its operations read no review metafield.
it('reads no rating in the catalogue operations', () => {
  const catalogue = realOperations.filter(({ document }) =>
    [
      'CollectionBooks',
      'BookCardByHandle',
      'CollectionHandles',
      'CollectionGenres',
      'GenreEntries',
    ].includes(definitions(document)[0]?.name?.value ?? ''),
  );
  expect(catalogue).toHaveLength(5);
  for (const { document } of catalogue) {
    expect(document).not.toMatch(/reviews|rating|metafield/i);
  }
});

// Every customer list is a collection, all books included (D-100, replaces D-083): no catalogue
// operation reads the root `products` query. Only the development-only test checkout does.
it('reads no root products query outside the development checkout', () => {
  const rootProducts = realOperations.filter(({ document }) =>
    definitions(document).some((definition) =>
      definition.selectionSet.selections.some(
        (selection) => selection.kind === Kind.FIELD && selection.name.value === 'products',
      ),
    ),
  );
  expect(rootProducts.map(({ file }) => file.replace(/\\/g, '/'))).toEqual([
    'src/shopify/devCheckout.ts',
  ]);
});

// The Genre list shows the store's names only (D-102): Shopify's own filter value labels, its
// built-in names, are never read.
it('reads no Shopify filter value label in CollectionGenres', () => {
  const genres = realOperations.find(
    ({ document }) => definitions(document)[0]?.name?.value === 'CollectionGenres',
  );
  expect(genres).toBeDefined();
  const selected: string[] = [];
  visit(parse(genres?.document ?? ''), {
    Field: (node) => {
      selected.push(node.name.value);
    },
  });
  expect(selected).not.toContain('label');
  expect(selected).toEqual(expect.arrayContaining(['filters', 'id', 'values', 'count', 'input']));
});

// The book page shows the genre only (owner, answers 1 and 3, P6-05; D-090, D-092): no rating,
// and no language, publisher, pages, binding or ISBN (the ISBN is damaged on the live store).
it('reads only the genre metafield on the book page, and no rating', () => {
  const page = realOperations.find(
    ({ document }) => definitions(document)[0]?.name?.value === 'BookPage',
  );
  expect(page).toBeDefined();
  const document = page?.document ?? '';
  expect(document).not.toMatch(/reviews|rating|isbn|publisher|pages|language-version|cover-type/i);

  const metafields: { namespace?: string; key?: string }[] = [];
  visit(parse(document), {
    Field: (node) => {
      if (node.name.value === 'metafield' || node.name.value === 'metafields') {
        const value = (name: string) => {
          const argument = node.arguments?.find((arg) => arg.name.value === name);
          return argument?.value.kind === Kind.STRING ? argument.value.value : undefined;
        };
        metafields.push({ namespace: value('namespace'), key: value('key') });
      }
    },
  });
  expect(metafields).toEqual([{ namespace: 'shopify', key: 'genre' }]);
});

// Home's series tiles are text only (owner, P6-03; D-076): the listing reads handles, no image;
// and each collection's ID, which analytics sends for a chosen or matched collection (D-107).
it('reads only handles and IDs in the collection listing', () => {
  const listing = realOperations.find(
    ({ document }) => definitions(document)[0]?.name?.value === 'CollectionHandles',
  );
  expect(listing).toBeDefined();
  const fields: string[] = [];
  visit(parse(listing?.document ?? ''), {
    Field: (node) => {
      fields.push(node.name.value);
    },
  });
  expect(fields).toEqual([
    'collections',
    'pageInfo',
    'hasNextPage',
    'endCursor',
    'nodes',
    'id',
    'handle',
  ]);
});

describe.each(realOperations.map((found) => [found.file, found] as const))(
  'operation in %s',
  (_file, { document }) => {
    it('has no ${} interpolation', () => {
      expect(document).not.toContain('${');
    });

    it('validates against the saved schema', () => {
      expect(validate(schema, parse(document)).map((error) => error.message)).toEqual([]);
    });

    it('holds exactly one named operation', () => {
      const found = definitions(document);
      expect(found).toHaveLength(1);
      expect(found[0]?.name?.value).toMatch(/^[A-Z][A-Za-z0-9]+$/);
    });

    it('declares the buyer context with @inContext(country: $country, language: $language)', () => {
      const [operation] = definitions(document);
      const variables = Object.fromEntries(
        (operation?.variableDefinitions ?? []).map((definition) => [
          definition.variable.name.value,
          definition.type.kind === Kind.NAMED_TYPE ? definition.type.name.value : 'non-null',
        ]),
      );
      expect(variables).toMatchObject({ country: 'CountryCode', language: 'LanguageCode' });

      const directive = operation?.directives?.find((node) => node.name.value === 'inContext');
      const args = Object.fromEntries(
        (directive?.arguments ?? []).map((argument) => [
          argument.name.value,
          argument.value.kind === Kind.VARIABLE ? argument.value.name.value : 'literal',
        ]),
      );
      expect(args).toEqual({ country: 'country', language: 'language' });
    });

    it('selects no personal field, so nothing personal is cached', () => {
      expect(personalFieldsIn(document)).toEqual([]);
    });
  },
);

it('finds a personal field in a selection, and not in an input', () => {
  expect(
    personalFieldsIn(`query Q {
      cart(id: "gid://shopify/Cart/1") { buyerIdentity { email phone customer { firstName } } }
    }`),
  ).toEqual(['buyerIdentity', 'email', 'phone', 'customer', 'firstName']);
  expect(
    personalFieldsIn(`mutation M {
      cartCreate(input: { buyerIdentity: { countryCode: IN, email: "a@example.com" } }) {
        cart { id }
      }
    }`),
  ).toEqual([]);
});

it('uses the saved schema for the pinned API version', () => {
  const saved = readdirSync(GENERATED_DIR).filter((name) => name.endsWith('.schema.json'));
  expect(saved).toEqual([`storefront-${STOREFRONT_API_VERSION}.schema.json`]);
});
