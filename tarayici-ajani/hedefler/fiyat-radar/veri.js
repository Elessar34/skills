/**
 * Fiyat Radarı — 3 Mağaza Ortak Katalog, Kupon ve Kargo Hesaplama Motoru
 * Tüm fiyatlar TL cinsinden tam sayıdır; Türkçe binlik nokta biçimiyle gösterilir.
 */

const FIYAT_FORMAT = new Intl.NumberFormat('tr-TR');

function tlYaz(tutar) {
  return `${FIYAT_FORMAT.format(Math.round(tutar))} TL`;
}

const URUN_IKONLARI = {
  ssd: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 11h2M11 11h2M15 11h2M7 14h6"/></svg>`,
  monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  istasyon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="16" r="1.5"/><path d="M9 7h6M9 10h6"/></svg>`
};

const MAGAZALAR = {
  teknoliman: {
    id: 'teknoliman',
    ad: 'TeknoLiman',
    alanAdi: 'teknoliman.local',
    slogan: 'Kurumsal Donanım ve Depolama Çözümleri',
    rozetHarf: 'TL',
    kargoEsik: 50000,
    kargoUcreti: 149,
    kargoMetni: '50.000 TL üzeri ücretsiz kargo (Standart: 149 TL)',
    kupon: {
      kod: 'LIMAN450',
      etiket: 'LİMAN450',
      aciklama: '40.000 TL üzeri donanım sepetinde anında 450 TL indirim',
      tip: 'sabit',
      deger: 450
    },
    urunler: [
      {
        id: 'ssd-eski-tuzak',
        hedefAnahtar: null,
        kategori: 'NVMe M.2 Depolama',
        ad: '2TB Gen4 NVMe SSD (2024 Seri · Soğutucusuz)',
        ozellik: '5.000 MB/sn okuma · M.2 2280 · Eski üretim parti sonu',
        sku: 'TL-NVME-2024',
        fiyat: 5190,
        stokta: false,
        stokEtiketi: 'Tükendi · Stokta Yok',
        stokSinifi: 'yok',
        varsayilanSepette: false
      },
      {
        id: 'ssd',
        hedefAnahtar: 'ssd',
        kategori: 'NVMe M.2 Depolama',
        ad: '2TB Gen4 NVMe SSD',
        ozellik: '7.400 MB/sn okuma · 6.800 MB/sn yazma · Alüminyum soğutuculu M.2 2280',
        sku: 'TL-NVME-2TB-G4',
        fiyat: 6450,
        stokta: true,
        stokEtiketi: 'Stokta · Bugün Kargoda',
        stokSinifi: 'stokta',
        varsayilanSepette: true
      },
      {
        id: 'monitor',
        hedefAnahtar: 'monitor',
        kategori: 'Profesyonel Ekran',
        ad: '27" 2K IPS Monitör',
        ozellik: '2560×1440 QHD · 180 Hz · %99 sRGB · Yükseklik ve pivot ayarlı ayak',
        sku: 'TL-MON-27QHD',
        fiyat: 9850,
        stokta: true,
        stokEtiketi: 'Stokta · Merkez Depo',
        stokSinifi: 'stokta',
        varsayilanSepette: true
      },
      {
        id: 'istasyon',
        hedefAnahtar: 'istasyon',
        kategori: 'Kompakt Masaüstü Sistem',
        ad: 'Mini İş İstasyonu',
        ozellik: '16 Çekirdek İşlemci · 32 GB DDR5-5600 · 1 TB PCIe 4.0 NVMe · Çift 2.5GbE',
        sku: 'TL-WS-MINI32',
        fiyat: 28900,
        stokta: true,
        stokEtiketi: 'Son 4 Adet · Stokta',
        stokSinifi: 'sinirli',
        varsayilanSepette: true
      }
    ]
  },

  kuzeybilisim: {
    id: 'kuzeybilisim',
    ad: 'KuzeyBilişim',
    alanAdi: 'kuzeybilisim.local',
    slogan: 'İş İstasyonu, Sunucu Bileşenleri ve Geliştirici Donanımı',
    rozetHarf: 'KB',
    kargoEsik: 25000,
    kargoUcreti: 129,
    kargoMetni: '25.000 TL üzeri sigortalı kargo ücretsiz (0 TL)',
    kupon: {
      kod: 'KUZEY5',
      etiket: 'KUZEY5 · %5 İndirim',
      aciklama: 'Üçlü donanım setinde sepette net %5 kurumsal indirim (-2.270 TL)',
      tip: 'yuzde',
      deger: 5
    },
    urunler: [
      {
        id: 'ssd',
        hedefAnahtar: 'ssd',
        kategori: 'NVMe M.2 Depolama',
        ad: '2TB Gen4 NVMe SSD',
        ozellik: '7.400 MB/sn okuma · DRAM önbellekli · Grafen + alüminyum soğutucu blok',
        sku: 'KB-SSD-2048G4',
        fiyat: 6300,
        stokta: true,
        stokEtiketi: 'Stokta · Aynı Gün Çıkış',
        stokSinifi: 'stokta',
        varsayilanSepette: true
      },
      {
        id: 'monitor',
        hedefAnahtar: 'monitor',
        kategori: 'Profesyonel Ekran',
        ad: '27" 2K IPS Monitör',
        ozellik: '2560×1440 QHD · 180 Hz · Fabrika kalibrasyonlu IPS panel · USB-C / DP 1.4',
        sku: 'KB-IPS-27QHD',
        fiyat: 9600,
        stokta: true,
        stokEtiketi: 'Stokta · Aynı Gün Çıkış',
        stokSinifi: 'stokta',
        varsayilanSepette: true
      },
      {
        id: 'istasyon',
        hedefAnahtar: 'istasyon',
        kategori: 'Kompakt Masaüstü Sistem',
        ad: 'Mini İş İstasyonu',
        ozellik: '16 Çekirdek İşlemci · 32 GB DDR5 · 1 TB NVMe · Sessiz bakır soğutma',
        sku: 'KB-MINI-PRO32',
        fiyat: 29500,
        stokta: true,
        stokEtiketi: 'Stokta · Kurumsal Garanti',
        stokSinifi: 'stokta',
        varsayilanSepette: true
      }
    ]
  },

  anadolusepet: {
    id: 'anadolusepet',
    ad: 'AnadoluSepet',
    alanAdi: 'anadolusepet.local',
    slogan: 'Çok Satıcılı Teknoloji ve Ofis Ekipmanları Pazaryeri',
    rozetHarf: 'AS',
    kargoEsik: 75000,
    kargoUcreti: 249,
    kargoMetni: 'Ağır paket ve sigortalı donanım teslimatı: 249 TL',
    kupon: {
      kod: 'SEPET300',
      etiket: 'SEPET300',
      aciklama: 'Teknoloji kategorisinde sepette 300 TL kupon indirimi',
      tip: 'sabit',
      deger: 300
    },
    urunler: [
      {
        id: 'ssd',
        hedefAnahtar: 'ssd',
        kategori: 'NVMe M.2 Depolama',
        ad: '2TB Gen4 NVMe SSD',
        ozellik: '7.400 MB/sn okuma · PCIe Gen4 x4 · M.2 2280 soğutuculu modül',
        sku: 'AS-9910-SSD',
        fiyat: 6590,
        stokta: true,
        stokEtiketi: 'Stokta · 2 İş Gününde Kargoda',
        stokSinifi: 'stokta',
        varsayilanSepette: true
      },
      {
        id: 'monitor-teshir-tuzak',
        hedefAnahtar: null,
        kategori: 'Profesyonel Ekran',
        ad: '27" 2K IPS Monitör (Mağaza Teşhir Ürünü)',
        ozellik: 'Açılmış kutu · Kutu içeriği eksik · Yalnız mağazadan teslim',
        sku: 'AS-TESHIR-27',
        fiyat: 8250,
        stokta: false,
        stokEtiketi: 'Tükendi · Teşhir Kapalı',
        stokSinifi: 'yok',
        varsayilanSepette: false
      },
      {
        id: 'monitor',
        hedefAnahtar: 'monitor',
        kategori: 'Profesyonel Ekran',
        ad: '27" 2K IPS Monitör',
        ozellik: '2560×1440 QHD · 180 Hz · %99 sRGB · Ergonomik pivot stand',
        sku: 'AS-9924-MON',
        fiyat: 9490,
        stokta: true,
        stokEtiketi: 'Stokta · Yetkili Satıcı',
        stokSinifi: 'stokta',
        varsayilanSepette: true
      },
      {
        id: 'istasyon',
        hedefAnahtar: 'istasyon',
        kategori: 'Kompakt Masaüstü Sistem',
        ad: 'Mini İş İstasyonu',
        ozellik: '16 Çekirdek İşlemci · 32 GB DDR5 · 1 TB NVMe · Wi-Fi 6E + Çift LAN',
        sku: 'AS-9980-MINI',
        fiyat: 30400,
        stokta: true,
        stokEtiketi: 'Son 2 Adet · Farklı Depo',
        stokSinifi: 'sinirli',
        varsayilanSepette: true
      }
    ]
  }
};

function magazaSepetiHesapla(magazaId, seciliIds, kuponAktif) {
  const m = MAGAZALAR[magazaId];
  const seciliUrunler = m.urunler.filter((u) => u.stokta && seciliIds.includes(u.id));
  const araToplam = seciliUrunler.reduce((toplam, u) => toplam + u.fiyat, 0);

  let indirim = 0;
  if (kuponAktif && araToplam > 0) {
    if (m.kupon.tip === 'yuzde') {
      indirim = Math.round((araToplam * m.kupon.deger) / 100);
    } else {
      indirim = m.kupon.deger;
    }
  }

  const indirimSonrasi = Math.max(0, araToplam - indirim);
  const kargo = araToplam === 0 ? 0 : indirimSonrasi >= m.kargoEsik ? 0 : m.kargoUcreti;
  const netToplam = indirimSonrasi + kargo;

  return {
    magazaId,
    magazaAd: m.ad,
    seciliUrunler,
    araToplam,
    kuponKodu: kuponAktif ? m.kupon.kod : null,
    indirim,
    kargo,
    netToplam
  };
}

function magazaSayfasiBaslat(magazaId) {
  const m = MAGAZALAR[magazaId];
  if (!m) return;

  const durum = {
    yalnizStokta: false,
    kuponAktif: false,
    seciliIds: m.urunler.filter((u) => u.varsayilanSepette && u.stokta).map((u) => u.id)
  };

  // URL üzerinden ?kupon=1 veya ?stok=1 gelirse doğrudan uygula
  const params = new URLSearchParams(window.location.search);
  if (params.get('kupon') === '1') durum.kuponAktif = true;
  if (params.get('stok') === '1') durum.yalnizStokta = true;

  const urunListesiEl = document.getElementById('urunListesi');
  const chkStoktaEl = document.getElementById('chkYalnizStokta');
  const filtreSayacEl = document.getElementById('filtreSayac');
  const sepetKalemlerEl = document.getElementById('sepetKalemler');
  const sepetAdetEl = document.getElementById('sepetAdet');
  const btnKuponEl = document.getElementById('btnKuponUygula');
  const araToplamEl = document.getElementById('degerAraToplam');
  const indirimSatirEl = document.getElementById('satirIndirim');
  const indirimDegerEl = document.getElementById('degerIndirim');
  const kargoDegerEl = document.getElementById('degerKargo');
  const netToplamEl = document.getElementById('degerNetToplam');

  function ciz() {
    const gorunenUrunler = m.urunler.filter((u) => (!durum.yalnizStokta ? true : u.stokta));
    filtreSayacEl.textContent = `${gorunenUrunler.length} ürün listeleniyor`;
    chkStoktaEl.checked = durum.yalnizStokta;

    urunListesiEl.innerHTML = m.urunler
      .map((u) => {
        const secili = durum.seciliIds.includes(u.id);
        const gizliSinif = durum.yalnizStokta && !u.stokta ? 'gizli' : '';
        const tukendiSinif = !u.stokta ? 'tukendi' : '';
        const seciliSinif = secili ? 'secili' : '';
        const ikonAnahtar = u.hedefAnahtar || (u.ad.includes('SSD') ? 'ssd' : 'monitor');

        const birimIndirimli =
          durum.kuponAktif && u.stokta && m.kupon.tip === 'yuzde'
            ? Math.round(u.fiyat * (1 - m.kupon.deger / 100))
            : null;

        return `
          <article class="urun-karti ${seciliSinif} ${tukendiSinif} ${gizliSinif}" data-urun-id="${u.id}">
            <div class="urun-ikon-kutu">${URUN_IKONLARI[ikonAnahtar]}</div>
            <div>
              <div class="urun-kategori">${u.kategori}</div>
              <h2 class="urun-ad">${u.ad}</h2>
              <div class="urun-ozellikler">${u.ozellik}</div>
              <div class="urun-etiketler">
                <span class="durum-rozet ${u.stokSinifi}">${u.stokEtiketi}</span>
                <span class="sku-kod mono">Kod: ${u.sku}</span>
              </div>
            </div>
            <div class="urun-fiyat-sutun">
              ${
                birimIndirimli
                  ? `<span class="eski-fiyat num">${tlYaz(u.fiyat)}</span>
                     <span class="guncel-fiyat indirimli-vurgu num">${tlYaz(birimIndirimli)}</span>`
                  : `<span class="guncel-fiyat num">${tlYaz(u.fiyat)}</span>`
              }
              <button
                type="button"
                class="btn ${secili ? 'eklendi' : 'birincil'}"
                data-aksiyon="sepet-degistir"
                data-id="${u.id}"
                aria-pressed="${secili ? 'true' : 'false'}"
                aria-label="${u.ad} — ${ !u.stokta ? 'Stokta yok' : secili ? 'Sepette ekli' : 'Sepete ekle' }"
                ${!u.stokta ? 'disabled' : ''}
              >
                ${!u.stokta ? 'Stokta Yok' : secili ? 'Sepette Ekli ✓' : 'Sepete Ekle'}
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    const hesap = magazaSepetiHesapla(magazaId, durum.seciliIds, durum.kuponAktif);
    sepetAdetEl.textContent = `${hesap.seciliUrunler.length} kalem`;

    sepetKalemlerEl.innerHTML =
      hesap.seciliUrunler.length === 0
        ? `<div class="sepet-kalem"><span class="sepet-kalem-ad">Sepette ürün yok</span><span class="num">0 TL</span></div>`
        : hesap.seciliUrunler
            .map((u) => {
              const gosterilen =
                durum.kuponAktif && m.kupon.tip === 'yuzde'
                  ? Math.round(u.fiyat * (1 - m.kupon.deger / 100))
                  : u.fiyat;
              return `
                <div class="sepet-kalem">
                  <span class="sepet-kalem-ad">${u.ad}</span>
                  <span class="sepet-kalem-tutar num">${tlYaz(gosterilen)}</span>
                </div>
              `;
            })
            .join('');

    araToplamEl.textContent = tlYaz(hesap.araToplam);

    if (hesap.indirim > 0) {
      indirimSatirEl.style.display = 'flex';
      indirimDegerEl.textContent = `-${tlYaz(hesap.indirim)}`;
    } else {
      indirimSatirEl.style.display = 'none';
      indirimDegerEl.textContent = '0 TL';
    }

    kargoDegerEl.textContent = hesap.kargo === 0 ? '0 TL (Ücretsiz)' : tlYaz(hesap.kargo);
    netToplamEl.textContent = tlYaz(hesap.netToplam);

    if (durum.kuponAktif) {
      btnKuponEl.classList.add('aktif');
      btnKuponEl.textContent = `${m.kupon.kod} Kuponu Uygulandı (-${tlYaz(hesap.indirim)})`;
      btnKuponEl.setAttribute('aria-pressed', 'true');
    } else {
      btnKuponEl.classList.remove('aktif');
      btnKuponEl.textContent = `${m.kupon.kod} Kuponunu Uygula`;
      btnKuponEl.setAttribute('aria-pressed', 'false');
    }

    try {
      const kayit = JSON.parse(localStorage.getItem('fiyatRadarDurum') || '{}');
      kayit[magazaId] = {
        kuponAktif: durum.kuponAktif,
        yalnizStokta: durum.yalnizStokta,
        hesap
      };
      localStorage.setItem('fiyatRadarDurum', JSON.stringify(kayit));
    } catch (_) {
      // İzole modda depolama kısıtlıysa sessizce devam et
    }
  }

  chkStoktaEl.addEventListener('change', () => {
    durum.yalnizStokta = chkStoktaEl.checked;
    ciz();
  });

  btnKuponEl.addEventListener('click', () => {
    durum.kuponAktif = !durum.kuponAktif;
    ciz();
  });

  urunListesiEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-aksiyon="sepet-degistir"]');
    if (!btn) return;
    const urunId = btn.getAttribute('data-id');
    if (durum.seciliIds.includes(urunId)) {
      durum.seciliIds = durum.seciliIds.filter((x) => x !== urunId);
    } else {
      durum.seciliIds.push(urunId);
    }
    ciz();
  });

  ciz();
}

window.FIYAT_RADAR = {
  MAGAZALAR,
  tlYaz,
  magazaSepetiHesapla,
  magazaSayfasiBaslat
};
