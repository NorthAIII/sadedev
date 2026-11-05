# Token ölçümü — oturum kayıtlarından

Salt okuma. Mesaj kimliğine göre tekilleştirir, alt ajanları dahil eder. Toplam = yeni girdi + önbellek yazma +
önbellekten okuma + çıktı (toplamın ~%97'si önbellekten okuma).

- `oturum.js <projects/klasoru> <since ISO> <son24 ISO>` → oturum başına model, token, ilk istem (JSON).
- `cagri.js <projects/klasoru> <since ISO>` → çağrı sayısı, çağrı başına ortalama bağlam ve çıktı.
- `efor.js <projects/klasoru> <since ISO>` → model × efor (kayıttaki `effort` alanı) × ana/alt ajan kırılımı.

Kayıtların yeri: host `~/.claude/projects/-home-kivanc-projects-<ad>/`; Alpfit konteyneri
`/home/node/.claude/projects/-workspaces-Alpfit-v1`; Bunker konteyneri `/home/vscode/.claude/projects/-workspaces-Bunker-OS`.
Konteynerde betik stdin'den verilir, dosya kopyalanmaz:

    docker exec -i alpfitv1_devcontainer-app-1 node - /home/node/.claude/projects/-workspaces-Alpfit-v1 2026-11-01T00:00:00Z 2026-11-03T00:00:00Z < oturum.js

Bunker konteynerinin adı VS Code'un verdiği rastgele addır (`docker ps` → imajı `vsc-bunkeros-…`).

## Canlı alarm

Eşikler (`token/canli-alarm.js`) 22 Ekim – 5 Kasım 2026 kayıtlarından, ana makine ve çalışan konteynerler:

- Proje başına saatlik toplam: ortanca 47M, %90'ı 112M, %99'u 383M. Kayan 60 dakikada 200M'yi aşan 3 gün (hepsi Alpfit, DevFlow).
- Oturum başına kayan 6 saat: 500M'yi aşan 10 oturum (Alpfit run/plan-phase ve website.v3 audit-docs `e8995466`).
- Cevap başına ana konuşmanın adımı (1.511 cevap): ortanca 5, %99'u 72; 100'ü aşan 8.

Benzetim (15 dakikada bir, aynı dönem): 25 alarm, 5 Kasım'dan (sade düzen) önce 24'ü. audit-docs oturumu
1 Kasım 07:00'de yakalanırdı (başlangıç 31 Ekim 14:24; gece yavaş koştu); 3 Kasım'da IT ölçümünde görülmüştü.
