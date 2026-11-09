import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_ocean60.json')); D=tm['duration']+2.2; N=int(D*SR); rng=np.random.default_rng(5)
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
# 1) hook war drums until the reveal
b=60/100; t=0.0
while t<L[2]-0.25:
    tom(out,t,70,.9); tom(out,t+b*.75,90,.5); tom(out,t+b,70,.7); tom(out,t+b*1.5,110,.35); t+=2*b
for k,m in enumerate([50,53,57,55]): brass(out,k*2*b,m,1.5,.15)
tom(out,L[2]-0.02,45,1.4)
# 2) building tension (Britain, armor) L3..L7 : low pad + slow drums
pad(out,L[3]-0.3,L[7],[50,57,62],.16)
t=L[4]
while t<L[6]: tom(out,t,60,.5); t+=60/80
# 3) playful from the order until the reward
beat=60/116; prog=[[60,64,67],[65,69,72],[67,71,74],[60,64,67]]; mel=[0,2,1,2,0,1,2,1]; t=L[7]+0.2; k=0
while t<L[14]-0.3:
    ch=prog[k%4]
    for s in range(8):
        if t+s*beat/2<L[14]-0.3: add(out,pluck(mf(ch[mel[s]]+12)),t+s*beat/2,.22)
    for q in (0,2):
        if t+q*beat<L[14]-0.3: add(out,pluck(mf(ch[0]-12),.6),t+q*beat,.45)
    t+=4*beat; k+=1
# 4) mystery: was he mad? historians
pad(out,L[14]-0.2,L[17],[50,53,57],.2)
t=L[14]
while t<L[17]-0.3:
    n=int(.3*SR); x=np.arange(n)/SR; add(out,np.sin(2*np.pi*mf(74)*x)*np.exp(-x*6),t,.06); t+=60/70*2
# 5) outro
pad(out,L[17]-0.2,D,[48,52,55,60],.2)
for s in range(8): add(out,pluck(mf([72,76,79,84][s%4])),L[17]+s*0.25,.2)
out/=np.abs(out).max(); out*=.2
# sfx
def whoosh(t0,d=.5,g=.12): n=int(d*SR); add(sfx,bp(rng.standard_normal(n),300,3000)*np.sin(np.linspace(0,np.pi,n))**2,t0,g)
def ding(t0,f=1318,g=.1): n=int(1*SR); x=np.arange(n)/SR; add(sfx,(np.sin(2*np.pi*f*x)+.4*np.sin(2*np.pi*f*1.5*x))*np.exp(-x*5),t0,g)
whoosh(W('Catapults')+0.35,.7,.2); tom(sfx,W('Catapults')+0.6,55,.5)
for c in [W('An'),L[1],L[3],L[4],L[5],L[6],L[7],W('collect'),L[8],L[9],L[10],L[11],L[12],L[13],L[14],L[15],L[16],L[17]]: whoosh(c-0.4)
n=int(3*SR); add(sfx,lp(rng.standard_normal(n),600)*(0.5+0.5*np.sin(np.arange(n)/SR*2.2))*np.sin(np.linspace(0,np.pi,n)),L[2]-0.5,.05)
# trumpets: fanfare
for i,(m,d) in enumerate([(67,.25),(67,.25),(72,.7)]): brass(sfx,L[6]+0.1+sum(x[1] for x in [(67,.25),(67,.25),(72,.7)][:i]),m,d,.35)
ding(W('collect')+0.2); ding(L[10]+0.9)
# tower rumble
n=int(2.4*SR); add(sfx,lp(rng.standard_normal(n),140)*np.sin(np.linspace(0,np.pi,n)),L[11]+0.3,.6)
# coins
for i in range(26): ding(L[12]+0.15+i*0.07+rng.random()*0.05,2600+rng.random()*900,.05)
ding(L[17]+0.6,1046,.12); ding(L[17]+1.1,1318,.12)
sfx/=max(1e-6,np.abs(sfx).max()); sfx*=.25
mix=out+sfx; fo=int(1.2*SR); mix[-fo:]*=np.linspace(1,0,fo)
wf.write('public/ocean60_music.wav',SR,(np.clip(mix,-1,1)*32767).astype(np.int16))
print('ok',D)
