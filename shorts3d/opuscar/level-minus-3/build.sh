#!/bin/sh
# Final Call Stories ep. 3 „Level -3“ — one command: voice (if missing) + speech check, events, picture (60 fps), sound, master, subtitles.
set -e
LIB=/root/lemo-opuscar
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"; PIPER=${PIPER:-/home/user/kanaele/.piper/bin/python}
export LIB HF_HUB_DISABLE_XET=1
cd "$LIB"
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/l17.wav" ]; then "$PIPER" "$HERE/tools/tts_de.py" "$HERE/voice/lines.json" "$HERE/out/voice" --length 1.1; fi
"$PY" "$HERE/tools/asr_de.py" "$HERE/voice/lines.json" "$HERE/out/voice"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 60 --workers 3 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh "$HERE/tools/master.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/level-minus-3.mp4"
"$PY" core/render/srt.py "$HERE/out/cues_en.json" "$HERE/subtitles_en.srt"
echo "done: $HERE/level-minus-3.mp4"
