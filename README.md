# sadedev

Sade geliştirme düzeni: Claude Code ile proje geliştirirken ağır süreç araçlarının (bizde DevFlow) yerine geçen hafif çalışma düzeni. Dört parçası (ve bir izleme betiği) var ve hiçbiri model
çağırmaz, yani kendisi token harcamaz:

1. **İş düzeni** — her projede tek bir `YAPILACAKLAR.md` ve kısa bir `CLAUDE.md`.
2. **Hafıza** — her oturumun özetsiz kaydı (kısa süreli) ve haftalık dizini (uzun süreli). Yalnız istenince okunur.
3. **Token raporu** — her sabah, proje ve model başına dünkü harcama; olağan dışı harcamada uyarı.
4. **Pano** — aktif projelerin işleri, son commit'i, son oturumu ve tokenı tek sayfada.

Kuruluş: Kiwi AI Lab IT departmanı, Kasım 2026. Kararlar `~/projects/altyapi/KARARLAR.md` (3, 4 ve 5 Kasım).

---

## Neden

Ekim–Kasım 2026 ölçümü (`~/projects/altyapi/devflow-zorlama/NOTLAR.md`):

- Harcanan tokenın **~%97'si**, modelin her adımda bütün bağlamı yeniden okuması. Bir adımda 270–400 bin token
  okunup yalnız birkaç yüz token yazılıyordu.
- DevFlow'un belgeleri bu yükü büyütüyordu: Alpfit web sitesinde belgeler kodun 5,5 katıydı, son 30 günün
  commit'lerinin yalnız %12'si siteye dokunuyordu, her adımda ~30 bin token yalnız CLAUDE.md ve ekleriydi.
- Tek bir arşiv denetimi 38 saatte 2,8 milyar token harcadı ve hiçbir içeriği değiştirmedi.

Buradan çıkan ilke: **bağlamı küçük tut, geçmişi yalnız gerekince getir, harcamayı her gün gör.**
Oturum başında "geçmişten şunları bil" diye bilgi yükleyen her sistem maliyeti artırır; bu düzen bunu yapmaz.

---

## Günlük kullanım (Kıvanç için)

**Sabah:** Panoyu aç: `~/pano/index.html` (tarayıcıda). Dünkü token, uyarılar ve her projede sıradaki işler orada.

**Bir projede çalışırken:**
- Oturuma ne yapacağını söylemen yetmez; "sıradaki işle devam et" dersen `YAPILACAKLAR.md`'nin "Şimdi"sindeki
  işi yapar, commit eder, listeyi günceller.
- Büyük bir iş (birkaç günlük) istiyorsan önce plan iste: oturum 5–10 maddelik plan sunar, onaylarsan maddeler
  "Sıradaki"ye girer.
- Sırayı sen belirlersin. Oturum yolda yeni bir iş bulursa listeye yazar ve sana söyler, araya sokmaz.
- Her işte yeni bir sohbet aç. Uzayan sohbet her adımda daha çok okur.

**Geçmişe bakmak:** "Hafızaya bak: geçen hafta takvim hatasını nasıl çözmüştük?" de. Oturum önce dizine, sonra
yalnız ilgili oturum dosyasına bakar.

**Kaydedilmesini istemediğin bir şey yazacaksan** `<private>` ile `</private>` arasına yaz; hafızaya hiç girmez.

**Model ve efor:** Varsayılan Opus 5.5, efor **High**. Extra high yalnız zor işlerde (para ve hak, çözülemeyen hata,
mimari karar). Ultracode kapalı. Yeni pencerede model seçicinin kaymadığına bak.

**Uyarı işaretleri:** bir oturum saatlerdir sürüyor ve commit'lerin hepsi `docs:` ise ya da pano uyarı gösteriyorsa
o oturumda `dur` yaz ve IT'ye sor.

---

## 1. İş düzeni

Her projenin kökünde:

