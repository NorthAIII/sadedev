# Gece koşusu: onaylı işleri soru sormadan sırayla yapmak

DevFlow'un `run-phase`'inin sade karşılığı. Projenin oturumuna (yeni bir sohbet) yapıştırılır; oturum
"Şimdi" ve "Sıradaki"deki işleri, her birini ayrı bir alt ajanda, sırayla yapar. Kodu bu oturum okumaz;
bağlamı küçük kaldığı için saatlerce sürebilir (DevFlow'da uzun koşuyu mümkün kılan da buydu).

Onay, işin "Sıradaki"ye girdiği anda verilmiş sayılır: sırayı Kıvanç belirler, koşu ona soru sormaz.
Soru çıkaran iş atlanır ve "Kıvanç'ı bekleyen"e iner. Yayın, `main` ve canlı hiçbir zaman koşuya dahil değildir.

Gerekenler: oturumda bypass kipi (konteynerlerde devcontainer ayarı), makine açık ve VS Code penceresi
açık. Uzun koşu canlı token alarmını tetikleyebilir ("son 6 saatte 500 milyon", "tek cevap 100 adım");
beklenen bir koşuysa bildirim yalnız bilgidir. Sınırlar (12 iş, 10 saat) istemdeki sayılar değiştirilerek ayarlanır.

```
Gece koşusu (IT, sadedev): YAPILACAKLAR.md'deki onaylı işleri ben yokken sırayla yap. Bana soru sorma; sorulacak bir şey çıkan işi atla ve "Kıvanç'ı bekleyen"e yaz.

1. Sen dağıtıcısın, işi kendin yapma. Her iş için tek bir alt ajan (general-purpose) aç, bitmesini bekle, sonra sıradakini aç; aynı anda tek alt ajan. Bu oturumun bağlamı küçük kalsın: kodu, testleri ve belgeleri sen okuma; YAPILACAKLAR.md, git log ve alt ajanın kısa raporu yeter.

2. Sıra: önce "Şimdi", sonra "Sıradaki" yukarıdan aşağı (alt başlıkların altındaki maddeler de). "Kıvanç'ı bekleyen" ve "Bitti"ye dokunma. Bir iş benim onayımı, çizimimi, kararımı ya da dışarıdan bir şeyi (hesap, ödeme, cihaz, mağaza, müşteri) bekliyorsa ya da tek oturumda bitmeyecek kadar büyükse atla.

3. Her işin başında çapayı al: git rev-parse HEAD. Alt ajana şu görevi ver, <…> yerlerini doldurarak:
"Proje: <klasör>. Tek iş: <YAPILACAKLAR'daki satırın tamamı>. CLAUDE.md'yi oku ve kurallarına uy. İşi yap, test yaz ya da güncelle, CLAUDE.md'deki kontrolleri koş ve sonuçlarını bekle. Yeşilse açıklayıcı mesajla commit et ve projenin dal kuralına göre push et; main'e ve canlıya dokunma, yayın yapma. Para, hak, yetki, kişisel veri, e-posta gönderimi ya da veritabanı göçü varsa commit'ten önce kendi diff'ini baştan oku, eksik test ve kardeş kusur ara. YAPILACAKLAR.md'ye dokunma. Bitiremezsen ya da Kıvanç'a sorulacak bir şey çıkarsa yarım değişikliği yalnız kendi dosyalarını ekleyerek yeni bir dala commit et (git switch -c gece/<kısa-ad>), push etme, çalışma dalına geri dön; git stash kullanma. Sonra dur ve bildir. Raporun en fazla 8 satır: durum (bitti / yarım / soru), commit'ler, kontrollerin sonucu, sonraki işleri etkileyen bir şey varsa o."

4. Alt ajan dönünce doğrula: git log <çapa>..HEAD. Commit yoksa iş bitmemiştir. Bittiyse satırı "Bitti"ye taşı (tarih · iş · commit) ve YAPILACAKLAR.md'yi commit et. Yarım ya da soruysa satırı "Kıvanç'ı bekleyen"e taşı, sonuna tek cümle neden ve varsa gece/ dalının adını yaz, commit et. Sıradaki işe geçmeden çalışma dalında olmalısın ve bu işten kalan değişiklik olmamalı (koşudan önce zaten var olan değişiklikler sayılmaz, onları koşunun başında git status ile not et); değilse koşuyu durdur.

5. Dur: sıra bittiğinde; üst üste iki iş yarım ya da başarısız kaldığında; üst üste iki iş yalnız belge (docs:) commit'i ürettiğinde; 12 iş ya da 10 saat dolduğunda; ben "dur" yazdığımda (uçuştaki iş bitsin, yenisi açılmasın). Çalışma ağacında senin açmadığın değişiklik varsa (paralel oturum) ona dokunma ve aynı dosyalara dokunacak işi atla.

6. Kesilirsen aynı istemle yeniden başlatılırsın: nerede kaldığın YAPILACAKLAR.md ve git log'da.

7. Bitince bana sabah raporu: biten işler (commit'leriyle), beni bekleyenler ve nedenleri, kontrollerin ve CI'ın son durumu (gh run list -L 3), dikkat etmem gereken bir şey. Kısa ve sade Türkçe.
```
