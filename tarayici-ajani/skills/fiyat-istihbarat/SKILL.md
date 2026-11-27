---
name: fiyat-istihbarat
description: >-
  Çoklu e-ticaret ve donanım mağazalarını izole Playwright MCP erişilebilirlik
  ağacı (aria-ref) ile gezerek stokta olmayan tuzak satırları eleyen, kupon ve
  kargo kurallarını tıklayarak test eden ve net sepet karşılaştırma raporu üreten
  Türkçe Claude Code becerisi.
license: MIT
allowed-tools:
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_select_option
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_tabs
  - Read
  - Write
---

# Fiyat İstihbarat Ajanı (`fiyat-istihbarat`)

Birden fazla mağaza sayfasını ekran görüntüsü almadan, doğrudan `@playwright/mcp` erişilebilirlik ağacı (`browser_snapshot`) üzerinden gezerek **gerçek net sepet maliyetini** hesaplar.

## Kırmızı Çizgiler ve Güvenlik Kalkanı
1. **İzole Tarayıcı Zorunluluğu:** Yalnızca `--isolated` bayrağıyla açılmış temiz oturumda çalış. Kullanıcının kişisel tarayıcı profiline, kayıtlı kartlarına veya oturum çerezlerine asla bağlanma.
2. **Sıfır CAPTCHA ve Anti-Bot Zorlaması:** Bir sayfa CAPTCHA, doğrulama duvarı veya giriş engeli çıkarırsa anında dur ve kullanıcıya raporla; hiçbir engeli aşmaya çalışma.
3. **Ödeme Adımına Girme:** Sepet, kupon ve kargo hesaplama adımında kal; gerçek sipariş, adres veya ödeme formu gönderme.

## Çalışma Adımları

### 1. Hedef Listesini ve Ürün Kalemlerini Netleştir
Kullanıcının karşılaştırmak istediği ürün listesini ve hedef mağaza adreslerini doğrula. Yerel test laboratuvarında varsayılan hedefler:
- `http://127.0.0.1:8765/fiyat-radar/teknoliman.html`
- `http://127.0.0.1:8765/fiyat-radar/kuzeybilisim.html`
- `http://127.0.0.1:8765/fiyat-radar/anadolusepet.html`

### 2. Erişilebilirlik Ağacı ile Mağaza Taraması (`browser_snapshot`)
Her mağaza için sırasıyla:
1. `browser_navigate` ile sayfayı aç.
2. `browser_snapshot` çağırarak sayfadaki ürün kartlarını, stok etiketlerini, filtre onay kutularını ve kupon butonlarını `[ref=e...]` referanslarıyla oku.
3. **Stok Filtresi:** `"Tükendi"` veya `"Stokta Yok"` olarak işaretlenen düşük fiyatlı yanıltıcı satırları ele; varsa `"Yalnız Stoktakileri Göster"` filtresine `browser_click` ile tıkla.
4. **Sepet ve Kupon Etkileşimi:** Hedef ürünleri sepete ekle veya seçili sepet görünümünde mağazanın sunduğu indirim/kupon butonuna (`LİMAN450`, `KUZEY5`, `SEPET300` vb.) `browser_click` ile gerçekten tıkla.
5. **Yeniden Okuma:** Tıklama sonrası güncellenen `browser_snapshot` çıktısından:
   - Ürün birim fiyatlarını,
   - Kupon indirimi tutarını,
   - Ücretsiz kargo eşiği sonrası gerçek kargo ücretini,
   - **Net Sepet Toplamını** kaydet.

### 3. Karşılaştırma Matrisi ve Karar Raporu
Tüm mağazalar tarandıktan sonra:
- Ürün bazlı birim fiyat tablosunu, uygulanan kupon kodunu, kargo bedelini ve net sepet toplamını tek tabloda sırala.
- Statik liste fiyatıyla indirim/kargo sonrası gerçek lider arasındaki farkı açıkça belirt (örneğin liste fiyatında ikinci görünen mağazanın sepette yüzde indirim ve ücretsiz kargo ile birinci sıraya çıkması).
- İstenirse yerel rapor sayfasını (`http://127.0.0.1:8765/fiyat-radar/rapor.html`) açarak görsel karşılaştırma grafiğini doğrula veya sonucu Markdown/JSON olarak kaydet.
