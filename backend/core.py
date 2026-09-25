import os, uuid, hashlib
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict

ROOT = Path(__file__).parent
load_dotenv(ROOT / '.env')
client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
security = HTTPBearer(auto_error=False)
def now(): return datetime.now(timezone.utc).isoformat()
def uid(): return str(uuid.uuid4())

class Document(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str

async def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(401, 'Silakan masuk terlebih dahulu.')
    token = await db.tokens.find_one({'hash':hashlib.sha256(credentials.credentials.encode()).hexdigest()}, {'_id':0})
    if not token or token['expires_at'].replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(401, 'Sesi masuk berakhir. Silakan masuk kembali.')
    user = await db.users.find_one({'id':token['user_id']}, {'_id':0, 'password':0})
    if not user: raise HTTPException(401, 'Akun tidak ditemukan.')
    return user

async def teacher(user=Depends(current_user)):
    if user['role'] != 'teacher': raise HTTPException(403, 'Hanya guru/pendamping yang dapat mengakses bagian ini.')
    return user

async def audit(user_id, action, target=''):
    await db.audit.insert_one({'id':uid(),'user_id':user_id,'action':action,'target':target,'created_at':now()})