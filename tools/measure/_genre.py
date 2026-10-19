import sys, json, os, numpy as np, warnings
warnings.filterwarnings('ignore')
from essentia.standard import MonoLoader, TensorflowPredictEffnetDiscogs, TensorflowPredict2D
M='/home/void/.local/share/essentia-models'
EMB=M+'/discogs-effnet-bs64-1.pb'
GEN=M+'/genre_discogs400-discogs-effnet-1.pb'
lab=json.load(open(M+'/genre_discogs400-discogs-effnet-1.json'))
labels = lab.get('classes') or lab.get('labels') if isinstance(lab,dict) else lab
if not isinstance(labels,list): labels=list(lab.values())[0]
print('labels:', len(labels), '| first:', labels[:2], file=sys.stderr)
E = TensorflowPredictEffnetDiscogs(graphFilename=EMB, output='PartitionedCall:1')
G = TensorflowPredict2D(graphFilename=GEN, input='serving_default_model_Placeholder', output='PartitionedCall:0')
for f in sys.argv[1:]:
    name=os.path.basename(f)
    print('=== '+name+' ===')
    try:
        audio = MonoLoader(filename=f, sampleRate=16000, resampleQuality=4)()
        emb = E(audio)
        pred = np.array(G(emb))
        mean = pred.mean(axis=0)
        order = np.argsort(mean)[::-1][:8]
        for i in order:
            print(f'  {mean[i]*100:6.2f}%  {labels[int(i)]}')
    except Exception as e:
        print('  ОШИБКА:', repr(e))
