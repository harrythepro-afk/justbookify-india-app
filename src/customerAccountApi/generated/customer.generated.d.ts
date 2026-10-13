/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as CustomerTypes from './customer.types.js';

export type CustomerOrdersQueryVariables = CustomerTypes.Exact<{
  first: CustomerTypes.Scalars['Int']['input'];
  after?: CustomerTypes.InputMaybe<CustomerTypes.Scalars['String']['input']>;
  lineItems: CustomerTypes.Scalars['Int']['input'];
}>;


export type CustomerOrdersQuery = { customer: { orders: { pageInfo: Pick<CustomerTypes.PageInfo, 'hasNextPage' | 'endCursor'>, nodes: Array<(
        Pick<CustomerTypes.Order, 'id' | 'name' | 'processedAt' | 'cancelledAt' | 'financialStatus' | 'fulfillmentStatus'>
        & { fulfillments: { nodes: Array<Pick<CustomerTypes.Fulfillment, 'createdAt' | 'latestShipmentStatus'>> }, lineItems: { pageInfo: Pick<CustomerTypes.PageInfo, 'hasNextPage'>, nodes: Array<(
            Pick<CustomerTypes.LineItem, 'id' | 'name' | 'giftCard'>
            & { image?: CustomerTypes.Maybe<Pick<CustomerTypes.Image, 'url' | 'altText'>> }
          )> } }
      )> } } };

export type CustomerProfileQueryVariables = CustomerTypes.Exact<{ [key: string]: never; }>;


export type CustomerProfileQuery = { customer: (
    Pick<CustomerTypes.Customer, 'firstName' | 'lastName'>
    & { emailAddress?: CustomerTypes.Maybe<Pick<CustomerTypes.CustomerEmailAddress, 'emailAddress'>>, phoneNumber?: CustomerTypes.Maybe<Pick<CustomerTypes.CustomerPhoneNumber, 'phoneNumber'>>, defaultAddress?: CustomerTypes.Maybe<Pick<CustomerTypes.CustomerAddress, 'formatted'>> }
  ) };

interface GeneratedQueryTypes {
  "#graphql\nquery CustomerOrders($first: Int!, $after: String, $lineItems: Int!) {\n  customer {\n    orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        name\n        processedAt\n        cancelledAt\n        financialStatus\n        fulfillmentStatus\n        fulfillments(first: 5) {\n          nodes {\n            createdAt\n            latestShipmentStatus\n          }\n        }\n        lineItems(first: $lineItems) {\n          pageInfo {\n            hasNextPage\n          }\n          nodes {\n            id\n            name\n            giftCard\n            image {\n              url(transform: { maxWidth: 240 })\n              altText\n            }\n          }\n        }\n      }\n    }\n  }\n}\n": {return: CustomerOrdersQuery, variables: CustomerOrdersQueryVariables},
  "#graphql\nquery CustomerProfile {\n  customer {\n    firstName\n    lastName\n    emailAddress {\n      emailAddress\n    }\n    phoneNumber {\n      phoneNumber\n    }\n    defaultAddress {\n      formatted\n    }\n  }\n}\n": {return: CustomerProfileQuery, variables: CustomerProfileQueryVariables},
}

interface GeneratedMutationTypes {
}
declare module '@/customerAccountApi/customerAccountTypes' {
  type InputMaybe<T> = CustomerTypes.InputMaybe<T>;
  interface CustomerQueries extends GeneratedQueryTypes {}
  interface CustomerMutations extends GeneratedMutationTypes {}
}
