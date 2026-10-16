// Used by `npm run check:dev-store` only, never by the app (D-155). Before every development-store
// test order (D-146) the check is run with EXPECT_STORE_DOMAIN set to the development store's
// domain; this compares it with the configured domain. The result is a code only, so the script
// can say whether they match without printing either value.

export type ExpectedStoreDomainResult = 'not set' | 'match' | 'mismatch';

function normalise(domain: string): string {
  return domain.trim().toLowerCase();
}

export function compareExpectedStoreDomain(
  expected: string | undefined,
  configured: string,
): ExpectedStoreDomainResult {
  if (expected === undefined || expected.trim() === '') return 'not set';
  return normalise(expected) === normalise(configured) ? 'match' : 'mismatch';
}
