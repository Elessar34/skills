// Örnek hikâye: Hanoi, 1902 — kuyruk başına ödül ve fare çiftlikleri. reels-animasyon (~35 sn, 14 çekim).
// Çekimler sabit kare numarasına değil, seslendirmedeki kelimelere bağlıdır (E.shots + E.shot). Aynı metni
// kendi sesinle okursan çekimler kendiliğinden yerine oturur. Aktör kimlikleri rol adıdır.
// Fareler, kuşlar ve at arabası hazır kütüphaneden gelir (E.P), havuzla gösterilir (her kare başı otomatik gizlenir).
export const meta = { fps: 30 };

// mekânlar x ekseninde ayrı noktalara kurulur: ofis 0, sokak 200, kanalizasyon -200, çiftlik 600
const SX = 200, WX = -200, FX = 600;
const COUNTER_TOP = 1.18;

// çekim → başladığı kelime: [ad], [ad, "kelime"], [ad, "kelime", kaçıncı geçiş], [ad, { last: 2 }] = son iki kelime
const CUES = [
  ["hook"], ["teaser", "sonunda"], ["city", "hanoi"], ["sewer", "şehrin", 0], ["bounty", "yönetim"],
  ["pile", "masalara"], ["happy", "memurlar"], ["street", "sonra"], ["reason", "çünkü"], ["cut", "kuyruğunu"],
  ["breed", "yaşayan"], ["farm", "şehrin", 1], ["cancel", "ödül", 1], ["final", { last: 2 }],
];
let R = {}, PILE = [];
// i. fareyi göster (havuzdan); o = { dir | yaw, s, hop, tail, run }
const rat = (i, x, y, z, o = {}) => R.rats.place(i, x, y, z, o);
const hop = (f, i, k = 1) => Math.abs(Math.sin(f * 0.55 + i * 1.7)) * 0.05 * k;
const seeded = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// yer etiketi: üstte ortalı krem kart + sarı yıl hapı
const placeTag = (title, sub, a) => (g, w) => {
  if (a <= 0) return;
  const k = w / 1080, cx = w / 2, y = 300 * k;
  g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * -30 * k);
  g.font = `900 ${92 * k}px ReelsFont, Nunito, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  const bw = g.measureText(title).width + 130 * k;
  g.fillStyle = "#fbf3dc"; g.strokeStyle = "#241c26"; g.lineWidth = 9 * k;
  g.beginPath(); g.roundRect(cx - bw / 2, y - 72 * k, bw, 144 * k, 34 * k); g.fill(); g.stroke();
  g.fillStyle = "#241c26"; g.fillText(title, cx, y + 4 * k);
  g.font = `900 ${52 * k}px ReelsFont, Nunito, sans-serif`;
  const sw = g.measureText(sub).width + 70 * k;
  g.fillStyle = "#ffcf4a"; g.beginPath(); g.roundRect(cx - sw / 2, y + 88 * k, sw, 76 * k, 38 * k); g.fill(); g.stroke();
  g.fillStyle = "#241c26"; g.fillText(sub, cx, y + 128 * k);
  g.restore();
};

// ---------- dünya ----------
export function build(E) {
  const { S, T } = E;

  E.shots(CUES);  // çekim başlangıçları seslendirmeden hesaplanır

  // ---- belediye ofisi (x = 0) ----
  S.room({ w: 10, d: 8, h: 4.2, wall: T.wallpaper("#e9d9a8", "#dccb94", "stripe"), floor: T.tiles("#e9e0cc", "#b9ae96", 8), floorRep: 0.3 });
  S.counter(0, -1.0, { w: 4, col: "#6b4428", top: "#d9cbb3" });
  E.label(T.sign("ÖDÜL MASASI", { bg: "#2f5f8a", fg: "#ffffff", border: null, size: 130 }), 1.7, 0.42, [0.7, 0.68, -0.53]);
  S.shelf(3.9, -3.6, { seed: 7 }); S.hangLamp(-0.6, 4.2, -1.0, { col: "#2f4a3a" }); S.chair(2.4, -2.6, { col: "#6b4428" });
  R.poster = E.label(T.sign("HER KUYRUK\n1 SENT", { bg: "#f3eedf", fg: "#2b2633", border: "#b8262e", w: 768, h: 1024, size: 150, sub: "belediye duyurusu", subSize: 54 }), 1.25, 1.66, [-1.5, 2.35, -3.96]);
  R.stamp = E.label(T.sign("İPTAL", { bg: "#fbe9e9", fg: "#c0262e", border: "#c0262e", size: 220 }), 1.35, 0.5, [-1.5, 2.3, -3.92]);
  R.stamp.rotation.z = 0.28;
  const tailMat = E.mat("#e3a3a3"), rnd = seeded(11);
  for (let i = 0; i < 140; i++) {
    const a = rnd() * Math.PI * 2, rr = 0.5 * Math.sqrt(rnd()), h = (0.34 * (1 - rr / 0.5) + 0.02) * rnd();
    PILE.push(E.cyl(0.012, 0.024, 0.42, tailMat, [-0.65 + Math.cos(a) * rr * 1.3, COUNTER_TOP + 0.03 + h, -1.0 + Math.sin(a) * rr * 0.75], { center: true, seg: 6, rot: [0, rnd() * Math.PI, Math.PI / 2] }));
  }
  PILE.sort((p, q) => p.position.y - q.position.y);
  R.dropTail = E.cyl(0.012, 0.024, 0.42, tailMat, [0, 0, 0], { center: true, seg: 6 });

  // ---- Hanoi sokağı (x = 200) ----
  E.ground(T.grass("#86b860"), 300, 0.2, [SX, -0.03, 0]);
  S.street({ x: SX, len: 150, width: 8 });
  const walls = ["#f2d27a", "#f0c38a", "#e9e0c8", "#cfe0c8", "#f6e2a8"], roofs = ["#a8483a", "#7a4a3a", "#8a5a3a"];
  S.row(SX - 70, SX + 70, -10.6, { seed: 5, walls, roofs }); S.row(SX - 70, SX + 70, 10.6, { seed: 9, rot: Math.PI, walls, roofs });
  for (const x of [-12, -4, 6, 14]) S.tree(SX + x, -6.3, { s: 0.9, col: "#4f8e3f" });
  for (const x of [-8, 1, 10]) S.lamp(SX + x, -6.2, { on: true });
  S.bench(SX + 3.5, -6.5);

  // ---- kanalizasyon (x = -200), tünel -z yönünde uzanır ----
  const L = 36, zc = -13, stone = E.mat("#8c8478", { map: T.stone("#8c8478") }), brick = E.mat("#8a5a4a", { map: T.brick("#8a5a4a") });
  E.box(1.7, 0.05, L, E.mat("#2e3b34"), [WX, 0, zc]);
  const water = E.plane(1.6, L, E.mat("#3f6f66", { map: T.water("#3f6f66") }), [WX, 0.1, zc], { rot: [-Math.PI / 2, 0, 0] }); water.castShadow = false;
  for (const s of [-1, 1]) {
    E.box(1.3, 0.45, L, stone, [WX + s * 1.45, 0, zc], { texel: 0.6 });
    E.box(0.3, 3.4, L, brick, [WX + s * 2.25, 0, zc], { texel: 0.5 }).castShadow = false;
    E.cyl(0.08, 0.08, L, E.mat("#5a6a6a"), [WX + s * 1.95, 2.9, zc], { center: true, seg: 10, rot: [Math.PI / 2, 0, 0] });
    for (const z of [-2, -9, -16, -23]) { E.box(0.3, 0.08, 0.08, E.mat("#2b2f3a"), [WX + s * 2.0, 2.45, z]); E.sphere(0.13, E.mat("#fff3c4", { emissive: "#ffd27a", glow: 1.6 }), [WX + s * 1.9, 2.4, z]); }
  }
  E.box(4.8, 0.3, L, brick, [WX, 3.4, zc]).castShadow = false;
  E.box(4.8, 3.4, 0.3, E.mat("#2a2228"), [WX, 0, zc - L / 2]);
  E.box(3.2, 0.12, 0.12, E.mat("#2b2f3a"), [WX, 3.2, -7]);
  E.label(T.sign("ŞEHİR MERKEZİ\n2 KM", { bg: "#2f7a4a", fg: "#ffffff", border: "#ffffff", size: 120 }), 1.9, 0.72, [WX, 2.75, -7]);

  // ---- çiftlik (x = 600) ----
  E.ground(T.grass("#9cc46a"), 260, 0.2, [FX, -0.03, 0]);
  const wood = "#b08a5a";
  const pen = (x0, x1, z0, z1) => {
    S.fence(x0, x1, z1, { col: wood }); S.fence(x0, x1, z0, { col: wood });
    for (const x of [x0, x1]) { for (let z = z0; z <= z1; z += 0.6) E.box(0.12, 1, 0.06, E.mat(wood), [x, 0, z]); for (const y of [0.35, 0.75]) E.box(0.06, 0.1, z1 - z0, E.mat(wood), [x, y, (z0 + z1) / 2]); }
    E.plane(x1 - x0, z1 - z0, E.mat("#d9bf8f", { map: T.dirt("#d9bf8f") }), [(x0 + x1) / 2, 0.015, (z0 + z1) / 2], { rot: [-Math.PI / 2, 0, 0] }).castShadow = false;
  };
  pen(FX - 3, FX + 3, -5.4, -0.6); pen(FX + 4.5, FX + 9.5, -9, -4.2);
  S.building(FX - 7, -8, { w: 5, d: 4, floors: 1, fh: 3, wall: "#b98a5a", roof: "#7a4a3a", chimney: false, shutter: "#6b4428", cols: 2 });
  S.crate(FX + 3.8, -0.2); S.crate(FX + 4.7, 0.4, 0.8, 0.4); S.barrel(FX - 3.9, -2.2); S.sack(FX + 3.7, 1.1); S.sack(FX + 4.3, 1.4, 0.8);
  S.signpost(FX - 3.9, -0.1, "TAZE KUYRUK", { w: 1.7, bg: "#f3eedf", border: "#6b4428" });
  S.tree(FX - 12, -14, { s: 1.3 }); S.tree(FX + 14, -16, { s: 1.4 }); S.tree(FX + 6, -21, { type: "palm", s: 1.2 }); S.bush(FX - 6, -4, 1.1); S.bush(FX + 11, -3, 1);
  for (const [x, z, r] of [[-60, -95, 34], [-5, -110, 42], [55, -100, 36]]) { const m = E.sphere(r, E.mat("#7fae5f"), [FX + x, -12, z], { seg: 20, scale: [1, 0.45, 1] }); m.castShadow = false; }
  for (const [x, y, z, s, k] of [[-30, 46, -120, 1.8, 2], [25, 52, -130, 2.1, 4], [70, 44, -115, 1.6, 6]]) E.cloud(FX + x, y, z, s, k);

  // ---- fareler (havuz) ----
  R.rats = E.P.pool(44, "rat", { cols: ["#8f8a84", "#7d7670", "#a19a92"] });
  R.birds = E.P.pool(4, "bird", { cols: ["#4a6fa8", "#5a5a6a"] });
  // şehir sokağında at arabası (kütüphaneden)
  R.horse = E.P.horse({}); R.horse.position.set(SX + 2.6, 0, -2.2);
  R.cart = E.P.cart({}); R.cart.position.set(SX + 0.1, 0, -2.2);

  // ---- karakterler ----
  E.actor("memur", { shirt: "#f4f1ea", jacket: "#efe9da", pants: "#e4dcc6", buttons: "#e8c45a", hat: "helmet", hatCol: "#efe3c2", moustache: "#5a3a2a", glasses: true, build: "stout", seed: 12, skin: "#f6dcc0" });
  E.actor("memur2", { shirt: "#f4f1ea", jacket: "#dfe6ee", tie: "#2f5f8a", hair: "part", hairCol: "#7a4a2a", seed: 18, skin: "#f0d0b0" });
  const av = (shirt, hat, seed, skin) => ({ shirt, pants: "#3b3f52", hat, hatCol: "#3a3f4a", seed, skin });
  E.actor("avci", av("#4e6b5a", "cap", 23, "#e2b98f"));
  E.actor("avci2", av("#8a5a3a", null, 27, "#d9a878")); E.actor("avci3", av("#3f5f8a", "beret", 29, "#c98f66")); E.actor("avci4", av("#7a6a3a", "cap", 31, "#e9c3a0"));
  E.actor("ciftci", { shirt: "#8c6a3a", apron: "#c9b48a", hat: "cap", hatCol: "#6b4428", seed: 33, skin: "#d9a878" });
  E.actor("yaya", { shirt: "#a8343e", dress: "#a8343e", hair: "bun", hairCol: "#2a1d16", seed: 41, skin: "#e9c3a0" });
  const coats = ["#3f6fb5", "#c2843a", "#5d7a3a", "#8c3b4a", "#2f5f6a", "#e9e0c8"];
  for (let i = 0; i < 6; i++) E.actor("c" + i, { shirt: coats[i], dress: i % 3 === 1 ? coats[(i + 2) % 6] : null, hair: i % 3 === 1 ? "long" : "short", hairCol: ["#2a1d16", "#4a2e1e"][i % 2], hat: [null, null, "fedora", null, "cap", "bowler"][i], seed: 60 + i * 7, skin: ["#f6dcc0", "#e9c3a0", "#d9a878", "#c98f66"][i % 4] });
}

// ---------- kare ----------
export function frame(f, E) {
  const X = E.X, sh = E.shot(f), { i, f0, f1, t, len } = sh;
  const w = sh.w;  // w("kelime") → o kelimenin karesi (bulunamazsa çekim içinde orana göre tahmin)
  const st = (seed, o = {}) => ({ blink: E.blink(f, seed), ...E.idle(f, seed), ...o });
  const flashIn = (fa, n = 6) => Math.max(0, 1 - Math.abs(f - fa) / n);
  const A = [], FX_ = [];
  let cam, light = "interior", dof = { focus: 4, amount: 0 }, flash = 0, overlay = null, focusPt = null;

  // varsayılanlar: her kare sıfırdan kurulur (frame saf kalır); havuzlar zaten her kare gizlenir
  const idx = sh.index;
  R.horse.position.x = SX + 2.6; R.cart.position.x = SX + 0.1; R.horse.userData.pose({}); R.cart.userData.pose({});
  const posterF = w("ödül", 0, 0);
  R.poster.visible = f >= posterF - 4; R.poster.scale.setScalar(X.back(X.span(f, posterF - 4, posterF + 8)) || 0.001);
  R.stamp.visible = i >= idx("cancel"); R.stamp.scale.setScalar(1);
  R.dropTail.visible = false;
  const pileN = i < idx("pile") ? 8 : i > idx("pile") ? PILE.length : Math.round(8 + (PILE.length - 8) * X.easeOut(t / len));
  PILE.forEach((p, k) => (p.visible = k < pileN));

  switch (sh.name) {
    case "hook": { // tezgâha bir kuyruk düşer, memur parayı uzatır
      const land = w("kuyruğuna", 0, 0.55), pay = w("para", 0, 0.75), fall = X.easeIn(X.span(f, land - 14, land));
      R.dropTail.visible = true; R.dropTail.position.set(-0.05, 2.3 - (2.3 - COUNTER_TOP - 0.03) * fall, -0.75);
      R.dropTail.rotation.set(0, 0.6 + (1 - fall) * 3, f < land ? 0.4 + (1 - fall) * 2 : Math.PI / 2);
      A.push({ id: "avci", pos: [-0.45, 0, -0.05], st: st(2, { face: f < land ? "grin" : "smug", arms: f < land ? "hold" : "hip", look: 0.5 }) });
      A.push({ id: "memur", pos: [0.45, 0, -1.95], st: st(3, { face: f < pay ? "think" : "happy", arms: f < pay ? "chin" : "present", look: -0.5, prop: f >= pay ? { kind: "coin", hand: "r" } : null }) });
      if (f >= land && f < land + 20) FX_.push({ kind: "dust", pos: [-0.05, 1.35, -0.65], size: 0.6, t: (f - land) / 20 });
      if (f >= pay) FX_.push({ kind: "money", pos: [0.3, 2.9, -1.4], size: 0.9, t: X.span(f, pay, pay + 30) });
      cam = E.camAt(f, [{ f: f0, pos: [0.05, 1.8, 3.3], look: [0.0, 1.55, -1.1], fov: 42 }, { f: f1, pos: [0.05, 1.95, 4.2], look: [0.0, 1.6, -1.2], fov: 44 }]);
      dof = { focus: [-0.05, 1.3, -0.8], amount: 5 };
      break;
    }
    case "teaser": { // zaman atlaması: kentin dışında fare yetiştiren biri
      light = "day"; flash = flashIn(f0, 6);
      for (let k = 0; k < 14; k++) { const r = seeded(100 + k); const x = FX - 2.4 + r() * 4.8, z = -5 + r() * 4, dir = [Math.cos(f * 0.02 + k), Math.sin(f * 0.02 + k)]; rat(k, x + Math.sin(f * 0.05 + k) * 0.3, 0, z, { dir, hop: hop(f, k, 0.6) }); }
      A.push({ id: "ciftci", pos: [FX + 0.9, 0, 0.3], st: st(4, { face: "smug", arms: "present", look: -0.6 }) });
      FX_.push({ kind: "hearts", pos: [FX - 0.6, 1.3, -2.8], size: 0.8, t: t / 40 });
      cam = E.camAt(f, [{ f: f0, pos: [FX + 1.6, 2.7, 5.2], look: [FX, 0.8, -2.5], fov: 44 }, { f: f1, pos: [FX + 0.9, 2.2, 3.8], look: [FX, 0.9, -2.3], fov: 44 }]);
      dof = { focus: [FX + 0.6, 1.2, 0], amount: 4 }; focusPt = [FX, 0, -2];
      break;
    }
    case "city": { // açılış: Hanoi sokağı
      light = "day";
      for (let k = 0; k < 6; k++) { const dir = k % 2 ? 1 : -1, ph = t / 30 + k * 0.6; A.push({ id: "c" + k, pos: [SX - 5 + k * 2.2 + ph * 0.9 * dir, 0.2, -5.0 - (k % 3) * 0.55], st: st(10 + k, { legs: "walk", phase: ph * 1.6, face: ["happy", "neutral", "smug", "talk", "happy", "think"][k] }), flip: dir > 0 }); }
      const rx = X.keyed(f, [[f0 + 6, -2.5], [f1, 2.5]], (v) => v); rat(0, SX + rx, 0, 1.2 - rx * 0.4, { dir: [1, -0.4], hop: hop(f, 0), s: 1.3 });
      // at arabası yavaşça ilerler, kuşlar gökte geçer (hazır kütüphane + havuz)
      const dx = t * 0.03; R.horse.position.x = SX + 2.6 + dx; R.cart.position.x = SX + 0.1 + dx;
      R.horse.userData.pose({ run: t / 18 }); R.cart.userData.pose({ roll: dx / 0.45 });
      for (let k = 0; k < 3; k++) R.birds.place(k, SX - 5 + ((t * 0.07 + k * 2.6) % 12), 6.2 + k * 0.7 + Math.sin(f * 0.1 + k) * 0.2, -4 - k * 1.5, { dir: [1, 0], flap: f / 5 + k * 0.3, s: 1.8 });
      overlay = placeTag("Hanoi", "1902", X.easeOut(X.span(f, f0 + 2, f0 + 14)));
      cam = E.camAt(f, [{ f: f0, pos: [SX - 4.5, 4.2, 5.4], look: [SX + 1.5, 2.0, -7], fov: 54 }, { f: f1, pos: [SX - 2.5, 3.4, 4.6], look: [SX + 1.2, 1.9, -7], fov: 52 }]);
      dof = { focus: 9, amount: 2 }; focusPt = [SX, 0, -3];
      break;
    }
    case "sewer": { // kanalizasyon: farelerin otobanı
      light = ["night", "interior", 0.35];
      for (let k = 0; k < 22; k++) {
        const lane = [-1.45, 1.45, 0][k % 3], y = lane ? 0.45 : 0.06, z = -28 + ((f * 0.09 + k * 1.37) % 30);
        rat(k, WX + lane + Math.sin(k * 3.1) * 0.25, y, z, { dir: [0, 1], hop: lane ? hop(f, k) : 0.01 * Math.sin(f * 0.3 + k) });
      }
      FX_.push({ kind: "lines", pos: [WX - 0.5, 1.2, -1.5], size: 0.9, t: 0 }, { kind: "lines", pos: [WX + 0.6, 1.0, -2.5], size: 0.8, t: 0 });
      cam = E.camAt(f, [{ f: f0, pos: [WX, 1.35, 2.4], look: [WX, 1.1, -12], fov: 50 }, { f: f1, pos: [WX, 1.25, 0.6], look: [WX, 1.0, -12], fov: 48 }]);
      dof = { focus: 5, amount: 5, range: 3 }; focusPt = [WX, 0, -6];
      break;
    }
    case "bounty": { // duyuru: her kuyruğa bir sent
      const sent = w("sent", 0, 0.9);
      A.push({ id: "memur", pos: [-0.35, 0, -2.4], st: st(3, { face: f < sent ? "smug" : "happy", arms: f < sent ? "present" : "point", look: -0.6 }) });
      if (f >= sent) FX_.push({ kind: "money", pos: [-1.5, 3.5, -3.6], size: 0.8, t: X.span(f, sent, sent + 30) });
      cam = E.camAt(f, [{ f: f0, pos: [-0.6, 2.0, 2.3], look: [-0.95, 2.05, -3], fov: 44 }, { f: f1, pos: [-0.75, 2.05, 1.5], look: [-1.0, 2.1, -3], fov: 42 }]);
      dof = { focus: [-0.9, 2.0, -3.0], amount: 4 };
      break;
    }
    case "pile": { // tezgâhta kuyruk yığını büyür, avcılar kuyrukta
      const ids = ["avci", "avci2", "avci3", "avci4"];
      ids.forEach((id, k) => A.push({ id, pos: [-0.75 + (k % 2) * 0.25, 0, -0.05 + k * 0.95], st: st(20 + k, { face: ["grin", "smug", "happy", "talk"][k], arms: "holdR", prop: { kind: "bag", hand: "r", text: "" }, look: -0.4 }) }));
      A.push({ id: "memur", pos: [0.9, 0, -2.0], st: st(3, { face: "wow", arms: "up", look: -0.6 }) });
      FX_.push({ kind: "dust", pos: [-0.65, 1.5, -0.9], size: 0.8, t: (t % 20) / 20 });
      cam = E.camAt(f, [{ f: f0, pos: [-2.5, 2.5, 3.3], look: [-0.4, 1.3, -1.0], fov: 46 }, { f: f1, pos: [-1.7, 2.2, 2.1], look: [-0.4, 1.35, -1.0], fov: 44 }]);
      dof = { focus: [-0.6, 1.3, -1.0], amount: 4 };
      break;
    }
    case "happy": { // memurlar sevinçten havalara uçar
      light = ["interior", "golden", 0.5];
      A.push({ id: "memur", pos: [-0.1, 0, -2.0], st: st(3, { face: "laugh", arms: "cheer", bob: 14 * Math.abs(Math.sin(f / 5)) }) });
      A.push({ id: "memur2", pos: [0.85, 0, -2.35], st: st(5, { face: "happy", arms: "cheer", bob: 14 * Math.abs(Math.sin(f / 5 + 1)) }) });
      FX_.push({ kind: "money", pos: [0.4, 3.1, -2.0], size: 1.0, t: t / 30 }, { kind: "sparkle", pos: [-0.6, 1.8, -0.9], size: 0.6, t: t / 30 });
      cam = E.camAt(f, [{ f: f0, pos: [0.35, 1.8, 1.4], look: [0.35, 1.75, -2.0], fov: 40 }, { f: f1, pos: [0.35, 1.78, 0.8], look: [0.35, 1.75, -2.0], fov: 40 }]);
      dof = { focus: [0.35, 1.7, -2.1], amount: 8 };
      break;
    }
    case "street": { // gece: kuyruksuz fareler
      light = "night";
      const odd = w("tuhaf", 0, 0.35), tl = w("kuyruksuz", 0, 0.65);
      for (let k = 0; k < 5; k++) { const z = -3.6 + (f - f0) * 0.045 - k * 0.5, x = SX - 0.4 + k * 0.38; rat(k, x, 0, z, { dir: [0.15, 1], hop: hop(f, k), tail: false }); }
      A.push({ id: "yaya", pos: [SX + 1.3, 0.2, -5.1], st: st(6, { face: f < odd ? "neutral" : f < tl ? "think" : "shock", arms: f < tl ? "hang" : "up", look: -0.4 }) });
      if (f >= odd && f < tl) FX_.push({ kind: "question", pos: [SX + 1.7, 2.9, -5.0], size: 0.6 * X.back(X.span(f, odd, odd + 8)) });
      if (f >= tl) FX_.push({ kind: "exclaim", pos: [SX + 1.7, 2.9, -5.0], size: 0.6 * X.back(X.span(f, tl, tl + 8)) });
      cam = E.camAt(f, [{ f: f0, pos: [SX - 0.4, 1.8, 5], look: [SX + 0.7, 1.2, -4], fov: 46 }, { f: tl - 4, pos: [SX - 0.2, 1.4, 4.2], look: [SX + 0.4, 0.8, -3], fov: 44 }, { f: tl + 8, pos: [SX + 0.15, 0.6, 2.6], look: [SX + 0.3, 0.3, -0.6], fov: 40 }, { f: f1, pos: [SX + 0.15, 0.58, 2.4], look: [SX + 0.3, 0.3, -0.6], fov: 40 }]);
      dof = { focus: f < tl ? [SX + 0.6, 1, -3] : [SX + 0.3, 0.2, -0.4], amount: f < tl ? 4 : 9 }; focusPt = [SX, 0, -2];
      break;
    }
    case "reason": { // sinsi avcı: fareyi öldürmüyor
      light = ["night", "interior", 0.5];
      const no = w("öldürmüyordu", 0, 0.6);
      A.push({ id: "avci", pos: [WX - 1.6, 0.45, -3.2], st: st(2, { face: "sly", arms: "reach", look: Math.sin(t / 8) }) });
      rat(0, WX - 1.15, 0.45, -2.6, { yaw: 0.3, s: 1.3, hop: hop(f, 0, 0.4) });
      if (f >= no) FX_.push({ kind: "cross", pos: [WX - 0.75, 1.35, -2.4], size: 0.7 * X.back(X.span(f, no, no + 8)) });
      cam = E.camAt(f, [{ f: f0, pos: [WX - 0.3, 1.45, 0.4], look: [WX - 1.3, 1.1, -3.0], fov: 42 }, { f: f1, pos: [WX - 0.5, 1.35, -0.3], look: [WX - 1.3, 1.05, -3.0], fov: 42 }]);
      dof = { focus: [WX - 1.3, 1, -2.9], amount: 6 }; focusPt = [WX - 1.3, 0, -3];
      break;
    }
    case "cut": { // kuyruk kesilir, fare serbest
      light = ["night", "interior", 0.5];
      const kc = w("kesip", 0, 0.3), kg = w("geri", 0, 0.6), run = X.easeIn(X.span(f, kg, kg + 22));
      A.push({ id: "avci", pos: [WX - 1.75, 0.45, -3.9], st: st(2, { face: f < kc ? "determined" : "smug", arms: f < kg ? "reach" : "wave", look: 0.4 }) });
      rat(0, WX - 1.2, 0.45, -2.7 - run * 6, { yaw: 0.3, s: 1.3, dir: run > 0 ? [0, -1] : null, hop: run > 0 ? hop(f, 0, 2) : 0, tail: f < kc });
      if (f >= kc && f < kc + 16) FX_.push({ kind: "puff", pos: [WX - 1.6, 0.8, -2.6], size: 0.9, t: X.span(f, kc, kc + 16) });
      if (f >= kc && f < kg + 10) { const p = X.span(f, kc, kc + 20); R.dropTail.visible = true; R.dropTail.position.set(WX - 1.65 - p * 0.1, 0.65 + Math.sin(p * Math.PI) * 0.8 + p * 0.5, -2.7 - p * 0.9); R.dropTail.rotation.set(0, 0, Math.PI / 2 + p * 9); }
      if (run > 0) FX_.push({ kind: "lines", pos: [WX - 1.2, 0.8, -2.9 - run * 6], size: 0.6, t: 0 });
      cam = E.camAt(f, [{ f: f0, pos: [WX - 0.45, 1.05, -0.5], look: [WX - 1.35, 0.7, -3.0], fov: 40 }, { f: kg, pos: [WX - 0.5, 1.0, -0.8], look: [WX - 1.35, 0.68, -3.0], fov: 40 }, { f: f1, pos: [WX - 0.5, 1.05, -0.8], look: [WX - 1.3, 0.7, -6], fov: 42 }]);
      dof = { focus: [WX - 1.25, 0.8, -2.8], amount: 6 }; focusPt = [WX - 1.3, 0, -3];
      break;
    }
    case "breed": { // yaşayan fare = yeni kuyruklar
      light = ["night", "interior", 0.4];
      const kq = w("kuyruklar", 0, 0.65);
      rat(0, WX + 1.35, 0.45, -10, { yaw: -1.2, hop: hop(f, 0, 0.3) });
      FX_.push({ kind: "hearts", pos: [WX + 1.35, 1.1, -9.9], size: 0.55, t: t / 30 });
      for (let k = 1; k <= 6; k++) {
        const fa = Math.round(f0 + len * (0.25 + k * 0.06)); if (f < fa) continue;
        const a = k * 1.05; rat(k, WX + 1.35 + Math.cos(a) * 0.45, 0.45, -10 + Math.sin(a) * 0.35 + 0.15, { yaw: -a, s: 0.5 * X.back(X.span(f, fa, fa + 8)), hop: hop(f, k, 0.5) });
      }
      A.push({ id: "avci", pos: [WX + 1.75, 0.45, -11.6], st: st(2, { face: f < kq ? "think" : "grin", arms: f < kq ? "chin" : "count", look: -0.5 }) });
      if (f >= kq) FX_.push({ kind: "money", pos: [WX + 1.9, 3.0, -11.4], size: 0.8, t: X.span(f, kq, kq + 30) });
      cam = E.camAt(f, [{ f: f0, pos: [WX + 0.45, 1.35, -7.3], look: [WX + 1.4, 0.75, -10.4], fov: 42 }, { f: f1, pos: [WX + 0.6, 1.25, -7.9], look: [WX + 1.45, 0.8, -10.5], fov: 42 }]);
      dof = { focus: [WX + 1.35, 0.6, -10], amount: 6 }; focusPt = [WX + 1.4, 0, -10];
      break;
    }
    case "farm": { // kent dışında fare çiftlikleri ortaya çıkar
      light = ["day", "golden", 0.45];
      const found = w("bulundu", 0, 0.7);
      for (let k = 0; k < 16; k++) { const r = seeded(200 + k); rat(k, FX - 2.5 + r() * 5 + Math.sin(f * 0.04 + k) * 0.25, 0, -5 + r() * 4.1, { s: 1.6, dir: [Math.cos(k * 2.3 + f * 0.015), Math.sin(k * 2.3 + f * 0.015)], hop: hop(f, k, 0.6) }); }
      for (let k = 16; k < 30; k++) { const r = seeded(300 + k); rat(k, FX + 4.9 + r() * 4.2, 0, -8.7 + r() * 4.2, { s: 1.6, yaw: r() * 6.28, hop: hop(f, k, 0.6) }); }
      const mx = X.keyed(f, [[f0, -1.1], [found - 6, 0.15]]);
      A.push({ id: "memur", pos: [FX + mx, 0, 0.7], st: st(3, { legs: f < found - 6 ? "walk" : "stand", phase: t / 22, face: f < found ? "think" : "shock", arms: f < found ? "holdR" : "up", prop: f < found ? { kind: "magnifier", hand: "r" } : null, look: 0.6 }) });
      A.push({ id: "ciftci", pos: [FX + 3.9, 0, -2.6], st: st(4, { face: "nervous", sweat: true, arms: "shrug", look: -0.8 }) });
      if (f >= found) FX_.push({ kind: "exclaim", pos: [FX + mx + 0.35, 2.8, 0.8], size: 0.7 * X.back(X.span(f, found, found + 8)) });
      cam = E.camAt(f, [{ f: f0, pos: [FX - 0.3, 2.6, 4.8], look: [FX, 0.8, -2.0], fov: 46 }, { f: f1, pos: [FX + 0.6, 3.6, 6.6], look: [FX + 1.2, 0.7, -2.8], fov: 50 }]);
      if (f >= found && f < found + 10) { const s = E.shake(f, found, 0.06, 10); cam.pos = cam.pos.map((v, k) => v + s[k]); }
      dof = { focus: X.keyed(f, [[f0, 3.8], [f1, 7.5]]), amount: 3, range: 4 }; focusPt = [FX + 1, 0, -3];
      break;
    }
    case "cancel": { // ödül kaldırılır: İPTAL damgası
      light = "dramatic";
      const hit = f0 + 7, p = X.easeIn(X.span(f, f0 + 1, hit));
      R.stamp.visible = f >= f0 + 1; R.stamp.scale.setScalar(2.4 - 1.4 * p);
      flash = flashIn(hit, 5) * 0.5;
      cam = E.camAt(f, [{ f: f0, pos: [-1.5, 2.3, -1.4], look: [-1.5, 2.3, -3.96], fov: 42 }, { f: f1, pos: [-1.5, 2.3, -1.9], look: [-1.5, 2.3, -3.96], fov: 42 }], { creep: 0.04 });
      if (f >= hit) { const s = E.shake(f, hit, 0.05, 9); cam.pos = cam.pos.map((v, k) => v + s[k]); }
      dof = { focus: [-1.5, 2.3, -3.96], amount: 3 };
      break;
    }
    case "final": { // fareler kaldı
      light = ["interior", "dramatic", 0.6];
      A.push({ id: "memur", pos: [0.3, 0, -2.0], st: st(3, { face: "sad", arms: "hang", sweat: true, look: -0.3, headTilt: -6 }) });
      const onCounter = [[-1.4, -1.1], [-0.1, -0.75], [0.9, -1.15], [1.6, -0.8], [-0.65, -1.2]];
      onCounter.forEach(([x, z], k) => rat(k, x, COUNTER_TOP, z, { yaw: -Math.PI / 2 + Math.sin(k) * 0.35, hop: hop(f, k, 0.3) }));
      const rnd = seeded(77);
      for (let k = 5; k < 22; k++) { const x = -3.5 + rnd() * 7, z = -0.2 + rnd() * 3.2; rat(k, x + Math.sin(f * 0.03 + k) * 0.2, 0, z, { yaw: rnd() * 6.28 + f * 0.01, hop: hop(f, k, 0.5) }); }
      cam = E.camAt(f, [{ f: f0, pos: [0.25, 1.95, 3.6], look: [0.25, 1.55, -1.6], fov: 46 }, { f: f1, pos: [0.3, 1.8, 1.7], look: [0.3, 1.7, -1.9], fov: 40 }]);
      dof = { focus: [0.3, 1.6, -1.9], amount: 4 };
      break;
    }
  }
  return { cam, light, dof, actors: A, fx: FX_, flash, overlay, focusPt };
}
