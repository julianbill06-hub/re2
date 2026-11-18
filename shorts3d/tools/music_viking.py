import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_viking.json')); D=tm['duration']+1.0; N=int(D*SR); rng=np.random.default_rng(7)
L=[l[0] for l in tm['lines']]; LE=[l[1] for l in tm['lines']]
def W(p,n=0): m=[w['start'] for w in tm['words'] if w['text'].startswith(p)]; return m[min(n,len(m)-1)]
mf=lambda m:440*2**((m-69)/12); out=np.zeros(N); sfx=np.zeros(N)
lp=lambda x,f:sosfilt(butter(2,f,'low',fs=SR,output='sos'),x); hp=lambda x,f:sosfilt(butter(2,f,'high',fs=SR,output='sos'),x)
bp=lambda x,a,b:sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def add(buf,x,t0,g=1.):
    s=int(t0*SR); e=min(N,s+len(x))
    if 0<=s<N: buf[s:e]+=x[:e-s]*g
def tom(buf,t0,f=70,g=1.): n=int(.6*SR); x=np.arange(n)/SR; add(buf,np.sin(2*np.pi*np.cumsum(f+60*np.exp(-x*18))/SR)*np.exp(-x*6),t0,g)
def horn(buf,t0,m,d=1.2,g=.25):  # low brass "war horn"
    n=int(d*SR); x=np.arange(n)/SR; f=mf(m); y=sum(np.sign(np.sin(2*np.pi*f*k*x*(1+0.002*np.sin(5*x))))/k for k in (1,2,3,4))
    add(buf,lp(y,900)*np.minimum(1,x/.12)*np.minimum(1,(d-x)/.25),t0,g)
def pluck(f,d=.35): n=int(d*SR); x=np.arange(n)/SR; return (np.sin(2*np.pi*f*x)+.5*np.sin(4*np.pi*f*x))*np.exp(-x*9)
def pad(buf,a,b,ch,g=.12):
    n=int((b-a)*SR); x=np.arange(n)/SR; y=sum(lp(2*((x*mf(m)*(1+d))%1)-1,700) for m in ch for d in(-.003,.003))
    add(buf,y*np.minimum(1,x/.5)*np.minimum(1,((b-a)-x)/.5)/6,a,g)
def strings(buf,a,b,mel,g=.1):  # opera-ish waltz melody
    beat=60/132; t=a; k=0
    while t<b-0.2:
        m=mel[k%len(mel)]; n=int(beat*0.95*SR); x=np.arange(n)/SR
        y=sum(lp(2*((x*mf(m)*(1+d))%1)-1,2200) for d in (-.004,0,.004))*np.minimum(1,x/.05)*np.exp(-x*1.2)
        add(buf,y/3,t,g); t+=beat; k+=1
# 1) hook: viking drums + war horn (until L3)
b=60/104; t=0.0
while t<L[3]-0.2:
    tom(out,t,62,1.0); tom(out,t+b*0.5,62,.5); tom(out,t+b,85,.7); tom(out,t+b*1.5,62,.4); t+=2*b
horn(out,0.0,38,1.8,.22); horn(out,L[2]-0.1,41,1.4,.22)
# 2) adventure: L3..L6 (sailing, gear, bonk)
pad(out,L[3]-0.2,L[6],[50,57,62],.16)
beat=60/104; t=L[3]; prog=[[50,57,62],[46,53,58],[48,55,60],[45,52,57]]; k=0
while t<L[6]-0.3:
    ch=prog[k%4]
    for s in range(8):
        if t+s*beat/2<L[6]-0.3: add(out,pluck(mf(ch[[0,1,2,1][s%4]]+12)),t+s*beat/2,.18)
    tom(out,t,60,.5); tom(out,t+2*beat,60,.4); t+=4*beat; k+=1
# 3) discovery: mystery pad + bells (L6..L9)
pad(out,L[6]-0.2,L[9],[45,52,57,60],.18)
t=L[6]
while t<L[9]-0.3:
    n=int(.5*SR); x=np.arange(n)/SR; add(out,np.sin(2*np.pi*mf(81)*x)*np.exp(-x*5),t,.05); t+=60/72*2
