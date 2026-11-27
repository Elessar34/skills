#!/usr/bin/env python3
"""
Tarayıcı Ajanı Yerel Türkçe Test Laboratuvarı Sunucusu (sunucu.py)
Sıfır dış bağımlılık, UTF-8 garantili, çok iş parçacıklı (ThreadingHTTPServer) yerel HTTP sunucusu.

Kullanım:
  python3 hedefler/sunucu.py --port 8765
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import shutil
import sys
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

KOK_DIZIN = Path(__file__).resolve().parent

# Güvenlik: sunucu yalnızca bu bilgisayardan gelen isteklere yanıt verir.
# - Host başlığı yerel bir ad değilse istek reddedilir (DNS rebinding saldırısına karşı).
# - CORS başlığı gönderilmez: başka bir web sitesi bu sunucunun yanıtlarını okuyamaz.
# - POST yalnızca aynı kaynaktan ve "application/json" ile kabul edilir:
#   tarayıcıda açık başka bir site rapor yazamaz ya da hesapla.js'i sıfırlayamaz.
YEREL_ADLAR = {"127.0.0.1", "localhost", "::1"}
EN_FAZLA_GOVDE = 1_000_000  # bayt

# Dinamik bellek içi durum (ajan POST ederse rapor/özet canlı güncellenir)
CANLI_DURUM: dict = {
    "fiyat_radar_rapor": None,
    "sabah_ozeti": None,
    "son_istek_zamani": None,
}

mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("application/javascript; charset=utf-8", ".js")
mimetypes.add_type("text/css; charset=utf-8", ".css")
mimetypes.add_type("text/html; charset=utf-8", ".html")
mimetypes.add_type("application/json; charset=utf-8", ".json")


def _host_adi(host_basligi: str) -> str:
    """'127.0.0.1:8765' → '127.0.0.1', '[::1]:8765' → '::1'."""
    h = (host_basligi or "").strip().lower()
    if h.startswith("["):
        return h[1:h.find("]")] if "]" in h else h
    return h.rsplit(":", 1)[0] if ":" in h else h


class LaboratuvarHandler(SimpleHTTPRequestHandler):
    izinli_adlar: set = set(YEREL_ADLAR)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(KOK_DIZIN), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def _host_gecerli(self) -> bool:
        if _host_adi(self.headers.get("Host", "")) in self.izinli_adlar:
            return True
        self._json_yanit({"hata": "Bu sunucu yalnızca yerel adresten kullanılabilir"}, HTTPStatus.FORBIDDEN)
        return False

    def _ayni_kaynak(self) -> bool:
        kaynak = self.headers.get("Origin")
        if kaynak is None:  # curl, Python, ajan araçları Origin göndermez
            return True
        return kaynak.lower() == f"http://{self.headers.get('Host', '').lower()}"

    def guess_type(self, path: str) -> str:
        base = super().guess_type(path)
        if base.startswith("text/") and "charset=" not in base:
            return f"{base}; charset=utf-8"
        if base in ("application/javascript", "application/json") and "charset=" not in base:
            return f"{base}; charset=utf-8"
        return base

    def _json_yanit(self, veri: dict, durum: int = HTTPStatus.OK) -> None:
        govde = json.dumps(veri, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(durum)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(govde)))
        self.end_headers()
        self.wfile.write(govde)

    def do_OPTIONS(self) -> None:
        # CORS izni verilmez: başka sitelerden gelen ön kontrol (preflight) istekleri reddedilir.
        self.send_response(HTTPStatus.METHOD_NOT_ALLOWED)
        self.send_header("Allow", "GET, HEAD, POST")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self) -> None:
        if not self._host_gecerli():
            return
        super().do_HEAD()

    def do_GET(self) -> None:
        if not self._host_gecerli():
            return
        ayristir = urlparse(self.path)
        yol = ayristir.path

        if yol == "/api/saglik":
            self._json_yanit(
                {
                    "durum": "calisiyor",
                    "sunucu": "tarayici-ajani-yerel-laboratuvar",
                    "hedefler": {
                        "ana_dizin": "/",
                        "fiyat_radar": {
                            "teknoliman": "/fiyat-radar/teknoliman.html",
                            "kuzeybilisim": "/fiyat-radar/kuzeybilisim.html",
                            "anadolusepet": "/fiyat-radar/anadolusepet.html",
                            "rapor": "/fiyat-radar/rapor.html",
                        },
                        "teklif_matik": {
                            "canli": "/teklif-matik/",
                            "hatali_mod": "/teklif-matik/?mod=hatali",
                            "onayli_mod": "/teklif-matik/?mod=onayli",
                        },
                        "sabah_masasi": {
                            "pano": "/sabah-masasi/",
                            "ozet": "/sabah-masasi/sabah-ozeti.html",
                        },
                    },
                }
            )
            return

        if yol == "/api/fiyat-radar/rapor":
            self._json_yanit(
                {
                    "ozel_rapor": CANLI_DURUM["fiyat_radar_rapor"],
                    "son_guncelleme": CANLI_DURUM["son_istek_zamani"],
                }
            )
            return

        if yol == "/api/sabah-masasi/ozet":
            self._json_yanit(
                {
                    "ozel_ozet": CANLI_DURUM["sabah_ozeti"],
                    "son_guncelleme": CANLI_DURUM["son_istek_zamani"],
                }
            )
            return

        if yol == "/fiyat-radar" or yol == "/fiyat-radar/":
            self.send_response(HTTPStatus.FOUND)
            self.send_header("Location", "/fiyat-radar/teknoliman.html")
            self.end_headers()
            return

        super().do_GET()

    def do_POST(self) -> None:
        if not self._host_gecerli():
            return
        if not self._ayni_kaynak():
            self._json_yanit({"hata": "Başka bir siteden gelen istek reddedildi"}, HTTPStatus.FORBIDDEN)
            return
        tur = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if tur != "application/json":
            self._json_yanit({"hata": "Content-Type: application/json gerekli"}, HTTPStatus.UNSUPPORTED_MEDIA_TYPE)
            return
        ayristir = urlparse(self.path)
        yol = ayristir.path
        try:
            uzunluk = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            uzunluk = -1
        if uzunluk < 0 or uzunluk > EN_FAZLA_GOVDE:
            self._json_yanit({"hata": "Geçersiz ya da çok büyük gövde"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            return
        ham = self.rfile.read(uzunluk) if uzunluk > 0 else b"{}"
        try:
            veri = json.loads(ham.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json_yanit({"hata": "Geçersiz JSON gövdesi"}, HTTPStatus.BAD_REQUEST)
            return
        if not isinstance(veri, dict):
            self._json_yanit({"hata": "JSON gövdesi bir nesne olmalı"}, HTTPStatus.BAD_REQUEST)
            return

        simdi = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        CANLI_DURUM["son_istek_zamani"] = simdi

        if yol == "/api/fiyat-radar/rapor":
            CANLI_DURUM["fiyat_radar_rapor"] = veri
            self._json_yanit({"kaydedildi": True, "zaman": simdi})
            return

        if yol == "/api/sabah-masasi/ozet":
            CANLI_DURUM["sabah_ozeti"] = veri
            self._json_yanit({"kaydedildi": True, "zaman": simdi})
            return

        if yol == "/api/teklif-matik/sifirla":
            mod = veri.get("mod", "hatali")
            kaynak = KOK_DIZIN / "teklif-matik" / (
                "hesapla.onayli.js" if mod == "onayli" else "hesapla.hatali.js"
            )
            hedef = KOK_DIZIN / "teklif-matik" / "hesapla.js"
            if kaynak.exists():
                shutil.copyfile(kaynak, hedef)
                self._json_yanit({"sifirlandi": True, "aktif_kaynak": mod, "zaman": simdi})
            else:
                self._json_yanit({"hata": "Şablon dosyası bulunamadı"}, HTTPStatus.NOT_FOUND)
            return

        self._json_yanit({"hata": "Bilinmeyen uç nokta"}, HTTPStatus.NOT_FOUND)

    def log_message(self, format_str: str, *args) -> None:
        sys.stderr.write(f"[laboratuvar] {self.address_string()} - {format_str % args}\n")


def teklif_matik_kaynak_sifirla(mod: str) -> None:
    kaynak = KOK_DIZIN / "teklif-matik" / (
        "hesapla.onayli.js" if mod == "onayli" else "hesapla.hatali.js"
    )
    hedef = KOK_DIZIN / "teklif-matik" / "hesapla.js"
    if kaynak.exists():
        shutil.copyfile(kaynak, hedef)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Tarayıcı Ajanı Yerel Türkçe Hedef Uygulamalar Sunucusu"
    )
    parser.add_argument("--host", default="127.0.0.1", help="Dinlenecek adres (varsayılan: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8765, help="Dinlenecek port (varsayılan: 8765)")
    parser.add_argument(
        "--teklif-mod",
        choices=["hatali", "onayli"],
        default=None,
        help="Başlangıçta teklif-matik/hesapla.js dosyasını belirtilen şablona sıfırla",
    )
    args = parser.parse_args()

    if args.teklif_mod:
        teklif_matik_kaynak_sifirla(args.teklif_mod)

    if _host_adi(args.host) not in YEREL_ADLAR:
        print(
            f"UYARI: {args.host} adresi yerel değil; aynı ağdaki başka cihazlar da bu sunucuya erişebilir.",
            file=sys.stderr,
        )
        LaboratuvarHandler.izinli_adlar = set(YEREL_ADLAR) | {_host_adi(args.host)}

    sunucu = ThreadingHTTPServer((args.host, args.port), LaboratuvarHandler)
    taban = f"http://{args.host}:{args.port}"
    print(f"Yerel Test Laboratuvarı hazır: {taban}/")
    print(f"  [1] Fiyat Radarı  : {taban}/fiyat-radar/teknoliman.html")
    print(f"                      {taban}/fiyat-radar/kuzeybilisim.html")
    print(f"                      {taban}/fiyat-radar/anadolusepet.html")
    print(f"                      {taban}/fiyat-radar/rapor.html")
    print(f"  [2] TeklifMatik   : {taban}/teklif-matik/  (?mod=hatali | ?mod=onayli)")
    print(f"  [3] Sabah Masası  : {taban}/sabah-masasi/  (sabah-ozeti.html)")
    try:
        sunucu.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu kapatılıyor...")
    finally:
        sunucu.server_close()


if __name__ == "__main__":
    main()
