import sys, os, numpy as np, warnings
warnings.filterwarnings('ignore')
import essentia.standard as es
M='/home/void/.local/share/essentia-models'
DEEP=M+'/deeptemp_k16.pb'

# --- TempoCNN: сначала пробуем, узнаём возврат ---
def tempo_cnn(a16):
    for am in ('mean','max','sum'):
        try:
            alg = es.TempoCNN(graphFilename=DEEP, aggregationMethod=am)
            r = alg(a16)
            return am, r
        except Exception as e:
            last = repr(e)[:160]
    return None, last

for f in sys.argv[1:]:
    print('=== '+os.path.basename(f)+' ===')
    a16 = es.MonoLoader(filename=f, sampleRate=11025)()
    a44 = es.MonoLoader(filename=f, sampleRate=44100)()
    am, r = tempo_cnn(a16)
    if am:
        try:
            print('  TempoCNN(%s):'%am, [float(x) if np.isscalar(x) else np.array(x).tolist()[:8] for x in (r if isinstance(r,tuple) else (r,))])
        except Exception as e:
            print('  TempoCNN(%s) результат:'%am, type(r), repr(r)[:200])
    else:
        print('  TempoCNN ОШИБКА:', r)
    for name, fn in [
        ('RE13-multifeature', lambda a: es.RhythmExtractor2013(method='multifeature')(a)[0]),
        ('RE13-degara',       lambda a: es.RhythmExtractor2013(method='degara')(a)[0]),
        ('Percival',          lambda a: float(es.PercivalBpmEstimator()(a))),
        ('HarmonicBpm',       lambda a: float(es.HarmonicBpm()(a)[0])),
        ('LoopBpmEstimator',  lambda a: float(es.LoopBpmEstimator()(a)[0])),
    ]:
        try:
            print(f'  {name:20}: {fn(a44):.1f}')
        except Exception as e:
            print(f'  {name:20}: ОШИБКА {repr(e)[:80]}')
    try:
        import librosa
        y,sr=librosa.load(f, sr=None, mono=True)
        bpm=librosa.feature.tempo(y=y, sr=sr, aggregate=np.median)
        print(f'  {"librosa.tempo":20}: {float(np.atleast_1d(bpm)[0]):.1f}')
    except Exception as e:
        print('  librosa.tempo        : ОШИБКА', repr(e)[:80])
