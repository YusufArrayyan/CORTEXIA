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
        segments,info=_model.transcribe(path,language='id',beam_size=5,word_timestamps=True,vad_filter=True,condition_on_previous_text=False)
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

def gaze_metrics(points,duration,calibration):
    calibrated=bool(calibration and calibration.get('median_error') is not None and calibration.get('median_error')<=0.16 and calibration.get('validation_samples',0)>=15)
    valid=[p for p in points if all(np.isfinite(p.get(k,np.nan)) for k in ['x','y','t'])]
    inside=[p for p in valid if 0<=p['x']<=1 and 0<=p['y']<=1]
    coverage=min(1,len(valid)/max(duration*5,1))
    usable=calibrated and len(valid)>=20 and coverage>=0.3
    fix=[];group=[]
    for p in inside:
        if group and (abs(p['x']-group[0]['x'])>0.05 or abs(p['y']-group[0]['y'])>0.05 or p['t']-group[-1]['t']>0.6):
            if group[-1]['t']-group[0]['t']>=0.12:fix.append(group)
            group=[]
        group.append(p)
    if group and group[-1]['t']-group[0]['t']>=0.12:fix.append(group)
    centers=[(float(np.mean([p['x'] for p in g])),float(np.mean([p['y'] for p in g]))) for g in fix]
    regress=sum(1 for a,b in zip(centers,centers[1:]) if b[0]<a[0]-0.04 and abs(b[1]-a[1])<0.06)
    return {'gaze_usable':usable,'gaze_samples':len(valid),'gaze_coverage':round(coverage*100,1),'on_text_percent':round(len(inside)/len(valid)*100,1) if usable else None,'fixations':len(fix) if usable else None,'mean_fixation_ms':round(float(np.mean([(g[-1]['t']-g[0]['t'])*1000 for g in fix])),1) if usable and fix else None,'regressions':regress if usable else None,'calibration_valid':calibrated}

def analyze(reference,transcript,duration,points,calibration,words):
    speech=bool(normalize(transcript));m=align(reference,transcript) if speech else {'accuracy':None,'wer':None,'annotations':[],'correct_words':0}
    m.update(gaze_metrics(points,duration,calibration))
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
    else:profile='Lanjutkan eksplorasi';recommendations.append('Lanjutkan latihan dengan materi yang sesuai dan diskusikan pengamatan bersama pendamping.')
    if not m['gaze_usable']:recommendations.append('Data tatapan belum layak; kalibrasi ulang sebelum meninjau pola visual.')
    return {'metrics':m,'profile':profile,'quality':quality,'recommendations':recommendations,'profile_method':'Aturan observasional v1 — bukan model diagnosis','confidence':None,'limitations':['Akurasi kata berasal dari transkripsi, bukan penilaian fonem.','Batas 20% WER / 60 kata per menit merupakan aturan latihan awal, bukan norma usia tervalidasi.','Model ETDD70 tidak diterapkan pada sesi webcam berbahasa Indonesia.']}