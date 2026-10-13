import {
  getCustomerAccountApiEndpoint,
  resetCustomerAccountApiEndpointForTests,
} from '@/customerAccount/apiEndpoint';
import { customerAccountGraphqlEndpoint } from '@/customerAccount/discoveryDocument';
import type { JsonResult } from '@/customerAccount/oauthHttp';

const SHOP_ID = '987654321012';
const STORE = 'example-dev.myshopify.com';

describe('customerAccountGraphqlEndpoint (D-124)', () => {
  const endpoint = (graphqlApi: unknown) =>
    customerAccountGraphqlEndpoint({ graphql_api: graphqlApi }, '2026-04', SHOP_ID);

  it("keeps the development store's form and swaps only the version", () => {
    expect(endpoint(`https://shopify.com/${SHOP_ID}/account/customer/api/2026-10/graphql`)).toBe(
      `https://shopify.com/${SHOP_ID}/account/customer/api/2026-04/graphql`,
    );
  });

  it("keeps the reference's form, the store's domain and no path", () => {
    expect(endpoint(`https://${STORE}/customer/api/2026-10/graphql`)).toBe(
      `https://${STORE}/customer/api/2026-04/graphql`,
    );
  });

  it("refuses another shop's ID in the path, as for the issuer (D-120)", () => {
    expect(endpoint('https://shopify.com/111111111111/account/customer/api/2026-10/graphql')).toBe(
      undefined,
    );
  });

  it.each([
    ['http', `http://shopify.com/${SHOP_ID}/account/customer/api/2026-10/graphql`],
    ['no version path', `https://shopify.com/${SHOP_ID}/account/graphql`],
    ['a query string', `https://${STORE}/customer/api/2026-10/graphql?x=1`],
    ['a fragment', `https://${STORE}/customer/api/2026-10/graphql#x`],
    ['not a string', 42],
    ['missing', undefined],
  ])('refuses %s', (_name, value) => {
    expect(endpoint(value)).toBeUndefined();
  });

  it('refuses a document that is not an object', () => {
    expect(customerAccountGraphqlEndpoint(null, '2026-04', SHOP_ID)).toBeUndefined();
    expect(customerAccountGraphqlEndpoint('text', '2026-04', SHOP_ID)).toBeUndefined();
  });
});

const mockAnswers: JsonResult[] = [];
const mockUrls: string[] = [];
const mockProblems: string[] = [];

jest.mock('@/customerAccount/oauthHttp', () => ({
  getJson: (url: string) => {
    mockUrls.push(url);
    const answer = mockAnswers.shift();
    return Promise.resolve(answer ?? { ok: false, code: 'network' });
  },
}));
jest.mock('@/crashReporting/sentry', () => ({
  reportCustomerAccountProblem: (code: string) => mockProblems.push(code),
}));
jest.mock('@/config', () => ({
  ...jest.requireActual('@/config'),
  getStoreConfig: () => ({ storeDomain: 'example-dev.myshopify.com' }),
  getCustomerAccountConfig: () => ({ shopId: '987654321012' }),
}));

const GOOD: JsonResult = {
  ok: true,
  body: { graphql_api: `https://shopify.com/${SHOP_ID}/account/customer/api/2026-10/graphql` },
};

describe('getCustomerAccountApiEndpoint', () => {
  beforeEach(() => {
    resetCustomerAccountApiEndpointForTests();
    mockAnswers.length = 0;
    mockUrls.length = 0;
    mockProblems.length = 0;
  });

  it("reads the store's document once per launch, at the pinned version", async () => {
    mockAnswers.push(GOOD);

    const [first, second] = await Promise.all([
      getCustomerAccountApiEndpoint(),
      getCustomerAccountApiEndpoint(),
    ]);
    const third = await getCustomerAccountApiEndpoint();

    const expected = {
      ok: true,
      endpoint: `https://shopify.com/${SHOP_ID}/account/customer/api/2026-04/graphql`,
    };
    expect([first, second, third]).toEqual([expected, expected, expected]);
    expect(mockUrls).toEqual([`https://${STORE}/.well-known/customer-account-api`]);
  });

  it('does not keep a failure, and reports nothing offline or after a timeout', async () => {
    mockAnswers.push({ ok: false, code: 'network' }, { ok: false, code: 'timeout' }, GOOD);

    expect(await getCustomerAccountApiEndpoint()).toEqual({ ok: false, reason: 'no-network' });
    expect(await getCustomerAccountApiEndpoint()).toEqual({ ok: false, reason: 'timeout' });
    expect((await getCustomerAccountApiEndpoint()).ok).toBe(true);
    expect(mockProblems).toEqual([]);
  });

  it('reports an HTTP failure or a bad document by code only', async () => {
    mockAnswers.push(
      { ok: false, code: 'http_500' },
      { ok: true, body: { graphql_api: 'https://shopify.com/1/account/customer/api/x/graphql' } },
    );

    expect(await getCustomerAccountApiEndpoint()).toEqual({ ok: false, reason: 'unavailable' });
    expect(await getCustomerAccountApiEndpoint()).toEqual({ ok: false, reason: 'unavailable' });
    expect(mockProblems).toEqual(['api_discovery_http_500', 'api_discovery_invalid']);
  });
});
