# <Proje adı>

<Bir paragraf: ne, kimin için, nerede çalışıyor.>

## Çalışma düzeni

- İşler `YAPILACAKLAR.md`'de: "Şimdi" (tek iş), "Sıradaki" (sırası plan), "Kıvanç'ı bekleyen", "Bitti" (son iki hafta, commit'iyle).
- "Şimdi"deki işi yap, test yaz ya da güncelle, kontrolleri koş, açıklayıcı mesajla commit et, listeyi güncelle.
- Sırayı yalnız Kıvanç değiştirir; yolda çıkan iş "Sıradaki"ye yazılır ve söylenir. Büyük iş önce sohbette 5–10 maddeyle planlanır.
- Bir kusuru düzeltirken aynı türden kardeşlerini de ara ve aynı işte kapat.
- Uzun testin sonucunu bekle; "bitince devam ederim" deyip durma.
- Alt ajan yalnız gerçekten paralel bir iş varsa.

## Kurallar

- Yayın ve dal: <kural>. Canlıya yalnız Kıvanç'ın onayıyla.
- Önce Kıvanç'a sor: kişisel veri, form, yayın, alan adı, ortam değişkeni<, para, hak, e-posta gönderimi>.
- <Riskli değişiklikte main'den önce kendi diff'ini baştan oku, eksik test ve kardeş kusur ara.>
- Sırların değeri hiçbir dosyaya yazılmaz; yalnız nerede durdukları.

## Kontroller

- Her değişiklikte: <lint, typecheck, test, build komutları>
- Yayından önce: <tam takım, e2e>

## Belgeler (gerektiğinde oku, oturum başında okuma)

- `docs/<belge>.md` — <ne zaman okunur>
- `docs/YOL-HARITASI.md` — uzun vadeli sıra

## Hafıza (yalnız istek üzerine)

Geçmiş oturumlar `$(git rev-parse --git-common-dir)/hafiza/` altında. Önce `kisa/INDEX.md` ya da `uzun/<pazartesi>.md`,
sonra yalnız gereken oturum dosyası; klasörün tamamını okuma. `arsiv/` da yalnız gerektiğinde grep ile.
