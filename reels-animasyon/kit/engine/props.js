// reels-animasyon · hazır nesneler ve hayvanlar (basit şekillerden kurulur). E.P ile kullanılır.
// Hepsi THREE.Group döner; ön yüz / burun +x yönüne bakar, taban y = 0.
// Hayvanlar: rat, cat, dog, bird, horse, fish  ·  Nesneler: cart, tower, bridge, gate, tent, well
// Hayvanların userData.pose(o) fonksiyonu vardır ve E.pool(...).place(...) içinden otomatik çağrılır:
//   o.run  : adım fazı (sürekli artan sayı, ör. f / 10) → bacaklar sallanır; verilmezse bacaklar düz
//   o.tail : false → kuyruk gizlenir      o.wag : kuyruk sallama fazı
//   o.flap : kuş kanat fazı (sürekli artan sayı)   o.roll (cart): tekerlek dönüş açısı (radyan)
import * as THREE from "three";
import { shade } from "./cast.js";

export function makeProps(E) {
  const P = {}, M = (c, o) => E.mat(c, o), INKC = "#241c26", PINK = "#e3a3a3";
  const eyes = (g, x, y, z, r = 0.022) => { for (const s of [-1, 1]) E.sphere(r, M(INKC), [x, y, s * z], { parent: g, seg: 8 }); };
  /** bacak: kalça noktasında pivot, aşağı uzanan silindir; pivot.rotation.z ile ileri-geri sallanır */
  const leg = (g, x, z, h, r, col) => { const pv = E.group(g, [x, h, z]); E.cyl(r * 0.8, r, h, M(col), [0, -h, 0], { parent: pv, seg: 8 }); return pv; };
  /** pivot noktasından `a` açısıyla (z ekseni, 0 = yukarı, + = geriye/-x) uzanan çubuk; ince ucu dışarıda */
  const stick = (pv, len, rt, rb, col, a) => E.cyl(rt, rb, len, M(col), [-Math.sin(a) * len / 2, Math.cos(a) * len / 2, 0], { parent: pv, center: true, seg: 8, rot: [0, 0, a] });
  /** dört bacak + kuyruk için ortak poz: çapraz adım (ön-sol ile arka-sağ aynı fazda) */
  const gait = (g, legs, tail, o = {}) => {
    g.userData.legs = legs; g.userData.tail = tail;
    g.userData.pose = (q = {}) => {
      const off = [0, 0.5, 0.5, 0];
      legs.forEach((L, i) => (L.rotation.z = q.run == null ? 0 : Math.sin((q.run + off[i % 4]) * Math.PI * 2) * (o.swing || 0.55)));
      if (tail) { tail.visible = q.tail !== false; tail.rotation.x = Math.sin((q.wag ?? q.run ?? 0) * Math.PI * 2) * 0.35; }
    };
    return g;
  };

  // ---------------- hayvanlar ----------------
  /** fare (~0.5 m) */
  P.rat = (o = {}) => {
    const { col = "#8f8a84" } = o, g = E.group(o.parent), fur = M(col), pink = M(PINK);
    E.sphere(0.16, fur, [0, 0.16, 0], { parent: g, scale: [1.55, 0.92, 1.05] });
    E.sphere(0.11, fur, [0.25, 0.2, 0], { parent: g, scale: [1.25, 1, 1] });
    E.sphere(0.035, pink, [0.38, 0.19, 0], { parent: g, seg: 10 });
    for (const s of [-1, 1]) {
      E.sphere(0.055, pink, [0.2, 0.31, s * 0.07], { parent: g, scale: [0.4, 1, 1], seg: 12 });
      for (const x of [-0.13, 0.13]) E.sphere(0.04, pink, [x, 0.035, s * 0.09], { parent: g, seg: 8 });
    }
    eyes(g, 0.33, 0.24, 0.05);
    const tail = E.group(g, [-0.24, 0.11, 0]); E.cyl(0.012, 0.026, 0.5, pink, [-0.24, 0.06, 0], { parent: tail, center: true, seg: 8, rot: [0, 0, Math.PI / 2 - 0.25] });
    g.userData.tail = tail;
    g.userData.pose = (q = {}) => { tail.visible = q.tail !== false; tail.rotation.y = Math.sin((q.wag ?? q.run ?? 0) * Math.PI * 2) * 0.3; };
    return g;
  };
  /** kedi (~0.6 m) */
  P.cat = (o = {}) => {
    const { col = "#e39a4a" } = o, g = E.group(o.parent), fur = M(col);
    E.sphere(0.17, fur, [0, 0.33, 0], { parent: g, scale: [1.6, 0.85, 0.9] });
    E.sphere(0.13, fur, [0.3, 0.47, 0], { parent: g });
    for (const s of [-1, 1]) E.cone(0.05, 0.1, fur, [0.28, 0.54, s * 0.065], { parent: g, seg: 8, rot: [s * -0.25, 0, 0] });
    E.sphere(0.02, M(PINK), [0.425, 0.455, 0], { parent: g, seg: 8 }); eyes(g, 0.4, 0.5, 0.05, 0.02);
    const legs = [[0.15, -0.07], [0.15, 0.07], [-0.15, -0.07], [-0.15, 0.07]].map(([x, z]) => leg(g, x, z, 0.27, 0.035, col));
    const tail = E.group(g, [-0.26, 0.38, 0]); stick(tail, 0.38, 0.02, 0.028, col, 0.6);
    return gait(g, legs, tail);
  };
  /** köpek (~0.8 m) */
  P.dog = (o = {}) => {
    const { col = "#b5844a" } = o, g = E.group(o.parent), fur = M(col), dark = M(shade(col, 0.7));
    E.sphere(0.2, fur, [0, 0.44, 0], { parent: g, scale: [1.6, 0.85, 0.9] });
    E.sphere(0.15, fur, [0.36, 0.64, 0], { parent: g });
    E.sphere(0.08, fur, [0.5, 0.58, 0], { parent: g, scale: [1.4, 0.8, 0.9] });
    E.sphere(0.032, M(INKC), [0.61, 0.6, 0], { parent: g, seg: 8 }); eyes(g, 0.46, 0.68, 0.06);
    for (const s of [-1, 1]) E.sphere(0.07, dark, [0.32, 0.62, s * 0.14], { parent: g, scale: [0.5, 1.3, 0.4] });
    const legs = [[0.2, -0.09], [0.2, 0.09], [-0.2, -0.09], [-0.2, 0.09]].map(([x, z]) => leg(g, x, z, 0.36, 0.045, col));
    const tail = E.group(g, [-0.3, 0.52, 0]); stick(tail, 0.26, 0.022, 0.032, col, 0.8);
    return gait(g, legs, tail);
  };
  /** kuş (~0.3 m); o.flap fazıyla kanat çırpar */
  P.bird = (o = {}) => {
    const { col = "#4a8fd0", beak = "#f2b23a" } = o, g = E.group(o.parent), body = M(col);
    E.sphere(0.1, body, [0, 0.17, 0], { parent: g, scale: [1.3, 1, 0.9] });
    E.sphere(0.066, body, [0.1, 0.28, 0], { parent: g });
    const bk = E.group(g, [0.155, 0.275, 0]); bk.rotation.z = -Math.PI / 2; E.cone(0.024, 0.07, M(beak), [0, 0, 0], { parent: bk, seg: 8 });
    eyes(g, 0.13, 0.3, 0.045, 0.014);
    E.box(0.12, 0.02, 0.08, body, [-0.15, 0.18, 0], { parent: g, center: true });
    for (const s of [-1, 1]) E.cyl(0.006, 0.006, 0.08, M(beak), [0, 0, s * 0.03], { parent: g, seg: 5 });
    const wings = [-1, 1].map((s) => { const pv = E.group(g, [0, 0.21, s * 0.08]); E.sphere(0.09, M(shade(col, 0.85)), [-0.02, 0, s * 0.07], { parent: pv, scale: [1.1, 0.22, 0.65] }); pv.userData.side = s; return pv; });
    g.userData.wings = wings;
    g.userData.pose = (q = {}) => { const a = q.flap == null ? 0.1 : 0.15 + 0.9 * (0.5 + 0.5 * Math.sin(q.flap * Math.PI * 2)); wings.forEach((w) => (w.rotation.x = -w.userData.side * a)); };
    return g;
  };
  /** at (~2.2 m boy, ~2.4 m uzunluk) */
  P.horse = (o = {}) => {
    const { col = "#8a5a36", mane = "#3a2a20" } = o, g = E.group(o.parent), fur = M(col), mm = M(mane);
    E.sphere(0.5, fur, [0, 1.3, 0], { parent: g, scale: [1.55, 0.72, 0.62] });
    const neck = E.group(g, [0.55, 1.4, 0]); neck.rotation.z = -0.6;
    E.cyl(0.17, 0.22, 0.75, fur, [0, 0, 0], { parent: neck, seg: 12 }); E.box(0.08, 0.75, 0.07, mm, [-0.17, 0, 0], { parent: neck });
    E.sphere(0.2, fur, [1.08, 1.98, 0], { parent: g, scale: [1.6, 0.78, 0.72] });
    for (const s of [-1, 1]) E.cone(0.05, 0.13, fur, [0.97, 2.08, s * 0.08], { parent: g, seg: 8 });
    E.sphere(0.03, M(INKC), [1.38, 1.96, 0.07], { parent: g, seg: 8 }); E.sphere(0.03, M(INKC), [1.38, 1.96, -0.07], { parent: g, seg: 8 });
    eyes(g, 1.15, 2.06, 0.13, 0.026);
    const legs = [[0.5, -0.17], [0.5, 0.17], [-0.5, -0.17], [-0.5, 0.17]].map(([x, z]) => leg(g, x, z, 1.1, 0.075, col));
    legs.forEach((L) => E.cyl(0.085, 0.09, 0.12, M("#2b2633"), [0, -1.1, 0], { parent: L, seg: 8 }));
    const tail = E.group(g, [-0.75, 1.42, 0]); stick(tail, 0.7, 0.05, 0.1, mane, 2.55);
    return gait(g, legs, tail, { swing: 0.45 });
  };
  /** balık (~0.4 m); o.run fazıyla kuyruk sallar */
  P.fish = (o = {}) => {
    const { col = "#f0a03a" } = o, g = E.group(o.parent), body = M(col);
    E.sphere(0.15, body, [0, 0, 0], { parent: g, scale: [1.6, 0.8, 0.45] });
    const tail = E.group(g, [-0.22, 0, 0]); const c = E.cone(0.12, 0.16, M(shade(col, 0.85)), [0, -0.16, 0], { parent: tail, seg: 10 }); c.scale.z = 0.25; tail.rotation.z = -Math.PI / 2;
    E.sphere(0.022, M(INKC), [0.15, 0.04, 0.06], { parent: g, seg: 8 }); E.sphere(0.022, M(INKC), [0.15, 0.04, -0.06], { parent: g, seg: 8 });
    g.userData.pose = (q = {}) => { tail.rotation.y = Math.sin((q.run ?? 0) * Math.PI * 2) * 0.45; };
    return g;
  };

  // ---------------- nesneler ----------------
  /** at arabası / el arabası (~2 m); o.roll ile tekerlek döner */
  P.cart = (o = {}) => {
    const { col = "#a8743f", wheel = "#5a3a20", shafts = true } = o, g = E.group(o.parent), wood = M(col, { map: E.T.planks(col, 4) });
    E.box(2.0, 0.12, 1.2, wood, [0, 0.55, 0], { parent: g });
    for (const s of [-1, 1]) E.box(2.0, 0.35, 0.08, wood, [0, 0.67, s * 0.56], { parent: g });
    E.box(0.08, 0.35, 1.2, wood, [-0.96, 0.67, 0], { parent: g }); E.box(0.08, 0.35, 1.2, wood, [0.96, 0.67, 0], { parent: g });
    const wheels = [-1, 1].map((s) => {
      const wg = E.group(g, [0, 0.45, s * 0.7]);
      E.cyl(0.45, 0.45, 0.08, M(wheel), [0, 0, 0], { parent: wg, center: true, seg: 20, rot: [Math.PI / 2, 0, 0] });
      E.box(0.06, 0.8, 0.1, M(shade(wheel, 1.25)), [0, 0, 0], { parent: wg, center: true }); E.box(0.8, 0.06, 0.1, M(shade(wheel, 1.25)), [0, 0, 0], { parent: wg, center: true });
      return wg;
    });
    if (shafts) for (const s of [-1, 1]) E.box(1.6, 0.06, 0.06, M(wheel), [1.75, 0.72, s * 0.4], { parent: g });
    g.userData.wheels = wheels; g.userData.pose = (q = {}) => wheels.forEach((w) => (w.rotation.z = -(q.roll || 0)));
    return g;
  };
  /** kule: o.kind = "roof" (konik çatı) | "castle" (mazgallı) */
  P.tower = (o = {}) => {
    const { h = 8, r = 1.6, col = "#d8ccb4", roof = "#a8483a", kind = "roof" } = o, g = E.group(o.parent), st = M(col, { map: E.T.stone(col) });
    E.cyl(r, r * 1.08, h, st, [0, 0, 0], { parent: g, seg: 24 });
    if (kind === "castle") { E.cyl(r * 1.15, r * 1.15, 0.5, st, [0, h, 0], { parent: g, seg: 24 }); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; E.box(0.45, 0.55, 0.35, st, [Math.cos(a) * r * 1.05, h + 0.5, Math.sin(a) * r * 1.05], { parent: g, rot: [0, -a, 0] }); } }
    else E.cone(r * 1.3, r * 1.7, M(roof, { map: E.T.roof(roof) }), [0, h, 0], { parent: g, seg: 24 });
    for (let y = h * 0.35; y < h - 0.8; y += 2.2) E.box(0.4, 0.7, 0.12, M("#2b2633"), [0, y, r - 0.03], { parent: g });
    E.box(0.9, 1.7, 0.14, M("#6b4428", { map: E.T.wood("#6b4428") }), [0, 0, r * 1.02], { parent: g });
    return g;
  };
  /** köprü: x ekseni boyunca len uzunluğunda, güverte y = h */
  P.bridge = (o = {}) => {
    const { len = 10, w = 3, h = 1.6, col = "#b08a5a" } = o, g = E.group(o.parent), wood = M(col, { map: E.T.planks(col, 5) });
    E.box(len, 0.25, w, wood, [0, h, 0], { parent: g, texel: 0.5 });
    for (const s of [-1, 1]) {
      for (let x = -len / 2; x <= len / 2 + 0.01; x += 1) E.box(0.1, 0.9, 0.1, M(shade(col, 0.8)), [x, h + 0.25, s * (w / 2 - 0.08)], { parent: g });
      E.box(len, 0.1, 0.12, M(shade(col, 0.8)), [0, h + 1.05, s * (w / 2 - 0.08)], { parent: g });
      for (const x of [-len / 2 + 0.4, 0, len / 2 - 0.4]) E.cyl(0.2, 0.24, h + 1.2, M("#6b5a4a"), [x, -1.2, s * (w / 2 - 0.3)], { parent: g, seg: 10 });
    }
    return g;
  };
  /** kapı / kemer (saray, şehir kapısı); o.text verilirse üst kirişe yazı */
  P.gate = (o = {}) => {
    const { w = 4, h = 5, col = "#e9dcc0", trim = "#c9a24a", text = null } = o, g = E.group(o.parent), st = M(col, { map: E.T.plaster(col) });
    for (const s of [-1, 1]) E.box(1.1, h, 1.1, st, [s * (w / 2 + 0.55), 0, 0], { parent: g });
    E.box(w + 2.6, 0.9, 1.3, st, [0, h, 0], { parent: g });
    E.box(w + 2.9, 0.18, 1.45, M(trim), [0, h + 0.9, 0], { parent: g });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(w / 2, 0.22, 8, 28, Math.PI), M(trim)); arch.position.set(0, h - w / 2, 0.45); E.add(arch, g);
    if (text) E.label(E.T.sign(text, { bg: trim, fg: INKC, border: null, size: 140 }), Math.min(w + 1.6, 6), 0.6, [0, h + 0.45, 0.67], { parent: g });
    return g;
  };
  /** pazar çadırı / tezgâh çadırı */
  P.tent = (o = {}) => {
    const { w = 3, d = 2.4, h = 2.4, col = "#c8473a", stripe = "#f3eedf" } = o, g = E.group(o.parent);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) E.cyl(0.05, 0.05, h, M("#6b4428"), [x * w / 2, 0, z * d / 2], { parent: g, seg: 6 });
    E.cone(Math.hypot(w, d) / 2 + 0.25, 1.1, M(col), [0, h, 0], { parent: g, seg: 4, rot: [0, Math.PI / 4, 0] });
    for (let i = 0; i < 5; i++) E.box(w / 5 - 0.02, 0.32, 0.03, M(i % 2 ? col : stripe), [-w / 2 + (i + 0.5) * (w / 5), h - 0.32, d / 2 + 0.05], { parent: g });
    E.box(w * 0.9, 0.9, 0.6, M("#a8743f", { map: E.T.planks("#a8743f", 4) }), [0, 0, d / 2 - 0.4], { parent: g });
    return g;
  };
  /** kuyu */
  P.well = (o = {}) => {
    const { col = "#9a958a", roof = "#8a4a3a" } = o, g = E.group(o.parent), st = M(col, { map: E.T.stone(col) });
    E.cyl(0.8, 0.85, 0.8, st, [0, 0, 0], { parent: g, seg: 20 }); E.cyl(0.66, 0.66, 0.02, M("#1d2a2a"), [0, 0.79, 0], { parent: g, seg: 20 });
    for (const s of [-1, 1]) E.box(0.12, 2.0, 0.12, M("#6b4428"), [s * 0.85, 0.7, 0], { parent: g });
    E.cyl(0.05, 0.05, 1.8, M("#6b4428"), [0, 2.3, 0], { parent: g, center: true, seg: 8, rot: [0, 0, Math.PI / 2] });
    for (const s of [-1, 1]) E.box(2.1, 0.08, 0.75, M(roof, { map: E.T.roof(roof) }), [0, 2.55, s * 0.3], { parent: g, center: true, rot: [s * 0.55, 0, 0] });
    E.cyl(0.12, 0.1, 0.2, M("#7a5a36"), [0.2, 1.2, 0], { parent: g, seg: 10 });
    return g;
  };

  /** hazır havuz: P.pool(20, "rat", { col }) → E.pool(...) (renkler sırayla hafif değişir) */
  P.pool = (n, kind, o = {}) => E.pool(n, (i) => P[kind]({ ...o, col: o.cols ? o.cols[i % o.cols.length] : o.col }));
  return P;
}
