import secrets, hashlib, bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from pymongo.errors import DuplicateKeyError
from core import db, uid, now, current_user, security, audit, UserOut

router = APIRouter(tags=['auth'])
attempts = {}
student_attempts = {}
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

class StudentLogin(BaseModel):
    student_id: str = Field(min_length=1, max_length=100)
    login_code: str = Field(min_length=4, max_length=20)
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

@router.get('/auth/student-profiles')
async def student_profiles():
    rows=await db.students.find({},{'_id':0,'id':1,'alias':1,'grade':1}).sort([('grade',1),('alias',1)]).to_list(500)
    return rows

@router.post('/auth/student-login', response_model=AuthResponse)
async def student_login(data:StudentLogin):
    student=await db.students.find_one({'id':data.student_id},{'_id':0})
    if not student:
        raise HTTPException(404,'Profil pembaca tidak ditemukan.')
    key=(student['id'],)
    recent=[t for t in student_attempts.get(key,[]) if (datetime.now(timezone.utc)-t).total_seconds()<300]
    if len(recent)>=10:
        raise HTTPException(429,'Terlalu banyak percobaan. Coba lagi dalam 5 menit.')
    code_hash=student.get('login_code_hash')
    if not code_hash or not bcrypt.checkpw(data.login_code.encode(),code_hash.encode()):
        student_attempts[key]=recent+[datetime.now(timezone.utc)]
        raise HTTPException(401,'Kode masuk siswa tidak sesuai.')
    student_attempts.pop(key,None)
    email=f"student-{student['id']}@cortexia.local"
    user=await db.users.find_one({'email':email},{'_id':0})
    if not user:
        user={'id':uid(),'email':email,'name':student['alias'],'role':'student','password':bcrypt.hashpw(data.login_code.encode(),bcrypt.gensalt()).decode(),'student_id':student['id'],'teacher_id':student['owner_id'],'created_at':now()}
        await db.users.insert_one(user.copy())
    if user.get('student_id') != student['id'] or user.get('teacher_id') != student['owner_id']:
        await db.users.update_one({'email':email},{'$set':{'student_id':student['id'],'teacher_id':student['owner_id'],'name':student['alias'],'role':'student'}})
        user={'id':user['id'],'email':email,'name':student['alias'],'role':'student','student_id':student['id'],'teacher_id':student['owner_id'],'password':user['password'],'created_at':user.get('created_at',now())}
    return await issue(user)

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