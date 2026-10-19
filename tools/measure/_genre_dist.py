import os, json, sys
import numpy as np
from collections import defaultdict, Counter
from essentia.standard import MonoLoader, TensorflowPredictEffnetDiscogs, TensorflowPredict2D

M = '/home/void/.local/share/essentia-models'
EMB = M + '/discogs-effnet-bs64-1.pb'
GEN = M + '/genre_discogs400-discogs-effnet-1.pb'
lab = json.load(open(M + '/genre_discogs400-discogs-effnet-1.json'))
labels = lab.get('classes') or lab.get('labels') if isinstance(lab, dict) else lab
if not isinstance(labels, list):
    labels = list(lab.values())[0]

MUSIC = '/run/media/system/DATA/Github AVAIM0013/AVAIM0013/music'

E = TensorflowPredictEffnetDiscogs(graphFilename=EMB, output='PartitionedCall:1')
G = TensorflowPredict2D(graphFilename=GEN,
                        input='serving_default_model_Placeholder',
                        output='PartitionedCall:0')

n_with = sum(1 for l in labels if '---' in l)
parents = sorted({l.split('---', 1)[0] for l in labels if '---' in l})
print('labels=%d, с ---=%d, без=%d' % (len(labels), n_with, len(labels) - n_with), file=sys.stderr)
print('родителей=%d: %s' % (len(parents), parents), file=sys.stderr)

THR = [3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20]
stat = {t: {'counts': [], 'zero': 0} for t in THR}
examples = []

files = sorted(f for f in os.listdir(MUSIC) if f.lower().endswith('.mp3'))
for i, f in enumerate(files, 1):
    p = os.path.join(MUSIC, f)
    audio = MonoLoader(filename=p, sampleRate=16000, resampleQuality=4)()
    emb = E(audio)
    pred = np.array(G(emb))
    mean = pred.mean(axis=0)
    par_sum = defaultdict(float)
    subs = []
    for j, l in enumerate(labels):
        pr = float(mean[j]) * 100.0
        if '---' in l:
            par, ch = l.split('---', 1)
            par_sum[par] += pr
            subs.append((ch, pr))
        else:
            par_sum[l] += pr
    top_parent = max(par_sum, key=par_sum.get)
    subs.sort(key=lambda x: -x[1])
    top3 = subs[:3]
    for t in THR:
        cnt = sum(1 for _, pr in top3 if pr >= t)
        stat[t]['counts'].append(cnt)
        if cnt == 0:
            stat[t]['zero'] += 1
    if i <= 10:
        examples.append((f, top_parent, [(c, round(pr, 1)) for c, pr in top3]))

print('=== примеры: родитель + глобальный топ-3 поджанра ===')
for f, tp, t3 in examples:
    print('%-28s родитель=%-14s | %s' % (f, tp, ', '.join('%s %.1f%%' % (c, pr) for c, pr in t3)))

print()
print('=== сколько поджанров проходит при пороге ===')
print('%6s %8s %5s %5s %5s %5s %16s' % ('порог', 'ср.подж', '0', '1', '2', '3', 'только родитель'))
for t in THR:
    cs = stat[t]['counts']
    avg = sum(cs) / len(cs) if cs else 0
    hist = Counter(cs)
    print('%6d %8.2f %5d %5d %5d %5d %16d' % (
        t, avg, hist.get(0, 0), hist.get(1, 0), hist.get(2, 0), hist.get(3, 0), stat[t]['zero']))
print()
print('всего треков:', len(files))
