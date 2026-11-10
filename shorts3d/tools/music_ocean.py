import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_ocean.json')); D=tm['duration']+.5; N=int(D*SR); rng=np.random.default_rng(5)
L=[l[0] for l in tm['lines']]; W=lambda p,n=0:[w['start'] for w in tm['words'] if w['text'].startswith(p)][n]
mf=lambda m:440*2**((m-69)/12); out=np.zeros(N)
lp=lambda x,f:sosfilt(butter(2,f,'low',fs=SR,output='sos'),x); bp=lambda x,a,b:sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def add(x,t0,g=1.):
    s=int(t0*SR); e=min(N,s+len(x))
    if 0<=s<N: out[s:e]+=x[:e-s]*g
def tom(t0,f=70,g=1.): n=int(.6*SR); x=np.arange(n)/SR; add(np.sin(2*np.pi*np.cumsum(f+60*np.exp(-x*18))/SR)*np.exp(-x*6),t0,g)
def brass(t0,m,d=.9,g=.25):
    n=int(d*SR); x=np.arange(n)/SR; f=mf(m); y=sum(np.sign(np.sin(2*np.pi*f*k*x))/k for k in (1,2,3))
    add(lp(y,1400)*np.minimum(1,x/.05)*np.exp(-x*1.2),t0,g)
# hook: war drums 100 bpm until the ocean reveal
b=60/100; t=0.0
while t<L[2]-0.25:
    tom(t,70,.9); tom(t+b*.75,90,.5); tom(t+b,70,.7); tom(t+b*1.5,110,.35); t+=2*b
for k,m in enumerate([50,53,57,55]): brass(k*2*b,m,1.5,.18)
# reveal hit
tom(L[2]-0.02,45,1.4)
# playful part from L3
beat=60/116; prog=[[60,64,67],[65,69,72],[67,71,74],[60,64,67]]; mel=[0,2,1,2,0,1,2,1]; t=L[3]-0.2; k=0
def pluck(f,d=.35): n=int(d*SR); x=np.arange(n)/SR; return (np.sin(2*np.pi*f*x)+.5*np.sin(4*np.pi*f*x))*np.exp(-x*9)
while t<D:
    ch=prog[k%4]
    for s in range(8): add(pluck(mf(ch[mel[s]]+12)),t+s*beat/2,.22)
    for q in (0,2): add(pluck(mf(ch[0]-12),.6),t+q*beat,.45)
    t+=4*beat; k+=1
out/=np.abs(out).max(); out*=.2
def whoosh(t0,d=.5,g=.12): n=int(d*SR); add(bp(rng.standard_normal(n),300,3000)*np.sin(np.linspace(0,np.pi,n))**2,t0,g)
def ding(t0): n=int(1*SR); x=np.arange(n)/SR; add((np.sin(2*np.pi*1318*x)+.4*np.sin(2*np.pi*1975*x))*np.exp(-x*5),t0,.1)
whoosh(W('Catapults')+0.35,.7,.2); tom(W('Catapults')+0.6,55,.5)
for c in [W('An'),L[1],L[3],L[4],W('collect'),L[5]]: whoosh(c-0.4)
# waves ambience under the ocean shot
n=int(3*SR); add(lp(rng.standard_normal(n),600)*(0.5+0.5*np.sin(np.arange(n)/SR*2.2))*np.sin(np.linspace(0,np.pi,n)),L[2]-0.5,.05)
ding(W('collect')+0.2); ding(L[5]+0.9)
fo=int(.8*SR); out[-fo:]*=np.linspace(1,0,fo)
wf.write('public/ocean_music.wav',SR,(np.clip(out,-1,1)*32767).astype(np.int16))
