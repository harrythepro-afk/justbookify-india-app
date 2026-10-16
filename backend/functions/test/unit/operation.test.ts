import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { buildClientSchema, type IntrospectionQuery, Kind, parse, validate } from 'graphql';

import { CUSTOMER_IDENTITY_QUERY } from '../../src/identity/customer.ts';
import { CUSTOMER_ACCOUNT_API_VERSION } from '../../src/identity/check.ts';

// The app's saved Customer Account API schema (D-125), at the version the backend pins (D-161).
const SCHEMA_PATH = new URL(
  `../../../../src/customerAccountApi/generated/customer-${CUSTOMER_ACCOUNT_API_VERSION}.schema.json`,
  import.meta.url,
);

function loadSchema() {
  const saved = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as
    IntrospectionQuery | { data: IntrospectionQuery };
  return buildClientSchema('data' in saved ? saved.data : saved);
}

describe('the backend identity operation', () => {
  it("validates against the app's saved Customer Account API schema", () => {
    const errors = validate(loadSchema(), parse(CUSTOMER_IDENTITY_QUERY));
    assert.deepEqual(
      errors.map((error) => error.message),
      [],
    );
  });

  it('is one named query that selects only the customer ID', () => {
    const document = parse(CUSTOMER_IDENTITY_QUERY);
    assert.equal(document.definitions.length, 1);
    const [definition] = document.definitions;
    assert.ok(definition?.kind === Kind.OPERATION_DEFINITION);
    assert.equal(definition.operation, 'query');
    assert.equal(definition.name?.value, 'BackendCustomerIdentity');
    assert.equal(CUSTOMER_IDENTITY_QUERY, 'query BackendCustomerIdentity { customer { id } }');
  });
});
