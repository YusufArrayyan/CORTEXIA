import json, os, tempfile, io
from datetime import datetime,timezone,timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError
from core import db,uid,now,current_user,audit,Document
import fluency
from analytics import transcribe_pcm,clean_words,analyze,align,normalize,asr_ready

router=APIRouter(tags=['sessions'])
@router.get('/speech/synthesize')
async def synthesize(text:str):
    from fastapi.responses import Response
    import tts
    if not text.strip() or len(text)>200:raise HTTPException(422,'Teks suara harus 1–200 karakter.')
    try:
        audio=await run_in_threadpool(tts.synthesize,text.strip())
        return Response(audio,media_type='audio/wav',headers={'Cache-Control':'private, max-age=3600','X-TTS-Engine':tts.engine() or 'none'})
    except Exception:
        import logging;logging.exception('Local TTS failed')
        raise HTTPException(503,'Contoh suara lokal belum tersedia.')
class GazePoint(BaseModel):
    x:float=Field(ge=-10,le=10,allow_inf_nan=False)
    y:float=Field(ge=-10,le=10,allow_inf_nan=False)
    t:float=Field(ge=0,le=900,allow_inf_nan=False)
class CalibrationInput(BaseModel):
    median_error:float|None=Field(default=None,ge=0,le=10,allow_inf_nan=False)
    validation_samples:int=Field(default=0,ge=0,le=100000)
    passed:bool=False
class WordBox(BaseModel):
    i:int=Field(ge=0,le=5000)
    text:str=Field(default='',max_length=100)
    x:float=Field(ge=-10,le=10,allow_inf_nan=False)
    y:float=Field(ge=-10,le=10,allow_inf_nan=False)
    w:float=Field(ge=0,le=10,allow_inf_nan=False)
    h:float=Field(ge=0,le=10,allow_inf_nan=False)
    line:int=Field(ge=0,le=1000)
class Layout(BaseModel):
    t:float=Field(default=0,ge=0,le=900,allow_inf_nan=False)
    width:float=Field(gt=0,le=20000,allow_inf_nan=False)
    height:float=Field(gt=0,le=20000,allow_inf_nan=False)
    words:list[WordBox]=Field(default_factory=list,max_length=3000)
class SessionInput(BaseModel):
    student_id:str
    text_id:str
    consent:bool
    mode:str='multimodal'
    duration:float=Field(gt=0,le=900,allow_inf_nan=False)
    gaze_points:list[GazePoint]=Field(default_factory=list,max_length=20000)
    layouts:list[Layout]=Field(default_factory=list,max_length=40)
    calibration:CalibrationInput=Field(default_factory=CalibrationInput)
    # Opsional: kunci idempotensi dari klien agar retry setelah respons hilang tidak membuat sesi ganda.
    client_request_id:str|None=Field(default=None,min_length=8,max_length=100,pattern=r'^[A-Za-z0-9_-]+$')
class Correction(BaseModel):
    transcript:str=Field(min_length=1,max_length=10000)
    note:str=Field(default='',max_length=2000)

def reading_audio(path, reference):
    import logging
    import pronunciation as pr
    from analytics import validate_pcm

    pcm = pr.decode_pcm(path)
    validate_pcm(pcm, pr.RATE)
    duration = len(pcm) / (2 * pr.RATE)
    if duration > 900:
        raise HTTPException(422, 'Durasi audio maksimal 15 menit.')
    result = None
    if asr_ready():
        try:
            result = transcribe_pcm(pcm)
        except Exception:
            logging.exception('Transkripsi Whisper gagal, memakai Vosk-ID lokal.')

    if result is None:
        try:
            words = pr.recognize(pcm) if pr.vosk_ready() else []
        except Exception:
            logging.exception('Vosk transcription failed')
            words = []
        result = {'transcript': ' '.join(w['word'] for w in words),
                  'words': [{**w, 'probability': w['conf']} for w in words],
                  'audio_duration': round(duration, 2), 'language': 'id', 'model': pr.MODEL_NAME}
        if not words:
            result.update(error='Transkripsi suara tidak tersedia.', model=None)
        if reference and words:
            result['pronunciation'] = pr.align_confidence(words, reference)
    elif result['audio_duration'] > 900:
        raise HTTPException(422, 'Durasi audio maksimal 15 menit.')
    elif reference:
        if pr.vosk_ready():
            try:
                result['pronunciation'] = pr.align_confidence(pr.recognize(pcm), reference)
            except Exception:
                logging.exception('Vosk word confidence failed')
                result['pronunciation_error'] = 'Kejelasan pelafalan gagal dihitung.'
        else:
            result['pronunciation_error'] = 'Model pelafalan Vosk-ID belum tersedia.'
    try:
        result['fluency'] = fluency.measure(pcm, result['transcript'], result['words'])
    except Exception:
        logging.exception('Fluency analysis failed')
        result['fluency'] = fluency.unavailable('FLUENCY_ANALYSIS_FAILED')
    result['words'], _ = clean_words(result['words'])
    return result


