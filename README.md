# skills

Claude Code için Türkçe skill'ler.

| Skill | Ne yapar |
|---|---|
| [oyun-mekanik](oyun-mekanik/SKILL.md) | Bir fikri seni adım adım sorgulayarak net bir PRD'ye (ürün gereksinim belgesi) çevirir ve `prd.md` olarak yazar. Kod yazdırmadan önce kapsamı, kararları ve kabul kriterlerini netleştirir. |

## Kurulum

Skill klasörünü Claude Code'un skill klasörüne kopyala:

```bash
git clone https://github.com/Elessar34/skills.git
mkdir -p ~/.claude/skills
cp -r skills/oyun-mekanik ~/.claude/skills/
```

Yalnızca bir projede kullanmak istersen klasörü o projenin `.claude/skills/` klasörüne kopyala.

## Kullanım

Claude Code'da "şöyle bir oyun yapmak istiyorum", "bunu planlayalım", "PRD çıkar" gibi bir şey yazman yeterli; skill kendiliğinden devreye girer. Ya da doğrudan `/oyun-mekanik` yaz.
