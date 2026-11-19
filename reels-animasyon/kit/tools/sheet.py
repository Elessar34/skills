#!/usr/bin/env python3
"""reels-animasyon · kontak sayfası.  python sheet.py <kare_klasörü> <çıktı.jpg> [sütun=6]
Yalnızca f00000.jpg biçimindeki kareleri alır. Pillow varsa kare numaralarını yazar; yoksa ffmpeg ile etiketsiz döşer."""
import sys, os, re, glob, math, shutil, subprocess
if len(sys.argv) < 3: sys.exit(__doc__)
src, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
fs = sorted(f for f in glob.glob(os.path.join(src, "*.jpg")) if re.fullmatch(r"f\d+\.jpg", os.path.basename(f)))
if not fs: sys.exit("kare yok")
W, H = 270, 480; rows = (len(fs) + cols - 1) // cols
try:
    from PIL import Image, ImageDraw
except ImportError:
    ff = shutil.which("ffmpeg")
    if not ff:
        try: import imageio_ffmpeg; ff = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception: sys.exit("Pillow ya da ffmpeg gerekli (python3 tools/setup.py)")
    lst = out + ".txt"
    with open(lst, "w") as fh:
        for f in fs: fh.write(f"file '{os.path.abspath(f)}'\nduration 1\n")
    subprocess.run([ff, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-vf", f"scale={W}:{H},tile={cols}x{rows}", "-frames:v", "1", out], check=True)
    os.remove(lst); print("->", out, f"({len(fs)} kare, etiketsiz)"); sys.exit(0)
im = Image.new("RGB", (cols * W, rows * H), "#111")
d = ImageDraw.Draw(im)
for i, f in enumerate(fs):
    x, y = (i % cols) * W, (i // cols) * H
    im.paste(Image.open(f).convert("RGB").resize((W, H)), (x, y))
    d.rectangle([x, y, x + 70, y + 22], fill="#000"); d.text((x + 4, y + 4), os.path.basename(f)[1:-4].lstrip("0") or "0", fill="#ff0")
im.save(out, quality=85); print("->", out, f"({len(fs)} kare)")
