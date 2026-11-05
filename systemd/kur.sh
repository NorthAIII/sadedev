#!/bin/bash
# Zamanlayıcıları kullanıcı düzeyinde kurar (sudo gerekmez). Geri almak: kur.sh --kaldir
set -e
HEDEF="$HOME/.config/systemd/user"; BURA="$(cd "$(dirname "$0")" && pwd)"
ZAMAN="sade-hafiza.timer sade-hafiza-hafta.timer sade-token.timer"
if [ "$1" = "--kaldir" ]; then
  systemctl --user disable --now $ZAMAN || true
  for f in "$BURA"/*.service "$BURA"/*.timer; do rm -f "$HEDEF/$(basename "$f")"; done
  rm -f "$HOME/.local/share/applications/calisma-panosu.desktop"
  systemctl --user daemon-reload; echo "kaldırıldı"; exit 0
fi
mkdir -p "$HEDEF"
for f in "$BURA"/*.service "$BURA"/*.timer; do ln -sf "$f" "$HEDEF/$(basename "$f")"; done
mkdir -p "$HOME/.local/share/applications" && cp "$BURA/../pano/calisma-panosu.desktop" "$HOME/.local/share/applications/"
systemctl --user daemon-reload
systemctl --user enable --now $ZAMAN
systemctl --user list-timers $ZAMAN --no-pager
