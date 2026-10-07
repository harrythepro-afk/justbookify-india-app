# Roadmap

Phase numbers used in every doc, task ID and decision from 3 October 2026 (D-035). Task IDs are `P<phase>-<nn>`, for example P4-01. Status of the current phase is in `CURRENT_STATUS.md`; the task to do now is in `NEXT_TASK.md`.

| Phase | Scope | Early check | Status |
| --- | --- | --- | --- |
| 0 | Discovery and Shopify audit | | Done |
| 1 | Architecture and requirements approval | | Done |
| 2 | Repository, documentation, environments, CI | | Done |
| 3 | Development store preparation and early checks | 2 (Android) | Done; remaining checks moved (D-033, D-034) |
| 4 | Mobile foundation: navigation, design tokens, config, crash reporting, analytics plumbing, feature flags | | Done |
| 5 | Shopify data layer: typed GraphQL client, caching, error handling | | Done |
| 6 | Catalogue, search, filtering | | In progress (P6-05) |
| 7 | Login and account | 3 | |
| 8 | Cart and rental rules | | |
| 9 | Checkout and order confirmation | 2 (iPhone) | |
| 10 | Backend foundation | 4 | |
| 11 | Rentals, order history, returns | | |
| 12 | Notifications and deep links | 5 | |
| 13 | Reviews, recommendations, help | 6 | |
| 14 | Security hardening | | |
| 15 | Test completion | | |
| 16 | Performance, accessibility, device testing | | |
| 17 | iOS release preparation | | |
| 18 | Android release preparation | | |
| 19 | Beta and staged launch, including the launch rehearsal | 1a, 1b | |
| 20 | Production monitoring, then post-launch features | | |

Account access follows D-036: Apple developer access in Phase 9 (at the latest before Phase 12, for push notifications); Google Play access in Phase 18.

The checkout presentation flag (D-033) gets its plumbing in Phase 4 (P4-03, D-046) and is used by the checkout screens in Phase 9, before the launch rehearsal in Phase 19. Phase 9 must also make that flag take effect without waiting for two restarts, for example by activating fetched values when checkout is opened (D-046).

Phase 14 restricts the Android API key in `google-services.json` to the app; afterwards every build must again be shown to fetch a changed flag (D-044, `TESTING.md`).
