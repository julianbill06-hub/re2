"""German narration, offline: Piper with the Thorsten voice (CC0), one WAV per line.
usage: .piper/bin/python tools/tts_de.py voice/lines.json out/voice [--length 1.0]
lines.json = [{id, text, say?}]; writes <id>.wav (24 kHz mono, silence trimmed) and dur.json, like the library's tts.py
"""
import sys, json, os, wave, argparse
import numpy as np
from piper import PiperVoice, SynthesisConfig

ap = argparse.ArgumentParser(); ap.add_argument('lines'); ap.add_argument('out'); ap.add_argument('--length', type=float, default=1.0)
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
v = PiperVoice.load('/home/user/kanaele/voice/model/de_DE-thorsten-high.onnx')
cfg = SynthesisConfig(length_scale=a.length, noise_scale=.6, noise_w_scale=.7)
dur = {}
for L in json.load(open(a.lines)):
    sr = None; parts = []
    for ch in v.synthesize(L.get('say', L['text']), syn_config=cfg):
        sr = ch.sample_rate; parts.append(np.frombuffer(ch.audio_int16_bytes, np.int16).astype(np.float32) / 32768)
    x = np.concatenate(parts)
    # trim silence (−45 dB), keep 40 ms
    e = np.abs(x) > 10 ** (-45 / 20); i0, i1 = np.argmax(e), len(x) - np.argmax(e[::-1])
    x = x[max(0, i0 - int(.04 * sr)): min(len(x), i1 + int(.04 * sr))]
    # resample to 24 kHz
    n = int(round(len(x) * 24000 / sr)); y = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    with wave.open(os.path.join(a.out, L['id'] + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    dur[L['id']] = round(n / 24000, 3); print(L['id'], dur[L['id']])
json.dump(dur, open(os.path.join(a.out, 'dur.json'), 'w'), indent=1)
