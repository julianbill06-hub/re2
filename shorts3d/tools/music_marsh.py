import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_marsh.json')); D=tm['duration']+1.6; N=int(D*SR); rng=np.random.default_rng(5)
L=[l[0] for l in tm['lines']]; LE=[l[1] for l in tm['lines']]
def W(p,n=0): return [w['start'] for w in tm['words'] if w['text'].startswith(p)][n]
mf=lambda m:440*2**((m-69)/12); out=np.zeros(N); sfx=np.zeros(N)
lp=lambda x,f:sosfilt(butter(2,f,'low',fs=SR,output='sos'),x); bp=lambda x,a,b:sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def add(buf,x,t0,g=1.):
    s=int(t0*SR); e=min(N,s+len(x))
    if 0<=s<N: buf[s:e]+=x[:e-s]*g
def tom(buf,t0,f=70,g=1.): n=int(.6*SR); x=np.arange(n)/SR; add(buf,np.sin(2*np.pi*np.cumsum(f+60*np.exp(-x*18))/SR)*np.exp(-x*6),t0,g)
def brass(buf,t0,m,d=.9,g=.25):
    n=int(d*SR); x=np.arange(n)/SR; f=mf(m); y=sum(np.sign(np.sin(2*np.pi*f*k*x))/k for k in (1,2,3))
    add(buf,lp(y,1600)*np.minimum(1,x/.04)*np.minimum(1,(d-x)/.1),t0,g)
def pluck(f,d=.35): n=int(d*SR); x=np.arange(n)/SR; return (np.sin(2*np.pi*f*x)+.5*np.sin(4*np.pi*f*x))*np.exp(-x*9)
def pad(buf,a,b,ch,g=.12):
    n=int((b-a)*SR); x=np.arange(n)/SR; y=sum(lp(2*((x*mf(m)*(1+d))%1)-1,700) for m in ch for d in(-.003,.003))
    add(buf,y*np.minimum(1,x/.6)*np.minimum(1,((b-a)-x)/.6)/6,a,g)
# playful marimba groove for most of the video
beat=60/108; prog=[[60,64,67],[57,60,64],[65,69,72],[67,71,74]]; mel=[0,2,1,2,0,1,2,1]
def mar(f,d=.3): n=int(d*SR); x=np.arange(n)/SR; return (np.sin(2*np.pi*f*x)+.3*np.sin(2*np.pi*4*f*x))*np.exp(-x*12)
def groove(a,b_):
    t=a; k=0
    while t<b_:
        ch=prog[k%4]
        for s in range(8):
            if t+s*beat/2<b_: add(out,mar(mf(ch[mel[s]]+12)),t+s*beat/2,.25)
        for q in (0,2):
            if t+q*beat<b_: add(out,pluck(mf(ch[0]-12),.5),t+q*beat,.35)
        t+=4*beat; k+=1
groove(0,L[2]-0.2)
# waiting: sparse, tense
pad(out,L[2]-0.2,L[6],[60,63,67],.12)
groove(L[6]-0.1,L[8]-0.2)
# surprise sting
for i,m in enumerate([72,76,79,84]): add(out,mar(mf(m),.5),L[8]-0.05+i*0.07,.35)
groove(L[9]-0.1,L[12]-0.2)
# not so fast: sad trombone
for i,m in enumerate([55,54,53,52]): brass(out,L[12]-0.05+i*0.28,m,0.32 if i<3 else 0.8,.22)
pad(out,L[13]-0.2,L[16]-0.2,[57,60,64],.14)
t=L[13]
while t<L[16]-0.3: add(out,mar(mf(69),.3),t,.12); t+=60/80
pad(out,L[16]-0.2,D,[60,64,67,72],.18)
for s in range(8): add(out,mar(mf([72,76,79,84][s%4])),L[16]+s*0.25,.22)
out/=np.abs(out).max(); out*=.2
# sfx
def whoosh(t0,d=.5,g=.12): n=int(d*SR); add(sfx,bp(rng.standard_normal(n),300,3000)*np.sin(np.linspace(0,np.pi,n))**2,t0,g)
def ding(t0,f=1318,g=.1): n=int(1*SR); x=np.arange(n)/SR; add(sfx,(np.sin(2*np.pi*f*x)+.4*np.sin(2*np.pi*f*1.5*x))*np.exp(-x*5),t0,g)
for c in L[1:]: whoosh(c-0.4,.4,.08)
# clock ticks while waiting
t=L[2]+0.5
while t<L[6]-0.2:
    n=int(.03*SR); add(sfx,sosfilt(butter(2,3000,'high',fs=SR,output='sos'),rng.standard_normal(n))*np.exp(-np.arange(n)/SR*150),t,.35); t+=0.5
# door close
n=int(.4*SR); x=np.arange(n)/SR; add(sfx,lp(rng.standard_normal(n),300)*np.exp(-x*12),L[2]+1.5,.6)
# chomp
for k in range(3): n=int(.12*SR); add(sfx,bp(rng.standard_normal(n),300,2000)*np.exp(-np.arange(n)/SR*25),W('ate')+0.1+k*0.2,.35)
ding(W('better'),1568,.12); ding(L[16]+0.6,1046,.12); ding(L[16]+1.1,1318,.12)
sfx/=max(1e-6,np.abs(sfx).max()); sfx*=.25
mix=out+sfx; fo=int(1.2*SR); mix[-fo:]*=np.linspace(1,0,fo)
wf.write('public/marsh_music.wav',SR,(np.clip(mix,-1,1)*32767).astype(np.int16))
print('ok',D)
