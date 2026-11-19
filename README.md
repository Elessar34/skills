# skills

Claude Code için Türkçe skill'ler.

| Skill | Ne yapar |
|---|---|
| [oyun-mekanik](oyun-mekanik/SKILL.md) | Bir fikri seni adım adım sorgulayarak net bir PRD'ye (ürün gereksinim belgesi) çevirir ve `prd.md` olarak yazar. Kod yazdırmadan önce kapsamı, kararları ve kabul kriterlerini netleştirir. |
| [reels-animasyon](reels-animasyon/SKILL.md) | Seslendirmeli, dikey (9:16) çizgi film animasyonu üretir: 10 hikâye fikri, Türkçe anlatım metni, seslendirme (ElevenLabs API ile ya da senin yüklediğin ses), ardından altyazılı, müzikli ve efektli bitmiş MP4. Karakterler, 3D sahneler, hayvanlar, müzik ve efektler tamamen kodla üretilir. Kapak ve paylaşım metni de çıkarır. Python 3.9+ ve ffmpeg gerektirir; geri kalanını `kit/tools/setup.py` kurar. |

## Kurulum

Skill klasörünü Claude Code'un skill klasörüne kopyala:

```bash
git clone https://github.com/Elessar34/skills.git
mkdir -p ~/.claude/skills
cp -r skills/oyun-mekanik ~/.claude/skills/
cp -r skills/reels-animasyon ~/.claude/skills/
```

Yalnızca bir projede kullanmak istersen klasörü o projenin `.claude/skills/` klasörüne kopyala.

## Kullanım

Claude Code'da "şöyle bir oyun yapmak istiyorum", "bunu planlayalım", "PRD çıkar" gibi bir şey yazman yeterli; skill kendiliğinden devreye girer. Ya da doğrudan `/oyun-mekanik` yaz.

`reels-animasyon` ilk kullanımda kendi ortamını kurar (`python3 ~/.claude/skills/reels-animasyon/kit/tools/setup.py`). ElevenLabs ile seslendirme için anahtarını `~/.reels-animasyon/.env` dosyasına `ELEVENLABS_API_KEY=...` satırı olarak yaz; anahtarı sohbete yapıştırma.

Animasyon için "animasyon short yap", "çizgi film videosu", "bu seslendirmeyi animasyona çevir" demen ya da `/reels-animasyon` yazman yeterli.