| Dosya | Ne | Şablon |
|---|---|---|
| `YAPILACAKLAR.md` | "Şimdi" (tek iş) · "Sıradaki" (sırası plan) · "Kıvanç'ı bekleyen" · "Bitti" (son iki hafta, commit'iyle) | `sablonlar/YAPILACAKLAR.md` |
| `CLAUDE.md` | En fazla 150 satır (site) ya da 250 satır (ürün); `@` ile içe aktarma yok | `sablonlar/CLAUDE-iskelet.md` |
| `docs/YOL-HARITASI.md` | Uzun vadeli sıra, en fazla bir sayfa | `sablonlar/YOL-HARITASI.md` |
| `docs/` | Ürün belgeleri (mimari, API, KVKK, tasarım rehberi); gerektiğinde okunur | — |
| `arsiv/devflow/` | Eski DevFlow belgeleri; yalnız gerektiğinde grep | — |

Güvenlik ağı DevFlow'suz da kalır: CI, test takımları, riskli değişiklikte (para, hak, eşzamanlılık, yetki,
kişisel veri, e-posta gönderimi, veritabanı göçü) main'den önce ayrı gözden geçirme, yayın yalnız Kıvanç'ın onayıyla.

**Claude'un yerel hafıza dosyası:** DevFlow, her projenin `~/.claude/projects/<proje>/memory/MEMORY.md` dosyasına "hafıza `_dev/MEMORY.md`'de" yönlendirmesi koyar ve bu dosya her oturumda bağlama girer. Geçişten sonra IT bu dosyayı `sablonlar/claude-yerel-MEMORY.md` ile değiştirir (eskisi `~/arsiv/`'e); yoksa Claude `_dev/`'i yeniden oluşturmaya kalkabilir. Konteynerde çalışan projede dosya konteynerin içindedir (`/home/<kullanıcı>/.claude/projects/-workspaces-<proje>/memory/`).

**Bir projeyi DevFlow'dan bu düzene geçirmek:** `istemler/gecis-site.md` (web siteleri) ya da `istemler/gecis-urun.md`
(ürünler) projenin oturumuna yapıştırılır. Oturum bekleyen işleri toplar, kuralları süzer, sana gösterip onay bekler,
sonra DevFlow'u arşive taşır (silmez) ve listenin ilk işiyle devam eder. Önce yedek alınır (aşağıda).

---

## 2. Hafıza

| | Ne | Ne zaman | Nerede |
|---|---|---|---|
| Kısa süreli | Her oturum özetsiz: başlık, tarih, dal, model, token, Kıvanç'ın bütün istekleri, Claude'un yazdığı metinler, o aralıktaki commit'ler ve dosyaları. Düşünme ve araç çıktıları alınmaz. | 08:00 ve 20:00 | `<git-common-dir>/hafiza/kisa/` (`INDEX.md` + `<ay>/<oturum>.md`) |
| Uzun süreli | Haftanın dizini: Kıvanç'ın kural, düzeltme ve karar cümleleri olduğu gibi, commit'ler türüne göre, geri alınanlar, en çok değişen dosyalar, oturumlar ve tokenları | Pazartesi 07:30 | `<git-common-dir>/hafiza/uzun/<pazartesi>.md` |

- `<git-common-dir>` çoğu projede `.git/`. Orası commit'lenmez, GitHub'a gitmez, geliştirme konteynerinden de görünür.
- **Maskelenen:** API anahtarları ve tokenlar, `parola=` gibi satırlar, özel anahtarlar, e-posta, telefon, IBAN,
  11 haneli numaralar. `<private>…</private>` hiç yazılmaz.
- **Okuma kuralı:** oturum başında okunmaz. Önce `INDEX.md` ya da haftalık dosya, sonra tek oturum dosyası;
  klasörün tamamı okunmaz. Bunu projeye `istemler/hafiza-notu.md` öğretir.
