import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_f404_de.json')); D=tm['duration']+3.0; N=int(D*SR); x=np.arange(N)/SR; rng=np.random.default_rng(4)
L=[l[0] for l in tm['lines']]; LE=[l[1] for l in tm['lines']]
lp=lambda s,f:sosfilt(butter(2,f,'low',fs=SR,output='sos'),s)
out=np.zeros(N)
def add(y,t0,g=1.):
    s=int(t0*SR); e=min(N,s+len(y))
    if 0<=s<N: out[s:e]+=y[:e-s]*g
def env(a,b,fade=.8):
    return np.clip(np.minimum((x-a)/fade,(b-x)/fade),0,1)
# night drone + hvac (everything except the morning)
night=env(0,L[16]-0.2)+env(L[19]-0.2,D)
drone=(np.sin(2*np.pi*55*x)+.6*np.sin(2*np.pi*55.4*x)+.3*np.sin(2*np.pi*82.5*x))
out+=drone*.22*night+lp(rng.standard_normal(N),140)*.12*night
# rising tension on the walk and on the stay path
for a,b in [(L[7],L[11]),(L[13],L[15])]:
    k=env(a,b,1.0)*np.clip((x-a)/(b-a),0,1); out+=np.sin(2*np.pi*110*x*(1+0.5*np.clip((x-a)/(b-a),0,1)))*.05*k
# morning: soft airport ambience + warm pad
m=env(L[16]-0.1,L[19]-0.3)
out+=(np.sin(2*np.pi*220*x)+np.sin(2*np.pi*277*x)+np.sin(2*np.pi*330*x))*.03*m+lp(rng.standard_normal(N),900)*.05*m
def gong(t0,f1=659,f2=523):
    n=int(2.5*SR); tt=np.arange(n)/SR; add(np.sin(2*np.pi*f1*tt)*np.exp(-tt*2)+np.sin(2*np.pi*f2*tt)*np.exp(-np.maximum(0,tt-.45)*2)*(tt>.45),t0,.12)
gong(L[4]-0.1); gong(L[16]+0.3,784,659)
def hit(t0,g=.8):
    n=int(2.5*SR); tt=np.arange(n)/SR; add(np.sin(2*np.pi*np.cumsum(30+40*np.exp(-tt*8))/SR)*np.exp(-tt*1.4)+lp(rng.standard_normal(n),400)*np.exp(-tt*6)*.4,t0,g)
hit(L[5]+0.9); hit(L[10]+1.6,1.0); hit(L[13]+1.45,.7); hit(L[14]+0.35,.8); hit(L[18]+0.4,.6)
def clunk(t0): n=int(.3*SR); tt=np.arange(n)/SR; add(lp(rng.standard_normal(n),500)*np.exp(-tt*20),t0,.5)
t=L[9]+0.2
for k in range(7): clunk(t+k*(LE[9]+0.2-L[9])/7)
def buzz(a,b):
    s,e=int(a*SR),int(b*SR); tt=np.arange(e-s)/SR; out[s:e]+=np.sign(np.sin(2*np.pi*120*tt))*.05
buzz(L[13]+0.9,L[13]+1.5); buzz(L[14]-0.1,L[14]+0.4)
# rewind: fast reversed whoosh
n=int(1.0*SR); tt=np.arange(n)/SR; add(np.sin(2*np.pi*np.cumsum(900-700*tt)/SR)*.2+sosfilt(butter(2,[400,3000],'band',fs=SR,output='sos'),rng.standard_normal(n))*.2,L[11]-0.1,1)
# door slide
n=int(1.4*SR); tt=np.arange(n)/SR; add(lp(rng.standard_normal(n),300)*np.sin(np.pi*tt/1.4)*.5,L[10]+0.2,1)
out/=np.abs(out).max(); out*=.5
wf.write('public/f404de_music.wav',SR,(out*32767).astype(np.int16)); print('ok',D)
