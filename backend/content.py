from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from pymongo import ReturnDocument
from core import db, uid, now, teacher, current_user, Document, audit, data_owner, reader_profile_ids

router=APIRouter(tags=['content'])
class StudentInput(BaseModel):
    alias:str=Field(min_length=2,max_length=50)
    grade:int=Field(ge=1,le=6)
    @field_validator('alias')
    @classmethod
    def check_alias(cls,v):
        if len(v.strip())<2: raise ValueError('Alias minimal 2 karakter')
        return v.strip()
class TextInput(BaseModel):
    title:str=Field(min_length=3,max_length=120)
    content:str=Field(min_length=5,max_length=8000)
    level:int=Field(ge=1,le=6)
    @field_validator('title','content')
    @classmethod
    def clean(cls,v):
        if not v.strip():raise ValueError('Kolom tidak boleh kosong')
        return v.strip()

async def initialize_content():
    text={'id':'rani-taman','title':'Petualangan Rani di Taman Ajaib','content':'Pagi ini, Rani pergi ke taman bunga bersama Ibu. Di sana, Rani melihat kupu-kupu berwarna kuning terbang riang di atas kelopak mawar. “Lihat Ibu, kupu-kupunya indah sekali!” seru Rani sambil tersenyum manis.','level':2,'source':'Teks dari UI Reading Assessment lampiran pengguna','image':'/assets/rani.webp','owner_id':'shared','word_count':33}
    text['word_count']=len(text['content'].split())
    await db.texts.update_one({'id':text['id']},{'$setOnInsert':text},upsert=True)

@router.get('/texts',response_model=list[Document])
async def texts(user=Depends(current_user)):
    owner=data_owner(user)
    return await db.texts.find({'owner_id':{'$in':['shared',owner]}},{'_id':0}).to_list(100)

@router.post('/texts',response_model=Document)
async def add_text(data:TextInput,user=Depends(teacher)):
    doc={**data.model_dump(),'id':uid(),'owner_id':user['id'],'word_count':len(data.content.split()),'source':'Materi guru','created_at':now()}
    await db.texts.insert_one(doc.copy());return doc

@router.patch('/texts/{id}',response_model=Document)
async def edit_text(id:str,data:TextInput,user=Depends(teacher)):
    values={**data.model_dump(),'word_count':len(data.content.split()),'source':'Materi guru'}
    r=await db.texts.find_one_and_update({'id':id,'owner_id':user['id']},{'$set':values},return_document=ReturnDocument.AFTER,projection={'_id':0})
    if not r:raise HTTPException(404,'Materi tidak ditemukan.')
    await audit(user['id'],'edit_text',id)
    return r

@router.delete('/texts/{id}')
async def delete_text(id:str,user=Depends(teacher)):
    r=await db.texts.delete_one({'id':id,'owner_id':user['id']})
    if not r.deleted_count:raise HTTPException(404,'Materi tidak ditemukan atau merupakan materi bersama.')
    return {'ok':True}

@router.get('/students',response_model=list[Document])
async def students(user=Depends(current_user)):
    owner=data_owner(user)
    if user['role']=='student':
        ids=await reader_profile_ids(user)
        return await db.students.find({'owner_id':owner,'id':{'$in':ids}},
            {'_id':0,'login_code':0,'login_code_hash':0}).to_list(500)
    return await db.students.find({'owner_id':owner},
        {'_id':0,'login_code':0,'login_code_hash':0}).to_list(500)

@router.post('/students',response_model=Document)
async def add_student(data:StudentInput,user=Depends(current_user)):
    if user['role'] not in ['teacher','student']:
        raise HTTPException(403,'Akun ini tidak dapat menambahkan profil pembaca.')
    owner=data_owner(user)
    doc={**data.model_dump(),'id':uid(),'owner_id':owner,'created_at':now()}
    if user['role']=='student':
        doc['account_id']=user['id']
        if user.get('teacher_id'):doc['teacher_id']=user['teacher_id']
    else:
        doc['teacher_id']=user['id']
    await db.students.insert_one(doc.copy())
    await audit(user['id'],'create_student',doc['id'])
    return doc

