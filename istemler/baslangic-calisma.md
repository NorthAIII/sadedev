# Başlangıç istemi: kod olmayan çalışma deposu

DevFlow'u hiç olmamış, kodu olmayan bir çalışma deposunu (satış, pazarlama, içerik) sade düzene almak için
o deponun oturumuna yapıştırılır. İlk kullanım: `~/projects/alpfit-plus-satis` (5 Kasım 2026). Başka bir
depoda kullanırken `[ilk iş]` paragrafını o işe göre değiştir.

```
IT'den (5 Kasım): Bu depo bundan sonra sade düzende çalışır (~/projects/sadedev/README.md). Sırayla yap:

0. git status'a bak. Commit edilmemiş ya da hazırlanmış (staged) değişiklik varsa ne olduklarını tek paragrafta bana anlat ve ne yapacağımızı sor; kendiliğinden commit etme, geri alma.

1. Kökte YAPILACAKLAR.md yaz (şablon ~/projects/sadedev/sablonlar/YAPILACAKLAR.md): README'den, satış takibinden ve dosyalardaki açık notlardan hâlâ açık olan işler; her iş tek satır (ne, neden, ne zaman bitmiş sayılır). Kapanmış işleri yazma. "Şimdi"ye aşağıdaki ilk işi koy.

2. Kökte kısa bir CLAUDE.md yaz (en fazla 150 satır, @ ile içe aktarma yok): bu deponun ne olduğu, IDDIALAR.md'nin tek kaynak olduğu, kişisel verinin (leads/, *.csv) git'e ve hiçbir çıktıya girmediği, deponun yalnız yerel olduğu (uzak depoya gönderilmez), dışarıya mesaj, e-posta ya da paylaşımın yalnız Kıvanç'ın onayıyla gittiği, Alpfit'in ve sitesinin depolarına yalnız okumak için bakıldığı. Ayrıca şu çalışma biçimi: YAPILACAKLAR.md'den bir iş al, yap, açıklayıcı mesajla commit et, satırı işaretle; birkaç günlük işte önce sohbette 5–10 maddelik planı sor; alt ajan yalnız gerçekten paralel bir iş varsa açılır. Ve "Hafıza (yalnız istek üzerine)": geçmiş oturumların kaydı $(git rev-parse --git-common-dir)/hafiza/ altında; oturum başında okunmaz, geçmiş sorulunca önce kisa/INDEX.md ya da uzun/<pazartesi>.md, sonra yalnız gereken oturum dosyası.

3. İkisini bana göster; "tamam" demeden commit etme. Tamam deyince tek commit: "chore: sade düzen".

4. Sonra ilk işe başla:

[ilk iş] Alpfit Plus'ın bugünkü hâlini satışın gözüyle çıkar. Alpfit artık yalnız salon işletme yazılımı değil; hoca–öğrenci (kullanıcı) tarafı da geliyor. Yalnız okuyarak bak, ama kodun tamamını okuma: ~/projects/Alpfit.v1'de YAPILACAKLAR.md, docs/YOL-HARITASI.md, son 30 günün commit başlıkları (git log --since=30.days --format='%ad %s' --date=short) ve gerekirse ilgili modül belgesi; ~/projects/alpfit-kulucka'da README ve docs/PLAN.md, docs/ISTEKLER.md; sitede ~/projects/"Alpfitplus website.v3" sayfa metinleri ve YAPILACAKLAR.md. Çıktı bana sohbette: (a) canlıda olan, yolda olan, plan aşamasında olan — üç liste; (b) bunun IDDIALAR.md'ye, fiyat modeline, hedef segmentlere (salon, tek başına PT, pilates), sunuma ve sitedeki mesajlara etkisi; (c) önerilen değişiklikler, önem sırasıyla. Ben onaylamadan hiçbir dosyayı değiştirme; onayladıklarımı YAPILACAKLAR.md'ye iş olarak yaz.
```
