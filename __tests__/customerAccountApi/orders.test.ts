import {
  formatOrderDate,
  orderStatus,
  toOrderSummary,
  toOrdersPage,
  type OrderStatus,
} from '@/customerAccountApi/orders';

import { MARKERS, orderNode, ordersData } from '../helpers/customerAccountApi';

type Node = Parameters<typeof orderStatus>[0];

function fulfillment(createdAt: string, latestShipmentStatus: string | null) {
  return { createdAt, latestShipmentStatus } as Node['fulfillments']['nodes'][number];
}

describe('orderStatus: the plain status table (D-128)', () => {
  const cases: [string, Partial<Node>, OrderStatus][] = [
    [
      'cancelled wins over everything',
      {
        cancelledAt: '2026-10-13T07:00:00Z',
        financialStatus: 'REFUNDED',
        fulfillmentStatus: 'FULFILLED',
      },
      'cancelled',
    ],
    [
      'refunded, not cancelled',
      { financialStatus: 'REFUNDED', fulfillmentStatus: 'FULFILLED' },
      'refunded',
    ],
    ['partly refunded is not "Refunded"', { financialStatus: 'PARTIALLY_REFUNDED' }, 'placed'],
    [
      'fulfilled, delivered',
      {
        fulfillmentStatus: 'FULFILLED',
        fulfillments: { nodes: [fulfillment('2026-10-13T08:00:00Z', 'DELIVERED')] },
      },
      'delivered',
    ],
    [
      'fulfilled, out for delivery',
      {
        fulfillmentStatus: 'FULFILLED',
        fulfillments: { nodes: [fulfillment('2026-10-13T08:00:00Z', 'OUT_FOR_DELIVERY')] },
      },
      'outForDelivery',
    ],
    [
      'fulfilled, in transit',
      {
        fulfillmentStatus: 'FULFILLED',
        fulfillments: { nodes: [fulfillment('2026-10-13T08:00:00Z', 'IN_TRANSIT')] },
      },
      'shipped',
    ],
    [
      'fulfilled, no tracking (an Ekart order)',
      {
        fulfillmentStatus: 'FULFILLED',
        fulfillments: { nodes: [fulfillment('2026-10-13T08:00:00Z', null)] },
      },
      'shipped',
    ],
    ['fulfilled, no fulfillment read', { fulfillmentStatus: 'FULFILLED' }, 'shipped'],
    ['partly fulfilled', { fulfillmentStatus: 'PARTIALLY_FULFILLED' }, 'partlyShipped'],
    ['unfulfilled', { fulfillmentStatus: 'UNFULFILLED' }, 'placed'],
    ['in progress', { fulfillmentStatus: 'IN_PROGRESS' }, 'placed'],
    ['scheduled', { fulfillmentStatus: 'SCHEDULED' }, 'placed'],
    ['on hold', { fulfillmentStatus: 'ON_HOLD' }, 'placed'],
    ['the deprecated OPEN', { fulfillmentStatus: 'OPEN' }, 'placed'],
    [
      'a state Shopify adds later',
      { fulfillmentStatus: 'SOMETHING_NEW' as Node['fulfillmentStatus'] },
      'placed',
    ],
    ['cash on delivery, payment pending, is not shown', { financialStatus: 'PENDING' }, 'placed'],
  ];

  it.each(cases)('%s', (_name, overrides, expected) => {
    expect(orderStatus(orderNode(overrides))).toBe(expected);
  });

  it('reads the latest fulfillment by date, whatever the order Shopify lists them in', () => {
    const order = orderNode({
      fulfillmentStatus: 'FULFILLED',
      fulfillments: {
        nodes: [
          fulfillment('2026-10-14T08:00:00Z', 'DELIVERED'),
          fulfillment('2026-10-12T08:00:00Z', 'IN_TRANSIT'),
        ],
      },
    });
    expect(orderStatus(order)).toBe('delivered');

    const reversed = orderNode({
      fulfillmentStatus: 'FULFILLED',
      fulfillments: {
        nodes: [
          fulfillment('2026-10-12T08:00:00Z', 'DELIVERED'),
          fulfillment('2026-10-14T08:00:00Z', 'IN_TRANSIT'),
        ],
      },
    });
    expect(orderStatus(reversed)).toBe('shipped');
  });
});

describe('toOrderSummary', () => {
  it('keeps the number, date, status and books', () => {
    expect(toOrderSummary(orderNode())).toEqual({
      id: MARKERS.orderId,
      name: MARKERS.orderName,
      processedAt: '2026-10-13T06:30:00Z',
      status: 'placed',
      books: [
        {
          id: MARKERS.lineItemId,
          title: MARKERS.bookTitle,
          cover: {
            url: 'https://cdn.shopify.com/s/files/owl.jpg',
            width: 240,
            height: 240,
            altText: null,
          },
        },
      ],
      moreBooks: false,
    });
  });

  it('leaves out gift cards, keeps a book with no image, and says when there are more books', () => {
    const order = orderNode({
      lineItems: {
        pageInfo: { hasNextPage: true },
        nodes: [
          { id: 'gid://shopify/LineItem/1', name: 'Gift card', giftCard: true, image: null },
          { id: 'gid://shopify/LineItem/2', name: 'No cover book', giftCard: false, image: null },
        ],
      },
    });

    const summary = toOrderSummary(order);

    expect(summary.books).toEqual([
      { id: 'gid://shopify/LineItem/2', title: 'No cover book', cover: null },
    ]);
    expect(summary.moreBooks).toBe(true);
  });
});

describe('toOrdersPage', () => {
  it('gives the next cursor only when there is a next page', () => {
    expect(
      toOrdersPage(ordersData([orderNode()], { hasNextPage: true, endCursor: 'cursor-1' }))
        .nextCursor,
    ).toBe('cursor-1');
    expect(
      toOrdersPage(ordersData([orderNode()], { hasNextPage: false, endCursor: 'cursor-1' }))
        .nextCursor,
    ).toBeNull();
    expect(toOrdersPage(ordersData([])).orders).toEqual([]);
  });
});

describe('formatOrderDate', () => {
  it("writes the day, short month and year on the phone's own calendar", () => {
    const iso = '2026-10-13T06:30:00Z';
    const local = new Date(iso);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    expect(formatOrderDate(iso)).toBe(
      `${local.getDate()} ${months[local.getMonth()]} ${local.getFullYear()}`,
    );
    expect(formatOrderDate('2026-01-05T12:00:00Z')).toMatch(/^[56] Jan 2026$/);
  });

  it('gives an empty string for a date it cannot read', () => {
    expect(formatOrderDate('not a date')).toBe('');
  });
});
