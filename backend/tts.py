"""Suara contoh lokal: Piper (id_ID-news_tts-medium), cadangan espeak-ng bila terpasang."""
import io, re, shutil, subprocess, threading, wave
from functools import lru_cache
from core import ROOT

PIPER_MODEL = ROOT / 'models' / 'piper' / 'id_ID-news_tts-medium.onnx'
_voice = None
_lock = threading.Lock()

# Tempo: kata tunggal sedikit lebih lambat agar tiap suku kata jelas bagi anak; kalimat mendekati tempo bicara normal agar tidak terdengar diseret.
WORD_LENGTH_SCALE = 1.2
SENTENCE_LENGTH_SCALE = 1.08
# Jeda (detik): sebelum ucapan agar awal kata tidak terpotong pemutar browser, antar-kalimat, dan sesudah ucapan.
LEAD_SILENCE, SENTENCE_PAUSE, TAIL_SILENCE = .15, .45, .25
FADE = .008  # fade in/out singkat tiap kalimat menghilangkan bunyi klik
PEAK = .85   # puncak volume seragam (sekitar -1,4 dBFS) agar semua kata sama keras tanpa pecah

# Nama dan singkatan yang salah dibaca mesin bila ditulis apa adanya (huruf kapital dieja per huruf).
LEXICON = {
    'cortexia': 'Korteksia', 'corti': 'Korti',
    'dll': 'dan lain-lain', 'dsb': 'dan sebagainya', 'yg': 'yang', 'dgn': 'dengan', 'tdk': 'tidak',
}
_DIGITS = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']


def number_words(n):
    """Angka bulat 0–999.999 menjadi kata Bahasa Indonesia (12 -> dua belas, 100 -> seratus)."""
    if n < 12:
        return _DIGITS[n]
    if n < 20:
        return f'{_DIGITS[n - 10]} belas'
    if n < 100:
        return f'{_DIGITS[n // 10]} puluh' + (f' {number_words(n % 10)}' if n % 10 else '')
    if n < 1000:
        head = 'seratus' if n // 100 == 1 else f'{_DIGITS[n // 100]} ratus'
        return head + (f' {number_words(n % 100)}' if n % 100 else '')
    head = 'seribu' if n // 1000 == 1 else f'{number_words(n // 1000)} ribu'
    return head + (f' {number_words(n % 1000)}' if n % 1000 else '')


def normalize(text):
    """Siapkan teks agar diucapkan dengan benar: angka dibaca sebagai kata, istilah dieja sesuai lafal Indonesia,
    dan ucapan selalu diakhiri tanda baca supaya intonasinya turun dengan wajar, tidak menggantung atau terpotong."""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\b\d{1,6}\b', lambda m: number_words(int(m.group())), text)
    text = re.sub(r'[A-Za-z]+', lambda m: LEXICON.get(m.group().lower(), m.group()), text)
    if text and text[-1] not in '.!?':
        text += '.'
    return text


def piper_ready():
    return PIPER_MODEL.exists() and PIPER_MODEL.with_suffix('.onnx.json').exists()


def engine():
    if piper_ready():
        return 'piper/id_ID-news_tts-medium'
    if shutil.which('espeak-ng'):
        return 'espeak-ng'
    return None


def _wav(samples, rate):
    import numpy as np
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes((np.clip(samples, -1, 1) * 32767).astype(np.int16).tobytes())
    return buffer.getvalue()


def _piper(text):
    import numpy as np
    from piper import PiperVoice, SynthesisConfig
    global _voice
    single_word = len(text.split()) == 1
    config = SynthesisConfig(length_scale=WORD_LENGTH_SCALE if single_word else SENTENCE_LENGTH_SCALE, normalize_audio=False)
    with _lock:
        if _voice is None:
            _voice = PiperVoice.load(str(PIPER_MODEL))
        chunks = list(_voice.synthesize(text, syn_config=config))
    if not chunks:
        raise RuntimeError('Piper tidak menghasilkan suara.')
    rate = chunks[0].sample_rate
    silence = lambda seconds: np.zeros(int(rate * seconds), dtype=np.float32)
    fade = np.linspace(0, 1, max(1, int(rate * FADE)), dtype=np.float32)
    parts = [silence(LEAD_SILENCE)]
    for i, chunk in enumerate(chunks):
        audio = chunk.audio_float_array.astype(np.float32).copy()
        if len(audio) > 2 * len(fade):
            audio[:len(fade)] *= fade
            audio[-len(fade):] *= fade[::-1]
        if i:
            parts.append(silence(SENTENCE_PAUSE))
        parts.append(audio)
    parts.append(silence(TAIL_SILENCE))
    samples = np.concatenate(parts)
    peak = float(np.max(np.abs(samples))) if len(samples) else 0
    if peak > 1e-4:
        samples *= PEAK / peak
    return _wav(samples, rate)


@lru_cache(maxsize=256)
def _synthesize(text):
    if piper_ready():
        return _piper(text)
    if shutil.which('espeak-ng'):
        # -s: kata per menit, -p: nada sedikit lebih tinggi agar ramah, -g: jeda antar-kata (x10 ms).
        r = subprocess.run(['espeak-ng', '-v', 'id', '-s', '130', '-p', '55', '-g', '3', '--stdout', '--stdin'], input=text.encode('utf-8'), capture_output=True, timeout=15, check=True)
        return r.stdout
    raise RuntimeError('Mesin suara lokal belum tersedia.')


def synthesize(text):
    return _synthesize(normalize(text))
