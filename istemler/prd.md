# PRD: büyük bir özelliği kodlamadan önce netleştirmek

DevFlow'un `/devflow:prd`'sinin sade karşılığı. Birkaç günlük bir özelliğe başlarken projenin yeni bir sohbetine
yapıştırılır, `<…>` yerine özellik yazılır. Oturum soru sorarak özelliği netleştirir, tek sayfalık bir belge
yazar ve işleri "bitti sayılır" maddeleriyle `YAPILACAKLAR.md`'ye önerir.

Neden ucuz: DevFlow'unki 47 KB'lık komut metni ve önce okunan bir yığın belgeyle çalışıyordu, belgesi de her
oturumda okunuyordu. Bu istem 2 KB, oturum yalnız iki dosya okur, belge (`docs/prd/<ad>.md`) hiçbir oturumda
kendiliğinden okunmaz: yalnız o özelliğin işi açılınca, işin satırındaki "Ayrıntı" yolundan.

Küçük işte kullanılmaz; orada "önce plan iste" yeter (README → Günlük kullanım).

```
PRD (sadedev): şu özelliği kodlamadan önce benimle netleştir: <özellik, bir iki cümle>.

1. Yalnız YAPILACAKLAR.md ve docs/YOL-HARITASI.md'yi oku. Kodu ve başka belgeleri okuma; bir soruya kodda bakmadan cevap veremiyorsan tek bir hedefli grep yap ve neye baktığını söyle.

2. Bana en fazla iki tur, turda en fazla 5 soru sor. Sade Türkçe, teknik terim yok; her soruya kendi önerini ekle, ben "evet" diyebileyim. Bakış açıları: kim kullanıyor ve ne yapıyor; ters giden hâller (boş, yanlış, yarım, iki kişi aynı anda); para, hak ve yetki; kişisel veri; telefonda nasıl görünür; ne bu özelliğin dışında kalır.

3. Cevaplardan docs/prd/<kısa-ad>.md yaz, en fazla bir sayfa: Özet (tek paragraf) · Kim ne yapar (kullanıcı şunu yapar, sistem şunu gösterir) · Kurallar ("şu olunca bu olmalı" maddeleri; en önemli bölüm) · Kapsam dışı · Açık sorular. CLAUDE.md'ye ve başka belgeye bağlantı ekleme.

4. Kuralları 3–10 işe böl ve bana sun. Her iş YAPILACAKLAR'ın biçiminde: kalın başlık, bir cümle ne, "Bitti sayılır:" (kurallardan gelen, gözle ya da testle doğrulanır), "Ayrıntı: docs/prd/<kısa-ad>.md". Sırayı ben belirlerim.

5. Ben onaylayınca işleri "Sıradaki"ye yaz (benim dediğim yere), docs/prd/<kısa-ad>.md ile birlikte commit et. Kod yazma; bu oturum burada biter.
```
