# Next task (proposal): P6-02, catalogue data hooks and the book card

Status: proposal. P6-01 recorded and checked the development store's sample catalogue (branch `p6-01-sample-catalogue`, awaiting review). P6-02 starts when the owner starts it.

## Phase 5: Shopify data layer (complete)

| Task | Scope | Decisions |
| --- | --- | --- |
| P5-01 (done, 2f2b3e1) | Typed Storefront API client: code generation from the saved `2026-10` schema, buyer context, typed errors, retries for queries only, 30-second limit | D-054 to D-060 |
| P5-02 (done, ac714e8) | One app-wide TanStack Query cache, in memory only: freshness presets, error reporting in one place, foreground refetch, `clearStorefrontCache()` and `clearAllCaches()`, hooks-only boundary enforced by ESLint | D-061 to D-063 |
| P5-03 (done, 6bb14f2) | Network awareness with `expo-network` (queries pause offline, mutations never queue), a development APK built for `arm64-v8a` only (95.1 MB, was 246 MB), and local debug builds as a fallback | D-064 to D-067 |

## Phase 6: catalogue, search, filtering

| Task | Scope | Decisions |
| --- | --- | --- |
| P6-01 (branch `p6-01-sample-catalogue`) | The development store's sample catalogue (40 real books loaded by the architect) recorded in `SHOPIFY_INTEGRATION.md` and `TESTING.md`; `npm run check:dev-store` asserts it over the Storefront API; `filters` probed | D-068 to D-071 |
| P6-02 (proposed) | Catalogue data hooks and the book card | New records for the image library and the card's states |

## Goal of P6-02

The data layer and the one component every catalogue screen uses, ready for Home and Browse (P6-03 onwards):
- typed Storefront operations and hooks that read a collection's books by handle, page by page (D-068);
- one mapping from a Storefront product to what the card shows, so screens never read raw Shopify fields;
- the book card (`PRODUCT_REQUIREMENTS.md`, "Screen layouts"): cover, title on one line, author, rental price in bold with the retail price struck through, and an "Add to Cart" button. A book that cannot be ordered shows a "Rented Out" badge on the cover and a "Notify me" button instead (R8).

No customer-facing screen is built in P6-02. Home and Browse come next.

## Proposed scope

1. **Collection handles in configuration** (`src/config/`, D-068): the handles for the Home rows ("Popular series", "Browse by age", "New arrivals") and the Browse groups, typed and store-specific. The owner confirms the list and its order (question 1).
2. **Operations** in `src/shopify/`, named, typed by code generation, with `@inContext`, selecting no personal field (checked by `__tests__/shopify/operations.test.ts`):
   - `CollectionBooks($handle, $first, $after)`: the collection's title and, for each book, handle, title, `vendor`, featured image (URL, width, height, alt text), price, compare-at price, the variant's `availableForSale` and `currentlyNotInStock`, and `reviews.rating` and `reviews.rating_count`.
   - A missing collection (`null`) is a typed "not found" result, not a crash.
3. **Hooks** in `src/shopify/hooks/` (the hooks-only boundary, D-063): `useCollectionBooks(handle)` with TanStack's infinite query and the catalogue freshness preset (D-062). Page size 20, so `junior-readers` (26 books) needs two pages.
4. **Mapping** `toBookCard(product)`, unit-tested, from the facts in `SHOPIFY_INTEGRATION.md`:
   - availability: in stock, rented out, orderable at zero stock (the three Storefront states). Orderable at zero stock is orderable (R8);
   - cover: `null` when there is no featured image;
   - author: `vendor` as stored;
   - rating: the value from the `rating` JSON within its scale, and the count only when `rating_count` exists. A malformed rating gives no rating, never a crash;
   - prices from Shopify's money values, formatted with the store currency from `src/config/`. No compare-at price means no struck-through price.
5. **Book card component** in `src/components/`, from the design tokens only (D-037, D-038): the missing-cover fallback, the "Rented Out" badge, "Notify me" in place of "Add to Cart", a long title cut to one line, accessible labels. Both buttons take callbacks; the cart (Phase 8) and notify-me wire them later.
6. **Tests** with fixtures shaped like the named examples in `TESTING.md` ("Sample catalogue (P6-01)"): `the-gruffalo` rented out, `harry-potter-and-the-deathly-hallows-book-7` orderable at zero stock, `sudha-murty-three-thousand-stitches` in stock with "continue selling" on, `peter-and-the-wolf-read-it-yourself` with no cover, `harry-potter-and-the-philosophers-stone-by-j-k-rowling` with a rating and no count.
7. **One native build** for everything native in this task:
   - an image library for covers (proposal: `expo-image`, with its memory and disk cache and placeholders). It needs a new decision record and the owner's approval before it is added (`CLAUDE.md` rule 6);
   - the pending Expo SDK 57 patch releases (`expo` 57.0.27, `expo-constants` 57.0.21, `expo-linking` 57.0.12, `expo-router` 57.0.25), installed with `npx expo install --fix` and pinned exactly, so `npx expo-doctor` passes 21 of 21 again;
   - one EAS development build (`arm64-v8a`, D-066), the APK permission check, and a phone check of the card with the named example books.
8. **Docs**: decisions, `TESTING.md`, `CURRENT_STATUS.md`, and the next task.

## Questions for the owner before starting

1. **Home rows and Browse groups.** Which collection handles, in which order, for "Popular series" and "Browse by age"? For example the series row from `harry-potter-series`, `wimpy-kid-series`, `geronimo-stilton`, `my-hero-academia`, `secret-seven-series` and so on, and the five age groups.
2. **Image library.** Is `expo-image` approved for covers, in the same build as the Expo patch releases?
3. **Where the card is seen on the phone in P6-02.** A development-only preview screen (like the test checkout screen), removed before release, or wait for the Home screen in the next task?
4. **Orderable at zero stock.** R8 says such a book can be ordered. Does its card look exactly like an in-stock book, or does it carry a note?
5. **Ratings on the card.** The layout lists no rating on the card (the book page has the star rating). Confirm the card shows none.

## Out of scope

- Home, Browse, search and the book page (P6-03 onwards).
- The Genre filter. The `filters` probe (P6-01, `SHOPIFY_INTEGRATION.md`) found only Availability and Price on the development store, so a later task decides how Genre filtering works.
- Cart and notify-me actions (Phase 8 and later); the card only exposes the buttons.
- Anything on the live store.

## Follow-ups (recorded, not part of P6-02)

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
- **Expo SDK 57 patch releases (owner, P5-03):** `expo` 57.0.27, `expo-constants` 57.0.21, `expo-linking` 57.0.12 and `expo-router` 57.0.25 are out; `npx expo-doctor` fails its version check until they are installed with `npx expo install --fix` (pinned exactly afterwards). Grouped into P6-02's one native build, with the image library.
- **Sentry, offline case (P5-03):** the owner may confirm that the development Sentry project shows no new event from the P5-03 phone check (7 October 2026, 03:13 to 03:18 IST).
- **Local builds (D-067):** a fallback only, when the EAS queue is stuck. On this computer they need about 5 GB of free memory, other heavy programs closed, and `--max-workers=2`.
- **Genre filter (from P6-01):** the Storefront `filters` on a collection return only Availability and Price on the development store. A later Phase 6 task decides how the Genre filter works (`PRODUCT_REQUIREMENTS.md`, Browse), without parsing tags or `productType` (D-068).
- **Phone checks in Phase 6:** use the named example books in `TESTING.md` ("Sample catalogue (P6-01)").
