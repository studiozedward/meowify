# Meowify 🐱

A Chrome extension that encodes any text into cat sounds — and decodes it back.

Highlight text on any webpage, click the floating button, and your message becomes a string of meows. Share it, paste it somewhere, highlight it again, and Meowify will decode it back to the original.

---

## How it works

Highlight any text → a button appears near your selection → click to encode or decode.

**Encoding** converts your text into a sequence of cat words:

> `Hello` → `mya purr miau mrp mya maww mya purr mrow meow`

**Decoding** is the reverse — select any meow text and click Unmeowify to get the original back.

The modal shows the result. From there you can:
- **Copy** it to your clipboard
- **Replace** to swap the selected text in place (works in Gmail, ChatGPT, Meta AI, Google Docs, and most web editors)

---

## Vocabulary

Each byte of your text is encoded as two words from a 16-word vocabulary:

```
meow  mew  mrow  maww  purr  mrp  miau  mya
MEOW  MEW  MROW  MAWW  PURR  MRP  MIAU  MYA
```

Case matters — `meow` and `MEOW` are different values. Any text with valid tokens that decodes to valid UTF-8 will be decoded correctly.

---

## Installation

### From the Chrome Web Store
Search for **Meowify** or install directly from the listing page.

### Manual (developer mode)
1. Download or clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the folder

---

## Works in
- Gmail compose
- ChatGPT
- Meta AI
- Google Docs
- Any standard textarea or contenteditable field

---

## Privacy
Meowify processes everything locally in your browser. No data is ever sent anywhere. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).
