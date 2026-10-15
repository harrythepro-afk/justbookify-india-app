import { compareExpectedStoreDomain } from '@/config/expectedStoreDomain';

describe('compareExpectedStoreDomain (D-155)', () => {
  it('is not set when EXPECT_STORE_DOMAIN is missing or blank', () => {
    expect(compareExpectedStoreDomain(undefined, 'example-dev.myshopify.com')).toBe('not set');
    expect(compareExpectedStoreDomain('', 'example-dev.myshopify.com')).toBe('not set');
    expect(compareExpectedStoreDomain('   ', 'example-dev.myshopify.com')).toBe('not set');
  });

  it('matches the same domain, ignoring case and outer spaces', () => {
    expect(
      compareExpectedStoreDomain('example-dev.myshopify.com', 'example-dev.myshopify.com'),
    ).toBe('match');
    expect(
      compareExpectedStoreDomain(' Example-Dev.myshopify.com ', 'example-dev.myshopify.com'),
    ).toBe('match');
  });

  it('refuses any other domain, including a near miss and the live store', () => {
    expect(compareExpectedStoreDomain('example-dev.myshopify.com', 'example.myshopify.com')).toBe(
      'mismatch',
    );
    expect(
      compareExpectedStoreDomain('example-dev.myshopify.com', 'example-dev.myshopify.co'),
    ).toBe('mismatch');
    expect(compareExpectedStoreDomain('example-dev.myshopify.com', 'shop.example.in')).toBe(
      'mismatch',
    );
  });

  it('returns a code only, never either domain', () => {
    const results = [
      compareExpectedStoreDomain('example-dev.myshopify.com', 'example.myshopify.com'),
      compareExpectedStoreDomain('example-dev.myshopify.com', 'example-dev.myshopify.com'),
    ];
    for (const result of results) expect(result).not.toMatch(/example/);
  });
});
