import json, numpy as np, scipy.io.wavfile as wf
from scipy.signal import butter, sosfilt
SR=48000; tm=json.load(open('src/timing_gate.json')); D=tm['duration']+1.4; N=int(D*SR); x=np.arange(N)/SR; rng=np.random.default_rng(3)
L=[l[0] for l in tm['lines']]
lp=lambda s,f:sosfilt(butter(2,f,'low',fs=SR,output='sos'),s)
# low drone + airport HVAC hum, slowly swelling
drone=(np.sin(2*np.pi*55*x)+.6*np.sin(2*np.pi*55.4*x)+.3*np.sin(2*np.pi*82.5*x))*np.minimum(1,x/2)*(0.6+0.4*np.minimum(1,x/D))
hum=lp(rng.standard_normal(N),140)*.6
out=drone*.25+hum*.15
# fluorescent buzz during flicker
s,e=int((L[3]-0.2)*SR),int((L[3]+0.9)*SR); n=e-s; tt=np.arange(n)/SR
out[s:e]+=np.sign(np.sin(2*np.pi*120*tt))*(np.sin(2*np.pi*23*tt)>0.2)*.05
# deep hit on "no face" + tail
def hit(t0,g):
    n=int(2.5*SR); tt=np.arange(n)/SR; y=np.sin(2*np.pi*np.cumsum(30+40*np.exp(-tt*8))/SR)*np.exp(-tt*1.4)+lp(rng.standard_normal(n),400)*np.exp(-tt*6)*.4
    s=int(t0*SR); e=min(N,s+n); out[s:e]+=y[:e-s]*g
hit(L[3]+0.75,.9)
# distant chime at the start
n=int(2*SR); tt=np.arange(n)/SR; out[int(.3*SR):int(.3*SR)+n]+=(np.sin(2*np.pi*659*tt)*np.exp(-tt*2)+np.sin(2*np.pi*523*tt)*np.exp(-np.maximum(0,tt-.5)*2)*(tt>.5))*.08
out[int(tm['duration']*SR):]*=0.15
out/=np.abs(out).max(); out*=.5
wf.write('public/gate_music.wav',SR,(out*32767).astype(np.int16)); print('ok')
