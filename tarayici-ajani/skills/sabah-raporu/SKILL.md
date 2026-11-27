---
name: sabah-raporu
description: >-
  Sabah bülteni, açık kaynak sürüm takip panosu ve günlük görev masasını izole
  başsız tarayıcıda tarayarak tek sayfalık Türkçe yönetici özeti üreten arka plan
  otomasyon becerisi.
license: MIT
allowed-tools:
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_tabs
  - mcp__playwright__browser_wait_for
  - Read
  - Write
---

# Sabah Raporu ve Sürüm Gözcüsü (`sabah-raporu`)

Her sabah birden fazla bilgi kaynağını (teknoloji bülteni, açık kaynak paket sürümleri ve günlük görev panosu) izole ve başsız (`--isolated --headless`) tarayıcıda tarayıp gürültüsüz, tek sayfalık Türkçe yönetici özeti hazırlar.

## Güvenlik İlkeleri
- Yalnızca halka açık bültenler, açık kaynak sürüm sayfaları ve yerel/yetkili proje panoları okunur.
- Kişisel e-posta kutusu, özel mesajlaşma uygulamaları, banka hesapları veya CAPTCHA korumalı sayfalar tarama kapsamı dışındadır.
- Zamanlanmış arka plan görevlerinde salt-okunur gezinti araçları kullanılır; harici formlara veri yazılmaz.

## İş Akışı

### 1. Sekmeli Kaynak Taraması
Hedef çalışma masasını (`ör. http://127.0.0.1:8765/sabah-masasi/`) `browser_navigate` ile aç ve üç ana görünümü sırayla incele:
1. **Teknoloji Bülteni Sekmesi:** `Kritik` ve `Mimari` etiketli maddeleri süz; başlık, etki alanı ve özet notunu çıkar.
2. **Açık Kaynak Sürüm Panosu Sekmesi:** `browser_click` ile sekmeye geç; takip edilen depoların güncel sürümünü, lisans uyumluluğunu (`Apache-2.0`, `MIT`) ve kırıcı değişiklik (`Breaking Change`) uyarısını kontrol et.
3. **Günlük Görev Masası Sekmesi:** Bugün teslim edilecek öncelikli görevleri ve blokaj durumlarını listele.

### 2. Yönetici Özeti Üretimi
Toplanan verileri şişirmeden 3 net başlık altında birleştir:
- **Günün 3 Kritik Teknik Gelişmesi**
- **Sürüm ve Güvenlik Durumu**
- **Bugünün Odak Görevleri (İlk 3 Madde)**

Özeti yerel `sabah-ozeti.md` dosyasına yaz veya `http://127.0.0.1:8765/sabah-masasi/sabah-ozeti.html` ekranını doğrulayarak kullanıcıya sun.

## Başsız (`Headless`) Zamanlama Örneği (`crontab`)
Hafta içi her sabah `08:00`'de çalıştırmak için:

```bash
0 8 * * 1-5 cd /proje/klasoru && claude -p "sabah-raporu becerisini çalıştır ve özeti sabah-ozeti.md dosyasına kaydet" --allowedTools "mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,Write"
```