async def audio_result(audio,reference=None):
    if not audio or not audio.filename:return {'transcript':'','words':[]}
    data=await audio.read(25*1024*1024+1)
    if len(data)>25*1024*1024:raise HTTPException(413,'Audio maksimal 25 MB.')
    if len(data)<100:raise HTTPException(422,'Rekaman audio kosong atau terlalu pendek.')
    name=None
    try:
        with tempfile.NamedTemporaryFile(delete=False,suffix='.audio') as f:f.write(data);name=f.name
        return await run_in_threadpool(reading_audio, name, reference)
    except HTTPException:raise
    except Exception as e:
        import logging;logging.exception('Local transcription failed (%d bytes, %s)',len(data),audio.content_type)
        raise HTTPException(422,'Audio tidak dapat dianalisis. Periksa mikrofon atau format audio, lalu ulangi.') from e
    finally:
        if name and os.path.exists(name):os.unlink(name)

async def session_speech(audio,reference):
    """Sesi tetap tersimpan walau suara gagal dianalisis, agar hasil tatapan tetap muncul di halaman hasil."""
    try:return await audio_result(audio,reference)
    except HTTPException as e:
        if e.status_code==413:raise
        return {'transcript':'','words':[],'error':e.detail}

@router.post('/sessions',response_model=Document)
async def create_session(payload:str=Form(...),audio:UploadFile|None=File(None),user=Depends(current_user)):
    try:data=SessionInput.model_validate_json(payload)
    except Exception:raise HTTPException(422,'Data sesi tidak valid.')
    if not data.consent:raise HTTPException(400,'Persetujuan pendamping wajib diberikan sebelum perekaman.')
    if data.mode not in ['gaze','multimodal','speech']:raise HTTPException(422,'Modalitas tidak valid.')
    student=await db.students.find_one({'id':data.student_id,'owner_id':user['id']},{'_id':0})
    text=await db.texts.find_one({'id':data.text_id,'owner_id':{'$in':['shared',user['id']]}},{'_id':0})
    if not student or not text:raise HTTPException(404,'Siswa atau materi tidak ditemukan.')
    if data.client_request_id:
        existing=await db.sessions.find_one({'owner_id':user['id'],'client_request_id':data.client_request_id},{'_id':0})
        if existing:return existing
    speech=await session_speech(audio,text['content']) if audio and audio.filename else {'transcript':'','words':[]}
    duration=speech.get('audio_duration',data.duration)
    points=[p.model_dump() for p in data.gaze_points]
    layouts=[l.model_dump() for l in data.layouts]
    calibration=data.calibration.model_dump()
    from analytics import sanitize
    speech['words'],_=sanitize(speech.get('words') or [])
    result=analyze(text['content'],speech['transcript'],duration,points,calibration,speech['words'],layouts,speech.get('pronunciation'),speech_error=speech.get('error'),gaze_duration=data.duration)
    measured = speech.get('fluency')
    if measured is None:
        measured = fluency.unavailable('AUDIO_UNAVAILABLE' if audio and audio.filename else 'NO_AUDIO')
    if result['metrics'].get('wer') is not None and result['metrics']['wer'] >= 50:
        measured['qc_flags'].append('REFERENCE_WER_GE_50PCT')
    result['metrics']['fluency'] = measured
    if speech.get('pronunciation_error'):result['analysis_warnings']=[*result.get('analysis_warnings',[]),speech['pronunciation_error']]
    doc={'id':uid(),'owner_id':user['id'],'student_id':student['id'],'student_alias':student['alias'],'text_id':text['id'],'text_title':text['title'],'reference':text['content'],'duration':duration,'client_duration':data.duration,'mode':data.mode,'transcript':speech['transcript'],'asr_transcript':speech['transcript'] if speech.get('model') else None,'words':speech['words'],'speech_model':speech.get('model'),'speech_error':speech.get('error'),'gaze_points':points,'layouts':layouts,'calibration':calibration,**result,'client_request_id':data.client_request_id,'created_at':now(),'consent_at':now(),'retention_days':30,'expires_at':datetime.now(timezone.utc)+timedelta(days=30),'reviews':[]}
    await db.sessions.create_index('expires_at',expireAfterSeconds=0)
    try:await db.sessions.insert_one(doc.copy())
    except DuplicateKeyError:
        # Dua request bersamaan dengan kunci yang sama: kembalikan sesi yang tersimpan lebih dulu.
        existing=await db.sessions.find_one({'owner_id':user['id'],'client_request_id':data.client_request_id},{'_id':0})
        if existing:return existing
        raise
    await audit(user['id'],'create_session',doc['id'])
    return doc

