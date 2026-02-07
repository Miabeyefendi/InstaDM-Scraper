// ============================================
// InstaDM-Scraper v1.0.0
// By: @miabeyefendi
// https://github.com/Miabeyefendi/InstaDM-Scraper
//
// Instagram DM Exporter — Browser Console Script
// Paste this into DevTools Console on a DM page
// (instagram.com/direct/t/XXXXXXXXX/)
// ============================================

(async function() {

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function findContainer() {
    let best = null, bestD = -1;
    document.querySelectorAll('div').forEach(div => {
      if (div.scrollHeight > div.clientHeight + 200) {
        if (div.querySelector('[role="presentation"]')) {
          let d = 0, el = div;
          while (el.parentElement) { d++; el = el.parentElement; }
          if (d > bestD) { bestD = d; best = div; }
        }
      }
    });
    return best;
  }

  function isDateText(t) {
    if (t.match(/\d{1,2}\s+(Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)\s+\d{4}\s+\d{2}:\d{2}/i)) return true;
    if (t.match(/\d{2}\.\d{2}\.\d{4},?\s*\d{2}:\d{2}/)) return true;
    if (t.match(/^(Pzt|Sal|Çar|Per|Cum|Cts|Paz)\s+\d{2}:\d{2}$/i)) return true;
    if (t.match(/^\d{2}:\d{2}$/)) return true;
    if (t.match(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i)) return true;
    return false;
  }

  function getVisibleBubbleTexts(container) {
    const texts = new Set();
    container.querySelectorAll('[role="presentation"]').forEach(bubble => {
      const rect = bubble.getBoundingClientRect();
      if (rect.height === 0 || rect.top > window.innerHeight || rect.bottom < 0) return;
      const dirAutos = bubble.querySelectorAll('div[dir="auto"], span[dir="auto"]');
      for (const da of dirAutos) {
        if (da.querySelector('div[dir="auto"], span[dir="auto"]')) continue;
        const t = da.textContent.trim();
        if (t && t.length > 0) texts.add(t.slice(0, 80));
      }
    });
    return texts;
  }

  function scrapeScreen(container) {
    const items = [];

    // 1) DATES
    container.querySelectorAll('span').forEach(s => {
      const rect = s.getBoundingClientRect();
      if (rect.height === 0 || rect.top > window.innerHeight || rect.bottom < 0) return;
      const color = window.getComputedStyle(s).color;
      const rgb = color.match(/\d+/g);
      if (!rgb) return;
      const r = +rgb[0], g = +rgb[1], b = +rgb[2];
      if (r > 90 && r < 210 && g > 90 && g < 210 && b > 90 && b < 210 && Math.abs(r-g) < 20 && Math.abs(g-b) < 20) {
        const t = s.textContent.trim();
        if (t.length > 3 && t.length < 60 && isDateText(t)) {
          items.push({ type: 'date', text: t, top: rect.top });
        }
      }
    });

    if (items.filter(i => i.type === 'date').length === 0) {
      container.querySelectorAll('span, div').forEach(s => {
        const rect = s.getBoundingClientRect();
        if (rect.height === 0 || rect.top > window.innerHeight || rect.bottom < 0) return;
        const t = s.textContent.trim();
        if (t.length > 5 && t.length < 60 && isDateText(t)) {
          const child = s.querySelector('span, div');
          if (child && isDateText(child.textContent.trim())) return;
          items.push({ type: 'date', text: t, top: rect.top });
        }
      });
    }

    // 2) STORY INDICATORS
    container.querySelectorAll('span, div').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.height === 0 || rect.top > window.innerHeight || rect.bottom < 0) return;
      const t = el.textContent.trim();
      const tl = t.toLowerCase();
      if (t.length < 150 && t.length > 3) {
        if (tl.includes('hikayesine yanıt verdi') || tl.includes('hikayesine ifade bıraktı') ||
            tl.includes('hikayeye erişilemiyor') || tl.includes('replied to your story') ||
            tl.includes('replied to their story')) {
          const child = el.querySelector('span, div');
          let isSmallest = true;
          if (child) {
            const ct = child.textContent.trim().toLowerCase();
            if (ct.includes('hikayesine') || ct.includes('hikayeye') || ct.includes('replied')) isSmallest = false;
          }
          if (isSmallest) items.push({ type: 'story', text: t, top: rect.top });
        }
      }
    });

    // 3) MEDIA (Reels / Story Images / Standalone Images)
    container.querySelectorAll('a[href]').forEach(a => {
      const rect = a.getBoundingClientRect();
      if (rect.height === 0 || rect.top > window.innerHeight || rect.bottom < 0) return;
      const href = a.getAttribute('href') || '';
      if (href.includes('/stories/') || href.includes('/reel/') || href.includes('reel_id=')) {
        const isReel = href.includes('/reel/') || href.includes('reel_id=');
        items.push({ type: 'media', mediaType: isReel ? 'Reels' : 'Hikaye Görseli', top: rect.top, key: href.slice(0, 80) });
      }
    });

    container.querySelectorAll('img').forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.height === 0 || rect.top > window.innerHeight || rect.bottom < 0) return;
      const src = img.src || '';
      if ((src.includes('cdninstagram') || src.includes('fbcdn') || src.includes('scontent')) &&
          !src.includes('profile') && !src.includes('avatar') &&
          (img.width > 60 || img.naturalWidth > 60)) {
        if (!img.closest('[role="presentation"]') && !img.closest('a[href*="/stories/"], a[href*="/reel/"], a[href*="reel_id="]')) {
          items.push({ type: 'media', mediaType: 'Görsel', top: rect.top, key: src.slice(0, 80) });
        }
      }
    });

    // 4) MESSAGES
    container.querySelectorAll('[role="presentation"]').forEach(bubble => {
      const rect = bubble.getBoundingClientRect();
      if (rect.height === 0 || rect.top > window.innerHeight || rect.bottom < 0) return;

      const bg = window.getComputedStyle(bubble).backgroundColor;
      const rgb = bg.match(/\d+/g);
      if (!rgb) return;
      const r = +rgb[0], g = +rgb[1], b = +rgb[2];
      const isSent = (b > 180 && r < 130 && g < 130);

      const texts = [];
      bubble.querySelectorAll('div[dir="auto"], span[dir="auto"]').forEach(da => {
        if (da.querySelector('div[dir="auto"], span[dir="auto"]')) return;
        if (da.closest('time')) return;
        const t = da.textContent.trim();
        if (!t) return;
        if (['Beğen','Like','Yanıtla','Reply','Görüldü','Seen','Daha fazla','More','Mesaj...','Message...'].includes(t)) return;
        if (isDateText(t)) return;
        if (!texts.includes(t)) texts.push(t);
      });

      let hasImg = false;
      bubble.querySelectorAll('img').forEach(img => {
        const s = img.src || '';
        if ((s.includes('cdninstagram') || s.includes('scontent')) &&
            !s.includes('profile') && !s.includes('avatar') &&
            (img.width > 40 || img.naturalWidth > 40)) hasImg = true;
      });

      if (texts.length === 0 && !hasImg) return;

      let likeEmoji = '';
      let searchEl = bubble.parentElement;
      for (let i = 0; i < 8; i++) {
        if (!searchEl) break;
        searchEl.querySelectorAll('span').forEach(sp => {
          const et = sp.textContent.trim();
          if (['❤️','♥️','❤','😂','😍','🔥','😢','😮','👍','👏','🥰','💯','😊','😆','🙏'].includes(et)) {
            const sr = sp.getBoundingClientRect();
            if (sr.width > 0 && sr.width < 35) likeEmoji = et;
          }
        });
        searchEl.querySelectorAll('[aria-label]').forEach(al => {
          const lbl = (al.getAttribute('aria-label') || '').toLowerCase();
          if (lbl.includes('unlike') || lbl.includes('beğeniyi kaldır')) {
            if (!likeEmoji) likeEmoji = '❤️';
          }
        });
        if (likeEmoji) break;
        searchEl = searchEl.parentElement;
      }

      items.push({
        type: 'msg',
        text: texts.length > 0 ? texts.join(' ') : '[Görsel]',
        isSent, liked: likeEmoji,
        hasImg: hasImg && texts.length > 0,
        top: rect.top
      });
    });

    items.sort((a, b) => a.top - b.top);
    return items;
  }

  // ===== MAIN =====
  console.log('🚀 InstaDM-Scraper v1.0.0 by @miabeyefendi');
  console.log('📦 https://github.com/Miabeyefendi/InstaDM-Scraper');

  const container = findContainer();
  if (!container) { console.error('❌ Container not found! Open a DM conversation first.'); return; }
  console.log('✅ Container found');

  // 1) SCROLL TO TOP (oldest messages)
  console.log('⬆️ Scrolling to oldest messages...');
  let prevH = -1, stable = 0;
  while (stable < 5) {
    container.scrollTop = -container.scrollHeight * 2;
    await sleep(1500);
    if (container.scrollHeight === prevH) stable++;
    else { stable = 0; console.log('   Loading...', container.scrollHeight); }
    prevH = container.scrollHeight;
  }
  console.log('✅ At the top. scrollTop:', container.scrollTop);
  await sleep(3000);

  // 2) SCROLL DOWN + SCRAPE — DOM mutation aware
  const allItems = [];
  const seenKeys = new Set();
  const viewH = container.clientHeight;
  let stepCount = 0;
  let noChangeCount = 0;

  console.log('⬇️ Scanning messages...');

  while (true) {
    const beforeTexts = getVisibleBubbleTexts(container);
    const screenItems = scrapeScreen(container);
    let newCount = 0;

    for (const item of screenItems) {
      let key = '';
      if (item.type === 'date') key = 'D|' + item.text;
      else if (item.type === 'story') key = 'S|' + item.text;
      else if (item.type === 'media') key = 'V|' + item.key;
      else if (item.type === 'msg') key = 'M|' + item.text.slice(0, 100);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      allItems.push(item);
      newCount++;
    }

    stepCount++;
    const progress = Math.min(100, Math.round((container.scrollTop - (-container.scrollHeight)) / container.scrollHeight * 100));
    console.log(`   ${stepCount} step | ${allItems.filter(i=>i.type==='msg').length} msgs | +${newCount} new | %${progress}`);

    const oldScrollTop = container.scrollTop;
    container.scrollTop = oldScrollTop + Math.floor(viewH * 0.5);

    let waited = 0;
    const maxWait = 5000;
    while (waited < maxWait) {
      await sleep(300);
      waited += 300;
      const afterTexts = getVisibleBubbleTexts(container);
      let hasNew = false;
      for (const t of afterTexts) {
        if (!beforeTexts.has(t)) { hasNew = true; break; }
      }
      if (hasNew) break;
      if (container.scrollTop === oldScrollTop && waited > 1000) break;
    }

    await sleep(500);

    if (container.scrollTop >= -5 || container.scrollTop === oldScrollTop) {
      noChangeCount++;
      if (noChangeCount >= 3) {
        container.scrollTop = 0;
        await sleep(2000);
        const lastItems = scrapeScreen(container);
        for (const item of lastItems) {
          let key = '';
          if (item.type === 'date') key = 'D|' + item.text;
          else if (item.type === 'story') key = 'S|' + item.text;
          else if (item.type === 'media') key = 'V|' + (item.key||'');
          else if (item.type === 'msg') key = 'M|' + item.text.slice(0, 100);
          if (!seenKeys.has(key)) { seenKeys.add(key); allItems.push(item); }
        }
        break;
      }
    } else {
      noChangeCount = 0;
    }

    if (stepCount > 500) { console.log('⚠️ 500 step limit reached'); break; }
  }

  const msgs = allItems.filter(i => i.type === 'msg');
  console.log('✅ Done!', msgs.length, 'messages |', stepCount, 'steps');

  // 3) FORMAT
  let output = '';
  let lastStoryMarker = '';

  for (const item of allItems) {
    if (item.type === 'date') {
      if (output) output += '---\n';
      output += 'Tarih - Saat: ' + item.text + '\n';
    } else if (item.type === 'story') {
      lastStoryMarker = item.text;
    } else if (item.type === 'media') {
      const label = '[' + item.mediaType + ']';
      if (lastStoryMarker) {
        output += 'Hikaye yanıtı: ' + lastStoryMarker + ' ' + label + '\n';
        lastStoryMarker = '';
      } else {
        output += label + '\n';
      }
    } else if (item.type === 'msg') {
      const like = item.liked ? ' -' + item.liked + 'beğenildi' : '';
      const img = item.hasImg ? ' [Görsel]' : '';
      let isStory = false;
      if (lastStoryMarker) { isStory = true; lastStoryMarker = ''; }

      if (isStory) output += 'Hikaye yanıtı: ' + item.text + img + like + '\n';
      else if (item.isSent) output += 'Gönderilen: ' + item.text + img + like + '\n';
      else output += 'Gelen: ' + item.text + img + like + '\n';
    }
  }

  console.log('\n📋 OUTPUT:\n');
  console.log(output);
  console.log('\n📊 Total:', msgs.length);
  console.log('Sent:', msgs.filter(m => m.isSent).length);
  console.log('Received:', msgs.filter(m => !m.isSent).length);
  console.log('Liked:', msgs.filter(m => m.liked).length);
  console.log('Media:', allItems.filter(i => i.type === 'media').length);
  console.log('Dates:', allItems.filter(i => i.type === 'date').length);

  const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dm_' + new Date().toISOString().slice(0, 10) + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('📁 Downloaded!');
  console.log('🎉 InstaDM-Scraper by @miabeyefendi — github.com/Miabeyefendi/InstaDM-Scraper');

})();