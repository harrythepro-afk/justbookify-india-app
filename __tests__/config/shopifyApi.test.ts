import { STOREFRONT_API_VERSION, storefrontEndpoint } from '@/config/shopifyApi';

describe('Storefront API version', () => {
  it('is a dated version, never unstable or a release candidate alias', () => {
    expect(STOREFRONT_API_VERSION).toMatch(/^\d{4}-(01|04|07|10)$/);
  });

  it('builds the GraphQL endpoint for a shop domain', () => {
    expect(storefrontEndpoint('test-store.example.com')).toBe(
      `https://test-store.example.com/api/${STOREFRONT_API_VERSION}/graphql.json`,
    );
  });
});
