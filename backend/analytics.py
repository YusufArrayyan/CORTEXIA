import re, threading
from pathlib import Path
import numpy as np
import jiwer
from faster_whisper import WhisperModel
from core import ROOT

_model=None
_lock=threading.Lock()
MODEL_DIR=ROOT/'models'/'whisper'
def whisper_directory():
    # A Windows checkout can contain text links instead of snapshot binaries.
    for weights in sorted(MODEL_DIR.glob('**/model.bin')):
        directory = weights.parent
        if (weights.is_file() and weights.stat().st_size > 1024
                and all((directory / name).is_file() for name in ('config.json', 'tokenizer.json', 'vocabulary.txt'))):
            return directory
    return None

def asr_ready():
    return whisper_directory() is not None

def transcribe(path):
    from pronunciation import decode_pcm
    result = transcribe_pcm(decode_pcm(path))
    result['words'], _ = clean_words(result['words'])
    return result


def transcribe_pcm(pcm):
    global _model
    with _lock:
        if _model is None:
            directory = whisper_directory()
            if directory is None: raise RuntimeError('Model suara lokal belum tersedia.')
            _model=WhisperModel(str(directory),device='cpu',compute_type='int8',local_files_only=True,cpu_threads=2,num_workers=1)
        # Decode sendiri ke PCM 16 kHz agar tidak bergantung pada API PyAV yang dipakai faster-whisper.
        validate_pcm(pcm)
        audio=np.frombuffer(pcm,dtype=np.int16).astype(np.float32)/32768.0
        segments,info=_model.transcribe(audio,language='id',beam_size=5,word_timestamps=True,vad_filter=True,condition_on_previous_text=False)
        words=[];texts=[]
        for seg in segments:
            if seg.no_speech_prob>0.7:continue
            texts.append(seg.text.strip())
            for w in seg.words or []:words.append({'word':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability})
        duration=float(info.duration) if _finite(info.duration) and info.duration>0 else len(pcm)/2/16000
        return {'transcript':' '.join(texts),'words':words,'audio_duration':round(duration,2),'language':'id','model':'faster-whisper/base-int8'}

MIN_PCM_S=0.1          # audio hasil decode di bawah 0,1 detik dianggap kosong (bukan ambang analisis)

def _finite(v):
    try:return v is not None and not isinstance(v,bool) and np.isfinite(float(v))
    except (TypeError,ValueError):return False

