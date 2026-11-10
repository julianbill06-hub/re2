import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_sv10.json')); D=tm['duration']+1.0; N=int(D*SR); rng=np.random.default_rng(10)
L=[l[0] for l in tm['lines']]
mf=lambda m:440*2**((m-69)/12); out=np.zeros(N); sfx=np.zeros(N)
lp=lambda x,f:sosfilt(butter(2,f,'low',fs=SR,output='sos'),x)
def add(buf,x,t0,g=1.):
    s=int(t0*SR); e=min(N,s+len(x))
    if 0<=s<N: buf[s:e]+=x[:e-s]*g
def pluck(f,d=.3): n=int(d*SR); x=np.arange(n)/SR; return (np.sin(2*np.pi*f*x)+.4*np.sin(4*np.pi*f*x))*np.exp(-x*10)
def kick(): n=int(.25*SR); x=np.arange(n)/SR; return np.sin(2*np.pi*np.cumsum(50+90*np.exp(-x*30))/SR)*np.exp(-x*12)
def brass(t0,m,d,g):
    n=int(d*SR); x=np.arange(n)/SR; f=mf(m); y=sum(np.sign(np.sin(2*np.pi*f*k*x))/k for k in (1,2,3))
    add(sfx,lp(y,1800)*np.minimum(1,x/.03)*np.minimum(1,(d-x)/.08),t0,g)
# bouncy oom-pah groove 104 bpm (no noise hats)
beat=60/104; prog=[[60,64,67],[65,69,72],[67,71,74],[60,64,67]]; t=0; k=0
while t<D:
    ch=prog[k%4]
    for b in range(4):
        add(out,kick(),t+b*beat,.6)
        add(out,pluck(mf(ch[0]-12),.35),t+b*beat,.45)
        for m in ch: add(out,pluck(mf(m),.18),t+b*beat+beat/2,.12)
    for s,mm in enumerate([0,2,1,2,0,1,2,1]): add(out,pluck(mf(ch[mm]+12),.25),t+s*beat/2,.12)
    t+=4*beat; k+=1
out/=np.abs(out).max(); out*=.16
# stadium fanfare at start + decision
for i,(m,d) in enumerate([(67,.18),(67,.18),(72,.5)]): brass(0.2+i*0.2,m,d,.25)
for i,(m,d) in enumerate([(72,.18),(76,.18),(79,.6)]): brass(L[2]+0.5+i*0.2,m,d,.3)
def cheer(t0,d=1.6,g=.18):
    n=int(d*SR); x=np.arange(n)/SR
    y=sum(np.sin(2*np.pi*mf(m)*(1+0.004*np.sin(2*np.pi*(5+j)*x))*x) for j,m in enumerate([60,64,67,72,76]))*np.sin(np.pi*x/d)
    add(sfx,y/5,t0,g)
for c in [0.4,L[2]+0.6,L[13]+0.5,L[19]+0.3]: cheer(c)
def whistle(t0): n=int(.45*SR); x=np.arange(n)/SR; add(sfx,np.sin(2*np.pi*(2600+120*np.sin(2*np.pi*40*x))*x)*np.minimum(1,x/.02)*np.minimum(1,(.45-x)/.05),t0,.12)
for c in [L[6]+0.2,L[7]+0.1,L[9]+0.1,L[11]+0.1]: whistle(c)
def boing(t0): n=int(.5*SR); x=np.arange(n)/SR; add(sfx,np.sin(2*np.pi*np.cumsum(300+200*np.sin(2*np.pi*12*x)*np.exp(-x*4))/SR)*np.exp(-x*5),t0,.3)
boing(L[8]-0.05)
def splash(t0): n=int(.5*SR); x=np.arange(n)/SR; add(sfx,lp(rng.standard_normal(n),900)*np.exp(-x*8),t0,.4)
splash(L[3]+3.5)
def pop(t0): n=int(.1*SR); x=np.arange(n)/SR; add(sfx,np.sin(2*np.pi*(500+800*x/.1)*x)*np.exp(-x*30),t0,.25)
for c in [L[5]+0.4,L[5]+1.4,L[5]+2.4,L[16],L[17],L[18]]: pop(c)
def chomp(t0):
    for k in range(3): n=int(.1*SR); add(sfx,lp(rng.standard_normal(n),1800)*np.exp(-np.arange(n)/SR*30),t0+k*.18,.3)
chomp(L[12]+1.2)
sfx/=max(1e-6,np.abs(sfx).max()); sfx*=.3
mix=out+sfx; fo=int(.6*SR); mix[-fo:]*=np.linspace(1,0,fo)
wf.write('public/sv10_music.wav',SR,(np.clip(mix,-1,1)*32767).astype(np.int16)); print('ok',D)
