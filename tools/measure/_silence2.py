import subprocess, os, glob, sys, math
from array import array
inp, out = sys.argv[1], sys.argv[2]
SR = 8000
WIN = SR//20  # 0.05 s
THR = -70.0   # dBFS
files = sorted([f for f in glob.glob(os.path.join(inp,'*')) if os.path.isfile(f)])

def dur_of(f):
    p=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],capture_output=True,text=True)
    return float(p.stdout.strip())

def envelope(f):
    q=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-vn','-i',f,'-ac','1','-ar',str(SR),'-f','s16le','-'],capture_output=True)
    raw=q.stdout
    a=array('h'); a.frombytes(raw)
    n=len(a)//WIN
    env=[]
    for i in range(n):
        s=a[i*WIN:(i+1)*WIN]
        acc=0
        for v in s: acc+=v*v
        rms=math.sqrt(acc/len(s))/32768.0
        env.append(20*math.log10(rms) if rms>0 else -120.0)
    return env, len(a)/SR

def last_audible(env):
    # последний индекс с уровнем выше порога
    for i in range(len(env)-1,-1,-1):
        if env[i] > THR: return i
    return -1

rows=[]
for f in files:
    name=os.path.basename(f)
    dur=dur_of(f)
    env,real=envelope(f)
    li=last_audible(env)
    if li<0:
        t_last=0.0; tail=round(real,2)
    else:
        t_last=(li+1)*0.05; tail=round(real-t_last,2)
    rows.append((name, round(dur,2), round(t_last,2), tail))
with open(os.path.join(out,'_silence2.tsv'),'w',encoding='utf-8') as fh:
    print('file','dur_s','last_audible_s','tail_s',sep=chr(9),file=fh)
    for r in rows: print(*r,sep=chr(9),file=fh)
print('file\tdur\tlast_audible\ttail')
for r in rows: print(f'{r[0]}\t{r[1]}\t{r[2]}\t{r[3]}')
trim=[r for r in rows if r[3]>=0.3]
print('\n=> кандидатов на обрезку (хвост >= 0.3 c):', len(trim))
for r in trim: print('  ', r[0], 'хвост', r[3], 'c')
