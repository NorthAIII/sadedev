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
