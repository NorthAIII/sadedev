# Geçiş istemi: web sitesi

Sitenin kendi oturumuna yapıştırılır. Oturum o an bir iş yapıyorsa başına `gecis-urun.md`'deki ilk paragrafı ekle ve 0. adımı atla.

```
IT'den (4 Kasım, KARARLAR altyapı 2026-11-04): Bu projeden DevFlow'u kaldırıyoruz; web siteleri bundan sonra sade düzende çalışır. Bekleyen işler kaybolmayacak, bu oturumda devam edecek. Sırayla yap:

0. Çalışan bir run-phase ya da run-task varsa önce durdur. Yarım kalan task'ı bitirmeye çalışma, yalnız nerede kaldığını not et.

1. Bekleyen işleri topla. _dev'in tamamını okuma; yalnız DURUM.md, PHASES.md (ya da ROADMAP), aktif fazın PHASE belgesi ve task listesi, BULGULAR.md'nin Gelen Kutusu ve _dev/tasks/quick altındaki açık kayıtlar. Kökte YAPILACAKLAR.md yaz: her iş tek satır (ne, neden, ne zaman bitmiş sayılır); yarım olan "yarım:" diye işaretli; ayrıntısı uzunsa arşivdeki belgenin yeni yolu. Kapanmış işleri yazma.

2. Bilmen gerekeni süz. MEMORY.md, docs/DECISIONS.md ve CLAUDE.md'den hâlâ geçerli olanları çıkar: yayın ve dal kuralı (canlıya yalnız Kıvanç'ın onayıyla), kişisel veri, KVKK ve form kuralları, servis bilgileri (adresler, proje kimlikleri; sırların değeri değil, yalnız nerede durdukları), içerik ve tasarım kuralları, her değişiklikte koşulacak kontroller. Yeni CLAUDE.md en fazla 150 satır olsun ve @ ile başka belge içe aktarmasın. Tarihçe, faz anlatısı ve DevFlow süreç kuralları girmesin.

3. Göster ve bekle. YAPILACAKLAR.md'yi ve yeni CLAUDE.md'yi bana göster; "tamam" demeden 4. adıma geçme.

4. DevFlow'u kaldır; silme, arşive taşı: _dev/ → arsiv/devflow/_dev/, .claude/commands/devflow/ → arsiv/devflow/komutlar/, DevFlow'a ait hook dosyaları (kayit-kapisi.mjs vb.) → arsiv/devflow/hooks/, git dışı KOŞUM dosyaları da arsiv/devflow/'a. .claude/settings.json'dan yalnız DevFlow hook girdilerini çıkar. package.json betiklerinde, scripts/ ve .github/ altında _dev yolu geçiyorsa düzelt (ör. CI'ın yalnız-belge süzgeci arsiv/'i de saysın). Düzeltemediğin bir bağımlılık çıkarsa dur ve sor.

5. Doğrula ve kaydet: lint, test ve build yeşil (sitenin tam kontrolü varsa o da). Tek commit, "chore: DevFlow kaldırıldı, sade düzen", ve kendi dal kuralınla push. main'e ve canlıya dokunma.

6. Sonra YAPILACAKLAR.md'nin ilk işiyle devam et.

Bundan sonraki çalışma biçimi (bunu CLAUDE.md'ye de yaz):
- YAPILACAKLAR.md'den bir iş al, yap, kontrolleri koş, açıklayıcı mesajla commit et, satırı işaretle. Task, faz, oturum kaydı ve denetim belgesi yazılmaz.
- Birkaç günlük büyük bir işte önce sohbette 5–10 maddelik planı Kıvanç'a sor; plan dosyaya yazılmaz.
- Kişisel veri, form, yayın, alan adı ve ortam değişkeni değişikliğinden önce Kıvanç'a sor.
- arsiv/ yalnız bir şey gerektiğinde grep ile bakılır; oturum başında okunmaz, düzenlenmez, denetlenmez.
- Alt ajan yalnız gerçekten paralel bir iş varsa açılır.
```
