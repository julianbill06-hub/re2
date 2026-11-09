import json, subprocess, numpy as np, scipy.io.wavfile as wf, re, sys
D=sys.argv[1] if len(sys.argv)>1 else 'tools'; OUTW=sys.argv[2] if len(sys.argv)>2 else 'public/voice.wav'; OUTJ=sys.argv[3] if len(sys.argv)>3 else 'src/timing.json'
SR=48000; lines=[l.strip() for l in open(D+'/lines.txt') if l.strip()]
import os
capl=[l.strip() for l in open(D+'/captions.txt') if l.strip()] if os.path.exists(D+'/captions.txt') else lines
t=.5; out=[]; caps=[]
for i,l in enumerate(lines):
    c=f'{D}/takes/c{i}.wav'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'{D}/takes/l{i}.wav','-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5','-ar',str(SR),'-ac','1',c])
    a=wf.read(c)[1].astype(np.float32)/32768; d=len(a)/SR
    words=capl[i].split(); w=[len(re.sub(r'\W','',x))+2 for x in words]; tot=sum(w); acc=0
    for x,k in zip(words,w):
        caps.append({'text':x,'start':round(t+d*acc/tot,3),'end':round(t+d*(acc+k)/tot,3),'line':i}); acc+=k
    out.append((t,a)); t+=d+.45
v=np.zeros(int((t+1)*SR),np.float32)
for s,a in out: v[int(s*SR):int(s*SR)+len(a)]+=a
wf.write(OUTW,SR,(v*32767).astype(np.int16))
lines_t=[[o[0],o[0]+len(o[1])/SR] for o in out]
json.dump({'duration':round(t+.6,3),'lines':lines_t,'words':caps},open(OUTJ,'w'),indent=1)
print(t)
