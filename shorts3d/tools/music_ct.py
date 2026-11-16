# Sounddesign für Final Call Stories – Folge 3 „Closing Time“ (Timing aus src/timing_ct.json)
import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR = 48000; tm = json.load(open('src/timing_ct.json')); D = tm['duration'] + 0.3; N = int(D * SR); x = np.arange(N) / SR
rng = np.random.default_rng(11)
L = lambda i: tm['lines'][i][0]; LE = lambda i: tm['lines'][i][1]
CAP = lambda s: [c for c in tm['caps'] if c['text'] == s][0]['start']
lp = lambda s, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), s)
bp = lambda s, a, b: sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), s)
out = np.zeros(N)
def add(y, t0, g=1.):
    s = int(t0 * SR); e = min(N, s + len(y))
    if 0 <= s < N: out[s:e] += y[:e - s] * g
def env(a, b, fade=.5): return np.clip(np.minimum((x - a) / fade, (b - x) / fade), 0, 1)
runStart = LE(15) + 0.05
morning = env(LE(19) + 0.2, L(23), 0.25)
night = np.clip(1 - morning, 0, 1)
black = env(LE(13) + 0.25, L(14), 0.03)
# Drone + Lüftung
drone = np.sin(2*np.pi*49*x) + .6*np.sin(2*np.pi*49.4*x) + .3*np.sin(2*np.pi*73.5*x) + .12*np.sin(2*np.pi*98.3*x)
out += drone * .2 * night * (1 - .9*black)
out += lp(rng.standard_normal(N), 140) * .14 * night * (1 - black)
# Leuchtröhren-Summen
out += np.sign(np.sin(2*np.pi*100*x)) * .012 * night
# unheimliche Spieluhr (eigene Melodie, leicht verstimmt) in den Nacht-Teilen ohne Weg B
mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 72, 71, 69]
def note(f, t0, g=.08):
    n = int(1.2*SR); tt = np.arange(n)/SR
    add((np.sin(2*np.pi*f*tt) + .4*np.sin(2*np.pi*f*2.01*tt) + .15*np.sin(2*np.pi*f*3.03*tt))*np.exp(-tt*3.2), t0, g)
t = L(1); k = 0
while t < L(9):
    note(440*2**((mel[k % len(mel)] - 69)/12) * (1 + .006*np.sin(t)), t, .07); t += .42; k += 1
t = L(10); k = 0
while t < LE(12):
    note(440*2**((mel[k % len(mel)] - 69 - 12)/12), t, .06); t += .55; k += 1
# Spannung: Entscheidung, Weg A, Weg B
for a, b, f in [(L(9), L(10), 110), (L(10), LE(13), 98), (runStart, LE(19), 123)]:
    kk = env(a, b, .3) * np.clip((x - a) / (b - a), 0, 1)
    out += np.sin(2*np.pi*f*x*(1 + .35*np.clip((x - a)/(b - a), 0, 1))) * .06 * kk
# Gong / Durchsage-Ton
def chime(t0, f1=659, f2=523, g=.16):
    n = int(2.4*SR); tt = np.arange(n)/SR
    add(np.sin(2*np.pi*f1*tt)*np.exp(-tt*2) + np.sin(2*np.pi*f2*tt)*np.exp(-np.maximum(0, tt - .42)*2)*(tt > .42), t0, g)
chime(L(4) - .1)
# Glocke (Messing, mehrere Teiltöne)
def bell(t0, g=.35):
    n = int(2.5*SR); tt = np.arange(n)/SR; f = 1180
    add(sum(a*np.sin(2*np.pi*f*r*tt)*np.exp(-tt*d) for a, r, d in [(1, 1, 2.2), (.6, 2.76, 3.5), (.4, 5.4, 5), (.25, 8.9, 7)]), t0, g)
for tb in [L(11) + .05, L(11) + .4, L(12) - .05, L(12) + .45, L(12) + .95]: bell(tb, .3)
# Schläge (gleiche Liste wie die Zoom-Punches in ClosingTime.tsx)
def hit(t0, g=.8):
    n = int(2.4*SR); tt = np.arange(n)/SR
    add(np.sin(2*np.pi*np.cumsum(30 + 45*np.exp(-tt*8))/SR)*np.exp(-tt*1.5) + lp(rng.standard_normal(n), 500)*np.exp(-tt*7)*.45, t0, g)
FL = [(L(17)+.05, .1), (L(17)+.42, .14), (L(18)-.12, .16), (L(18)+.33, .12), (L(18)+.72, .16)]
HITS = [0, L(5), L(6)+.31, L(8), L(12)-.05, L(12)+.45, L(12)+.95, L(13), LE(13)+.25, L(15), runStart] + [s+.1 for s, _ in FL[1:]] + [CAP('COME BACK')+.2]
for i, h in enumerate(HITS): hit(h, 1.15 if i in (0, 8) else .7)
hit(L(23) + .05, .6)
# Licht aus (Klonk) vor dem Flüstern
def clunk(t0, g=.6): n = int(.25*SR); tt = np.arange(n)/SR; add(lp(rng.standard_normal(n), 600)*np.exp(-tt*25), t0, g)
clunk(LE(12) + .45, .9)
# Flüster-Rauschen
out += bp(rng.standard_normal(N), 2000, 7000) * .05 * env(L(13), LE(13), .2)
# Flacker-Brummen
for s0, l0 in FL + [(L(6)+.25, .12)]:
    s, e = int(s0*SR), int((s0+l0)*SR); tt = np.arange(e - s)/SR; out[s:e] += np.sign(np.sin(2*np.pi*120*tt))*.07
# Rolltreppe: Motor + Rennen
out += (np.sin(2*np.pi*60*x) + .5*np.sin(2*np.pi*120*x)) * .05 * env(runStart + .5, LE(19), .3)
t = runStart + .05
while t < LE(19): clunk(t, .4); t += .2
# Rückspulen
n = int((L(15) + .45 - L(14))*SR); tt = np.arange(n)/SR
add(np.sin(2*np.pi*np.cumsum(1200 - 800*tt/tt[-1])/SR)*.12 + bp(rng.standard_normal(n), 500, 4000)*.22, L(14), 1)
# Woosh in den Morgen + Morgen: warme Fläche, Stimmen, Glöckchen in der Ferne
n = int(.8*SR); tt = np.arange(n)/SR; add(bp(rng.standard_normal(n), 800, 6000)*np.sin(np.pi*tt/.8)*.4, LE(19) - .35, 1)
out += (np.sin(2*np.pi*220*x) + np.sin(2*np.pi*277.2*x) + np.sin(2*np.pi*329.6*x)) * .035 * morning
out += bp(rng.standard_normal(N), 300, 1800) * .07 * morning
for k in range(6): note(1568 + 200*(k % 3), LE(19) + .4 + k*.5, .03)
# tiefer Stachel beim Kassenbon
st = env(CAP('COME BACK'), D, .4); out += np.sin(2*np.pi*41*x)*.25*st + np.sin(2*np.pi*61.7*x)*.12*st
out /= np.abs(out).max(); out *= .5
wf.write('public/ct_music.wav', SR, (out*32767).astype(np.int16)); print('ok', D)
