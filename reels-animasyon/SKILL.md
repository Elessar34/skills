---
name: reels-animasyon
description: Dikey (9:16), seslendirmeli animasyon videosu üretir — Reels, TikTok, YouTube Shorts. Önce 10 özgün hikâye fikri sunar, seçilen fikre akıcı bir Türkçe anlatım metni yazar, seslendirmeyi ElevenLabs API ile üretir (ya da kullanıcının yüklediği sesi kullanır), ardından altyazılı, müzikli, efektli bitmiş bir MP4, kapak görseli ve paylaşım metni çıkarır. Karakterler, 3D sahneler, hayvanlar, müzik ve ses efektleri baştan sona kodla üretilir; video yapay zekâsı, Blender ya da kurgu programı gerekmez. "Animasyon short yap", "çizgi film videosu", "hikâye animasyonu", "animasyonlu reels", "bu seslendirmeyi animasyona çevir" isteklerinde kullan.
---

# Reels Animasyon: fikirden bitmiş MP4'e

**Stil:** İri yuvarlak kafalı, ince çizgi kollu ve bacaklı, düz 2D karakterler (kodla çizilen "karton figürler"), boyalı dokulu, renkli bir 3D dünyada dolaşır. Kalın siyah mürekkep konturlar, yumuşak gölgeler, bulanıklaşan arka plan (alan derinliği), hiç durmayan hafif kamera hareketi ve ekranın ortasında kelime kelime akan altyazı. Çıktı: 1080x1920, 30 fps, süre seslendirmeyle aynı.

## Temel ilkeler
- Hikâye, karakter tasarımı ve çekimler **her seferinde sıfırdan** kurulur. Var olan bir videoyu sahne sahne taklit etme; bilinen bir konuyu bile kendi bakış açınla anlat.
- Hayattaki gerçek kişiler karakter olmaz; marka maskotu ve logo kullanılmaz. Tarihî kişiler, üstünde isim kartı olan temsilî bir figürle canlandırılır, yüzleri birebir benzetilmez.
- Gerçek bilgi olarak sunulan her şey önce web aramasıyla teyit edilir. Kanıtı olmayan anlatılar "anlatılana göre" / "rivayete göre" diye verilir.
- Seslendirmeye dokunulmaz: kesilmez, hızlandırılmaz, kaydırılmaz. Görüntü sesin peşinden gider; her görsel vurgu, ilgili kelimeden 0–3 kare önce ekrana gelir.
- Müzik seslendirmenin yaklaşık 15 dB altında, efektler daha da altında durur. Hiçbir ses anlatımı bastırmaz.
- İlerlemeyi görev listesiyle göster. Uzun render'a başlamadan önce **kare önizleme sayfasını (kontak sayfası)** kullanıcıya gönder.
- Claude sesi dinleyemez. Zamanlama ElevenLabs'in kelime zaman damgalarından (birebir) ya da yüklenen ses + **gerçekte okunan metin** üzerinden (tahmin) yapılır. Sesi beğenip beğenmemek her zaman kullanıcının kararıdır.
- API anahtarlarını sohbete yapıştırmasını isteme, ekrana yazdırma, dosyalara kopyalama. Anahtarı kullanıcı kendi bilgisayarında bir dosyaya kendisi yazar.

## 1. Adım: Nereden başlıyoruz?
Mesaja ses dosyası eklenmişse doğrudan 4. adıma geç (metin de verildiyse onu kullan). Eklenmemişse tek bir soru sor (AskUserQuestion; yoksa düz metin): **"Hangi aşamadayız?"**
- **Seslendirme hazır** → ses dosyasını ve okunan metni iste → 4. adım.
- **Metin hazır, seslendirme yok** → metni 3. adımdaki kurallara göre toparla → 3.1 (seslendirme yolu).
- **Fikir de senaryo da lazım** → 2. adım.
Süreyi de sor. Varsayılan **25–35 saniye**; 45–60 saniye de mümkün.

## 2. Adım: 10 hikâye fikri
Tek mesajda numaralı 10 fikir sun; kullanıcı bir numara seçer ya da "başka" der. Her fikir şunları içerir:
- **Başlık:** 4–8 kelime, merak uyandıran.
- **Açılış cümlesi:** videonun ilk okunan cümlesi; inanılmaz ama gerçek bir çelişki. Örnek: "Bir mühendisin cebindeki çikolata eridi. Bugün neredeyse her mutfakta bu kazanın bir hatırası var."
- **Son dokunuş:** videoyu kapatan, ironik tek satır.
- **Ekranda neden güzel durur:** 2–3 güçlü görsel an (yıkılma, ortaya çıkma, kaçış, kalabalık).
- **Doğruluk durumu:** belgelenmiş / tartışmalı / rivayet.