@router.get('/sessions',response_model=list[Document])
async def list_sessions(user=Depends(current_user)):
    return await db.sessions.find({'owner_id':user['id']},{'_id':0,'gaze_points':0,'layouts':0,'metrics.word_observations':0,'metrics.gaze.scanpath':0,'metrics.gaze.line_timeline':0}).sort('created_at',-1).to_list(300)

async def owned(id,user):
    doc=await db.sessions.find_one({'id':id,'owner_id':user['id']},{'_id':0})
    if not doc:raise HTTPException(404,'Sesi tidak ditemukan.')
    # Older sessions stored research-model notes alongside measurement limitations.
    if 'limitations' in doc:
        doc['limitations'] = [line for line in doc['limitations']
                              if line != 'Model ETDD70 tidak diterapkan pada sesi webcam berbahasa Indonesia.']
    return doc

@router.get('/sessions/{id}',response_model=Document)
async def get_session(id:str,user=Depends(current_user)):return await owned(id,user)

def automatic_transcript(doc):
    """Transkrip otomatis asli (untuk ASR WER). Sesi lama tanpa `asr_transcript` memakai transkrip sebelum koreksi pertama."""
    if doc.get('asr_transcript') is not None:return doc['asr_transcript']
    if not doc.get('speech_model'):return None
    reviews=doc.get('reviews') or []
    return reviews[0].get('previous_transcript') if reviews else doc.get('transcript')

@router.patch('/sessions/{id}/review',response_model=Document)
async def review(id:str,data:Correction,user=Depends(current_user)):
    if user['role']!='teacher':raise HTTPException(403,'Koreksi hanya dapat dilakukan pendamping.')
    if not normalize(data.transcript):raise HTTPException(422,'Transkripsi tidak boleh kosong.')
    doc=await owned(id,user)
    result=analyze(doc['reference'],data.transcript,doc['duration'],doc['gaze_points'],doc['calibration'],doc['words'],doc.get('layouts'),(doc.get('metrics') or {}).get('pronunciation'),reviewed=True,asr_transcript=automatic_transcript(doc),gaze_duration=doc.get('client_duration'))
    result['metrics']['word_observations'] = doc['metrics'].get('word_observations', [])
    if 'fluency' in doc['metrics']:
        result['metrics']['fluency'] = doc['metrics']['fluency']
    history={'previous_transcript':doc['transcript'],'transcript':data.transcript,'note':data.note,'reviewer_id':user['id'],'created_at':now()}
    await db.sessions.update_one({'id':id,'owner_id':user['id']},{'$set':{**result,'transcript':data.transcript,'reviewed':True},'$push':{'reviews':history}})
    await audit(user['id'],'review_transcript',id);return await owned(id,user)

@router.delete('/sessions/{id}')
async def delete_session(id:str,user=Depends(current_user)):
    await owned(id,user);await db.sessions.delete_one({'id':id,'owner_id':user['id']});await audit(user['id'],'delete_session',id);return {'ok':True}

