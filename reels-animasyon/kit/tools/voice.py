#!/usr/bin/env python3
"""reels-animasyon · ElevenLabs API ile seslendirme üretir (kelime zamanlarıyla birlikte).

Kullanım:
  python voice.py --voices [--search ad] [--lang tr]        # hesaptaki sesleri listele
  python voice.py <proje> --voice <id|ad> --preview         # ilk cümleden kısa deneme -> work/preview.mp3
  python voice.py <proje> --voice <id|ad>                   # tam seslendirme -> work/voice.mp3 + work/alignment.json
Seçenekler: --model eleven_multilingual_v2  --stability 0.5  --similarity 0.75  --style 0.0
            --speed 1.0 (0.7–1.2)  --seed 42  --lang tr (multilingual_v2 dışındaki modeller için)

Metin <proje>/script.txt dosyasından okunur. alignment.json karakter zamanlarını içerir; timing.py bunu
otomatik kullanır, böylece kelime zamanlaması tahmin değil, birebir olur.

API anahtarı (hiçbir zaman ekrana yazdırılmaz), şu sırayla aranır:
  1) ELEVENLABS_API_KEY ortam değişkeni
  2) <proje>/.env  ya da  ~/.reels-animasyon/.env  dosyasında  ELEVENLABS_API_KEY=...  satırı
Yalnızca Python standart kütüphanesi kullanılır.
"""
import sys, os, re, json, base64, hashlib, argparse, urllib.request, urllib.error, urllib.parse

BASE = os.environ.get("ELEVENLABS_BASE_URL", "https://api.elevenlabs.io").rstrip("/")
HOME_ENV = os.path.join(os.path.expanduser("~"), ".reels-animasyon", ".env")


def find_key(proj=None):
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k: return k, "ortam değişkeni"
    for p in ([os.path.join(proj, ".env")] if proj else []) + [HOME_ENV]:
        if os.path.exists(p):
            for line in open(p, encoding="utf-8"):
                m = re.match(r"\s*(?:export\s+)?ELEVENLABS_API_KEY\s*=\s*['\"]?([^'\"\s]+)", line)
                if m: return m.group(1), p
    sys.exit("HATA: ElevenLabs API anahtarı bulunamadı.\n"
             "  Anahtarı ELEVENLABS_API_KEY ortam değişkenine ya da şu dosyaya yaz:\n"
             f"    {HOME_ENV}   (içerik:  ELEVENLABS_API_KEY=xxxxxxxx)\n"
             "  Anahtar: elevenlabs.io → Profile → API Keys. Sohbete yapıştırma; dosyaya kendin yaz.")


def call(method, path, key, body=None, query=None):
    url = BASE + path + ("?" + urllib.parse.urlencode(query) if query else "")
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r: return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace"); msg = raw[:400]
        try:
            d = json.loads(raw).get("detail", raw)
            msg = d.get("message", json.dumps(d, ensure_ascii=False)) if isinstance(d, dict) else (json.dumps(d, ensure_ascii=False)[:400] if not isinstance(d, str) else d)
        except Exception: pass
        hint = {401: "anahtar geçersiz ya da yetkisiz", 402: "kredi/kota yetersiz", 422: "istek alanları hatalı", 429: "çok fazla istek, biraz bekle"}.get(e.code, "")
        sys.exit(f"HATA: ElevenLabs {e.code} {hint}\n  {msg}")
    except urllib.error.URLError as e:
        sys.exit(f"HATA: ElevenLabs'e bağlanılamadı: {e.reason}")


def list_voices(key, search=None, lang=None):
    voices, token = [], None
    while True:
        q = {"page_size": 100}
        if search: q["search"] = search
        if token: q["next_page_token"] = token
        r = call("GET", "/v2/voices", key, query=q); voices += r.get("voices", [])
        if not r.get("has_more") or not r.get("next_page_token"): break
        token = r["next_page_token"]
    if lang: voices = [v for v in voices if any(l.get("language") == lang for l in v.get("verified_languages") or []) or v.get("category") in ("cloned", "professional", "generated")]
    return voices


