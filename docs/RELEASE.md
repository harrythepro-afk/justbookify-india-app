# Release

## Branching

- `main` is protected: no direct pushes, required checks, one approving review.
- Short-lived feature branches, one task each.
- Release tags trigger staging and production builds.

## Pipeline

| Stage | Runs on | Checks |
| --- | --- | --- |
| Static | Every pull request | Formatting, lint, strict type check |
| Tests | Every pull request | Unit, component, integration, contract |
| Security | Every pull request | Secret scan, dependency audit |
| Internal builds | Merge to main | Development builds for both platforms |
| End-to-end | Nightly | Full suite against the development store |
| Staging builds | Release candidate tag | TestFlight and Play internal track, pointed at staging |
| Production builds | Release tag plus manual approval | Signed builds submitted by CI; staged rollout |

## Rollout

- Google Play staged at 5%, 20%, 50%, 100%. Apple phased release over 7 days.
- A release moves forward only while crash-free sessions stay at or above 99.5% and checkout failures stay flat.

## Rollback, fastest first

1. Remote feature switch turns the feature off.
2. Over-the-air JavaScript update for fixes with no native change.
3. Halt the Play rollout or pause Apple's phased release.
4. New build through expedited review.
5. Minimum-version gate asking customers on a broken version to update.

## Store facts

- App ID: `com.justbookify.india` on both stores. Permanent.
- Published under the owner's existing Apple and Google developer accounts.
- Listing limited to India.
- Not listed in a kids category. The customer is the parent.
- Re-check Apple's and Google's current build and policy requirements at the start of release preparation.

## Signing

Signing keys and store API keys live only in the build service. They never enter the repository or a developer machine.
