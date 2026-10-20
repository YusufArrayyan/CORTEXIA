"""Suara contoh lokal: Piper (id_ID-news_tts-medium), cadangan espeak-ng bila terpasang."""
import io, shutil, subprocess, threading, wave
from core import ROOT

PIPER_MODEL = ROOT / 'models' / 'piper' / 'id_ID-news_tts-medium.onnx'
_voice = None
_lock = threading.Lock()


def piper_ready():
    return PIPER_MODEL.exists() and PIPER_MODEL.with_suffix('.onnx.json').exists()


def engine():
    if piper_ready():
        return 'piper/id_ID-news_tts-medium'
    if shutil.which('espeak-ng'):
        return 'espeak-ng'
    return None


def synthesize(text):
    global _voice
    if piper_ready():
        from piper import PiperVoice, SynthesisConfig
        with _lock:
            if _voice is None:
                _voice = PiperVoice.load(str(PIPER_MODEL))
            buffer = io.BytesIO()
            with wave.open(buffer, 'wb') as w:
                # length_scale > 1 memperlambat ucapan agar nyaman didengar anak.
                _voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=1.25))
        return buffer.getvalue()
    if shutil.which('espeak-ng'):
        r = subprocess.run(['espeak-ng', '-v', 'id', '-s', '125', '--stdout', '--stdin'], input=text.encode('utf-8'), capture_output=True, timeout=15, check=True)
        return r.stdout
    raise RuntimeError('Mesin suara lokal belum tersedia.')
