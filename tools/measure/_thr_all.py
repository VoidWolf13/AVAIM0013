import subprocess, os, glob, sys, math
from array import array
SR=8000; WIN=SR//50
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
    for i in range(len(env)-1,-1,-1):
        if env[i] > thr:
            return round(real-(i+1)*0.02,2)
    return round(real,2)
inp=sys.argv[1]
files=sorted([f for f in glob.glob(os.path.join(inp,'*')) if os.path.isfile(f)])
print(f'{"file":26} {"dec":>7} {"-45":>6} {"-50":>6} {"-55":>6} {"-60":>6} {"-65":>6}')
for f in files:
    env,real=envelope(f)
    v=[tail_at(env,real,t) for t in (-45,-50,-55,-60,-65)]
    print(f'{os.path.basename(f):26} {real:7.1f} ' + ' '.join(f'{x:6.2f}' for x in v))
