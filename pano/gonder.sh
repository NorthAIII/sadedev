#!/bin/bash
# Pano verisini (~/pano/pano.json) Bunker OS'a gönderir. Ayar yoksa sessizce çıkar.
# Ayar: ~/.gizli/bunker-pano.env (600) içinde BUNKER_PANO_URL ve BUNKER_PANO_TOKEN. Değerler depoya ve çıktıya yazılmaz.
AYAR="$HOME/.gizli/bunker-pano.env"; VERI="$HOME/pano/pano.json"
[ -f "$AYAR" ] && [ -f "$VERI" ] || exit 0
set -a; . "$AYAR"; set +a
[ -n "$BUNKER_PANO_URL" ] && [ -n "$BUNKER_PANO_TOKEN" ] || exit 0
kod=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -X POST -H "Authorization: Bearer $BUNKER_PANO_TOKEN" \
  -H 'Content-Type: application/json' --data-binary @"$VERI" "$BUNKER_PANO_URL")
[ "$kod" = "200" ] || [ "$kod" = "204" ] || { echo "pano gönderilemedi: HTTP $kod" >&2; exit 1; }
