import subprocess, os, glob, sys, re
inp, out = sys.argv[1], sys.argv[2]
files = sorted([f for f in glob.glob(os.path.join(inp,'*')) if os.path.isfile(f)])
def dur_of(f):
    p=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],capture_output=True,text=True)
    return float(p.stdout.strip())
def tail_below(f, dur, thr_db, d=0.5):
    q=subprocess.run(['ffmpeg','-hide_banner','-nostats','-vn','-i',f,'-af',f'silencedetect=noise={thr_db}dB:d={d}','-f','null','-'],capture_output=True,text=True)
    err=q.stderr
    starts=[(float(m.group(1)), float(m.group(2))) for m in re.finditer(r'silence_start: ([0-9.]+)\|([0-9.]+)', err)]
    if not starts:
        starts=[(float(x),0.0) for x in re.findall(r'silence_start: ([0-9.]+)', err)]
    ends=[(float(m.group(1)), float(m.group(2))) for m in re.finditer(r'silence_end: ([0-9.]+)\|([0-9.]+)', err)]
    if not ends:
        ends=[(float(x),0.0) for x in re.findall(r'silence_end: ([0-9.]+)', err)]
    # trailing silence = последний start, у которого нет end после него
    if not starts: return 0.0, 0
    last_start = starts[-1][0]
    has_end_after = any(e[0] > last_start + 0.01 for e in ends)
    tail = round(dur - last_start, 2) if not has_end_after else 0.0
    return max(tail,0.0), len(starts)
rows=[]
for f in files:
    name=os.path.basename(f); dur=dur_of(f)
    t70,n70 = tail_below(f,dur,-70)
    t60,n60 = tail_below(f,dur,-60)
    t80,n80 = tail_below(f,dur,-80)
    rows.append((name,round(dur,1),t80,n80,t70,n70,t60,n60))
with open(os.path.join(out,'_silence.tsv'),'w',encoding='utf-8') as fh:
    print('file','dur_s','tail_-80','n','tail_-70','n','tail_-60','n',sep=chr(9),file=fh)
    for r in rows:
        print(*r,sep=chr(9),file=fh)
print('file\tdur\ttail-80\ttail-70\ttail-60')
for r in rows:
    print(f'{r[0]}\t{r[1]}\t{r[2]}\t{r[4]}\t{r[6]}')
