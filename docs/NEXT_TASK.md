# Next task (proposal): P6-01, sample catalogue for the development store

Status: proposal. It starts after P5-03 is merged and the owner starts it. P5-03 completed Phase 5.

## Phase 5: Shopify data layer (complete)

| Task | Scope | Decisions |
| --- | --- | --- |
| P5-01 (done, 2f2b3e1) | Typed Storefront API client: code generation from the saved `2026-10` schema, buyer context, typed errors, retries for queries only, 30-second limit | D-054 to D-060 |
| P5-02 (done, ac714e8) | One app-wide TanStack Query cache, in memory only: freshness presets, error reporting in one place, foreground refetch, `clearStorefrontCache()` and `clearAllCaches()`, hooks-only boundary enforced by ESLint | D-061 to D-063 |
| P5-03 (done, awaiting review) | Network awareness with `expo-network` (queries pause offline, mutations never queue) and a development APK built for `arm64-v8a` only | D-064 to D-066 |

## Phase 6: catalogue, search, filtering

The catalogue screens (Home rows, Browse with filters and sort, the book card, the book page) need data in the development store that has the same structure as the live store. Today the development store holds 3 sample products, 2 of them available at ₹49 (`CURRENT_STATUS.md`, P5-01). That is not enough to build or test a filter, a sort, a "Rented Out" badge or pagination.

## Goal of P6-01

Agree and load a sample catalogue into the **development store only**, mirroring the live store's structure as recorded in `SHOPIFY_AUDIT.md` ("Products") and `SHOPIFY_INTEGRATION.md` ("Product data the app reads"). No app screens are built in P6-01. It ends with the data in place, the exact field names recorded, and a read-only check over the Storefront API.

## What the development store needs

**40 books.** That gives:
- more than one page at a page size of 20, so pagination can be tested;
- at least two values for each filter, with several books under each value;
- every availability state below.

Each book has the structure the audit records for the live store:

| Field | Live store structure (`SHOPIFY_AUDIT.md`) | Sample data needed |
| --- | --- | --- |
| Variant | One variant per book; SKU empty; inventory tracked | The same for all 40 |
| Cover | Product image | One image per book, made for testing: plain covers with the sample title, never real book covers (copyright). Two books with no image, to test the missing-cover fallback |
| Author | Vendor field | 8 authors: 3 with at least 4 books each (Home "authors" row), the rest with 1 to 3. One very long author name |
| Age groups | Product type | Every age-group value used on the live store, each on at least 4 books, written exactly as on the live store |
| Series | Tags | 4 series, each with 3 to 6 books, written exactly in the live tag format; 12 books in no series |
| New arrival | Tag (`SHOPIFY_INTEGRATION.md`) | 8 books, in the live tag format |
| Genre | Product metafield | At least 5 genres, each on at least 4 books; same namespace, key and type as live |
| Service city | Product metafield | Bangalore and Kolkata, both present; same namespace, key and type as live |
| Publisher, pages, ISBN, language | Product metafields | Filled on most books; ISBN left empty on a few (the live store has damaged values, so the app must not depend on it) |
| Rating | Judge.me metafields | A rating and a count on about half the books, none on the rest; the same namespace and key as live. Whether Judge.me's metafields can be written on the development store without installing Judge.me is a question below |
| Price | Product price, ₹34 to ₹99 (R1) | Spread across the range, including exactly ₹34 and ₹99 |
| Retail price | Compare-at price | On most books, missing on a few |
| Title | Product title | One very long title; two products with the same title (the live store has duplicates) |

**Availability states (R8):**
1. In stock, one copy: about 20 books.
2. In stock, several copies (169 live products have more than one): about 6 books.
3. Out of stock, not orderable ("Rented Out" badge and "Notify me"): about 8 books.
4. Out of stock but orderable, set to keep selling at zero stock (best-sellers on the live store): about 4 books.
5. Not published to the Headless channel (must never appear in the app): 2 books.

**Collections:** the live store's collections that the website's home page and catalogue use, recreated with the same names, handles and rules (automatic or manual), each holding some sample books. The audit does not list them; see the questions below.

## Questions for the owner before starting

1. **Exact field names and values from the live store.** The audit records where each field lives, not its exact names. Please supply them from the live store's admin. Claude never reads the live store.
   - the metafield definitions: namespace, key and type for genre, service city, publisher, pages, ISBN, language and the Judge.me rating;
   - the list of age-group values used as product types;
   - the series tag format, with two examples;
   - the new-arrival tag;
   - the collections the website uses, with their rules.
2. **How the data gets in.** Claude can prepare a product CSV in Shopify's import format, plus the test covers, for the owner to import into the development store's admin. Metafield definitions and collections would be created by hand from a written list. Or does the owner prefer another route? Claude does not use the Admin API or the Shopify Admin MCP tools (rule 13).
3. **Judge.me ratings.** Install Judge.me's free plan on the development store, or write sample values into metafields with the same namespace and key?
4. **Is 40 books right?** Or would the owner like a different count?

## Steps

1. The owner answers the questions. Claude records the exact metafield namespaces and keys in `SHOPIFY_INTEGRATION.md` ("Product data the app reads").
2. Claude prepares the sample data (CSV, covers and a checklist for the metafields and collections). The owner loads it into the development store.
3. A read-only check over the Storefront API, extending `npm run check:dev-store`, confirms all of the following:
   - the counts per availability state;
   - every filter value is present;
   - the metafields are readable by the storefront;
   - the unpublished books are absent.
4. Docs: `CURRENT_STATUS.md`, `TESTING.md` (the sample catalogue as the test fixture for Phase 6), and the next task (P6-02, the first catalogue screen).

## Out of scope

- Any app screen (from P6-02).
- Anything on the live store, including reading it: the owner supplies its field names.
- Real book covers or descriptions copied from publishers.

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
