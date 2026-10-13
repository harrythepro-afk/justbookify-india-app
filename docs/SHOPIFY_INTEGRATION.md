# Shopify integration

## APIs

| Surface | Used for | Runs where | Credential |
| --- | --- | --- | --- |
| Storefront API (GraphQL) | Catalogue, collections, search, filters, metafields, cart, checkout URL | In the app | Public Storefront access token |
| Customer Account API | Login, profile, addresses, order history | In the app | Public client ID, OAuth 2.0 with PKCE; no secret |
| Checkout Kit | Shows Shopify's own checkout inside the app | In the app | None; uses the cart's checkout URL |
| Admin GraphQL API | Filing return requests; reading order, fulfilment, return and stock state | Backend only | Admin API access token |
| Webhooks | Orders, fulfilments, returns, inventory | Backend only | Webhook signing secret |

Rules:

- GraphQL only. The REST Admin API is not used.
- Pin one dated API version. Record it here. Review it every quarter.
- Do not use Storefront API customer login mutations or Multipass.
- Authenticated carts carry the Customer Account API token as buyer identity.

## API version

Storefront API `2026-10`, pinned on 3 October 2026 in `src/config/shopifyApi.ts` (D-025). Source: the API versions page on shopify.dev, which that day listed `2026-10` as latest stable (released 1 October 2026, accessible until 16 October 2027) and `2027-01` as a release candidate. Next quarterly review: January 2027, when `2027-01` becomes stable.

## Code generation and the saved schema (P5-01)

- **Generator** (D-054), development dependencies only: `@shopify/api-codegen-preset` 3.0.0, `@graphql-codegen/cli` 6.3.1 and `graphql` 16.14.2, checked on 6 October 2026. The preset takes the API version as a free string and reads the Storefront schema from `https://shopify.dev/storefront-graphql-direct-proxy/<version>`. That address served `2026-10` (429 types, with `@inContext`) and refused an unknown version (HTTP 400).
- **Saved schema** (D-055): `src/shopify/generated/storefront-2026-10.schema.json` (about 0.8 MB, minified), committed with `storefront.types.d.ts` and `storefront.generated.d.ts`. With the file present the generator makes no network call, so CI needs neither the store nor a token.
- **Commands:** `npm run codegen` after changing an operation; `npm run codegen:check` (also a CI step) fails when an operation does not validate or the committed types are out of date.
- **Changing the API version:** change `STOREFRONT_API_VERSION` in `src/config/shopifyApi.ts`, run `npm run schema:update`, review the schema and type diff, fix any operation that no longer validates, and commit it all in one pull request with the version change. A failed update puts the old schema back. The generator is never run on any input other than this repository's own (D-060).
- **Audit:** the generator brings two high advisories that are allowlisted for development tooling only, until 2026-11-15 (D-060).

## Buyer context (P5-01)

Every operation declares `$country: CountryCode` and `$language: LanguageCode` with `@inContext(country: $country, language: $language)`. The client fills them from `EXPO_PUBLIC_STORE_COUNTRY` and `EXPO_PUBLIC_STORE_LANGUAGE` (`IN`, `EN` for India; D-058). A cart is also created with `buyerIdentity: { countryCode: $country }`: Shopify's international pricing guide says queries take their market from `@inContext`, while a cart's market comes from `buyerIdentity` and is saved with the cart. `npm run check:dev-store` confirmed on 6 October 2026 that the development store resolves `IN`, `EN` to INR. Shopify falls back to the primary market for a country it does not sell to, which is why that check compares the resolved country, currency and language with the configuration.

## Checkout Kit version

`@shopify/checkout-sheet-kit` 3.9.1, pinned on 3 October 2026 (D-030). 4.0.x, named in D-017, was not published that day. Sources: npm registry, the package's GitHub releases and README, and shopify.dev's Checkout Kit page for React Native. Recheck when 4.0.0 is published, and at each quarterly API review.

## Credentials

Values are never written in this repository. Names and locations only.

| May ship inside the app | Server only, never inside the app |
| --- | --- |
| Shop domain | Admin API access token |
| Storefront API public access token | Custom app client secret |
| Customer Account API client ID | Webhook signing secret |
| Shop ID (for the login callback scheme) | APNs auth key and FCM service-account key |
| Sentry DSN and Firebase app config | Judge.me private API token |
| Deep-link hosts | Any database or cloud credential |

The Sentry DSN is `EXPO_PUBLIC_SENTRY_DSN`; it only lets the app send crash reports and is public by design. The Sentry auth token, which uploads source maps during release builds, is `SENTRY_AUTH_TOKEN`. It exists only as an EAS environment variable with Secret visibility, created by the owner, and never in the repository, `.env` files or chat (D-042).

The Storefront token gets the minimum scopes: products, collections, cart and checkout. Nothing customer-related. On the development store it also resolves metaobject references, which the category metafields (`shopify.genre` and the others) need; `npm run check:dev-store` fails if it stops doing so (P6-01). If the live store's token cannot, the owner grants metaobject read on the Headless channel; the app never works around it.

In the app the shop domain and the public Storefront token are `EXPO_PUBLIC_STORE_DOMAIN` and `EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN`, read through `src/config/`. For development they sit in `.env.local`, which is never committed. The Headless channel's private token is never used in the app.

