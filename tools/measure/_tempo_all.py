import sys, os, glob, numpy as np, warnings
from collections import defaultdict
warnings.filterwarnings('ignore')
import essentia.standard as es
import librosa
M='/home/void/.local/share/essentia-models'
DEEP=M+'/deeptemp_k16.pb'

_tcnn = None
def tempo_cnn(a16):
    global _tcnn
    if _tcnn is None:
        _tcnn = es.TempoCNN(graphFilename=DEEP)
    _, bpms, confs = _tcnn(a16)
    acc = defaultdict(float)
    for b, c in zip(np.atleast_1d(bpms), np.atleast_1d(confs)):
        acc[float(b)] += float(c)
    best = max(acc.items(), key=lambda kv: kv[1])
    return best[0], best[1]/sum(acc.values())

def octave_vote(vals):
    # vals: dict method->bpm; свести к одному периоду, голосованием
    # приведём все к диапазону 60..240 через *2 /*2
    norm = []
    for v in vals:
        if v is None or v<=0: continue
        while v < 60: v*=2
        while v > 240: v/=2
        norm.append(v)
    if not norm: return None
    # кластеры по лог2
    import math
    logs = [math.log2(x) for x in norm]
    med = float(np.median(logs))
    close = [x for x,l in zip(norm,logs) if abs(l-med)<0.15]
    return float(np.mean(close)) if close else float(np.median(norm))

files=sorted([f for f in glob.glob(os.path.join(IN if False else sys.argv[1],'*')) if os.path.isfile(f)])
rows=[]
for f in files:
    a16 = es.MonoLoader(filename=f, sampleRate=11025)()
    a44 = es.MonoLoader(filename=f, sampleRate=44100)()
    r={}
    try: r['TCNN'], r['TCNNconf'] = tempo_cnn(a16)
    except Exception as e: r['TCNN']=None; r['TCNNconf']=0
    for name, fn in [
        ('REmulti', lambda a: float(es.RhythmExtractor2013(method='multifeature')(a)[0])),
        ('REdegara', lambda a: float(es.RhythmExtractor2013(method='degara')(a)[0])),
        ('Percival', lambda a: float(es.PercivalBpmEstimator()(a))),
    ]:
        try: r[name]=fn(a44)
        except Exception: r[name]=None
    try:
        y,sr=librosa.load(f, sr=None, mono=True)
        r['librosa']=float(np.atleast_1d(librosa.feature.tempo(y=y, sr=sr, aggregate=np.median))[0])
    except Exception: r['librosa']=None
    r['vote']=octave_vote([r.get(k) for k in ('TCNN','REmulti','REdegara','Percival','librosa')])
    rows.append((os.path.basename(f), r))

def f(x): return f'{x:6.1f}' if isinstance(x,(int,float)) else '  --  '
tsv=os.path.join(sys.argv[2],'темп','_tempo_all.tsv')
with open(tsv,'w',encoding='utf-8') as fh:
    print('file','TempoCNN','conf','RE-multi','RE-degara','Percival','librosa','vote',sep='\t',file=fh)
    for n,r in rows:
        print(n, f(r['TCNN']).strip(), f"{r['TCNNconf']:.2f}", f(r['REmulti']).strip(), f(r['REdegara']).strip(), f(r['Percival']).strip(), f(r['librosa']).strip(), f(r['vote']).strip(), sep='\t', file=fh)
print(f'{"file":26} {"TCNN":>6} {"c":>4} {"REmul":>6} {"REdeg":>6} {"Perc":>6} {"libr":>6} | {"vote":>6}')
for n,r in rows:
    print(f'{n:26} {f(r["TCNN"])} {r["TCNNconf"]:4.2f} {f(r["REmulti"])} {f(r["REdegara"])} {f(r["Percival"])} {f(r["librosa"])} | {f(r["vote"])}')
