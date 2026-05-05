# Privacy Policy — Meowify

**Last updated: May 5, 2026**

---

Meowify is a Chrome extension that encodes and decodes text using a vocabulary of cat sounds.

## How Meowify works

All encoding and decoding happens locally in your browser using a content script. The extension:

- Reads text that you explicitly highlight on a webpage
- Encodes or decodes that text on your device
- Optionally writes the result back to the field you highlighted it from

No text you highlight, encode, or decode is ever sent to any server. The actual content of your messages is never transmitted.

## Community counters

Meowify displays three community counters: total meowifiers, total meows generated, and total words meowed. To power these:

- When you encode text, the **number of output words** and the **number of input words** are sent to a server. Only the counts (single integers) are sent — never the text itself, never the original message, and never any page content.
- A random anonymous ID is generated on first use and stored locally on your device. This ID is used solely to avoid counting the same user twice. It is never linked to your identity.
- Counter data is sent in batches (at most once per hour) to minimise network activity.
- If the counter service is unavailable, the extension works exactly as before — encoding and decoding happen locally regardless.

## Announcements

The modal may display short announcements (e.g. new features, tips). These are fetched from our server and contain only text and links written by the extension developer. No user data is sent when fetching announcements.

## Permissions

| Permission | Why |
|---|---|
| `clipboardWrite` | To copy encoded/decoded text to your clipboard when you click Copy |
| `host_permissions: <all_urls>` | To run on any webpage so you can Meowify text wherever you are |
| `storage` | To store your anonymous user ID and pending counter data locally |
| `alarms` | To schedule batched counter reporting (at most once per hour) |

## Contact

If you have questions, open an issue on the [GitHub repository](https://github.com/studiozedward/meowify).
