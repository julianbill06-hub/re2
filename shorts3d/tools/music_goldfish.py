import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_goldfish.json')); D=tm['duration']+1.0; N=int(D*SR); rng=np.random.default_rng(3)
L=[l[0] for l in tm['lines']]; LE=[l[1] for l in tm['lines']]
def WL(li,p):
    m=[w['start'] for w in tm['words'] if w['line']==li and w['text'].startswith(p)]; return m[0] if m else L[li]
mf=lambda m:440*2**((m-69)/12); out=np.zeros(N); sfx=np.zeros(N)
lp=lambda x,f:sosfilt(butter(2,f,'low',fs=SR,output='sos'),x); hp=lambda x,f:sosfilt(butter(2,f,'high',fs=SR,output='sos'),x)
bp=lambda x,a,b:sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def add(buf,x,t0,g=1.):
    s=int(t0*SR); e=min(N,s+len(x))
    if 0<=s<N: buf[s:e]+=x[:e-s]*g
def marimba(f,d=.45): n=int(d*SR); x=np.arange(n)/SR; return (np.sin(2*np.pi*f*x)+.3*np.sin(2*np.pi*f*4*x)*np.exp(-x*30))*np.exp(-x*7)
def kick(t0,g=.6): n=int(.3*SR); x=np.arange(n)/SR; add(out,np.sin(2*np.pi*np.cumsum(55+90*np.exp(-x*30))/SR)*np.exp(-x*12),t0,g)
def snap(t0,g=.2): n=int(.08*SR); add(out,bp(rng.standard_normal(n),1500,6000)*np.exp(-np.arange(n)/SR*60),t0,g)
def pad(a,b,ch,g=.1):
    n=int((b-a)*SR); x=np.arange(n)/SR; y=sum(lp(2*((x*mf(m)*(1+d))%1)-1,800) for m in ch for d in(-.003,.003))
    add(out,y*np.minimum(1,x/.4)*np.minimum(1,((b-a)-x)/.4)/6,a,g)
bpm=108; beat=60/bpm
prog=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]]
pat=[0,2,1,2,0,1,2,1]
# playful groove throughout, with breaks
breaks=[(L[3]-0.05,L[4]-0.1),(L[7],LE[7]+0.2),(L[11],L[12]),(L[19],L[20]+0.4)]
inbreak=lambda t:any(a<=t<b for a,b in breaks)
t=0.0; bar=0
while t<D-1.2:
    ch=prog[bar%4]; pad(t,t+4*beat,[c-12 for c in ch],.08)
    for s in range(8):
        tt=t+s*beat/2
        if tt<D-1.2 and not inbreak(tt): add(out,marimba(mf(ch[pat[s]]+12)),tt,.16)
    for s in range(4):
        tt=t+s*beat
        if not inbreak(tt) and tt>L[1]: kick(tt,.45 if s%2==0 else .25); snap(tt+beat/2,.12)
    t+=4*beat; bar+=1
# tension drone for the months
n=int((LE[7]-L[7]+0.4)*SR); x=np.arange(n)/SR; add(out,lp(np.sin(2*np.pi*55*x)+.5*np.sin(2*np.pi*82.5*x),300)*np.minimum(1,x/.3)*np.minimum(1,(x[-1]-x)/.3),L[7],.2)
out=hp(out,60); out/=np.abs(out).max(); out*=.2
def whoosh(t0,d=.45,g=.12): n=int(d*SR); add(sfx,bp(rng.standard_normal(n),300,3000)*np.sin(np.linspace(0,np.pi,n))**2,t0,g)
def ding(t0,f=1318,g=.1): n=int(1*SR); x=np.arange(n)/SR; add(sfx,(np.sin(2*np.pi*f*x)+.4*np.sin(2*np.pi*f*1.5*x))*np.exp(-x*5),t0,g)
def thud(t0,g=.6): n=int(.5*SR); x=np.arange(n)/SR; add(sfx,np.sin(2*np.pi*np.cumsum(48+60*np.exp(-x*18))/SR)*np.exp(-x*7),t0,g); m=int(.15*SR); add(sfx,lp(rng.standard_normal(m),1800)*np.exp(-np.arange(m)/SR*30),t0,g*.5)
def bloop(t0,g=.15,f=500): n=int(.18*SR); x=np.arange(n)/SR; add(sfx,np.sin(2*np.pi*np.cumsum(f+900*x/.18)/SR)*np.exp(-x*14),t0,g)
def tone(t0,d=1.2,g=.18): n=int(d*SR); x=np.arange(n)/SR; add(sfx,(np.sin(2*np.pi*880*x)+.3*np.sin(2*np.pi*1320*x))*np.minimum(1,x/.02)*np.exp(-x*1.4),t0,g)
cuts=[l for l in [L[1],L[2],L[3],L[4],L[5],L[6],L[7],L[8],L[9],L[10],L[11],L[12],L[13],L[14],L[15],L[16],L[17],L[18],L[19],L[21],L[22],L[23]]]
for c in cuts: whoosh(c-0.35)
# countdown ticks
for k in range(3): ding(k*0.34,1046+k*200,.1)
thud(WL(3,'nonsense'),.8); thud(WL(19,'proof'),.8)
for c in [WL(5,'plays'),L[6]+0.2,WL(8,'play')]: tone(c)
ding(WL(9,'come'),1568,.12)
for i in range(8): bloop(L[4]+0.4+i*0.55,.05,400+rnd if False else 400+i*30)
# calendar flips
t=L[7]+0.3
while t<LE[7]: n=int(.06*SR); add(sfx,hp(rng.standard_normal(n),2000)*np.exp(-np.arange(n)/SR*60),t,.25); t+=(LE[7]-L[7])/5
# maze steps + ring pass
for k in range(7): bloop(L[13]+0.2+k*(LE[13]-L[13])/7,.1,600)
ding(L[14]+0.1+1.0,1760,.14)
# heart + feeding
ding(L[15]+1.1,1318,.12); ding(L[21]+1.0,1318,.12)
for k in range(6): bloop(L[22]+k*0.12,.08,700)
ding(WL(24,'Napoleon'),1046,.12); ding(WL(25,'Great'),1318,.12)
sfx/=max(1e-6,np.abs(sfx).max()); sfx*=.28
mix=out+sfx; fo=int(0.8*SR); mix[-fo:]*=np.linspace(1,0,fo)
wf.write('public/goldfish_music.wav',SR,(np.clip(mix,-1,1)*32767).astype(np.int16)); print('ok',D)
