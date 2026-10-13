/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontTypes from './storefront.types.js';

export type CartReadQueryVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CartReadQuery = { cart?: StorefrontTypes.Maybe<{ cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, lines: { nodes: Array<(
        Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
        & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
          & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, product: (
            Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
            & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>> }
          ) }
        ) }
      ) | (
        Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
        & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
          & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, product: (
            Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
            & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>> }
          ) }
        ) }
      )> } }> };

export type CartCreateMutationVariables = StorefrontTypes.Exact<{
  lines: Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CartCreateMutation = { cartCreate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id'>
      & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, lines: { nodes: Array<(
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
            & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
              & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>> }
            ) }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
            & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
              & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>> }
            ) }
          ) }
        )> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'code'>> }> };

export type CartLinesAddMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lines: Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CartLinesAddMutation = { cartLinesAdd?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<{ cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, lines: { nodes: Array<(
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
            & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
              & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>> }
            ) }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
            & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
              & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>> }
            ) }
          ) }
        )> } }>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'code'>> }> };

export type CartLinesRemoveMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lineIds: Array<StorefrontTypes.Scalars['ID']['input']> | StorefrontTypes.Scalars['ID']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CartLinesRemoveMutation = { cartLinesRemove?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<{ cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, lines: { nodes: Array<(
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
            & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
              & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>> }
            ) }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
            & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
              & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>> }
            ) }
          ) }
        )> } }>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'code'>> }> };

export type CollectionBooksQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  sortKey?: StorefrontTypes.InputMaybe<StorefrontTypes.ProductCollectionSortKeys>;
  reverse?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Boolean']['input']>;
  filters?: StorefrontTypes.InputMaybe<Array<StorefrontTypes.ProductFilter> | StorefrontTypes.ProductFilter>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CollectionBooksQuery = { collection?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Collection, 'id' | 'title'>
    & { products: { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, nodes: Array<(
        Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
        & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>>, variants: { nodes: Array<(
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
            & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }
          )> } }
      )> } }
  )> };

export type SearchBooksQueryVariables = StorefrontTypes.Exact<{
  query: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  sortKey?: StorefrontTypes.InputMaybe<StorefrontTypes.SearchSortKeys>;
  reverse?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Boolean']['input']>;
  unavailableProducts?: StorefrontTypes.InputMaybe<StorefrontTypes.SearchUnavailableProductsType>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type SearchBooksQuery = { search: (
    Pick<StorefrontTypes.SearchResultItemConnection, 'totalCount'>
    & { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, nodes: Array<{ __typename: 'Article' | 'Page' } | (
      { __typename: 'Product' }
      & Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor'>
      & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>>, variants: { nodes: Array<(
          Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
          & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }
        )> } }
    )> }
  ) };

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

export type BookPageQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type BookPageQuery = { product?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'vendor' | 'descriptionHtml'>
    & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'width' | 'height' | 'altText'>>, variants: { nodes: Array<(
        Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale' | 'currentlyNotInStock'>
        & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }
      )> }, genre?: StorefrontTypes.Maybe<{ references?: StorefrontTypes.Maybe<{ nodes: Array<(
          Pick<StorefrontTypes.Metaobject, 'type'>
          & { label?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MetaobjectField, 'value'>>, taxonomyReference?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MetaobjectField, 'value'>> }
        )> }> }> }
  )> };

export type CollectionHandlesQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CollectionHandlesQuery = { collections: { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, nodes: Array<Pick<StorefrontTypes.Collection, 'id' | 'handle'>> } };

export type CollectionGenresQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  filters?: StorefrontTypes.InputMaybe<Array<StorefrontTypes.ProductFilter> | StorefrontTypes.ProductFilter>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CollectionGenresQuery = { collection?: StorefrontTypes.Maybe<{ products: { filters: Array<(
        Pick<StorefrontTypes.Filter, 'id'>
        & { values: Array<Pick<StorefrontTypes.FilterValue, 'count' | 'input'>> }
      )> } }> };

