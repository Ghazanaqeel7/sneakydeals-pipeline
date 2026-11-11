#!/bin/bash
# Start a long-form job folder. usage: pipeline/longform/new_long_job.sh <id>   (id is numeric-first, e.g. 004-sears-fall)
set -e
ID="$1"; [ -n "$ID" ] || { echo "usage: new_long_job.sh <id>"; exit 1; }
case "$ID" in [0-9]*) ;; *) echo "id must start with a digit"; exit 1;; esac
D="jobs/$ID"; [ -e "$D" ] && { echo "$D exists"; exit 1; }
mkdir -p "$D"
rsync -a --exclude node_modules --exclude package-lock.json --exclude out --exclude 'public/assets/*' pipeline/template-long/ "$D/project/" 2>/dev/null || {
  mkdir -p "$D/project"; (cd pipeline/template-long && tar cf - --exclude=node_modules --exclude=out --exclude='public/assets/*' .) | (cd "$D/project" && tar xf -); }
mkdir -p "$D/project/public/assets" "$D/review"
echo "created $D. Write: $D/script.md, $D/factmap.md, $D/project/src/scenes.json, $D/project/src/thumb.json, $D/meta.json (type:long)"
