/**
 * TeklifMatik — Hesaplama ve Onay Mühürü Kaynak Modülü (hesapla.js)
 *
 * Not: URL'de ?mod=hatali veya ?mod=onayli verilirse simülasyon modu zorlanır.
 * URL parametresi verilmezse doğrudan aşağıdaki varsayılan kaynak mantığı çalışır.
 * Claude Code `oz-denetim-tamir` becerisi bu dosyadaki 2 hatayı yakalayıp tamir eder.
 */

const TR_SAYI = new Intl.NumberFormat('tr-TR');

function paraBicimle(deger) {
  if (typeof deger === 'number' && Number.isFinite(deger)) {
    return `${TR_SAYI.format(Math.round(deger))} TL`;
  }
  return `${deger} TL`;
}

/**
 * Varsayılan Kaynak Fonksiyonu (Hatalı Başlangıç Sürümü):
 * 1) `araToplamHam` input.value üzerinden string ('12000') gelir; `kdvTutari` string'e
 *    çevrilip `+` ile birleştirildiği için '12000' + '2400' = '120002400' üretir!
 * 2) `#olmayanMuhurAlani` seçicisi DOM'da bulunmadığı için `null.onayMühürü` okuması
 *    gerçek `TypeError: Cannot read properties of null (reading 'onayMühürü')` fırlatır!
 */
function kaynakHesapla(araToplamHam, indirimHam, kdvYuzdeHam) {
  const indirim = Number(indirimHam) || 0;
  const netMatrahStr = String(Number(araToplamHam) - indirim); // '12000'
  const kdvTutariStr = String(Math.round(Number(netMatrahStr) * (Number(kdvYuzdeHam) / 100))); // '2400'

  // HATA 1: Sayısal toplama yerine JS string birleştirme ('12000' + '2400' = '120002400')
  const genelToplamYanlis = netMatrahStr + kdvTutariStr;

  return {
    araToplamGosterim: paraBicimle(Number(netMatrahStr)),
    kdvGosterim: paraBicimle(Number(kdvTutariStr)),
    genelToplamGosterim: `${genelToplamYanlis} TL`,
    sayisalGenelToplam: Number(genelToplamYanlis),
    beklenenDogruToplam: Number(netMatrahStr) + Number(kdvTutariStr)
  };
}

function kaynakMuhurUygula() {
  // HATA 2: HTML'de gerçek id "#onayMuhuruKutusu" iken yanlış seçici null döndürür
  const muhurKutusu = document.querySelector('#olmayanMuhurAlani');
  const mevcutMuhur = muhurKutusu.onayMühürü;
  return mevcutMuhur;
}

/* Onarılmış Referans Fonksiyonu (?mod=onayli parametresi için yerleşik doğrulama) */
function onayliHesapla(araToplamHam, indirimHam, kdvYuzdeHam) {
  const araToplam = Number(araToplamHam) || 0;
  const indirim = Number(indirimHam) || 0;
  const kdvOrani = Number(kdvYuzdeHam) || 0;
  const netMatrah = Math.max(0, araToplam - indirim);
  const kdvTutari = Math.round(netMatrah * (kdvOrani / 100));
  const genelToplam = netMatrah + kdvTutari;

  const muhurKutusu = document.querySelector('#onayMuhuruKutusu');
  if (muhurKutusu) {
    muhurKutusu.dataset.onayMuhuru = 'DOGRULANDI';
    muhurKutusu.textContent = 'Mühür: Onaylandı ✓';
    muhurKutusu.classList.add('onayli');
  }

  return {
    araToplamGosterim: paraBicimle(netMatrah),
    kdvGosterim: paraBicimle(kdvTutari),
    genelToplamGosterim: paraBicimle(genelToplam),
    sayisalGenelToplam: genelToplam,
    beklenenDogruToplam: genelToplam
  };
}

