import secrets
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel,Field
from pymongo import ReturnDocument
from core import db,uid,now,current_user

router=APIRouter(tags=['games'])
WORDS=['apel','bunga','mawar','kuning','taman','pagi','buku','mata','ibu','kupu-kupu']
class Answer(BaseModel):choice:str=Field(min_length=1,max_length=100)
def public_game(g):
    complete=g['index']>=len(g['questions'])
    return {'id':g['id'],'index':g['index'],'total':len(g['questions']),'score':g['score'],'stars':g['score']*5,'complete':complete,'question':None if complete else {'sound':g['questions'][g['index']]['answer'],'options':g['questions'][g['index']]['options']}}

@router.post('/games/start')
async def start(user=Depends(current_user)):
    random=secrets.SystemRandom();questions=[]
    for word in random.sample(WORDS,5):
        options=random.sample([w for w in WORDS if w!=word],3)+[word];random.shuffle(options);questions.append({'answer':word,'options':options})
    g={'id':uid(),'owner_id':user['id'],'questions':questions,'index':0,'score':0,'created_at':now()}
    await db.games.insert_one(g.copy());return public_game(g)

@router.post('/games/{id}/answer')
async def answer(id:str,data:Answer,user=Depends(current_user)):
    g=await db.games.find_one({'id':id,'owner_id':user['id']},{'_id':0})
    if not g:raise HTTPException(404,'Permainan tidak ditemukan.')
    if g['index']>=len(g['questions']):raise HTTPException(409,'Permainan sudah selesai.')
    question=g['questions'][g['index']]
    if data.choice not in question['options']:raise HTTPException(422,'Pilihan tidak valid.')
    correct=data.choice==question['answer']
    result=await db.games.find_one_and_update({'id':id,'owner_id':user['id'],'index':g['index']},{'$inc':{'index':1,'score':int(correct)}},return_document=ReturnDocument.AFTER,projection={'_id':0})
    if not result:raise HTTPException(409,'Jawaban sudah diproses.')
    if result['index']==5:await db.practices.insert_one({'id':uid(),'owner_id':user['id'],'kind':'sound_game','score':result['score'],'stars':result['score']*5,'created_at':now()})
    return {'correct':correct,'choice':data.choice,'correct_answer':question['answer'],'game':public_game(result)}
GAZE_LEVELS=[
    {'level':1,'title':'Kata pendek','sentences':['Kucing kecil bermain di taman bunga.','Ibu membeli apel merah.','Rani suka membaca buku.']},
    {'level':2,'title':'Kalimat panjang','sentences':['Kupu-kupu kuning terbang di atas bunga mawar.','Pagi ini matahari bersinar sangat cerah.','Adik menyiram tanaman di halaman rumah.']},
    {'level':3,'title':'Dua baris','sentences':['Budi punya bola merah. Ia bermain di halaman rumah bersama kawan-kawan.','Rani berjalan ke taman. Di sana ada kelopak bunga berwarna merah muda.','Burung kecil bernyanyi di pohon. Suaranya merdu sekali di pagi hari.']},
]
class GazeWord(BaseModel):
    word:str=Field(max_length=60)
    hit:bool
    dwell_ms:float=Field(ge=0,le=60000)
    time_ms:float=Field(ge=0,le=120000)
class GazeResult(BaseModel):
    level:int=Field(ge=1,le=3)
    score:int=Field(ge=0,le=10000)
    words:list[GazeWord]=Field(default_factory=list,max_length=500)
    calibration_error:float|None=Field(default=None,ge=0,le=10)
    duration:float=Field(ge=0,le=3600)

@router.get('/games/gaze/levels')
async def gaze_levels():return GAZE_LEVELS

@router.post('/games/gaze/finish')
async def gaze_finish(data:GazeResult,user=Depends(current_user)):
    hits=sum(1 for w in data.words if w.hit)
    doc={'id':uid(),'owner_id':user['id'],'kind':'gaze_game','level':data.level,'score':data.score,'stars':hits,'words_total':len(data.words),'words_hit':hits,
         'mean_time_ms':round(sum(w.time_ms for w in data.words if w.hit)/hits,1) if hits else None,'calibration_error':data.calibration_error,'duration':data.duration,
         'words':[w.model_dump() for w in data.words],'created_at':now()}
    await db.practices.insert_one(doc.copy());doc.pop('_id',None)
    return doc