@router.get('/sessions/{id}/report')
async def report(id:str,user=Depends(current_user)):
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from xml.sax.saxutils import escape
    doc=await owned(id,user);buffer=io.BytesIO();styles=getSampleStyleSheet();flow=[]
    for text,style in [('CORTEXIA | Laporan Sesi','Title'),('Profil belajar, bukan diagnosis klinis.','Heading2'),('Sesi: '+doc['id'],'Normal'),('Tanggal: '+doc['created_at'][:10],'Normal'),('Bacaan: '+doc['text_title'],'Normal'),('Profil: '+doc['profile'],'Heading2'),('Kualitas data: '+doc['quality'],'Normal')]:flow.extend([Paragraph(escape(text),styles[style]),Spacer(1,10)])
    gaze=doc['metrics'].get('gaze') or {};pron=doc['metrics'].get('pronunciation') or {}
    rows=[(doc['metrics'].get(k),label) for k,label in [('accuracy','Ketepatan kata (%)'),('wer','WER (%)'),('wpm','Kata per menit'),('on_text_percent','Pandangan di area teks (%)'),('gaze_coverage','Cakupan data gaze (%)'),('fixations','Jumlah fiksasi'),('mean_fixation_ms','Rerata durasi fiksasi (ms)')]]
    rows+=[(gaze.get(k),label) for k,label in [('regressions_within_line','Regresi dalam baris'),('regressions_between_line','Regresi antar baris'),('skipped_words_percent','Kata tidak tertatap (%)'),('reading_order_percent','Keteraturan alur baca (%)')]]
    rows.append((pron.get('mean_confidence'),'Kejelasan pelafalan rata-rata (%)'))
    rows.append((doc['metrics'].get('asr_confidence'),'Keyakinan transkripsi otomatis (%)'))
    for value,label in rows:flow.append(Paragraph(escape(f'{label}: {value if value is not None else "Belum tersedia"}'),styles['Normal']))
    for line in doc.get('quality_reasons') or []:flow.append(Paragraph(escape('• '+line),styles['Normal']))
    fused=doc['metrics'].get('multimodal') or {}
    if fused:
        flow.extend([Spacer(1,10),Paragraph(escape('Bukti gabungan ('+fused.get('basis','')+')'),styles['Heading3'])])
        for line in [fused.get('pattern'),fused.get('explanation'),'Kata sulit di kedua modalitas: '+', '.join(w['word'] for w in fused['agreement_words']) if fused.get('agreement_words') else None]:
            if line:flow.append(Paragraph(escape(line),styles['Normal']))
    for line in [doc['profile_method'],*doc['recommendations'],*doc['limitations']]:flow.extend([Spacer(1,10),Paragraph(escape(line),styles['Normal'])])
    SimpleDocTemplate(buffer,pagesize=A4).build(flow);buffer.seek(0);await audit(user['id'],'export_report',id)
    return StreamingResponse(buffer,media_type='application/pdf',headers={'Content-Disposition':f'attachment; filename="cortexia-{id[:8]}.pdf"'})

@router.post('/pronunciation')
async def pronunciation(word:str=Form(...),consent:bool=Form(...),audio:UploadFile=File(...),user=Depends(current_user)):
    import pronunciation as pr
    if not consent:raise HTTPException(400,'Persetujuan diperlukan.')
    if len(word)>100 or not normalize(word):raise HTTPException(422,'Kata tidak valid.')
    if not pr.vosk_ready():
        r=await audio_result(audio);m=align(word,r['transcript']) if r['transcript'] else {'accuracy':None,'wer':None,'annotations':[]}
        doc={'id':uid(),'owner_id':user['id'],'word':word,'transcript':r['transcript'],'metrics':m,'assessment':None,'created_at':now(),'kind':'pronunciation'}
        await db.practices.insert_one(doc.copy());return doc
    data=await audio.read(10*1024*1024+1)
    if len(data)>10*1024*1024:raise HTTPException(413,'Audio maksimal 10 MB.')
    if len(data)<100:raise HTTPException(422,'Rekaman audio kosong atau terlalu pendek.')
    name=None
    try:
        with tempfile.NamedTemporaryFile(delete=False,suffix='.audio') as f:f.write(data);name=f.name
        result=await run_in_threadpool(pr.assess,name,word)
    except Exception as e:
        import logging;logging.exception('Pronunciation assessment failed')
        raise HTTPException(422,'Audio tidak dapat dianalisis. Periksa mikrofon lalu ulangi.') from e
    finally:
        if name and os.path.exists(name):os.unlink(name)
    metrics={'accuracy':result['score'],'similarity':result['similarity']}
    doc={'id':uid(),'owner_id':user['id'],'word':word,'transcript':result['transcript'],'metrics':metrics,'assessment':result,'created_at':now(),'kind':'pronunciation'}
    await db.practices.insert_one(doc.copy());await audit(user['id'],'pronunciation',doc['id'])
    return doc