@router.patch('/students/{id}',response_model=Document)
async def edit_student(id:str,data:StudentInput,user=Depends(current_user)):
    if user['role']=='teacher':
        query={'id':id,'owner_id':user['id']}
    elif user['role']=='student':
        query={'id':id,'owner_id':data_owner(user),'account_id':user['id']}
    else:
        raise HTTPException(403,'Akun ini tidak dapat mengubah profil pembaca.')
    updated=await db.students.find_one_and_update(
        query,{'$set':data.model_dump()},return_document=ReturnDocument.AFTER,
        projection={'_id':0,'login_code':0,'login_code_hash':0})
    if not updated:raise HTTPException(404,'Profil pembaca tidak ditemukan.')
    await audit(user['id'],'edit_student',id)
    return updated

@router.get('/students/accounts')
async def student_accounts(user=Depends(teacher)):
    accounts=await db.users.find({'role':'student','teacher_id':user['id']},
        {'_id':0,'id':1,'name':1,'email':1,'created_at':1}).sort('name',1).to_list(500)
    grouped=[]
    for account in accounts:
        profiles=await db.students.find(
            {'account_id':account['id'],'owner_id':user['id']},
            {'_id':0,'login_code':0,'login_code_hash':0}).sort('alias',1).to_list(500)
        legacy_id=await db.users.find_one(
            {'id':account['id'],'student_id':{'$exists':True}},
            {'_id':0,'student_id':1})
        if legacy_id and not any(p['id']==legacy_id['student_id'] for p in profiles):
            profile=await db.students.find_one(
                {'id':legacy_id['student_id'],'owner_id':user['id']},
                {'_id':0,'login_code':0,'login_code_hash':0})
            if profile:profiles.append(profile)
        grouped.append({**account,'profiles':profiles})
    return grouped

@router.delete('/students/{id}')
async def delete_student(id:str,user=Depends(current_user)):
    if user['role']=='teacher':
        query={'id':id,'owner_id':user['id']}
    elif user['role']=='student':
        query={'id':id,'owner_id':data_owner(user),'account_id':user['id']}
    else:
        raise HTTPException(403,'Akun ini tidak dapat menghapus profil pembaca.')
    r=await db.students.delete_one(query)
    if not r.deleted_count:raise HTTPException(404,'Siswa tidak ditemukan.')
    owner=data_owner(user)
    await db.sessions.delete_many({'student_id':id,'owner_id':owner})
    await db.practices.delete_many({'student_id':id,'owner_id':owner})
    await db.games.delete_many({'student_id':id,'owner_id':owner})
    if user['role']=='teacher':
        await db.users.delete_many({'student_id':id,'teacher_id':user['id']})
    await audit(user['id'],'delete_student_and_sessions',id)
    return {'ok':True}

@router.get('/dashboard')
async def dashboard(user=Depends(current_user)):
    owner=data_owner(user)
    query={'owner_id':owner}
    if user['role']=='student':
        query['student_id']={'$in':await reader_profile_ids(user)}
    # Ringkasan saja: data tatapan/kata mentah hanya diambil di halaman hasil sesi.
    light={'_id':0,'gaze_points':0,'segments':0,'layouts':0,'words':0,'reference':0,'metrics.annotations':0,'metrics.word_observations':0,'metrics.gaze.scanpath':0,'metrics.gaze.line_timeline':0,'metrics.gaze.words':0,'metrics.pronunciation.words':0}
    rows=await db.sessions.find(query,light).sort('created_at',-1).to_list(300)
    # Rerata ketepatan hanya dari sesi dengan transkrip andal (sesi lama tanpa field dianggap andal).
    with_accuracy=[r for r in rows if r.get('metrics',{}).get('accuracy') is not None]
    valid=[r for r in with_accuracy if r['metrics'].get('speech_reliable',True)]
    practices=await db.practices.find(query,{'_id':0,'words':0,'assessment.words':0,'assessment.forced_choice.competitors':0}).sort('created_at',-1).to_list(100)
    student_count=(len(await reader_profile_ids(user))
                   if user['role']=='student' else await db.students.count_documents({'owner_id':owner}))
    return {'students':student_count,'session_count':len(rows),'average_accuracy':round(sum(r['metrics']['accuracy'] for r in valid)/len(valid),1) if valid else None,'accuracy_sessions':len(valid),'accuracy_sessions_excluded':len(with_accuracy)-len(valid),'reading_minutes':round(sum(r.get('duration',0) for r in rows)/60,1),'sessions':rows,'practice_count':await db.practices.count_documents(query),'practices':practices}

@router.get('/audit',response_model=list[Document])
async def audit_log(user=Depends(teacher)):
    return await db.audit.find({'user_id':user['id']},{'_id':0}).sort('created_at',-1).to_list(100)