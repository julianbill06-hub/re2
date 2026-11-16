# Sound design for Final Call Stories – Platform Zero (timed from src/timing_pz.json)
import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR = 48000; tm = json.load(open('src/timing_pz.json')); D = 59.45 + 0.3; N = int(D * SR); x = np.arange(N) / SR
rng = np.random.default_rng(7)
L = lambda i: tm['lines'][i][0]; LE = lambda i: tm['lines'][i][1]
S = lambda li, si: [s for s in tm['sentences'] if s['line'] == li][si]['start']
Wd = lambda li, w: [q for q in tm['words'] if q['line'] == li and q['text'].lower().startswith(w)][0]['start']
lp = lambda s, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), s)
bp = lambda s, a, b: sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), s)
out = np.zeros(N)
def add(y, t0, g=1.):
    s = int(t0 * SR); e = min(N, s + len(y))
    if 0 <= s < N: out[s:e] += y[:e - s] * g
def env(a, b, fade=.5): return np.clip(np.minimum((x - a) / fade, (b - x) / fade), 0, 1)
morning = env(S(12, 1), S(14, 2) + 0.2, 0.25)
night = np.clip(1 - morning, 0, 1)
# drone (55 Hz beating) + low train hum
drone = np.sin(2*np.pi*55*x) + .6*np.sin(2*np.pi*55.4*x) + .3*np.sin(2*np.pi*82.5*x) + .15*np.sin(2*np.pi*110.3*x)
duck = 1 - 0.7*(env(L(8), S(8, 1), 0.05))  # near silence right after lights out
out += drone * .2 * night * duck
out += lp(rng.standard_normal(N), 120) * .16 * night * duck
# rising tension: decision + stay path + way B
for a, b, f in [(S(5, 1), L(6), 110), (L(7), L(8), 98), (S(10, 1), L(12), 123)]:
    k = env(a, b, .3) * np.clip((x - a) / (b - a), 0, 1)
    out += np.sin(2*np.pi*f*x*(1 + .35*np.clip((x - a)/(b - a), 0, 1))) * .06 * k
# train departure: rumble + wheel clacks speeding up
dep = env(S(6, 1) + 1.0, L(8), .6)
out += lp(rng.standard_normal(N), 70) * .5 * dep
def clack(t0, g=.35):
    n = int(.12*SR); tt = np.arange(n)/SR; add(bp(rng.standard_normal(n), 300, 2500)*np.exp(-tt*45), t0, g)
t = S(6, 1) + 1.2; gap = .7
while t < L(8):
    clack(t); clack(t + .11, .25); t += gap; gap = max(.22, gap*.9)
# morning: warm pad, crowd murmur, birds
out += (np.sin(2*np.pi*220*x) + np.sin(2*np.pi*277.2*x) + np.sin(2*np.pi*329.6*x)) * .035 * morning
out += bp(rng.standard_normal(N), 300, 1800) * .07 * morning
for k in range(10):
    t0 = S(12, 1) + .3 + k*.55 + rng.random()*.3; n = int(.18*SR); tt = np.arange(n)/SR
    add(np.sin(2*np.pi*np.cumsum(3200 + 900*np.sin(tt*60))/SR)*np.exp(-tt*18), t0, .05)
# chime (announcement) before "Endstation"
def chime(t0, f1=659, f2=523, g=.14):
    n = int(2.4*SR); tt = np.arange(n)/SR
    add(np.sin(2*np.pi*f1*tt)*np.exp(-tt*2) + np.sin(2*np.pi*f2*tt)*np.exp(-np.maximum(0, tt - .42)*2)*(tt > .42), t0, g)
chime(L(3) - .55)
# hits (same list as the zoom punches in PlatformZero.tsx)
def hit(t0, g=.8):
    n = int(2.4*SR); tt = np.arange(n)/SR
    add(np.sin(2*np.pi*np.cumsum(30 + 45*np.exp(-tt*8))/SR)*np.exp(-tt*1.5) + lp(rng.standard_normal(n), 500)*np.exp(-tt*7)*.45, t0, g)
HITS = [0, L(4)+.2, S(4, 1), S(4, 2), Wd(7, 'drei'), Wd(7, 'zwei'), Wd(7, 'eins'), S(8, 1)+.1, LE(8)+.3, L(10), S(10, 2), S(11, 0), S(11, 1), S(14, 2)+.3]
for i, h in enumerate(HITS): hit(h, 1.1 if i in (0, 8) else .75)
hit(L(15) + .05, .6)
# light switches off (clunk) on the countdown + power-down
def clunk(t0, g=.6): n = int(.25*SR); tt = np.arange(n)/SR; add(lp(rng.standard_normal(n), 600)*np.exp(-tt*25), t0, g)
for w in ('drei', 'zwei', 'eins'): clunk(Wd(7, w) + .05)
n = int(1.2*SR); tt = np.arange(n)/SR; add(np.sin(2*np.pi*np.cumsum(220*np.exp(-tt*2.5) + 40)/SR)*np.exp(-tt*2)*.4, L(8) - .05, 1)
# door: hiss + thud
n = int(.9*SR); tt = np.arange(n)/SR; add(bp(rng.standard_normal(n), 1500, 6000)*np.sin(np.pi*tt/.9)*.25, S(6, 1) + .1, 1)
clunk(S(6, 1) + 1.0, .9)
# flicker buzz on the platform
def buzz(a, b):
    s, e = int(a*SR), int(b*SR); tt = np.arange(e - s)/SR; out[s:e] += np.sign(np.sin(2*np.pi*120*tt))*.06
a, b, c, d = S(10, 1), S(10, 2), S(11, 0), S(11, 1)
for s0, l0 in [(a+.15, .08), (a+.4, .12), (a+.85, .06), (b-.05, .22), (b+.5, .07), (c-.05, .28), (c+.45, .08), (d-.05, .26)]: buzz(s0, s0 + l0)
# running footsteps on the stairs
t = L(12) + .05
while t < S(12, 1) - .1: clunk(t, .45); t += .21
# rewind: reversed whoosh + tape squeal
n = int((S(9, 1) - L(9))*SR); tt = np.arange(n)/SR
add(np.sin(2*np.pi*np.cumsum(1200 - 800*tt/tt[-1])/SR)*.12 + bp(rng.standard_normal(n), 500, 4000)*.22, L(9), 1)
# whoosh into the morning
n = int(.8*SR); tt = np.arange(n)/SR; add(bp(rng.standard_normal(n), 800, 6000)*np.sin(np.pi*tt/.8)*.4, S(12, 1) - .35, 1)
# low sting on "Abfahrt heute Nacht"
st = env(S(14, 2), D, .4); out += np.sin(2*np.pi*41*x)*.25*st + np.sin(2*np.pi*61.7*x)*.12*st
out /= np.abs(out).max(); out *= .5
wf.write('public/pz_music.wav', SR, (out*32767).astype(np.int16)); print('ok', D)
