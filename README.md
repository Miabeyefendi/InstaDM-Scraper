## Export Instagram DMs Directly from Your Browser — No API, No Extension
Want to **export your Instagram direct messages** without waiting 24 hours for Instagram's data download? **InstaDM-Scraper** is a lightweight, browser-based **Instagram DM exporter** that runs directly in your DevTools Console. Developed by **@miabeyefendi**, it handles Instagram's virtual scroll, detects sent/received messages by analyzing DOM rendering, and outputs a clean chronological chat log with timestamps, story replies, reactions, and media labels.

# 📨 InstaDM-Scraper: Browser Console Instagram DM Exporter | By: @miabeyefendi

[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020+-F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Platform](https://img.shields.io/badge/Platform-Browser_Console-4285F4.svg?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/Miabeyefendi/InstaDM-Scraper)
[![No API](https://img.shields.io/badge/API-Not_Required-success.svg?style=for-the-badge)](https://github.com/Miabeyefendi/InstaDM-Scraper)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

[TR | Türkçe Oku](README.tr.md) | [Technical Tutorial](tutorial.md)

**InstaDM-Scraper** is a pure JavaScript tool that extracts your complete Instagram DM history directly from the browser.  
Unlike Instagram's built-in data export (which takes 12-24 hours), this script runs instantly in your DevTools Console and outputs a clean, formatted chat log.

---

## 🔥 Why InstaDM-Scraper?

Instagram's official data download is slow and the format is messy.  
**InstaDM-Scraper** gives you instant results with a structured output.

- 🚫 **No API Keys Required**  
  Runs entirely in your browser — no tokens, no OAuth, no third-party services.

- 🔄 **Virtual Scroll Compatible**  
  Instagram uses virtual scrolling (only ~10-15 messages exist in DOM at a time). This script scrolls through the entire chat and captures every message by monitoring DOM mutations.

- 📅 **Chronological Output**  
  Messages are exported from oldest to newest with accurate timestamps.

- 🎯 **Smart Sender Detection**  
  Identifies sent vs. received messages by analyzing `role="presentation"` balloon background colors (`rgb(74,93,249)` = sent, `rgb(37,41,46)` = received).

---

## ✨ Core Features

- **Full Chat Export**  
  Scrolls through the entire conversation history and captures every message.

- **Story Reply Detection**  
  Identifies and labels story replies (`"hikayesine yanıt verdi"`, `"hikayesine ifade bıraktı"`).

- **Reaction/Like Detection**  
  Detects emoji reactions (❤️, 😂, 🔥, etc.) on messages via `aria-label` and small emoji spans.

- **Media Labels**  
  Tags shared content as `[Görsel]`, `[Reels]`, or `[Hikaye Görseli]` by analyzing `<a href>` paths (`/reel/`, `/stories/`).

- **Timestamp Extraction**  
  Parses date/time from gray-colored spans matching Turkish date formats (`1 Oca 2026 00:30`, `Paz 21:14`, etc.).

- **Auto-Download**  
  Automatically downloads the result as a `.txt` file.

---

## 🛠️ Getting Started

### Prerequisites
- Any Chromium-based browser (Chrome, Edge, Brave, etc.)
- An active Instagram session (logged in on `instagram.com`)

### Usage

1. Open a DM conversation on Instagram Web:
   ```
   https://www.instagram.com/direct/t/XXXXXXXXX/
   ```

2. Open DevTools (`F12` or `Ctrl+Shift+I`)

3. Go to the **Console** tab

4. Copy the entire content of `instadm-scraper.js` and paste it into the Console

5. Press **Enter** and wait — the script will:
   - Scroll to the oldest messages
   - Slowly scroll down, capturing messages at each step
   - Monitor DOM changes to ensure no messages are skipped
   - Download the result as a `.txt` file

---

## 📋 Output Format

```
Tarih - Saat: 19 Ara 2024 23:12
Hikaye yanıtı: @xxxxxxx'un hikayesine ifade bıraktı [Hikaye Görseli]
---
Tarih - Saat: 12 May 2025 00:02
Hikaye yanıtı: Nice mutlu yaşlarına [Görsel]
Gelen: Tesekkur ederiimmmmmmmmmmmmmmmm 😊
Gönderilen: Ricalar -❤️beğenildi
---
Tarih - Saat: 5 Oca 2026 00:38
[Reels]
Gönderilen: Bunu izleyince içim bi yumuşadı sebepsizce... -❤️beğenildi
Gelen: Benimde aşkım
```

---

## 🔧 How It Works — Technical Overview

| Challenge | Solution |
|---|---|
| Instagram uses **virtual scroll** — only visible messages exist in DOM | Scrolls step by step, waits for DOM mutations before scraping |
| `scrollTop` is **inverted** (0 = bottom, negative = top) | Navigates from most negative → 0 (old → new) |
| No `role="row"` elements | Uses `role="presentation"` balloons as message containers |
| Sent vs. received detection | Analyzes background color of `role="presentation"` div |
| Timestamps hidden in gray spans | Color analysis (`rgb ~140-170`) + Turkish date regex |
| Reactions are tiny emoji spans | Searches parent chain up to 8 levels for small emoji spans |

---

## 📈 Version History

**v1.0.0**
- Full virtual scroll support with DOM mutation monitoring
- Sent/received detection via background color analysis
- Story reply, reaction, and media label detection
- Turkish date format parsing
- Auto-download as `.txt`

---

## ⚠️ Disclaimer & Privacy

InstaDM-Scraper is developed for **personal and educational purposes only**.  
This tool only reads data that is **already visible to you** in your own browser.

- ✅ No data is sent to any external server
- ✅ No API calls — everything runs locally
- ✅ No browser extension required
- ⚠️ Automated scraping may violate Instagram's Terms of Service

The developer is **not responsible** for any consequences of using this tool.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the project
2. Create your feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

---

## 👨‍💻 Author

**Miabeyefendi**
- GitHub: [@Miabeyefendi](https://github.com/Miabeyefendi)
- Project: **InstaDM-Scraper** (Instagram DM Scraper)

*Built for privacy, designed for simplicity.*
