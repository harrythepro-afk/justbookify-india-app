# Next task (proposal): P6-01, sample catalogue for the development store

Status: proposal. P5-03 completed Phase 5 (PR #13, approved by the architect on 7 October 2026). P6-01 starts when the owner starts it.

## Phase 5: Shopify data layer (complete)

| Task | Scope | Decisions |
| --- | --- | --- |
| P5-01 (done, 2f2b3e1) | Typed Storefront API client: code generation from the saved `2026-10` schema, buyer context, typed errors, retries for queries only, 30-second limit | D-054 to D-060 |
| P5-02 (done, ac714e8) | One app-wide TanStack Query cache, in memory only: freshness presets, error reporting in one place, foreground refetch, `clearStorefrontCache()` and `clearAllCaches()`, hooks-only boundary enforced by ESLint | D-061 to D-063 |
| P5-03 (done, PR #13) | Network awareness with `expo-network` (queries pause offline, mutations never queue), a development APK built for `arm64-v8a` only (95.1 MB, was 246 MB), and local debug builds as a fallback | D-064 to D-067 |

## Phase 6: catalogue, search, filtering

The catalogue screens (Home rows, Browse with filters and sort, the book card, the book page) need data in the development store that has the same structure as the live store. Today the development store holds 3 sample products, 2 of them available at ₹49 (`CURRENT_STATUS.md`, P5-01). That is not enough to build or test a filter, a sort, a "Rented Out" badge or pagination.

The live store's structure is now recorded in `SHOPIFY_AUDIT.md`: "Product fields in detail", "Collections" and "Product metafields". The architect read it on 7 October 2026 through a read-only connection; Claude never reads the live store.

## Proposed decision for Phase 6 (needs the owner's approval)

**Browse by age group, series and author through the store's own collections, by handle, never by parsing `productType` or tags.**
- The live `productType` holds 16 inconsistent age-group variants (for example `emerging-readers; junior-readers` and `Teenage Readers`), and series tags come in mixed formats (`HarryPotter`, `My Hero Academia`, `a-z-mysteries`).
- The store's smart collections already group books by age group (`early-readers` … `teenage-readers`), series (`harry-potter-series` …) and author (`roald-dahl` …).
- Reading collections by handle keeps the grouping rules in Shopify, where staff already maintain them. Such a rule change then needs no app release, and the app never has to tidy the data.
- The app would keep a configured list of handles for each Home row and Browse filter in `src/config/`, because they are store-specific (the Bahrain app would have its own).

If approved, this becomes a decision record at the start of P6-02.

## Goal of P6-01

Agree and load a sample catalogue into the **development store only**, with the live store's structure:
- the same product fields;
- the same metafield namespaces, keys and types;
- the same kinds of collections, with the same handles and rules.

No app screens are built in P6-01. It ends with:
- the data in place;
- the exact field names recorded in `SHOPIFY_INTEGRATION.md`;
- a read-only check over the Storefront API.

## What the development store needs

**40 books.** That gives:
- more than one page at a page size of 20, so pagination can be tested;
- at least two values for every grouping, with several books in each;
- every availability state below.

Each book mirrors a live product (`SHOPIFY_AUDIT.md`):

| Field | Live store | Sample data needed |
| --- | --- | --- |
| Variant | One variant per book; SKU empty; inventory tracked | The same for all 40 |
| Cover | Product image | One image per book, made for testing: plain covers with the sample title, never real book covers (copyright). Two books with no image, to test the missing-cover fallback |
| Author | `vendor` | 8 authors. 3 have at least 4 books each, for the author collections and the Home row; the rest have 1 to 3. Use author names that match sample author collections (for example `roald-dahl`, `enid-blyton`, `jeff-kinney`), plus one very long author name |
| Age group | `productType`, 16 inconsistent variants joined with `"; "` | Each of the five age groups on at least 4 books. Include the live store's messy forms on purpose: a single value (`early-readers`), two joined values (`emerging-readers; junior-readers`), and other spellings (`Junior readers; Pre-teen readers`, `Teenage Readers`). The app must never parse this field, and the data should show it |
| Series | Tags, mixed formats | 4 series with 3 to 6 books each, tagged exactly as on the live store: `HarryPotter`, `WimpyKids`, `GeronimoStilton` (plus one book tagged `Geronimo`, which the live `geronimo-stilton` collection also catches), and `My Hero Academia`. 12 books in no series |
| New arrival | Tag `new-arrival` | 8 books |
| Genre | `shopify.genre`, list of metaobject references (category metafield, "Books in Media") | At least 5 genres, each on at least 4 books. Needs the product category "Books in Media" on each sample product, so that Shopify offers the category metafields and their metaobject entries |
| Language version, cover type | `shopify.language-version`, `shopify.book-cover-type`, lists of metaobject references | Filled on most books (English, and one other language on a few; paperback and hardcover) |
| Target audience | `shopify.target-audience`, list of metaobject references (212 live products) | Filled on about 5 books only, as on the live store |
| Rating | `reviews.rating` (rating), `reviews.rating_count` (integer) | A rating and a count on about 10 books; a rating without a count on 2 (the live store has 75 ratings but only 59 counts); none on the rest |
| Service city | `custom.service_city`, list of text | Bangalore, Kolkata and both, all present |
| Publisher | `custom.publisher`, list of text | Most books |
| Language | `custom.language`, text | Most books |
| Book type | `custom.net_quantity`, text, displayed as "Book Type" | Paperback or hardcover on most books. The key is misleading; the app must label it "Book Type" |
| Pages, weight | `custom.pages`, `custom.item_weight`, text | About two thirds of books (the live store has gaps) |
| ISBN | `custom.isbn_10`, `custom.isbn_13`, text | Most books, a few deliberately damaged (for example `9.78E+12`), a few empty. The app must not rely on them |
| Price | Product price, ₹34 to ₹99 (R1) | Spread across the range, including exactly ₹34 and ₹99 |
| Retail price | Compare-at price | On most books, missing on a few |
| Title | Product title | One very long title; two products with the same title (the live store has duplicates) |

**Availability states (R8):**
1. In stock, one copy: about 20 books.
2. In stock, several copies (169 live products have more than one): about 6 books.
3. Out of stock, not orderable ("Rented Out" badge and "Notify me"): about 8 books.
4. Out of stock but orderable, set to keep selling at zero stock (best-sellers on the live store): about 4 books.
5. Not published to the Headless channel (must never appear in the app): 2 books.

**Collections, all smart, with the live handles:**
- **Age groups:** `early-readers`, `emerging-readers`, `junior-readers`, `pre-teen-readers`, `teenage-readers`, each by `productType`.
- **Series:** `harry-potter-series` (tag `HarryPotter`), `wimpy-kid-series` (`WimpyKids`), `geronimo-stilton` (`GeronimoStilton` or `Geronimo`), and one for `My Hero Academia`.
- **Authors:** three of `roald-dahl`, `enid-blyton`, `jeff-kinney`, `ruskin-bond`, `rick-riordan`, `sudha-murthy`, each by `vendor`.
- **Others:** one, for example `read-it-yourself`.
- **One collection with no books**, to test the empty state.

## Questions for the owner before starting

1. **Smart collection rules, exactly.** For the sample collections above, what does each live rule say? For example "Product type contains `early-readers`" or "is equal to", and whether a collection matches any condition or all of them. With joined values such as `emerging-readers; junior-readers`, "contains" and "is equal to" give different books, so the sample rules must match the live ones. The architect or the owner reads these; Claude never reads the live store.
2. **The live `geronimo-stilton` rule** ("`GeronimoStilton` or `Geronimo`"): is it a tag-equals rule on both tags, matching any?
3. **How the data gets in.** Claude can prepare a product CSV in Shopify's import format with the metafield columns, plus the test covers, for the owner to import into the development store's admin. Category metafields (`shopify.*`) and collections would be set by hand from a written checklist. Or does the owner prefer another route? Claude does not use the Admin API or the Shopify Admin MCP tools (rule 13).
4. **Ratings.** The live `reviews.rating` and `reviews.rating_count` come from Judge.me. Writing sample values straight into those metafields on the development store seems enough for the catalogue screens, with Judge.me itself left to Phase 13 (early check 6). Agreed?
5. **Is 40 books right?** Or would the owner like a different count?

## Steps

1. The owner answers the questions. Claude records the exact product fields, metafield namespaces, keys and types, and the collection handles and rules in `SHOPIFY_INTEGRATION.md` ("Product data the app reads").
2. Claude prepares the sample data and the owner loads it into the development store:
   - the CSV;
   - the test covers;
   - a checklist for the category metafields, the metafield definitions and the collections.
3. A read-only check over the Storefront API, extending `npm run check:dev-store`, confirms all of the following:
   - the counts per availability state;
   - each sample collection by handle, with the expected number of books;
   - every metafield above is readable;
   - the unpublished books are absent.
4. Docs:
   - `CURRENT_STATUS.md`;
   - `TESTING.md` (the sample catalogue as the test fixture for Phase 6);
   - the proposed decision, if the owner approves it;
   - the next task (P6-02, the first catalogue screen).

## Out of scope

- Any app screen (from P6-02).
- Anything on the live store, including reading it: the architect or the owner supplies its structure.
- Real book covers or descriptions copied from publishers.
- Parsing `productType` or tags in the app (see the proposed decision).

## Follow-ups (recorded, not part of P6-01)

- **Release gate: analytics consent (from P4-04):** no build goes to any tester other than the owner until all of these hold (`TESTING.md`; D-048):
  - the consent request is built (Phase 7, at the placement the owner chooses between the two in D-048) and works;
  - the Account switch withdraws consent at once;
  - a phone without consent sends nothing;
  - the privacy policy's app section is published.
- **Privacy policy app section (owner's task, risk 21):** before any outside tester, the store's privacy policy needs an app section, reviewed by a local adviser together with the draft consent wording. It covers:
  - analytics consent;
  - usage linked to the customer account;
  - the 14-month retention;
  - install-source reporting;
  - the events and data Firebase sends by itself once consent is granted (`ANALYTICS.md`);
  - crash reports (Sentry);
  - Firebase.
- **Analytics retention (owner, D-051):** set event data retention to 14 months, with "Reset user data on new activity" off, in the development Google Analytics property now, and in the staging and production properties when they are created.
- **Phase 7 (D-050):** the analytics user ID for consenting customers after login, cleared on logout and on withdrawal. The consent request must say that usage is linked to the account.
- **First staging build (from P4-02 and P4-03), a release gate:** no build goes to any tester other than the owner until it passes (`TESTING.md`, risks 19 and 20). It needs:
  - `EXPO_PUBLIC_SENTRY_DSN` as an EAS variable for the staging build's environment, an EAS-generated keystore for `com.justbookify.india.staging` (a decision), an installable APK, and a way to trigger the test crash. Sentry must receive a native crash, source maps must upload, and the raw crash event must show no IP address, city, device ID, store domain or token.
  - The staging Firebase project, with `google-services.json` for `com.justbookify.india.staging` as `GOOGLE_SERVICES_JSON` in the EAS preview environment (D-044). The build must be shown to fetch a changed flag (`TESTING.md`, "Release gate: feature flags").
  - The APK permission check (`TESTING.md`), and a permission list holding only what the app needs (`SYSTEM_ALERT_WINDOW`, external storage and `CHANGE_WIFI_MULTICAST_STATE` absent or justified).
  - A fresh install reaches Home on its first launch, with no stuck splash screen.
- `npm run audit:gate` exception for `@grpc/grpc-js` (D-047) is reviewed by 2026-11-15, with the `braces` entry; it never applies to the Phase 10 backend.
- Phase 9: the checkout flag must take effect without waiting for two restarts (D-046).
- Phase 14: restrict the Android API key in each `google-services.json`, then repeat the flag fetch check on every build (D-044).
- **Store variables for EAS (from P5-01):** add `EXPO_PUBLIC_STORE_COUNTRY` and `EXPO_PUBLIC_STORE_LANGUAGE` to the EAS environment when the staging build is set up (D-058).
- **Storefront domain for staging and production (architect, P5-01):** when the staging and production configurations are set up, confirm from Shopify's documentation which store domain the Storefront API calls should use, so that requests are not redirected.
- **Code generator audit entries (D-060):** reviewed by 2026-11-15 with the `braces` and `@grpc/grpc-js` entries; re-checked whenever the preset or the codegen CLI is upgraded; each removed in the commit that picks up a compatible fix.
- **Phase 6, foreground refetch with real data (owner, P5-02 phone check):** verify on the phone that a screen refetches when the app returns to the foreground. While the app has been in the background for more than 30 seconds, the owner changes a sample book's stock in the development store; on returning to the app, the screen must show the new value. (In P5-02 this was not observable on the phone and was accepted on the unit test `__tests__/query/focus.test.ts`.)
- **Phase 9, Checkout Kit TLS errors (owner, P5-02 phone check):** the app's log showed two TLS handshake errors (`net_error -101`) inside Checkout Kit's web view while the development store's password page loaded. The page itself loaded. Re-check during Phase 9's checkout tests.
- **Phase 6, screen focus (D-062):** decide whether stack screens that stay mounted also refetch when they regain focus (TanStack's `useFocusEffect` pattern).
- **Phase 7, logout (D-061):** call `clearAllCaches()`; customer data gets its own key root and is cached in memory only.
- **Expo SDK 57 patch releases (owner, P5-03):** `expo` 57.0.27, `expo-constants` 57.0.21, `expo-linking` 57.0.12 and `expo-router` 57.0.25 are out; `npx expo-doctor` fails its version check until they are installed with `npx expo install --fix` (pinned exactly afterwards). Do it with the next task that needs a native build, so there is one build.
- **Sentry, offline case (P5-03):** the owner may confirm that the development Sentry project shows no new event from the P5-03 phone check (7 October 2026, 03:13 to 03:18 IST).
- **Local builds (D-067):** a fallback only, when the EAS queue is stuck. On this computer they need about 5 GB of free memory, other heavy programs closed, and `--max-workers=2`.
