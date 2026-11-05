#!/bin/bash
# Günlük token raporu: ana makinedeki ve çalışan geliştirme konteynerlerindeki Claude oturum kayıtlarını
# okur, model çağırmaz. Rapor ~/token-rapor/<dün>.txt, özet masaüstü bildirimi. Salt okuma.
# Kullanım: gunluk-rapor.sh [--bildirimsiz]
BURA="$(cd "$(dirname "$0")" && pwd)"
CIKTI="$HOME/token-rapor"; mkdir -p "$CIKTI"
GECICI="$(mktemp)"; trap 'rm -f "$GECICI"' EXIT

topla() { # $1 klasör adı, $2.. komut
  local ad="$1"; shift
  local j; j="$("$@" 2>/dev/null)" && [ -n "$j" ] && printf '%s\t%s\n' "$ad" "$j" >> "$GECICI"
}

for d in "$HOME"/.claude/projects/*/ "$HOME"/.claude-konteyner/*/projects/*/; do
  [ -d "$d" ] || continue
  [ -n "$(find "$d" -name '*.jsonl' -mtime -9 -print -quit)" ] || continue
  topla "$(basename "$d")" node "$BURA/gunluk-topla.js" "$d" 9
done

# ~/.claude'ı ana makineden bağlı konteyner (~/.claude-konteyner/<ad>) yukarıda zaten okundu; ikinci kez sayılmasın
bagli() { docker inspect -f '{{range .Mounts}}{{.Destination}} {{end}}' "$1" 2>/dev/null | grep -qE '/\.claude( |$)'; }

# VS Code'un açtığı geliştirme konteynerleri (imaj adı vsc- ile başlar); betik stdin'den verilir
for c in $(docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | awk '$2 ~ /^vsc-/ {print $1}'); do
  bagli "$c" && continue
  for d in $(docker exec "$c" sh -c 'ls -d /home/*/.claude/projects/*/ 2>/dev/null'); do
    topla "$(basename "$d")" docker exec -i "$c" node - "$d" 9 < "$BURA/gunluk-topla.js"
  done
done

# Son 9 günde kapanmış geliştirme konteynerleri: kayıtlar konteynerin diskinde durur, docker cp ile okunur
SINIR=$(date -d '9 days ago' +%s)
for c in $(docker ps -a --filter status=exited --format '{{.Names}} {{.Image}}' 2>/dev/null | awk '$2 ~ /^vsc-/ {print $1}'); do
  bitis=$(date -d "$(docker inspect -f '{{.State.FinishedAt}}' "$c")" +%s 2>/dev/null || echo 0)
  [ "$bitis" -ge "$SINIR" ] || continue
  bagli "$c" && continue
  for k in node vscode; do
    GD="$(mktemp -d)"
    if docker cp "$c:/home/$k/.claude/projects" "$GD/" >/dev/null 2>&1; then
      for d in "$GD"/projects/*/; do topla "$(basename "$d")" node "$BURA/gunluk-topla.js" "$d" 9; done
    fi
    rm -rf "$GD"
  done
done

DUN="$(date -d yesterday +%F)"
node "$BURA/gunluk-rapor.js" < "$GECICI" > "$CIKTI/$DUN.txt"
node "$BURA/gecmis.js" < "$GECICI" >/dev/null # günlük geçmiş (~/token-rapor/gecmis.json), panoda son 5 ay
cat "$CIKTI/$DUN.txt"
[ "$1" = "--bildirimsiz" ] || notify-send -a "Token raporu" "$(head -1 "$CIKTI/$DUN.txt")" "$(sed -n '3,12p' "$CIKTI/$DUN.txt")" 2>/dev/null
exit 0
