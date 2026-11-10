#!/bin/bash
# Mux the silent render with the narration into the upload file.
# usage: pipeline/scripts/finalize.sh jobs/<id>
# Output: jobs/<id>/project/out/final.mp4 — H.264 yuv420p (plays everywhere), 720x1280 30 fps,
# loudness -16 LUFS, capped near 2.5 Mbit/s so the file stays under ~19 MB (Telegram sends by URL only up to 20 MB).
set -e
P="$1/project"
A="$P/voiceover.mp3"; [ -f "$A" ] || A="$P/voiceover.wav"
ffmpeg -y -hide_banner -loglevel error -i "$P/out/full_silent.mp4" -i "$A" -map 0:v -map 1:a \
  -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -profile:v high -level 4.0 -preset medium \
  -crf 21 -maxrate 2500k -bufsize 5000k -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 160k -shortest -movflags +faststart "$P/out/final.mp4"
ffprobe -v error -show_entries stream=codec_type,width,height,pix_fmt:format=duration,size -of compact "$P/out/final.mp4"
SIZE=$(stat -c %s "$P/out/final.mp4"); [ "$SIZE" -lt 20000000 ] || { echo "final.mp4 is over 20 MB ($SIZE)"; exit 1; }
# small preview for Discord (bots can attach files up to ~10 MB)
ffmpeg -y -hide_banner -loglevel error -i "$P/out/final.mp4" -vf "scale=540:960" -c:v libx264 -preset medium -crf 28 -maxrate 1100k -bufsize 2200k \
  -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "$P/out/preview.mp4"
ls -la "$P/out/preview.mp4"
