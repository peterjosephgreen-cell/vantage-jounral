# Vantage Journal v0.3

Firebase-backed shared persistent journal for Pete (Owner) and Min (Member).

## What's new
- Dynamic member count (no hard-coded 3 members)
- Proper Add/Edit Location form
- Separate "What's at this location?" and general notes
- Add Discovery workflow
- Record item effect text after discovery
- Discovered-items-only index
- Multiple known sources for the same item
- Item detail screen showing all known sources
- Members screen
- Owner workflow to add Min by Firebase UID
- Searchable journal/items
- Return-to-location flag
- Responsive mobile/desktop UI

## Upgrade
Replace the four files in the existing GitHub Pages repository with:
- index.html
- app.js
- styles.css
- README.md

Existing Firebase expedition/member data is retained.

## Adding Min
1. Firebase Console -> Authentication -> Users -> Add user.
2. Create Min's email/password account.
3. Copy Min's User UID.
4. Sign into Vantage Journal as Pete.
5. Members -> Add Min -> paste the UID.
6. Min can then sign in using her own email/password.

No service-account credentials are required.


## v0.3.1 hotfix
- Fixes first-location Save modal not closing reliably.
- Closes successful saves before refreshing Firestore state.
- Shows the actual Firebase error in the modal if a location write fails.


## v0.4 — outcome-aware discoveries
- A discovery is now an action/test with one or more possible outcomes.
- Each outcome can be Known or Unknown.
- Unknown outcomes record that another possibility exists without revealing its reward.
- Known rewards support Item, Money, Resource, Information, Effect, and Other.
- Items are indexed only when their outcome is known.
- Item number is the primary identifier; item name is optional until revealed.
- An outcome can be marked as actually obtained.
- The same item can have multiple known sources.
- Existing v0.3 discovery records remain readable.
