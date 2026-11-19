# reels-animasyon · motor API başvurusu

`story.js` yazmadan önce bu dosyayı oku. Ölçek: 1 birim = 1 metre, karakter boyu 2,2 m, taban y = 0.
Tam çalışan örnek: `kit/example/story.js` (Hanoi 1902, 14 çekim).

## story.js iskeleti
`story.js` üç şey dışa aktarır: `meta`, `build(E)`, `frame(f, E)`. `frame` saf bir fonksiyondur: aynı `f` her zaman aynı sahneyi verir (her kareyi sıfırdan kur; bir önceki kareden kalan duruma güvenme).

```js
export const meta = { fps: 30 };   // frames: sabit kare sayısı (yoksa sesten) · tail: son kelimeden sonra sn (0.7)
                                    // captions: false · capStyle: { mode: "chunk", n: 3, hi: "#ffcf4a" }
const CUES = [["acilis"], ["sokak", "kasaba"], ["ofis", "memur"], ["final", { last: 2 }]];
let R = {};
export function build(E) {                      // bir kez çalışır
  const { S, T, P } = E;                        // S = setler, T = dokular, P = hazır nesne/hayvan
  E.shots(CUES);                                // çekimler kelimelere bağlanır
  E.ground(T.grass(), 300, 0.2);
  S.street({ len: 140 }); S.row(-60, 60, -10.6, { seed: 4 }); S.row(-60, 60, 10.6, { seed: 8, rot: Math.PI });
  R.kediler = P.pool(6, "cat", { cols: ["#e39a4a", "#5a5a6a"] });
  E.actor("satici", { shirt: "#3f6fb5", apron: "#f4efe4", hat: "fez", moustache: "#3a2a20", seed: 3 });
}
export function frame(f, E) {
  const sh = E.shot(f), { f0, f1, t } = sh, A = [], FX = [];
  let cam, light = "day";
  switch (sh.name) {
    case "acilis": {
      const yuru = E.walk(f, f0, sh.w("kasaba"), [[-1.2, 0], [0, 0]]);
      A.push({ id: "satici", pos: yuru.pos, flip: yuru.flip, st: { face: "happy", legs: yuru.legs, phase: yuru.phase, blink: E.blink(f, 1), ...E.idle(f, 1) } });
      R.kediler.place(0, 1, 0, 0.5, { dir: [-1, 0.2], run: f / 10 });
      cam = E.move(f, f0, f1, { pos: [0, 1.7, 6], look: [0, 1.4, 0], fov: 40 }, { pos: [0.5, 1.7, 4.5], look: [0, 1.5, 0], fov: 38 });
      break;
    }
    default: {  // her çekimin bir case'i olmalı; yoksa en azından kamera döndür
      A.push({ id: "satici", pos: [0, 0, 0], st: { face: "talk", arms: "present", blink: E.blink(f, 1), ...E.idle(f, 1) } });
      cam = E.orbit(f, f0, f1, { center: [0, 1.4, 0], radius: 4.5, height: 1.8, a0: -0.3, a1: 0.3 });
    }
  }
  return { cam, light, dof: { focus: [0, 1.5, 0], amount: 6 }, actors: A, fx: FX };
}
```

