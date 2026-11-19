#!/usr/bin/env python3
"""reels-animasyon · kurulum. Sisteme dokunmadan ayrı bir Python ortamı (venv) kurar ve gerekenleri yükler.

Kullanım:
  python3 setup.py            # ~/.reels-animasyon/venv kur + numpy, Pillow, playwright, imageio-ffmpeg yükle
                              #   (sistemde Google Chrome yoksa Playwright Chromium'u da indirir, ~150 MB)
  python3 setup.py --check    # hiçbir şey kurmadan durumu yazar
  python3 setup.py --venv <klasör>   # farklı konum
Sonra tüm araçları bu ortamın Python'u ile çalıştır (son satırda yazar):
  ~/.reels-animasyon/venv/bin/python tools/render.py . stills 10,60
Yalnızca Python standart kütüphanesi kullanır; Python 3.9+ gerekir.
"""
import sys, os, shutil, subprocess, argparse, platform

PKGS = ["numpy", "pillow", "playwright", "imageio-ffmpeg"]
WIN = platform.system() == "Windows"


def venv_python(v): return os.path.join(v, "Scripts" if WIN else "bin", "python.exe" if WIN else "python")


def system_chrome():
    if os.environ.get("CHROME") and os.path.exists(os.environ["CHROME"]): return os.environ["CHROME"]
    for p in [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]:
        if os.path.exists(p): return p
    for n in ("google-chrome", "chromium", "chromium-browser"):
        if shutil.which(n): return shutil.which(n)
    return None


def probe(py):
    """venv içindeki paketleri ve tarayıcıyı yoklar."""
    code = r'''
import json, os, shutil
r = {}
for m in ("numpy", "PIL", "playwright", "imageio_ffmpeg"):
    try: __import__(m); r[m] = True
    except Exception: r[m] = False
ff = shutil.which("ffmpeg")
if not ff and r["imageio_ffmpeg"]:
    import imageio_ffmpeg; ff = imageio_ffmpeg.get_ffmpeg_exe()
r["ffmpeg"] = ff
r["chromium"] = None
if r["playwright"]:
    try:
        from playwright.sync_api import sync_playwright
        p = sync_playwright().start(); ex = p.chromium.executable_path; p.stop()
        r["chromium"] = ex if os.path.exists(ex) else None
    except Exception: pass
print(json.dumps(r))
'''
    try:
        out = subprocess.run([py, "-c", code], capture_output=True, text=True, timeout=120)
        import json; return json.loads(out.stdout.strip().splitlines()[-1])
    except Exception: return None


def report(v):
    py = venv_python(v); chrome = system_chrome(); ok = True
    print(f"Python (sistem): {sys.version.split()[0]}" + ("" if sys.version_info >= (3, 9) else "  ✗ 3.9+ gerekli"))
    if not os.path.exists(py): print(f"ortam: {v}  ✗ kurulu değil"); return False
    r = probe(py) or {}
    print(f"ortam: {v}  ✓")
    for k, name in (("numpy", "numpy"), ("PIL", "Pillow"), ("playwright", "playwright")):
        print(f"  {name:11s} {'✓' if r.get(k) else '✗'}"); ok &= bool(r.get(k))
    print(f"  ffmpeg      {'✓ ' + r['ffmpeg'] if r.get('ffmpeg') else '✗'}"); ok &= bool(r.get("ffmpeg"))
    br = chrome or r.get("chromium")
    print(f"  tarayıcı    {'✓ ' + br if br else '✗ (Chrome yok, Playwright Chromium indirilmemiş)'}"); ok &= bool(br)
    return ok


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--venv", default=os.path.join(os.path.expanduser("~"), ".reels-animasyon", "venv"))
    ap.add_argument("--check", action="store_true"); ap.add_argument("--chromium", action="store_true", help="Chrome olsa da Playwright Chromium indir")
    a = ap.parse_args(); v = os.path.abspath(os.path.expanduser(a.venv)); py = venv_python(v)
    if a.check:
        ok = report(v); print(("HAZIR" if ok else "EKSİK VAR → python3 setup.py") + f"\nPY={py}"); sys.exit(0 if ok else 1)
    if sys.version_info < (3, 9): sys.exit("HATA: Python 3.9+ gerekli.")
    if not os.path.exists(py):
        print(f"ortam kuruluyor: {v}"); os.makedirs(os.path.dirname(v), exist_ok=True)
        subprocess.run([sys.executable, "-m", "venv", v], check=True)
    print("paketler yükleniyor: " + ", ".join(PKGS))
    subprocess.run([py, "-m", "pip", "install", "-q", "--disable-pip-version-check", *PKGS], check=True)
    r = probe(py) or {}
    if a.chromium or not (system_chrome() or r.get("chromium")):
        print("Playwright Chromium indiriliyor (~150 MB)...")
        subprocess.run([py, "-m", "playwright", "install", "chromium"], check=True)
    print()
    ok = report(v)
    print(("HAZIR" if ok else "EKSİK VAR (yukarıya bak)") + f"\nPY={py}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
