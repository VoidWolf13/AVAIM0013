import subprocess, os, glob, sys, re
inp = sys.argv[1]
out = sys.argv[2]
files = sorted([f for f in glob.glob(os.path.join(inp, '*')) if os.path.isfile(f)])
rows = []
for f in files:
    name = os.path.basename(f)
    pr = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1', f], capture_output=True, text=True)
    try:
        dur = float(pr.stdout.strip())
    except Exception:
        dur = 0.0
    q = subprocess.run(['ffmpeg','-hide_banner','-nostats','-vn','-i', f,'-af','ebur128=peak=true:framelog=quiet,silencedetect=noise=-70dB:d=0.3','-f','null','-'], capture_output=True, text=True)
    err = q.stderr
    I = ''
    TP = ''
    LRA = ''
    for line in err.splitlines():
        s = line.strip()
        if s.startswith('I: '):
            I = s.split()[1]
        elif s.startswith('LRA:'):
            LRA = s.split()[1]
        elif s.startswith('Peak:'):
            TP = s.split()[1]
    starts = [float(x) for x in re.findall('silence_start:[ ]*([0-9.]+)', err)]
    ends = [float(x) for x in re.findall('silence_end:[ ]*([0-9.]+)', err)]
    if starts:
        last = starts[-1]
        if (not ends) or ends[-1] < last:
            tail = round(dur - last, 2)
        else:
            tail = 0.0
    else:
        tail = 0.0
    rows.append([name, round(dur, 1), I, TP, LRA, tail, len(starts)])
tsv = os.path.join(out, '_analysis.tsv')
with open(tsv, 'w', encoding='utf-8') as fh:
    print('file', 'dur_s', 'LUFS', 'TP_dBFS', 'LRA', 'tail_silence_s', 'silence_events', sep=chr(9), file=fh)
    for r in rows:
        print(r[0], r[1], r[2], r[3], r[4], r[5], r[6], sep=chr(9), file=fh)
md = os.path.join(out, '_analysis.md')
with open(md, 'w', encoding='utf-8') as fh:
    print('# Анализ оригиналов: громкость и хвостовая тишина', file=fh)
    print('', file=fh)
    print('Порог тишины -70 dB, мин. длительность 0.3 с.', file=fh)
    print('', file=fh)
    print('| Файл | Длит., с | LUFS | TP, dBFS | LRA | Хвост, с | Тишин |', file=fh)
    print('|---|---|---|---|---|---|---|', file=fh)
    for r in rows:
        print('| ' + str(r[0]) + ' | ' + str(r[1]) + ' | ' + str(r[2]) + ' | ' + str(r[3]) + ' | ' + str(r[4]) + ' | ' + str(r[5]) + ' | ' + str(r[6]) + ' |', file=fh)
print('OK rows=' + str(len(rows)))
