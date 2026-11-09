#!/bin/bash
# Start a new job folder from the template.  usage: pipeline/scripts/new_job.sh <id>   e.g. 002-disney-swamp
set -e
ID="$1"; [ -n "$ID" ] || { echo "usage: new_job.sh <id>"; exit 1; }
D="jobs/$ID"; [ -e "$D" ] && { echo "$D exists"; exit 1; }
mkdir -p "$D"; cp -r pipeline/template "$D/project"
echo "created $D (write $D/script.md, $D/SHOTS.txt, $D/meta.json)"
