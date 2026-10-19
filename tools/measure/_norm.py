import subprocess, os, sys, json, re
inp=sys.argv[1]; out=os.path.join(sys.argv[2],'нормализация')
TARGET_I=-14.0; TARGET_TP=-1.0; TARGET_LRA=11.0
files=sys.argv[3:]
def measure(f):
    q=subprocess.run(['ffmpeg','-hide_banner','-nostats','-vn','-i',f,'-af','ebur128=peak=true:framelog=quiet','-f','null','-'],capture_output=True,text=True)
    I=TP=LRA=None
    for ln in q.stderr.splitlines():
        s=ln.strip()
        if s.startswith('I: '): I=s.split()[1]
        elif s.startswith('LRA:'): LRA=s.split()[1]
        elif s.startswith('Peak:'): TP=s.split()[1]
    return I,LRA,TP
def two_pass(f, dst):
    p1=subprocess.run(['ffmpeg','-hide_banner','-nostats','-vn','-i',f,'-af',f'loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json','-f','null','-'],capture_output=True,text=True)
    m=re.search(r'\{[^{}]*input_i[^{}]*\}', p1.stderr, re.S)
    if not m: return None,'нет JSON первого прохода'
    d=json.loads(m.group(0))
    ln=f'loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:measured_I={d["input_i"]}:measured_TP={d["input_tp"]}:measured_LRA={d["input_lra"]}:measured_thresh={d["input_thresh"]}:offset={d["target_offset"]}:linear=true:print_format=summary'
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',f,'-af',ln,'-ar','44100','-c:a','pcm_s16le',dst])
    return d,None
for fn in files:
    f=os.path.join(inp,fn); base=os.path.splitext(fn)[0]
    dst=os.path.join(out,base+'_norm.wav')
    before=measure(f)
    d,err=two_pass(f,dst)
    after=measure(dst)
    print(f'{fn}')
    print(f'   до:    I={before[0]}  LRA={before[1]}  TP={before[2]}')
    if err: print('   ',err); continue
    print(f'   после: I={after[0]}  LRA={after[1]}  TP={after[2]}')
    print(f'   первый проход: measured_I={d["input_i"]}  measured_TP={d["input_tp"]}  offset={d["target_offset"]}')