## Store additions (owner approval required for each)

| # | Addition | Purpose | Status |
| --- | --- | --- | --- |
| 1 | Headless sales channel | Issues the Storefront token and the Customer Account API client ID | Live store: not done; needs the owner's go-ahead. Development store: installed by the owner, 3 October 2026 |
| 2 | Publish products to the Headless channel | The app sees only products published to it | Live store: not done. Development store: sample products published by the owner, 3 October 2026 |
| 3 | One custom app for the backend | Admin API access and webhooks | Not done |
| 4 | An automated collection "All books" (`all-books`, rule: price greater than 0), published to the app's (Headless) channel only | Browse with no group chosen reads it, so the Genre filter works across all books: Storefront filters work only on a collection's products and on search, and the root `products` query takes no filter (D-100) | Live store: not done; the owner's decision at the live-store connection, after the release gate in `TESTING.md` ("Release gate: before the live store is connected"). Development store: created by the owner, 8 October 2026 |

Nothing else on the live store is changed. See D-008.

## Development store

Created by the owner on 3 October 2026. For P3-01 the owner set up delivery rates and a manual cash-on-delivery payment method on it. For P3-02 the owner installed ACOD and SMART Checkout Rules on it on 3 October 2026 and copied the live store's settings by hand (`SHOPIFY_AUDIT.md`, D-031): all three SMART Checkout Rules rules ("Shipping discount", "Shipping Price Restriction", "Shipping Restriction") and both ACOD features are active. ACOD showed a plan screen that Shopify marked as a test charge, which is never billed on a development store; no payment method was added (D-032). The shipping rates are named "Prepaid" (₹75) and "Cash on Delivery" (₹125). Its India shipping zone covers the whole country, unlike the live store's five states, so a pincode outside R3 still gets rates and only the SMART rule can block it. Two sample products have a stock of 10 and a third has 1. Razorpay is not installed there and will not be: Razorpay is offered only to stores with an Indian business entity, and the development store's entity is in Bahrain (D-033). So the development store has no prepaid payment method. Test orders are allowed on the development store only, never on the live store. It is a development store with Basic-plan features (corrected on 3 October 2026; earlier noted as "on the Basic plan"). Like every development store it is always password protected, and Shopify does not allow the password to be removed. Its currency is INR (it was created in BHD and the owner changed it). `npm run check:dev-store` confirmed on 3 October 2026 that the store's currency matches the configuration and that the public token reads products published to the Headless channel. The plan cannot be read with the public Storefront token; confirm it through the Admin API's `shop.plan` once the backend custom app exists, or in the store's admin.

Sample catalogue (P6-01, D-069): on 7 October 2026 the architect loaded 40 real books copied from the live store; the owner imported two CSV files and the architect created the fields, collections, category values and ratings. The Headless channel sees **42 products**: the 3 older test products and 39 sample books. The 40th, `the-giraffe-and-the-pelly-and-me`, is a draft and must never appear. 23 smart collections are published to the Headless channel; since 8 October 2026 a 24th, `all-books` (below). The full fixture, with the expected counts, is in `TESTING.md` ("Sample catalogue (P6-01)"); `npm run check:dev-store` asserts it.

Development store changes for P6-07 (8 October 2026, D-070):

- **Architect**, through the architect's own connector, after checking that the store was `justbookify-dev`: the five custom `shopify--genre` entries now reference the same base values as on the live store: `manga` 15730, `picture-book` 15727, `realistic-fiction` 15732, `non-fiction` 15731, `fairy-tale` 15733 (all were 20866, "Other"). Labels unchanged.
- **Owner**, by hand in the development admin: the Genre filter switched on in Search & Discovery; an automated collection "All books" (price greater than 0) published to the Headless channel. Its handle, read over the Storefront API, is **`all-books`**.
- These change the sample catalogue: one more collection (24) and the Genre filter's values. `TESTING.md` ("Sample catalogue (P6-01)") and `npm run check:dev-store` carry the new values.

Storefront password: on the development store, the Checkout Kit sheet first shows the store's password page. The tester types the storefront password there; this is the normal way to reach checkout on a development store (architect, 3 October 2026). The live store has no password page, so customers never see it. The app never fills in, stores or logs the password, and no code may be added to do so. The password is not a repository value and never goes into `.env.local`.

## Customer Account API

- Public mobile client. Authorization code flow with PKCE, state and nonce.
- Scopes: `openid email customer-account-api:full`.
- The callback URI uses the `shop.{shop_id}` custom scheme that Shopify requires for mobile apps.
- Login opens in the system browser session, never in an embedded web view.

## Backend custom app: scopes

Keep to the minimum the four backend jobs need: read orders, read products and inventory, write returns. Add a scope only with a decision record.

## Webhook topics (planned)

Order created, order cancelled, fulfilment created and updated, return requested and closed, inventory level updated. Each handler verifies the signature, deduplicates by event ID and is idempotent.

## Product data the app reads

Recorded in P6-01 (7 October 2026) from the development store's sample catalogue (D-069), read over Storefront API `2026-10` with the public token. The field names match the live store (`SHOPIFY_AUDIT.md`).