function arayuzuBagla() {
  const params = new URLSearchParams(window.location.search);
  const zorlananMod = params.get('mod'); // 'hatali' | 'onayli' | null

  // Üst menü aktif sekme vurgusu
  document.querySelectorAll('[data-mod-link]').forEach((el) => {
    const m = el.getAttribute('data-mod-link');
    if ((zorlananMod === 'hatali' && m === 'hatali') ||
        (zorlananMod === 'onayli' && m === 'onayli') ||
        (!zorlananMod && m === 'canli')) {
      el.classList.add('aktif');
    }
  });

  const formEl = document.getElementById('teklifFormu');
  const musteriEl = document.getElementById('musteriAdi');
  const araToplamEl = document.getElementById('araToplam');
  const indirimEl = document.getElementById('indirimTutari');
  const kdvOraniEl = document.getElementById('kdvOrani');

  const CiktiMusteri = document.getElementById('ciktiMusteri');
  const CiktiAraToplam = document.getElementById('ciktiAraToplam');
  const CiktiKdvEtiket = document.getElementById('ciktiKdvEtiket');
  const CiktiKdvTutar = document.getElementById('ciktiKdvTutar');
  const CiktiGenelToplam = document.getElementById('ciktiGenelToplam');
  const ToplamKutu = document.getElementById('toplamKutu');
  const DenetimRozeti = document.getElementById('denetimRozeti');
  const DenetimMetni = document.getElementById('denetimMetni');
  const KonsolCikti = document.getElementById('konsolCikti');
  const KonsolSayac = document.getElementById('konsolSayac');
  const MuhurKutusu = document.getElementById('onayMuhuruKutusu');

  function hesapCalistir() {
    CiktiMusteri.textContent = musteriEl.value.trim() || 'Müşteri Belirtilmedi';
    CiktiKdvEtiket.textContent = `KDV (%${kdvOraniEl.value})`;

    MuhurKutusu.classList.remove('onayli');
    MuhurKutusu.textContent = 'Mühür Bekleniyor';

    const calisacakOnayliMi = zorlananMod === 'onayli';

    const sonuc = calisacakOnayliMi
      ? onayliHesapla(araToplamEl.value, indirimEl.value, kdvOraniEl.value)
      : kaynakHesapla(araToplamEl.value, indirimEl.value, kdvOraniEl.value);

    CiktiAraToplam.textContent = sonuc.araToplamGosterim;
    CiktiKdvTutar.textContent = sonuc.kdvGosterim;
    CiktiGenelToplam.textContent = sonuc.genelToplamGosterim;

    let yakalananHata = null;
    if (!calisacakOnayliMi) {
      try {
        kaynakMuhurUygula();
      } catch (err) {
        yakalananHata = err;
        // Gerçek tarayıcı konsoluna ve sayfa hata akışına düşür (Playwright browser_console_messages yakalar!)
        console.error(err);
        setTimeout(() => {
          throw err;
        }, 0);
      }
    }

    const matematikDogruMu = sonuc.sayisalGenelToplam === sonuc.beklenenDogruToplam;

    if (!yakalananHata && matematikDogruMu) {
      ToplamKutu.classList.remove('anomali');
      ToplamKutu.classList.add('dogru');
      DenetimRozeti.className = 'denetim-rozeti gecti mono';
      DenetimMetni.textContent = 'TEST GEÇTİ · 0 KONSOL HATASI';
      KonsolSayac.textContent = '0 hata';
      KonsolCikti.innerHTML = `<div class="konsol-satir temiz">[onay] Hesaplama doğrulandı: ${sonuc.genelToplamGosterim} · 0 konsol hatası.</div>`;
    } else {
      ToplamKutu.classList.remove('dogru');
      ToplamKutu.classList.add('anomali');
      DenetimRozeti.className = 'denetim-rozeti hatali mono';
      DenetimMetni.textContent = 'HATA ALGILANDI · 1 KONSOL HATASI';
      KonsolSayac.textContent = '1 hata';
      const hataMesaji = yakalananHata
        ? `${yakalananHata.name}: ${yakalananHata.message}`
        : `Mantık Hatası: Beklenen ${paraBicimle(sonuc.beklenenDogruToplam)}, üretilen ${sonuc.genelToplamGosterim}`;
      KonsolCikti.innerHTML = `
        <div class="konsol-satir hata">[error] ${hataMesaji}</div>
        <div class="konsol-satir hata">[uyarı] Metin birleştirme sapması: '${araToplamEl.value}' + '${Math.round(Number(araToplamEl.value) * (Number(kdvOraniEl.value) / 100))}' -> '${sonuc.genelToplamGosterim}'</div>
      `;
    }
  }

  formEl.addEventListener('submit', (ev) => {
    ev.preventDefault();
    hesapCalistir();
  });

  // ?otomatik=1 veya ?mod=onayli / ?mod=hatali ile açıldığında ilk durumu gösterme seçeneği:
  if (params.get('otomatik') === '1' || zorlananMod === 'onayli') {
    hesapCalistir();
  }
}

document.addEventListener('DOMContentLoaded', arayuzuBagla);
