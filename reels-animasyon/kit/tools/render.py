#!/usr/bin/env python3
"""reels-animasyon · kareleri render eder (Playwright + Chromium).
Kullanım:
  python render.py <proje> frames            # tüm kareler -> <proje>/frames/f00000.jpg
  python render.py <proje> frames 0-299      # aralık
  python render.py <proje> stills 10,60,140  # tek kareler -> <proje>/stills/ (+ her kare için kadraj uyarıları)
  python render.py <proje> check             # her 10. karede kadraj kontrolü (render kaydetmez); --every 5
  python render.py <proje> cover 450 --title "Başlık" [--sub "alt satır"]   # -> <proje>/out/cover.jpg
Seçenekler: --scale 0.75  --cpu (GPU yoksa SwiftShader)  --resume  --out klasor
"""
import sys, os, time, json, base64, threading, functools, http.server, argparse, shutil, platform

def serve(root):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
        def end_headers(self):
            self.send_header("Cache-Control", "no-store"); super().end_headers()
    Q.extensions_map.update({".js": "text/javascript", ".mjs": "text/javascript", ".ttf": "font/ttf"})
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Q, directory=root))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def find_chrome():
    if os.environ.get("CHROME"): return os.environ["CHROME"]
    for p in [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]:
        if os.path.exists(p): return p
    return None  # Playwright'ın kendi Chromium'u

def parse_list(s, n):
    out = []
    for part in s.split(","):
        part = part.strip()
        if not part: continue
        if "-" in part:
            a, b = part.split("-"); out += list(range(int(a), min(int(b), n - 1) + 1))
        else: out.append(min(int(part), n - 1))
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("proj"); ap.add_argument("mode", choices=["frames", "stills", "check", "cover"]); ap.add_argument("which", nargs="?", default=None)
    ap.add_argument("--scale", type=float, default=1.0); ap.add_argument("--cpu", action="store_true"); ap.add_argument("--resume", action="store_true")
    ap.add_argument("--out", default=None); ap.add_argument("--every", type=int, default=10)
    ap.add_argument("--title", default=""); ap.add_argument("--sub", default="")
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    root = os.path.abspath(a.proj); srv = serve(root)
    out = os.path.abspath(a.out or os.path.join(root, {"frames": "frames", "stills": "stills"}.get(a.mode, "out")))
    os.makedirs(out, exist_ok=True)
    linux = platform.system() == "Linux"
    args = ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--disable-dev-shm-usage", "--no-sandbox"]
    if a.cpu or (linux and not os.environ.get("REELS_GPU")): args += ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--use-gl=angle"]
    elif platform.system() == "Windows": args += ["--use-angle=d3d11"]
    with sync_playwright() as p:
        exe = find_chrome()
        b = p.chromium.launch(executable_path=exe, args=args) if exe else p.chromium.launch(args=args)
        pg = b.new_page(viewport={"width": 540, "height": 960})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: print("  [sayfa]", m.text) if m.type in ("error", "warning") else None)
        pg.goto(f"http://127.0.0.1:{srv.server_port}/engine/index.html?scale={a.scale}")
        try: pg.wait_for_function("window.ready === true", timeout=180000)
        except Exception:
            print("HATA: sahne yüklenemedi.", *errs, sep="\n  "); sys.exit(1)
        meta = pg.evaluate("window.META"); n = meta["frames"]
        print(f"proje: {root}\nkare: {n} ({n/meta['fps']:.2f} sn) · {meta['w']}x{meta['h']} · {'CPU' if '--use-angle=swiftshader' in args else 'GPU'}")
        if a.mode == "cover":
            f = parse_list(a.which or str(n // 3), n)[0]
            url = pg.evaluate("([f, t, s]) => window.renderCover(f, t, s)", [f, a.title, a.sub])
            dst = os.path.join(out, "cover.jpg")
            with open(dst, "wb") as fh: fh.write(base64.b64decode(url.split(",", 1)[1]))
            if errs: print("HATA:", errs[-1]); sys.exit(1)
            b.close(); print("kapak ->", dst); return
        if a.mode == "check":
            todo = parse_list(a.which, n) if a.which else list(range(0, n, max(1, a.every)))
            found = {}
            for f in todo:
                for w in pg.evaluate(f"window.checkFrame({f})"): found.setdefault(w, []).append(f)
                if errs: print("HATA (kare", f, "):", errs[-1]); sys.exit(1)
            b.close()
            if not found: print(f"kadraj kontrolü: {len(todo)} karede sorun yok"); return
            print(f"kadraj kontrolü: {len(todo)} kare tarandı, {len(found)} farklı uyarı:")
            for w, fs in sorted(found.items(), key=lambda kv: kv[1][0]):
                rng, st = [], fs[0]
                for x, y in zip(fs, fs[1:] + [None]):
                    if y is None or y - x > max(1, a.every): rng.append(f"{st}" if st == x else f"{st}-{x}"); st = y
                print(f"  kare {', '.join(rng)}: {w}")
            return
        todo = parse_list(a.which, n) if a.which else list(range(n))
        if a.resume: todo = [f for f in todo if not os.path.exists(os.path.join(out, f"f{f:05d}.jpg"))]
        t0 = time.time(); warned = 0
        for i, f in enumerate(todo):
            url = pg.evaluate(f"window.renderFrame({f})")
            with open(os.path.join(out, f"f{f:05d}.jpg"), "wb") as fh: fh.write(base64.b64decode(url.split(",", 1)[1]))
            if errs: print("HATA (kare", f, "):", errs[-1]); sys.exit(1)
            if a.mode == "stills":
                for w in pg.evaluate("window.checkLast()"): print(f"  ! kare {f}: {w}"); warned += 1
            if (i + 1) % 30 == 0 or i + 1 == len(todo):
                el = time.time() - t0; per = el / (i + 1)
                print(f"  {i+1}/{len(todo)} kare · {per:.2f} sn/kare · kalan ~{per*(len(todo)-i-1)/60:.1f} dk", flush=True)
        if a.mode == "stills": print("kadraj uyarısı yok" if not warned else f"{warned} kadraj uyarısı (yukarıda)")
        b.close()
    print("tamam ->", out)

if __name__ == "__main__":
    main()
