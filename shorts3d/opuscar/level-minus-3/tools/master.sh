#!/bin/sh
# Mux and master with the system ffmpeg (6.x): two-pass loudnorm to −14 LUFS / −1.5 dBTP, light film grain, AAC 192k.
# (The library's mux.sh needs ffmpeg 7, which this machine doesn't have.)
# usage: sh tools/master.sh video.mp4 mix.wav out.mp4
set -e
V=$1; A=$2; O=$3
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
LN="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -y -loglevel error -i "$V" -i "$A" -filter_complex "[0:v]format=yuv420p[v];[1:a]$LN,aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 18 -r 60 -c:a aac -b:a 192k -movflags +faststart -shortest "$O.tmp.mp4"
mv "$O.tmp.mp4" "$O"
ffmpeg -hide_banner -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
echo "master: $O"
