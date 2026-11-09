import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_flowers.json')); D=tm['duration']+2.2; N=int(D*SR); rng=np.random.default_rng(5)
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
# 1) party: bright plucks (lyre-like) L0..L1
beat=60/112; prog=[[62,66,69],[67,71,74],[64,67,71],[69,73,76]]; mel=[0,1,2,1,0,2,1,2]
def party(a,b_):
    t=a; k=0
    while t<b_:
        ch=prog[k%4]
        for s in range(8):
            if t+s*beat/2<b_: add(out,pluck(mf(ch[mel[s]]+12)),t+s*beat/2,.22)
        for q in (0,2):
            if t+q*beat<b_: add(out,pluck(mf(ch[0]-12),.6),t+q*beat,.4)
        t+=4*beat; k+=1
party(0,L[1]-0.1)
# 2) eerie rain L1..L5: high pad, slow pulses
pad(out,L[1]-0.2,L[5]-0.2,[74,77,81],.14); pad(out,L[3],L[5]-0.2,[50,53,57],.18)
# 3) explanation party L5..L9
party(L[5]-0.1,L[9]-0.2)
# 4) second rain + mystery L9..L15
pad(out,L[9]-0.2,L[12],[74,77,81],.14); pad(out,L[11],L[15],[50,53,57],.2)
t=L[12]
while t<L[15]-0.3:
    n=int(.3*SR); x=np.arange(n)/SR; add(out,np.sin(2*np.pi*mf(74)*x)*np.exp(-x*6),t,.06); t+=60/70*2
# 5) guards: war drums L15..L16
b=60/100; t=L[15]
while t<L[16]-0.3: tom(out,t,70,.8); tom(out,t+b*.75,90,.4); t+=b
# 6) outro
pad(out,L[16]-0.2,D,[48,52,55,60],.2)
for s in range(8): add(out,pluck(mf([72,76,79,84][s%4])),L[16]+s*0.25,.2)
out/=np.abs(out).max(); out*=.2
# sfx
def whoosh(t0,d=.5,g=.12): n=int(d*SR); add(sfx,bp(rng.standard_normal(n),300,3000)*np.sin(np.linspace(0,np.pi,n))**2,t0,g)
def ding(t0,f=1318,g=.1): n=int(1*SR); x=np.arange(n)/SR; add(sfx,(np.sin(2*np.pi*f*x)+.4*np.sin(2*np.pi*f*1.5*x))*np.exp(-x*5),t0,g)
for c in L[1:]: whoosh(c-0.4)
# ceiling creak + soft whoosh of falling petals
for c in (L[1]+0.3,L[9]+1.0):
    n=int(1.0*SR); x=np.arange(n)/SR; add(sfx,lp(np.sign(np.sin(2*np.pi*(60+30*x)*x)),400)*np.exp(-x*2),c,.3)
for c,d in ((L[2],5.5),(L[10],5.0)):
    n=int(d*SR); add(sfx,bp(rng.standard_normal(n),2000,7000)*np.minimum(1,np.arange(n)/SR/1.5),c,.05)
# air cushion: pfffft
n=int(.7*SR); x=np.arange(n)/SR; add(sfx,bp(rng.standard_normal(n),150,900)*(1+np.sin(2*np.pi*35*x))*np.exp(-x*3),W('flat')-0.15,.5)
ding(L[16]+0.6,1046,.12); ding(L[16]+1.1,1318,.12)
sfx/=max(1e-6,np.abs(sfx).max()); sfx*=.25
mix=out+sfx; fo=int(1.2*SR); mix[-fo:]*=np.linspace(1,0,fo)
wf.write('public/flowers_music.wav',SR,(np.clip(mix,-1,1)*32767).astype(np.int16))
print('ok',D)
