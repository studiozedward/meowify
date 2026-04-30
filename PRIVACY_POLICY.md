# Privacy Policy — Meowify

**Last updated: April 30, 2026**

---

Meowify is a Chrome extension that encodes and decodes text using a vocabulary of cat sounds.

## What data Meowify collects

None. Meowify does not collect, store, transmit, or share any personal data or usage information.

## How Meowify works

All encoding and decoding happens locally in your browser using a content script. The extension:

- Reads text that you explicitly highlight on a webpage
- Encodes or decodes that text on your device
- Optionally writes the result back to the field you highlighted it from

No text you highlight, encode, or decode is ever sent to any server. There is no backend, no analytics, no logging, and no third-party services of any kind.

## Permissions

Meowify requests the following browser permissions:

| Permission | Why |
|---|---|
| `clipboardWrite` | To copy encoded/decoded text to your clipboard when you click Copy |
| `host_permissions: <all_urls>` | To run on any webpage so you can Meowify text wherever you are |

## Contact

If you have questions, open an issue on the [GitHub repository](https://github.com/studiozedward/meowify).
