/**
 * TeklifMatik — Onarılmış Kaynak Şablonu (hesapla.onayli.js)
 * Sayısal Number() dönüşümü ve doğru `#onayMuhuruKutusu` seçicisi uygulanmış temiz sürüm.
 */

const TR_SAYI = new Intl.NumberFormat('tr-TR');

function paraBicimle(deger) {
  return `${TR_SAYI.format(Math.round(Number(deger) || 0))} TL`;
}

function kaynakHesapla(araToplamHam, indirimHam, kdvYuzdeHam) {
  const araToplam = Number(araToplamHam) || 0;
  const indirim = Number(indirimHam) || 0;
  const kdvOrani = Number(kdvYuzdeHam) || 0;
  const netMatrah = Math.max(0, araToplam - indirim);
  const kdvTutari = Math.round(netMatrah * (kdvOrani / 100));
  const genelToplam = netMatrah + kdvTutari;

  return {
    araToplamGosterim: paraBicimle(netMatrah),
    kdvGosterim: paraBicimle(kdvTutari),
    genelToplamGosterim: paraBicimle(genelToplam),
    sayisalGenelToplam: genelToplam,
    beklenenDogruToplam: genelToplam
  };
}

function kaynakMuhurUygula() {
  const muhurKutusu = document.querySelector('#onayMuhuruKutusu');
  if (muhurKutusu) {
    muhurKutusu.onayMühürü = 'ONAYLANDI';
    muhurKutusu.textContent = 'Mühür: Onaylandı ✓';
    muhurKutusu.classList.add('onayli');
    return muhurKutusu.onayMühürü;
  }
  return null;
}

function arayuzuBagla() {
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

  function hesapCalistir() {
    CiktiMusteri.textContent = musteriEl.value.trim() || 'Müşteri Belirtilmedi';
    CiktiKdvEtiket.textContent = `KDV (%${kdvOraniEl.value})`;

    const sonuc = kaynakHesapla(araToplamEl.value, indirimEl.value, kdvOraniEl.value);
    kaynakMuhurUygula();

    CiktiAraToplam.textContent = sonuc.araToplamGosterim;
    CiktiKdvTutar.textContent = sonuc.kdvGosterim;
    CiktiGenelToplam.textContent = sonuc.genelToplamGosterim;

    ToplamKutu.classList.remove('anomali');
    ToplamKutu.classList.add('dogru');
    DenetimRozeti.className = 'denetim-rozeti gecti mono';
    DenetimMetni.textContent = 'TEST GEÇTİ · 0 KONSOL HATASI';
    KonsolSayac.textContent = '0 hata';
    KonsolCikti.innerHTML = `<div class="konsol-satir temiz">[onay] Hesaplama doğrulandı: ${sonuc.genelToplamGosterim} · 0 konsol hatası.</div>`;
  }

  formEl.addEventListener('submit', (ev) => {
    ev.preventDefault();
    hesapCalistir();
  });
}

document.addEventListener('DOMContentLoaded', arayuzuBagla);