**Grouping (D-068).** Age group, series and author come from collections, read by handle. The app never parses `productType` or tags.

**Product fields.**
- Title, handle, featured image (the cover; may be missing), price and compare-at price.
- Author: `vendor`. Casing is not consistent across products: the older test products use "J.k. Rowling", the sample books "J.K. Rowling". The author collection (`j-k-rowling`) groups them; the app shows `vendor` as stored.
- Availability, from the one variant each book has:
  - in stock: `availableForSale` true and `currentlyNotInStock` false (this includes a book with stock and "continue selling" on);
  - rented out: `availableForSale` false (stock 0, "deny");
  - orderable at zero stock: `availableForSale` true and `currentlyNotInStock` true (stock 0, "continue selling").
  `quantityAvailable` is not read: it needs an inventory scope the public token does not have.

**Product metafields.** All are readable through the Storefront API.

| Namespace and key | Type | Notes |
| --- | --- | --- |
| `shopify.genre` | `list.metaobject_reference` | Metaobject type `shopify--genre`. Handles: `action-adventure`, `fantasy`, `humor-comedy`, `crime-mystery`, `comics-graphic-novels`, `biography`, `manga`, `realistic-fiction`, `picture-book`, `fairy-tale`, `non-fiction`. The last five are custom values on the live store; in the development store their labels were retyped from the handles ("Manga", "Realistic fiction", "Picture book", "Fairy tale", "Non-fiction"). Since 8 October 2026 they reference the live store's base values (15730, 15732, 15727, 15733, 15731), no longer all "Other" (20866) |
| `shopify.language-version` | `list.metaobject_reference` | Type `shopify--language-version`. `eng-english` (label "ENG- English") on all 40 books |
| `shopify.book-cover-type` | `list.metaobject_reference` | Type `shopify--book-cover-type`. `paperback` on 37 books, `hardcover` on 3. Use this for the book's binding |
| `shopify.target-audience` | `list.metaobject_reference` | Type `shopify--target-audience`. No sample book uses it |
| `custom.publisher` | `list.single_line_text_field` | |
| `custom.language` | `single_line_text_field` | |
| `custom.net_quantity` | `single_line_text_field` | Shown on the store as "Book Type". Casing is inconsistent; prefer `shopify.book-cover-type` |
| `custom.pages` | `single_line_text_field` | Missing on 5 books |
| `custom.service_city` | `list.single_line_text_field` | `bengaluru` in the sample data |
| `custom.isbn_13` | `single_line_text_field` | Missing on 5 books, and damaged on the live store (for example `9.78E+12`). **The app must not show ISBN** |
| `reviews.rating` | `rating` | JSON: `{"scale_min":"1.0","scale_max":"5.0","value":"5.0"}`. Five sample books have one, all 5.0 |
| `reviews.rating_count` | `number_integer` | **May be missing when a rating exists** (`harry-potter-and-the-philosophers-stone-by-j-k-rowling`); the app must handle that |

Each `shopify--*` metaobject has the fields `label` and `taxonomy_reference`. The app reads `label`. The public token resolves these references (checked in P6-01), so it can read metaobjects.

**Storefront filters (probe, P6-01, report only).** `filters` on the products of `junior-readers` returns two filters only: Availability (`filter.v.availability`, type `LIST`: "In stock" 21, "Out of stock" 5; Shopify's "in stock" here means `availableForSale`, so it includes books orderable at zero stock) and Price (`filter.v.price`, type `PRICE_RANGE`, 0 to 99). There is no Genre, author or product-type filter: the development store has no filters configured beyond Shopify's defaults. How the Genre filter works is decided in a later task.

**Genre filter gate (P6-07, development store, 8 October 2026, Storefront `2026-10`, public token, read-only).** After the changes above, before building. All six points passed; nothing differed from Shopify's documentation (the saved schema documents `ProductFilter.taxonomyMetafield`, `Filter` and `FilterValue.input`, and the root `products` query takes only `after`, `before`, `first`, `last`, `query`, `reverse` and `sortKey`).

- **a. `all-books`** is readable and holds the 42 visible books, the same set as the root `products` query; with `filters: [{ available: true }]` it returns 29, exactly the `availableForSale` books.
- **b. Genre filter** on `all-books` and on `junior-readers`: id `filter.v.t.shopify.genre`, label "Genre", type `LIST`, presentation `TEXT`. Each value's `input` is `{"taxonomyMetafield":{"namespace":"shopify","key":"genre","value":"gid://shopify/TaxonomyValue/<n>"}}` and its id `filter.v.t.shopify.genre.gid-shopify-taxonomyvalue-<n>`. On `all-books`, 11 values, count without / with `available: true`: Action & adventure 16 / 12, Biography 1 / 1, Children 3 / 1, Comics & graphic novels 3 / 3, Crime & mystery 4 / 3, Design 4 / 2, Documentary 1 / 1, Drama 14 / 9, Family 2 / 1, Fantasy 13 / 10, Humor & comedy 13 / 12. On `junior-readers`, 8 values (no Children, Design or Family). Availability (`filter.v.availability`) and Price (`filter.v.price`) are still offered.
- **c. Labels:** Shopify gives the five re-based custom genres its built-in names, as on the website: Design (Manga, 15730), Children (Picture book, 15727), Drama (Realistic fiction, 15732), Documentary (Non-fiction, 15731), Family (Fairy tale, 15733).
- **d. Filtering by a value's `input`** returns exactly the books whose `shopify.genre` holds an entry with that `taxonomy_reference`: checked for all 11 values, built-in (such as Fantasy, 13) and custom (such as Design/Manga, 4).
- **e. Combinations:** every value with `available: true` returns exactly its `availableForSale` books, and the same set under every collection sort (`COLLECTION_DEFAULT`, `BEST_SELLING`, `TITLE` both ways, `PRICE` both ways, `CREATED` both ways). With a group: `junior-readers`, Action & adventure and `available: true` give 10. The Genre counts follow the Availability filter; a chosen genre does not change the Genre counts (so the other genres stay listed).
- **f. The genre entries can be listed:** `metaobjects(type: "shopify--genre")` returns all 11 entries with `label` and `taxonomy_reference`; each filter value joins to exactly one entry with a label.
- **Order:** across all 42 books, `all-books` sorted by `BEST_SELLING`, `TITLE`, `PRICE` and `CREATED` (both ways) gives the same order as the root query's `BEST_SELLING`, `TITLE`, `PRICE` and `CREATED_AT`.

**Price filter gate (P6-08, development store, 9 October 2026, Storefront `2026-10`, public token, read-only).** Before building. All four points passed; nothing differed from Shopify's documentation (the saved schema's `ProductFilter.price` takes a `PriceRangeFilter`: `max` optional, "Empty indicates no max price"; `min` "Defaults to zero"). Run as a script outside the repository; `npm run check:dev-store` now asserts a, b and one combined count.

