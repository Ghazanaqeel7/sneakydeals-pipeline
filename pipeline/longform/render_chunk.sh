#!/bin/bash
# Render one frame range of the Doc composition. usage: render_chunk.sh jobs/<id> <from> <to> <outfile> [concurrency]
set -e
J="$1"; A="$2"; B="$3"; OUT="$4"; C="${5:-4}"; P="$J/project"
CH=$(command -v google-chrome || command -v chromium || command -v chromium-browser)
cd "$P"; [ -d node_modules ] || { npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null; }
mkdir -p out
npx remotion render src/index.jsx Doc "$OUT" --frames="$A-$B" --gl=swangle ${CH:+--browser-executable=$CH} --concurrency=$C --image-format=jpeg --jpeg-quality=92 --crf=18
