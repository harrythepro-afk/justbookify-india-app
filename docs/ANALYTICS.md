# Analytics

Tool: Google Analytics for Firebase. No advertising SDKs in version 1.

State since P4-04 (D-048 to D-053): the app records the events below through one typed module, `src/analytics/`, and **only after the customer's consent**. Collection is opt-in and off by default. The customer turns it on with the "Share app usage" switch on the Account tab. The consent request comes in Phase 7 (below). `firebase.json` keeps collection off at install (`analytics_auto_collection_enabled` false, `analytics_default_allow_analytics_storage` false). `analytics_collection_deactivated` is false, so that the app can switch collection on at runtime when the customer agrees (D-053). Automatic screen reporting stays off; screens are logged by route name.

**Permanent for all of version 1 (D-009 as amended by D-049, D-045):** these stay off:
- the `AD_ID`, `ACCESS_ADSERVICES_AD_ID` and `ACCESS_ADSERVICES_ATTRIBUTION` permissions (blocked)
- Advertising ID and SSAID collection
- the advertising consents (`ad_storage`, `ad_user_data`, `ad_personalization`, denied in every `setConsent` call)
- audiences and Google signals

**Allowed (D-049):** install-source reporting through the Play install referrer (`BIND_GET_INSTALL_REFERRER_SERVICE`). It reports only under consent, because collection is off otherwise.

## Consent (D-048)

