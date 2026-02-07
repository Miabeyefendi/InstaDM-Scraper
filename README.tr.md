## Instagram DM'lerinizi Tarayıcıdan Anında Dışa Aktarın — API Yok, Eklenti Yok
**Instagram direkt mesajlarınızı dışa aktarmak** için Instagram'ın 12-24 saat süren veri indirme işlemini beklemeye gerek yok. **InstaDM-Scraper**, doğrudan tarayıcınızın DevTools Console'unda çalışan hafif bir **Instagram DM dışa aktarıcıdır**. **@miabeyefendi** tarafından geliştirilen bu araç, Instagram'ın virtual scroll yapısını yönetir, DOM render analizi ile gönderilen/alınan mesajları tespit eder ve tarih, hikaye yanıtları, reaksiyonlar ve medya etiketleriyle temiz bir kronolojik sohbet çıktısı üretir.

# 📨 InstaDM-Scraper: Tarayıcı Konsol Instagram DM Dışa Aktarıcı | By: @miabeyefendi

[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020+-F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Platform](https://img.shields.io/badge/Platform-Tarayıcı_Konsol-4285F4.svg?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/Miabeyefendi/InstaDM-Scraper)
[![No API](https://img.shields.io/badge/API-Gerekmez-success.svg?style=for-the-badge)](https://github.com/Miabeyefendi/InstaDM-Scraper)
[![License: GPL-3.0](https://img.shields.io/badge/Lisans-GPL--3.0-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

[EN | Read in English](README.md) | [Teknik Rehber](egitim.md)

**InstaDM-Scraper**, Instagram DM geçmişinizi doğrudan tarayıcıdan çıkaran saf JavaScript aracıdır.  
Instagram'ın dahili veri indirme sistemi (12-24 saat süren) yerine, bu script DevTools Console'da anında çalışır ve temiz, formatlanmış bir sohbet çıktısı üretir.

---

## 🔥 Neden InstaDM-Scraper?

Instagram'ın resmi veri indirme sistemi yavaş ve çıktı formatı karmaşıktır.  
**InstaDM-Scraper** anında, yapılandırılmış sonuç verir.

- 🚫 **API Anahtarı Gerekmez**  
  Tamamen tarayıcınızda çalışır — token yok, OAuth yok, üçüncü parti servis yok.

- 🔄 **Virtual Scroll Uyumlu**  
  Instagram virtual scrolling kullanır (aynı anda DOM'da sadece ~10-15 mesaj bulunur). Bu script tüm sohbeti tarar ve DOM mutasyonlarını izleyerek her mesajı yakalar.

- 📅 **Kronolojik Çıktı**  
  Mesajlar eskiden yeniye doğru, doğru tarih damgalarıyla dışa aktarılır.

- 🎯 **Akıllı Gönderen Tespiti**  
  `role="presentation"` balonlarının arka plan rengini analiz ederek gönderilen/gelen mesajları ayırır (`rgb(74,93,249)` = gönderilen, `rgb(37,41,46)` = gelen).

---

## ✨ Temel Özellikler

- **Tam Sohbet Dışa Aktarımı**  
  Tüm konuşma geçmişini tarar ve her mesajı yakalar.

- **Hikaye Yanıtı Tespiti**  
  Hikaye yanıtlarını tespit eder ve etiketler (`"hikayesine yanıt verdi"`, `"hikayesine ifade bıraktı"`).

- **Reaksiyon/Beğeni Tespiti**  
  Mesajlardaki emoji reaksiyonlarını (❤️, 😂, 🔥, vb.) `aria-label` ve küçük emoji span'ları ile tespit eder.

- **Medya Etiketleri**  
  Paylaşılan içerikleri `[Görsel]`, `[Reels]` veya `[Hikaye Görseli]` olarak etiketler (`<a href>` yollarını analiz eder).

- **Tarih Çıkarma**  
  Gri renkli span'lardan Türkçe tarih formatlarını (`1 Oca 2026 00:30`, `Paz 21:14`, vb.) parse eder.

- **Otomatik İndirme**  
  Sonucu otomatik olarak `.txt` dosyası olarak indirir.

---

## 🛠️ Başlarken

### Gereksinimler
- Chromium tabanlı tarayıcı (Chrome, Edge, Brave, vb.)
- Aktif Instagram oturumu (`instagram.com` üzerinde giriş yapılmış)

### Kullanım

1. Instagram Web'de bir DM sohbeti açın:
   ```
   https://www.instagram.com/direct/t/XXXXXXXXX/
   ```

2. DevTools'u açın (`F12` veya `Ctrl+Shift+I`)

3. **Console** sekmesine gidin

4. `instadm-scraper.js` dosyasının tüm içeriğini kopyalayıp Console'a yapıştırın

5. **Enter** tuşuna basın ve bekleyin — script şunları yapacak:
   - En eski mesajlara scroll eder
   - Yavaş yavaş aşağı inerek her adımda mesajları çeker
   - Hiçbir mesajın atlanmaması için DOM değişikliklerini izler
   - Sonucu `.txt` dosyası olarak indirir

---

## 📋 Çıktı Formatı

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

## 🔧 Nasıl Çalışır — Teknik Özet

| Zorluk | Çözüm |
|---|---|
| Instagram **virtual scroll** kullanıyor — sadece görünen mesajlar DOM'da var | Adım adım kaydırır, scrap yapmadan önce DOM mutasyonlarını bekler |
| `scrollTop` **ters çevrilmiş** (0 = en alt, negatif = en üst) | En negatiften → 0'a doğru ilerler (eski → yeni) |
| `role="row"` elementleri yok | `role="presentation"` balonlarını mesaj container'ı olarak kullanır |
| Gönderilen vs. gelen tespiti | `role="presentation"` div'inin arka plan rengini analiz eder |
| Tarihler gri span'larda gizli | Renk analizi (`rgb ~140-170`) + Türkçe tarih regex'i |
| Reaksiyonlar küçük emoji span'ları | Parent zincirinde 8 seviye yukarıya kadar küçük emoji span arar |

---

## 📈 Sürüm Geçmişi

**v1.0.0**
- DOM mutasyon izleme ile tam virtual scroll desteği
- Arka plan rengi analizi ile gönderilen/gelen tespiti
- Hikaye yanıtı, reaksiyon ve medya etiketi tespiti
- Türkçe tarih formatı parse desteği
- `.txt` olarak otomatik indirme

---

## ⚠️ Sorumluluk Reddi & Gizlilik

InstaDM-Scraper **kişisel ve eğitsel amaçlarla** geliştirilmiştir.  
Bu araç yalnızca tarayıcınızda **zaten size görünür olan verileri** okur.

- ✅ Hiçbir veri harici sunucuya gönderilmez
- ✅ API çağrısı yapılmaz — her şey yerel çalışır
- ✅ Tarayıcı eklentisi gerekmez
- ⚠️ Otomatik scraping Instagram Hizmet Şartları'nı ihlal edebilir

Geliştirici, bu aracın kullanımından doğacak sonuçlardan **sorumlu değildir**.

---

## 🤝 Katkı

Katkılar memnuniyetle karşılanır.

1. Projeyi fork'layın
2. Feature branch oluşturun:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Değişiklikleri commit edin:
   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. Branch'i gönderin:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Pull Request açın

---

## 👨‍💻 Geliştirici

**Miabeyefendi**
- GitHub: [@Miabeyefendi](https://github.com/Miabeyefendi)
- Proje: **InstaDM-Scraper** (Instagram DM Scraper)

*Gizlilik için tasarlandı, sadelik için inşa edildi.*
