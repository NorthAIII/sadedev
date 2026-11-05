# Geçiş istemi: ürün (Alpfit, Bunker OS gibi)

Ürünün kendi oturumuna yapıştırılır. `<…>` yerlerini doldur. 3. adımda oturum durup listeyi, yol haritasını ve yeni CLAUDE.md'yi gösterir; "tamam" demeden DevFlow'a dokunmaz. İlk paragraf oturum o an çalışıyorsa elindeki işi bitirmesini sağlar (Claude Code çalışırken gelen mesajı hemen görür).

```
Bu mesaj şu anki iş bitince uygulanacak: önce elindeki işi bitir, kontrollerini koş ve commit et; yeni bir işe geçme. Ondan sonra aşağıdakini sırayla yap.

IT'den (5 Kasım, Kıvanç'ın kararı): <Proje>'de DevFlow'u kaldırıyoruz; amaç hız. <Ürünün risk cümlesi: para, hak, kişisel veri, canlı sunucu, e-posta gönderimi…> Bu yüzden güvenlik ağı kalıyor: CI, bütün test takımları, yayının yalnız Kıvanç'ın onayıyla olması. Yedek alındı; 12 Kasım'da değerlendirilecek.

1. Bekleyen işleri ve planı topla. _dev'in tamamını okuma; yalnız DURUM.md, ROADMAP/PHASES, aktif fazın PHASE belgesi ve task listesi, BULGULAR.md'nin Gelen Kutusu, _dev/tasks/quick altındaki açık kayıtlar. Kökte YAPILACAKLAR.md'yi aşağıdaki düzende yaz: aktif fazın kalan task'ları "Şimdi" ve "Sıradaki"nin başında, planlı sırasıyla. Sonraki fazlar, sürüm hedefleri ve tarihli işler docs/YOL-HARITASI.md'ye (en fazla bir sayfa). Kapanmış işleri yazma; ayrıntısı uzun olan işe arşivdeki belgenin yeni yolunu ekle.

2. Bilmen gerekeni ayır. (a) Ürün belgeleri (mimari, veri modeli, API sözleşmeleri, KVKK, özellik envanteri, tasarım rehberi, işletim ve yayın talimatları) docs/'a taşınır, silinmez, kısaltılmaz; CLAUDE.md onları yalnız adıyla ve "ne zaman oku" bilgisiyle anar, @ ile içe aktarmaz. (b) MEMORY, DECISIONS ve CLAUDE.md'den hâlâ geçerli kurallar yeni CLAUDE.md'ye: yayın ve dal kuralı, worktree düzeni, sunucu ve konteyner kuralları, kişisel veri ve KVKK, para ve hak kuralları, her değişiklikte koşulacak kontroller. Yeni CLAUDE.md en fazla 250 satır; tarihçe, faz anlatısı ve DevFlow süreç kuralları girmez.

3. Göster ve bekle. YAPILACAKLAR.md'yi, docs/YOL-HARITASI.md'yi, yeni CLAUDE.md'yi ve docs/'a taşınacak belgelerin listesini bana göster; "tamam" demeden 4. adıma geçme.

4. DevFlow'u kaldır; silme, arşive taşı: DevFlow süreç belgeleri (_dev'in docs/'a gitmeyen kısmı) → arsiv/devflow/_dev/, .claude/commands/devflow/ → arsiv/devflow/komutlar/, DevFlow hook dosyaları (kayit-kapisi.mjs vb.) → arsiv/devflow/hooks/, git dışı KOŞUM dosyaları da arsiv/devflow/'a. .claude/settings.json'dan yalnız DevFlow hook girdilerini çıkar. package.json betiklerinde, scripts/ ve .github/ altında _dev yolu geçiyorsa düzelt. Worktree'lerde aynı dosyalar varsa onların dalına da aynısını uygula. Düzeltemediğin bir bağımlılık çıkarsa dur ve sor.

5. Doğrula ve kaydet: lint, typecheck, birim testleri ve build yeşil. Tek commit, "chore: DevFlow kaldırıldı, sade düzen (deneme)", ve kendi dal kuralınla push. main'e ve canlıya dokunma.

6. Sonra YAPILACAKLAR.md'nin "Şimdi"deki işiyle devam et.

YAPILACAKLAR.md'nin düzeni (bunu CLAUDE.md'ye de yaz):
- Bölümler sırayla: "Şimdi" (aynı anda tek iş), "Sıradaki" (sırası plandır; yukarıdan aşağı yapılır), "Kıvanç'ı bekleyen" (neye bağlı olduğu yazılı), "Bitti" (son iki hafta; tarih ve commit). Her iş tek satır: ne, neden, ne zaman bitmiş sayılır.
- Bir iş bitince "Bitti"ye commit'iyle taşınır, "Sıradaki"nin en üstündeki "Şimdi"ye çıkar. Sıra yalnız Kıvanç'ın kararıyla değişir; yolda çıkan yeni iş "Sıradaki"ye uygun yere yazılır ve Kıvanç'a söylenir, araya sokulmaz.
- Büyük iş (birkaç günlük): önce sohbette 5–10 maddelik plan Kıvanç'a sorulur; onaylanınca maddeler "Sıradaki"ye iş olarak girer. Plan ayrı dosyaya yazılmaz.
- Uzun vadeli sıra (sürümler, sonraki büyük işler, tarihli hedefler) docs/YOL-HARITASI.md'de, en fazla bir sayfa.

Çalışma biçimi (bunu da CLAUDE.md'ye yaz):
- "Şimdi"deki işi yap, test yaz ya da güncelle, kontrolleri koş, açıklayıcı mesajla commit et, YAPILACAKLAR.md'yi güncelle. Task, faz, oturum kaydı ve denetim belgesi yazılmaz.
- Bir kusuru düzeltirken aynı türden kardeşlerini de ara ve aynı işte kapat; tek tek not bırakma.
- Para, hak, eşzamanlılık, kimlik ve yetki, kişisel veri, gerçek e-posta gönderimi ya da veritabanı göçü içeren bir değişiklik main'e gitmeden önce ayrı bir gözden geçirmeden geçer: kendi diff'ini baştan oku, eksik test ve kardeş kusur ara, bulduğunu düzelt.
- Uzun testi (e2e tam takım) koştururken sonucunu bekle; "bitince devam ederim" deyip durma.
- Yayından önce tam test takımı ve e2e koşar; yayın yalnız Kıvanç'ın onayıyla.
- arsiv/ yalnız bir şey gerektiğinde grep ile bakılır; oturum başında okunmaz, düzenlenmez, denetlenmez.
- Alt ajan yalnız gerçekten paralel bir iş varsa açılır.
```
