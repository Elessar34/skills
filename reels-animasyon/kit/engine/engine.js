// reels-animasyon · render motoru. three.js r160, headless Chromium'da kare kare çalışır.
// Geçişler: renk (MSAA) → normal+derinlik → mürekkep + renk düzeltme → alan derinliği → 2D katman (altyazı).
// Her şey karenin saf fonksiyonudur: renderFrame(f) aynı f için hep aynı kareyi verir.
import * as THREE from "three";
import { drawChar, drawFx, INK } from "./cast.js";
import { T } from "./paint.js";

// ---------------- matematik / hareket ----------------
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const back = (t) => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const spring = (t) => { t = clamp(t); return 1 - Math.exp(-6 * t) * Math.cos(10 * t); };
export const span = (f, f0, f1) => clamp((f - f0) / Math.max(1, f1 - f0));
const lerpV = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const nz = (x, s) => Math.sin(x * 1.7 + s) * 0.5 + Math.sin(x * 2.9 + s * 1.3) * 0.3 + Math.sin(x * 5.3 + s * 0.7) * 0.2;
/** anahtar kare: keys = [[f, değer], ...] (değer sayı veya dizi) */
export function keyed(f, keys, ease = smooth) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i], [f1, v1] = keys[i + 1];
    if (f <= f1) { const t = ease((f - f0) / Math.max(1, f1 - f0)); return Array.isArray(v0) ? lerpV(v0, v1, t) : lerp(v0, v1, t); }
  }
  return keys[keys.length - 1][1];
}