- **Prices on the development store:** one variant per book, all INR. On `all-books` (42): ₹34 7 books (4 with "Available now"), ₹49 16 (12), ₹74 12 (8), ₹99 7 (5). On `junior-readers` (26): ₹34 5 (3), ₹49 13 (10), ₹74 5 (5), ₹99 3 (3). Every book has a compare-at price between ₹150 and ₹450. No book at ₹0 or ₹79 (the live store's outliers, `SHOPIFY_AUDIT.md`).
- **a. The filter:** on `all-books` and on `junior-readers`, with and without `available: true`: id `filter.v.price`, label "Price", type `PRICE_RANGE`, presentation null, one value with id `filter.v.price` and input `{"price":{"min":0,"max":99.0}}` (the store's highest price). That value's `count` is 0; the app reads nothing from this filter, so it does not matter.
- **b. A maximum is inclusive and compares the rental price:** `{ price: { max } }` with no `min` returns exactly the books whose `price` is at or below `max`: on `all-books` 7 (max 34), 23 (49), 35 (74), 42 (99); on `junior-readers` 5, 18, 23, 26. The books at exactly ₹34, ₹49 and ₹74 are returned at that maximum and left out at 33.99, 48.99 and 73.99 (0, 7 and 23 on `all-books`). Matching by the compare-at price would give other sets, so the filter uses the rental price.
- **c. Combinations:** each returns exactly the intersection of its parts, and the same set under all 9 collection sorts (`COLLECTION_DEFAULT`, `BEST_SELLING`, `TITLE` both ways, `PRICE` both ways, `CREATED` both ways, `ID`): on `all-books`, Fantasy up to ₹49 3 (3 with "Available now"), Manga up to ₹34 0, Manga up to ₹74 with "Available now" 2, up to ₹49 with "Available now" 16; on `junior-readers`, up to ₹49 18 (13 with "Available now"), Fantasy up to ₹74 with "Available now" 7. The order of the filters in the list does not change the set. Up to ₹49, "Price, high to low": the first book is ₹49 and none is above it.
- **d. The Genre list while a price is chosen:** `CollectionGenres` still returns the Genre filter with all its values (11 on `all-books`, 8 on `junior-readers`) when the price is sent with it; values with no book at that price then show a count of 0. The app does not send the price with that read (owner, P6-08 answer 2; D-104), so the Genre list follows the group and "Available now" only, as in D-101.

**Catalogue reads (P6-02 to P6-04).** All are named, typed by code generation and go through the Storefront client, 20 books per page:
- `CollectionBooks`: a collection's books by handle, with optional `sortKey` (`ProductCollectionSortKeys`), `reverse` and `filters`: the chosen genre's `taxonomyMetafield` input first (P6-07, D-101), then the chosen price as `{ price: { max } }` with no minimum (P6-08, D-104), then `{ available: true }` for "Available now"; `null` when none. Cache key `collectionBooks(handle)` without options, `collectionBooks(handle, list)` with them (`list` holds `available`, `sort`, `genre` and `maxPrice`). Since P6-07 also Browse's all books, from the `all-books` collection (D-100). Since P6-09 it also selects the collection's `id`, which the collection screen's `view_collection` event sends as a number (D-107).
- `AllBooks` (P6-04, D-083), the root `products` query, was **removed in P6-07** (D-100): every list is a collection.
- `CollectionGenres` (P6-07, D-101): a collection's `filters`, read with `products(first: 1, filters: [{ available: true }])` or no filter, keeping the filter whose id is `filter.v.t.shopify.genre`; each value's `count` and `input` only, **never its `label`** (Shopify's built-in name). Cache key `collectionGenres(handle, available)`.
- `GenreEntries` (P6-07, D-102): `metaobjects(type: "shopify--genre", first: 250)`, following `pageInfo`, with each entry's `label` and `taxonomy_reference`. Cache key `genreEntries()`. `toGenreOptions` (`src/shopify/genres.ts`) joins the two.
- `BookCardByHandle` (the development preview) and `CollectionHandles` (which collections exist, D-076). Since P6-09 `CollectionHandles` also selects each collection's `id`, and `fetchCollectionHandles` gives a map from handle to GID: Browse sends a chosen group's number, and search matches the configured series and age groups by it (D-107, D-109). Still no title and no image.
- `BookPage` (P6-05, D-093): one book by handle for the book page: the card's fields, the cover at `maxWidth: 1200`, `descriptionHtml` (shown as native text, D-091) and `genre: metafield(namespace: "shopify", key: "genre")` with each `Metaobject`'s `type` and `label` field, and since P6-10 its `taxonomy_reference` field, the taxonomy value a genre chip opens (D-113). It reads no other metafield and no rating (D-090, D-092). Cache key `book(handle)`, preset `liveStock`. `npm run check:dev-store` reads the named book with the same selection (2 genre labels on 8 October 2026) and a missing handle (null); since P6-10 also each genre's taxonomy value, and which chips the Genre list of all books with "Available now" on offers (13 October 2026: Action & adventure 15724 and Fantasy 20853, both).
- **"Available" means `availableForSale` in both reads.** Since P6-07 both reads are a collection's Availability filter: `all-books` gives 29 of 42, exactly the `availableForSale` books (D-100; `npm run check:dev-store`). Before P6-07, checked on the development store on 8 October 2026: the root query returned 29 of 42 (21 in stock plus 8 orderable at zero stock) and `junior-readers`' Availability filter 21 of 26, each exactly the `availableForSale` products; `npm run check:dev-store` asserts both. The root query's `query` filter goes through Shopify's search index, so a stock change may take a moment to show there.
- Sort keys per option: D-085 and `src/shopify/sort.ts`.

## Search (P6-06)

**Version and documentation.** Storefront API `2026-10`, the `search` query, checked against the saved schema (`storefront-2026-10.schema.json`) and Shopify's `2026-10` reference page for `SearchUnavailableProductsType` (read 8 October 2026). Arguments used: `query` (the term, a variable only), `types: [PRODUCT]`, `prefix: LAST`, `first: 20`, `after`, `sortKey` (`RELEVANCE` or `PRICE`), `reverse`, `unavailableProducts` (`LAST` or `HIDE`). `totalCount` gives the count line; Shopify caps it at 1,000. No `predictiveSearch`, articles or pages (owner, answers 1 and 3; D-096).

**`SearchBooks`** (`src/shopify/catalogue.ts`) selects the card's fields under `... on Product`, with `__typename` so that anything other than a book is dropped. Cache key `search(term, { available, sort })`, preset `catalogue`, in memory only (D-059, D-097).

**"Available now" gate (owner, answer 2), development store, 8 October 2026.** For harry (6), the (29), dahl (3), kid (7) and ha (0), both `unavailableProducts: HIDE` and `productFilters: [{ available: true }]` returned exactly the `availableForSale` books among the `LAST` results, and `totalCount` matched the books returned. Same meaning, so the build went ahead with `HIDE`: one argument switches between off (`LAST`) and on (`HIDE`). `npm run check:dev-store` asserts it for harry and the.

**Differs from Shopify's documentation: the price sort.** The documentation says `LAST` shows unavailable products "after all other matching results". With `sortKey: PRICE` it does not: rented-out books come last only among books of the same price. For harry, "Price, low to high" gives the ₹49 books with the rented-out `harry-potter` after the orderable ones at ₹49, then the ₹74 books. Owner (answer 1): accept Shopify's order, no workaround in the app. `npm run check:dev-store` asserts the order both ways, and fails if `harry-potter` becomes last overall, so a change at Shopify is noticed.

**Matching (probe, development store, 8 October 2026):**
- Titles and authors (`vendor`) match: "harry" 7, "dahl" and "roald dahl" 3 (the three Roald Dahl books), "kinney" 4, "murty" 2.
- Partial words match titles from 3 letters ("har", "gru", "wim", "pot") but not from 2 ("ha" finds only *One of Us Is Lying*), and never authors ("dah" 0, "dahl" 3; "kin" 0). So typing searches from 3 letters or digits and the keyboard's search key from 2 (owner, answer 3).
- The draft `the-giraffe-and-the-pelly-and-me` is never found ("pelly", "giraffe" and "the" checked).
- **Shopify's search matched differently from 8 October 2026** (P6-07), when Search & Discovery was installed on the development store: that day "the" found 16 books (12 with `HIDE`) and "kid" 9 (8), against every book and 7 in P6-06; on 9 October "the" again found all 42 (29 with `HIDE`) and "kid" 9 (8). "harry" (7, 6 available), "dahl" (3) and "zzqxv" (0) did not change, the draft was never found, and `HIDE` always gave exactly the `availableForSale` books among the results (D-096 holds). **The cause is not proven**; the live store also has Search & Discovery installed. So `npm run check:dev-store` no longer counts broad words (architect's review of PR #20): for "the" and "kid" it checks only that `HIDE` returns exactly the `availableForSale` books among that term's results; it keeps the exact counts for harry, dahl and zzqxv and the draft check.
- **Shopify's search syntax works, as on the website, and the app sends the term as typed (owner, answer 2):** `title:harry` and `harry:` find the 7 Harry books, as does `"harry"`; `-harry` finds the 35 books without "harry" (`NOT`); `harry -potter` 35; `harry OR` all 42; `vendor:dahl` 3.
- **Symbols:** `*`, `har*`, `&`, `%`, `#`, `{}` and `\"` each find all 42 books; `:`, `-`, `(`, `)`, `\`, `OR`, `AND`, `NOT` alone, an emoji and Hindi find 0. None of 31 odd terms caused an error. Only letters and digits count towards the minimum length, so a term of symbols alone never runs a search (owner, answer 2).
- A 100-character term finds 0, without an error.

## Checkout behaviour to respect

- Order subtotal under ₹500 (R2). The rule checks the subtotal, not the total with shipping (P3-02).
- Pincode prefix rule (R3).
- Flat shipping rates and the automatic shipping discount: ₹75 off either rate from ₹200 (R4, D-031).
- ACOD: the cash-on-delivery rate goes with the Cash on Delivery payment method, which is offered only up to a cart total of ₹500 (D-031).
- Razorpay is an offsite provider; UPI may hand off to another app.

## Early checks

Each check runs before anything is built on its result. Check 2 ran in Phase 3. Checks 1a and 1b run at the launch rehearsal in Phase 19 (D-033). Checks 3 to 6 run in the phase that builds the feature each one needs (D-034). Phase numbers are in `ROADMAP.md` (D-035).

| # | Check | Needs a real phone | When and where |
| --- | --- | --- | --- |
| 1a | Razorpay inside Checkout Kit: redirect to Razorpay and return to the app, on a real iPhone and a real Android phone | Yes | Phase 19, launch rehearsal, live store, one small real order (D-033). Cannot run on the development store (see "Development store") |
| 1b | Razorpay UPI Intent: hand-off to a real UPI app and back | Yes | Phase 19, launch rehearsal, live store, same order or session as 1a (D-033). Razorpay supports it only in live mode |
| 2 | Cash on delivery and the checkout rules inside Checkout Kit | No. A development build on an emulator or simulator is enough | **Passed on Android, 3 October 2026 (P3-02, below).** iPhone side in Phase 9, on the development store, once Apple access exists (D-036) |
| 3 | A guest order from the website appears after login with the same email | No | Phase 7, login and account (Customer Account API), on the development store |
| 4 | A return filed through the Admin API appears for staff to approve, on the Basic plan | No | Phase 10, backend foundation (needs store addition 3, the custom app), on the development store, which has Basic-plan features (see above) |
| 5 | Links from justbookify.in open the app (verification files on a Shopify-hosted domain) | Yes. A signed build on a device | Phase 12, notifications and deep links (risk 17). The verification files go on the live domain, so this check needs the owner's go-ahead |
| 6 | Judge.me allows reading and submitting reviews on the store's plan | No | Phase 13, reviews |

Razorpay test mode and live mode: Razorpay's documentation says UPI Intent can be tested only in Live Mode, not in Test Mode (recorded on 3 October 2026 at the architect's instruction). That is why check 1 was split into 1a and 1b in P3-01. 1a was to run in test mode on the development store; D-033 moved it to the launch rehearsal with 1b.

### Launch rehearsal: early checks 1a and 1b

Decided on 3 October 2026 (D-033). Part of Phase 19. Not scheduled yet; it needs the owner's approval when it is scheduled.

Why not earlier: Razorpay is offered only to stores with an Indian business entity. The development store's entity is in Bahrain, and changing it requires the owner's personal identity details, which the owner declined to enter for a test store. So no prepaid checkout can be tested before the rehearsal. Risk 2 stays open and high until then.

What it is: on the live store, with the owner's approval on the day, one small real order through the app's checkout. Claude never places an order on the live store (`CLAUDE.md` rule 5). The book taken out of circulation and the delivery it triggers are accepted by the owner for this one order (risk 5).

Needs first:

- Store additions 1 and 2 on the live store (Headless channel and published products), each with the owner's go-ahead (D-008).
- A build that points at the live store.
- The checkout presentation flag below, so a failure can be handled without a rebuild.
- Apple access (D-036, requested in Phase 9) for the iPhone half of 1a.

What to record, for each of iPhone and Android:

- 1a: Razorpay is offered with the "Prepaid" rate; "Pay now" opens Razorpay; a completed payment returns to Shopify's confirmation page inside the sheet, the order exists, and the app receives `completed`. A cancelled payment returns to checkout without an order. Closing the sheet during the Razorpay step gives `close` and no order.
- 1b: paying by UPI Intent hands off to a real UPI app and comes back to checkout, then to the confirmation page.

Mitigation to build with the checkout screens (Phase 9): how checkout is presented is switchable by a remote feature flag (Firebase Remote Config, D-012): the in-app Checkout Kit sheet, or the system browser with a return link to the app. If 1a or 1b fails at the rehearsal, the flag moves checkout to the browser with no rebuild. The flag's plumbing is part of the Phase 4 mobile foundation; its use is part of the checkout screens in Phase 9.

### P3-01: Checkout Kit opens the development store's checkout

Scope: Checkout Kit opens the development store's checkout from the Android development build, and a test order completes with cash on delivery. This is not early check 1 or 2. Neither Razorpay nor the ACOD or SMART Checkout Rules apps are involved.

How: the development-only screen `src/app/dev-checkout.tsx` builds a one-item cart with the named Storefront operations `DevCheckoutProduct` and `DevCheckoutCartCreate`, then presents the cart's checkout URL in Checkout Kit. The screen shows Checkout Kit's `completed`, `close` and `error` events in its status line and logs nothing, so the status line is the record of what the app received.

Result, 3 October 2026, on the owner's Android phone (development build bb476119, JavaScript from Metro): **pass, with the development store's password page in front of checkout.**

1. Tapping "Open test checkout" created a cart over the Storefront API and opened the Checkout Kit sheet ("Checkout").
2. Inside the sheet Shopify first showed its development-store password page: the Shopify logo, "JustBookify Dev", "This store is password protected. Use the password to enter the store.", a password field, "Enter", and "Are you the store owner? Log in here". Claude stopped here and reported it. The architect ruled it a development-store artifact (see "Storefront password" above).
3. The owner typed the storefront password. Checkout did **not** appear straight after the password. It appeared only after the owner closed the sheet and tapped "Open test checkout" again, which created a second cart (the first is left abandoned on the development store).
4. The owner completed the order with the manual cash-on-delivery method. The test screen's status line then read "Checkout completed: the order was placed.", so the app received Checkout Kit's `completed` event (owner-reported; the screen logs nothing, so the Metro log shows only the bundle loads).
5. The order appears in the development store's admin (owner-confirmed). Claude did not read it: the Admin tools are not used in this project.

What this shows:

- Checkout Kit 3.9.1 builds and runs on Expo SDK 57 / React Native 0.86.3 on Android, presents a checkout URL from the Storefront API, and reports `completed` to the app.
- On a development store the storefront password gates the checkout URL inside Checkout Kit. Checkout Kit renders the password page; it does not raise `storefront_password_required` as an error. After the password is accepted the sheet does not continue to checkout by itself; the checkout has to be presented again. Checkout Kit has no supported bypass (open feature request Shopify/checkout-sheet-kit-swift#151), and none is wanted.
- Not covered: Razorpay, ACOD and SMART Checkout Rules (early checks 1 and 2), iOS, and the fees and shipping rate shown at checkout.

Acceptance checks (wording as approved for P3-01, updated 3 October 2026):

| Check | Result |
| --- | --- |
| Checkout Kit pinned to an exact version, with a decision record citing the documentation checked and the date | Pass: 3.9.1, D-030 |
| From the Android development build, the test screen opens the development store's checkout in Checkout Kit. On a development store the sheet first shows the store password page; the tester enters the storefront password, which the app never fills in, stores or logs. The live store has no password page | Pass |
| A test order completes on the development store with cash on delivery, and the app receives Checkout Kit's `completed` event | Pass (owner-confirmed: status line and the development store's admin) |
| The test screen and its link exist only in development builds, and tests prove it | Pass |
| No secret, store domain, token, storefront password or live-store value in the repository, the logs or the screen | Pass |
| Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green | Pass (CI result on the pull request) |
| Razorpay's live-mode-only UPI Intent recorded, and early check 1 split into 1a and 1b | Pass |

### P3-02: early check 2, ACOD and SMART Checkout Rules inside Checkout Kit

Scope: on the owner's Android phone, with the Android development build, check that the cash-on-delivery rules (ACOD) and the three SMART Checkout Rules rules behave inside Checkout Kit as the live store's settings say they should (D-031). Razorpay and iOS are not covered.

What the documentation says (read 3 October 2026):

- ACOD (App Store listing "ACOD: Cash On Delivery COD Fee", E-TRADE PARTNER): the app edits Shopify Functions, namely delivery customizations and payment customizations. It links Cash on Delivery payment to shipping methods and can limit cash on delivery by order total. A "Development Store" tier is free with all features. The listing says nothing about Checkout Kit, headless storefronts or mobile apps.
- SMART Checkout Rules (App Store listing, E-TRADE PARTNER, Built for Shopify): the app edits Shopify Functions, namely delivery customizations, payment customizations, and cart and checkout validations, and edits discounts. The listing says nothing about Checkout Kit, headless storefronts or mobile apps.
- Shopify ("Embed Checkout Kit", shopify.dev): Checkout Kit renders the same checkout that buyers see on the web, and Shopify Functions run discounts, payment customizations and delivery rules at checkout. So both apps are expected to apply inside Checkout Kit; the on-device check confirms it.

How: the development-only test screen `src/app/dev-checkout.tsx` lists the development store's variants that are available for sale (named operation `DevCheckoutProduct`), with a quantity stepper (0 to 10) for each and an estimated subtotal. "Open test checkout" creates a cart from the chosen lines (`DevCheckoutCartCreate`) and presents it in Checkout Kit. The screen then shows Shopify's own cart subtotal and any cart warning codes (for example `MERCHANDISE_NOT_ENOUGH_STOCK`), never the URL, domain or token. No dependency or native change, so development build bb476119 is reused with JavaScript from Metro.

The expected results come from the live store's own settings, so a matching result needs no second run. Only a case whose result differs is tried again on the development store's website checkout.

Result, 3 October 2026, on the owner's Android phone (development build bb476119, JavaScript from Metro): **pass on every case.** All three sample books cost ₹49, so carts were built from 1, 4, 5, 9, 10 and 11 books. Exactly ₹200 cannot be reached with ₹49 books; ₹196 and ₹245 bracket it. No result differed from the expected one, so no case was repeated on the website checkout.

| # | Case | Cart / input | Expected | Result |
| --- | --- | --- | --- | --- |
| 1 | Rates under ₹200 | 1 book, ₹49; Karnataka 560001 | "Prepaid" ₹75 and "Cash on Delivery" ₹125; no separate cash-on-delivery fee | **Pass.** Prepaid ₹75.00, Cash on Delivery ₹125.00. With Cash on Delivery: subtotal ₹49, shipping ₹125, total ₹174, no fee line. 4 books (₹196): the same two rates, no discount |
| 2 | ACOD ties rate and payment | 1 book | "Cash on Delivery" rate: Cash on Delivery payment offered. "Prepaid" rate: not offered | **Pass.** Cash on Delivery rate: "Cash on Delivery (COD)" is the only payment method. Prepaid rate: Cash on Delivery is hidden; checkout shows "This store can't accept payments right now" and a disabled "Pay now", because the development store has no prepaid provider (Razorpay cannot be installed there, D-033) |
| 3 | Shipping discount | 5 books, ₹245 | Prepaid ₹0, cash on delivery ₹50 | **Pass.** Prepaid ₹75 struck through, "FREE"; Cash on Delivery ₹125 struck through, ₹50, labelled "SHIPPING DISCOUNT". Total with cash on delivery ₹295, "Total savings ₹75" |
| 4 | R2 "Shipping Price Restriction" | 11 books, ₹539 | Checkout blocked | **Pass.** Banner: "Your order doesn't meet our current requirements. At the moment, we accept orders with a total amount of ₹500 or less." No order could be placed |
| 5 | ACOD ₹500 limit | 9 books (₹441) and 10 books (₹490) | Record whether cash on delivery is offered | **Recorded.** 9 books: offered, total ₹491. 10 books: still offered with a total of ₹540 (₹490 + ₹50 shipping), and the order completed (case 7). So ACOD's limit does not count shipping |
| 6 | R3 "Shipping Restriction" | Outside: Maharashtra 400001. Inside: Karnataka 560001 | Outside blocked; inside accepted | **Pass.** Maharashtra 400001: both rates still appear (the development store's zone is all of India), and Complete order with cash on delivery shows the banner "Your order doesn't meet our current requirements. At the moment, we accept orders only within Karnataka, Andhra Pradesh, Tamil Nadu, Telangana and Kerala." Karnataka 560001: accepted (case 7) |
| 7 | Completion | 10 books, ₹490, cash on delivery, Karnataka 560001 | Order completes; status line "Checkout completed"; order in the development store's admin | **Pass.** Shopify's confirmation page: cash-on-delivery shipping and payment, ₹540.00 (₹615.00 before the discount). The status line read "Checkout completed: the order was placed." The owner confirmed the ₹540 order in the development store's admin. Claude did not read it |

What this shows:

- On Android, ACOD and all three SMART Checkout Rules rules behave inside Checkout Kit as the live store's settings say they should. Shopify Functions run in Checkout Kit as on the web, as Shopify's documentation states. No fallback is needed.
- R2 is checked against the **subtotal**: a ₹490 subtotal with ₹50 shipping (total ₹540) is accepted. Its customer-facing message says "total amount of ₹500 or less", which is the SMART rule's own wording, set by the owner. The app's cart hint must use the subtotal (R2).
- ACOD's ₹500 cash-on-delivery limit does not count shipping either. With R2 blocking subtotals of ₹500 or more, it never removes cash on delivery from an order that R2 allows.
- R3 also blocks an empty pincode: changing the state clears the address fields, and submitting then shows the R3 banner.
- The test order took Harry potter's stock on the development store from 10 to 0. The owner can restock it in the development store's admin.
- Differences between the development store and the live store, not caused by Checkout Kit: the development store's zone is all of India (the live zone is five states), and its checkout shows the phone number as optional (the audit says the live store requires it with the shipping address).
- Not covered: iOS (Phase 9, D-036) and Razorpay (early check 1a, Phase 19).

Acceptance checks:

| Check | Result |
| --- | --- |
| Early check 2 has a written result for each case: pass, fail or a named fallback | Pass: seven cases above |
| Any app code change is development-only and tested | Pass: the test screen and its helper only; 86 tests |
| No secret, storefront password or live-store value in the repository; nothing on the live store changed | Pass |
| Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green | Pass locally; CI result on the pull request |