Güçlü bir fikirde gözle görülen bir sebep-sonuç zinciri, sıradan bir kahraman, adım adım büyüyen bir gerilim ve son cümlede bir ters köşe bulunur. Mekân basit şekillerle kurulabilmelidir: kasaba, saray, liman, müze, laboratuvar, çöl, gemi, çiftlik. Hayvanlı hikâyeler için hazır fare, kedi, köpek, kuş, at ve balık var. 10 fikri farklı dönem ve konulara dağıt: antik çağ, Osmanlı, 1800'ler, yakın tarih, bilim, hayvanlar, icatlar, tuhaf yasalar, tesadüf buluşlar. Siyaset, kan ve gerçek bir kişiyle dalga geçmek yok.

## 3. Adım: Anlatım metni (fikir seçildikten sonra)
Yalnızca seslendirilecek metni yaz; sahne tarifi ekleme. Türkçede ortalama hız saniyede ~2,6 kelimedir: 25 sn ≈ 65 kelime, 35 sn ≈ 90 kelime, 60 sn ≈ 155 kelime. Metnin iskeleti:
1. **Açılış:** girizgâhsız, doğrudan şaşırtan gerçek.
2. **Bağlam (1–2 cümle):** ne zaman, nerede, kim; akılda kalan somut bir ayrıntı.
3. **Yükseliş (2–4 vuruş):** her vuruş bir öncekinden büyük; çevredekiler şüphelenir ya da alay eder, araya bir abartı esprisi girer.
4. **Kırılma:** "Ama..." / "Çünkü..." ile işin asıl nasıl yürüdüğü.
5. **Kapanış:** kısa, ironik; videonun son kelimeleri.
Cümleler konuşma dilinde ve kısa olsun (6–14 kelime). Sayıları yazıyla yaz ("bin dokuz yüz on bir"); seslendirme motoru da metni aynen okur. Ekranda zaten görünecek olanı tekrar anlatma. Yabancı isimleri seslendirmenin doğru okuyacağı şekilde yaz.

Kullanıcıya kopyalanabilir bir blokta metni, kelime sayısını, tahmini süreyi ve tek paragraflık görsel planı gönder. Onay gelince 3.1'e geç.

### 3.1 Seslendirme yolu (kullanıcı seçer)
Tek soru sor: **"Seslendirmeyi nasıl yapalım?"**
- **ElevenLabs API ile sen üret (önerilen)** — kelime zamanları birebir gelir, senkron en iyi olur.
- **Ben üretip yükleyeceğim** — kullanıcıya kayıt önerilerini ver (aşağıda) ve "Seslendirmeyi yükle, gerisini ben hallederim." de. Ses gelince 4. adım.

**ElevenLabs yolu** (araç: `tools/voice.py`, yalnızca standart kütüphane):
1. Önce projeyi kur (4.0), metni `script.txt`'ye yaz.
2. Anahtarı yokla: `$PY tools/voice.py --voices --lang tr`. "Anahtar bulunamadı" derse kullanıcıdan anahtarı **kendi terminalinde** şu dosyaya yazmasını iste (sohbete yapıştırmasın): `~/.reels-animasyon/.env` içine tek satır `ELEVENLABS_API_KEY=...` (anahtar: elevenlabs.io → Profile → API Keys). Ortam değişkeni `ELEVENLABS_API_KEY` de olur. Hazır deyince tekrar yokla.
3. Ses seç: listeden hikâyeye uyan 3–4 anlatıcı sesi öner (Türkçe doğrulanmış ya da kullanıcının kendi sesleri). Kullanıcı bir ses adı veya kimliği de verebilir.
4. Kısa deneme: `$PY tools/voice.py . --voice "<ad|id>" --preview --speed 1.05` → `work/preview.mp3`'ü kullanıcıya gönder. Beğenmezse ses, `--stability` (0.35–0.6), `--speed` (0.9–1.15) ya da `--style` değiştirip tekrar dene.
5. Onay gelince aynı ayarlarla tam ses: `$PY tools/voice.py . --voice "<ad|id>" --speed 1.05` → `work/voice.mp3` + `work/alignment.json` (kelime zamanları) + `work/voice_meta.json`. Varsayılan model `eleven_multilingual_v2`. Karakter sayısı kadar kredi harcar; metni tekrar tekrar üretme.
6. Kullanıcıya tam sesi gönder ve 4.1'e geç.

