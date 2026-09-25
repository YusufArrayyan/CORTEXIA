from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from core import db, uid, now, teacher, current_user, Document, audit

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
    return await db.texts.find({'owner_id':{'$in':['shared',user['id']]}},{'_id':0}).to_list(100)

@router.post('/texts',response_model=Document)
async def add_text(data:TextInput,user=Depends(teacher)):
    doc={**data.model_dump(),'id':uid(),'owner_id':user['id'],'word_count':len(data.content.split()),'source':'Materi guru','created_at':now()}
    await db.texts.insert_one(doc.copy());return doc

@router.delete('/texts/{id}')
async def delete_text(id:str,user=Depends(teacher)):
    r=await db.texts.delete_one({'id':id,'owner_id':user['id']})
    if not r.deleted_count:raise HTTPException(404,'Materi tidak ditemukan atau merupakan materi bersama.')
    return {'ok':True}

@router.get('/students',response_model=list[Document])
async def students(user=Depends(current_user)):
    return await db.students.find({'owner_id':user['id']},{'_id':0}).to_list(500)

@router.post('/students',response_model=Document)
async def add_student(data:StudentInput,user=Depends(current_user)):
    doc={**data.model_dump(),'id':uid(),'owner_id':user['id'],'created_at':now()}
    await db.students.insert_one(doc.copy()); await audit(user['id'],'create_student',doc['id']);return doc

@router.delete('/students/{id}')
async def delete_student(id:str,user=Depends(current_user)):
    r=await db.students.delete_one({'id':id,'owner_id':user['id']})
    if not r.deleted_count:raise HTTPException(404,'Siswa tidak ditemukan.')
    await db.sessions.delete_many({'student_id':id,'owner_id':user['id']})
    await audit(user['id'],'delete_student_and_sessions',id)
    return {'ok':True}

@router.get('/dashboard')
async def dashboard(user=Depends(current_user)):
    query={'owner_id':user['id']}
    rows=await db.sessions.find(query,{'_id':0,'gaze_points':0,'segments':0}).sort('created_at',-1).to_list(300)
    valid=[r for r in rows if r.get('metrics',{}).get('accuracy') is not None]
    return {'students':await db.students.count_documents(query),'session_count':len(rows),'average_accuracy':round(sum(r['metrics']['accuracy'] for r in valid)/len(valid),1) if valid else None,'reading_minutes':round(sum(r.get('duration',0) for r in rows)/60,1),'sessions':rows,'practice_count':await db.practices.count_documents(query)}

@router.get('/audit',response_model=list[Document])
async def audit_log(user=Depends(teacher)):
    return await db.audit.find({'user_id':user['id']},{'_id':0}).sort('created_at',-1).to_list(100)