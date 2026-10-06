/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontTypes from './storefront.types.js';

export type CollectionBooksQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CollectionBooksQuery = { collection?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Collection, 'title'>
    & { products: { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, nodes: Array<(
        Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
        & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>>, variants: { nodes: Array<(
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
            & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }
          )> } }
      )> } }
  )> };

export type BookCardByHandleQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type BookCardByHandleQuery = { product?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
    & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>>, variants: { nodes: Array<(
        Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
        & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }
      )> } }
  )> };

export type DevCheckoutProductQueryVariables = StorefrontTypes.Exact<{
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type DevCheckoutProductQuery = { products: { nodes: Array<(
      Pick<StorefrontTypes.Product, 'title'>
      & { variants: { nodes: Array<(
          Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale'>
          & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        )> } }
    )> } };

export type DevCheckoutCartCreateMutationVariables = StorefrontTypes.Exact<{
  lines: Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type DevCheckoutCartCreateMutation = { cartCreate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'checkoutUrl'>
      & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'code'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code'>> }> };

interface GeneratedQueryTypes {
  "#graphql\nquery CollectionBooks(\n  $handle: String!\n  $first: Int!\n  $after: String\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  collection(handle: $handle) {\n    title\n    products(first: $first, after: $after) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        handle\n        title\n        vendor\n        featuredImage {\n          url(transform: { maxWidth: 600 })\n          width\n          height\n          altText\n        }\n        variants(first: 1) {\n          nodes {\n            id\n            availableForSale\n            currentlyNotInStock\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n}": {return: CollectionBooksQuery, variables: CollectionBooksQueryVariables},
  "#graphql\nquery BookCardByHandle($handle: String!, $country: CountryCode, $language: LanguageCode)\n@inContext(country: $country, language: $language) {\n  product(handle: $handle) {\n    id\n    handle\n    title\n    vendor\n    featuredImage {\n      url(transform: { maxWidth: 600 })\n      width\n      height\n      altText\n    }\n    variants(first: 1) {\n      nodes {\n        id\n        availableForSale\n        currentlyNotInStock\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n  }\n}": {return: BookCardByHandleQuery, variables: BookCardByHandleQueryVariables},
  "#graphql\nquery DevCheckoutProduct($country: CountryCode, $language: LanguageCode)\n@inContext(country: $country, language: $language) {\n  products(first: 10) {\n    nodes {\n      title\n      variants(first: 5) {\n        nodes {\n          id\n          title\n          availableForSale\n          price {\n            amount\n            currencyCode\n          }\n        }\n      }\n    }\n  }\n}": {return: DevCheckoutProductQuery, variables: DevCheckoutProductQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\nmutation DevCheckoutCartCreate(\n  $lines: [CartLineInput!]!\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: $country } }) {\n    cart {\n      checkoutUrl\n      cost {\n        subtotalAmount {\n          amount\n          currencyCode\n        }\n      }\n    }\n    userErrors {\n      code\n    }\n    warnings {\n      code\n    }\n  }\n}": {return: DevCheckoutCartCreateMutation, variables: DevCheckoutCartCreateMutationVariables},
}
declare module '@/shopify/storefrontTypes' {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
