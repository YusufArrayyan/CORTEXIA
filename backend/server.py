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
    # Idempotensi: satu sesi per (pemilik, client_request_id); sesi tanpa kunci tidak terkena indeks.
    await db.sessions.create_index([('owner_id', 1), ('client_request_id', 1)], unique=True, name='idempotency',
                                   partialFilterExpression={'client_request_id': {'$type': 'string'}})
    await db.training_jobs.create_index('user_id', unique=True)
    from research import interrupt_stale_jobs
    await interrupt_stale_jobs()
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
    from pronunciation import vosk_ready
    import tts
    return {'status':'ok', 'database':'connected', 'speech_model': 'ready' if asr_ready() or vosk_ready() else 'unavailable', 'pronunciation_model': 'ready' if vosk_ready() else 'unavailable', 'tts': tts.engine() or 'browser-fallback', 'gaze':'WebGazer 3.5.3 (model wajah lokal)', 'paid_services':False}

# Sajikan build React dari proses yang sama (satu port untuk frontend + API).
# Aktif hanya jika frontend/build ada; lokasi bisa diganti lewat FRONTEND_BUILD_DIR.
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse

FRONTEND_BUILD = Path(os.environ.get('FRONTEND_BUILD_DIR', Path(__file__).resolve().parent.parent / 'frontend' / 'build')).resolve()

if (FRONTEND_BUILD / 'index.html').is_file():
    @app.get('/{full_path:path}', include_in_schema=False)
    async def serve_frontend(full_path: str):
        if full_path == 'api' or full_path.startswith('api/'):
            raise HTTPException(status_code=404)
        candidate = (FRONTEND_BUILD / full_path).resolve()
        if full_path and candidate.is_file() and candidate.is_relative_to(FRONTEND_BUILD):
            return FileResponse(candidate)
        return FileResponse(FRONTEND_BUILD / 'index.html')
