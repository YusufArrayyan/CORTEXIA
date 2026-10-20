import re, threading
from pathlib import Path
import numpy as np
import jiwer
from faster_whisper import WhisperModel
from core import ROOT

_model=None
_lock=threading.Lock()
MODEL_DIR=ROOT/'models'/'whisper'
def asr_ready():return any(MODEL_DIR.glob('**/model.bin'))
def transcribe(path):
    global _model
    with _lock:
        if _model is None:
            if not asr_ready(): raise RuntimeError('Model suara lokal belum tersedia.')
            _model=WhisperModel('base',device='cpu',compute_type='int8',download_root=str(MODEL_DIR),local_files_only=True,cpu_threads=2,num_workers=1)
        # Decode sendiri ke PCM 16 kHz agar tidak bergantung pada API PyAV yang dipakai faster-whisper.
        from pronunciation import decode_pcm
        audio=np.frombuffer(decode_pcm(path),dtype=np.int16).astype(np.float32)/32768.0
        segments,info=_model.transcribe(audio,language='id',beam_size=5,word_timestamps=True,vad_filter=True,condition_on_previous_text=False)
        words=[];texts=[]
        for seg in segments:
            if seg.no_speech_prob>0.7:continue
            texts.append(seg.text.strip())
            for w in seg.words or []:words.append({'word':w.word.strip(),'start':round(w.start,3),'end':round(w.end,3),'probability':round(w.probability,3)})
        return {'transcript':' '.join(texts),'words':words,'audio_duration':round(info.duration,2),'language':'id','model':'faster-whisper/base-int8'}

def normalize(text):return ' '.join(re.findall(r"[^\W_]+(?:-[^\W_]+)*",text.lower(),re.UNICODE))

def align(reference,transcript):
    ref=normalize(reference);hyp=normalize(transcript)
    if not ref:return {}
    a=jiwer.process_words(ref,hyp)
    reference_words=ref.split();hyp_words=hyp.split();annotations=[]
    for chunk in a.alignments[0]:
        for i in range(chunk.ref_start_idx,chunk.ref_end_idx):
            annotations.append({'index':i,'word':reference_words[i],'type':chunk.type,'spoken':' '.join(hyp_words[chunk.hyp_start_idx:chunk.hyp_end_idx]) if chunk.type!='equal' else reference_words[i]})
        if chunk.type=='insert':annotations.append({'index':chunk.ref_start_idx,'word':' '.join(hyp_words[chunk.hyp_start_idx:chunk.hyp_end_idx]),'type':'insert','spoken':' '.join(hyp_words[chunk.hyp_start_idx:chunk.hyp_end_idx])})
    return {'wer':round(a.wer*100,2),'accuracy':round(max(0,1-a.wer)*100,2),'substitutions':a.substitutions,'deletions':a.deletions,'insertions':a.insertions,'correct_words':a.hits,'annotations':annotations}

EXPECTED_HZ=8          # laju sampel minimum yang dianggap memadai untuk webcam
DISPERSION_PX=80       # ambang dispersi I-DT (piksel); galat webcam jauh lebih besar dari eye-tracker lab
MIN_FIX_S=0.12
MAX_GAP_S=0.5

def calibration_ok(calibration):
    return bool(calibration and calibration.get('median_error') is not None and calibration.get('median_error')<=0.16 and calibration.get('validation_samples',0)>=15)

def _spread(w):return (max(p[0] for p in w)-min(p[0] for p in w))+(max(p[1] for p in w)-min(p[1] for p in w))

def fixations_idt(points,width,height):
    """Deteksi fiksasi I-DT pada koordinat area teks (dinormalisasi) yang diubah ke piksel."""
    pts=[(p['x']*width,p['y']*height,p['t']) for p in points]
    out=[];i=0
    while i<len(pts):
        j=i
        while j+1<len(pts) and pts[j][2]-pts[i][2]<MIN_FIX_S and pts[j+1][2]-pts[j][2]<=MAX_GAP_S:j+=1
        window=pts[i:j+1]
        if len(window)<2 or window[-1][2]-window[0][2]<MIN_FIX_S*0.6 or _spread(window)>DISPERSION_PX:
            i+=1;continue
        while j+1<len(pts) and pts[j+1][2]-pts[j][2]<=MAX_GAP_S and _spread(pts[i:j+2])<=DISPERSION_PX:j+=1
        window=pts[i:j+1]
        out.append({'x':sum(p[0] for p in window)/len(window)/width,'y':sum(p[1] for p in window)/len(window)/height,'start':window[0][2],'end':window[-1][2],'d':round((window[-1][2]-window[0][2])*1000,1),'n':len(window)})
        i=j+1
    return out

