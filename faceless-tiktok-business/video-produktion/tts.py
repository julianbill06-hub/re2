"""TTS: Piper-Phonemize + Thorsten-high via onnxruntime. Liefert pro Satz eine WAV + Dauer."""
import json, subprocess, sys, os, wave
import numpy as np, onnxruntime as ort

D = os.path.dirname(os.path.abspath(__file__)) + "/tts"
VOICE = D + "/vits-piper-de_DE-thorsten-high/de_DE-thorsten-high.onnx"
SR = 22050
_sess = None

def phonemize(text):
    p = subprocess.run([D + "/piper/piper_phonemize", "-l", "de", "--espeak-data", D + "/piper/espeak-ng-data"],
                       input=text.replace("\n", " "), capture_output=True, text=True,
                       env={**os.environ, "LD_LIBRARY_PATH": D + "/piper"})
    ids = []
    for line in p.stdout.strip().splitlines():
        j = json.loads(line)
        ids += j["phoneme_ids"]
        if "??" in "".join(j["phonemes"]):
            print("WARN ?? phonemes:", text, file=sys.stderr)
    return ids

def synth(text, length=0.92, noise=0.6, noise_w=0.7):
    global _sess
    if _sess is None:
        _sess = ort.InferenceSession(VOICE, providers=["CPUExecutionProvider"])
    ids = np.array([phonemize(text)], dtype=np.int64)
    out = _sess.run(None, {"input": ids, "input_lengths": np.array([ids.shape[1]], np.int64),
                           "scales": np.array([noise, length, noise_w], np.float32)})[0]
    a = out.squeeze().astype(np.float32)
    # Stille an den Rändern kappen
    e = np.abs(a) > 0.01 * np.abs(a).max()
    idx = np.where(e)[0]
    a = a[max(idx[0] - 400, 0): idx[-1] + 1500]
    return a / max(np.abs(a).max(), 1e-6) * 0.9

def save(path, a, sr=SR):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes())
