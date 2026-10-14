# Next task (proposal): P9-01, checkout with Checkout Kit

Status: proposal. P8-02 (the delivery fee hint and the pincode check on the Cart tab; D-140 to D-143) is on branch `p8-02-delivery-hints`, PR #29, phone check passed on 14 October 2026; see `CURRENT_STATUS.md`. P9-01 starts when the owner starts it, after that pull request is merged. **Its first commit records P8-02 as merged** (in this file, `CURRENT_STATUS.md` and `ROADMAP.md`, where Phase 8 becomes done). P8-01 is merged (`a275ff4`, PR #28).

## Phase 5: Shopify data layer (complete)

| Task | Scope | Decisions |
| --- | --- | --- |
| P5-01 (done, 2f2b3e1) | Typed Storefront API client: code generation from the saved `2026-10` schema, buyer context, typed errors, retries for queries only, 30-second limit | D-054 to D-060 |
| P5-02 (done, ac714e8) | One app-wide TanStack Query cache, in memory only: freshness presets, error reporting in one place, foreground refetch, `clearStorefrontCache()` and `clearAllCaches()`, hooks-only boundary enforced by ESLint | D-061 to D-063 |
| P5-03 (done, 6bb14f2) | Network awareness with `expo-network` (queries pause offline, mutations never queue), a development APK built for `arm64-v8a` only (95.1 MB, was 246 MB), and local debug builds as a fallback | D-064 to D-067 |

## Phase 6: catalogue, search, filtering (complete)

