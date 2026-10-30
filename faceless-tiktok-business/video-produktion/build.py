"""Baut aus einer Video-Spec (JSON) Timeline, HTML-Szene und Ton-Mix.
Aufruf: python3 build.py specs/v01.json  -> work/v01/{scene.html, mix.wav, meta.json}"""
import json, os, re, sys, hashlib
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tts

ROOT = os.path.dirname(os.path.abspath(__file__))
SR = 44100
GAP = 0.3

STOP = set("der die das den dem des ein eine einen einem einer und oder an in im mit zu zum zur vom von auf für bei nur noch nicht so wie aus dir dich mir ich du es sie er wir ihr ist sind bis über unter nach vor als dass weil wenn ganz sehr ab um am".split())

def chunk(text):
    words, out, cur = text.split(), [], []
    for i, w in enumerate(words):
        cur.append(w)
        n = len(" ".join(cur))
        end = bool(re.search(r"[.,:;!?–]$", w))
        weak = w.lower().strip(",.:") in STOP
        nxt_end = i + 1 < len(words) and re.search(r"[.,:;!?–]$", words[i + 1])
        if end and len(cur) == 1 and out and len(out[-1]) + len(w) < 30 and not re.search(r"[.:!?]$", out[-1]):
            out[-1] += " " + w; cur = []
        elif end or (((len(cur) >= 4 or n > 20) and not weak and not (nxt_end and len(cur) < 5)) or len(cur) >= 6):
            out.append(" ".join(cur)); cur = []
    if cur:
        if out and len(cur) == 1 and len(out[-1]) + len(cur[0]) < 28:
            out[-1] += " " + cur[0]
        else:
            out.append(" ".join(cur))
    return out

def up(a, sr_in=22050):
    x = np.arange(int(len(a) * SR / sr_in)) * sr_in / SR
    return np.interp(x, np.arange(len(a)), a).astype(np.float32)

def music(dur, bpm=104, seed=1):
    n = int(dur * SR); t = np.arange(n) / SR; m = np.zeros(n, np.float32)
    beat = 60 / bpm
    chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66], [164.81, 207.65, 246.94]]
    bar = beat * 4
    for i in range(int(dur / (bar * 2)) + 1):
        c = chords[i % 4]; s = i * bar * 2; e = min(s + bar * 2, dur)
        a, b = int(s * SR), int(e * SR)
        if a >= n: break
        tt = t[a:b] - s
        env = np.minimum(1, tt / 0.3) * np.minimum(1, (e - s - tt) / 0.3)
        for f in c:
            m[a:b] += (0.5 * np.sin(2 * np.pi * f * tt) + 0.15 * np.sin(2 * np.pi * 2 * f * tt)) * env * 0.12
    # Pluck-Arpeggio auf Achteln
    for k in range(int(dur / (beat / 2))):
        s = k * beat / 2; a = int(s * SR); L = int(0.25 * SR)
        if a + L >= n: break
        c = chords[int(s / (bar * 2)) % 4]; f = c[k % 3] * 2
        tt = np.arange(L) / SR
        m[a:a + L] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 14) * 0.10
    # Kick (über 75 Hz) + Hat
    for k in range(int(dur / beat)):
        a = int(k * beat * SR); L = int(0.18 * SR)
        if a + L >= n: break
        tt = np.arange(L) / SR
        f = 150 * np.exp(-tt * 20) + 80
        m[a:a + L] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18) * 0.35
        h = a + int(beat / 2 * SR); L2 = int(0.04 * SR)
        if h + L2 < n:
            rng = np.random.default_rng(k)
            noise = rng.standard_normal(L2) * np.exp(-np.arange(L2) / SR * 90)
            m[h:h + L2] += np.diff(np.concatenate([[0], noise])) * 0.05
    return m / max(np.abs(m).max(), 1e-6)

def pop_sfx():
    L = int(0.09 * SR); tt = np.arange(L) / SR
    f = 500 + 900 * tt / tt[-1]
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 40)).astype(np.float32)