def layout_at(layouts,t):
    current=layouts[0]
    for l in layouts:
        if l.get('t',0)<=t:current=l
    return current

def assign_word(fix,layout):
    """Petakan fiksasi ke baris terdekat lalu kata terdekat pada baris itu (toleransi galat webcam)."""
    words=layout.get('words') or []
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

def gaze_metrics(points,duration,calibration,layouts=None):
    calibrated=calibration_ok(calibration)
    valid=[p for p in points if all(np.isfinite(p.get(k,np.nan)) for k in ['x','y','t'])]
    valid.sort(key=lambda p:p['t'])
    inside=[p for p in valid if -0.03<=p['x']<=1.03 and -0.05<=p['y']<=1.05]
    rate=len(valid)/duration if duration>0 else 0
    coverage=min(1,len(valid)/max(duration*EXPECTED_HZ,1))
    usable=calibrated and len(valid)>=20 and coverage>=0.3
    analyzable=len(valid)>=20
    base={'gaze_usable':usable,'gaze_analyzable':analyzable,'gaze_samples':len(valid),'gaze_rate_hz':round(rate,1),'gaze_coverage':round(coverage*100,1),'calibration_valid':calibrated,
          'on_text_percent':None,'fixations':None,'mean_fixation_ms':None,'regressions':None,'gaze':None}
    if not analyzable:return base
    layouts=[l for l in (layouts or []) if l.get('words')]
    width=(layouts[0].get('width') if layouts else None) or 760;height=(layouts[0].get('height') if layouts else None) or 400
    fix=fixations_idt(inside,width,height)
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
    dwell={};visits={};seq=[]
    for f in fix:
        layout=layout_at(layouts,f['start']);line,word=assign_word(f,layout)
        detail['scanpath'].append({'x':round(f['x'],4),'y':round(f['y'],4),'d':f['d'],'t':round(f['start'],2),'line':line,'word':word['i'] if word else None})
        if line is not None:detail['line_timeline'].append({'t':round(f['start'],2),'line':line+1})
        if word:
            dwell[word['i']]=dwell.get(word['i'],0)+f['d']
            if not seq or seq[-1]['word']!=word['i']:
                visits[word['i']]=visits.get(word['i'],0)+1
                seq.append({'word':word['i'],'line':line,'x':f['x'],'y':f['y']})
    within=between=forward=sweeps=0;amps=[]
    for a,b in zip(seq,seq[1:]):
        amps.append(float(np.hypot((b['x']-a['x'])*width,(b['y']-a['y'])*height)))
        if b['line']==a['line']:
            if b['word']<a['word']:within+=1
            else:forward+=1
        elif b['line']<a['line']:between+=1
        elif b['line']==a['line']+1:sweeps+=1
        else:forward+=1
    transitions=max(len(seq)-1,1)
    fixated=len(dwell);skipped=max(total_words-fixated,0)
    by_index={w['i']:w for w in words}
    detail.update({
        'lines':len({w['line'] for w in words}),
        'words_total':total_words,'words_fixated':fixated,
        'words_fixated_percent':round(fixated/total_words*100,1) if total_words else None,
        'skipped_words_percent':round(skipped/total_words*100,1) if total_words else None,
        'regressions_within_line':within,'regressions_between_line':between,'progressions':forward,'return_sweeps':sweeps,
        'regression_rate':round((within+between)/transitions*100,1) if len(seq)>1 else None,
        'reading_order_percent':round((forward+sweeps)/transitions*100,1) if len(seq)>1 else None,
        'revisited_words':sum(1 for v in visits.values() if v>1),
        'mean_saccade_px':round(float(np.mean(amps)),1) if amps else None,
        'longest_dwell':[{'index':i,'word':re.sub(r'[^\w-]','',by_index[i]['text']) if i in by_index else '','ms':round(ms,1),'visits':visits.get(i,0)} for i,ms in sorted(dwell.items(),key=lambda kv:-kv[1])[:6]],
        'words':[{'index':i,'ms':round(ms,1),'visits':visits.get(i,0)} for i,ms in sorted(dwell.items())],
    })
    detail['scanpath']=detail['scanpath'][:800];detail['line_timeline']=detail['line_timeline'][:800]
    base['regressions']=within+between
    base['gaze']=detail
    return base

