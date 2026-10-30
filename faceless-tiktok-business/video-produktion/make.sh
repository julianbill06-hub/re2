#!/bin/bash
# make.sh <video-id>  -> rendert alle Frames (3 parallel) und mischt Ton -> out/<id>.mp4
set -e
S=$(cd "$(dirname "$0")" && pwd); ID=$1; W=$S/work/$ID
N=$(python3 -c "import json;print(json.load(open('$W/meta.json'))['frames'])")
DUR=$(python3 -c "import json;print(json.load(open('$W/meta.json'))['dur'])")
mkdir -p $W/frames $S/out
P=3; C=$(( (N + P - 1) / P ))
for i in $(seq 0 $((P-1))); do
  a=$((i*C)); b=$(( (i+1)*C < N ? (i+1)*C : N ))
  node $S/render.js $W/scene.html $W/frames $a $b &
done
wait
ffmpeg -loglevel error -y -framerate 30 -i $W/frames/f%05d.jpg -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p $W/silent.mp4
ffmpeg -loglevel error -y -i $W/mix.wav -af "loudnorm=I=-12.8:TP=-1.5:LRA=11" -ar 48000 $W/mix_norm.wav
ffmpeg -loglevel error -y -i $W/silent.mp4 -i $W/mix_norm.wav -map 0:v -map 1:a -c:v copy \
  -af "apad=whole_dur=$DUR" -c:a aac -b:a 192k -ar 48000 -movflags +faststart $S/out/$ID.mp4
echo "fertig: $S/out/$ID.mp4"
