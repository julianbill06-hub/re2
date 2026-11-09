import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing.json')); D=tm['duration']+.5; N=int(D*SR); rng=np.random.default_rng(7)
L=tm['lines']; mf=lambda m:440*2**((m-69)/12)
lp=lambda x,f:sosfilt(butter(2,f,'low',fs=SR,output='sos'),x); bp=lambda x,a,b:sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
out=np.zeros(N)
def add(x,t0,g=1.):
    s=int(t0*SR); e=min(N,s+len(x))
    if 0<=s<N: out[s:e]+=x[:e-s]*g
beat=60/118; chs=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]; t=0; k=0
while t<D:
    ch=chs[k%4]
    for s in range(16):
        n=int(.25*SR); x=np.arange(n)/SR; f=mf(ch[s%3]+12+(12 if s%4==2 else 0))
        add(np.sign(np.sin(2*np.pi*f*x))*np.exp(-x*14)*.5+np.sin(2*np.pi*f*x)*np.exp(-x*10),t+s*beat/4,.12)
    for b in range(4):
        n=int(.3*SR); x=np.arange(n)/SR; add(np.sin(2*np.pi*np.cumsum(45+90*np.exp(-x*30))/SR)*np.exp(-x*10),t+b*beat,.5)
        n=int(.05*SR); add(sosfilt(butter(2,7000,'high',fs=SR,output='sos'),rng.standard_normal(n))*np.exp(-np.arange(n)/SR*80),t+b*beat+beat/2,.12)
    n=int(4*beat*SR); x=np.arange(n)/SR; pad=sum(lp(2*((x*mf(m-12)*(1+d))%1)-1,800) for m in ch for d in(-.003,.003)); add(pad*np.minimum(1,x/.2)*np.minimum(1,(4*beat-x)/.2)/6,t,.5)
    t+=4*beat; k+=1
out/=np.abs(out).max(); out*=.16
def whoosh(t0,d=.6): n=int(d*SR); add(bp(rng.standard_normal(n),300,3000)*np.sin(np.linspace(0,np.pi,n))**2,t0,.12)
def boom(t0): n=int(1.2*SR); x=np.arange(n)/SR; add(np.sin(2*np.pi*np.cumsum(30+60*np.exp(-x*6))/SR)*np.exp(-x*3),t0,.45)
def ding(t0): n=int(1*SR); x=np.arange(n)/SR; add((np.sin(2*np.pi*1318*x)+.4*np.sin(2*np.pi*1975*x))*np.exp(-x*5),t0,.12)
for l in L[1:]: whoosh(l[0]-.45)
import sys
boom(float(sys.argv[1]) if len(sys.argv)>1 else L[1][0]+2.05); ding(L[2][0]+1.9); ding(L[2][0]+2.6)
# rumble during rides
for a,b in [(L[1][0]+.3,L[1][1]+.2),(L[2][0]+1.3,L[2][1]+.5)]:
    n=int((b-a)*SR); x=np.arange(n)/SR; add(lp(rng.standard_normal(n),180)*np.sin(np.pi*x/(b-a)),a,.25)
fo=int(.8*SR); out[-fo:]*=np.linspace(1,0,fo)
wf.write('public/music.wav',SR,(np.clip(out,-1,1)*32767).astype(np.int16))
