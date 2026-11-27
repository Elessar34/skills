---
name: oz-denetim-tamir
description: >-
  Geliştirilen web uygulamasını izole tarayıcıda açıp gerçek kullanıcı gibi form
  dolduran, tıklayan, hem DOM çıktısını hem tarayıcı konsol hatalarını
  (browser_console_messages) yakalayıp kaynak kodu kendi tamir eden öz-denetim döngüsü.
license: MIT
allowed-tools:
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_fill_form
  - mcp__playwright__browser_select_option
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_wait_for
  - Read
  - Edit
---

# Öz-Denetim ve Kendi Hatasını Tamir Eden Kodcu (`oz-denetim-tamir`)

Yazılan veya düzenlenen bir ön yüz (HTML/JS/React/Vue) kodunu yalnız statik olarak okumakla yetinmez; tarayıcıda bizzat çalıştırır, butonlara tıklar, konsol hatalarını ve hesaplama sapmalarını yakalayıp kaynak kodu doğrulanana kadar onarır.

## 4 Adımlı Öz-Denetim Döngüsü

### Adım 1 · Aç ve Gerçek Kullanıcı Gibi Etkileşime Gir
1. Hedef yerel geliştirme adresini (`ör. http://127.0.0.1:8765/teklif-matik/`) `browser_navigate` ile aç.
2. `browser_snapshot` ile form alanlarının ve birincil aksiyon butonunun (`Teklifi Hesapla` vb.) `ref` kimliklerini al.
3. Bilinen girdilerle formu test et (örneğin Ara Toplam: `12000`, KDV: `%20` -> Beklenen KDV: `2.400 TL`, Beklenen Genel Toplam: `14.400 TL`) ve hesaplama butonuna `browser_click` ile tıkla.

### Adım 2 · Çift Katmanlı Hata Tespiti (DOM + Konsol)
Tıklamanın hemen ardından iki kontrolü birlikte yap:
1. **Mantıksal / Görsel Çıktı (`browser_snapshot`):** Ekranda görünen toplam beklenen matematiksel değere eşit mi? (`'12000' + '2400' = '120002400 TL'` gibi JavaScript metin birleştirme hatalarını veya `NaN` / `undefined` sızıntılarını yakala.)
2. **Çalışma Zamanı Konsolu (`browser_console_messages`):** Tarayıcı konsolunda `error` seviyesinde yakalanmamış bir istisna (`TypeError`, `ReferenceError` vb.) var mı kontrol et.

### Adım 3 · Cerrahi Kaynak Kod Onarımı
Tespit edilen her hata için ilgili kaynak dosyayı (`Read` ile oku, `Edit` ile onar):
- Sayısal hesaplamalarda form girdilerini açıkça `Number(...)` ile sayıya dönüştür ve `Intl.NumberFormat('tr-TR')` ile biçimlendir.
- `null` dönen DOM seçicilerini HTML'deki gerçek `id` veya `data-*` özniteliğiyle eşleştir ve güvenli kontrol (`if (el)`) ekle.

### Adım 4 · Yeniden Tıkla ve Kanıtla (Sıfır Hata Kapısı)
1. Sayfayı `browser_navigate` ile yeniden yükle.
2. Aynı test girdileriyle butona tekrar `browser_click` yap.
3. Hem `browser_snapshot` üzerinde doğru sonucu (`14.400 TL`) hem de `browser_console_messages` çıktısında **0 konsol hatası** olduğunu doğrulamadan görevi kapatma.
