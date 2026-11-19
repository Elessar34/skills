#!/usr/bin/env python3
"""reels-animasyon · uçtan uca kontrol: kit bu bilgisayarda gerçekten çalışıyor mu?

Kullanım (kit içinden, kurulum ortamının Python'u ile):
  ~/.reels-animasyon/venv/bin/python <skill>/kit/tools/check.py [--keep] [--cpu]
Geçici bir projeye örnek hikâyeyi kurar, sentetik bir test sesi üretir ve şu adımları sırayla dener:
zamanlama → 3 kare render → kadraj kontrolü → kapak → ses karışımı → kontak sayfası → 1 sn'lik MP4.
Her adımın sonucunu yazar; hepsi geçerse "KİT HAZIR" der. --keep geçici projeyi silmez.
"""
import sys, os, json, time, wave, shutil, tempfile, subprocess, argparse

TOOLS = os.path.dirname(os.path.abspath(__file__)); KIT = os.path.dirname(TOOLS); PY = sys.executable


def tone_voice(path, words):
    """Kelime aralıklarında yumuşak ton, aralarda sessizlik: timing.py'nin sessizlik yöntemi bunu çözebilir."""
    import numpy as np
    sr = 22050; dur = words[-1]["e"] + 0.6; x = np.zeros(int(dur * sr), dtype=np.float32)
    for i, w in enumerate(words):
        a, b = int(w["s"] * sr), int(w["e"] * sr); n = max(1, b - a); t = np.arange(n) / sr
        x[a:b] += 0.25 * np.sin(2 * np.pi * (180 + 20 * (i % 5)) * t) * np.hanning(n)
    with wave.open(path, "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr); f.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--keep", action="store_true"); ap.add_argument("--cpu", action="store_true"); a = ap.parse_args()
    if not os.path.isdir(os.path.join(KIT, "example")): sys.exit("HATA: check.py kit klasörünün içinden çalıştırılmalı (<skill>/kit/tools/check.py).")
    tmp = tempfile.mkdtemp(prefix="reels-check-"); proj = os.path.join(tmp, "proje"); results = []; t_all = time.time()
    ex = [] if not a.cpu else ["--cpu"]

    def step(name, cmd=None, fn=None, expect=None, env=None):
        t0 = time.time(); ok, info = True, ""
        try:
            if cmd:
                r = subprocess.run(cmd, cwd=proj if os.path.isdir(proj) else tmp, capture_output=True, text=True, timeout=900, env={**os.environ, **(env or {})})
                info = (r.stdout + r.stderr).strip().splitlines()
                ok = r.returncode == 0; info = "\n      ".join(info[-6:]) if not ok else (info[-1] if info else "")
            if fn: info = fn() or info
            if ok and expect:
                miss = [e for e in expect if not os.path.exists(os.path.join(proj, e))]
                if miss: ok, info = False, "eksik çıktı: " + ", ".join(miss)
        except Exception as e: ok, info = False, f"{type(e).__name__}: {e}"
        results.append(ok); print(f"{'✓' if ok else '✗'} {name} ({time.time() - t0:.1f} sn){' — ' + info if info else ''}", flush=True)
        return ok

    print(f"kit: {KIT}\ngeçici proje: {proj}\n")
    def deps():
        import numpy, PIL, playwright  # noqa
        ff = shutil.which("ffmpeg")
        if not ff: import imageio_ffmpeg; ff = imageio_ffmpeg.get_ffmpeg_exe()
        return "numpy, Pillow, playwright, ffmpeg tamam"
    if not step("bağımlılıklar", fn=deps):
        print("\nÖnce kurulum: python3 " + os.path.join(TOOLS, "setup.py")); sys.exit(1)
    step("proje kurulumu", [PY, os.path.join(TOOLS, "new_project.py"), proj], expect=["story.js", "engine/index.html", "tools/render.py"])
    def prep():
        for f in ("script.txt", "sound.json"): shutil.copy(os.path.join(KIT, "example", f), os.path.join(proj, f))
        words = json.load(open(os.path.join(KIT, "example", "words.json"), encoding="utf-8"))
        tone_voice(os.path.join(proj, "work", "voice.wav"), words); s = json.load(open(os.path.join(proj, "sound.json"))); s["voice"] = "work/voice.wav"
        json.dump(s, open(os.path.join(proj, "sound.json"), "w")); return f"{len(words)} kelimelik test sesi"
    step("test sesi", fn=prep, expect=["work/voice.wav"])
    step("zamanlama (timing.py)", [PY, "tools/timing.py", "."], expect=["work/words.json", "work/phrases.json"], env={"NO_WHISPER": "1"})
    step("kare render (3 kare)", [PY, "tools/render.py", ".", "stills", "5,330,800", "--scale", "0.5", *ex], expect=["stills/f00005.jpg", "stills/f00330.jpg", "stills/f00800.jpg"])
    step("kadraj kontrolü", [PY, "tools/render.py", ".", "check", "--every", "90", "--scale", "0.5", *ex])
    step("kapak", [PY, "tools/render.py", ".", "cover", "400", "--title", "Fareye Ödül Verdiler", "--sub", "Hanoi, 1902", "--scale", "0.5", *ex], expect=["out/cover.jpg"])
    step("ses karışımı (audio.py)", [PY, "tools/audio.py", "."], expect=["out/mix.wav"])
    step("kontak sayfası (sheet.py)", [PY, "tools/sheet.py", "stills", "stills/sheet.jpg"], expect=["stills/sheet.jpg"])
    def mini_finish():
        fr = os.path.join(proj, "frames"); os.makedirs(fr, exist_ok=True)
        r = subprocess.run([PY, "tools/render.py", ".", "frames", "0-29", "--scale", "0.5", *ex], cwd=proj, capture_output=True, text=True, timeout=900)
        if r.returncode: raise RuntimeError(r.stdout[-300:] + r.stderr[-300:])
        ff = shutil.which("ffmpeg")
        if not ff: import imageio_ffmpeg; ff = imageio_ffmpeg.get_ffmpeg_exe()
        r = subprocess.run([ff, "-v", "error", "-y", "-framerate", "30", "-i", os.path.join(fr, "f%05d.jpg"), "-i", os.path.join(proj, "out", "mix.wav"),
                            "-t", "1", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", os.path.join(proj, "out", "deneme.mp4")], capture_output=True, text=True)
        if r.returncode: raise RuntimeError(r.stderr[-300:])
        return "30 kare + ses → out/deneme.mp4"
    step("video kodlama (1 sn)", fn=mini_finish, expect=["out/deneme.mp4"])

    ok = all(results)
    print(f"\n{'KİT HAZIR' if ok else 'SORUN VAR'} · {sum(results)}/{len(results)} adım · {time.time() - t_all:.0f} sn")
    if a.keep or not ok: print("geçici proje duruyor:", proj)
    else: shutil.rmtree(tmp, ignore_errors=True)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
