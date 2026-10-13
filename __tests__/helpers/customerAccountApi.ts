/**
 * Made-up Customer Account API values for P7-02's tests. Plainly fake and low in entropy, so the
 * secret scan never mistakes them for real ones (P7-01's lesson).
 */

import type {
  CustomerOrdersQuery,
  CustomerProfileQuery,
} from '@/customerAccountApi/generated/customer.generated';

export const TEST_SHOP_ID = '987654321012';
export const TEST_ENDPOINT = `https://shopify.com/${TEST_SHOP_ID}/account/customer/api/2026-04/graphql`;
export const TEST_ACCESS_TOKEN = 'shcat_test-access-0001';
export const TEST_FRESH_TOKEN = 'shcat_test-access-0002';

// Marker values: a test fails if any of them reaches a log, Sentry or analytics.
export const MARKERS = {
  firstName: 'Zebedee',
  lastName: 'Quillfeather',
  email: 'zebedee.reader@example.com',
  phone: '+919812345670',
  addressLines: ['42 Marigold Lane', 'Koramangala', 'Bengaluru KA 560034', 'India'],
  orderName: '#7731',
  orderId: 'gid://shopify/Order/7731000001',
  bookTitle: 'The Owl Who Counted Stars',
  lineItemId: 'gid://shopify/LineItem/7731000002',
} as const;

export function profileData(
  overrides: Partial<CustomerProfileQuery['customer']> = {},
): CustomerProfileQuery {
  return {
    customer: {
      firstName: MARKERS.firstName,
      lastName: MARKERS.lastName,
      emailAddress: { emailAddress: MARKERS.email },
      phoneNumber: { phoneNumber: MARKERS.phone },
      defaultAddress: { formatted: [...MARKERS.addressLines] },
      ...overrides,
    },
  };
}

type OrderNode = CustomerOrdersQuery['customer']['orders']['nodes'][number];

export function orderNode(overrides: Partial<OrderNode> = {}): OrderNode {
  return {
    id: MARKERS.orderId,
    name: MARKERS.orderName,
    processedAt: '2026-10-13T06:30:00Z',
    cancelledAt: null,
    financialStatus: 'PENDING',
    fulfillmentStatus: 'UNFULFILLED',
    fulfillments: { nodes: [] },
    lineItems: {
      pageInfo: { hasNextPage: false },
      nodes: [
        {
          id: MARKERS.lineItemId,
          name: MARKERS.bookTitle,
          giftCard: false,
          image: {
            url: 'https://cdn.shopify.com/s/files/owl.jpg',
            width: 240,
            height: 240,
            altText: null,
          },
        },
      ],
    },
    ...overrides,
  };
}

export function ordersData(
  nodes: readonly OrderNode[],
  pageInfo: { hasNextPage: boolean; endCursor: string | null } = {
    hasNextPage: false,
    endCursor: null,
  },
): CustomerOrdersQuery {
  return { customer: { orders: { pageInfo, nodes: [...nodes] } } };
}

/** A fetch Response with a text body, as the transport reads it. */
export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}
