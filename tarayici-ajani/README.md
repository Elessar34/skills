# Tarayıcı Ajanı Başlangıç Paketi (`MIT`)

Claude Code ve Microsoft'un resmi açık kaynak `@playwright/mcp` (`Apache-2.0`) sunucusunu kullanarak **sıfır kodla, kişisel tarayıcı profiline dokunmadan** çalışan Türkçe tarayıcı ajanı becerileri ve yerel test laboratuvarı.

## Neden Ekran Görüntüsü Değil, Erişilebilirlik Ağacı?

Geleneksel görsel botlar her adımda tam ekran görüntüsü alıp piksellerden buton koordinatı tahmin etmeye çalışır. `@playwright/mcp` ise tarayıcının doğrudan **Erişilebilirlik Ağacını (`Accessibility Tree` / `aria-ref`)** okur:
- **Hızlı ve Hafif:** Görsel model gerektirmez, yapılandırılmış metin ağacı üzerinden çalışır.
- **Kesin (`Deterministik`):** Koordinat kayması yaşamadan doğrudan öğe referansına (`[ref=e14]`) tıklar.
- **İzole (`--isolated`):** Bellek içi geçici tarayıcı profili açar; kişisel Chrome sekmelerine, şifrelerine ve çerezlerine erişmez.

---

## 3 Dakikada Kurulum

### Gereksinimler
- **Node.js 20+** (`node -v`)
- **Claude Code CLI** (`claude -v`)
- Yerel test laboratuvarı için **Python 3.9+** (`python3 -V`)

### 1. İzole Playwright MCP Sunucusunu Ekle

Terminalde tek komutla izole modda ekle:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest --isolated
```

> **Windows (`cmd`) Notu:** Windows komut isteminde `npx` çağrısı için `claude mcp add playwright -- cmd /c npx @playwright/mcp@latest --isolated` komutunu kullanabilirsin.

Kurulumu doğrula:

```bash
claude mcp list
```

Proje klasöründe `.mcp.json` ile paylaşmak istersen hazır şablonlardan birini kopyala:

```bash
# Görünür izole masaüstü tarayıcısı (canlı izleme ve geliştirme için)
cp mcp.ornek.json .mcp.json

# Arka planda sessiz çalışan başsız profil (zamanlanmış görevler için)
cp mcp.headless.ornek.json .mcp.json
```

### 2. Türkçe Ajan Becerilerini (`Skills`) Yükle

Paketteki 3 hazır beceriyi projenin `.claude/skills/` dizinine kopyala:

```bash
mkdir -p .claude/skills
cp -R skills/* .claude/skills/
```

---

## Paketteki 3 Hazır Türkçe Beceri

| Beceri | Klasör | Ne Yapar? |
| :--- | :--- | :--- |
| **Canlı Fiyat İstihbaratı** | `skills/fiyat-istihbarat/` | Çoklu mağazaları gezer, stok dışı yanıltıcı satırları eler, kupon butonlarına tıklar ve kargo dahil en ucuz net sepeti raporlar. |
| **Öz-Denetim ve Tamir** | `skills/oz-denetim-tamir/` | Yazdığın web uygulamasını tarayıcıda açıp tıklar; DOM hesap hatalarını ve `console.error` istisnalarını yakalayıp kaynak kodu kendi onarır. |
| **Sabah Raporu Gözcüsü** | `skills/sabah-raporu/` | Teknoloji bülteni, açık kaynak sürüm panosu ve günlük görev sekmelerini tarayarak tek sayfalık yönetici özeti üretir. |

---

## Güvenlik Kalkanı Kuralları

1. **Her Zaman `--isolated` Kullan:** Kişisel tarayıcı profilini, açık oturumlarını ve kayıtlı parolalarını ajandan tamamen ayır. (`--isolated` bellek içi çalıştığı için `--user-data-dir` bayrağıyla aynı anda kullanılmaz.)
2. **Yerel Dosyaları HTTP Üzerinden Sun:** `@playwright/mcp` güvenlik gereği varsayılan olarak `file://` adreslerini engeller; yerel HTML hedeflerini her zaman `http://127.0.0.1:8765` gibi yerel bir sunucu üzerinden aç.
3. **Ödeme ve Özel Hesaplara Bağlama:** Bankacılık, kredi kartı ödeme adımı, özel mesajlaşma ve kişisel e-posta ekranlarını otomasyona açma.
4. **CAPTCHA ve Engel Duvarlarına Saygı Duy:** Anti-bot doğrulaması veya CAPTCHA içeren hedeflerde otomasyonu zorlama; yalnızca kendi yerel uygulamalarında, açık veri sayfalarında ve izinli kaynaklarda çalıştır.
5. **Alan Adı Sınırlandırması:** Yalnızca belirli adreslere erişim gereken görevlerde `--allowed-origins` ve `--blocked-origins` bayraklarıyla ağ sınırını daralt.

---

## Yerel Türkçe Test Laboratuvarı (`hedefler/`)

Dış ağa çıkmadan, sıfır CAPTCHA ile 3 gerçekçi senaryoyu kendi bilgisayarında test etmek için yerel sunucuyu başlat:

```bash
python3 hedefler/sunucu.py --port 8765
```

Açılan yerel uygulamalar:
- **Laboratuvar Ana Dizin:** `http://127.0.0.1:8765/`
- **Vitrin 1 · Fiyat Radarı (3 Donanım Mağazası + Rapor):**
  - TeknoLiman: `http://127.0.0.1:8765/fiyat-radar/teknoliman.html`
  - KuzeyBilişim: `http://127.0.0.1:8765/fiyat-radar/kuzeybilisim.html`
  - AnadoluSepet: `http://127.0.0.1:8765/fiyat-radar/anadolusepet.html`
  - Karşılaştırma Raporu: `http://127.0.0.1:8765/fiyat-radar/rapor.html`
- **Vitrin 2 · TeklifMatik (Öz-Denetim ve Tamir Hedefi):**
  - Canlı Uygulama (`hesapla.js` üzerinden): `http://127.0.0.1:8765/teklif-matik/`
  - Hatalı Simülasyon Modu: `http://127.0.0.1:8765/teklif-matik/?mod=hatali`
  - Onarılmış Doğrulama Modu: `http://127.0.0.1:8765/teklif-matik/?mod=onayli`
- **Vitrin 3 · Sabah Masası (3 Sekmeli Çalışma İstasyonu + Yönetici Özeti):**
  - 3 Sekmeli Pano: `http://127.0.0.1:8765/sabah-masasi/`
  - Sabah Yönetici Özeti: `http://127.0.0.1:8765/sabah-masasi/sabah-ozeti.html`

## Lisanslar
- Paket Kodu, Beceriler ve Yerel Uygulamalar: **MIT License** (`LICENSE`)
- Gömülü Yazı Tipleri (`hedefler/ortak/fonts/`): `Inter` ve `JetBrains Mono` — **SIL Open Font License 1.1 (`OFL-1.1`)**
- Önerilen MCP Sunucusu (`@playwright/mcp`): Microsoft Corporation — **Apache-2.0 License**
