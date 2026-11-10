import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_caligula.json')); D=tm['duration']+.5; N=int(D*SR); rng=np.random.default_rng(11)
L=tm['lines']; mf=lambda m:440*2**((m-69)/12); out=np.zeros(N)
bp=lambda x,a,b:sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def add(x,t0,g=1.):
    s=int(t0*SR); e=min(N,s+len(x))
    if 0<=s<N: out[s:e]+=x[:e-s]*g
def pluck(f,d=.35): n=int(d*SR); x=np.arange(n)/SR; return (np.sin(2*np.pi*f*x)+.5*np.sin(4*np.pi*f*x)+.2*np.sin(6*np.pi*f*x))*np.exp(-x*9)
beat=60/112; prog=[[60,64,67],[65,69,72],[67,71,74],[60,64,67]]; mel=[0,2,1,2,0,1,2,1]; t=0; k=0
while t<D:
    ch=prog[k%4]
    for s in range(8): add(pluck(mf(ch[mel[s]]+12)),t+s*beat/2,.25)
    for b in (0,2): add(pluck(mf(ch[0]-12),.6),t+b*beat,.5)
    for b in (1,3): n=int(.08*SR); add(bp(rng.standard_normal(n),1500,6000)*np.exp(-np.arange(n)/SR*40),t+b*beat,.18)
    t+=4*beat; k+=1
out/=np.abs(out).max(); out*=.14
def whoosh(t0,d=.5): n=int(d*SR); add(bp(rng.standard_normal(n),300,3000)*np.sin(np.linspace(0,np.pi,n))**2,t0,.1)
def pop(t0): n=int(.12*SR); x=np.arange(n)/SR; add(np.sin(2*np.pi*(500+900*x/.12)*x)*np.exp(-x*30),t0,.25)
def boing(t0): n=int(.6*SR); x=np.arange(n)/SR; add(np.sin(2*np.pi*np.cumsum(220+120*np.sin(x*30)*np.exp(-x*4))/SR)*np.exp(-x*5),t0,.25)
for a in [L[1][0]-.5,L[1][0]+2.1,L[2][0]-.5,L[2][0]+1.1]: whoosh(a)
for w in tm['words']:
    if w['text'].startswith(('Marmor','Elfenbein')): pop(w['start'])
boing(L[2][0]+2.1); pop(.27)
fo=int(.8*SR); out[-fo:]*=np.linspace(1,0,fo)
wf.write('public/caligula_music.wav',SR,(np.clip(out,-1,1)*32767).astype(np.int16))
