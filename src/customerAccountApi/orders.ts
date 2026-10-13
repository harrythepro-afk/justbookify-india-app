/**
 * The customer's orders for My Books (P7-02, read only; architect's answer 2): the latest first,
 * 20 at a time, each with its number, date, a plain status and its books. Read through the
 * Customer Account API client (D-126), typed by code generation (D-125). Values go to the screen
 * only: never logged, never in analytics or Sentry (D-127).
 */

import { customerAccountQuery } from './client';
import type { CustomerOrdersQuery } from './generated/customer.generated';

/** Orders per page (architect's answer 2: the latest 20, then "Load more"). */
export const ORDERS_PAGE_SIZE = 20;
/** Books read per order; more than this shows "and more books". */
export const BOOKS_PER_ORDER = 20;

export const CUSTOMER_ORDERS_QUERY = `#graphql
query CustomerOrders($first: Int!, $after: String, $lineItems: Int!) {
  customer {
    orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        processedAt
        cancelledAt
        financialStatus
        fulfillmentStatus
        fulfillments(first: 5) {
          nodes {
            createdAt
            latestShipmentStatus
          }
        }
        lineItems(first: $lineItems) {
          pageInfo {
            hasNextPage
          }
          nodes {
            id
            name
            giftCard
            image {
              url(transform: { maxWidth: 240 })
              width
              height
              altText
            }
          }
        }
      }
    }
  }
}
`;

type OrderNode = CustomerOrdersQuery['customer']['orders']['nodes'][number];

/**
 * The plain status shown for an order (D-128). Payment is never shown: cash on delivery stays
 * `PENDING` until the door.
 */
export type OrderStatus =
  | 'placed'
  | 'partlyShipped'
  | 'shipped'
  | 'outForDelivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderBook = {
  readonly id: string;
  readonly title: string;
  /** The same shape as a catalogue cover, so the book cover component draws it (D-077). */
  readonly cover: {
    readonly url: string;
    readonly width: number | null;
    readonly height: number | null;
    readonly altText: string | null;
  } | null;
};

export type OrderSummary = {
  readonly id: string;
  /** Shopify's order name, such as "#1001". */
  readonly name: string;
  /** When the order was placed, as Shopify sends it (ISO 8601). */
  readonly processedAt: string;
  readonly status: OrderStatus;
  readonly books: readonly OrderBook[];
  /** The order holds more books than were read (BOOKS_PER_ORDER). */
  readonly moreBooks: boolean;
};

export type OrdersPage = {
  readonly orders: readonly OrderSummary[];
  readonly nextCursor: string | null;
};

/**
 * Shopify's order states in plain words (D-128), in this order: cancelled; refunded; fulfilled,
 * by the latest shipment's tracking (delivered, out for delivery, otherwise shipped); partly
 * fulfilled; anything else, including states Shopify adds later, is "placed". "Delivered" needs
 * Shopify to record the delivery: a carrier that reports it (Delhivery) or staff marking it; an
 * Ekart order stays "shipped" otherwise (owner, P7-02; Phase 11 needs a rule).
 */
export function orderStatus(order: OrderNode): OrderStatus {
  if (order.cancelledAt !== null && order.cancelledAt !== undefined) return 'cancelled';
  if (order.financialStatus === 'REFUNDED') return 'refunded';
  switch (order.fulfillmentStatus) {
    case 'FULFILLED': {
      const latest = latestFulfillment(order.fulfillments.nodes);
      if (latest?.latestShipmentStatus === 'DELIVERED') return 'delivered';
      if (latest?.latestShipmentStatus === 'OUT_FOR_DELIVERY') return 'outForDelivery';
      return 'shipped';
    }
    case 'PARTIALLY_FULFILLED':
      return 'partlyShipped';
    default:
      return 'placed';
  }
}

function latestFulfillment<T extends { readonly createdAt: string }>(
  fulfillments: readonly T[],
): T | undefined {
  let latest: T | undefined;
  for (const fulfillment of fulfillments) {
    if (latest === undefined || Date.parse(fulfillment.createdAt) > Date.parse(latest.createdAt)) {
      latest = fulfillment;
    }
  }
  return latest;
}

export function toOrderSummary(order: OrderNode): OrderSummary {
  return {
    id: order.id,
    name: order.name,
    processedAt: order.processedAt,
    status: orderStatus(order),
    books: order.lineItems.nodes
      .filter((item) => !item.giftCard)
      .map((item) => ({
        id: item.id,
        title: item.name,
        cover:
          item.image === null || item.image === undefined
            ? null
            : {
                url: item.image.url,
                width: item.image.width ?? null,
                height: item.image.height ?? null,
                altText: item.image.altText ?? null,
              },
      })),
    moreBooks: order.lineItems.pageInfo.hasNextPage,
  };
}

export function toOrdersPage(data: CustomerOrdersQuery): OrdersPage {
  const { orders } = data.customer;
  return {
    orders: orders.nodes.map(toOrderSummary),
    nextCursor: orders.pageInfo.hasNextPage ? (orders.pageInfo.endCursor ?? null) : null,
  };
}

export async function fetchCustomerOrdersPage(input: {
  readonly after: string | null;
  readonly signal?: AbortSignal;
}): Promise<OrdersPage> {
  const data = await customerAccountQuery(CUSTOMER_ORDERS_QUERY, {
    variables: { first: ORDERS_PAGE_SIZE, after: input.after, lineItems: BOOKS_PER_ORDER },
    signal: input.signal,
  });
  return toOrdersPage(data);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "13 Oct 2026", on the phone's own calendar day. No `Intl`, so the wording is the same on every
 * engine; an unreadable date gives an empty string.
 */
export function formatOrderDate(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const date = new Date(time);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
