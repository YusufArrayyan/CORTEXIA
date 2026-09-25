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