**Kendi yüklediği ses için kayıt önerileri:** sıcak, hikâye anlatır gibi tek bir ses; ElevenLabs'te bir anlatıcı sesi (Stability ~%45–55, hız 1.0–1.1); cümle sonlarında doğal nefes payı; arkada müzik olmadan, mp3 ya da wav. Mümkünse ElevenLabs'in "with timestamps" çıktısını da istersen zamanlama birebir olur; yoksa tahmin yapılır.

## 4. Adım: Videoyu üret
Bu noktadan sonra kesintisiz çalış. Yalnızca zamanlama çözülemezse kullanıcıya sor.

### 4.0 Kurulum (ilk kullanımda bir kez)
- Skill klasörünü bul: `find / -path "*reels-animasyon*/kit/tools/new_project.py" 2>/dev/null` → iki üst klasörü `<skill>/kit`'tir; salt okunur kabul et.
- Ortamı yokla: `python3 <skill>/kit/tools/setup.py --check`. "EKSİK VAR" derse `python3 <skill>/kit/tools/setup.py` (sistemi kirletmeden `~/.reels-animasyon/venv` kurar; numpy, Pillow, playwright, imageio-ffmpeg; Chrome yoksa Chromium indirir). Son satırdaki yolu `PY` olarak kullan: `PY=~/.reels-animasyon/venv/bin/python`.
- İlk kurulumdan sonra bir kez: `$PY <skill>/kit/tools/check.py` → 10 adımın hepsi geçerse "KİT HAZIR". Geçmezse çıktıdaki adımı düzelt.
- Proje: `$PY <skill>/kit/tools/new_project.py ~/reels-animasyon/<kisa-ad>`; sonraki tüm komutlar o klasörde çalışır. Metni `script.txt`'ye, yüklenen sesi `work/voice.mp3` (ya da .wav) olarak koy.
- GPU yoksa render CPU'da (SwiftShader) yapılır ve kare başına ~2–8 sn sürer; bu beklenen bir durumdur.

### 4.1 Zamanlama
`$PY tools/timing.py .` → `work/words.json` (her kelimenin başı/sonu) + `work/phrases.json`. Yöntem satırı "ElevenLabs zaman damgaları (birebir)" demeli; yüklenen seste "whisper" ya da "sessizlik + hece" olur. Ekrana basılan cümle parçaları (P00, P01... ve kare aralıkları) çekim planının omurgasıdır. Duraklamalar cümle sonlarına denk gelmiyorsa `script.txt`'yi gerçekte okunan metne eşitle.

### 4.2 Çekim planı (`work/PLAN.md`, kod yazmadan önce)
Her çekime tek satır: başladığı kelime, kare aralığı, mekân, ışık, kamera hareketi, karakterler (poz/ifade), nesne/hayvan, görsel efekt, ses efekti.
- İlk kare doğrudan açılış görüntüsüdür; boş ya da kararmış açılış yok.
- Kural olarak her cümle parçasına bir çekim düşer; çok kısa parçaları birleştir. Çekim süresi 1,5–4 sn.
- Her cümle ekranda karşılığını bulsun. Espriyi nesneler taşır: tabela, gazete manşeti, para çantası, damga.
- Çekim ölçeklerini sırayla değiştir: açılışta yakın plan → genel plan → ikili plan → nesneye yakın ara çekim → tepki yakın planı → finalde dönen ya da içeri giren kamera.
- Duyguyu ışıkla ver: olağan anlar `day`, gerilim ve düşüş `golden` ya da `dramatic`, açıklama anları `night` ya da `interior`. Zaman atlamaları 6 karelik beyaz flaşla yapılır.
- Kapanış cümlesinde müzik susar, kısa bir vurgu sesi (sting) gelir, kamera yavaşça içeri girer.

### 4.3 story.js yaz
**Önce `reference/api.md`'yi oku** (motor API'si: çekim tablosu, kamera hareketleri, yürüyüş, kalabalık, hazır nesne/hayvan kütüphanesi, havuz, karakterler, efektler, altyazı stilleri). Sonra `kit/example/story.js`'e bak; aynı kalıpları kullan:
- Çekimleri kelimelere bağla: `E.shots([...])` + `E.shot(f)`; içerideki olaylar `sh.w("kelime")`. Kare numarası elle yazma; ses değişse de senkron kalır.
- Kamera için `E.move / E.pan / E.orbit / E.follow`, yürüyüş için `E.walk`, kalabalık için `E.crowd`.
- Hayvan ve tekrar eden nesneler `E.P` kütüphanesinden ve havuzdan (`E.P.pool(n, "rat")`). Olmayanı basit şekillerden kur; tekrar kullanılacaksa `engine/props.js`'e ekle.
- Durağan her anda bir şey kıpırdasın (idle, göz kırpma, kuyruk, kuş, efekt).