- **Sınırı:** haftalık dizin anlam çıkarmaz, ayıklar ve sayar. Bir bilgiyi kalıcı kurala çevirmek istek üzerine
  yapılır ("haftanın derslerini CLAUDE.md'ye işle"): model yalnız ~10 KB'lık haftalık dosyayı okur.
- Kayıtlar Claude Code'un kendi oturum dosyalarından üretilir: ana makinede `~/.claude/projects/`, konteynerlerde
  `/home/*/.claude/projects/` (çalışan konteynerden `docker exec`, kapanmıştan `docker cp`).

Elle: `node hafiza/calistir.js` (kısa) · `node hafiza/calistir.js --hafta` (geçen haftanın dizini).

---

## 3. Token raporu

Her sabah 08:30 `~/token-rapor/<dün>.txt` yazılır, özeti masaüstüne bildirim olarak gelir. İçinde proje ve model
başına dünkü token, 7 günlük ortalama ve şu uyarılar:

- bir proje kendi 7 günlük ortalamasının iki katını aştı (ve 0,3 milyardan fazla);
- tek bir oturum 12 saatten uzun sürdü ve son 24 saatte 0,5 milyardan fazla harcadı.

Toplamın ~%97'si önbellekten okumadır; rapor ikisini ayrı da verir. Elle: `token/gunluk-rapor.sh --bildirimsiz`.

**Canlı alarm** (15 dakikada bir, `token/canli-alarm.sh`): günlük rapor kaçağı ertesi sabah gösterir; bu, sürerken.
Son 6 saatin kayıtlarını okur, model çağırmaz. Yeni alarm masaüstüne kalıcı bildirim olarak gelir ve
`~/token-rapor/canli-alarm.log`'a yazılır. Üç kural:

- bir proje son 1 saatte 200 milyonu aştı (3 saatte bir yinelenir);
- tek oturum son 6 saatte 500 milyonu aştı, alt ajanlar dahil (günde bir yinelenir);
- tek bir cevap 100 adımı aştı ve sürüyor: iş bitince yeni sohbet aç (yinelenmez).

Eşikler 22 Ekim – 5 Kasım ölçümünden (`token/olcum/OKUBENI.md` → Canlı alarm). Elle: `token/canli-alarm.sh --bildirimsiz`.
Geçmişte çalışsaydı ne derdi: `canli-topla.js`'i 340 saatle topla, `canli-alarm.js --benzet <baş> <bitiş>`.
Ayrıntılı ölçüm betikleri `token/olcum/` (oturum başına, çağrı başına bağlam, efor kırılımı; `token/olcum/OKUBENI.md`).

---

## 4. Pano

