import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseBackendConfig } from '../../src/config/backendConfig.ts';
import { FAKE_SHOP_ID, FAKE_STORE_DOMAIN } from '../helpers/fakes.ts';

const valid = { storeDomain: FAKE_STORE_DOMAIN, shopId: FAKE_SHOP_ID, environment: 'development' };

describe('parseBackendConfig', () => {
  it('accepts a bare host, a numeric shop ID and a known environment', () => {
    assert.deepEqual(parseBackendConfig(valid), {
      storeDomain: FAKE_STORE_DOMAIN,
      shopId: FAKE_SHOP_ID,
      environment: 'development',
    });
    assert.equal(
      parseBackendConfig({ ...valid, environment: 'production' })?.environment,
      'production',
    );
  });

  it('trims and lowercases the domain', () => {
    assert.equal(
      parseBackendConfig({ ...valid, storeDomain: ' Example-Store.Example ' })?.storeDomain,
      FAKE_STORE_DOMAIN,
    );
  });

  it('refuses a domain with a scheme, path, port, credentials or no dot', () => {
    for (const storeDomain of [
      `https://${FAKE_STORE_DOMAIN}`,
      `${FAKE_STORE_DOMAIN}/path`,
      `${FAKE_STORE_DOMAIN}:443`,
      `user@${FAKE_STORE_DOMAIN}`,
      'localhost',
      '',
    ]) {
      assert.equal(parseBackendConfig({ ...valid, storeDomain }), undefined, storeDomain);
    }
  });

  it('refuses a missing or non-numeric shop ID', () => {
    assert.equal(parseBackendConfig({ ...valid, shopId: '' }), undefined);
    assert.equal(parseBackendConfig({ ...valid, shopId: '12a' }), undefined);
    assert.equal(parseBackendConfig({ ...valid, shopId: '1'.repeat(21) }), undefined);
  });

  it('refuses an unknown environment', () => {
    assert.equal(parseBackendConfig({ ...valid, environment: '' }), undefined);
    assert.equal(parseBackendConfig({ ...valid, environment: 'dev' }), undefined);
  });
});
