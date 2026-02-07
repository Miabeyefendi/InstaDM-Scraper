# 📘 InstaDM-Scraper: Detailed Technical Guide

> **[TR] Türkçe rehber için [buraya tıklayın](egitim.md)**  
> *For the Turkish version of this guide, click the link above.*

Welcome to the technical deep-dive of **InstaDM-Scraper**. This guide explains how the script works internally, what each function does, and how to customize or troubleshoot it when Instagram updates its DOM structure.

---

## 🏗️ Architecture Overview

InstaDM-Scraper is a single-file JavaScript tool that runs in your browser's DevTools Console. It consists of these core components:

- **Container Discovery** — Finds the scrollable message area
- **Scroll Engine** — Handles Instagram's inverted virtual scroll
- **DOM Scraper** — Extracts messages, dates, reactions, and media
- **Formatter** — Produces clean text output
- **Downloader** — Saves the result as a `.txt` file

---

## 🔍 1. Container Discovery — `findContainer()`

Instagram's message area is a deeply nested `<div>` with no semantic attributes like `id` or `role="chat"`. The script finds it by:

1. Scanning all `<div>` elements on the page
2. Filtering those with `scrollHeight > clientHeight + 200` (scrollable)
3. Checking if they contain `[role="presentation"]` elements (message balloons)
4. Selecting the **deepest** matching container (highest DOM depth)

### When Instagram Updates
If the script can't find the container, Instagram may have changed the balloon role. Check:
```javascript
// Look for the new message balloon attribute
document.querySelectorAll('[role="presentation"]').length
// If 0, inspect a message bubble and find its new role/attribute
```

---

## 📜 2. Scroll Engine — Inverted Virtual Scroll

This is the most critical and complex part. Instagram's message container is **CSS-inverted**:

| Direction | scrollTop Value |
|---|---|
| Newest messages (bottom) | `0` |
| Oldest messages (top) | Large **negative** number |

### Phase 1: Scroll to Top (Oldest Messages)
```javascript
container.scrollTop = -container.scrollHeight * 2;
// Repeat until scrollHeight stops growing (all messages loaded)
```

### Phase 2: Scroll Down & Scrape
Instead of using timers, the script monitors **DOM mutations**:

1. Record currently visible message texts (`beforeTexts`)
2. Move `scrollTop` forward by 50% of viewport height
3. Wait in 300ms intervals until **new message texts appear** that weren't in `beforeTexts`
4. Scrape the current screen
5. Repeat until `scrollTop >= 0`

### Why Not Use `MutationObserver`?
Instagram's React fiber reconciler triggers frequent DOM updates that aren't necessarily new messages. Comparing visible text sets is more reliable than counting mutations.

---

## 🎨 3. Sender Detection — Background Color Analysis

Instagram differentiates sent and received messages purely through CSS styling:

- **Sent (You):** `role="presentation"` div has `backgroundColor: rgb(74, 93, 249)` — Instagram's signature blue
- **Received (Them):** `role="presentation"` div has `backgroundColor: rgb(37, 41, 46)` — dark gray

```javascript
const bg = getComputedStyle(bubble).backgroundColor;
const rgb = bg.match(/\d+/g);
const isSent = (+rgb[2] > 180 && +rgb[0] < 130 && +rgb[1] < 130);
```

### When Instagram Updates Colors
If sent messages suddenly appear as "received," Instagram may have changed their color scheme. Inspect a sent message balloon and update the RGB check.

---

## 📅 4. Timestamp Extraction

Timestamps appear as gray-colored spans. The script identifies them by:

1. **Color check:** RGB values where R ≈ G ≈ B, all between 90-210 (gray tones)
2. **Regex match:** Turkish date formats:
   - `1 Oca 2026 00:30` — Full date with month abbreviation
   - `Paz 21:14` — Day abbreviation with time
   - `12.05.2025 00:02` — Dot-separated date

### Supported Month Abbreviations
`Oca`, `Şub`, `Mar`, `Nis`, `May`, `Haz`, `Tem`, `Ağu`, `Eyl`, `Eki`, `Kas`, `Ara`

### Adding English Support
Add this to the `isDateText()` function:
```javascript
if (t.match(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i)) return true;
```

---

## 💬 5. Story Reply Detection

Story replies are identified by scanning for specific text patterns in `<span>` and `<div>` elements:

- `"hikayesine yanıt verdi"` — replied to story
- `"hikayesine ifade bıraktı"` — reacted to story  
- `"hikayeye erişilemiyor"` — story no longer available

When a story indicator is found, the **next message** in the sequence is tagged as a story reply.

---

## ❤️ 6. Reaction Detection

Reactions appear as small emoji spans near the message balloon. The script:

1. Searches the parent chain of each `role="presentation"` div (up to 8 levels)
2. Looks for `<span>` elements containing emoji characters
3. Verifies the span is small (`width < 35px`) — this distinguishes reactions from message text
4. Also checks `aria-label` attributes for `"unlike"` or `"beğeniyi kaldır"`

### Detected Emojis
`❤️`, `♥️`, `❤`, `😂`, `😍`, `🔥`, `😢`, `😮`, `👍`, `👏`, `🥰`, `💯`, `😊`, `😆`, `🙏`

---

## 🎬 7. Media Detection

| Media Type | Detection Method |
|---|---|
| **Reels** | `<a href>` containing `/reel/` or `reel_id=` |
| **Story Image** | `<a href>` containing `/stories/` |
| **Standalone Image** | `<img>` with `src` containing `cdninstagram`, `fbcdn`, or `scontent` — not inside a `role="presentation"` or story/reel link |

---

## 🛠️ Troubleshooting

### Script finds 0 messages
- Ensure you're on a DM conversation page (`/direct/t/XXXXX/`)
- Check if `role="presentation"` elements exist:
  ```javascript
  document.querySelectorAll('[role="presentation"]').length
  ```

### Scroll doesn't work
- Test which scroll method works:
  ```javascript
  const c = findContainer();
  c.scrollTop = c.scrollTop - 500;
  // Check if scrollTop actually changed
  ```

### All messages show as "Gelen" (received)
- Instagram changed sent message color. Inspect a sent message:
  ```javascript
  // Click on your own message, then in Console:
  $0.querySelector('[role="presentation"]')
  getComputedStyle($0.querySelector('[role="presentation"]')).backgroundColor
  ```

### Missing messages in output
- Increase the DOM wait time by modifying the `maxWait` value in the scroll loop
- Instagram may need more time to render messages on slower connections

---

## 📝 Customization Example

**Scenario:** I want the script to wait longer between scrolls for a very large chat.

In the scroll loop, find the `maxWait` constant and increase it:
```javascript
const maxWait = 8000; // Default is 5000, increase for slow connections
```

Also reduce the scroll step for more overlap:
```javascript
container.scrollTop = oldScrollTop + Math.floor(viewH * 0.3); // Default is 0.5
```

---

**InstaDM-Scraper** — *Built for privacy, designed for simplicity.*
