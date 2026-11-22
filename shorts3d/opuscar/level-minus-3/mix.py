"""Sound for „Level -3“ (Final Call Stories ep. 3, Liminal Found Footage look): no score, only what the tape would record.

Fluorescent hum gated by the light curve, garage room tone, footsteps on concrete with a parking-garage echo, camcorder motor,
zoom servo, AF ticks, doors, tape tears, the rewind, the barrier, a car and birds outside, silences before the shocks,
a low hit on frame 0 (series rule). Voice: dry, close, compressed; bed ≈ 8 dB under it; −14 LUFS in the master.
usage: $LIB/.venv/bin/python mix.py      writes out/mix.wav
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, clack, whoosh, thump, creak, step

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json'))); FULL = float(D['dur']); EV = D['ev']
CUES = json.load(open(os.path.join(HERE, 'voice', 'cues.json')))
N = int(FULL * SR) + SR; tt = np.arange(N) / SR
rng = np.random.default_rng(3)
env = lambda pts: np.interp(tt, *zip(*pts))
st = lambda x, d=1733: np.stack([x, np.roll(x, d)], 1)
ev = lambda k: [e for e in EV if e['type'] == k]
FL = [30.25, 31.35, 32.4]; TWIST = 41.1

# light curve (the same as the picture): flickers, the twist, black before the rewind
g = np.ones(N)
for f in FL: g[(tt > f - .04) & (tt < f + .13)] = .02
g[(tt > TWIST - .05) & (tt < TWIST + .12)] = .02
g[(tt > 25.15) & (tt < 25.6)] = 0
day = np.clip((tt - 36.0) / 1.6, 0, 1) * (tt < TWIST) * (tt >= 35.5)
rew = (tt >= 25.6) & (tt < 28.6)
# silences: digital zero for the bed (hush before the choice, the beat before the twist, black before the rewind)
quiet = np.ones(N)
for a, b in [(16.2, 16.55), (40.0, TWIST), (25.15, 25.6)]: quiet[(tt > a) & (tt < b)] = 0
quiet = np.convolve(quiet, np.ones(240) / 240, 'same')

mix = np.zeros((N, 2))
# fluorescent hum: 100 Hz + harmonics, a buzzy band, ballast whine; gated by the light; weaker outdoors, absent in the rewind
f0 = 100.0
hum = sum(a * np.sin(2 * np.pi * f0 * k * tt + k) for k, a in [(1, 1), (2, .5), (3, .35), (4, .2), (6, .12)])
buzz = bp(np.sign(np.sin(2 * np.pi * 100 * tt)) * .3 + rng.standard_normal(N) * .2, 900, 3500, 2)
whine = np.sin(2 * np.pi * 9800 * tt) * .02
bed = (hum * .012 + buzz * .01 + whine * .3) * g * (1 - .7 * day) * ~rew
room = lp(rng.standard_normal(N), 380, 2) * .02 * (1 - .5 * day) * ~rew                                # big concrete room tone
vent = bp(rng.standard_normal(N), 150, 1200, 2) * .008 * ~rew
stair = bp(rng.standard_normal(N), 200, 2000, 2) * .006 * ((tt > 21) & (tt < 23.75))                   # the shaft: closer, drier
mix += st((bed + room + vent + stair) * quiet)
# outside: morning air and birds while the daylight is in
air = bp(rng.standard_normal(N), 400, 6000, 2) * .012 * day
mix += st(air)
for t0 in np.sort(rng.uniform(36.4, 40.6, 9)):
    n = int(.18 * SR); x = np.arange(n) / SR; f = 3200 + 900 * np.sin(2 * np.pi * 14 * x) + rng.uniform(-300, 300)
    chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / x[-1]) ** 2 * .02
    add(mix, chirp, t0, 1, rng.uniform(-.6, .6))

# parking-garage echo for footsteps and doors: a sparse, long, dark reflection train
def echo(x, wet=.35):
    y = x.copy()
    for d, a in [(.09, .5), (.17, .35), (.29, .25), (.43, .16), (.61, .1), (.83, .06)]: y = y + np.pad(x, (int(d * SR), 0))[:len(x)] * a * wet
    return lp(y, 5000, 1)
def pad(x, s=1.2): return np.concatenate([x, np.zeros(int(s * SR))])

for e in EV:
    k, t = e['type'], e['t']
    if k == 'step':
        a, b = hp(step(e['v']), 120) * .5, hp(click(pitch=.7, v=1.0), 900) * .05 * e['v']               # hard sole on concrete + a little rubber squeak
        s = np.zeros(max(len(a), len(b))); s[:len(a)] += a; s[:len(b)] += b
        add(mix, echo(pad(s), .45 if not e.get('rev') else .2) * (.8 if e.get('rev') else 1), t, 1, rng.uniform(-.15, .15))
    elif k == 'stepStair': add(mix, echo(pad(hp(step(e['v']), 160) * .55), .25), t, 1, rng.uniform(-.1, .1))
    elif k == 'hit':                                                                                       # frame 0 (series rule) and the second -3
        add(mix, thump(1.0, 42) * .5, t, 1, 0); add(mix, echo(pad(lp(rng.standard_normal(int(1.2 * SR)), 180) * np.exp(-np.arange(int(1.2 * SR)) / SR / .4) * .2)), t, 1, 0)
    elif k == 'tear':
        n = int(e['d'] * SR); x = np.arange(n) / SR
        add(mix, bp(rng.standard_normal(n), 800, 7000, 2) * .12 * np.sin(np.pi * x / x[-1]), t, 1, 0); add(mix, hp(clack(pitch=1.4), 400) * .1, t, 1, 0)
    elif k == 'zoom':
        n = int(e['d'] * SR); x = np.arange(n) / SR
        servo = bp(np.sign(np.sin(2 * np.pi * (420 + 60 * x) * x)) + .3 * rng.standard_normal(n), 300, 2500, 2) * .012
        add(mix, servo, t, 1, .3)
    elif k == 'af':
        for d in (0, .06, .14): add(mix, hp(click(pitch=2.2, v=1.0), 3000) * .02, t + d, 1, .3)
    elif k == 'door':
        add(mix, echo(pad(creak(1.0) * .25)), t, 1, -.3); add(mix, hp(clack(pitch=.6), 200) * .25, t + .05, 1, -.3)
    elif k == 'cut': add(mix, hp(clack(pitch=.9), 300) * .25, t, 1, 0)                                    # the camera's stop button
    elif k == 'rewind':                                                                                   # rewind: motor whine rising, tape chatter, voices squeaking backwards
        n = int(e['d'] * SR); x = np.arange(n) / SR
        f = 900 + 1700 * np.clip(x / .6, 0, 1); motor = np.sin(2 * np.pi * np.cumsum(f) / SR) * .03
        chatter = bp(rng.standard_normal(n), 2500, 9000, 2) * (.5 + .5 * np.sin(2 * np.pi * 23 * x)) * .05
        squeak = bp(np.sin(2 * np.pi * np.cumsum(1200 + 600 * np.sin(2 * np.pi * 7 * x)) / SR), 800, 4000, 1) * .02
        fade = np.minimum(1, x / .08) * np.minimum(1, (x[-1] - x) / .1)
        add(mix, (motor + chatter + squeak) * fade, t, 1, 0); add(mix, hp(clack(pitch=1.2), 300) * .25, t, 1, 0); add(mix, hp(clack(pitch=1.0), 300) * .25, t + e['d'], 1, 0)
    elif k == 'flick':                                                                                    # ballast tink, the hum drops, a sub-thump when he is closer
        add(mix, hp(click(pitch=3.0, v=1.0), 3000) * .05, t, 1, .2); add(mix, thump(1.0, 38) * .35, t + .13, 1, 0)
    elif k == 'rustle': add(mix, bp(rng.standard_normal(int(.5 * SR)), 600, 4000, 2) * np.hanning(int(.5 * SR)) * .03, t, 1, .1)
    elif k == 'barrier':
        n = int(1.1 * SR); x = np.arange(n) / SR
        add(mix, echo(pad(bp(np.sin(2 * np.pi * 110 * x) + .4 * rng.standard_normal(n), 80, 1500, 2) * np.minimum(1, x / .05) * np.minimum(1, (x[-1] - x) / .1) * .05)), t, 1, -.2)
        add(mix, hp(clack(pitch=.8), 200) * .2, t + 1.1, 1, -.2)
    elif k == 'car': add(mix, lp(whoosh(2.6, 1.0), 900) * .12, t, 1, 0)
    elif k == 'twist':                                                                                    # all lights restrike at once after the silence
        add(mix, thump(1.0, 36) * .55, t, 1, 0); add(mix, hp(click(pitch=2.6, v=1.0), 2500) * .08, t + .12, 1, 0)
    elif k == 'turn': add(mix, bp(rng.standard_normal(int(.4 * SR)), 500, 3500, 2) * np.hanning(int(.4 * SR)) * .03, t, 1, 0)
    elif k == 'chips': add(mix, hp(click(pitch=1.5, v=1.0), 1500) * .04, t, 1, 0)
# camcorder motor: a faint whine under everything while REC is on
motor = bp(np.sin(2 * np.pi * 61 * tt) + .2 * rng.standard_normal(N), 50, 400, 2) * .004 * ~rew * ((tt < 25.15) | (tt > 25.6))
mix += st(motor)

# ---------------- narration ----------------
voice = np.zeros(N); active = np.zeros(N)
for c in CUES:
    x, sr = sf.read(os.path.join(HERE, 'out', 'voice', c['id'] + '.wav'), dtype='float64')
    if sr != SR: x = soxr.resample(x, sr, SR)
    i = int(c['t0'] * SR); j = min(N, i + len(x)); voice[i:j] += x[:j - i]; active[i:j] = 1
voice = hp(voice, 70, 2); voice = voice + lp(voice, 220, 2) * .3                                               # close, a little proximity
voice = compress(voice, thr=.15, ratio=3.0)
vr = np.sqrt((voice[active > 0] ** 2).mean()); voice *= .16 / vr
br = np.sqrt((mix[active > 0] ** 2).mean()); mix *= min(1.0, (.16 * 10 ** (-8 / 20)) / max(br, 1e-9))
duck = np.convolve(active, np.ones(int(.2 * SR)) / int(.2 * SR), 'same'); mix *= (1 - .3 * np.clip(duck * 1.4, 0, 1))[:, None]
mix += np.stack([voice, voice], 1)
out = mix[:int(FULL * SR)]
out = np.stack([compress(out[:, 0], thr=.4, ratio=2.0), compress(out[:, 1], thr=.4, ratio=2.0)], 1)
out = np.stack([limit(out[:, 0]), limit(out[:, 1])], 1)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR)
print(f'mix 0-{FULL}s peak {np.abs(out).max():.3f}')
