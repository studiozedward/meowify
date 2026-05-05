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
- A flag is stored locally to track whether you have been counted. Only a one-time boolean ("new user: yes/no") is sent to the server — your anonymous ID never leaves your device.
- Counter data is sent in batches (at most once every 10 minutes) to minimise network activity.
- If the counter service is unavailable, the extension works exactly as before — encoding and decoding happen locally regardless.

## Announcements

The modal may display short announcements (e.g. new features, tips). These are fetched from our server and contain only text and links written by the extension developer. No user data is sent when fetching announcements.

## Server requests and IP addresses

When counter data or announcements are exchanged with our server, your IP address is received as part of the standard web request. IP addresses are not stored, logged long-term, or linked to your usage data. We do not use IP addresses to identify or track individual users.

## Permissions

| Permission | Why |
|---|---|
| `clipboardWrite` | To copy encoded/decoded text to your clipboard when you click Copy |
| `host_permissions: <all_urls>` | To run on any webpage so you can Meowify text wherever you are |
| `storage` | To store your anonymous user ID and pending counter data locally |
| `alarms` | To schedule batched counter reporting (at most once every 10 minutes) |

## Children's privacy

Meowify is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child under 13 has provided personal data through the extension, please contact us so we can take appropriate action.

## Contact

If you have questions, open an issue on the [GitHub repository](https://github.com/studiozedward/meowify).
