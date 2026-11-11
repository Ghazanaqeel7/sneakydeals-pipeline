#!/bin/bash
# Voice + ambient music (ducked under the voice) -> project/mixed.m4a at -16 LUFS. usage: mix_audio.sh jobs/<id>
set -e
P="$1/project"; DUR=$(python3 -c "import json;print(json.load(open('$P/src/timing.json'))['duration'])")
python3 "$(dirname "$0")/make_music.py" "$P/music.wav" "$DUR"
ffmpeg -y -hide_banner -loglevel error -i "$P/voiceover.wav" -i "$P/music.wav" -filter_complex \
 "[0:a]asplit=2[v][sc];[1:a]volume=0.5[m];[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=500[d];[v][d]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[o]" \
 -map "[o]" -ar 48000 -c:a aac -b:a 192k "$P/mixed.m4a"
echo mixed
