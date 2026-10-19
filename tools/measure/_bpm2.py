import sys, os, numpy as np
from essentia.standard import MonoLoader, RhythmExtractor2013, PercivalBpmEstimator
for f in sys.argv[1:]:
    a = MonoLoader(filename=f, sampleRate=44100)()
    out=[]
    for meth in ('multifeature','degara'):
        try:
            b,beats,conf,est,iv = RhythmExtractor2013(method=meth)(a)
            # медианный интервал между битами
            ib = np.diff(beats) if len(beats)>1 else [0]
            med = float(np.median(ib))*1000 if len(ib) else 0
            out.append(f'RE-{meth}: {b:.1f} (conf {conf:.2f}, med {med:.0f}ms)')
        except Exception as e:
            out.append(f'RE-{meth}: ОШИБКА {e!r}')
    try:
        pb = PercivalBpmEstimator()(a)
        out.append(f'Percival: {pb:.1f}')
    except Exception as e:
        out.append(f'Percival: ОШИБКА {e!r}')
    print(f'{os.path.basename(f):26} | ' + ' | '.join(out))
