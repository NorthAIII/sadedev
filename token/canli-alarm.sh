#!/bin/bash
# Canlı token alarmı (15 dakikada bir): ana makinedeki ve çalışan geliştirme konteynerlerindeki Claude oturum
# kayıtlarının son 6 saatini okur, model çağırmaz. Kurallar ve eşikler canli-alarm.js'de. Salt okuma.
# Yeni alarm masaüstüne kalıcı bildirim olarak gelir ve ~/token-rapor/canli-alarm.log'a yazılır.
# Kullanım: canli-alarm.sh [--bildirimsiz]
BURA="$(cd "$(dirname "$0")" && pwd)"
CIKTI="$HOME/token-rapor"; mkdir -p "$CIKTI"
GECICI="$(mktemp)"; trap 'rm -f "$GECICI"' EXIT

topla() { # $1 klasör adı, $2.. komut
  local ad="$1"; shift
  local j; j="$("$@" 2>/dev/null)" && [ -n "$j" ] && printf '%s\t%s\n' "$ad" "$j" >> "$GECICI"
}

for d in "$HOME"/.claude/projects/*/ "$HOME"/.claude-konteyner/*/projects/*/; do
  [ -d "$d" ] || continue
  [ -n "$(find "$d" -name '*.jsonl' -mmin -360 -print -quit)" ] || continue
  topla "$(basename "$d")" node "$BURA/canli-topla.js" "$d" 6
done

# VS Code'un açtığı geliştirme konteynerleri (imaj adı vsc- ile başlar); betik stdin'den verilir
for c in $(docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | awk '$2 ~ /^vsc-/ {print $1}'); do
  for d in $(docker exec "$c" sh -c 'ls -d /home/*/.claude/projects/*/ 2>/dev/null'); do
    topla "$(basename "$d")" docker exec -i "$c" node - "$d" 6 < "$BURA/canli-topla.js"
  done
done

ALARM="$(node "$BURA/canli-alarm.js" < "$GECICI")"
[ -n "$ALARM" ] || exit 0
while IFS= read -r a; do
  echo "$(date '+%F %H:%M')  $a" >> "$CIKTI/canli-alarm.log"
  echo "$a"
  [ "$1" = "--bildirimsiz" ] || notify-send -u critical -a "Token alarmı" "Token alarmı" "$a" 2>/dev/null
done <<< "$ALARM"
exit 0
