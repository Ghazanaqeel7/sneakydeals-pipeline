#!/bin/bash
# Join chunks, add audio, make 480p preview + thumbnail. usage: finalize_long.sh jobs/<id> chunk1.mp4 chunk2.mp4 ...
set -e
J="$1"; shift; P="$J/project"; mkdir -p "$P/out"; : > "$P/out/list.txt"
for c in "$@"; do echo "file '$(realpath "$c")'" >> "$P/out/list.txt"; done
ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i "$P/out/list.txt" -c copy "$P/out/full_silent.mp4"
ffmpeg -y -hide_banner -loglevel error -i "$P/out/full_silent.mp4" -i "$P/mixed.m4a" -map 0:v -map 1:a \
  -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -profile:v high -preset medium -crf 20 \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a copy -shortest -movflags +faststart "$P/out/final.mp4"
ffmpeg -y -hide_banner -loglevel error -i "$P/out/final.mp4" -vf "scale=854:480" -c:v libx264 -preset veryfast -crf 30 -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$P/out/preview.mp4"
ffprobe -v error -show_entries format=duration,size -of compact "$P/out/final.mp4"; ls -la "$P/out"
