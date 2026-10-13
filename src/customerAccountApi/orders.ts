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
              altText
            }
          }
        }
      }
    }
  }
}
`;