| Task | Scope | Decisions |
| --- | --- | --- |
| P6-01 (done, e378fa6) | The development store's sample catalogue (40 real books loaded by the architect) recorded in `SHOPIFY_INTEGRATION.md` and `TESTING.md`; `npm run check:dev-store` asserts it over the Storefront API; `filters` probed | D-068 to D-071 |
| P6-02 (done, fa4c6c9) | Catalogue operations and hooks (`useCollectionBooks`, `useBookCard`), the `toBookCard` mapping, the book card, a development-only preview; `expo-image` and the Expo SDK 57 patch releases in one build (3c8bf273) | D-072 to D-074 |
| P6-03 (done, f9c3212) | The Home screen and the collection screen: Home content in configuration, only collections that exist, a square white cover frame, offline and error states, stale-only focus refetch, no dead card buttons, recovery from a false "offline" | D-075 to D-082 |
| P6-04 (done, a57774a) | Browse: all books through the root `products` query, Age group and Series one at a time, "Available now" on by default (also on the collection screen), the website's sorts, lists that close on back and outside taps; the preview kept until Phase 8 | D-083 to D-089 |
| P6-05 (done, 1876ac1) | The book page from every card: cover, author, title, the sentence for a rented-out book only, prices with the "Rent" or "Rented Out" badge, the description as native text from untrusted HTML, genre chips; no rating (Phase 13); `liveStock`; a description sample in the preview | D-090 to D-094 |
| P6-06 (done, ede0acd) | Search: Storefront `search` (books only, partial last word), results as you type from 3 letters or the search key from 2, "Available now" off (`LAST`/`HIDE`), Relevance and the two price sorts, the count line and the website's no-results line, earlier results kept while a new term loads; the term never logged, sent to analytics or reported; the standing phone-check permission; one guard against double taps for every in-app open; a clear button | D-095 to D-099 |
| P6-07 (done, eaa9702) | The Genre filter (the store's own genre names, one at a time, combined with the group, "Available now" and the sort; on Browse and the collection screen), Browse's all books from the `all-books` collection, the longer series list | D-100 to D-103 |
| P6-08 (done, c757ff2) | The Price filter ("All prices", then up to ₹34, ₹49, ₹74; a maximum only; store configuration, labels in the store's currency format) on Browse and the collection screen, not on search; one filter row that scrolls sideways with "Clear" pinned at its right edge; the CI act warnings fixed in the test setup | D-104 to D-106 |
| P6-09 (done, ac0a9fd) | The catalogue usage events under consent: `view_collection` (collection screen, a group chosen on Browse), `view_book`, `filter_applied` (codes only, the customer's own changes), `search` (2 seconds on screen, the search key or a book opened; length, count and the store's own catalogue item matched, never the term); the guard's dependent parameters | D-107 to D-110 |
| P6-10 (done, ad12f44) | The last Phase 6 task: the offline question closed (queries keep pausing, D-082's safety net), description tables (cells joined by " · "), tappable genre chips (all books with that genre, pushed on the book page), "Popular authors" on Home | D-111 to D-114 |
| P6-11 (done, 7c37841) | The wanted list: one JSON Remote Config parameter of names, codes made by the app, validated and frozen per launch; a search that finds no books with "Available now" off and matches nothing in the catalogue records the listed name's code (`wanted`); phone check passed | D-115 to D-118 |

## Phase 7: login and account

| Task | Scope | Decisions |
| --- | --- | --- |
| P7-01 (done, 9be8a6d) | Login and logout with the Customer Account API on the development store: the system browser, PKCE, the app's own state and a nonce; tokens crash-safe in secure storage; refresh, logged out only on `invalid_grant`; logout on the phone and Shopify's mobile logout; the Account tab; phone check passed (a website sign-out keeps the app logged in; access token about 60 minutes) | D-119 to D-123 |
| P7-02 (done, bf63b65) | The customer's profile on the Account tab and orders in My Books, read only, through the Customer Account API (`2026-04`, types from Shopify's Hydrogen React schema); one GraphQL transport shared with the Storefront client; a 401 refreshes once; customer data in memory under `['customer', …]`, cleared at logout; the plain status table; no "At home" or "Returns" yet; **early check 3 passed** (guest order #1003 in the app after login with the same email) | D-124 to D-128 |
| P7-03 (done, b5ce914) | The analytics consent request right after a login on the Account tab, only while the choice is "not asked", once per login (owner's placement (a)); Allow, Don't allow, Close; draft wording for the adviser; `login` (also right after Allow) and `logout` under consent; the switch's account line; Home's development reset; the user ID required before outside testers (Phase 10) | D-129 to D-132 |

## Phase 8: cart and rental rules

| Task | Scope | Decisions |
| --- | --- | --- |
| P8-01 (done, a275ff4) | The cart on Shopify: "Add to Cart" ("In cart") on the book card and the book page, one copy per book, the Cart tab with its count, the order cap (R2: under the cap, checked against Shopify's subtotal), a guest cart forgotten at logout, rented-out books in the cart, the cart events; the development preview removed | D-133 to D-139 |
| P8-02 (branch `p8-02-delivery-hints`, PR #29) | The delivery fee hint (R4: the prepaid fee, the cash-on-delivery line, the checkout note, the free-delivery hint never past the cap; `EXPO_PUBLIC_SHIPPING_DISCOUNT`) and the optional pincode check (R3: configured ranges, digits only, in memory only, forgotten at a cold start and at logout) on the Cart tab; `delivery_area_checked` with the result only; the cap pop-up's title; phone check passed | D-140 to D-143 |

## Phase 9: checkout and order confirmation

| Task | Scope | Decisions |
| --- | --- | --- |
| P9-01 (proposed) | Checkout from the Cart tab with Checkout Kit on the development store: the gates before it, the customer's identity on the cart, the completed order, the checkout events; the iPhone half of early check 2 | |

## Goal of P9-01

The customer goes from the Cart tab to the store's own Shopify checkout inside the app (Checkout Kit, `ARCHITECTURE.md`, "Checkout"), and after a completed order sees a confirmation and an empty cart. Development store only: test orders there only with the owner's yes, never on the live store (`CLAUDE.md`, rules 4 and 5). Phase 9 also brings the iPhone: Apple developer access is requested now (D-036), so the checkout can be checked on an iPhone development build (early check 2, iPhone half).

## Proposed scope

1. **A "Checkout" button on the Cart tab**, offered only when the cart can go to checkout (P8-01 follow-ups, D-134, D-137): no rented-out book in the cart, the counted subtotal under the cap, and the pincode rule the owner chooses (question 1). Every check is again Shopify's at checkout; the app's gates are hints that save the customer a refused checkout.
2. **Login before checkout** (`PRODUCT_REQUIREMENTS.md`, Screens: checkout needs a login): a signed-out customer is asked to log in first; the guest cart is kept (D-136). The consent request waits until the order is confirmed (D-129).
3. **The customer's identity on the cart** before the checkout URL is used (`ARCHITECTURE.md`, "Checkout", step 2), so Shopify's checkout knows the customer: the form Shopify documents for a Customer Account API login on a Storefront cart, checked in Shopify's documentation for the API version in use and recorded.
4. **Checkout Kit:** present the cart's `checkoutUrl` in the sheet or the browser, as the `checkout_presentation` flag says (D-033), and make the flag take effect without two restarts (D-046). **The version:** `CLAUDE.md`'s stack names `@shopify/checkout-sheet-kit` 4.0.x; the repository has 3.9.1 (P3-01's test checkout). Check Shopify's changelog and decide (a decision entry) before building on it.
5. **After the completed event:** a confirmation on the Cart tab (wording at plan review), the cart cleared and forgotten (`ARCHITECTURE.md`, step 5; Shopify deletes a completed cart, D-136), the orders list read again; a closed or failed checkout keeps the cart.
6. **Events under consent** (`ANALYTICS.md`): `begin_checkout`, `rental_order_success`, `checkout_failed`; IDs, counts and codes only.
7. **Checks on the development store:** the Phase 9 check of ACOD's ₹500 limit (`TESTING.md`, P8-02); the Checkout Kit TLS errors seen in P5-02; the development test checkout screen (P3-01) kept or removed (a decision).
8. **Tests, docs, and phone checks** on Android over USB and, with Apple access, on an iPhone development build.

## Questions for the owner and the architect

1. **The pincode at checkout (P8-02, answer 4):** must the Cart tab's pincode check pass before "Checkout" is offered, or does the field stay optional and Shopify's own pincode rule (SMART Checkout Rules, R3) refuse at checkout? If it must pass, is the pincode then sent to Shopify with the cart (`buyerIdentity` delivery address preferences), which would be the first time it leaves the phone (D-142)?
2. **Login first:** confirm that checkout always needs a login (the requirements' Screens table), and that a cart started as a guest goes to checkout under the customer's account after login.
3. **Checkout Kit version:** stay on 3.9.1 for P9-01, or move to 4.0.x as `CLAUDE.md` names (a native change and a new development build either way if the version changes)?
4. **Test orders on the development store:** how many cash-on-delivery test orders may be placed there, and who restocks the books afterwards (P3-02 left "Harry potter" at zero)? The ACOD check needs a cart between ₹451 and ₹499 taken to the payment step; does it stop before placing the order?
5. **The confirmation's wording**, and whether "Go to My Books" follows it.
6. **The iPhone check:** which iPhone, and when Apple access is ready.

## What P9-01 needs from the owner

- The answers above.
- **Apple developer access** for the iPhone check (D-036): the Apple Developer Program membership for JustBookify, the project's EAS account able to build for iOS with it (the owner signs in to Expo and Apple on this machine; no Apple password or key is ever given to Claude), and an iPhone with Developer Mode on for the development build.
- The owner's yes for each test order on the development store.
- `EXPO_PUBLIC_SHIPPING_DISCOUNT` in the EAS environments when staging and production builds are set up (follow-up below); not needed for the development build, which reads `.env.local`.

## Out of scope

- Razorpay (cannot be installed on the development store; early check 1a waits for the launch rehearsal, D-033).
- Anything on the live store.
- Books at home, due dates and returns (Phase 11); push notifications (Phase 12).

## Follow-ups (recorded, not part of P9-01 unless listed in its scope)

- **Phase 9 check: cash on delivery over ₹500 (P8-02, answer 5, D-141):** on the development store's checkout, whether ACOD's ₹500 limit counts delivery (`TESTING.md`). The answer decides whether the Cart tab says anything about cash on delivery over ₹500.
- **The pincode at checkout (P8-02, answer 4, D-142):** whether checkout requires a pincode that passes is Phase 9's decision (question 1 above).
- **Clear pincode keeps the keyboard open (P8-02 phone check, observation):** "Clear pincode" empties the field and keeps its focus, as search's clear button does (D-099), so the keyboard opens again. Intended; the architect may prefer it closed.

- **The cart in Phase 9 (P8-01, D-133 to D-137):** checkout must not be offered while a rented-out book is in the cart or the counted subtotal is at or over the cap; attach the customer's identity to the guest cart at checkout; clear the cart after a completed order (`ARCHITECTURE.md`, "Checkout", step 5).
- **A book rented out while in the cart (P8-01):** tested only, on the owner's decision (no stock change in the development store's admin). A later phone check may cover it if the owner restocks and sells out a book.
- **The cap alert's empty title (P8-01 phone check, resolved):** the owner chose the title "Order limit reached" (14 October 2026, message unchanged); done in P8-02's first commit.
- **Intermittent act warning (P8-01 full run):** `search.test.tsx` logged one "not wrapped in act" warning from VirtualizedList's render timer after an 80-second test, as `browse.test.tsx` did in P7-03. Not caused by the cart; watch CI.

- **Release gate: analytics consent (P7-03, D-132):** the consent request is built and was checked on the phone (`CURRENT_STATUS.md`). Still open before any outside tester: the privacy policy's app section (risk 21) and **the analytics user ID**, issued by the Phase 10 backend, because the consent wording says usage is linked to the account (`TESTING.md`, item 5).
- **Consent wording (P7-03, D-130; risk 21):** the request's wording and the Account switch's new account line are drafts approved by the owner, for the adviser's review with the privacy policy's app section.
- **Phase 9 and the consent request (owner, D-129):** if a customer's first login happens at checkout, the request waits until the order is confirmed; it never interrupts checkout.
- **`sign_up` (P7-03, D-130):** not sent, because the app cannot tell a new customer from a returning one. A later phase may send it if the backend (Phase 10) can tell.
- **Customer Account API version (P7-02, D-124, D-125; quarterly API review):** the app reads `2026-04`, the version of the only schema it can generate types from (`@shopify/hydrogen-react` 2026.4.4). Move to `2026-10` (or `2027-01`) once Hydrogen React publishes a release built for it (`npm run schema:update:customer`), and **before 16 April 2027**, when `2026-04` stops being accessible. Recorded in `SHOPIFY_INTEGRATION.md` ("API version").
- **"Delivered" needs a rule (owner, P7-02 plan approval; Phase 11):** the orders list shows "Delivered" only when Shopify records the delivery. Delhivery reports it; Ekart does not (`SHOPIFY_AUDIT.md`), so an Ekart order stays "Shipped" unless staff mark it delivered. Phase 11 (books at home, due dates, returns) needs a rule for when an order counts as delivered (D-128).
- **Customer Account API endpoint form (P7-02, D-124):** the development store's discovery document names `https://shopify.com/<shop ID>/account/customer/api/<version>/graphql`, not the reference's `https://<shop domain>/customer/api/<version>/graphql`. The app keeps the discovered prefix. At the live-store connection, `npm run check:dev-store`'s form line (or the same read against the live store, read only) shows which form the live store uses.
- **The schema source's address (P7-02, D-125):** the code generator preset's Customer schema address refused the Headless client ID. If Shopify documents a public schema address for the Customer Account API later, the quarterly review may switch to it (a decision entry).
- **"Sign out of all devices" (P7-01 phone check, owner to decide):** the development store's customer account page offers it next to "Sign out". P7-01 tested only "Sign out" (the app stayed logged in, as answer 3 intends). Whether "Sign out of all devices" ends the app's refresh token was not tried; if it does, the app shows "You've been logged out. Please log in again." at its next refresh, which D-121 and D-122 allow. A short check in a later phone check if the owner wants it.
- **The P7-01 log copy (resolved):** `app-log.txt` (the app's own log from P7-01's phone check, filtered to its process, in Claude's P7-01 scratchpad outside the repository) was not deleted in P7-01, because the deletion was blocked by a safety check. Claude deleted that one file by its full path on the owner's instruction on 13 October 2026, at the start of P7-02, and showed that it was gone.
- **The login library's Android gap (P7-01, risk 23):** watch for a lost login in later phone checks and beta feedback.
- **Search key in the same moment as the last keystroke (P6-11 phone check, owner to decide):** `onSubmitEditing` in `src/app/search.tsx` (P6-06) reads the field's text from the last render, so a search key sent in the same adb command as the typing searched "zzqx" for "zzqxv" (and the event said 4). A person would need to press the key within milliseconds of the last keystroke. Proposed fix: read the submitted text from the key event (`nativeEvent.text`), with a test; a small task of its own or part of a later search change.
- **Wireless phone checks (P6-11):** the owner chose wireless again; the link dropped during the background step and a new port was needed, and the app's process ended in the background, so the return was a cold start. USB stays the reliable choice for a check with a background step.
- **The wanted list (P6-11, owner):** the list in the production Firebase project (when it exists) is the owner's to keep; it is readable by anyone with the app's public Firebase settings (`SECURITY.md`), so it must never hold anything private. The phone check's test list stays in the development project only.
- **Release gate: before the live store is connected (P6-07 and P6-08, owner):** five read-only checks on the live store with the app's public token, all of which must pass (`TESTING.md`, "Release gate: before the live store is connected"): the `all-books` collection exists, is published to the app's channel only and returns every book the app can see; the Genre filter is offered on it and on a group; the genre entries can be listed and every filter value joins to at least one store name; the eight custom genres show the store's names; the Price filter (`filter.v.price`) is offered on `all-books` and on a group (P6-08). Creating the collection on the live store is the owner's decision at that time (store addition 4, `SHOPIFY_INTEGRATION.md`). Nothing on the live store is touched before then.
- **Wireless phone checks (P6-09):** wireless debugging connected but dropped six times in one check, apparently whenever the screen slept or the app went to the background; each reconnect needed a new port from the owner. Use USB for checks with a background step, or keep the screen awake. `adb connect` and `adb disconnect` are still outside the standing permission (D-095).
- **Wireless phone checks (P6-10):** the owner chose wireless again; the link dropped once (about 07:58, around a phone call that also restarted the app), and a new port was needed. The background step itself (6 min 6 s) kept the link. USB stays the reliable choice; a call during a check stops it (Do Not Disturb does not end a call already in progress).
- **Focus check over wireless adb (P6-10):** the check's `grep -q` ends `dumpsys` early, and `dumpsys` then prints "Broken pipe", which `exec-out` mixes into a screenshot; use `dumpsys window 2>/dev/null | grep -q ...`. The `TESTING.md` form (`adb shell`, no `exec-out`) is not affected.
- **Catalogue usage events (P6-09, on the branch):** D-107 to D-110; `view_collection`, `view_book`, `filter_applied` and `search` are wired (`ANALYTICS.md`, "Catalogue events"). Search matches on the live store follow its own collections and genre entries; the release gate "before the live store is connected" already checks that the entries can be listed.
- **Price filter (P6-08, done, `c757ff2`):** D-104; the ₹0 book and "Mr Big" at ₹79 are owner items for the live store (`SHOPIFY_AUDIT.md`, "Live website prices").
- **Filter row while scrolled to its end (P6-08 phone check, observation):** when a label lengthens while the row is scrolled to its end, the buttons to its left move left on screen (the row keeps its end in view). "Clear" does not appear or disappear then, so D-105 holds; the architect may want it changed.
- **Double taps in phone checks (P6-08):** two `adb shell input tap` commands can land more than 0.5 seconds apart, which the guard allows (D-099); time the pair (both taps within about 0.5 s) before reading a second page as a defect.
- **Wireless debugging (P6-08):** pairing worked from the owner's terminal, connecting did not ("failed to connect"; the cause was not found), so the check used USB. If wireless checks are wanted, `adb connect` and `adb disconnect` need adding to the standing permission (D-095) first.
- **Development store search count (P6-07, resolved):** Shopify's matching of broad words changed on the development store from 8 October 2026; `npm run check:dev-store` now checks only the meaning of "Available now" for "the" and "kid" and keeps exact counts for harry, dahl and zzqxv (architect's review of PR #20; `SHOPIFY_INTEGRATION.md`).
- **Act warnings on CI's Linux runner (P6-07, resolved in P6-08):** `jest.setup.ts` wraps TanStack Query's deliveries in React's `act` (D-106, test only); CI run 37873582381 (`5de6013`) logs no "not wrapped in act" line and no `console.error`, where `main`'s run 37865413339 logged four.
- **Phone checks: notification banners (P6-07):** the 08:08 stop in P6-07's check came from a Do Not Disturb setting that let app notifications through; the owner is changing it. Before each check, Do Not Disturb must block app notifications, not only calls.
- **Genre chips on the book page (owner, P6-07):** done in P6-10 (D-113): a chip whose genre the Genre filter offers opens the all-books collection screen with that genre chosen, pushed on the book page.
- **Browse by author (owner, P6-07):** done in P6-10 as "Popular authors" on Home (D-114). Search matching (D-109) does not add the configured author names.

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
  - the app's own events, including the catalogue events since P6-09 (`view_collection`, `view_book`, `filter_applied`, `search`; `ANALYTICS.md`, "Events" and "Catalogue events");
  - that, under consent, the app records which catalogue item a search matched, by its ID or code, never the search term itself (P6-09, D-108, D-109);
  - that, under consent, the app records which name on the store's wanted list a search matched, by that name's code, never the term (P6-11, D-117, D-118);
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
- **Store variables for EAS (from P5-01 and P8-02):** add `EXPO_PUBLIC_STORE_COUNTRY` and `EXPO_PUBLIC_STORE_LANGUAGE` (D-058) and `EXPO_PUBLIC_SHIPPING_DISCOUNT` (75 for the India store, D-141; owner, 14 October 2026) to the staging and production EAS environments when those builds are set up. A build without `EXPO_PUBLIC_SHIPPING_DISCOUNT` reports its store as not configured.
- **Storefront domain for staging and production (architect, P5-01):** when the staging and production configurations are set up, confirm from Shopify's documentation which store domain the Storefront API calls should use, so that requests are not redirected.
- **Code generator audit entries (D-060):** reviewed by 2026-11-15 with the `braces` and `@grpc/grpc-js` entries; re-checked whenever the preset or the codegen CLI is upgraded; each removed in the commit that picks up a compatible fix.
- **Offline question (architect, D-087):** closed in P6-10 (D-111): queries keep pausing with D-082's safety net; risk 22 mitigated.
- **Standing phone-check step (owner, D-082, D-111):** in every phone check, after more than 5 minutes in the background, no false offline notice (`TESTING.md`), **until the first release build, when it is reviewed**.
- **Release gate: list performance (P6-03):** the collection list (and Browse) must scroll and load more smoothly on a release build before any outside tester (`TESTING.md`). Measured so far only with production-mode JavaScript: the 6 extra books of `junior-readers` on screen within 0.8 to 1.8 seconds. Browse reuses the collection screen's list settings (D-080, `34218d5`).
- **Phase 9, Checkout Kit TLS errors (owner, P5-02 phone check):** the app's log showed two TLS handshake errors (`net_error -101`) inside Checkout Kit's web view while the development store's password page loaded. The page itself loaded. Re-check during Phase 9's checkout tests.
- **Phase 7, logout (D-061):** call `clearAllCaches()`; customer data gets its own key root and is cached in memory only.
- **Sentry, offline case (P5-03):** the owner may confirm that the development Sentry project shows no new event from the P5-03 phone check (7 October 2026, 03:13 to 03:18 IST).
- **Local builds (D-067):** a fallback only, when the EAS queue is stuck. On this computer they need about 5 GB of free memory, other heavy programs closed, and `--max-workers=2`.
- **Longer series list (architect, P6-04):** Browse's Series list is Home's 15 (D-084); the architect supplies a longer list with the later filters task.
- **Genre filter (from P6-01):** the Storefront `filters` on a collection return only Availability and Price on the development store. A later Phase 6 task decides how the Genre filter works (`PRODUCT_REQUIREMENTS.md`, Browse), without parsing tags or `productType` (D-068).
- **Phone checks in Phase 6:** use the named example books in `TESTING.md` ("Sample catalogue (P6-01)").
- **From the live website (architect, view only, 7 October 2026; `SHOPIFY_AUDIT.md`), not built yet:**
  - **Genre filter:** the live store has Genre, tag and Service City filters configured; the development store has only Availability and Price. The architect mirrors the filter setup in the development store before the Genre filter task.
  - **Book page:** done in P6-05: the app shows the website's sentence only for a book that cannot be ordered (D-090).
  - **Ratings:** not on the book page (D-092). Phase 13 (reviews) reads `reviews.rating` and `reviews.rating_count`, handling a rating without a count and a malformed rating (D-071).
  - **Website cards** show no author and no stars; the app's card keeps the author (D-073).
- **Book card preview** (D-074, D-088): removed in P8-01 (D-139), once customer screens drew the card's cart button.
- **Double tap (P6-06 phone check, fixed in PR #19, D-099):** a book card and the search button opened their screen twice on a fast double tap. One guard for every in-app open now ignores a second open within 0.5 seconds.
- **Description tables (architect's review of PR #18):** fixed in P6-10 (D-112): each row its own line, cells joined by " · ", empty cells skipped.
- **Development store descriptions (architect's review of PR #18):** all 42 are a single `<p>` with no `<br>` or `<strong>`, so their headings and bullets run together on the book page. No re-import now. Before the release-build check, the owner pastes full descriptions into a few books in the development admin.
- **Analytics events for catalogue screens (P6-05):** done in P6-09 (D-107 to D-110).
- **Book page in a release build:** the description and the full-width cover are checked on the development build only; include a long real description in the release-build list check (`TESTING.md`, "Release gate: list performance").
- **Bottom inset:** Browse is a tab screen, so its tab bar already takes the inset, as on Home; any new stack screen adds it (D-080).
- **Cold test start (P6-03, owner to decide):** with Jest's cache off, the first render in `account.test.tsx`, `tabs.test.tsx` and `BookCard.test.tsx` still takes 2.4 to 4.1 s (under the 5-second limit). A public-import touch does not move it (`CURRENT_STATUS.md`); no deep import is used without the owner's yes.
