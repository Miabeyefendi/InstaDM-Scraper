# 📘 InstaDM-Scraper: Detaylı Teknik Rehber

> **[EN] Click [here](tutorial.md) for the English version of this guide.**  
> *Bu rehberin İngilizce versiyonuna yukarıdaki bağlantıdan ulaşabilirsiniz.*

**InstaDM-Scraper** teknik derinlemesine inceleme rehberine hoş geldiniz. Bu doküman; scriptin nasıl çalıştığını, her fonksiyonun ne yaptığını ve Instagram DOM yapısını güncellediğinde nasıl özelleştirme veya sorun giderme yapacağınızı açıklar.

---

## 🏗️ Mimari Genel Bakış

InstaDM-Scraper, tarayıcınızın DevTools Console'unda çalışan tek dosyalık bir JavaScript aracıdır. Şu temel bileşenlerden oluşur:

- **Container Keşfi** — Kaydırılabilir mesaj alanını bulur
- **Scroll Motoru** — Instagram'ın ters çevrilmiş virtual scroll'unu yönetir
- **DOM Scraper** — Mesajları, tarihleri, reaksiyonları ve medyayı çıkarır
- **Formatlayıcı** — Temiz metin çıktısı üretir
- **İndirici** — Sonucu `.txt` dosyası olarak kaydeder

---

## 🔍 1. Container Keşfi — `findContainer()`

Instagram'ın mesaj alanı, `id` veya `role="chat"` gibi semantik attribute'ları olmayan derin iç içe geçmiş bir `<div>` elementidir. Script şu şekilde bulur:

1. Sayfadaki tüm `<div>` elementlerini tarar
2. `scrollHeight > clientHeight + 200` olanları filtreler (kaydırılabilir)
3. İçinde `[role="presentation"]` elementleri olanları kontrol eder (mesaj balonları)
4. **En derin** eşleşen container'ı seçer (en yüksek DOM derinliği)

### Instagram Güncelleme Yaparsa
Script container'ı bulamıyorsa, Instagram balon role'ünü değiştirmiş olabilir:
```javascript
// Yeni mesaj balonu attribute'unu arayın
document.querySelectorAll('[role="presentation"]').length
// Eğer 0 ise, bir mesaj balonunu inceleyin ve yeni role/attribute'u bulun
```

---

## 📜 2. Scroll Motoru — Ters Çevrilmiş Virtual Scroll

Bu, en kritik ve karmaşık kısımdır. Instagram'ın mesaj container'ı **CSS ile ters çevrilmiştir**:

| Yön | scrollTop Değeri |
|---|---|
| En yeni mesajlar (alt) | `0` |
| En eski mesajlar (üst) | Büyük **negatif** sayı |

### Faz 1: En Üste Çık (En Eski Mesajlar)
```javascript
container.scrollTop = -container.scrollHeight * 2;
// scrollHeight artışı duruncaya kadar tekrarla (tüm mesajlar yüklendi)
```

### Faz 2: Aşağı İn ve Scrap Yap
Timer kullanmak yerine, script **DOM mutasyonlarını izler**:

1. Ekranda görünen mesaj metinlerini kaydet (`beforeTexts`)
2. `scrollTop`'u viewport yüksekliğinin %50'si kadar ileri taşı
3. `beforeTexts`'te olmayan **yeni mesaj metinleri görününceye kadar** 300ms aralıklarla bekle
4. Mevcut ekranı scrap et
5. `scrollTop >= 0` olana kadar tekrarla

### Neden `MutationObserver` Kullanılmıyor?
Instagram'ın React fiber reconciler'ı, yeni mesaj olmayan sık DOM güncellemeleri tetikler. Görünür metin setlerini karşılaştırmak, mutasyon saymaktan daha güvenilirdir.

---

## 🎨 3. Gönderen Tespiti — Arka Plan Rengi Analizi

Instagram, gönderilen ve alınan mesajları tamamen CSS stil farklılığıyla ayırır:

- **Gönderilen (Siz):** `role="presentation"` div'inin `backgroundColor: rgb(74, 93, 249)` — Instagram'ın imza mavisi
- **Gelen (Karşı Taraf):** `role="presentation"` div'inin `backgroundColor: rgb(37, 41, 46)` — koyu gri

```javascript
const bg = getComputedStyle(bubble).backgroundColor;
const rgb = bg.match(/\d+/g);
const isSent = (+rgb[2] > 180 && +rgb[0] < 130 && +rgb[1] < 130);
```