const GRAD = (() => { const d = new Uint8Array([105, 105, 105, 255, 180, 180, 180, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();

// ---------------- ışık ön ayarları ----------------
export const LIGHTS = {
  day: { sun: "#fff0d8", sunI: 1.55, az: -35, el: 50, sky: "#bcd8ff", ground: "#9a8a66", hemiI: 0.9, amb: 0.2, top: "#3f8fe0", bot: "#cfe7ff", fog: "#cfe2f4", fogNear: 45, fogFar: 190, card: "#ffffff", sat: 1.12, warm: 0.0, con: 1.06, vig: 0.28 },
  golden: { sun: "#ffb27a", sunI: 1.5, az: -70, el: 16, sky: "#ffc8a6", ground: "#6a4a5a", hemiI: 0.7, amb: 0.15, top: "#e8835a", bot: "#ffe0b0", fog: "#f3c49c", fogNear: 40, fogFar: 170, card: "#ffe6cf", sat: 1.15, warm: 0.06, con: 1.08, vig: 0.36 },
  night: { sun: "#9fb4ff", sunI: 0.5, az: 220, el: 40, sky: "#3a4c96", ground: "#1a1a2e", hemiI: 0.6, amb: 0.14, top: "#081338", bot: "#2a3f7a", fog: "#1c2a55", fogNear: 30, fogFar: 140, card: "#a9b8f0", sat: 1.05, warm: -0.06, con: 1.1, vig: 0.46 },
  interior: { sun: "#fff1dc", sunI: 0.9, az: -30, el: 60, sky: "#ffe8c8", ground: "#5a4030", hemiI: 1.0, amb: 0.3, top: "#f3e2c4", bot: "#f3e2c4", fog: "#e9d6b5", fogNear: 30, fogFar: 120, card: "#fff6ea", sat: 1.08, warm: 0.03, con: 1.06, vig: 0.34 },
  dramatic: { sun: "#ffd3a0", sunI: 1.4, az: -80, el: 25, sky: "#7a5a8a", ground: "#2a1a2a", hemiI: 0.45, amb: 0.1, top: "#2a1f45", bot: "#a0607a", fog: "#4a3050", fogNear: 25, fogFar: 120, card: "#f0d4c4", sat: 1.1, warm: 0.04, con: 1.14, vig: 0.5 },
};
const mixLight = (a, b, t) => {
  const o = {};
  for (const k in a) {
    if (typeof a[k] === "number") o[k] = lerp(a[k], b[k], t);
    else o[k] = "#" + new THREE.Color(a[k]).lerp(new THREE.Color(b[k]), t).getHexString();
  }
  return o;
};

// ---------------- shaderlar ----------------
const ND_VERT = `
varying vec3 vN; varying float vZ; varying vec2 vUv;
void main(){ vUv = uv; vec3 objectNormal = normal; vec3 transformed = position;
  vec4 mv = modelViewMatrix * vec4(transformed,1.0); vN = normalize(normalMatrix*objectNormal); vZ = -mv.z; gl_Position = projectionMatrix*mv; }`;
const ND_FRAG = `
uniform float uFar; uniform sampler2D map; uniform float uCard; varying vec3 vN; varying float vZ; varying vec2 vUv;
void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
  if(uCard>0.5){ vec4 c = texture2D(map, vUv); if(c.a<0.5) discard; n = vec3(0.0,0.0,1.0); }
  gl_FragColor = vec4(n*0.5+0.5, clamp(vZ/uFar,0.0,1.0)); }`;
const FS_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }`;
const COMP_FRAG = `
uniform sampler2D tColor; uniform sampler2D tND; uniform vec2 uRes; uniform float uInk; uniform vec3 uInkCol;
uniform float uSat; uniform float uCon; uniform float uWarm; uniform float uVig; uniform float uFlash; uniform vec3 uFlashCol; uniform float uFar; uniform float uTime; uniform float uFade;
varying vec2 vUv;
vec3 toSRGB(vec3 c){ c = max(c, 0.0); return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(0.0031308, c)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec3 col = texture2D(tColor, vUv).rgb;
  vec4 c0 = texture2D(tND, vUv); float d0 = c0.a; vec3 n0 = c0.rgb*2.0-1.0;
  float edge = 0.0; vec2 px = uInk / uRes;
  for(int i=0;i<8;i++){
    float a = float(i)*0.785398; vec2 o = vec2(cos(a), sin(a))*px;
    vec4 c1 = texture2D(tND, vUv+o); float d1 = c1.a; vec3 n1 = c1.rgb*2.0-1.0;
    float zd = (d1 - d0) * uFar; float rel = zd / max(d0*uFar, 0.5);
    float de = smoothstep(0.035, 0.09, rel);                        // yakın taraf: arkada derinlik sıçraması
    float ne = smoothstep(0.55, 0.25, dot(n0, n1)) * step(abs(rel), 0.25); // kıvrım
    edge = max(edge, max(de, ne));
  }
  float fade = 1.0 - smoothstep(140.0, 420.0, d0*uFar);
  edge *= fade * step(d0, 0.999);
  col = toSRGB(col);
  float l = dot(col, vec3(0.299,0.587,0.114));
  col = mix(vec3(l), col, uSat);
  col = (col - 0.5) * uCon + 0.5;
  col += vec3(uWarm, uWarm*0.25, -uWarm);
  col = mix(col, uInkCol, edge*0.92);
  vec2 q = vUv - 0.5; q.x *= uRes.x/uRes.y; float v = smoothstep(0.85, 0.2, length(q)*1.25); col *= mix(1.0, v, uVig);
  col += (hash(vUv*uRes + uTime) - 0.5) * 0.025;
  col = mix(col, uFlashCol, uFlash);
  col *= uFade;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
const DOF_FRAG = `
uniform sampler2D tImg; uniform sampler2D tND; uniform vec2 uRes; uniform float uFocus; uniform float uAmt; uniform float uFar; uniform float uRange;
varying vec2 vUv;
float coc(float d){ float z = d*uFar; if(d>0.999) z = 400.0; return clamp(abs(z-uFocus)/max(uRange,0.01), 0.0, 1.0) * uAmt; }
void main(){
  float c0 = coc(texture2D(tND, vUv).a);
  if(uAmt < 0.5){ gl_FragColor = texture2D(tImg, vUv); return; }
  vec3 acc = texture2D(tImg, vUv).rgb; float w = 1.0;
  const int N = 40; float ga = 2.39996;
  for(int i=1;i<N;i++){
    float r = sqrt(float(i)/float(N)); float a = float(i)*ga;
    vec2 o = vec2(cos(a), sin(a)) * r * max(c0, 0.0) / uRes;
    vec2 uv = vUv + o;
    float cs = coc(texture2D(tND, uv).a);
    float ws = step(r*c0*0.9, cs + 0.5) ;
    acc += texture2D(tImg, uv).rgb * ws; w += ws;
  }
  gl_FragColor = vec4(acc / w, 1.0);
}`;
const SKY_VERT = `varying vec3 vP; void main(){ vP = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position = p.xyww; }`;
const SKY_FRAG = `uniform vec3 uTop; uniform vec3 uBot; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(uBot, uTop, smoothstep(-0.05, 0.55, h)), 1.0); }`;

// ---------------- motor ----------------
export class Engine {
  constructor(opt = {}) {
    this.width = opt.w || 1080; this.H = opt.h || 1920; this.fps = opt.fps || 30; this.scale = opt.scale || 1;
    this.rw = Math.round(this.width * this.scale); this.rh = Math.round(this.H * this.scale);
    this.far = 600;
    const cv = document.createElement("canvas"); cv.width = this.rw; cv.height = this.rh;
    this.gl = new THREE.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    this.gl.setPixelRatio(1); this.gl.setSize(this.rw, this.rh, false);
    this.gl.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.gl.shadowMap.enabled = true; this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.H, 0.1, this.far);
    this.THREE = THREE; this.T = T; this.INK = INK;
    // ışıklar
    this.sun = new THREE.DirectionalLight(0xffffff, 3); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.03;
    const sc = this.sun.shadow.camera; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 160;
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1); this.scene.add(this.hemi);
    this.amb = new THREE.AmbientLight(0xffffff, 0.2); this.scene.add(this.amb);
    // gökyüzü
    this.skyMat = new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: { uTop: { value: new THREE.Color() }, uBot: { value: new THREE.Color() } }, side: THREE.BackSide, depthWrite: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), this.skyMat); this.sky.userData.noink = true; this.sky.renderOrder = -1; this.sky.frustumCulled = false;
    this.scene.add(this.sky);
    this.scene.fog = new THREE.Fog(0xcfe2f4, 45, 190);
    // render hedefleri
    const rt = (s) => new THREE.WebGLRenderTarget(this.rw, this.rh, { type: THREE.HalfFloatType, samples: s, depthBuffer: true });
    this.rtColor = rt(4); this.rtND = rt(0); this.rtComp = rt(0);
    this.ndMat = new THREE.ShaderMaterial({ vertexShader: ND_VERT, fragmentShader: ND_FRAG, uniforms: { uFar: { value: this.far }, map: { value: null }, uCard: { value: 0 } }, side: THREE.DoubleSide });
    this.fsScene = new THREE.Scene(); this.fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.compMat = new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: COMP_FRAG, uniforms: {
      tColor: { value: this.rtColor.texture }, tND: { value: this.rtND.texture }, uRes: { value: new THREE.Vector2(this.rw, this.rh) }, uInk: { value: 2.4 * this.scale * (this.H / 1920) * 1.0 },
      uInkCol: { value: new THREE.Color(0x1d1622) }, uSat: { value: 1.1 }, uCon: { value: 1.05 }, uWarm: { value: 0 }, uVig: { value: 0.3 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 1, 1) }, uFar: { value: this.far }, uTime: { value: 0 }, uFade: { value: 1 } } });
    this.dofMat = new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: DOF_FRAG, uniforms: {
      tImg: { value: this.rtComp.texture }, tND: { value: this.rtND.texture }, uRes: { value: new THREE.Vector2(this.rw, this.rh) }, uFocus: { value: 5 }, uAmt: { value: 0 }, uFar: { value: this.far }, uRange: { value: 4 } } });
    this.fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.compMat); this.fsScene.add(this.fsQuad);
    // 2D çıktı katmanı
    this.out = document.createElement("canvas"); this.out.width = this.rw; this.out.height = this.rh; this.og = this.out.getContext("2d");
    this.actors = new Map(); this.fxPool = []; this.mats = new Map();
    this.words = []; this.captions = true; this.capStyle = {};
    this.setLight("day");
  }

  // ---------- malzeme + geometri ----------
  mat(color = "#cccccc", o = {}) {
    const key = color + JSON.stringify(o, (k, v) => (v && v.uuid ? v.uuid : v));
    if (this.mats.has(key)) return this.mats.get(key);
    const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: GRAD, map: o.map || null, side: o.side || THREE.FrontSide, transparent: !!o.transparent, opacity: o.opacity ?? 1, emissive: new THREE.Color(o.emissive || "#000000"), emissiveIntensity: o.glow ?? 1 });
    if (o.map) m.color.set(o.tint || "#ffffff");
    this.mats.set(key, m); return m;
  }
  flat(color = "#ffffff", o = {}) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), map: o.map || null, transparent: !!o.transparent, opacity: o.opacity ?? 1, side: o.side || THREE.FrontSide, fog: o.fog ?? true, toneMapped: false }); }
  add(mesh, parent) { mesh.castShadow = mesh.receiveShadow = true; (parent || this.scene).add(mesh); return mesh; }
  group(parent, pos = [0, 0, 0], rotY = 0) { const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; (parent || this.scene).add(g); return g; }
  /** kutu: dokuyu dünyadaki boyuta göre tekrarlar (texel = metre başına tekrar) */
  box(w, h, d, mat, pos = [0, 0, 0], o = {}) {
    const geo = new THREE.BoxGeometry(w, h, d);
    if (o.texel) { const uv = geo.attributes.uv, nrm = geo.attributes.normal; for (let i = 0; i < uv.count; i++) { const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)); const su = ax > 0.5 ? d : w, sv = ay > 0.5 ? d : h; uv.setXY(i, uv.getX(i) * su * o.texel, uv.getY(i) * sv * o.texel); } }
    const m = new THREE.Mesh(geo, Array.isArray(mat) ? mat : (typeof mat === "string" ? this.mat(mat) : mat));
    m.position.set(pos[0], pos[1] + (o.center ? 0 : h / 2), pos[2]); if (o.rot) m.rotation.set(...o.rot);
    if (o.noShadow) { this.add(m, o.parent); m.castShadow = false; return m; }
    return this.add(m, o.parent);
  }
  cyl(rt, rb, h, mat, pos = [0, 0, 0], o = {}) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 20), typeof mat === "string" ? this.mat(mat) : mat); m.position.set(pos[0], pos[1] + (o.center ? 0 : h / 2), pos[2]); if (o.rot) m.rotation.set(...o.rot); return this.add(m, o.parent); }
  sphere(r, mat, pos = [0, 0, 0], o = {}) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg || 24, 16), typeof mat === "string" ? this.mat(mat) : mat); m.position.set(...pos); if (o.scale) m.scale.set(...o.scale); return this.add(m, o.parent); }
  cone(r, h, mat, pos = [0, 0, 0], o = {}) { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, o.seg || 20), typeof mat === "string" ? this.mat(mat) : mat); m.position.set(pos[0], pos[1] + h / 2, pos[2]); if (o.rot) m.rotation.set(...o.rot); return this.add(m, o.parent); }
  plane(w, h, mat, pos = [0, 0, 0], o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), typeof mat === "string" ? this.mat(mat) : mat); m.position.set(...pos); if (o.rot) m.rotation.set(...o.rot); if (o.noink) m.userData.noink = true; this.add(m, o.parent); if (o.noShadow) m.castShadow = false; return m; }
  /** yer düzlemi: texture + metre başına tekrar */
  ground(tex, size = 200, perM = 0.25, pos = [0, 0, 0]) { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(size * perM, size * perM); const m = this.plane(size, size, this.mat("#ffffff", { map: t }), pos, { rot: [-Math.PI / 2, 0, 0] }); m.castShadow = false; return m; }
  /** metinli düz yüzey (tabela, poster, gazete) — dünyada w x h metre */
  label(tex, w, h, pos, o = {}) { const m = this.plane(w, h, o.lit === false ? this.flat("#ffffff", { map: tex }) : this.mat("#ffffff", { map: tex, side: THREE.DoubleSide }), pos, o); return m; }
  cloud(x, y, z, s = 1, seed = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(16 * s, 8 * s), this.flat("#ffffff", { map: T.cloud(seed), transparent: true, fog: false })); m.position.set(x, y, z); m.material.alphaTest = 0.5; m.userData.noink = true; m.userData.bill = true; this.scene.add(m); return m; }

  // ---------- ışık ----------
  setLight(a, b = null, t = 0) {
    const A = typeof a === "string" ? LIGHTS[a] : a, B = b ? (typeof b === "string" ? LIGHTS[b] : b) : null;
    const L = B ? mixLight(A, B, t) : A; this.L = L;
    this.sun.color.set(L.sun); this.sun.intensity = L.sunI;
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI; this.amb.intensity = L.amb;
    this.skyMat.uniforms.uTop.value.set(L.top); this.skyMat.uniforms.uBot.value.set(L.bot);
    this.scene.fog.color.set(L.fog); this.scene.fog.near = L.fogNear; this.scene.fog.far = L.fogFar;
    const u = this.compMat.uniforms; u.uSat.value = L.sat; u.uWarm.value = L.warm; u.uCon.value = L.con; u.uVig.value = L.vig;
    this.cardTint = L.card;
  }

  // ---------- karakterler (karton kart) ----------
  /** id ile karakter tanımla; spec = cast.js drawChar spec'i; h = boy (m) */
  actor(id, spec, o = {}) {
    const wide = o.wide || 1, cw = Math.round(720 * wide), ch = 1200, c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const h = o.h || (spec.build === "kid" ? 1.7 : 2.2), w = h * 0.6 * wide;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h * 0.475, 0);
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color("#ffffff") });
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.userData.card = true;
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.54, h * 0.24), new THREE.MeshBasicMaterial({ map: T.blob(), transparent: true, depthWrite: false, fog: false })); blob.rotation.x = -Math.PI / 2; blob.userData.noink = true; blob.renderOrder = 1;
    blob.userData.blob = true; this.scene.add(mesh, blob); mesh.visible = blob.visible = false;
    const a = { id, spec, c, g: c.getContext("2d"), tex, mesh, blob, h, wide, key: "" }; this.actors.set(id, a); return a;
  }
  _placeActor(a, s, cam) {
    const st = s.st || {}, pos = s.pos || [0, 0, 0];
    const key = JSON.stringify(st, (k, v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v));
    if (key !== a.key) { a.g.clearRect(0, 0, a.c.width, a.c.height); a.g.save(); a.g.scale(a.c.height / 1000, a.c.height / 1000); a.g.translate((a.wide - 1) * 300, 0); drawChar(a.g, a.spec, st); a.g.restore(); a.tex.needsUpdate = true; a.key = key; }
    a.mesh.visible = a.blob.visible = true;
    a.mesh.position.set(pos[0], pos[1], pos[2]);
    const yaw = s.yaw ?? Math.atan2(cam.position.x - pos[0], cam.position.z - pos[2]);
    a.mesh.rotation.set(0, yaw, 0); a.mesh.rotateZ(-(s.roll || 0));
    const sc = s.scale || 1; a.mesh.scale.set((s.flip ? -1 : 1) * sc, sc, sc);
    a.mesh.material.color.set(s.tint || this.cardTint);
    a.blob.position.set(pos[0], pos[1] + 0.02, pos[2]); a.blob.scale.setScalar(sc); a.blob.visible = s.blob !== false && pos[1] < 50;
  }
  _fx(i, s, cam) {
    let m = this.fxPool[i];
    if (!m) {
      const c = document.createElement("canvas"); c.width = c.height = 512;
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide, fog: false }));
      m.userData = { card: true, c, g: c.getContext("2d"), tex, key: "" }; this.scene.add(m); this.fxPool[i] = m;
    }
    const key = s.kind + (Math.round((s.t || 0) * 30)) + JSON.stringify(s.opt || {});
    if (key !== m.userData.key) { m.userData.g.clearRect(0, 0, 512, 512); drawFx(m.userData.g, s.kind, s.t || 0, s.opt || {}); m.userData.tex.needsUpdate = true; m.userData.key = key; }
    m.visible = true; m.position.set(...s.pos); const sz = s.size || 1; m.scale.set(sz, sz, sz);
    m.lookAt(cam.position); if (s.rot) m.rotateZ(s.rot);
  }

  // ---------- kamera ----------
  /** keys = [{f, pos:[x,y,z], look:[x,y,z], fov}] ; yumuşak geçiş + duruşlarda hafif süzülme */
  camAt(f, keys, o = {}) {
    let i = 0; while (i < keys.length - 1 && f > keys[i + 1].f) i++;
    const A = keys[i], B = keys[Math.min(i + 1, keys.length - 1)];
    const t = A === B ? 0 : (o.ease || smooth)((f - A.f) / Math.max(1, B.f - A.f));
    const pos = lerpV(A.pos, B.pos, t), look = lerpV(A.look, B.look, t), fov = lerp(A.fov || 40, B.fov || 40, t), roll = lerp(A.roll || 0, B.roll || 0, t);
    const cr = o.creep ?? 0.12, s = f / this.fps;
    pos[0] += nz(s * 0.6, 1) * cr; pos[1] += nz(s * 0.5, 2) * cr * 0.6; pos[2] += nz(s * 0.4, 3) * cr;
    return { pos, look, fov, roll };
  }
  shake(f, f0, amp = 0.15, dur = 8) { const t = (f - f0) / dur; if (t < 0 || t > 1) return [0, 0, 0]; const k = amp * (1 - t); return [Math.sin(f * 2.7) * k, Math.cos(f * 3.3) * k, 0]; }
  idle(f, seed = 1) { const s = f / this.fps; return { bob: 6 * Math.sin(s * 2.2 + seed), tilt: 1.5 * Math.sin(s * 1.3 + seed * 2), headTilt: 3 * Math.sin(s * 0.9 + seed * 3) }; }
  blink(f, seed = 1) { const p = 3.1 + (seed % 5) * 0.37, s = (f / this.fps + seed * 0.71) % p; return s < 0.12 ? 1 : 0; }
  /** konuşan karakter için ağız açıklığı (seslendirme kelimelerinden) */
  talk(f, from = 0, to = 1e9) { const t = f / this.fps; for (const w of this.words) { if (w.s * this.fps < from || w.s * this.fps > to) continue; if (t >= w.s && t <= w.e) return 0.35 + 0.65 * Math.abs(Math.sin((t - w.s) * 22)); } return 0; }
  /** n. kelimenin başladığı kare (0'dan) */
  W(n) { const w = this.words[clamp(n, 0, this.words.length - 1)]; return w ? Math.round(w.s * this.fps) : 0; }
  /** metin geçen ilk kelimenin karesi (k. tekrar) */
  at(text, k = 0) { const q = text.toLocaleLowerCase("tr"); let n = 0; for (const w of this.words) if (w.w.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "").startsWith(q)) { if (n++ === k) return Math.round(w.s * this.fps); } return -1; }

  // ---------- çekim tablosu (kelimeye bağlı) ----------
  /** son kare: seslendirmenin son kelimesi + kuyruk (E.tail sn) */
  endFrame() { const n = this.words.length; return Math.ceil(((n ? this.words[n - 1].e : 10) + (this.tail ?? 0.7)) * this.fps); }
  /** cues = [[ad], [ad, "kelime"], [ad, "kelime", k], [ad, {last: 2}], [ad, {frame: 120}]].
   *  Çekim, kelimenin geçtiği kareden `lead` kare önce başlar; ilk çekim her zaman 0'dan başlar.
   *  Kelime bulunamazsa önceki çekimden 45 kare sonra başlar; seslendirme yoksa süre eşit bölünür. */
  shots(cues, o = {}) {
    const lead = o.lead ?? 2, n = this.words.length, end = this.endFrame();
    const list = cues.map((c, i) => {
      const [name, q, k] = c; let f0 = -1;
      if (q && typeof q === "object") f0 = q.frame ?? (n ? this.W(n - (q.last || 1)) - lead : -1);
      else if (typeof q === "string") { const a = this.at(q, k || 0); f0 = a >= 0 ? a - lead : -1; }
      return { name, f0 };
    });
    if (!n) list.forEach((s, i) => (s.f0 = Math.round((i * end) / list.length)));
    list.forEach((s, i) => { if (s.f0 < 0) s.f0 = i ? list[i - 1].f0 + 45 : 0; if (i && s.f0 <= list[i - 1].f0) s.f0 = list[i - 1].f0 + 1; });
    list[0].f0 = 0;
    this._shots = list; this._end = end; return list;
  }
  /** f karesinin çekimi: { i, name, f0, f1, len, t, u, w(kelime, k, oran), index(ad) } */
  shot(f) {
    const L = this._shots; if (!L) throw new Error("önce build içinde E.shots(...) çağır");
    let i = 0; while (i < L.length - 1 && f >= L[i + 1].f0) i++;
    const f0 = L[i].f0, f1 = (L[i + 1] || { f0: this._end }).f0, len = Math.max(1, f1 - f0), t = f - f0, self = this;
    return { i, name: L[i].name, f0, f1, len, t, u: clamp(t / len),
      /** kelimenin karesi; seslendirmede yoksa çekim süresinin `frac` oranındaki kare */
      w(text, k = 0, frac = 0.5) { const a = self.at(text, k); return a >= 0 ? a : Math.round(f0 + len * frac); },
      index(name) { return L.findIndex((s) => s.name === name); } };
  }

  // ---------- hazır kamera hareketleri (hepsi camAt döner: süzülme dahil) ----------
  /** iki konum arası (itme, çekme, yükselme): from/to = {pos, look, fov} */
  move(f, f0, f1, from, to, o = {}) { return this.camAt(f, [{ f: f0, ...from }, { f: f1, ...to }], o); }
  /** sabit noktadan bakışı kaydırma */
  pan(f, f0, f1, pos, look0, look1, o = {}) { return this.camAt(f, [{ f: f0, pos, look: look0, fov: o.fov }, { f: f1, pos, look: look1, fov: o.fov1 ?? o.fov }], o); }
  /** merkez etrafında dönme: a0 → a1 radyan (0 = merkezin +z tarafı) */
  orbit(f, f0, f1, o = {}) {
    const { center = [0, 1.5, 0], radius = 5, height = 2, a0 = 0, a1 = 0.6, fov = 42 } = o;
    const a = lerp(a0, a1, (o.ease || smooth)(span(f, f0, f1)));
    return this.camAt(f, [{ f: 0, pos: [center[0] + Math.sin(a) * radius, height, center[2] + Math.cos(a) * radius], look: [center[0], o.lookY ?? center[1], center[2]], fov }], o);
  }
  /** hedef takibi: target = [x,y,z] ya da (f) => [x,y,z]; offset = kameranın hedefe göre konumu */
  follow(f, target, o = {}) {
    const { offset = [0, 0.4, 4], fov = 42, lag = 0 } = o, p = typeof target === "function" ? target(f - lag) : target;
    return this.camAt(f, [{ f: 0, pos: [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]], look: [p[0], p[1] + (o.lookUp ?? 0), p[2]], fov }], o);
  }

  // ---------- yürüyüş ve kalabalık ----------
  /** pts = [[x,z],...] ya da [[x,y,z],...] yolu boyunca f0..f1 arası yürüyüş.
   *  Dönen: { pos, legs, phase, flip, moving, dir } → st ve aktör yerleşimine doğrudan verilir. */
  walk(f, f0, f1, pts, o = {}) {
    const P = pts.map((p) => (p.length === 2 ? [p[0], o.y || 0, p[1]] : p)), seg = []; let L = 0;
    for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][2] - P[i - 1][2]); seg.push(d); L += d; }
    const d = (o.ease || ((x) => x))(span(f, f0, f1)) * L; let acc = 0, i = 0;
    while (i < seg.length - 1 && acc + seg[i] < d) { acc += seg[i]; i++; }
    const k = seg[i] ? (d - acc) / seg[i] : 0, A = P[i], B = P[i + 1] || A, moving = f >= f0 && f < f1 && L > 0;
    return { pos: [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)], legs: moving ? (o.run ? "run" : "walk") : "stand",
      phase: d / (o.stride || 1.1), flip: B[0] - A[0] > 0, moving, dir: [B[0] - A[0], B[2] - A[2]] };
  }
  /** kalabalık: ids'i center çevresinde w x d alana dağıtır; aktör yerleşimleri döner (A.push(...E.crowd(...))) */
  crowd(f, ids, o = {}) {
    const { center = [0, 0, 0], w = 4, d = 2, seed = 1, faces = ["happy", "neutral", "talk", "smug", "wow", "think"], arms = ["hang", "cross", "hip", "point", "chin", "hang"] } = o;
    let sd = (seed * 9301 + 49297) >>> 0; const r = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
    return ids.map((id, i) => {
      const x = center[0] + (r() - 0.5) * w, z = center[2] + (r() - 0.5) * d, fi = Math.floor(r() * faces.length), ai = Math.floor(r() * arms.length);
      const st = { face: o.face || faces[fi], arms: o.arms || arms[ai], blink: this.blink(f, i + seed), ...this.idle(f, i + seed), look: clamp((center[0] - x) * 0.3, -1, 1) };
      if (o.cheer) st.bob = 14 * Math.abs(Math.sin(f / 6 + i));
      return { id, pos: [x, center[1], z], st };
    });
  }

  // ---------- nesne havuzu ----------
  /** make(i) ile n kopya kurar. Her kare başında hepsi gizlenir; frame içinde place(i, x, y, z, o) ile gösterilir.
   *  o: { dir:[dx,dz] | yaw, s, hop, roll } + nesnenin pose seçenekleri (run, tail, flap, wag, roll...) */
  pool(n, make) {
    const items = []; for (let i = 0; i < n; i++) { const g = make(i); g.visible = false; items.push(g); }
    const P = { items, place: (i, x, y, z, o = {}) => {
      const g = items[i]; if (!g) return null;
      g.visible = true; g.position.set(x, y + (o.hop || 0), z);
      g.rotation.set(0, o.dir ? Math.atan2(-o.dir[1], o.dir[0]) : (o.yaw ?? 0), o.roll || 0); g.scale.setScalar(o.s ?? 1);
      if (g.userData.pose) g.userData.pose(o); return g; } };
    (this._pools ||= []).push(P); return P;
  }
  beginFrame() { for (const P of this._pools || []) for (const g of P.items) g.visible = false; }

  // ---------- kadraj kontrolü ----------
  /** son render edilen kare için sorun listesi (render.py stills/check modları yazdırır) */
  check(S) {
    const out = [], cam = this.camera, tmp = new THREE.Vector3(), box = new THREE.Box3(), dir = cam.getWorldDirection(new THREE.Vector3());
    const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const solid = [];
    this.scene.traverse((o) => { if (o.isMesh && !o.userData.card && !o.userData.noink && !o.userData.blob && o !== this.sky && shown(o)) solid.push(o); });
    for (const o of solid) {
      const ty = o.geometry && o.geometry.type; if (ty !== "BoxGeometry" && ty !== "CylinderGeometry") continue;
      box.setFromObject(o).expandByScalar(-0.03);
      if (box.containsPoint(cam.position)) { out.push("kamera bir nesnenin içinde (" + ty.replace("Geometry", "") + " @ " + o.getWorldPosition(tmp).toArray().map((v) => v.toFixed(1)).join(", ") + ")"); break; }
    }
    if (cam.position.y < 0.05) out.push("kamera zeminin altında");
    const ray = new THREE.Raycaster();
    for (const s of S.actors || []) {
      const a = this.actors.get(s.id); if (!a) { out.push("tanımsız aktör: " + s.id); continue; }
      const p = s.pos || [0, 0, 0], sc = s.scale || 1, head = new THREE.Vector3(p[0], p[1] + a.h * 0.8 * sc, p[2]);
      if (head.clone().sub(cam.position).dot(dir) <= 0) { out.push(s.id + ": kameranın arkasında"); continue; }
      const n = head.clone().project(cam);
      if (Math.abs(n.x) > 1 || Math.abs(n.y) > 1) { out.push(s.id + ": yüzü kadraj dışında"); continue; }
      if (Math.abs(n.x) > 0.85 || n.y > 0.9) out.push(s.id + ": yüzü kadraj kenarında");
      const dist = head.distanceTo(cam.position); ray.set(cam.position, head.clone().sub(cam.position).normalize()); ray.far = Math.max(0.1, dist - 0.3);
      const hit = ray.intersectObjects(solid, false)[0];
      if (hit) out.push(s.id + ": yüzünün önünde nesne var (kameradan " + hit.distance.toFixed(1) + " m)");
    }
    return out;
  }

  // ---------- kapak başlığı ----------
  /** kapak için büyük başlık (üstte) + isteğe bağlı alt satır hapı */
  drawTitle(g, w, h, title, sub) {
    const k = w / 1080, maxW = w * 0.86; let size = 132;
    g.save(); g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
    const wrap = (sz) => { g.font = `900 ${sz * k}px ReelsFont, Nunito, Arial, sans-serif`; const L = [""]; for (const word of String(title).split(/\s+/)) { const t = L[L.length - 1] ? L[L.length - 1] + " " + word : word; if (g.measureText(t).width > maxW && L[L.length - 1]) L.push(word); else L[L.length - 1] = t; } return L; };
    let lines = wrap(size); while ((lines.length > 3 || lines.some((l) => g.measureText(l).width > maxW)) && size > 60) lines = wrap((size -= 6));
    const lh = size * k * 1.08, y0 = h * 0.15;
    lines.forEach((l, i) => { g.lineWidth = 22 * k; g.strokeStyle = INK; g.strokeText(l, w / 2, y0 + i * lh); g.fillStyle = "#ffffff"; g.fillText(l, w / 2, y0 + i * lh); });
    if (sub) {
      g.font = `900 ${54 * k}px ReelsFont, Nunito, Arial, sans-serif`; const sw = g.measureText(sub).width + 70 * k, sy = y0 + lines.length * lh + 20 * k;
      g.fillStyle = "#ffcf4a"; g.strokeStyle = INK; g.lineWidth = 8 * k; g.beginPath(); g.roundRect(w / 2 - sw / 2, sy - 40 * k, sw, 80 * k, 40 * k); g.fill(); g.stroke();
      g.fillStyle = INK; g.fillText(sub, w / 2, sy);
    }
    g.restore();
  }

  // ---------- kare ----------
  render(f, S) {
    if (!S || !S.cam || !S.cam.pos || !S.cam.look) throw new Error(`kare ${f}: frame() kamera döndürmedi (cam: {pos, look}). Bu karenin çekimi için switch'te bir case ya da default yaz.`);
    const cam = this.camera, c = S.cam;
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); if (c.roll) cam.rotateZ(c.roll); cam.fov = c.fov || 40; cam.updateProjectionMatrix();
    if (S.light) { if (Array.isArray(S.light)) this.setLight(S.light[0], S.light[1], S.light[2]); else this.setLight(S.light); }
    // güneş + gölge kamerası aksiyona ortalı
    const L = this.L, az = (L.az * Math.PI) / 180, el = (L.el * Math.PI) / 180;
    const tgt = new THREE.Vector3(...(S.focusPt || c.look));
    this.sun.target.position.copy(tgt); this.sun.position.set(tgt.x + Math.cos(el) * Math.sin(az) * 60, tgt.y + Math.sin(el) * 60, tgt.z + Math.cos(el) * Math.cos(az) * 60);
    this.sky.position.copy(cam.position);
    // aktörler
    for (const a of this.actors.values()) a.mesh.visible = a.blob.visible = false;
    for (const s of S.actors || []) { const a = this.actors.get(s.id); if (a) this._placeActor(a, s, cam); }
    this.fxPool.forEach((m) => (m.visible = false));
    (S.fx || []).forEach((s, i) => this._fx(i, s, cam));
    this.scene.traverse((o) => { if (o.userData.bill) o.lookAt(cam.position.x, o.position.y, cam.position.z); });
    if (S.update) S.update();
    // 1) renk
    const gl = this.gl;
    gl.setRenderTarget(this.rtColor); gl.setClearColor(0x000000, 1); gl.clear(); gl.render(this.scene, cam);
    // 2) normal + derinlik
    const saved = [];
    this.scene.traverse((o) => {
      if (!o.isMesh && !o.isSprite) return;
      if (o.userData.noink || !o.visible) { if (o.visible) { saved.push([o, o.material, true]); o.visible = false; } return; }
      let m = this.ndMat;
      if (o.userData.card) { if (!o.userData.nd) { o.userData.nd = this.ndMat.clone(); o.userData.nd.uniforms.uCard.value = 1; } m = o.userData.nd; m.uniforms.map.value = o.material.map; }
      saved.push([o, o.material, false]); o.material = m;
    });
    const fog = this.scene.fog; this.scene.fog = null; const shadows = gl.shadowMap.enabled; gl.shadowMap.enabled = false;
    gl.setRenderTarget(this.rtND); gl.setClearColor(new THREE.Color(0.5, 0.5, 1.0), 1); gl.setClearAlpha(1); gl.clear(); gl.render(this.scene, cam);
    for (const [o, m, hid] of saved) { if (hid) o.visible = true; else o.material = m; }
    this.scene.fog = fog; gl.shadowMap.enabled = shadows;
    // 3) mürekkep + renk
    const u = this.compMat.uniforms; u.uFlash.value = S.flash || 0; u.uFlashCol.value.set(S.flashCol || "#ffffff"); u.uTime.value = f * 0.37; u.uFade.value = S.fade ?? 1;
    if (S.grade) for (const k in S.grade) if (u[k]) u[k].value = S.grade[k];
    this.fsQuad.material = this.compMat; gl.setRenderTarget(this.rtComp); gl.render(this.fsScene, this.fsCam);
    // 4) alan derinliği
    const dof = S.dof || {}, du = this.dofMat.uniforms;
    let focus = dof.focus ?? 6; if (Array.isArray(focus)) focus = cam.position.distanceTo(new THREE.Vector3(...focus));
    du.uFocus.value = focus; du.uAmt.value = (dof.amount ?? 0) * this.scale * (this.H / 1920); du.uRange.value = dof.range ?? Math.max(1.5, focus * 0.35);
    this.fsQuad.material = this.dofMat; gl.setRenderTarget(null); gl.render(this.fsScene, this.fsCam);
    // 5) 2D katman
    const g = this.og; g.drawImage(gl.domElement, 0, 0);
    if (S.overlay) S.overlay(g, this.rw, this.rh, this.scale);
    if (this.captions && S.caption !== false) this._caption(f, g);
    return this.out;
  }
  _caption(f, g) {
    if ((this.capStyle || {}).mode === "chunk") return this._captionChunk(f, g);
    const t = f / this.fps; let w = null;
    for (let i = 0; i < this.words.length; i++) { const x = this.words[i], nx = this.words[i + 1]; const end = nx ? Math.min(nx.s, x.e + 0.35) : x.e + 0.4; if (t >= x.s && t < end) { w = x; break; } }
    if (!w) return;
    const st = { size: 88, y: 0.655, fill: "#ffffff", stroke: INK, ...this.capStyle };
    const k = this.rw / 1080, age = t - w.s, pop = 1 + 0.18 * Math.exp(-age * 18) * Math.cos(age * 30);
    const txt = w.w.replace(/^[^\p{L}\p{N}]+|[,;:]+$/gu, "");
    g.save(); g.translate(this.rw / 2, this.rh * st.y); g.scale(pop, pop);
    g.font = `900 ${st.size * k}px ReelsFont, Nunito, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineJoin = "round"; g.lineWidth = 16 * k; g.strokeStyle = st.stroke; g.strokeText(txt, 0, 0);
    g.fillStyle = st.fill; g.fillText(txt, 0, 0); g.restore();
  }

  /** blok altyazı: capStyle = { mode: "chunk", n: 3, hi: "#ffcf4a", size, y, fill, stroke } — o an okunan kelime vurgulanır */
  _captionChunk(f, g) {
    const st = { size: 76, y: 0.655, fill: "#ffffff", stroke: INK, n: 3, hi: "#ffcf4a", ...this.capStyle }, W = this.words, t = f / this.fps;
    if (!this._chk || this._chkN !== st.n) { const C = []; let cur = []; W.forEach((w, i) => { cur.push(i); if (cur.length >= st.n || /[.!?…;:,]$/.test(w.w) || i === W.length - 1) { C.push(cur); cur = []; } }); this._chk = C; this._chkN = st.n; }
    const C = this._chk; let c = null;
    for (let i = 0; i < C.length; i++) { const s0 = W[C[i][0]].s, nx = C[i + 1] ? W[C[i + 1][0]].s : Infinity, e = Math.min(nx, W[C[i][C[i].length - 1]].e + 0.4); if (t >= s0 && t < e) { c = C[i]; break; } }
    if (!c) return;
    const k = this.rw / 1080, clean = (x) => x.replace(/^[^\p{L}\p{N}]+|[,;:]+$/gu, ""), fs = st.size * k;
    g.save(); g.font = `900 ${fs}px ReelsFont, Nunito, Arial, sans-serif`; g.textBaseline = "middle"; g.textAlign = "center"; g.lineJoin = "round"; g.lineWidth = 15 * k; g.strokeStyle = st.stroke;
    const sp = g.measureText(" ").width, maxW = this.rw * 0.86, lines = [[]]; let lw = 0;
    for (const wi of c) { const txt = clean(W[wi].w), ww = g.measureText(txt).width; if (lw && lw + sp + ww > maxW) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ wi, txt, ww }); lw += (lw ? sp : 0) + ww; }
    const lh = fs * 1.15, y0 = this.rh * st.y - ((lines.length - 1) * lh) / 2;
    lines.forEach((L, li) => {
      let x = this.rw / 2 - (L.reduce((a, p) => a + p.ww, 0) + sp * (L.length - 1)) / 2;
      for (const p of L) {
        const w = W[p.wi], cur = t >= w.s && (!W[p.wi + 1] || p.wi === c[c.length - 1] || t < W[p.wi + 1].s), age = t - w.s;
        const pop = cur ? 1 + 0.12 * Math.exp(-age * 18) * Math.cos(age * 30) : 1;
        g.save(); g.translate(x + p.ww / 2, y0 + li * lh); g.scale(pop, pop); g.strokeText(p.txt, 0, 0); g.fillStyle = cur ? st.hi : st.fill; g.fillText(p.txt, 0, 0); g.restore();
        x += p.ww + sp;
      }
    });
    g.restore();
  }
}
