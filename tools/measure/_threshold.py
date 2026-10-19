import subprocess, os, sys, math
from array import array
SR=8000; WIN=SR//50  # 0.02 s окно
def envelope(f):
    q=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-vn','-i',f,'-ac','1','-ar',str(SR),'-f','s16le','-'],capture_output=True)
    a=array('h'); a.frombytes(q.stdout)
    n=len(a)//WIN; env=[]
    for i in range(n):
        s=a[i*WIN:(i+1)*WIN]; acc=0
        for v in s: acc+=v*v
        rms=math.sqrt(acc/len(s))/32768.0
        env.append(20*math.log10(rms) if rms>0 else -120.0)
    return env, len(a)/SR
def tail_at(env, real, thr):
    # идём от конца, ищем последнее окно > thr; хвост = всё после
    for i in range(len(env)-1,-1,-1):
        if env[i] > thr:
            t=(i+1)*0.02
            return round(real-t,2)
    return round(real,2)
f=sys.argv[1]
env,real=envelope(f)
print(os.path.basename(f), 'decode', round(real,2))
for thr in [-70,-65,-60,-55,-50,-45]:
    print(f'   thr {thr:5} dB -> хвост {tail_at(env,real,thr):6.2f} c')