### 4.4 Önizleme ve kadraj kontrolü (tam render'dan önce)
1. `$PY tools/render.py . check` → her 10. karede kadraj taraması (kamera nesne içinde mi, yüz kadraj dışında mı, yüzün önünde nesne var mı). Kasıtlı olmayan her uyarıyı düzelt.
2. Her çekimin ortasından ve geçişlerden kare al: `$PY tools/render.py . stills 15,60,120,...` (uyarılar karelerin yanında yazar) → `$PY tools/sheet.py stills stills/sheet.jpg`.
3. Sayfayı **gözünle incele**: yazı ters mi, kadraj boş mu, ışık okunuyor mu, hayvan/nesne seçilebiliyor mu. Düzelt, tekrar al.
4. Sayfayı kullanıcıya her çekim için tek satırlık özetle gönder ve tam render'a geç.

### 4.5 Ses (`sound.json` → `tools/audio.py`)
Efektleri `words.json`'daki kelime zamanlarına bağla (saniye). Müzik ya kodla sentezlenir (mischief, march, mystery, happy, tense, epic) ya da `"file"` ile dış bir parça (CC0 ya da üretilmiş müzik) kullanılır; ayrıntı `reference/api.md`'de. `$PY tools/audio.py .` → `out/mix.wav` ve ölçülen seviyeler. Görüntü zamanlaması değişirse sesi yeniden üret.

### 4.6 Render ve teslim
- **claude.ai / sandbox ortamında komut bitince arka plan süreçleri de kapanır.** Render'ı arka plana atma; **ön planda ve parça parça** çalıştır: her komutta ~150–250 kare → `$PY tools/render.py . frames 0-199 --resume`, ardından `200-399`, … Her parçadan sonra kısa bir ilerleme notu yaz ve **beklemeden** sonrakine geç.
- Kullanıcının kendi bilgisayarında (Claude Code) tek komut yeter: `$PY tools/render.py . frames` (yarıda kalırsa `--resume`).
- Ardından `$PY tools/finish.py . "Başlık"` → `out/<Başlık>.mp4` (-14 LUFS, H.264) + donma/siyah kare taraması + `out/qa_sheet.jpg`. QA sayfasını incele; 0,4 sn ya da daha uzun donma veya siyah kare varsa düzelt.

### 4.7 Paylaşım paketi
- **Kapak:** en güçlü anın karesini seç (genelde açılış ya da kırılma), `$PY tools/render.py . cover <kare> --title "4–7 kelimelik başlık" --sub "yer, yıl"` → `out/cover.jpg` (altyazısız, büyük başlıklı).
- **Paylaşım metni:** `out/paylasim.md` dosyasına yaz:
  - 3 başlık önerisi (merak uyandıran, 40–60 karakter).
  - Açıklama: 2–3 cümle; ilk cümle kanca, sonunda kısa bir soru. Bilginin kaynağını tek satırla belirt.
  - TikTok / Reels için 5–8 hashtag (konu + tarih/bilim gibi kategori + genel), YouTube Shorts için başlıkta #shorts ve 3 etiket.
  - Belgelenmemiş bilgi varsa açıklamada da "rivayete göre" dili korunur.
- MP4'ü, kapağı ve paylaşım metnini teslim et; her çekimde ne olduğunu birkaç satırla anlat. Ardından altyazı stili (`capStyle` ile blok altyazı), çekim değişikliği ya da listedeki bir sonraki fikri öner.

## Araçlar (özet)
`setup.py` kurulum · `check.py` uçtan uca kontrol · `new_project.py` proje · `voice.py` ElevenLabs seslendirme · `timing.py` kelime zamanları · `render.py` frames / stills / check / cover · `sheet.py` kontak sayfası · `audio.py` müzik + efekt + karışım · `finish.py` MP4 + QA.

Örnek proje: `kit/example/` (Hanoi 1902, fare kuyruğuna ödül; ~35 sn, 14 çekim). Sessiz denemek için `kit/example/words.json` dosyasını projede `work/words.json` olarak kopyala. Motor ayrıntıları ve kitin yapısı: `reference/api.md`.
