import sys, os, json, numpy as np
from collections import defaultdict
from essentia.standard import MonoLoader, TensorflowPredictEffnetDiscogs, TensorflowPredict2D, RhythmExtractor2013
M='/home/void/.local/share/essentia-models'
EMB=M+'/discogs-effnet-bs64-1.pb'
GEN=M+'/genre_discogs400-discogs-effnet-1.pb'
lab=json.load(open(M+'/genre_discogs400-discogs-effnet-1.json'))
labels = lab.get('classes') or lab.get('labels') if isinstance(lab,dict) else lab
if not isinstance(labels,list): labels=list(lab.values())[0]
E = TensorflowPredictEffnetDiscogs(graphFilename=EMB, output='PartitionedCall:1')
G = TensorflowPredict2D(graphFilename=GEN, input='serving_default_model_Placeholder', output='PartitionedCall:0')
RE = RhythmExtractor2013(method='multifeature')

def genres(pred_mean, max_sub=3, min_frac=0.5, min_abs=5.0):
    par_sum=defaultdict(float); par_child=defaultdict(list)
    for i,l in enumerate(labels):
        p=float(pred_mean[i])*100.0
        par,ch = (l.split('---',1) if '---' in l else (l,l))
        par_sum[par]+=p; par_child[par].append((ch,p))
    main=max(par_sum,key=par_sum.get)
    kids=sorted(par_child[main],key=lambda x:-x[1])
    out=[]
    for ch,p in kids:
        if not out: out.append((ch,p)); continue
        if len(out)>=max_sub: break
        if p>=min_abs and p>=min_frac*kids[0][1]: out.append((ch,p))
        else: break
    return main, par_sum[main], out

for f in sys.argv[1:]:
    print('=== '+os.path.basename(f)+' ===')
    audio = MonoLoader(filename=f, sampleRate=16000, resampleQuality=4)()
    emb = E(audio); pred = np.array(G(emb)); mean = pred.mean(axis=0)
    main, s, out = genres(mean)
    tcon = ' / '.join([main]+[c for c,_ in out])
    print('  TCON:', tcon)
    print('  детали:', main, f'({s:.1f}%)', '|', ', '.join(f'{c} {p:.1f}%' for c,p in out))
    a44 = MonoLoader(filename=f, sampleRate=44100)()
    bpm, beats, conf, est, iv = RE(a44)
    print(f'  BPM: {bpm:.1f}  (уверенность {conf:.2f})')
