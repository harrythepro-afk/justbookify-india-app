import {
  analyticsCollectionId,
  analyticsOrderId,
  analyticsProductId,
  analyticsTaxonomyValueId,
  analyticsToken,
} from '@/analytics/ids';

describe('analytics IDs', () => {
  it('keeps only the numeric part of a Shopify GID of the right type', () => {
    expect(analyticsProductId('gid://shopify/Product/8123456789012')).toBe('8123456789012');
    expect(analyticsCollectionId('gid://shopify/Collection/42')).toBe('42');
    expect(analyticsOrderId('gid://shopify/Order/5550001')).toBe('5550001');
  });

  it('keeps only the number of a taxonomy value, such as a genre (D-110)', () => {
    expect(analyticsTaxonomyValueId('gid://shopify/TaxonomyValue/15730')).toBe('15730');
    expect(analyticsTaxonomyValueId('gid://shopify/Collection/15730')).toBeUndefined();
    expect(analyticsTaxonomyValueId('Manga')).toBeUndefined();
  });

  it.each([
    'gid://shopify/Order/123',
    'gid://shopify/Product/',
    'gid://shopify/Product/12a',
    'gid://shopify/Product/123?title=The%20Gruffalo',
    '8123456789012',
    'The Gruffalo',
    'parent@example.com',
  ])('refuses %p as a product ID', (value) => {
    expect(analyticsProductId(value)).toBeUndefined();
  });
});

describe('analyticsToken', () => {
  it.each(['cash_on_delivery', 'age_group', 'step2', 'a'])('accepts %p', (value) => {
    expect(analyticsToken(value)).toBe(value);
  });

  it.each([
    '',
    'Cash on delivery',
    'parent@example.com',
    '9876543210',
    'phone_9876543210',
    '2_to_4',
    'a'.repeat(41),
    'café',
  ])('refuses %p', (value) => {
    expect(analyticsToken(value)).toBeUndefined();
  });
});