def resolve_voice(key, v):
    if re.fullmatch(r"[A-Za-z0-9]{20}", v): return v, v
    cands = list_voices(key, search=v)
    exact = [x for x in cands if x.get("name", "").lower() == v.lower()]
    pick = (exact or cands or [None])[0]
    if not pick: sys.exit(f"HATA: '{v}' adlı ses bulunamadı. Listelemek için: python voice.py --voices")
    return pick["voice_id"], pick.get("name", v)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("proj", nargs="?"); ap.add_argument("--voices", action="store_true"); ap.add_argument("--search")
    ap.add_argument("--voice"); ap.add_argument("--model", default="eleven_multilingual_v2"); ap.add_argument("--lang")
    ap.add_argument("--stability", type=float, default=0.5); ap.add_argument("--similarity", type=float, default=0.75)
    ap.add_argument("--style", type=float, default=0.0); ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--seed", type=int); ap.add_argument("--preview", action="store_true")
    a = ap.parse_args()
    proj = os.path.abspath(a.proj) if a.proj else None
    key, src = find_key(proj)

    if a.voices:
        vs = list_voices(key, a.search, a.lang)
        print(f"{len(vs)} ses (anahtar: {src})")
        for v in vs:
            langs = ",".join(sorted({l.get("language", "") for l in v.get("verified_languages") or []})) or "-"
            lab = v.get("labels") or {}; desc = " ".join(x for x in (lab.get("gender"), lab.get("age"), lab.get("accent"), lab.get("use_case") or lab.get("description")) if x)
            print(f"  {v['voice_id']}  {v.get('name','')[:28]:28s} {v.get('category',''):12s} diller: {langs:18s} {desc}")
        return

    if not proj or not a.voice: sys.exit("Kullanım: python voice.py <proje> --voice <id|ad> [--preview]   (sesler: --voices)")
    sp = os.path.join(proj, "script.txt")
    if not os.path.exists(sp): sys.exit("HATA: script.txt yok; seslendirilecek metni oraya yaz.")
    text = re.sub(r"\s+", " ", open(sp, encoding="utf-8").read()).strip()
    if not text: sys.exit("HATA: script.txt boş.")
    if a.preview:
        sents = re.findall(r"[^.!?…]+[.!?…]+", text) or [text]
        text = ""
        for s in sents:
            if len(text) > 90: break
            text = (text + " " + s.strip()).strip()

    voice_id, voice_name = resolve_voice(key, a.voice)
    speed = min(1.2, max(0.7, a.speed))
    body = {"text": text, "model_id": a.model,
            "voice_settings": {"stability": a.stability, "similarity_boost": a.similarity, "style": a.style, "use_speaker_boost": True, "speed": speed}}
    if a.seed is not None: body["seed"] = a.seed
    if a.lang:
        if a.model.startswith("eleven_multilingual_v2"): print("not: eleven_multilingual_v2 language_code desteklemiyor; dil metinden algılanır.")
        else: body["language_code"] = a.lang
    print(f"ses: {voice_name} ({voice_id}) · model: {a.model} · hız {speed} · {len(text)} karakter{' · DENEME' if a.preview else ''}")
    r = call("POST", f"/v1/text-to-speech/{voice_id}/with-timestamps", key, body, {"output_format": "mp3_44100_128"})
    audio = base64.b64decode(r["audio_base64"])
    work = os.path.join(proj, "work"); os.makedirs(work, exist_ok=True)
    if a.preview:
        dst = os.path.join(work, "preview.mp3"); open(dst, "wb").write(audio)
        print(f"deneme -> {dst}\nKullanıcı dinlesin; beğenirse aynı ayarlarla --preview olmadan çalıştır."); return
    for old in os.listdir(work):  # eski ses dosyaları timing.py'yi şaşırtmasın
        if old.startswith("voice.") and old != "voice.mp3": os.remove(os.path.join(work, old))
    dst = os.path.join(work, "voice.mp3"); open(dst, "wb").write(audio)
    al = r.get("alignment") or r.get("normalized_alignment")
    if al:
        al = dict(al); al["audio_sha1"] = hashlib.sha1(audio).hexdigest()
        json.dump(al, open(os.path.join(work, "alignment.json"), "w", encoding="utf-8"), ensure_ascii=False)
    else: print("UYARI: yanıtta zaman damgası yok; timing.py tahmin yöntemine düşecek.")
    meta = {"voice_id": voice_id, "voice_name": voice_name, "model_id": a.model, "voice_settings": body["voice_settings"], "seed": a.seed, "characters": len(text)}
    json.dump(meta, open(os.path.join(work, "voice_meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"seslendirme -> {dst}" + (" + work/alignment.json" if al else "") + "\nsıradaki: python tools/timing.py .")


if __name__ == "__main__":
    main()
