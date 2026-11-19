# Örnek proje: "Fare kuyruğuna ödül" (Hanoi, 1902 · ~35 sn · 14 çekim)
Belgelenmiş bir tarih anekdotu: kent yönetimi her fare kuyruğuna bir sent öder, avcılar kuyruğu kesip fareyi salar, kent dışında fare çiftlikleri ortaya çıkar.

## Dosyalar
- `script.txt` seslendirilecek metin (74 kelime).
- `words.json` bu metin için **tahmini** kelime zamanlaması. Örneği sessiz denemek için projede `work/words.json` olarak kullanılabilir; gerçek projede `tools/timing.py` bunu seslendirmeden üretir.
- `sound.json` müzik ve efekt zamanları (tahmini zamanlamaya göre).
- `story.js` dünya, karakterler, kamera ve çekimler.

## Bu örnekten alınacak kalıplar
- **Kelimeye bağlı çekimler:** `CUES` tablosu her çekimi başladığı kelimeye bağlar; `build` içinde `E.shots(CUES)`, `frame` içinde `E.shot(f)`. Aynı metni kendi sesinle okursan çekimler kendiliğinden oturur; elle kare numarası yazmak gerekmez.
- **Çekim içi olaylar da kelimeye bağlı:** `sh.w("para")` → o kelimenin karesi (bulunamazsa çekim süresine oranla tahmin).
- **Mekânları ayırmak:** ofis x = 0, sokak x = 200, kanalizasyon x = -200, çiftlik x = 600.
- **Hazır kütüphane + havuz:** fareler `E.P.pool(44, "rat")`, kuşlar `E.P.pool(4, "bird")`; her kare başında gizlenir, `place(i, x, y, z, { dir, tail, flap })` ile gösterilir. At arabası `E.P.horse` + `E.P.cart`, `userData.pose({ run, roll })` ile canlanır.
- **Büyüyen yığın:** tezgâhtaki kuyruklar önceden kurulur, görünür sayısı çekim boyunca artar.
- **Damga ve afiş:** `T.sign` dokusu `E.label` ile duvara asılır, `scale` ile vurulur.
- **Yer etiketi:** `overlay` ile 2D kart (`placeTag`).
