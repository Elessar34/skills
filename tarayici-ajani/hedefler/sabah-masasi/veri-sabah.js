/**
 * Sabah Masası Veri Kümesi (27 Kasım 2026 doğrulanmış açık kaynak paket bilgileriyle)
 */

window.SABAH_VERI = {
  tarihEtiketi: '27 Kasım 2026 · Cuma · 08:00 Sabah Taraması',
  bulten: [
    {
      id: 'b1',
      seviye: 'Kritik',
      kritikMi: true,
      alan: 'Tarayıcı Otomasyonu',
      baslik: 'Erişilebilirlik ağacı (aria-ref) tabanlı MCP ajanlarında deterministik tıklama standardı',
      ozet: 'Ekran görüntüsü piksellerinden koordinat tahmin etmek yerine DOM erişilebilirlik referanslarını ([ref=e12]) kullanan ajanlar, arayüz kaymalarından etkilenmeden çok daha düşük token bütçesiyle çalışıyor.',
      okumaSuresi: '3 dk okuma',
      ozeteSecili: true
    },
    {
      id: 'b2',
      seviye: 'Kritik',
      kritikMi: true,
      alan: 'İzolasyon ve Güvenlik',
      baslik: 'Bellek içi izole profil (--isolated) ile kişisel tarayıcı oturumlarını ayırma rehberi',
      ozet: 'Otonom tarayıcı araçlarını açık e-posta ve ödeme oturumlarının bulunduğu ana profil yerine geçici bellek profilinde çalıştırmak çerez sızıntısı riskini ortadan kaldırıyor.',
      okumaSuresi: '4 dk okuma',
      ozeteSecili: true
    },
    {
      id: 'b3',
      seviye: 'Mimari',
      kritikMi: true,
      alan: 'Ön Yüz Kalite Güvencesi',
      baslik: 'Kod yazan ajanlarda çalışma zamanı konsol denetimi (browser_console_messages) döngüsü',
      ozet: 'Yalnız statik tip kontrolü yapan iş akışları çalışma zamanındaki null referans ve tip dönüşümü hatalarını kaçırırken, canlı tarayıcı konsolunu okuyan öz-denetim döngüsü hataları teslimden önce kapatıyor.',
      okumaSuresi: '5 dk okuma',
      ozeteSecili: true
    },
    {
      id: 'b4',
      seviye: 'Altyapı',
      kritikMi: false,
      alan: 'Yerel Veritabanı',
      baslik: 'SQLite WAL modunda eşzamanlı okuma ve yerel telemetri günlükleme pratikleri',
      ozet: 'Tek dosyalık yerel raporlama servislerinde meşgul zaman aşımı (busy_timeout) ve senkronizasyon ayarlarıyla kilitlenme olmadan yüksek okuma hızı elde ediliyor.',
      okumaSuresi: '4 dk okuma',
      ozeteSecili: false
    }
  ],
  surumler: [
    {
      depo: 'microsoft/playwright-mcp',
      surum: 'v0.0.86',
      lisans: 'Apache-2.0',
      yildiz: '40.181',
      durum: 'Güncel · Kırıcı Değişiklik Yok',
      not: '--isolated bellek profili ve 25 çekirdek erişilebilirlik aracı aktif'
    },
    {
      depo: 'microsoft/playwright',
      surum: 'v1.65.1',
      lisans: 'Apache-2.0',
      yildiz: '101.133',
      durum: 'Güncel · Kararlı',
      not: 'Chromium, Firefox ve WebKit çoklu motor otomasyon çekirdeği'
    },
    {
      depo: 'modelcontextprotocol/servers',
      surum: '2026.11',
      lisans: 'Apache-2.0 / MIT',
      yildiz: '92.281',
      durum: 'Güncel · Referans Depo',
      not: 'Standart MCP sunucu şemaları ve güvenlik sınırları'
    },
    {
      depo: 'agentskills/agentskills',
      surum: '2026.11',
      lisans: 'Apache-2.0',
      yildiz: '27.662',
      durum: 'Güncel · Açık Standart',
      not: 'Taşınabilir SKILL.md YAML şeması ve allowed-tools izin modeli'
    },
    {
      depo: 'FFmpeg/FFmpeg',
      surum: 'v9.0.1',
      lisans: 'LGPL-2.1+',
      yildiz: '68.278',
      durum: 'Sistemde Kurulu',
      not: 'Kare dizisi birleştirme ve EBU R128 ses yüksekliği dengeleme'
    }
  ],
  gorevler: [
    {
      id: 'g1',
      baslik: 'Fiyat Radarı 3 mağaza kupon ve kargo karşılaştırma raporunu doğrula',
      modul: 'skills/fiyat-istihbarat',
      oncelik: 'Bugün Öncelikli',
      yuksekMi: true,
      tamamlandi: false
    },
    {
      id: 'g2',
      baslik: 'TeklifMatik KDV hesaplayıcısındaki string birleştirme ve null mühür hatasını onar',
      modul: 'skills/oz-denetim-tamir',
      oncelik: 'Bugün Öncelikli',
      yuksekMi: true,
      tamamlandi: false
    },
    {
      id: 'g3',
      baslik: 'Hafta içi 08:00 başsız (--headless --isolated) sabah özeti zamanlayıcısını devreye al',
      modul: 'skills/sabah-raporu',
      oncelik: 'Bugün Öncelikli',
      yuksekMi: true,
      tamamlandi: false
    },
    {
      id: 'g4',
      baslik: 'Proje .mcp.json şablonunda --blocked-origins kurallarını gözden geçir',
      modul: 'Güvenlik Kalkanı',
      oncelik: 'Planlı',
      yuksekMi: false,
      tamamlandi: true
    }
  ]
};
