# Next task (proposal): P10-02, the backend on the development Firebase project, and the analytics user ID

Status: **in progress** on branch `p10-02-backend-deploy` (owner's plan approval, 16 October 2026). P10-01 is merged (`135a2ed`, PR #31, 16 October 2026). Billing (owner, 16 October 2026): the billing account "My Billing Account" is linked to `justbookify-india-dev`; the payment method and the ₹500 monthly budget alert are pending, so Firebase still shows Spark. No Firebase login and no deploy until the owner confirms Blaze and the budget alert in chat. P9-01 is merged (`2a194b1`, PR #30); P9-02 (checkout on iPhone) moved after Phase 10's start and is due before Phase 12 (D-158).

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
| P8-02 (done, f2d708d) | The delivery fee hint (R4: the prepaid fee, the cash-on-delivery line, the checkout note, the free-delivery hint never past the cap; `EXPO_PUBLIC_SHIPPING_DISCOUNT`) and the optional pincode check (R3: configured ranges, digits only, in memory only, forgotten at a cold start and at logout) on the Cart tab; `delivery_area_checked` with the result only; the cap pop-up's title; phone check passed | D-140 to D-143 |

## Phase 9: checkout and order confirmation

| Task | Scope | Decisions |
| --- | --- | --- |
| P9-01 (done, 2a194b1, PR #30) | Checkout from the Cart tab with Checkout Kit on the development store (Android): "Checkout" only when the cart can go to checkout, login on the Cart tab, the customer's token on the cart, the sheet or the browser by the remote switch read at checkout (no restart), the confirmation with the order number, the cart forgotten, the checkout events; the test checkout screen removed; branch protection and the public repository; phone check passed with test orders #1004 and #1005 and the ACOD check | D-144 to D-157 |
| P9-02 (moved after Phase 10's start, D-158) | The same checkout on an iPhone, before Phase 12 at the latest: a Mac's iPhone Simulator, an EAS iOS simulator build in a browser service such as Appetize.io, or a friend's iPhone through TestFlight; and the consent request after the sheet closes | D-158 |

## Phase 10: backend foundation

| Task | Scope | Decisions |
| --- | --- | --- |
| P10-01 (done, 135a2ed, PR #31) | The backend in `backend/` (its own package, Node 24, `asia-south1`), local emulators only (project `demo-justbookify-india`); the customer's identity derived on the server from the Customer Account API with the customer's own token; `GET /whoami` (development only, fixed codes, limits, no personal data in logs); deny-all Firestore rules with emulator tests; the backend CI job, required on `main` | D-159 to D-164 |
| P10-02 (branch `p10-02-backend-deploy`) | Deploy only `whoami` to the development Firebase project (`.firebaserc` alias, no default; gitignored params; nothing else deployed); Home's development "Backend: check" with the customer's token; the phone check of risk 26; the function's logs read; the owner's logout | D-165, D-166 |
| P10-03 (proposed, owner, P10-02 plan) | The analytics user ID (D-050, D-132): HMAC-SHA-256 of the customer's ID, derived on the server, with a salt held only in Secret Manager, generated and stored without ever being printed or shown in chat | |
| P10-04 (proposed) | The backend custom app on the development store; webhooks verified by signature, queued and handled once | |
| P10-05 (proposed) | Early check 4: a return filed through the Admin API shows for staff (development store) | |

## Housekeeping for P10-02's first commit

- **Done (first commit):** P10-01 recorded as merged (`135a2ed`, PR #31) here, in `CURRENT_STATUS.md` and in `ROADMAP.md`; the billing state recorded as it stands (linked, payment method and budget pending, still Spark).

## Goal of P10-02

The backend runs in the development Firebase project, and the one thing P10-01 could not prove locally is proven: **Shopify accepts the customer's Customer Account API token from the backend** (risk 26). Then the backend issues the analytics user ID (D-050, D-132), the last missing item of the release gate "analytics consent" apart from the privacy policy.

## Proposed scope (superseded)

The owner's P10-02 scope (16 October 2026, D-165, D-166) replaces this proposal: only `whoami` is deployed, Home's development "Backend: check" proves risk 26, and the analytics user ID (item 4 below) moves to P10-03. Answers to the questions below: the deploy is Claude's, each command shown and run with the owner's yes; the budget is ₹500 a month; the user ID's endpoint and App Check are P10-03 questions. This file is rewritten for P10-03 at the end of P10-02.


1. **Blaze and a budget (owner's job):** the owner moves `justbookify-india-dev` to the Blaze plan in the Firebase console and sets a budget alert (for example ₹500 a month). Claude never changes the console or billing.
2. **Deploy to development only:** `backend/.firebaserc` names `justbookify-india-dev` (not a secret); `.env.justbookify-india-dev` stays gitignored and holds the development store's public values and `BACKEND_ENVIRONMENT=development`. The deploy is the owner's, or Claude's with the owner's yes at that moment (`npx --yes firebase-tools@15.34.0 deploy --only functions,firestore:rules --project justbookify-india-dev`). `nodejs24` and 256 MiB are confirmed by the deploy (D-160: fall back to `nodejs22` with a decision if refused).
3. **First check: `whoami` with a real login.** A development-only line on Home calls `whoami` with `getValidAccessToken()` through a new backend client in the app (one transport, D-126) and shows only the fixed answer (`ok` or a code). If Shopify refuses the token from the backend, stop and ask (risk 26).
4. **The analytics user ID (D-050, D-132):** a backend endpoint that returns HMAC-SHA-256 of the customer's GID (derived on the server, D-161) with a salt held **only in Secret Manager** (`defineSecret`; created by the owner in the console or by the CLI with the owner's yes, the value never in chat, the repository or a log). The app sets it with Firebase Analytics only after login and only with consent; cleared at logout and at withdrawal; tests that it is never logged or reported.
5. **Tests and docs:** the release gate item in `TESTING.md` ("the user ID exists and works"), `SECURITY.md`'s secret inventory, `ANALYTICS.md`.

## Questions for the owner and the architect

1. **Who deploys:** the owner from their own terminal, or Claude with a yes at that moment each time?
2. **Budget:** the monthly budget alert amount for the development project.
3. **The user ID's endpoint:** a separate `POST /analytics-id` (or `GET`), or returned by a general "session" endpoint the app calls after login? (Proposal: its own endpoint, so `whoami` stays development only.)
4. **Rate limits and App Check** stay required before any non-development deploy (D-162, risk 27). Should P10-02 already start App Check in "log only" mode on the development project?

## Out of scope

- Staging and production Firebase projects; the custom app and webhooks (P10-03); early check 4 (P10-04); push (Phase 12); anything on the live store.

## Follow-ups (recorded, not part of P10-02 unless listed in its scope)

- **P9-02, checkout on iPhone (moved, D-158), due before Phase 12:** the iPhone side of early check 2 (rates, ACOD, R2, R3, risk 1), by one of: a Mac's iPhone Simulator (an EAS build with `ios.simulator: true` or a local `npx expo run:ios`); an EAS iOS simulator build run in a browser service such as Appetize.io (the owner's decision then); or a friend's iPhone through TestFlight (needs Apple developer access, D-036). Also the login on iOS (`ASWebAuthenticationSession`, D-119), the sheet and the browser presentation (`SFSafariViewController`, D-152), a cash-on-delivery test order under D-146's limits if the owner extends them, and **the consent request shown after the checkout sheet closes** (below). Open questions then: the way chosen, who drives the simulator, and D-146 for P9-02.

- **The P9-01 phone checks' test orders (closed, owner, 16 October 2026):** the owner cancelled #1003 to #1006 with restock in the development store's admin; `npm run check:dev-store` passes in full again.
- **The consent request over Shopify's thank-you page (P9-01 short phone check; in P9-02's scope, D-158):** after order #1006 the request opened over the sheet's thank-you page (the `completed` event comes before the customer closes the sheet); the app's own confirmation showed after it was answered and the sheet closed. P9-02 shows it after the sheet closes. On iPhone it may not appear over the sheet at all.
- **`check:dev-store` for test orders (owner, P9-01 phone check):** a mode that checks only the store domain (`EXPECT_STORE_DOMAIN`), for the check before each test order, so the sample catalogue's changes from earlier test orders do not stop it (today the domain part is read from the full run's output, D-157).
- **The consent request after a closed checkout (P9-01 phone check), fixed in PR #30 at the architect's review (D-148):** a checkout closed without an order keeps the request held; it shows once, after the first confirmed order in that login.
- **A Checkout tap that did nothing (P9-01 phone check), fixed in PR #30 at the architect's review (D-148):** the button shows a disabled waiting state while the cart is being read or changed, and a tap shows "Opening checkout…" at once and waits for what is still running; checked again in the short phone check below.
- **Checkout's web page logs its URL (P9-01 phone check; Phase 14, the architect's review of PR #30):** Android's `chromium` tag in the app's own log showed one console message from Shopify's checkout page ("Clear-Site-Data header on '<checkout URL>'"), with the cart's key in the URL. It is the web view's console, not the app's code; the device log is readable only over adb. Find out whether a release build logs it too, and whether Checkout Kit's `logLevel` or the web view's settings can stop it (risk, `SECURITY.md`).
- **The iPhone (owner, answer 6; D-158):** P9-02 above, before Phase 12; the real-iPhone check through TestFlight before Phase 17.
- **P10-01's backend (D-159 to D-164):** before any non-development backend deploy, per-customer and per-device rate limits and Firebase App Check (Play Integrity, App Attest) on backend endpoints (owner, P10-01 plan approval; `SECURITY.md`, risk 27); `whoami` is never deployed outside development and is removed or disabled first (D-162). The backend's audit gate has no allowlist (D-159). The Firebase CLI is `firebase-tools` 15.34.0 by `npx`; re-check it, `firebase-functions` and `firebase-admin` at each quarterly review.

- **Expo SDK 57 patch releases (P9-01, owner, D-156):** a small task of its own: `expo` 57.0.27 → ~57.0.30, `expo-auth-session` 57.0.15 → ~57.0.16, `expo-constants` 57.0.21 → ~57.0.22, `expo-dev-client` 57.0.19 → ~57.0.20, `expo-linking` 57.0.12 → ~57.0.13, `expo-router` 57.0.25 → ~57.0.28, `jest-expo` 57.0.5 → ~57.0.6, with `npx expo install --check`, the changelogs, the five gates, `expo-doctor` 21 of 21, a new development build and the APK permission check if a native package changes, and a short phone check.

- **Phase 9 check: cash on delivery over ₹500 (P8-02, answer 5, D-141), done in P9-01:** a ₹494 cart was still offered cash on delivery, at a total of ₹544: ACOD's limit counts the books only, so the Cart tab says nothing about it (`TESTING.md`).
- **The pincode at checkout (P8-02, answer 4, D-142), decided in P9-01:** the check stays optional and is never sent to Shopify (answer 1).
- **Clear pincode keeps the keyboard open (P8-02 phone check, observation):** "Clear pincode" empties the field and keeps its focus, as search's clear button does (D-099), so the keyboard opens again. Intended; the architect may prefer it closed.

- **The cart in Phase 9 (P8-01, D-133 to D-137), done in P9-01 (D-148, D-149, D-151).**
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