### Instagram Renkleri Değiştirirse
Gönderilen mesajlar aniden "gelen" olarak görünüyorsa, Instagram renk şemasını değiştirmiş olabilir. Bir gönderilen mesaj balonunu inceleyip RGB değerini güncelleyin.

---

## 📅 4. Tarih Çıkarma

Tarihler gri renkli span'larda görünür. Script şu şekilde tespit eder:

1. **Renk kontrolü:** R ≈ G ≈ B olan, hepsi 90-210 arasındaki RGB değerleri (gri tonları)
2. **Regex eşleşmesi:** Türkçe tarih formatları:
   - `1 Oca 2026 00:30` — Ay kısaltmalı tam tarih
   - `Paz 21:14` — Gün kısaltması ve saat
   - `12.05.2025 00:02` — Noktayla ayrılmış tarih

### Desteklenen Ay Kısaltmaları
`Oca`, `Şub`, `Mar`, `Nis`, `May`, `Haz`, `Tem`, `Ağu`, `Eyl`, `Eki`, `Kas`, `Ara`

---

## 💬 5. Hikaye Yanıtı Tespiti

Hikaye yanıtları, `<span>` ve `<div>` elementlerinde belirli metin kalıpları aranarak tespit edilir:

- `"hikayesine yanıt verdi"` — hikayeye yanıt
- `"hikayesine ifade bıraktı"` — hikayeye reaksiyon
- `"hikayeye erişilemiyor"` — hikaye artık mevcut değil

Hikaye göstergesi bulunduğunda, sıradaki **sonraki mesaj** hikaye yanıtı olarak etiketlenir.

---

## ❤️ 6. Reaksiyon Tespiti

Reaksiyonlar, mesaj balonunun yakınında küçük emoji span'ları olarak görünür. Script:

1. Her `role="presentation"` div'inin parent zincirini arar (8 seviye yukarıya kadar)
2. Emoji karakterleri içeren `<span>` elementlerini arar
3. Span'ın küçük olduğunu doğrular (`width < 35px`) — bu, reaksiyonları mesaj metninden ayırır
4. Ayrıca `aria-label` attribute'larını `"unlike"` veya `"beğeniyi kaldır"` için kontrol eder

### Tespit Edilen Emojiler
`❤️`, `♥️`, `❤`, `😂`, `😍`, `🔥`, `😢`, `😮`, `👍`, `👏`, `🥰`, `💯`, `😊`, `😆`, `🙏`

---

## 🎬 7. Medya Tespiti

| Medya Türü | Tespit Yöntemi |
|---|---|
| **Reels** | `<a href>` içinde `/reel/` veya `reel_id=` |
| **Hikaye Görseli** | `<a href>` içinde `/stories/` |
| **Bağımsız Görsel** | `<img>` src'sinde `cdninstagram`, `fbcdn` veya `scontent` — `role="presentation"` veya story/reel linki içinde değil |

---

## 🛠️ Sorun Giderme

### Script 0 mesaj buluyor
- DM sohbet sayfasında olduğunuzdan emin olun (`/direct/t/XXXXX/`)
- `role="presentation"` elementlerinin var olup olmadığını kontrol edin:
  ```javascript
  document.querySelectorAll('[role="presentation"]').length
  ```

### Scroll çalışmıyor
- Hangi scroll yönteminin çalıştığını test edin:
  ```javascript
  const c = findContainer();
  c.scrollTop = c.scrollTop - 500;
  // scrollTop'un gerçekten değişip değişmediğini kontrol edin
  ```

### Tüm mesajlar "Gelen" olarak görünüyor
- Instagram gönderilen mesaj rengini değiştirmiş. Bir gönderilen mesajı inceleyin:
  ```javascript
  $0.querySelector('[role="presentation"]')
  getComputedStyle($0.querySelector('[role="presentation"]')).backgroundColor
  ```

### Çıktıda eksik mesajlar var
- Scroll döngüsündeki `maxWait` değerini artırın
- Yavaş bağlantılarda Instagram'ın mesajları render etmesi daha uzun sürebilir

---

## 📝 Özelleştirme Örneği

**Senaryo:** Çok uzun bir sohbet için scroll'lar arası bekleme süresini artırmak istiyorum.

Scroll döngüsünde `maxWait` sabitini bulun ve artırın:
```javascript
const maxWait = 8000; // Varsayılan 5000, yavaş bağlantılar için artırın
```

Ayrıca daha fazla örtüşme için scroll adımını küçültün:
```javascript
container.scrollTop = oldScrollTop + Math.floor(viewH * 0.3); // Varsayılan 0.5
```

---

**InstaDM-Scraper** — *Gizlilik için tasarlandı, sadelik için inşa edildi.*
