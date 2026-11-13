#!/bin/bash
# Render one job end to end (used by GitHub Actions; also works in a Claude session, just slower).
# usage: pipeline/scripts/render_job.sh jobs/<id> [concurrency]
set -e
J="$1"; C="${2:-4}"; P="$J/project"
CH=$(command -v google-chrome || command -v chromium || command -v chromium-browser)
cd "$P"; npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null
mkdir -p out; rm -f out/full_silent.mp4
npx remotion render src/index.jsx Story out/full_silent.mp4 --gl=swangle ${CH:+--browser-executable=$CH} \
  --concurrency=$C --timeout=180000 --image-format=jpeg --jpeg-quality=92 --crf=17
cd - >/dev/null
bash pipeline/scripts/finalize.sh "$J"