def analyze(reference,transcript,duration,points,calibration,words,layouts=None,pronunciation=None):
    speech=bool(normalize(transcript));m=align(reference,transcript) if speech else {'accuracy':None,'wer':None,'annotations':[],'correct_words':0}
    m.update(gaze_metrics(points,duration,calibration,layouts))
    m['pronunciation']=pronunciation
    m['wpm']=round(len(normalize(transcript).split())/duration*60,1) if speech and duration>0 else None
    pauses=[round(b['start']-a['end'],2) for a,b in zip(words,words[1:]) if b['start']-a['end']>=0.5]
    m['pauses']=len(pauses) if words else None;m['pause_seconds']=round(sum(pauses),2) if words else None
    enough=speech and duration>=5 and len(normalize(transcript).split())>=3
    quality='layak' if enough and m['gaze_usable'] else 'parsial' if enough or m['gaze_usable'] else 'tidak_cukup'
    recommendations=[];profile='Lanjutkan eksplorasi'
    if quality=='tidak_cukup':profile='Data belum cukup';recommendations.append('Ulangi sesi di tempat tenang dengan suara jelas dan pencahayaan merata.')
    elif enough and m['wer']>20:profile='Latihan ketepatan kata';recommendations.append('Dengarkan dan ulangi kata yang ditandai, lalu baca kembali kalimatnya.')
    elif enough and m['wpm']<60:profile='Latihan kelancaran';recommendations.append('Baca ulang teks pendek dengan nyaman. Pendamping dapat memberi contoh ritme membaca.')
    elif m['gaze_usable'] and m['on_text_percent']<65:profile='Latihan fokus baris';recommendations.append('Gunakan panduan baris dan perbesar teks agar pandangan lebih mudah mengikuti bacaan.')
    elif m['gaze_usable'] and (m['gaze'] or {}).get('regression_rate') is not None and m['gaze']['regression_rate']>40:profile='Latihan fokus baris';recommendations.append('Pandangan sering kembali ke kata sebelumnya. Latih membaca dengan penunjuk jari atau panduan kata.')
    else:profile='Lanjutkan eksplorasi';recommendations.append('Lanjutkan latihan dengan materi yang sesuai dan diskusikan pengamatan bersama pendamping.')
    g=m['gaze'] or {}
    if m['gaze_usable'] and g.get('skipped_words_percent') is not None and g['skipped_words_percent']>50:recommendations.append('Banyak kata tidak tertatap. Perbesar ukuran teks dan baca lebih pelan, satu baris dalam satu waktu.')
    if m['gaze_usable'] and g.get('longest_dwell'):recommendations.append('Kata yang paling lama ditatap: '+', '.join(w['word'] for w in g['longest_dwell'][:3])+'. Latih kata-kata ini di fitur Pelafalan.')
    if pronunciation and pronunciation.get('weak_words'):recommendations.append('Pelafalan kata berikut terdengar kurang jelas: '+', '.join(w['word'] for w in pronunciation['weak_words'][:4])+'.')
    if not m['gaze_usable'] and m.get('gaze_analyzable'):recommendations.append('Tatapan terekam tetapi kalibrasi/cakupan belum memadai; pola visual hanya sebagai gambaran awal.')
    elif not m['gaze_usable']:recommendations.append('Data tatapan belum layak; kalibrasi ulang sebelum meninjau pola visual.')
    return {'metrics':m,'profile':profile,'quality':quality,'recommendations':recommendations,'profile_method':'Aturan observasional v1 — bukan model diagnosis','confidence':None,'limitations':['Akurasi kata berasal dari transkripsi, bukan penilaian fonem.','Kepercayaan pelafalan per kata berasal dari model Vosk anak (bookbot) dan bukan penilaian klinis.','Batas 20% WER / 60 kata per menit merupakan aturan latihan awal, bukan norma usia tervalidasi.','Fiksasi webcam dideteksi dengan I-DT sederhana; ketelitian jauh di bawah eye-tracker laboratorium.','Model ETDD70 tidak diterapkan pada sesi webcam berbahasa Indonesia.']}