Her proje için tek kart: **yol haritası** (`docs/YOL-HARITASI.md`), **Şimdi**, **Sıradaki**, **Kıvanç'ı bekleyen**,
**son yapılanlar** (listenin "Bitti"si, yoksa son 7 günün ürün commit'leri), son commit, son oturum, dünkü token.
"Projeden kopunca ne yaptık, ne yapacağız" sorusunun cevabı burası; model çağırmadan, dosyalardan üretilir.

- Açmak: uygulamalar menüsünde **Çalışma Panosu** (yeniler ve açar) ya da `pano/ac.sh`.
- Kendiliğinden yenilenir: 08:00, 08:30 ve 20:00.
- Üstte son 24 saatin canlı token alarmları (bildirimi kapatsan da burada ve `~/token-rapor/canli-alarm.log`'da kalır). `pano.json`'da `token.uyarilar`'ın başına "Canlı alarm …" satırları olarak girer.
- Projeler `projeler.json`'da: `ad`, `yol`, varsa `konteyner` (VS Code konteynerindeki klasör adı) ve iş listesi dosyası. İsteğe bağlı `yolHaritasi` (dosya, varsayılan `docs/YOL-HARITASI.md`) ve `yolHaritasiAdi` (başlık; `pano.json`'a da girer): Yönetim'de `HEDEFLER.md`, "Hedefler".
- Bir deponun alt klasörü de proje olabilir (ör. `~/projects/sirket/yonetim`): son commit yalnız o klasörün, hafıza `<git-common-dir>/hafiza/<alt klasör>/` altında, böylece aynı depodaki departmanlar karışmaz.
- Aynı veri `~/pano/pano.json` olarak da yazılır; `~/.gizli/bunker-pano.env` (BUNKER_PANO_URL, BUNKER_PANO_TOKEN) varsa `pano/gonder.sh` bunu Bunker OS'un Ops sayfasına gönderir (yoksa hiçbir şey yapmaz). 5 Kasım'dan beri canlı: 08:00 ve 20:00 (`sade-hafiza`), 08:30 (`sade-token`), arada 09–23 saat başı (`sade-pano`). Uç: gövde en çok 256 KB (canlı nginx'in `/api/` sınırı; 5 Kasım'da 20 KB); aşacaksa Bunker'a haber verilir. Yanıtlar: 204 tamam, 401 token yanlış, 429 10 dakikada 10 yanlıştan sonra, 400 şema (yanıtta alan adı yazar). Token'ın asıl yeri Bitwarden "Bunker OS · OPS_PANO_TOKEN".
- Yol haritası tablo (`| Ne | Neden | Hedef tarih | Durum |`) ya da madde listesi olabilir; panoda ilk 6 satır görünür.

---

## 5. İzleme

`node izle/izle.js`: "Şimdi"si olan her proje için tek satır (son 24 saatin commit'i ve son commit, "Şimdi"deki iş ve kaç saattir
değişmediği, "Bitti"ye bugün inen, commit edilmemiş dosya, dünkü token ve 7 günlük ortalama, son 7 günün en uzun oturumu, CI).
Model çağırmaz; uyarı varsa çıkış kodu 1. Uyarılar:

- `_dev/` ya da `.claude/commands/devflow` yeniden oluştu; `.claude/settings.json`'da `kayit-kapisi` var;
- çalışma dalının son tamamlanmış CI koşusu kırmızı (`gh run list`);
- son 24 saatte biten, 12 saati aşan oturum (süre ilk ve son mesaj arası; boş bekleme dahil, yanında tokeni);
- dünkü token 7 günlük ortalamanın iki katı (0,1 milyarın altı sayılmaz);
- "Şimdi" 24 saattir değişmedi; 300'den fazla commit edilmemiş dosya.

---

## Kurulum

Gereken: Node.js 20+, git, Docker (konteyner kayıtları için), systemd kullanıcı oturumu. Sudo gerekmez.

1. Depoyu `~/projects/sadedev`'e koy (zamanlayıcılar bu yolu kullanır).
2. `projeler.json`'u düzenle.
3. Zamanlayıcıları kur: `systemd/kur.sh` (kaldırmak: `systemd/kur.sh --kaldir`).
4. Elle bir kez dene: `node hafiza/calistir.js` ve `token/gunluk-rapor.sh --bildirimsiz && node pano/olustur.js`.
5. Sade düzene geçmiş her projenin oturumuna `istemler/hafiza-notu.md`'yi bir kez yapıştır.

Sır taraması: `git config core.hooksPath .githooks` (commit'te şifre benzeri satır varsa durdurur).

---

## Geri dönüş

DevFlow'a dönülecekse: kod git'te ve `~/arsiv/devflow-oncesi-2026-11-05/`'teki yedeklerde durur; DevFlow belgeleri
projenin `arsiv/devflow/` klasöründen geri taşınır. Belgeler aradaki işle eşit olmayacağı için bir eşitleme oturumu
gerekir. Deneme değerlendirmesi 12 Kasım 2026 (hız, token, kalite).

---

## Sonra

- Kullanılmayan eklenti ve bağlantıları proje bazında kapatmak: her adımda ~35 bin token sabit yük var; Claude
  Code'un yerleşik araç tanımları değiştirilmez, yalnız gereksiz eklenti/bağlantı kapatılır. Önce yeni bir pencerede
  `/context` ile ölçülür.