- **Three states:** `not asked` (nothing stored), `granted` and `denied`, stored with `expo-secure-store` (D-052). Only `granted` switches collection on. A value that cannot be read counts as `not asked`.
- **Every launch:** Firebase's own setting, which persists across launches, is synced to the stored choice before anything is sent. Nothing is sent while the choice is still being read.
- **Granting:** the choice is saved first, then collection is switched on.
- **Withdrawing:** sending stops at once. Collection is switched off, the analytics data on the phone is reset (`resetAnalyticsData`, which also starts a new app instance ID), then `denied` is saved.
- **Android backup is off** (D-052), so a restored phone never starts with collection on and no consent record.
- **Account switch wording (a draft, to be reviewed by the owner's adviser with the privacy policy, risk 21):** "Share app usage. Helps us improve the app. We record which screens you open, what you do in the app and the link you installed it from. We never record your name, email, phone number or address, and the app never asks for or records a child's name or date of birth. Turning this off stops it at once and clears the usage data on this phone."
- **Consent request: a requirement, not yet built.** It is never shown at first launch. It says that usage is linked to the customer's account (D-050). The owner chooses its placement in Phase 7:
  - (a) right after the first login or sign-up, which never measures customers who browse without logging in; or
  - (b) at a natural pause before login, such as adding the first book to the cart, with the account-linking line shown after login.
- **Release gate:** no build goes to an outside tester without a working consent request (`TESTING.md`, "Release gate: analytics consent").

## Analytics user ID (D-050)

- **None in P4-04.** The Firebase wrapper has no user ID function.
- **Phase 7:** after login, and only for customers who granted consent, set a stable per-customer ID. It is random or a salted one-way value, never an email, a phone number or the raw Shopify customer ID. How it is issued is designed in Phase 7.
- Logging out or withdrawing consent clears it.

## Data retention (D-051)

Event data is kept for 14 months in each Google Analytics property, with "Reset user data on new activity" off. The owner sets this in Admin → Data collection and modification → Data retention:
- the development property in P4-04;
- the staging and production properties when they are created.

## How events are sent (D-053)

- One typed function per event in `src/analytics/events.ts`, for example `trackViewBook({ product_id, available })`.
- **IDs** come from `analyticsProductId()`, `analyticsCollectionId()` and `analyticsOrderId()`. Each takes a Shopify GID and keeps the numeric part.
- **Fixed codes** (filter types, stages, error codes, channels) come from `analyticsToken()`: lowercase snake case, starting with a letter. Free text does not type-check.
- **The guard** (`src/analytics/guard.ts`) checks every event again and drops the whole event if any parameter fails. Sentry is told which event and parameter, never the value.
- **Screens** are named by their file route with groups removed: `index`, `browse`, `cart`, `my-books`, `account`, `dev-checkout`, and later `book/[id]`. Never the address or its parameters.
- `app_open` fires with `source` `cold_start` or `foreground`. The phases that build the other screens wire their events.
- Nothing is sent under Jest, or before or without consent.

## What Firebase sends by itself once consent is granted

Besides the app's own events, Firebase Analytics sends events and data of its own, **only while consent is granted** (collection is off otherwise). Google's "[GA4] Automatically collected events" page, read on 6 October 2026, lists them.

**Seen in DebugView on 6 October 2026** (build e571370c, P4-04 on-device check):
- `session_start`: the customer starts using the app.
- `user_engagement`: the app has been in the foreground for at least one second; it carries the time spent.
- User property `first_open_time`, set by Firebase.
- User property `non_personalized_ads` = 1, which follows from the denied advertising consents (D-049).

**Listed by Google as automatic for Android apps, and able to occur in this app under consent:**
- `first_open`: the first launch after an install or reinstall. It was not seen on 6 October, because collection was off at that install's first launch.
- `app_update`: the first launch after an update.
- `os_update`: the phone's Android version changed.
- `app_remove` and `app_clear_data` (Android only): the app is uninstalled, or its data is cleared.
- `firebase_campaign`: the app is opened with campaign parameters. This is the install-source reporting allowed by D-049.
- `error`: logged in place of an event Firebase rejects as invalid.
- **From Phase 12, with push notifications:** `notification_receive`, `notification_foreground`, `notification_open` and `notification_dismiss`.

**Never in version 1**, because the app has no ads SDK, Crashlytics, in-app purchases, Dynamic Links or In-App Messaging:
- the `ad_*` events and `adunit_exposure`;
- `app_exception`;
- `in_app_purchase` and the `app_store_*` events;
- the `dynamic_link_*` events;
- the `fiam_*` events.

**Sent with every event:**
- `app_version`;
- the screen parameters `firebase_screen_id` and `firebase_screen_class`. Because automatic screen reporting is off, the screen class is the route name the app sets.

Google Analytics also derives device model, operating system version, language and an approximate location (country and city, from the network address) for its reports. Firebase keeps an app instance ID, which a withdrawal resets.

**The privacy policy's app section (risk 21) must cover these automatic events and data as well as the app's own events.** If a later phase adds an SDK that brings more automatic events (for example, push notifications in Phase 12), this list and the privacy policy are updated together.

## Rules

- Snake case event names. IDs, never titles or free text.
- No names, emails, phone numbers or addresses. The app never asks for or records a child's name or date of birth. Age-group filters and the books viewed are recorded as IDs and codes.
- Search terms are measured by length, not content.
- The analytics user ID is random or a salted one-way value, never the email, a phone number or the raw Shopify customer ID (D-050).
- Analytics starts only after the customer's consent (opt-in, D-048).
- Crash reports (Sentry) follow the same rules; the scrubbing is described in `SECURITY.md` and D-042.

## Events (first version)

| Event | Fires when | Parameters |
| --- | --- | --- |
| app_open | App comes to the foreground | source |
| sign_up | First successful login for a new customer | none |
| login | Login succeeds | none |
| logout | Customer logs out | none |
| search | Results shown | term_length, result_count |
| filter_applied | A filter changes | filter_type, value |
| view_collection | Collection opens | collection_id |
| view_book | Book detail opens | product_id, available |
| select_book | Book added to the cart | product_id, cart_size |
| remove_book | Book removed from the cart | product_id, cart_size |
| book_unavailable_shown | A selected book went unavailable | product_id, stage |
| notify_me_requested | Customer asks for a back-in-stock alert | product_id |
| view_cart | Cart is opened | book_count, cart_value |
| order_cap_reached | Cart hits the order cap | cart_value |
| begin_checkout | Checkout is presented | book_count, cart_value |
| rental_order_success | Checkout completes | order_id, book_count, payment_type |
| checkout_failed | Checkout errors or is abandoned | stage, error_code |
| return_initiated | Return request sent | book_count |
| return_completed | Staff mark the return received | book_count |
| repeat_rental | Second or later order completes | rental_number |
| review_submitted | Customer submits a review | product_id, rating |
| recommendation_quiz_completed | Quiz finished | result_count |
| notification_received | Push arrives in the foreground | type |
| notification_opened | Push is tapped | type, destination |
| support_opened | WhatsApp or contact is opened | channel |
