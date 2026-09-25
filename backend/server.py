import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core import db, client
from auth import router as auth_router
from content import router as content_router, initialize_content
from sessions import router as sessions_router
from research import router as research_router
from games import router as games_router

@asynccontextmanager
async def lifespan(app):
    await db.users.create_index('email', unique=True)
    await db.tokens.create_index('expires_at', expireAfterSeconds=0)
    await db.sessions.create_index([('owner_id', 1), ('created_at', -1)])
    await initialize_content()
    yield
    client.close()

app = FastAPI(title='CORTEXIA', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.environ['CORS_ORIGINS'].split(','), allow_credentials=False, allow_methods=['*'], allow_headers=['*'])
for router in (auth_router, content_router, sessions_router, research_router, games_router):
    app.include_router(router, prefix='/api')

@app.get('/api/health')
async def health():
    await db.command('ping')
    from analytics import asr_ready
    return {'status':'ok', 'database':'connected', 'speech_model': 'ready' if asr_ready() else 'unavailable', 'gaze':'WebGazer 3.5.3', 'paid_services':False}