def build(spec_path):
    spec = json.load(open(spec_path))
    vid = spec["id"]; work = f"{ROOT}/work/{vid}"; os.makedirs(work, exist_ok=True)
    t = 0.12; caps, tags, panels, voice_parts = [], [], [], []
    cur_tag = None; cur_panel = None
    for i, sc in enumerate(spec["scenes"]):
        sp = sc.get("speed", spec.get("speed", 1.0))
        key = hashlib.md5(f'{sc["say"]}|{sp}'.encode()).hexdigest()
        cp = f"{ROOT}/work/cache/{key}.npy"
        if os.path.exists(cp): a = np.load(cp)
        else:
            a = up(tts.synth(sc["say"], length=sp)); os.makedirs(os.path.dirname(cp), exist_ok=True); np.save(cp, a)
        d = len(a) / SR
        voice_parts.append((t, a))
        s, e = t, t + d
        # Captions
        chunks = chunk(sc.get("show", sc["say"]))
        w = np.array([len(c) + 4 for c in chunks], float); w /= w.sum()
        cs = s
        for c, f in zip(chunks, w):
            caps.append({"text": c, "s": round(cs, 3), "e": round(cs + f * d, 3), "hl": sc.get("hl", [])})
            cs += f * d
        if "tag" in sc:
            if cur_tag: cur_tag["e"] = s
            cur_tag = {"text": sc["tag"], "s": s, "e": None} if sc["tag"] else None
            if cur_tag: tags.append(cur_tag)
        if "panel" in sc:
            if cur_panel: cur_panel["e"] = s
            cur_panel = {"data": sc["panel"], "s": s, "ce": e, "e": None} if sc["panel"] else None
            if cur_panel: panels.append(cur_panel)
        t = e + sc.get("pause", GAP)
        # Lücken zwischen Caption-Chunks schließen
    for a, b in zip(caps, caps[1:]):
        if b["s"] - a["e"] < 0.5: a["e"] = b["s"]
        else: a["e"] += 0.25
    dur = round(t + 1.2, 2)
    caps[-1]["e"] = dur
    for g in tags + panels:
        if g["e"] is None: g["e"] = dur
    for p in panels:
        n = len(p["data"].get("items", []))
        span = min(p["e"] - p["s"], 6)
        p["itemT"] = [p["s"] + 0.1 + k * min(0.7, span * 0.6 / max(n, 1)) for k in range(n)]
    hook = None
    if spec.get("hook"):
        first = spec["scenes"][0]
        hook = {"html": spec["hook"], "e": round(voice_parts[0][0] + len(voice_parts[0][1]) / SR + 0.1, 3)}
        for c in caps:  # Unter dem Hook keine doppelte Caption
            if c["s"] < hook["e"]: c["e"] = c["s"]
    data = {"dur": dur, "caps": caps, "tags": tags, "panels": panels, "hook": hook}
    html = open(f"{ROOT}/template.html").read().replace("__DATA__", json.dumps(data, ensure_ascii=False))
    open(f"{work}/scene.html", "w").write(html)
    # Ton
    n = int(dur * SR) + SR
    v = np.zeros(n, np.float32)
    for s, a in voice_parts:
        i = int(s * SR); v[i:i + len(a)] += a
    env = np.convolve(np.abs(v), np.ones(int(0.3 * SR)) / int(0.3 * SR), mode="same")
    duck = 1 - 0.55 * np.clip(env / 0.08, 0, 1)
    m = np.resize(music(n / SR), n) * 0.16 * duck
    fx = np.zeros(n, np.float32); p = pop_sfx()
    for g in panels + tags:
        i = int(g["s"] * SR); fx[i:i + len(p)] += p * 0.10
    mix = v * 0.85 + m + fx
    mix = mix[: int(dur * SR)]
    tts.save(f"{work}/mix.wav", mix / max(np.abs(mix).max(), 1e-6) * 0.9, SR)
    json.dump({"dur": dur, "frames": int(dur * 30)}, open(f"{work}/meta.json", "w"))
    print(vid, "dur", dur)

if __name__ == "__main__":
    for p in sys.argv[1:]:
        build(p)