def validate_pcm(pcm,rate=16000):
    """Tolak audio yang kosong/terlalu pendek setelah decode, atau yang seluruhnya hening digital."""
    if not pcm or len(pcm)<int(MIN_PCM_S*rate)*2:raise ValueError('Audio kosong atau terlalu pendek setelah decode.')
    if not np.any(np.frombuffer(pcm[:len(pcm)//2*2],dtype=np.int16)):raise ValueError('Audio hanya berisi hening.')

def clean_words(words):
    """Saring timestamp kata ASR: harus finite, tidak negatif, end >= start; probabilitas dijepit ke [0, 1].
    Mengembalikan (kata_terurut, jumlah_dibuang)."""
    out=[];dropped=0
    for w in words or []:
        s,e=w.get('start'),w.get('end')
        if not (_finite(s) and _finite(e)) or float(s)<0 or float(e)<float(s) or not str(w.get('word','')).strip():
            dropped+=1;continue
        p=w.get('probability')
        p=round(min(1.0,max(0.0,float(p))),3) if _finite(p) else None
        out.append({**w,'word':str(w['word']).strip(),'start':round(float(s),3),'end':round(float(e),3),'probability':p})
    out.sort(key=lambda w:(w['start'],w['end']))
    return out,dropped

def normalize(text):return ' '.join(re.findall(r"[^\W_]+(?:-[^\W_]+)*",(text or '').lower(),re.UNICODE))

EMPTY_ALIGNMENT={'wer':None,'accuracy':None,'substitutions':None,'deletions':None,'insertions':None,'correct_words':0,'annotations':[]}

def word_error_rate(reference,hypothesis):
    """WER (%) antara dua teks ternormalisasi; None bila referensi kosong."""
    ref=normalize(reference);hyp=normalize(hypothesis)
    if not ref:return None
    if not hyp:return 100.0
    return round(jiwer.wer(ref,hyp)*100,2)

def align(reference,transcript):
    ref=normalize(reference);hyp=normalize(transcript)
    if not ref:return dict(EMPTY_ALIGNMENT,annotations=[])
    if not hyp:
        # Tanpa ucapan: semua kata referensi terlewat (jiwer menolak hipotesis kosong).
        words=ref.split()
        return {'wer':100.0,'accuracy':0.0,'substitutions':0,'deletions':len(words),'insertions':0,'correct_words':0,
                'annotations':[{'index':i,'word':w,'type':'delete','spoken':''} for i,w in enumerate(words)]}
    a=jiwer.process_words(ref,hyp)
    reference_words=ref.split();hyp_words=hyp.split();annotations=[]
    for chunk in a.alignments[0]:
        for i in range(chunk.ref_start_idx,chunk.ref_end_idx):
            annotations.append({'index':i,'word':reference_words[i],'type':chunk.type,'spoken':' '.join(hyp_words[chunk.hyp_start_idx:chunk.hyp_end_idx]) if chunk.type!='equal' else reference_words[i]})
        if chunk.type=='insert':annotations.append({'index':chunk.ref_start_idx,'word':' '.join(hyp_words[chunk.hyp_start_idx:chunk.hyp_end_idx]),'type':'insert','spoken':' '.join(hyp_words[chunk.hyp_start_idx:chunk.hyp_end_idx])})
    return {'wer':round(a.wer*100,2),'accuracy':round(max(0,1-a.wer)*100,2),'substitutions':a.substitutions,'deletions':a.deletions,'insertions':a.insertions,'correct_words':a.hits,'annotations':annotations}

EXPECTED_HZ=8          # laju sampel minimum yang dianggap memadai untuk webcam
DISPERSION_PX=80       # ambang dispersi I-DT (piksel); galat webcam jauh lebih besar dari eye-tracker lab
MIN_FIX_S=0.12         # durasi fiksasi minimum 120 ms, ditegakkan tanpa toleransi (sesuai keterangan di halaman hasil)
MAX_GAP_S=0.5
MIN_GAZE_SAMPLES=20
MIN_GAZE_COVERAGE=30   # persen dari EXPECTED_HZ x durasi; 30% dari 8 Hz setara rerata ~2,4 Hz (lihat gaze_sampling)
MAX_CALIBRATION_ERROR=0.16
MIN_VALIDATION_SAMPLES=15
GAZE_TIME_TOLERANCE_S=0.25  # toleransi pembulatan jam browser saat membandingkan t tatapan dengan durasi sesi
_EPS=1e-6              # toleransi pembulatan floating point (t dibulatkan ke 1 ms oleh frontend)

def calibration_ok(calibration):
    """Kalibrasi layak hanya bila frontend menyatakan `passed` DAN galat median serta jumlah sampel validasi memenuhi batas."""
    c=calibration or {}
    err=c.get('median_error')
    return bool(c.get('passed') is True and _finite(err) and float(err)<=MAX_CALIBRATION_ERROR and (c.get('validation_samples') or 0)>=MIN_VALIDATION_SAMPLES)

def clean_gaze(points,duration=None):
    """Bersihkan titik tatapan: buang nilai non-finite/negatif, urutkan, hapus timestamp duplikat,
    buang titik di luar durasi sesi, lalu hitung statistik interval aktual."""
    received=len(points or [])
    finite=[p for p in points or [] if all(_finite(p.get(k)) for k in ('x','y','t')) and float(p['t'])>=0]
    out_of_order=sum(1 for a,b in zip(finite,finite[1:]) if b['t']<a['t'])
    ordered=sorted(finite,key=lambda p:p['t'])
    unique=[];last=None
    for p in ordered:
        t=round(float(p['t']),3)
        if last is not None and t==last:continue
        unique.append(p);last=t
    limit=float(duration)+GAZE_TIME_TOLERANCE_S if _finite(duration) and float(duration)>0 else None
    valid=[p for p in unique if limit is None or p['t']<=limit]
    ts=np.array([p['t'] for p in valid],dtype=float);iv=np.diff(ts)
    span=float(ts[-1]-ts[0]) if len(ts)>1 else 0.0
    stats={'received':received,'valid':len(valid),'invalid':received-len(finite),'duplicates':len(ordered)-len(unique),
           'out_of_range':len(unique)-len(valid),'out_of_order':out_of_order,
           'interval_median_ms':round(float(np.median(iv))*1000,1) if len(iv) else None,
           'interval_p95_ms':round(float(np.percentile(iv,95))*1000,1) if len(iv) else None,
           'large_gaps':int(np.sum(iv>MAX_GAP_S)) if len(iv) else 0,
           'effective_rate_hz':round((len(ts)-1)/span,1) if span>0 else None,
           'expected_hz':EXPECTED_HZ}
    return valid,stats

def clean_layouts(layouts):
    """Layout terurut waktu; kotak kata harus finite, berukuran positif, dan berindeks unik per layout."""
    out=[];dropped=0
    for l in layouts or []:
        if not (_finite(l.get('width')) and _finite(l.get('height')) and l['width']>0 and l['height']>0):
            dropped+=len(l.get('words') or []);continue
        seen=set();boxes=[]
        for b in l.get('words') or []:
            if not all(_finite(b.get(k)) for k in ('x','y','w','h')) or b['w']<=0 or b['h']<=0 or b.get('i') in seen:
                dropped+=1;continue
            seen.add(b['i']);boxes.append(b)
        if boxes:out.append({**l,'words':boxes})
    out.sort(key=lambda l:l.get('t') or 0)
    return out,dropped

def _spread(w):return (max(p[0] for p in w)-min(p[0] for p in w))+(max(p[1] for p in w)-min(p[1] for p in w))

def _idt(pts):
    """I-DT pada titik (x_px, y_px, t, x_norm, y_norm). Window awal harus >= MIN_FIX_S, dispersi <= DISPERSION_PX,
    dan tidak ada celah antar-sampel > MAX_GAP_S."""
    out=[];i=0;n=len(pts)
    while i<n:
        j=i
        while j+1<n and pts[j][2]-pts[i][2]<MIN_FIX_S and pts[j+1][2]-pts[j][2]<=MAX_GAP_S:j+=1
        window=pts[i:j+1]
        if len(window)<2 or window[-1][2]-window[0][2]<MIN_FIX_S-_EPS or _spread(window)>DISPERSION_PX:
            i+=1;continue
        while j+1<n and pts[j+1][2]-pts[j][2]<=MAX_GAP_S and _spread(pts[i:j+2])<=DISPERSION_PX:j+=1
        window=pts[i:j+1]
        out.append({'x':sum(p[3] for p in window)/len(window),'y':sum(p[4] for p in window)/len(window),'start':window[0][2],'end':window[-1][2],'d':round((window[-1][2]-window[0][2])*1000,1),'n':len(window)})
        i=j+1
    return out

def fixations_idt(points,width,height):
    """Deteksi fiksasi I-DT pada koordinat area teks (dinormalisasi) yang diubah ke piksel dengan satu ukuran area."""
    return _idt([(p['x']*width,p['y']*height,p['t'],p['x'],p['y']) for p in points])

def layout_at(layouts,t):
    """Layout terakhir yang berlaku pada waktu t (layout diurutkan dulu agar urutan input tidak berpengaruh)."""
    ordered=sorted(layouts,key=lambda l:l.get('t') or 0)
    current=ordered[0]
    for l in ordered:
        if (l.get('t') or 0)<=t:current=l
    return current

def assign_word(fix,layout):
    """Petakan fiksasi ke baris terdekat lalu kata terdekat pada baris itu (toleransi galat webcam)."""
    words=[w for w in layout.get('words') or [] if w.get('w',0)>0 and w.get('h',0)>0]
    if not words:return None,None
    lines={}
    for w in words:lines.setdefault(w['line'],[]).append(w)
    centers={k:sum(w['y']+w['h']/2 for w in v)/len(v) for k,v in lines.items()}
    line_h=sum(w['h'] for w in words)/len(words)
    line=min(centers,key=lambda k:abs(centers[k]-fix['y']))
    if abs(centers[line]-fix['y'])>line_h*1.6:return None,None
    row=lines[line];avg_w=sum(w['w'] for w in row)/len(row)
    def dist(w):return 0 if w['x']<=fix['x']<=w['x']+w['w'] else min(abs(fix['x']-w['x']),abs(fix['x']-w['x']-w['w']))
    best=min(row,key=dist)
    if dist(best)>avg_w*1.2:return line,None
    return line,best

def classify_transitions(seq):
    """Klasifikasi perpindahan antar kata berurutan (kata berulang beruntun sudah digabung):
    regresi dalam baris (indeks turun, baris sama), regresi antar baris (ke baris sebelumnya),
    return sweep (ke baris tepat berikutnya), progresi (maju di baris sama atau lompat >1 baris)."""
    within=between=forward=sweeps=0
    for a,b in zip(seq,seq[1:]):
        if b['line']==a['line']:
            if b['word']<a['word']:within+=1
            else:forward+=1
        elif b['line']<a['line']:between+=1
        elif b['line']==a['line']+1:sweeps+=1
        else:forward+=1
    return within,between,forward,sweeps

def _empty_gaze(stats,calibrated,coverage=0.0,rate=0.0):
    return {'gaze_usable':False,'gaze_analyzable':False,'gaze_samples':stats['valid'],'gaze_rate_hz':round(rate,1),'gaze_coverage':round(coverage*100,1),'calibration_valid':calibrated,
            'on_text_percent':None,'fixations':None,'mean_fixation_ms':None,'regressions':None,'gaze':None,'gaze_sampling':stats}

def gaze_metrics(points,duration,calibration,layouts=None):
    calibrated=calibration_ok(calibration)
    valid,stats=clean_gaze(points,duration)
    layouts,dropped_boxes=clean_layouts(layouts)
    stats['layout_boxes_dropped']=dropped_boxes
    duration=float(duration) if _finite(duration) and float(duration)>0 else 0.0
    rate=len(valid)/duration if duration>0 else 0.0
    # Tanpa durasi valid, cakupan tidak dapat dihitung -> 0 (bukan 100% seperti pembagian dengan max(0,1)).
    coverage=min(1.0,len(valid)/max(duration*EXPECTED_HZ,1)) if duration>0 else 0.0
    analyzable=len(valid)>=MIN_GAZE_SAMPLES
    usable=calibrated and analyzable and coverage*100>=MIN_GAZE_COVERAGE
    base=_empty_gaze(stats,calibrated,coverage,rate)
    base.update({'gaze_usable':usable,'gaze_analyzable':analyzable})
    if not analyzable:return base
    inside=[p for p in valid if -0.03<=p['x']<=1.03 and -0.05<=p['y']<=1.05]
    def dims(t):
        if not layouts:return 760,400
        l=layout_at(layouts,t);return l['width'],l['height']
    pts=[]
    for p in inside:
        w,h=dims(p['t']);pts.append((p['x']*w,p['y']*h,p['t'],p['x'],p['y']))
    fix=_idt(pts)
    base['on_text_percent']=round(len(inside)/len(valid)*100,1)
    base['fixations']=len(fix)
    base['mean_fixation_ms']=round(float(np.mean([f['d'] for f in fix])),1) if fix else None
    detail={'fixation_total_ms':round(sum(f['d'] for f in fix),1),'scanpath':[],'line_timeline':[],'words':[],'lines':0}
    if not layouts:
        centers=[(f['x'],f['y']) for f in fix]
        base['regressions']=sum(1 for a,b in zip(centers,centers[1:]) if b[0]<a[0]-0.04 and abs(b[1]-a[1])<0.06)
        detail['scanpath']=[{'x':round(f['x'],4),'y':round(f['y'],4),'d':f['d'],'t':round(f['start'],2)} for f in fix[:800]]
        base['gaze']=detail;return base
    words=layouts[-1]['words'];total_words=len(words)
    dwell={};visits={};seq=[];unmapped=0
    first_visits = {}
    previous_word = None
    for f in fix:
        layout=layout_at(layouts,f['start']);line,word=assign_word(f,layout)
        w,h=layout['width'],layout['height']
        detail['scanpath'].append({'x':round(f['x'],4),'y':round(f['y'],4),'d':f['d'],'t':round(f['start'],2),'line':line,'word':word['i'] if word else None})
        if line is not None:detail['line_timeline'].append({'t':round(f['start'],2),'line':line+1})
        index = word['i'] if word else None
        if index is not None:
            if index not in first_visits:
                first_visits[index] = {'first_fixation_ms': f['d'], 'first_visit_ms': f['d'],
                                       'first_visit_fixations': 1, 'visit_closed': False}
            elif previous_word != index:
                first_visits[index]['visit_closed'] = True
            elif not first_visits[index]['visit_closed']:
                first_visits[index]['first_visit_ms'] += f['d']
                first_visits[index]['first_visit_fixations'] += 1
        previous_word = index
        if word:
            dwell[word['i']]=dwell.get(word['i'],0)+f['d']
            if not seq or seq[-1]['word']!=word['i']:
                visits[word['i']]=visits.get(word['i'],0)+1
                seq.append({'word':word['i'],'line':line,'x':f['x']*w,'y':f['y']*h})
        else:unmapped+=1
    within,between,forward,sweeps=classify_transitions(seq)
    amps=[float(np.hypot(b['x']-a['x'],b['y']-a['y'])) for a,b in zip(seq,seq[1:])]
    transitions=max(len(seq)-1,1)
    fixated=len(dwell);skipped=max(total_words-fixated,0)
    by_index={w['i']:w for w in words}
    detail.update({
        'lines':len({w['line'] for w in words}),
        'words_total':total_words,'words_fixated':fixated,'fixations_unmapped':unmapped,
        'words_fixated_percent':round(fixated/total_words*100,1) if total_words else None,
        'skipped_words_percent':round(skipped/total_words*100,1) if total_words else None,
        'regressions_within_line':within,'regressions_between_line':between,'progressions':forward,'return_sweeps':sweeps,
        'regression_rate':round((within+between)/transitions*100,1) if len(seq)>1 else None,
        'reading_order_percent':round((forward+sweeps)/transitions*100,1) if len(seq)>1 else None,
        'revisited_words':sum(1 for v in visits.values() if v>1),
        'mean_saccade_px':round(float(np.mean(amps)),1) if amps else None,
        'longest_dwell':[{'index':i,'word':re.sub(r'[^\w-]','',by_index[i]['text']) if i in by_index else '','ms':round(ms,1),'visits':visits.get(i,0)} for i,ms in sorted(dwell.items(),key=lambda kv:-kv[1])[:6]],
        'words':[{'index':i,'ms':round(ms,1),'visits':visits.get(i,0),
                  'first_fixation_ms':first_visits[i]['first_fixation_ms'],
                  'first_visit_ms':round(first_visits[i]['first_visit_ms'],1),
                  'first_visit_fixations':first_visits[i]['first_visit_fixations']}
                 for i,ms in sorted(dwell.items())],
    })
    detail['scanpath']=detail['scanpath'][:800];detail['line_timeline']=detail['line_timeline'][:800]
    base['regressions']=within+between
    base['gaze']=detail
    return base

LOW_ASR_WORD=0.5       # probabilitas kata Whisper di bawah ini dianggap ragu
MIN_ASR_CONFIDENCE=60  # rerata keyakinan (%) minimum agar transkrip dianggap andal tanpa tinjauan
MIN_SPEECH_S=5
MIN_SPEECH_WORDS=3

def asr_confidence(words):
    probs=[w['probability'] for w in words or [] if w.get('probability') is not None]
    if not probs:return None,[]
    return round(float(np.mean(probs))*100,1),[w['word'] for w in words if w.get('probability') is not None and w['probability']<LOW_ASR_WORD]

def display_to_reference(reference):
    """Petakan indeks token tampilan (teks dipecah spasi, sama dengan Reading.jsx) ke indeks kata referensi ternormalisasi."""
    mapping={};k=0
    for i,token in enumerate(reference.split(' ')):
        n=len(normalize(token).split());mapping[i]=list(range(k,k+n));k+=n
    return mapping

def word_observations(reference, transcript, words, gaze_words, duration):
    """Match one timestamped ASR token to one displayed word by sequence alignment."""
    mapping = display_to_reference(reference)
    ref = normalize(reference).split()
    native = [normalize(w['word']) for w in words]
    if not ref or not native or any(len(t.split()) != 1 for t in native):
        return []
    if native != normalize(transcript).split():
        return []
    previous_end = 0
    for w in words:
        start, end = w.get('start'), w.get('end')
        if not (_finite(start) and _finite(end) and previous_end <= start < end <= duration + 0.005):
            return []
        previous_end = end
    alignment = jiwer.process_words(' '.join(ref), ' '.join(native))
    spoken = {}
    for chunk in alignment.alignments[0]:
        if chunk.type == 'equal':
            for i in range(chunk.ref_start_idx, chunk.ref_end_idx):
                spoken[i] = words[chunk.hyp_start_idx + i - chunk.ref_start_idx]
    observations = []
    for gaze in gaze_words:
        indices = mapping.get(gaze['index'], [])
        if len(indices) == 1 and indices[0] in spoken:
            i = indices[0]
            w = spoken[i]
            observations.append({'display_index':gaze['index'], 'word':ref[i],
                                 'first_fixation_ms':gaze['first_fixation_ms'],
                                 'first_visit_ms':gaze['first_visit_ms'],
                                 'first_visit_fixations':gaze['first_visit_fixations'],
                                 'total_fixation_ms':gaze['ms'],
                                 'asr_word_duration_ms':round((w['end']-w['start'])*1000, 1)})
    return observations

WER_MAX=20             # WER (%) di atas ini -> sinyal ketepatan kata rendah
WPM_MIN=60             # kata/menit di bawah ini -> sinyal kelancaran rendah
ON_TEXT_MIN=65         # persen tatapan di area teks
REGRESSION_MAX=40      # persen transisi yang mundur
SKIPPED_MAX=50         # persen kata tak tertatap; ambang tambahan v1 (tidak ada di daftar ambang utama), dipertahankan
CONCORDANCE_MIN=40     # persen kata salah-ucap yang juga sulit menurut tatapan
DWELL_RATIO=1.5        # kata sulit menurut tatapan: dwell >= 1,5 x median ...
REVISIT_MIN=2          # ... atau dikunjungi >= 2 kali

def fuse(reference,m,speech_reliable,excluded_reason='transkrip otomatis belum andal'):
    """Gabungkan bukti per kata: kesalahan ucap (alignment) dan hambatan tatapan (dwell panjang / dikunjungi ulang).
    Data suara hanya dipakai bila `speech_reliable`; pola "kata yang sama" hanya bila concordance >= CONCORDANCE_MIN."""
    g=m.get('gaze') or {}
    speech_available=m.get('accuracy') is not None
    has_speech=speech_available and bool(speech_reliable)
    has_gaze=bool(m.get('gaze_usable') and g.get('words') is not None)
    basis='suara + tatapan' if has_speech and has_gaze else 'suara saja' if has_speech else 'tatapan saja' if has_gaze else 'tidak ada'
    ref_words=normalize(reference).split()
    speech_err={a['index'] for a in m.get('annotations') or [] if a['type'] in ('substitute','delete')} if has_speech else set()
    gaze_hard=set()
    if has_gaze and g['words']:
        dwell=[w['ms'] for w in g['words'] if _finite(w.get('ms'))]
        median=float(np.median(dwell)) if dwell else 0.0
        mapping=display_to_reference(reference)
        for w in g['words']:
            long_dwell=median>0 and _finite(w.get('ms')) and w['ms']>=DWELL_RATIO*median
            if long_dwell or (w.get('visits') or 0)>=REVISIT_MIN:gaze_hard.update(mapping.get(w['index'],[]))
    acoustic_matches = [
        {'index': word['index'], 'word': ref_words[word['index']], 'conf': word['conf']}
        for word in (m.get('pronunciation') or {}).get('words', [])
        if has_speech and word['index'] in gaze_hard and 0 <= word['index'] < len(ref_words)
        and _finite(word.get('conf')) and word['conf'] < 0.6
    ]
    agree=sorted(speech_err&gaze_hard)
    concordance=round(len(agree)/len(speech_err)*100,1) if has_speech and has_gaze and speech_err else None
    concordant=concordance is not None and concordance>=CONCORDANCE_MIN
    wer=m.get('wer') if has_speech else None;wpm=m.get('wpm') if has_speech else None
    inaccurate=wer is not None and wer>WER_MAX
    slow=wpm is not None and wpm<WPM_MIN
    on_text=m.get('on_text_percent');reg=g.get('regression_rate');skip=g.get('skipped_words_percent')
    gaze_reasons=[]
    if has_gaze:
        if on_text is not None and on_text<ON_TEXT_MIN:gaze_reasons.append(f'tatapan di teks {on_text}% < {ON_TEXT_MIN}%')
        if reg is not None and reg>REGRESSION_MAX:gaze_reasons.append(f'regresi {reg}% > {REGRESSION_MAX}%')
        if skip is not None and skip>SKIPPED_MAX:gaze_reasons.append(f'kata tak tertatap {skip}% > {SKIPPED_MAX}%')
    gaze_irregular=bool(gaze_reasons)
    out={'basis':basis,'pronunciation_gaze_words':acoustic_matches,'speech_error_words':len(speech_err),'gaze_difficult_words':len(gaze_hard) if has_gaze else None,
         'agreement_words':[{'index':i,'word':ref_words[i]} for i in agree if i<len(ref_words)][:12],
         'concordance':concordance,'concordant':concordant,'multimodal_complete':has_speech and has_gaze,
         'speech_excluded_reason':excluded_reason if speech_available and not speech_reliable else None,
         'signals':{'word_accuracy_low':inaccurate if has_speech else None,'fluency_low':slow if has_speech else None,
                    'gaze_irregular':gaze_irregular if has_gaze else None,'gaze_reasons':gaze_reasons},
         'pattern':None,'explanation':None}
    if not (has_speech and has_gaze):
        out['explanation']={'suara saja':'Hanya suara yang memenuhi syarat; temuan belum dikonfirmasi oleh tatapan.','tatapan saja':'Hanya tatapan yang memenuhi syarat; ketepatan ucapan tidak dinilai.'}.get(basis,'Belum ada modalitas yang memenuhi syarat.')
        if out['speech_excluded_reason']:out['explanation']+=f" Data suara tidak dipakai karena {out['speech_excluded_reason']}"+('; koreksi transkripsi untuk menyertakannya.' if 'transkrip' in out['speech_excluded_reason'] else '.')
        return out
    if inaccurate and concordant:
        out['pattern']='Kesulitan pengenalan kata (didukung suara dan tatapan)'
        out['explanation']=f'Kata yang salah diucap juga lama ditatap atau dikunjungi ulang (kesesuaian {concordance}% ≥ {CONCORDANCE_MIN}%), sehingga dua sumber data menunjuk ke kesulitan yang sama.'
    elif inaccurate and gaze_irregular:
        out['pattern']='Kesalahan ucap dan alur visual tidak teratur (belum pada kata yang sama)'
        out['explanation']=(f'Ucapan banyak meleset (WER {wer}%) dan pola tatapan tidak teratur ({"; ".join(gaze_reasons)}), '
                            f'tetapi kata yang salah diucap jarang sama dengan kata yang sulit ditatap (kesesuaian {concordance if concordance is not None else 0}% < {CONCORDANCE_MIN}%). Kedua temuan dicatat terpisah.')
    elif inaccurate:
        out['pattern']='Kesalahan ucap tanpa hambatan visual yang jelas'
        out['explanation']=f'Banyak kata meleset (WER {wer}%), tetapi pola tatapan relatif teratur. Kesulitan mungkin terkait pelafalan atau pengenalan bunyi, bukan penguraian visual.'+(f' Kecepatan baca juga rendah ({wpm} kata/menit).' if slow else '')
    elif slow and gaze_irregular:
        out['pattern']='Bacaan lambat dengan alur visual tidak teratur'
        out['explanation']=f'Kata terucap cukup tepat, tetapi kecepatan baca rendah ({wpm} kata/menit) dan pola tatapan tidak teratur ({"; ".join(gaze_reasons)}).'
    elif slow:
        out['pattern']='Bacaan lambat tanpa hambatan visual yang jelas'
        out['explanation']=f'Kata terucap cukup tepat dan tatapan teratur, tetapi kecepatan baca di bawah {WPM_MIN} kata/menit ({wpm}). Fokus pada kelancaran.'
    elif gaze_irregular:
        out['pattern']='Alur visual tidak teratur meski ucapan tepat'
        out['explanation']=f'Ucapan tepat, tetapi pandangan sering keluar dari teks, mundur, atau melewati kata ({"; ".join(gaze_reasons)}). Perhatikan fokus baris.'
    else:
        out['pattern']='Suara dan tatapan sama-sama lancar'
        out['explanation']='Tidak ada hambatan menonjol pada kedua modalitas.'
    return out

def quality_reasons(m,speech,enough,reliable,confidence,speech_error,reviewed):
    reasons=[]
    if speech_error:reasons.append('Suara tidak dianalisis: '+speech_error)
    elif not speech:reasons.append('Tidak ada ucapan yang terdeteksi dalam rekaman.')
    elif not enough:reasons.append(f'Rekaman suara terlalu pendek (minimal {MIN_SPEECH_S} detik dan {MIN_SPEECH_WORDS} kata).')
    elif not reliable and confidence is None:reasons.append('Keyakinan transkripsi tidak tersedia; transkrip perlu ditinjau pendamping sebelum dipakai.')
    elif not reliable:reasons.append(f'Keyakinan transkripsi {confidence}% (di bawah {MIN_ASR_CONFIDENCE}%); transkrip perlu ditinjau pendamping.')
    elif reviewed:reasons.append('Suara memadai (transkrip sudah ditinjau pendamping).')
    else:reasons.append('Suara memadai'+(f' (keyakinan transkripsi {confidence}%).' if confidence is not None else '.'))
    if m['gaze_usable']:reasons.append(f"Tatapan memadai (kalibrasi layak, cakupan {m['gaze_coverage']}%).")
    else:
        why=[]
        if not m['calibration_valid']:why.append('kalibrasi belum layak (perlu galat median ≤16% layar dan ≥15 sampel validasi)')
        if m['gaze_samples']<MIN_GAZE_SAMPLES:why.append(f"sampel tatapan {m['gaze_samples']} < {MIN_GAZE_SAMPLES}")
        elif m['gaze_coverage']<MIN_GAZE_COVERAGE:why.append(f"cakupan {m['gaze_coverage']}% < {MIN_GAZE_COVERAGE}%")
        reasons.append('Tatapan belum memadai: '+'; '.join(why or ['data tidak direkam'])+'.')
    return reasons

def sanitize(obj):
    """Ubah tipe numpy ke tipe Python dan ganti NaN/Infinity dengan None agar tidak tersimpan sebagai hasil valid.
    Mengembalikan (objek_bersih, jumlah_nilai_non_finite)."""
    count=0
    def walk(v):
        nonlocal count
        if isinstance(v,dict):return {k:walk(x) for k,x in v.items()}
        if isinstance(v,(list,tuple)):return [walk(x) for x in v]
        if isinstance(v,np.generic):v=v.item()
        if isinstance(v,float) and not np.isfinite(v):
            count+=1;return None
        return v
    return walk(obj),count

def speech_metrics(reference,transcript,duration,words,reviewed=False,asr_transcript=None):
    """Metrik suara. WER/accuracy lama dipertahankan untuk kompatibilitas API; sumbernya dinyatakan di `wer_source`.
    - Sebelum koreksi: WER = referensi vs transkrip otomatis (gabungan galat ASR + galat membaca).
    - Setelah koreksi: `reading_error_rate` = referensi vs transkrip manual; `asr_wer` = transkrip manual vs otomatis."""
    speech=bool(normalize(transcript))
    m=align(reference,transcript) if speech else dict(EMPTY_ALIGNMENT,annotations=[])
    duration=float(duration) if _finite(duration) and float(duration)>0 else None
    words,dropped=clean_words(words)
    n_words=len(normalize(transcript).split())
    m['wpm']=round(n_words/duration*60,1) if speech and duration else None
    pauses=[round(b['start']-a['end'],2) for a,b in zip(words,words[1:]) if b['start']-a['end']>=0.5]
    m['pauses']=len(pauses) if words else None;m['pause_seconds']=round(sum(pauses),2) if words else None
    m['asr_words_dropped']=dropped
    m['wer_source']='transkrip_manual' if reviewed else 'transkrip_otomatis' if speech else None
    m['reading_error_rate']=m['wer'] if reviewed else None
    m['asr_wer']=word_error_rate(transcript,asr_transcript) if reviewed and asr_transcript is not None and speech else None
    confidence,uncertain=(None,[]) if reviewed else asr_confidence(words)
    enough=bool(speech and duration and duration>=MIN_SPEECH_S and n_words>=MIN_SPEECH_WORDS)
    # Keyakinan tidak diketahui (tanpa probabilitas kata) diperlakukan belum andal sampai ditinjau pendamping.
    reliable=enough and (reviewed or (confidence is not None and confidence>=MIN_ASR_CONFIDENCE))
    m.update({'asr_confidence':confidence,'asr_uncertain_words':uncertain[:10],'speech_reliable':reliable})
    return m,speech,enough,reliable,confidence,uncertain

def analyze(reference,transcript,duration,points,calibration,words,layouts=None,pronunciation=None,speech_error=None,reviewed=False,asr_transcript=None,gaze_duration=None):
    m,speech,enough,reliable,confidence,uncertain=speech_metrics(reference,transcript,duration,words,reviewed,asr_transcript)
    warnings=[]
    try:m.update(gaze_metrics(points,gaze_duration if gaze_duration is not None else duration,calibration,layouts))
    except Exception:
        # Kegagalan analisis tatapan tidak boleh menggugurkan hasil suara.
        import logging;logging.exception('Gaze analysis failed')
        m.update(_empty_gaze({'received':len(points or []),'valid':0},calibration_ok(calibration)))
        warnings.append('Analisis tatapan gagal; hasil hanya berdasarkan suara.')
    m['pronunciation']=pronunciation
    m['word_observations'] = []
    if reliable and not reviewed and m['gaze_usable'] and (m.get('gaze') or {}).get('words'):
        m['word_observations'] = word_observations(reference, transcript, words, m['gaze']['words'], duration)
    m['speech_error']=speech_error
    # Kualitas hanya menghitung modalitas yang lolos quality gate masing-masing.
    passed=[name for name,ok in (('suara',reliable),('tatapan',m['gaze_usable'])) if ok]
    quality='layak' if len(passed)==2 else 'parsial' if passed else 'tidak_cukup'
    m['modalities_passed']=passed
    excluded=f'rekaman suara terlalu pendek (minimal {MIN_SPEECH_S} detik dan {MIN_SPEECH_WORDS} kata)' if not enough else 'keyakinan transkripsi tidak tersedia' if confidence is None and not reviewed else 'transkrip otomatis belum andal'
    m['multimodal']=fuse(reference,m,reliable,excluded)
    on_text=m.get('on_text_percent');reg=(m['gaze'] or {}).get('regression_rate')
    recommendations=[]
    if quality=='tidak_cukup':
        profile='Data belum cukup'
        profile_reason='Tidak ada modalitas yang lolos syarat kualitas (suara andal atau tatapan layak).'
        recommendations.append('Koreksi transkripsi agar data suara dapat dipakai, atau ulangi sesi di tempat tenang dengan suara jelas dan pencahayaan merata.' if enough and not reliable else 'Ulangi sesi di tempat tenang dengan suara jelas dan pencahayaan merata.')
    elif reliable and m['wer'] is not None and m['wer']>WER_MAX:
        profile='Latihan ketepatan kata';profile_reason=f"WER {m['wer']}% > {WER_MAX}% ({'transkrip ditinjau' if reviewed else 'transkrip otomatis andal'})."
        recommendations.append('Dengarkan dan ulangi kata yang ditandai, lalu baca kembali kalimatnya.')
    elif reliable and m['wpm'] is not None and m['wpm']<WPM_MIN:
        profile='Latihan kelancaran';profile_reason=f"Kecepatan {m['wpm']} kata/menit < {WPM_MIN}."
        recommendations.append('Baca ulang teks pendek dengan nyaman. Pendamping dapat memberi contoh ritme membaca.')
    elif m['gaze_usable'] and on_text is not None and on_text<ON_TEXT_MIN:
        profile='Latihan fokus baris';profile_reason=f'Tatapan di area teks {on_text}% < {ON_TEXT_MIN}%.'
        recommendations.append('Gunakan panduan baris dan perbesar teks agar pandangan lebih mudah mengikuti bacaan.')
    elif m['gaze_usable'] and reg is not None and reg>REGRESSION_MAX:
        profile='Latihan fokus baris';profile_reason=f'Regresi tatapan {reg}% > {REGRESSION_MAX}%.'
        recommendations.append('Pandangan sering kembali ke kata sebelumnya. Latih membaca dengan penunjuk jari atau panduan kata.')
    else:
        profile='Lanjutkan eksplorasi'
        profile_reason='Tidak ada metrik dari modalitas yang lolos syarat yang melewati ambang latihan.'+(' Data suara tidak dipakai karena transkrip belum andal.' if enough and not reliable else '')
        recommendations.append('Lanjutkan latihan dengan materi yang sesuai dan diskusikan pengamatan bersama pendamping.')
    g=m['gaze'] or {};fused=m['multimodal']
    if fused['agreement_words']:recommendations.append('Kata yang sulit menurut suara dan tatapan sekaligus: '+', '.join(w['word'] for w in fused['agreement_words'][:5])+'. Prioritaskan kata ini saat latihan.')
    if enough and not reliable:recommendations.append('Transkrip otomatis kurang yakin'+(' pada kata: '+', '.join(uncertain[:4]) if uncertain else '')+'. Pendamping sebaiknya mendengar ulang dan mengoreksi transkripsi.')
    if speech_error:recommendations.append('Suara gagal dianalisis sehingga hasil hanya berdasarkan tatapan. Periksa mikrofon lalu ulangi sesi bila perlu penilaian ucapan.')
    if m['gaze_usable'] and g.get('skipped_words_percent') is not None and g['skipped_words_percent']>SKIPPED_MAX:recommendations.append('Banyak kata tidak tertatap. Perbesar ukuran teks dan baca lebih pelan, satu baris dalam satu waktu.')
    if m['gaze_usable'] and g.get('longest_dwell') and not fused['agreement_words']:recommendations.append('Kata yang paling lama ditatap: '+', '.join(w['word'] for w in g['longest_dwell'][:3])+'. Latih kata-kata ini di fitur Pelafalan.')
    if pronunciation and pronunciation.get('weak_words'):recommendations.append('Pelafalan kata berikut terdengar kurang jelas: '+', '.join(w['word'] for w in pronunciation['weak_words'][:4])+'.')
    if not m['gaze_usable'] and m.get('gaze_analyzable'):recommendations.append('Tatapan terekam tetapi kalibrasi/cakupan belum memadai; pola visual hanya sebagai gambaran awal.')
    elif not m['gaze_usable']:recommendations.append('Data tatapan belum layak; kalibrasi ulang sebelum meninjau pola visual.')
    result={'metrics':m,'profile':profile,'profile_reason':profile_reason,'quality':quality,'quality_reasons':quality_reasons(m,speech,enough,reliable,confidence,speech_error,reviewed),'recommendations':recommendations,'profile_method':'Aturan observasional v1 — bukan model diagnosis','confidence':None,'limitations':['Akurasi kata berasal dari transkripsi, bukan penilaian fonem.','Keyakinan transkripsi adalah rerata keyakinan kata dari model transkripsi, bukan ukuran ketepatan bacaan.','Kepercayaan pelafalan per kata berasal dari model Vosk anak (bookbot) dan bukan penilaian klinis.','Batas 20% WER / 60 kata per menit merupakan aturan latihan awal, bukan norma usia tervalidasi.','Fiksasi webcam dideteksi dengan I-DT sederhana; ketelitian jauh di bawah eye-tracker laboratorium.','Fusi suara + tatapan memakai aturan (kata sulit = dwell ≥1,5× median atau dikunjungi ulang) dan belum divalidasi terhadap penilaian ahli.','Sebelum koreksi pendamping, WER mencampur galat transkripsi otomatis dan galat membaca; reading_error_rate dan asr_wer hanya tersedia setelah transkrip ditinjau.','Data suara yang belum andal tidak dipakai untuk fusi dan profil latihan.']}
    result,bad=sanitize(result)
    if bad:warnings.append(f'{bad} nilai metrik tidak valid (NaN/Infinity) diganti kosong.')
    result['analysis_warnings']=warnings
    return result
