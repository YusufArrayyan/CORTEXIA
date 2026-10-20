"""Unduh sekali semua model lokal; tidak ada layanan inferensi berbayar.

- Whisper base (faster-whisper)        -> models/whisper     (transkripsi bacaan)
- Vosk model-id-id (bookbot-kids)      -> models/vosk-id     (pelafalan, ujaran anak)
- Piper id_ID-news_tts-medium          -> models/piper       (suara contoh / game)
"""
import shutil, tempfile, urllib.request, zipfile
from pathlib import Path

ROOT = Path(__file__).parent / 'models'
BOOKBOT_ZIP = 'https://github.com/bookbot-kids/speech-recognizer-bahasa-indonesian/archive/refs/heads/main.zip'
BOOKBOT_MODEL = 'speech_recognizer/android/app/src/main/assets/model-id-id/'
PIPER = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/news_tts/medium/'


def whisper():
    from faster_whisper import WhisperModel
    WhisperModel('base', device='cpu', compute_type='int8', download_root=str(ROOT / 'whisper'), cpu_threads=2)
    print('Whisper siap.')


def vosk():
    target = ROOT / 'vosk-id'
    if (target / 'am' / 'final.mdl').exists():
        print('Vosk sudah ada.'); return
    print('Mengunduh model bookbot (± 300 MB arsip)…')
    with tempfile.TemporaryFile() as tmp:
        with urllib.request.urlopen(BOOKBOT_ZIP) as r:
            shutil.copyfileobj(r, tmp)
        tmp.seek(0)
        with zipfile.ZipFile(tmp) as z:
            for name in z.namelist():
                inner = name.split('/', 1)[1] if '/' in name else ''
                if inner.startswith(BOOKBOT_MODEL) and not name.endswith('/'):
                    dest = target / inner[len(BOOKBOT_MODEL):]
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(z.read(name))
    print('Vosk siap.')


def piper():
    target = ROOT / 'piper'; target.mkdir(parents=True, exist_ok=True)
    for f in ['id_ID-news_tts-medium.onnx', 'id_ID-news_tts-medium.onnx.json']:
        if not (target / f).exists():
            urllib.request.urlretrieve(PIPER + f, target / f)
    print('Piper siap.')


if __name__ == '__main__':
    whisper(); vosk(); piper()
    print('Semua model suara lokal siap.')
