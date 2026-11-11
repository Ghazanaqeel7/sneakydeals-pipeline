#!/bin/bash
# Quick look at a job: one still per scene start (+1 s) into jobs/<id>/review/. usage: stills_long.sh jobs/<id> [max]
set -e
J="$1"; P="$J/project"; CH=$(command -v google-chrome || command -v chromium); mkdir -p "$J/review/long"
cd "$P"; [ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null 2>&1
python3 - <<PY > /tmp/frames.txt
import json;t=json.load(open('src/timing.json'))
for s in t['scenes']: print(s['id'], int((s['start']+min(1.5,(s['end']-s['start'])/2))*30))
PY
head -n "${2:-999}" /tmp/frames.txt | while read ID F; do npx remotion still src/index.jsx Doc "../review/long/$ID.png" --frame=$F --gl=swangle ${CH:+--browser-executable=$CH} >/dev/null 2>&1; done
echo "stills in $J/review/long"
