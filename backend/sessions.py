import json, os, tempfile, io
from datetime import datetime,timezone,timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from core import db,uid,now,current_user,audit,Document
from analytics import transcribe,analyze,align,normalize

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
class Correction(BaseModel):
    transcript:str=Field(min_length=1,max_length=10000)
    note:str=Field(default='',max_length=2000)

async def audio_result(audio,reference=None):
    if not audio or not audio.filename:return {'transcript':'','words':[]}
    data=await audio.read(25*1024*1024+1)
    if len(data)>25*1024*1024:raise HTTPException(413,'Audio maksimal 25 MB.')
    if len(data)<100:raise HTTPException(422,'Rekaman audio kosong atau terlalu pendek.')
    name=None
    try:
        with tempfile.NamedTemporaryFile(delete=False,suffix='.audio') as f:f.write(data);name=f.name
        result=await run_in_threadpool(transcribe,name)
        if result['audio_duration']>900:raise HTTPException(422,'Durasi audio maksimal 15 menit.')
        if reference:
            from pronunciation import vosk_ready,word_confidence
            if vosk_ready():
                try:result['pronunciation']=await run_in_threadpool(word_confidence,name,reference)
                except Exception:
                    import logging;logging.exception('Vosk word confidence failed')
        return result
    except HTTPException:raise
    except Exception as e:
        import logging;logging.exception('Local transcription failed')
        raise HTTPException(422,'Audio tidak dapat dianalisis. Periksa mikrofon atau format audio, lalu ulangi.') from e
    finally:
        if name and os.path.exists(name):os.unlink(name)

@router.post('/sessions',response_model=Document)
async def create_session(payload:str=Form(...),audio:UploadFile|None=File(None),user=Depends(current_user)):
    try:data=SessionInput.model_validate_json(payload)
    except Exception:raise HTTPException(422,'Data sesi tidak valid.')
    if not data.consent:raise HTTPException(400,'Persetujuan pendamping wajib diberikan sebelum perekaman.')
    if data.mode not in ['gaze','multimodal','speech']:raise HTTPException(422,'Modalitas tidak valid.')
    student=await db.students.find_one({'id':data.student_id,'owner_id':user['id']},{'_id':0})
    text=await db.texts.find_one({'id':data.text_id,'owner_id':{'$in':['shared',user['id']]}},{'_id':0})
    if not student or not text:raise HTTPException(404,'Siswa atau materi tidak ditemukan.')
    speech=await audio_result(audio,text['content'])
    duration=speech.get('audio_duration',data.duration)
    points=[p.model_dump() for p in data.gaze_points]
    layouts=[l.model_dump() for l in data.layouts]
    calibration=data.calibration.model_dump()
    result=analyze(text['content'],speech['transcript'],duration,points,calibration,speech['words'],layouts,speech.get('pronunciation'))
    doc={'id':uid(),'owner_id':user['id'],'student_id':student['id'],'student_alias':student['alias'],'text_id':text['id'],'text_title':text['title'],'reference':text['content'],'duration':duration,'mode':data.mode,'transcript':speech['transcript'],'words':speech['words'],'speech_model':speech.get('model'),'gaze_points':points,'layouts':layouts,'calibration':calibration,**result,'created_at':now(),'consent_at':now(),'retention_days':30,'expires_at':datetime.now(timezone.utc)+timedelta(days=30),'reviews':[]}
    await db.sessions.create_index('expires_at',expireAfterSeconds=0)
    await db.sessions.insert_one(doc.copy());await audit(user['id'],'create_session',doc['id'])
    return doc

@router.get('/sessions',response_model=list[Document])
async def list_sessions(user=Depends(current_user)):
    return await db.sessions.find({'owner_id':user['id']},{'_id':0,'gaze_points':0,'layouts':0,'metrics.gaze.scanpath':0,'metrics.gaze.line_timeline':0}).sort('created_at',-1).to_list(300)

async def owned(id,user):
    doc=await db.sessions.find_one({'id':id,'owner_id':user['id']},{'_id':0})
    if not doc:raise HTTPException(404,'Sesi tidak ditemukan.')
    return doc

@router.get('/sessions/{id}',response_model=Document)
async def get_session(id:str,user=Depends(current_user)):return await owned(id,user)

@router.patch('/sessions/{id}/review',response_model=Document)
async def review(id:str,data:Correction,user=Depends(current_user)):
    if user['role']!='teacher':raise HTTPException(403,'Koreksi hanya dapat dilakukan pendamping.')
    if not normalize(data.transcript):raise HTTPException(422,'Transkripsi tidak boleh kosong.')
    doc=await owned(id,user)
    result=analyze(doc['reference'],data.transcript,doc['duration'],doc['gaze_points'],doc['calibration'],doc['words'],doc.get('layouts'),(doc.get('metrics') or {}).get('pronunciation'))
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
    for value,label in rows:flow.append(Paragraph(escape(f'{label}: {value if value is not None else "Belum tersedia"}'),styles['Normal']))
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
