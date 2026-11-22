"""Speech check for the German narration: faster-whisper (language de) hears each WAV; the words must match the script
(numbers compared by value; similarity ≥ 0.9). Writes words.json (word timestamps) next to the WAVs. Exit 1 on any failure.
usage: $LIB/.venv/bin/python tools/asr_de.py voice/lines.json out/voice
"""
import sys, json, os, re, difflib
from faster_whisper import WhisperModel
NUM = {'km': 'kilometer', 'mehr': 'meer', 'hundert': '100', 'drei': '3', 'minus': '-'}
def norm(s):
    s = s.lower(); s = re.sub(r'[^\wäöüß ]', ' ', s)
    w = [NUM.get(x, x) for x in s.split()]
    return w
lines, d = json.load(open(sys.argv[1])), sys.argv[2]
m = WhisperModel('small', device='cpu', compute_type='int8')
bad, words = 0, {}
for L in lines:
    segs, _ = m.transcribe(os.path.join(d, L['id'] + '.wav'), language='de', word_timestamps=True, beam_size=5)
    segs = list(segs); got = ' '.join(s.text for s in segs).strip()
    r = difflib.SequenceMatcher(None, ''.join(norm(L['text'])), ''.join(norm(got))).ratio()
    ok = r >= .9; bad += not ok
    words[L['id']] = [{'w': w.word.strip(), 't0': round(w.start, 3), 't1': round(w.end, 3)} for s in segs for w in (s.words or [])]
    print(('ok  ' if ok else 'FAIL'), L['id'], f'{r:.2f}', '|', got)
json.dump(words, open(os.path.join(d, 'words.json'), 'w'), ensure_ascii=False, indent=1)
sys.exit(1 if bad else 0)
