import subprocess, os, glob, sys, math
from array import array
inp, out = sys.argv[1], sys.argv[2]
OUTDIR = os.path.join(out, 'обрезка')
SR = 8000; WIN = SR//20; THR = -70.0
MARGIN = 0.15; FADE = 0.03
files = sorted([f for f in glob.glob(os.path.join(inp,'*')) if os.path.isfile(f)])

def dur_of(f):
    p=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],capture_output=True,text=True)
    try: return float(p.stdout.strip())
    except: return 0.0

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

def last_audible(env):
    for i in range(len(env)-1,-1,-1):
        if env[i] > THR: return i
    return -1

rows=[]
for f in files:
    name=os.path.basename(f); base=os.path.splitext(name)[0]
    env,real=envelope(f)
    li=last_audible(env)
    tail = real if li<0 else real-(li+1)*0.05
    cut = real if li<0 else min(real, (li+1)*0.05+MARGIN)
    written=''
    if tail >= 0.1:
        outwav=os.path.join(OUTDIR, base+'.wav')
        st=max(0.0, cut-FADE)
        subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',f,'-t',f'{cut:.3f}','-af',f'afade=t=out:st={st:.3f}:d={FADE}','-c:a','pcm_s16le',outwav])
        env2,real2=envelope(outwav); li2=last_audible(env2)
        tail2 = 0.0 if li2<0 else max(0.0, real2-(li2+1)*0.05)
        written=f'{cut:.2f} -> {real2:.2f} (хвост {tail2:.2f})'
    rows.append((name, round(dur_of(f),2), round(real,2), round(tail,2), round(cut,2), written))

with open(os.path.join(out,'_trim.tsv'),'w',encoding='utf-8') as fh:
    print('file','hdr_dur','decoded_dur','tail_before','cut_at','result',sep=chr(9),file=fh)
    for r in rows: print(*r,sep=chr(9),file=fh)
print(f'{"file":28} {"hdr":>7} {"decode":>7} {"tail":>6} {"cut":>7}  результат')
for r in rows:
    print(f'{r[0]:28} {r[1]:7.2f} {r[2]:7.2f} {r[3]:6.2f} {r[4]:7.2f}  {r[5]}')
print('\nвыписано обрезанных:', len([r for r in rows if r[5]]))