# 4) "where from?" hit then opera (L10..L14)
tom(out,L[9],40,1.3)
pad(out,L[10]-0.1,L[14],[48,52,55],.12)
strings(out,L[10]+0.2,L[14]-0.2,[64,67,72,71,67,64,65,69,72,74,72,69,67,64,62,60],.13)
# 5) bronze age / reveal (L14..L17): low drone + slow drums
pad(out,L[14]-0.2,L[16],[38,45,50],.2)
t=L[14]
while t<L[16]-0.3: tom(out,t,50,.45); t+=60/70
# 6) twist + outro: triumphant
pad(out,L[16]-0.1,D,[50,54,57,62],.18)
horn(out,L[16]+0.1,50,1.2,.18); horn(out,L[16]+1.3,57,1.6,.18)
t=L[17]; 
while t<D-1.0:
    for s,m in enumerate([74,78,81,86]): add(out,pluck(mf(m)),t+s*0.25,.15)
    t+=1.0
out=hp(out,60); out/=np.abs(out).max(); out*=.2
# sfx
def whoosh(t0,d=.45,g=.12): n=int(d*SR); add(sfx,bp(rng.standard_normal(n),300,3000)*np.sin(np.linspace(0,np.pi,n))**2,t0,g)
def ding(t0,f=1318,g=.1): n=int(1*SR); x=np.arange(n)/SR; add(sfx,(np.sin(2*np.pi*f*x)+.4*np.sin(2*np.pi*f*1.5*x))*np.exp(-x*5),t0,g)
def thud(t0,g=.6): tom(sfx,t0,48,g); n=int(.15*SR); add(sfx,lp(rng.standard_normal(n),1800)*np.exp(-np.arange(n)/SR*30),t0,g*.5)
cuts=[W('But'),L[1],L[2],L[3],L[4],L[5],L[6],W('farmer'),L[7],L[8],L[9],L[10],L[11],[w['start'] for w in tm['words'] if w['line']==11 and w['text'].startswith('The')][0],L[12],W('horned')-0.6,L[13],W('Painters'),L[14],L[15],L[16],L[17]]
for c in cuts: whoosh(c-0.35)
thud(W('made')-0.05,.8); thud(W('ever')-0.05,.8); thud(L[8],.7)
# horns pop off
for k in range(2): n=int(.2*SR); x=np.arange(n)/SR; add(sfx,np.sin(2*np.pi*np.cumsum(600+1400*x/.2)/SR)*np.exp(-x*8),W('ever')+0.05+k*0.08,.2)
# bonk
n=int(.4*SR); x=np.arange(n)/SR; add(sfx,(np.sin(2*np.pi*np.cumsum(520*np.exp(-x*4))/SR)+0.4*np.sin(2*np.pi*1300*x))*np.exp(-x*9),W('In')+0.2,.45)
# digging
t=L[6]+0.3
while t<L[7]: n=int(.18*SR); add(sfx,bp(rng.standard_normal(n),200,1500)*np.exp(-np.arange(n)/SR*18),t,.35); t+=60/96
# helmet reveal shimmer
for i in range(10): ding(L[7]+0.6+i*0.06,1800+i*180,.05)
# curtain + applause
whoosh(L[10]+0.2,1.6,.2)
n=int((LE[13]-L[13]+0.4)*SR); x=np.arange(n)/SR; cl=np.zeros(n)
for i in range(900): s=int(rng.random()*(n-2000)); cl[s:s+1200]+=rng.standard_normal(1200)*np.exp(-np.arange(1200)/SR*120)
add(sfx,bp(cl,800,6000)*np.minimum(1,x/.3)*np.minimum(1,(x[-1]-x)/.4),L[13],.25)
# props pop
for w in ['Painters','books','movies']: ding(W(w),988,.08)
# helmet drop clang
n=int(.8*SR); x=np.arange(n)/SR; add(sfx,sum(np.sin(2*np.pi*f*x)*np.exp(-x*a) for f,a in [(620,6),(1530,8),(2710,10)])/3,W('horned')+0.1,.3)
# timeline ticks
t=W('Over',1)
while t<LE[15]: n=int(.03*SR); add(sfx,hp(rng.standard_normal(n),3000)*np.exp(-np.arange(n)/SR*200),t,.15); t+=0.12
ding(LE[15],1568,.1)
# end cards
ding(W('Goldfish'),1046,.12); ding(W('brain'),1318,.12)
sfx/=max(1e-6,np.abs(sfx).max()); sfx*=.28
mix=out+sfx; fo=int(0.8*SR); mix[-fo:]*=np.linspace(1,0,fo)
wf.write('public/viking_music.wav',SR,(np.clip(mix,-1,1)*32767).astype(np.int16))
print('ok',D)