export type GenreEntriesQueryVariables = StorefrontTypes.Exact<{
  type: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type GenreEntriesQuery = { metaobjects: { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, nodes: Array<{ label?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MetaobjectField, 'value'>>, taxonomyReference?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MetaobjectField, 'value'>> }> } };

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
  "#graphql\nquery CartRead($cartId: ID!, $country: CountryCode, $language: LanguageCode)\n@inContext(country: $country, language: $language) {\n  cart(id: $cartId) {\n    cost {\n      subtotalAmount {\n        amount\n        currencyCode\n      }\n    }\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        cost {\n          subtotalAmount {\n            amount\n            currencyCode\n          }\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            availableForSale\n            currentlyNotInStock\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n            product {\n              id\n              handle\n              title\n              vendor\n              featuredImage {\n                url(transform: { maxWidth: 600 })\n                width\n                height\n                altText\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}": {return: CartReadQuery, variables: CartReadQueryVariables},
  "#graphql\nquery CollectionBooks(\n  $handle: String!\n  $first: Int!\n  $after: String\n  $sortKey: ProductCollectionSortKeys\n  $reverse: Boolean\n  $filters: [ProductFilter!]\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  collection(handle: $handle) {\n    id\n    title\n    products(\n      first: $first\n      after: $after\n      sortKey: $sortKey\n      reverse: $reverse\n      filters: $filters\n    ) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        handle\n        title\n        vendor\n        featuredImage {\n          url(transform: { maxWidth: 600 })\n          width\n          height\n          altText\n        }\n        variants(first: 1) {\n          nodes {\n            id\n            availableForSale\n            currentlyNotInStock\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n}": {return: CollectionBooksQuery, variables: CollectionBooksQueryVariables},
  "#graphql\nquery SearchBooks(\n  $query: String!\n  $first: Int!\n  $after: String\n  $sortKey: SearchSortKeys\n  $reverse: Boolean\n  $unavailableProducts: SearchUnavailableProductsType\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  search(\n    query: $query\n    types: [PRODUCT]\n    prefix: LAST\n    first: $first\n    after: $after\n    sortKey: $sortKey\n    reverse: $reverse\n    unavailableProducts: $unavailableProducts\n  ) {\n    totalCount\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    nodes {\n      __typename\n      ... on Product {\n        id\n        handle\n        title\n        vendor\n        featuredImage {\n          url(transform: { maxWidth: 600 })\n          width\n          height\n          altText\n        }\n        variants(first: 1) {\n          nodes {\n            id\n            availableForSale\n            currentlyNotInStock\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n}": {return: SearchBooksQuery, variables: SearchBooksQueryVariables},
  "#graphql\nquery BookCardByHandle($handle: String!, $country: CountryCode, $language: LanguageCode)\n@inContext(country: $country, language: $language) {\n  product(handle: $handle) {\n    id\n    handle\n    title\n    vendor\n    featuredImage {\n      url(transform: { maxWidth: 600 })\n      width\n      height\n      altText\n    }\n    variants(first: 1) {\n      nodes {\n        id\n        availableForSale\n        currentlyNotInStock\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n  }\n}": {return: BookCardByHandleQuery, variables: BookCardByHandleQueryVariables},
  "#graphql\nquery BookPage($handle: String!, $country: CountryCode, $language: LanguageCode)\n@inContext(country: $country, language: $language) {\n  product(handle: $handle) {\n    id\n    handle\n    title\n    vendor\n    descriptionHtml\n    featuredImage {\n      url(transform: { maxWidth: 1200 })\n      width\n      height\n      altText\n    }\n    variants(first: 1) {\n      nodes {\n        id\n        availableForSale\n        currentlyNotInStock\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n    genre: metafield(namespace: \"shopify\", key: \"genre\") {\n      references(first: 10) {\n        nodes {\n          ... on Metaobject {\n            type\n            label: field(key: \"label\") {\n              value\n            }\n            taxonomyReference: field(key: \"taxonomy_reference\") {\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n}": {return: BookPageQuery, variables: BookPageQueryVariables},
  "#graphql\nquery CollectionHandles(\n  $first: Int!\n  $after: String\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  collections(first: $first, after: $after) {\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    nodes {\n      id\n      handle\n    }\n  }\n}": {return: CollectionHandlesQuery, variables: CollectionHandlesQueryVariables},
  "#graphql\nquery CollectionGenres(\n  $handle: String!\n  $filters: [ProductFilter!]\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  collection(handle: $handle) {\n    products(first: 1, filters: $filters) {\n      filters {\n        id\n        values {\n          count\n          input\n        }\n      }\n    }\n  }\n}": {return: CollectionGenresQuery, variables: CollectionGenresQueryVariables},
  "#graphql\nquery GenreEntries(\n  $type: String!\n  $first: Int!\n  $after: String\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  metaobjects(type: $type, first: $first, after: $after) {\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    nodes {\n      label: field(key: \"label\") {\n        value\n      }\n      taxonomyReference: field(key: \"taxonomy_reference\") {\n        value\n      }\n    }\n  }\n}": {return: GenreEntriesQuery, variables: GenreEntriesQueryVariables},
  "#graphql\nquery DevCheckoutProduct($country: CountryCode, $language: LanguageCode)\n@inContext(country: $country, language: $language) {\n  products(first: 10) {\n    nodes {\n      title\n      variants(first: 5) {\n        nodes {\n          id\n          title\n          availableForSale\n          price {\n            amount\n            currencyCode\n          }\n        }\n      }\n    }\n  }\n}": {return: DevCheckoutProductQuery, variables: DevCheckoutProductQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\nmutation CartCreate($lines: [CartLineInput!]!, $country: CountryCode, $language: LanguageCode)\n@inContext(country: $country, language: $language) {\n  cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: $country } }) {\n    cart {\n      id\n      cost {\n        subtotalAmount {\n          amount\n          currencyCode\n        }\n      }\n      lines(first: 100) {\n        nodes {\n          id\n          quantity\n          cost {\n            subtotalAmount {\n              amount\n              currencyCode\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              availableForSale\n              currentlyNotInStock\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n              product {\n                id\n                handle\n                title\n                vendor\n                featuredImage {\n                  url(transform: { maxWidth: 600 })\n                  width\n                  height\n                  altText\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    userErrors {\n      code\n    }\n  }\n}": {return: CartCreateMutation, variables: CartCreateMutationVariables},
  "#graphql\nmutation CartLinesAdd(\n  $cartId: ID!\n  $lines: [CartLineInput!]!\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  cartLinesAdd(cartId: $cartId, lines: $lines) {\n    cart {\n      cost {\n        subtotalAmount {\n          amount\n          currencyCode\n        }\n      }\n      lines(first: 100) {\n        nodes {\n          id\n          quantity\n          cost {\n            subtotalAmount {\n              amount\n              currencyCode\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              availableForSale\n              currentlyNotInStock\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n              product {\n                id\n                handle\n                title\n                vendor\n                featuredImage {\n                  url(transform: { maxWidth: 600 })\n                  width\n                  height\n                  altText\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    userErrors {\n      code\n    }\n  }\n}": {return: CartLinesAddMutation, variables: CartLinesAddMutationVariables},
  "#graphql\nmutation CartLinesRemove(\n  $cartId: ID!\n  $lineIds: [ID!]!\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {\n    cart {\n      cost {\n        subtotalAmount {\n          amount\n          currencyCode\n        }\n      }\n      lines(first: 100) {\n        nodes {\n          id\n          quantity\n          cost {\n            subtotalAmount {\n              amount\n              currencyCode\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              availableForSale\n              currentlyNotInStock\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n              product {\n                id\n                handle\n                title\n                vendor\n                featuredImage {\n                  url(transform: { maxWidth: 600 })\n                  width\n                  height\n                  altText\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    userErrors {\n      code\n    }\n  }\n}": {return: CartLinesRemoveMutation, variables: CartLinesRemoveMutationVariables},
  "#graphql\nmutation DevCheckoutCartCreate(\n  $lines: [CartLineInput!]!\n  $country: CountryCode\n  $language: LanguageCode\n) @inContext(country: $country, language: $language) {\n  cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: $country } }) {\n    cart {\n      checkoutUrl\n      cost {\n        subtotalAmount {\n          amount\n          currencyCode\n        }\n      }\n    }\n    userErrors {\n      code\n    }\n    warnings {\n      code\n    }\n  }\n}": {return: DevCheckoutCartCreateMutation, variables: DevCheckoutCartCreateMutationVariables},
}
declare module '@/shopify/storefrontTypes' {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
