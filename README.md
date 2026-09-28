# Vantage Journal — Firebase version

This build is connected to the Firebase project `vantage-journal`.

## First run
1. Host these files over HTTPS (GitHub Pages is fine). Do not just double-click index.html.
2. Sign in with the Firebase Authentication account already created for Pete.
3. On Pete's first successful login, the app bootstraps:
   - `expeditions/main`
   - Pete's owner membership document
4. Set the first location from the Explore screen.
5. Add discoveries. Data is stored in Firestore, not localStorage.

## Current scope
- Email/password login
- Pete owner bootstrap
- Firestore-backed locations and discoveries
- Discovered-items-only index
- Multiple known sources per item
- Activity records
- Responsive desktop/mobile UI
- No undiscovered item catalogue

## Next build
- Owner member-management screen for Min and Alice
- Better location editing and map connections
- Real-time listeners so all three screens update instantly
- Item card number/reference metadata after discovery
- journeys
- edit/delete UI with owner protections

Important: the Firebase web config is intentionally client-side. Never put service-account keys or passwords in this project.
