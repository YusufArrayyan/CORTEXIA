import json, io, asyncio
import pandas as pd
import numpy as np
from pathlib import Path
from fastapi import APIRouter,Depends,HTTPException,UploadFile,File,BackgroundTasks
from pydantic import BaseModel
from core import teacher,db,audit,uid,Document
from ml_pipeline import DATA,MODELS,dataset_frame,train

router=APIRouter(tags=['research'])
jobs={}
class TrainingInput(BaseModel):algorithm:str='logistic'

def reports_for(user):
    paths=list(MODELS.glob('*.json'))+list((MODELS/user['id']).glob('*.json'))
    return sorted([json.loads(p.read_text()) for p in paths],key=lambda x:x['created_at'],reverse=True)

@router.get('/research')
async def research(user=Depends(teacher)):
    frame=await asyncio.to_thread(dataset_frame);reports=reports_for(user)
    return {'name':'ETDD70 v2','participants':int(frame.subject_id.nunique()),'recordings':len(frame),'tasks':frame.task.unique().tolist(),'features':len(frame.columns)-3,'labels':{'non-dyslexic':35,'dyslexic':35},'language':'Ceko','age':'9–10 tahun','frequency':'250 Hz','source':'Lampiran ETDD70_v2.zip','citation':'Dostalova et al. (2024), doi:10.5281/zenodo.13332134','subjects':sorted(frame.subject_id.unique().tolist()),'reports':[{k:v for k,v in r.items() if k!='oof'} for r in reports],'job':jobs.get(user['id'],{'status':'idle'})}

async def run_training(user,algorithm,frame=None):
    jobs[user['id']]={'status':'running','message':'Melatih dan mengevaluasi 5 fold…'}
    try:
        r=await asyncio.to_thread(train,algorithm,frame,MODELS/user['id'])
        jobs[user['id']]={'status':'complete','model_id':r['id']};await audit(user['id'],'train_model',r['id'])
    except Exception:
        import logging;logging.exception('Training error');jobs[user['id']]={'status':'failed','message':'Pelatihan gagal. Periksa kelengkapan data dan label.'}

@router.post('/research/train',status_code=202)
async def start_training(data:TrainingInput,background:BackgroundTasks,user=Depends(teacher)):
    if data.algorithm not in ['logistic','forest']:raise HTTPException(422,'Algoritme tidak tersedia.')
    if jobs.get(user['id'],{}).get('status')=='running':raise HTTPException(409,'Pelatihan masih berlangsung.')
    jobs[user['id']]={'status':'running'};background.add_task(run_training,user,data.algorithm)
    return {'status':'running'}

@router.post('/research/import',status_code=202)
async def import_csv(background:BackgroundTasks,file:UploadFile=File(...),user=Depends(teacher)):
    if jobs.get(user['id'],{}).get('status')=='running':raise HTTPException(409,'Pelatihan masih berlangsung.')
    raw=await file.read(5*1024*1024+1)
    if len(raw)>5*1024*1024:raise HTTPException(413,'CSV maksimal 5 MB.')
    try:
        f=pd.read_csv(io.BytesIO(raw));required={'subject_id','label'}
        if not required.issubset(f.columns):raise ValueError('CSV wajib memiliki kolom subject_id, label (0/1), dan fitur numerik.')
        if len(f)>10000 or len(f.columns)>100:raise ValueError('Maksimal 10.000 baris dan 100 kolom.')
        if f.subject_id.isna().any() or f.label.isna().any():raise ValueError('ID peserta dan label tidak boleh kosong.')
        if set(f.label.unique())!={0,1}:raise ValueError('Label harus memuat kedua kelas 0 dan 1.')
        if f.groupby('subject_id').label.nunique().max()>1:raise ValueError('Setiap peserta hanya boleh memiliki satu label.')
        if f.groupby('label').subject_id.nunique().min()<5:raise ValueError('Butuh minimal 5 peserta berbeda di setiap kelas untuk validasi 5 fold.')
        cols=[c for c in f.columns if c not in ['subject_id','label','task']]
        if not cols:raise ValueError('Tambahkan minimal satu fitur numerik.')
        f[cols]=f[cols].astype(float)
        if not np.isfinite(f[cols]).all().all():raise ValueError('Fitur numerik tidak boleh kosong atau tak hingga.')
    except ValueError as e:raise HTTPException(422,str(e))
    except Exception:raise HTTPException(422,'CSV tidak dapat dibaca.')
    jobs[user['id']]={'status':'running'};background.add_task(run_training,user,'logistic',f)
    return {'status':'running','rows':len(f)}

@router.get('/research/subjects/{subject}')
async def subject_detail(subject:str,task:str='T4_Meaningful_Text',user=Depends(teacher)):
    if not subject.isdigit() or task not in ['T1_Syllables','T4_Meaningful_Text','T5_Pseudo_Text']:raise HTTPException(422,'Peserta atau tugas tidak valid.')
    path=DATA/'data'/'data'/f'Subject_{subject}_{task}_fixations.csv'
    if not path.exists():raise HTTPException(404,'Rekaman tidak ditemukan.')
    f=pd.read_csv(path);reports=[r for r in reports_for(user) if r['dataset']=='ETDD70 v2'];prediction=next((r for r in reports[0]['oof'] if r['subject_id']==subject and r['task']==task),None) if reports else None
    points=[{'x':float(r.fix_x),'y':float(r.fix_y),'duration':float(r.duration_ms)} for r in f.itertuples() if np.isfinite(r.fix_x) and np.isfinite(r.fix_y)]
    return {'subject_id':subject,'task':task,'fixations':points,'prediction':prediction,'prediction_type':'Out-of-fold (peserta tidak ada dalam fold pelatihan)','model_id':reports[0]['id'] if reports else None}