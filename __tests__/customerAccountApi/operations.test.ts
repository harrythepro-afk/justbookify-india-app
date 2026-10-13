// Node.js types for fs and path come with Jest's own @types/node; the app's type check does not
// load them globally, so this test asks for them.
/// <reference types="node" />

/**
 * Every Customer Account API operation in src/customerAccountApi/ (P7-02, D-125, D-126): it
 * validates against the saved 2026-04 schema, is named, is a query (this task reads only) and
 * reads only the fields the two screens show. Code generation in CI checks the first point too;
 * this test makes all of them fail fast under `npm test`.
 */

import { createHash } from 'crypto';
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

import { CUSTOMER_ACCOUNT_API_VERSION } from '@/config/shopifyApi';

const ROOT = join(__dirname, '..', '..');
const API_DIR = join(ROOT, 'src', 'customerAccountApi');
const GENERATED_DIR = join(API_DIR, 'generated');
const SCHEMA_FILE = join(GENERATED_DIR, `customer-${CUSTOMER_ACCOUNT_API_VERSION}.schema.json`);

// A `#graphql` template string: from the backtick to the next backtick.
const OPERATION_LITERAL = /`(#graphql[\s\S]*?)`/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return path === GENERATED_DIR ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const operations = sourceFiles(API_DIR)
  .flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(OPERATION_LITERAL)].map((match) => ({
      file: relative(ROOT, file),
      document: match[1] ?? '',
    })),
  )
  // Doc comments mention `#graphql` without an operation.
  .filter(({ document }) => /\b(query|mutation)\b/.test(document));

const schemaText = readFileSync(SCHEMA_FILE, 'utf8');
const schema = buildClientSchema(JSON.parse(schemaText) as IntrospectionQuery);

function definitions(document: string): OperationDefinitionNode[] {
  return parse(document).definitions.filter(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === Kind.OPERATION_DEFINITION,
  );
}

function fieldsIn(document: string): string[] {
  const found: string[] = [];
  visit(parse(document), {
    Field(node) {
      found.push(node.name.value);
    },
  });
  return found;
}

it('is the schema recorded in D-125, unchanged', () => {
  expect(createHash('sha256').update(schemaText).digest('hex')).toBe(
    '4d0e9a179058d23d8fe18356f26b9af86dc190781195f87618e3c30e6c8a74ec',
  );
});

it('finds the two operations', () => {
  expect(operations.map(({ document }) => definitions(document)[0]?.name?.value).sort()).toEqual([
    'CustomerOrders',
    'CustomerProfile',
  ]);
});

it.each(operations.map(({ file, document }) => [file, document] as const))(
  'validates against the saved schema, named and read only: %s',
  (_file, document) => {
    expect(validate(schema, parse(document))).toEqual([]);
    for (const definition of definitions(document)) {
      expect(definition.operation).toBe('query');
      expect(definition.name?.value).toMatch(/^Customer[A-Z]/);
    }
  },
);

// What the screens show (architect, answers 1 and 2), and nothing more: no customer ID, tags,
// marketing state, other addresses, prices, payment or shipping details.
const ALLOWED_FIELDS = new Set([
  'customer',
  'firstName',
  'lastName',
  'emailAddress',
  'phoneNumber',
  'defaultAddress',
  'formatted',
  'orders',
  'pageInfo',
  'hasNextPage',
  'endCursor',
  'nodes',
  'id',
  'name',
  'processedAt',
  'cancelledAt',
  'financialStatus',
  'fulfillmentStatus',
  'fulfillments',
  'createdAt',
  'latestShipmentStatus',
  'lineItems',
  'giftCard',
  'image',
  'url',
  'width',
  'height',
  'altText',
]);

it('reads only the fields the screens need', () => {
  for (const { document } of operations) {
    expect(fieldsIn(document).filter((field) => !ALLOWED_FIELDS.has(field))).toEqual([]);
  }
});
