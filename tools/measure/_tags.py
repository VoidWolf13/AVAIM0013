import os, sys, subprocess
from mutagen.id3 import ID3, TIT2, TPE1, TCOM, TCON, TBPM, TXXX, TALB, TDRC, ID3NoHeaderError
from mutagen.mp3 import MP3

# берём уже нормализованные wav, кодируем в mp3 320 и пишем теги
GEN = {
 '100km': ['Electronic---Hardcore','Electronic---Makina','Electronic---Experimental'],
 'one':   ['Electronic---Downtempo','Electronic---Trip Hop','Hip Hop---Instrumental'],
 'trance':['Electronic---Trance','Electronic---Progressive Trance','Electronic---Psy-Trance'],
}
BPM = {'100km':170,'one':90,'trance':140}
src=os.path.join(sys.argv[1],'нормализация'); out=os.path.join(sys.argv[2],'теги')
for base,genres in GEN.items():
    wav=os.path.join(src, base+'_norm.wav')
    mp3=os.path.join(out, base+'.mp3')
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',wav,'-vn','-c:a','libmp3lame','-b:a','320k',mp3])
    try: tags=ID3(mp3)
    except ID3NoHeaderError: tags=ID3()
    tags.add(TIT2(encoding=3, text=base))
    tags.add(TPE1(encoding=3, text='AVAIM0013'))
    tags.add(TCOM(encoding=3, text='AVAIM0013'))
    tags.add(TCON(encoding=3, text=' / '.join(genres)))
    tags.add(TBPM(encoding=3, text=str(BPM[base])))
    tags.add(TXXX(encoding=3, desc='processed', text='1'))
    tags.save(mp3)
    # контрольное чтение
    r=ID3(mp3)
    print(f'=== {base}.mp3 ===')
    print('  TIT2:', r.get('TIT2'))
    print('  TPE1:', r.get('TPE1'))
    print('  TCOM:', r.get('TCOM'))
    print('  TCON:', r.get('TCON'))
    print('  TBPM:', r.get('TBPM'))
    print('  TXXX:processed:', r.get('TXXX:processed'))
    print('  processed == 1 ->', str(r.get('TXXX:processed'))=='1')
