#!/bin/bash
# Panoyu yeniler ve tarayıcıda açar (model çağırmaz, birkaç saniye)
node "$(dirname "$0")/olustur.js" >/dev/null && xdg-open "$HOME/pano/index.html" >/dev/null 2>&1 &
