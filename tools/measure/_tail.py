import subprocess, os, glob, sys, re, json
inp, out = sys.argv[1], sys.argv[2]
files = sorted([f for f in glob.glob(os.path.join(inp,'*')) if os.path.isfile(f)])
res=[]
for f in files:
    name=os.path.basename(f)
    pr=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],capture_output=True,text=True)
    dur=float(pr.stdout.strip())
    # RMS профиль по секундам через astats
    q=subprocess.run(['ffmpeg','-hide_banner','-nostats','-vn','-i',f,'-af','astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-','-f','null','-'],capture_output=True,text=True)
    rms=[]
    for line in q.stdout.splitlines():
        m=re.match(r'lavfi\.astats\.Overall\.RMS_level=(-?[0-9.]+|inf|-inf)',line.strip())
        if m: rms.append(m.group(1))
    # последние 6 значений
    last=rms[-6:] if len(rms)>=6 else rms
    def fnum(x):
        try: return float(x)
        except: return -999.0
    # найти с какого места хвост уходит ниже -70
    tail_rms=last
    res.append((name,round(dur,1),tail_rms))
with open(os.path.join(out,'_tail.txt'),'w',encoding='utf-8') as fh:
    for name,dur,tr in res:
        fh.write(f'{name}\t{dur}\t{tr}\n')
print('done',len(res))
