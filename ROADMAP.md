# Meowify — Roadmap

## Deferred (post-launch)

### Firebase App Check
Proper attestation for the `reportMeows` Cloud Function — stops sophisticated attackers who've extracted the app token.

**Pre-requisites before starting:**
- Extension must be published on the Chrome Web Store (need the official extension ID, not the dev ID)
- Real abuse traffic to justify the complexity

**What's involved:**
- Enable App Check in Firebase Console, register the extension as a Web app, choose reCAPTCHA Enterprise as the provider
- Bundle the Firebase App Check JS SDK into the extension (~50KB addition)
- Initialise App Check in `background.js`, attach tokens to the `X-Firebase-AppCheck` header on every POST
- Add `admin.appCheck().verifyToken(token)` verification in `firebase/functions/index.js`
- Register the Chrome Web Store extension ID in Firebase Console

**Files to modify:** `background.js`, `firebase/functions/index.js`, `manifest.json`

---

### Sharded counters
Eliminates transaction contention on the three counter nodes (`totalWords`, `totalInputWords`, `totalMeowifiers`) under high concurrent write load.

**Pre-requisites before starting:**
- Visible transaction failures or slow counter updates in production at scale

**What's involved:**
- Write to `counters/shards/{0-9}/{field}` (10 shards, randomly chosen per request) instead of a single node
- Read path sums all shards — either in the Cloud Function or client-side after fetching all shards
- Alternatively, switch to Firestore which handles this natively with `FieldValue.increment()`

**Files to modify:** `firebase/functions/index.js`, `background.js` (read path)

---

## Completed
- Per-IP rate limiting (10 req/hour) in Cloud Function
- App token validation (shared secret)
- wordCount cap reduced to 5,000
- Batched counter reporting (10-min alarm, no immediate flush)
- Bundled Nunito font (removed Google Fonts CDN)
- URL validation in admin messages (https-only)
- Privacy policy: IP disclosure, COPPA notice, corrected user ID wording
