# Meowify — Claude Instructions

## What this is
Chrome Extension MV3. Encodes any text into cat sounds and decodes it back.
All encoding/decoding is local. Firebase backend handles community counters only.

## Key files
| File | Role |
|---|---|
| `content.js` | Content script — floating button, modal UI, encode/decode |
| `background.js` | Service worker — Firebase sync, alarm, message passing |
| `manifest.json` | Extension manifest (MV3) |
| `firebase/functions/index.js` | Cloud Function — receives counter reports |
| `firebase/database.rules.json` | Realtime DB security rules |
| `firebase-config.js` | Live Firebase credentials — gitignored, never commit |
| `firebase-config.example.js` | Template for the above |

## Architecture
- Content script sends `{ type: 'meowified', wordCount, inputWordCount }` to service worker
- Service worker batches and POSTs to Cloud Function every 10 minutes via alarm
- Service worker fetches `/counters.json` + `/messages.json` from RTDB (20-min cache)
- Modal reads data via `{ type: 'getData' }` message to service worker

## Gotchas
- `importScripts()` in MV3 service workers must be top-level (inside try/catch is fine)
- All modal styles are inline — no external CSS. No style sheets.
- `document.execCommand('insertText')` is used for React/contenteditable replace — do not switch to clipboard API
- The Nunito font is bundled as `nunito-latin.woff2` — do not use Google Fonts CDN (GDPR issue)
- `firebase-config.js` contains `appToken` — this must match `functions.config().meowify.token` in GCP
- Counter reporting is alarm-only (no immediate flush) — this is intentional to reduce Cloud Function calls
- wordCount max is 5,000 in both the Cloud Function and the extension's input validation

## Deploy commands
```bash
# Deploy Cloud Function only
cd firebase && firebase deploy --only functions

# Deploy DB security rules only
cd firebase && firebase deploy --only database

# Set app token (run once, or after rotating)
cd firebase && firebase functions:config:set meowify.token="your-token"
```

## Deferred work
See `ROADMAP.md` for Firebase App Check and sharded counters.
