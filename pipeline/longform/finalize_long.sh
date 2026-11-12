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
# upload.mp4: copy for the YouTube Zap, kept under 95 MB (Zapier times out on files over ~100 MB). Two-pass to an exact size;
# 1080p when the bitrate allows it, else 720p. If final.mp4 is already small enough it is used as is.
SIZE=$(stat -c %s "$P/out/final.mp4"); DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/out/final.mp4")
if [ "$SIZE" -le 95000000 ]; then cp "$P/out/final.mp4" "$P/out/upload.mp4"; else
  VK=$(python3 -c "print(max(300,int(95e6*8/1000/float('$DUR')*0.97)-128))")
  H=1080; [ "$VK" -lt 2200 ] && H=720
  ( cd "$P/out" && ffmpeg -y -hide_banner -loglevel error -i final.mp4 -vf "scale=-2:$H" -c:v libx264 -preset medium -b:v ${VK}k -pass 1 -passlogfile up -an -f mp4 /dev/null \
    && ffmpeg -y -hide_banner -loglevel error -i final.mp4 -vf "scale=-2:$H" -c:v libx264 -preset medium -b:v ${VK}k -pass 2 -passlogfile up -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart upload.mp4 )
fi
for f in final upload; do ffprobe -v error -show_entries format=duration,size -of compact "$P/out/$f.mp4"; done; ls -la "$P/out"