## Çekim tablosu ve zamanlama
- `E.shots(cues, {lead})` → `build` içinde. Her cue: `[ad]`, `[ad, "kelime"]`, `[ad, "kelime", k]` (k. geçiş, 0'dan), `[ad, {last: n}]` (sondan n. kelime), `[ad, {frame: 120}]`. Çekim, kelimeden `lead` (2) kare önce başlar; ilk çekim her zaman 0. Kelime eşleşmesi küçük harfle ve **önek** iledir ("fare" → "fareler"i de bulur; gerekirse `k` ver).
- `E.shot(f)` → `{ i, name, f0, f1, len, t, u, w(kelime, k, oran), index(ad) }`. `sh.w("para")` o kelimenin karesidir; seslendirmede yoksa çekimin `oran` (0.5) noktası.
- `E.at("kelime", k)` · `E.W(n)` (n. kelimenin karesi) · `E.talk(f, f0, f1)` (konuşan ağız 0..1) · `E.endFrame()` (son kare).
- Kare = saniye × 30. Her görsel vurgu, kelimesinden 0–3 kare önce gelsin.

## Kamera
Hepsi `{pos, look, fov, roll}` döner ve durağan anlarda hafif süzülme ekler (`{creep: 0.12}` ile ayarlanır).
- `E.camAt(f, [{f, pos, look, fov, roll}, ...], {ease, creep})` — anahtar karelerle serbest hareket.
- `E.move(f, f0, f1, from, to)` — iki konum arası (itme, çekme, yükselme). `from/to = {pos, look, fov}`.
- `E.pan(f, f0, f1, pos, look0, look1, {fov})` — yerinde dönerek bakışı kaydırma.
- `E.orbit(f, f0, f1, {center, radius, height, a0, a1, fov, lookY})` — merkez etrafında dönme (radyan; 0 = merkezin +z tarafı).
- `E.follow(f, target, {offset: [0, 0.4, 4], fov, lag, lookUp})` — `target` sabit nokta ya da `(f) => [x,y,z]`.
- `E.shake(f, f0, genlik, süre)` → `[dx,dy,dz]`; `cam.pos`'a ekle.
- Dikey kadraj dardır (4 m'de yatayda ±0,8 m). Karakterleri derinliğe diz. Genel plan 2,5–6 m yükseklik, yakın plan göz hizası (1,5–1,7 m). Kamera duvar/çatı/ağaç içinden geçmesin.

## Hareket yardımcıları
- `E.walk(f, f0, f1, [[x,z], ...], {y, run, stride, ease})` → `{ pos, legs, phase, flip, moving, dir }`. Doğrudan aktöre verilir: `{ id, pos: w.pos, flip: w.flip, st: { legs: w.legs, phase: w.phase } }`.
- `E.crowd(f, ids, {center, w, d, seed, face, arms, cheer})` → aktör yerleşimleri dizisi (`A.push(...E.crowd(...))`).
- `E.idle(f, seed)` (bob/tilt/headTilt) · `E.blink(f, seed)`.
- `E.X`: `keyed(f, [[f, v], ...], ease)`, `smooth`, `easeIn`, `easeOut`, `back`, `spring`, `span(f, f0, f1)`, `lerp`, `clamp`.

## Dünya (metre)
`E.box(w,h,d, renk|malzeme|[6 malzeme], [x,y,z], {rot, texel, parent, center, noShadow})` (y = taban) · `E.cyl(rTop,rBot,h, …, {seg, center, rot})` · `E.sphere(r, …, {scale, seg})` (konum = merkez) · `E.cone(r,h, …)` · `E.plane(w,h,mat,[x,y,z],{rot, noink})` · `E.group(parent,[x,y,z],rotY)` · `E.mat("#renk",{map, emissive, glow, transparent, opacity})` (toon) · `E.flat(...)` (ışıksız) · `E.ground(tex, boyut, tekrar, [x,y,z])` · `E.label(T.sign("YAZI",{bg,fg,sub,border,w,h,size}), w, h, [x,y,z], {parent})` · `E.cloud(x,y,z,s,seed)`.
Hareketli parçanın referansını `build` içinde sakla (`R.kapi = E.group(...)`), `frame` başında varsayılan değerine döndür, sonra çekime göre oynat.

**Dokular `T`:** planks, wood, stone, cobble, grass, dirt, sand, brick, plaster, roof, tiles(a,b,n), wallpaper(a,b,"stripe|dots|diamond"), carpet, marble, metal, water, facade({wall,win,shutter,floors,cols,door,brick,shop:{text}}), sign(text,{bg,fg,size,sub}), newspaper(başlık,{paper,date,col,picDraw}), painting("landscape|portrait"), cloud.

**Setler `S`:** building(x,z,{w,d,floors,wall,roof,rot,shop,awning,flatRoof}) · row(x0,x1,z,{seed,rot,walls,roofs}) · street({len,width,z,x}) · tree(x,z,{type:"round|pine|cypress|palm",s}) · bush · hills · mountains · clouds · lamp(x,z,{on}) · fence(x0,x1,z,{col}) · bench · room({x,w,d,h,wall,floor,window,door,night}) · window · door · table · chair · desk · shelf · crate · barrel · sack · counter · frame(x,y,z,{w,h,kind,tex}) · rug · hangLamp · signpost(x,z,"YAZI") · paper(x,y,z,tex) · car · water · boat.

## Hazır nesneler ve hayvanlar `P` (engine/props.js)
Hepsi `THREE.Group` döner; burun / ön yüz +x yönündedir. Tek kopya: `const k = E.P.cat({col}); k.position.set(...)`.
- **Hayvanlar:** `rat` (~0,5 m) · `cat` (~0,6 m) · `dog` (~0,8 m) · `bird` (~0,3 m) · `horse` (~2,2 m boy) · `fish`. Seçenek: `{col}` (+ `horse` için `mane`, `bird` için `beak`).
- **Nesneler:** `cart({col, wheel, shafts})` · `tower({h, r, col, roof, kind: "roof"|"castle"})` · `bridge({len, w, h, col})` (x ekseninde) · `gate({w, h, col, trim, text})` · `tent({w, d, h, col, stripe})` · `well({col, roof})`.
- **Havuz (çok kopya):** `R.fareler = E.P.pool(40, "rat", {cols: [...]})` ya da `E.pool(n, (i) => ...)`. Her kare başında havuzdaki her şey otomatik gizlenir; `frame` içinde `R.fareler.place(i, x, y, z, o)` ile gösterilir.
  `o`: `dir: [dx, dz]` ya da `yaw` · `s` (ölçek) · `hop` (y zıplama) · `roll` + poz: `run` (adım fazı, ör. `f / 10`), `tail: false` (kuyruksuz), `wag`, `flap` (kuş kanadı, ör. `f / 5`), `roll` (araba tekerleği, radyan).
- Havuz dışı bir nesneyi canlandırmak için: `R.at.userData.pose({ run: t / 18 })` (frame başında `pose({})` ile sıfırla).
- Kütüphanede olmayan bir şey gerekiyorsa kutu, silindir, küre ve koniden kur. Tekrar kullanılacaksa `engine/props.js`'e aynı düzende ekle.

## Karakterler
**Tanım:** `E.actor(id, spec, {h, wide})`. Kimliklere rol adı ver (`satici`, `bekci`, `mucit`), kişi adı verme.
`spec = { skin, shirt, pants, shoes, jacket, tie, dress, apron, buttons, belt, hat: tophat|bowler|fedora|cap|beret|crown|helmet|chef|hardhat|fez|police|turban|kavuk, hatCol, hatBand, hair: short|part|long|bun|spiky, hairCol, moustache, beard, glasses, wings, wingCol, wingTip, build: adult|kid|stout, seed }`. Kanatlı karakterde `wide: 2`, kanat açısı `st.flap`.
**Durum `st`:** `face`: neutral smug happy laugh grin shock angry sad nervous sly think sleep determined wow talk scared · `arms`: hang hip up shrug point wave hold holdR chin whisper cheer present facepalm cross think reach count (veya `[[üst,ön],[üst,ön]]` derece) · `legs`: stand walk run sit + `phase` · `look` (-1..1) · `blink` · `talk` (0..1) · `tilt`, `headTilt`, `bob`, `lean` · `sweat`, `blush` · `prop: {kind: paper|money|bag|phone|cup|key|coin|briefcase|letter|sign|magnifier|pen|scroll|laptop|ticket, hand: "l"|"r", text}`.
**Yerleşim:** `{ id, pos:[x,y,z], st, yaw?, flip?, scale?, roll?, tint? }` (yaw verilmezse kameraya döner; `flip: true` sağa bakar).

## Efektler `fx`
question exclaim zzz sweat idea stars burst(opt.text) puff hearts money anger lines dust sparkle skull check cross · `{kind, pos, size, t (0..1 animasyon), rot, opt}`.

## `frame` dönüş değeri
`cam` · `light`: day|golden|night|interior|dramatic ya da geçiş `["day","golden",t]` · `dof: {focus: [x,y,z]|mesafe, amount: 0–16 px, range}` · `actors` · `fx` · `flash` (0..1) · `flashCol` · `fade` (0..1) · `focusPt` (gölge merkezi) · `caption: false` · `overlay(g, w, h)` (2D çizim, ör. yer etiketi).

## Altyazı
Varsayılan: tek kelime, ekranın %65 yüksekliğinde. `meta.capStyle` ile değişir:
- `{ size: 88, y: 0.655, fill: "#ffffff", stroke: "#1d1622" }` — tek kelime stili.
- `{ mode: "chunk", n: 3, hi: "#ffcf4a" }` — 2–4 kelimelik bloklar, o an okunan kelime vurgu renginde. Bloklar noktalama işaretinde de kırılır.

## Kadraj kontrolü
`render.py stills` her kare için, `render.py check` her 10. karede şunları yazar: kamera bir kutu/silindirin içinde mi, zeminin altında mı; her aktörün yüzü kadraj dışında / kenarında mı, önünde nesne var mı, kameranın arkasında mı. Uyarı kasıtlı bir durumsa (karakter kadraja yürüyerek giriyor) yok say; değilse düzelt.

## Ses `sound.json`
```json
{"voice": "work/voice.mp3",
 "music": {"style": "mischief", "bpm": 112, "start": 0, "stop": 27.4, "sting": true, "level_db": -16},
 "sfx": [{"t": 0.2, "kind": "whoosh"}, {"t": 6.1, "kind": "cash"}, {"t": 11.3, "kind": "stamp", "gain_db": -3}]}
```
- Müzik stilleri (kodla sentez): mischief, march, mystery, happy, tense, epic.
- Dış müzik: `"music": {"file": "work/muzik.mp3", "offset": 0, "stop": 27.4, "sting": true, "level_db": -16}` (CC0 parça ya da üretilmiş müzik; süreye döngüyle uyar).
- Efektler: whoosh swish pop boing thud stamp impact crash ding bell cash coin paper click tick door footsteps splash glass magic buzz success riser sting drumroll zip typing.
- Zamanlar saniye; `words.json`'daki kelime başlangıcını kullan. `python audio.py --demo <klasör>` tüm stilleri ve efektleri dinlenebilir dosyalara yazar.

## Kitin yapısı (motoru düzenlemek için)
`engine/index.html` → `engine.js` (renderer, toon malzeme; renk → normal/derinlik → mürekkep + renk → alan derinliği → 2D katman; `renderFrame`, `checkFrame`, `renderCover`), `cast.js` (karakter ve efekt çizimi, Canvas 2D), `paint.js` (boyalı dokular), `sets.js` (setler), `props.js` (nesne ve hayvanlar). `tools/`: setup, check, new_project, voice, timing, render, sheet, audio, finish. three.js r160 `vendor/` içinde (MIT). Font: Nunito (SIL OFL).
Mürekkep konturu derinlik sıçramalarının yakın kenarına ve normal kırılmalarına çizilir; karton figürler düz normal yazar ve kendi konturunu taşır. Alan derinliği 40 örneklidir ve ön planın arkaya taşmasını engeller.
