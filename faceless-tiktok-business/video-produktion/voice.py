"""Erzeugt pro Satz mehrere TTS-Takes, prüft sie per Whisper und legt den besten in den Cache.
Aufruf: python3 voice.py specs/v01.json [specs/v02.json ...]"""
import json, sys, os, re, hashlib, subprocess, difflib
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tts
from build import up

R = os.path.dirname(os.path.abspath(__file__)); A = R + "/asr"
W = A + "/sherpa-onnx-whisper-small/small-"
NUM = {"1": "eins", "2": "zwei", "3": "drei", "4": "vier", "5": "fünf", "6": "sechs", "7": "sieben", "8": "acht",
       "9": "neun", "10": "zehn", "12": "zwölf", "20": "zwanzig", "30": "dreißig", "100": "hundert"}

def norm(s):
    s = s.lower().replace("ß", "ss")
    s = re.sub(r"\d+", lambda m: NUM.get(m.group(), m.group()), s)
    s = re.sub(r"[^a-zäöü ]", " ", s)
    return " ".join(s.split())

def asr(arrs):
    files = []
    os.makedirs(R + "/work/asr", exist_ok=True)
    for i, a in enumerate(arrs):
        x = np.arange(int(len(a) * 16000 / 44100)) * 44100 / 16000
        b = np.concatenate([np.zeros(8000), np.interp(x, np.arange(len(a)), a), np.zeros(32000)])
        f = f"{R}/work/asr/t{i:03d}.wav"; tts.save(f, b * 0.8, 16000); files.append(f)
    out = subprocess.run([A + "/sherpa-onnx-v1.12.0-linux-x64-static/bin/sherpa-onnx-offline",
                          f"--whisper-encoder={W}encoder.int8.onnx", f"--whisper-decoder={W}decoder.int8.onnx",
                          f"--tokens={W}tokens.txt", "--whisper-language=de", "--num-threads=4"] + files,
                         capture_output=True, text=True)
    txt = out.stdout + out.stderr
    # Ergebnisse den Dateien zuordnen
    res = {}
    for f in files:
        m = re.search(re.escape(f) + r'\s*\{[^}]*"text": "(.*?)"', txt, re.S)
        res[f] = m.group(1) if m else ""
    return [res[f] for f in files]

def score(want, got):
    return difflib.SequenceMatcher(None, norm(want), norm(got)).ratio()

def run(spec_path, takes=5):
    spec = json.load(open(spec_path))
    todo = []
    for sc in spec["scenes"]:
        sp = sc.get("speed", spec.get("speed", 1.0))
        key = hashlib.md5(f'{sc["say"]}|{sp}'.encode()).hexdigest()
        cp = f"{R}/work/cache/{key}.npy"
        if not os.path.exists(cp + ".ok"):
            todo.append((sc["say"], sp, cp))
    if not todo: print(spec["id"], "alles im Cache"); return
    os.makedirs(R + "/work/cache", exist_ok=True)
    best = {cp: (-1, None, "") for _, _, cp in todo}
    pending = todo
    for rnd in range(takes):
        arrs = [up(tts.synth(s, length=sp)) for s, sp, _ in pending]
        got = asr(arrs)
        nxt = []
        for (s, sp, cp), a, g in zip(pending, arrs, got):
            sc_ = score(s, g)
            if sc_ > best[cp][0]: best[cp] = (sc_, a, g)
            if best[cp][0] < 0.97: nxt.append((s, sp, cp))
        pending = nxt
        if not pending: break
    for s, sp, cp in todo:
        sc_, a, g = best[cp]
        np.save(cp, a); open(cp + ".ok", "w").write(g)
        flag = "  <-- prüfen" if sc_ < 0.93 else ""
        print(f"{sc_:.2f} | {s}\n     | {g}{flag}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        run(p)
