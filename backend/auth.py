import secrets, hashlib, bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from core import db, uid, now, current_user, security, audit, teacher, UserOut

router = APIRouter(tags=['auth'])
attempts = {}
class Login(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    @field_validator('password')
    @classmethod
    def password_bytes(cls,v):
        if len(v.encode('utf-8'))>72:raise ValueError('Kata sandi maksimal 72 byte.')
        return v
class Register(Login):
    name: str = Field(min_length=2, max_length=80)
    role: str = 'teacher'
    @field_validator('name')
    @classmethod
    def clean(cls,v):
        if len(v.strip())<2: raise ValueError('Nama terlalu pendek')
        return v.strip()
    @field_validator('role')
    @classmethod
    def role_check(cls,v):
        if v not in ['teacher','student']: raise ValueError('Peran tidak valid')
        return v

class InvitationInput(BaseModel):
    code: str = Field(min_length=8, max_length=64)
    @field_validator('code')
    @classmethod
    def normalize(cls,v):
        return v.strip().upper()
class AuthResponse(BaseModel):
    token: str
    user: UserOut

async def issue(user):
    token = secrets.token_urlsafe(40)
    await db.tokens.insert_one({'hash':hashlib.sha256(token.encode()).hexdigest(),'user_id':user['id'],'expires_at':datetime.now(timezone.utc)+timedelta(days=2)})
    return {'token':token,'user':UserOut(**user)}

@router.post('/auth/register', response_model=AuthResponse)
async def register(data:Register):
    user={'id':uid(),'email':str(data.email).lower(),'name':data.name,'role':data.role,'password':bcrypt.hashpw(data.password.encode(),bcrypt.gensalt()).decode(),'created_at':now()}
    try: await db.users.insert_one(user.copy())
    except DuplicateKeyError: raise HTTPException(409,'Email sudah terdaftar.')
    await audit(user['id'],'register')
    return await issue(user)

@router.post('/auth/invitations')
async def create_invitation(user=Depends(teacher)):
    code=secrets.token_urlsafe(9).upper()
    await db.invite_codes.insert_one({'id':uid(),'teacher_id':user['id'],
        'code_hash':hashlib.sha256(code.encode()).hexdigest(),'created_at':now()})
    return {'code':code}

@router.post('/auth/connect-teacher')
async def connect_teacher(data:InvitationInput,user=Depends(current_user)):
    if user['role']!='student':
        raise HTTPException(403,'Hanya akun siswa yang dapat memakai kode undangan.')
    if user.get('teacher_id'):
        raise HTTPException(409,'Akun ini sudah terhubung dengan guru.')
    code_hash=hashlib.sha256(data.code.encode()).hexdigest()
    invitation=await db.invite_codes.find_one_and_update(
        {'code_hash':code_hash,'used_by':{'$exists':False}},
        {'$set':{'used_by':user['id'],'used_at':now()}},
        return_document=ReturnDocument.BEFORE)
    if not invitation:
        raise HTTPException(400,'Kode undangan tidak valid atau sudah dipakai.')
    teacher_user=await db.users.find_one({'id':invitation['teacher_id'],'role':'teacher'},{'_id':0,'name':1})
    if not teacher_user:
        await db.invite_codes.update_one({'id':invitation['id'],'used_by':user['id']},
                                         {'$unset':{'used_by':1,'used_at':1}})
        raise HTTPException(400,'Akun guru untuk kode ini tidak ditemukan.')
    linked=await db.users.find_one_and_update(
        {'id':user['id'],'role':'student','teacher_id':{'$in':[None,'']}},
        {'$set':{'teacher_id':invitation['teacher_id'],'linked_at':now()}},
        return_document=ReturnDocument.AFTER,projection={'_id':0,'password':0})
    if not linked:
        await db.invite_codes.update_one({'id':invitation['id'],'used_by':user['id']},
                                         {'$unset':{'used_by':1,'used_at':1}})
        raise HTTPException(409,'Akun ini sudah terhubung dengan guru.')
    profiles=await db.students.find({'account_id':user['id']},{'_id':0,'id':1}).to_list(1000)
    profile_ids=[profile['id'] for profile in profiles]
    await db.students.update_many({'account_id':user['id']},
        {'$set':{'teacher_id':invitation['teacher_id'],'owner_id':invitation['teacher_id']}})
    if profile_ids:
        for collection in (db.sessions,db.practices,db.games):
            await collection.update_many(
                {'student_id':{'$in':profile_ids},'owner_id':user['id']},
                {'$set':{'owner_id':invitation['teacher_id']}})
    await audit(user['id'],'connect_teacher',invitation['teacher_id'])
    return {'linked':True,'teacher':{'id':invitation['teacher_id'],'name':teacher_user['name']}}

@router.post('/auth/login', response_model=AuthResponse)
async def login(data:Login, request:Request):
    key=(request.client.host,str(data.email).lower())
    recent=[t for t in attempts.get(key,[]) if (datetime.now(timezone.utc)-t).total_seconds()<300]
    if len(recent)>=10: raise HTTPException(429,'Terlalu banyak percobaan. Coba lagi dalam 5 menit.')
    user=await db.users.find_one({'email':str(data.email).lower()},{'_id':0})
    if not user or not bcrypt.checkpw(data.password.encode(),user['password'].encode()):
        attempts[key]=recent+[datetime.now(timezone.utc)]
        raise HTTPException(401,'Email atau kata sandi tidak sesuai.')
    attempts.pop(key,None)
    await audit(user['id'],'login')
    return await issue(user)

@router.get('/auth/me', response_model=UserOut)
async def me(user=Depends(current_user)): return user

@router.post('/auth/logout')
async def logout(credentials=Depends(security), user=Depends(current_user)):
    await db.tokens.delete_one({'hash':hashlib.sha256(credentials.credentials.encode()).hexdigest()})
    return {'ok':True}