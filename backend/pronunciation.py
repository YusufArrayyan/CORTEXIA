"""Penilaian pelafalan lokal dengan model Kaldi/Vosk anak berbahasa Indonesia.

Model: bookbot-kids/speech-recognizer-bahasa-indonesian (model-id-id, Apache-2.0),
dilatih pada ujaran anak. Penilaian menggabungkan dua lintasan dekode:
1. dekode bebas (kosakata penuh) -> apa yang terdengar;
2. dekode pilihan-paksa (kata target vs kata pesaing berbunyi mirip) -> apakah
   kata target menang dan seberapa yakin model akustiknya.
"""
import json, re, threading
from difflib import SequenceMatcher
from core import ROOT

VOSK_DIR = ROOT / 'models' / 'vosk-id'
MODEL_NAME = 'Vosk Kaldi model-id-id (bookbot, ujaran anak)'
RATE = 16000
_model = None
_vocab = None
_lock = threading.Lock()
VOWELS = set('aiueo')
DIGRAPHS = ('ng', 'ny', 'sy', 'kh')


def vosk_ready():
    return (VOSK_DIR / 'am' / 'final.mdl').exists()


def _load():
    global _model, _vocab
    with _lock:
        if _model is None:
            if not vosk_ready():
                raise RuntimeError('Model pelafalan lokal belum tersedia.')
            from vosk import Model, SetLogLevel
            SetLogLevel(-1)
            _model = Model(str(VOSK_DIR))
            with open(VOSK_DIR / 'graph' / 'words.txt', encoding='utf-8') as f:
                _vocab = sorted({w for w in (line.split()[0] for line in f if line.strip()) if re.fullmatch(r'[a-z]+', w)})
    return _model


def decode_pcm(path):
    """Ubah berkas audio apa pun (webm/ogg/mp4/wav) menjadi PCM 16 kHz mono s16le."""
    import av
    out = bytearray()
    with av.open(path) as container:
        stream = next(s for s in container.streams if s.type == 'audio')
        resampler = av.AudioResampler(format='s16', layout='mono', rate=RATE)
        for frame in container.decode(stream):
            for f in resampler.resample(frame):
                out += f.to_ndarray().tobytes()
        for f in resampler.resample(None):
            out += f.to_ndarray().tobytes()
    return bytes(out)


def recognize(pcm, grammar=None):
    from vosk import KaldiRecognizer
    model = _load()
    rec = KaldiRecognizer(model, RATE, json.dumps(grammar, ensure_ascii=False)) if grammar else KaldiRecognizer(model, RATE)
    rec.SetWords(True)
    words = []
    for i in range(0, len(pcm), 8000):
        if rec.AcceptWaveform(pcm[i:i + 8000]):
            words += json.loads(rec.Result()).get('result', [])
    words += json.loads(rec.FinalResult()).get('result', [])
    return [{'word': w['word'], 'conf': round(float(w['conf']), 3), 'start': round(w['start'], 3), 'end': round(w['end'], 3)} for w in words]


def tokens(text):
    return re.findall(r'[a-z]+', text.lower().replace('-', ' '))


def syllables(word):
    """Pemenggalan suku kata Bahasa Indonesia sederhana (V-CV, VC-CV, VCC-CV)."""
    units, i = [], 0
    while i < len(word):
        if word[i:i + 2] in DIGRAPHS:
            units.append(word[i:i + 2]); i += 2
        else:
            units.append(word[i]); i += 1
    nuclei = [k for k, u in enumerate(units) if u in VOWELS]
    if len(nuclei) < 2:
        return [word] if word else []
    cuts = []
    for a, b in zip(nuclei, nuclei[1:]):
        gap = b - a - 1
        cuts.append(b if gap == 0 else b - 1)
    parts, start = [], 0
    for c in cuts:
        parts.append(''.join(units[start:c])); start = c
    parts.append(''.join(units[start:]))
    return [p for p in parts if p]


def competitors(target, limit=12):
    """Kata kosakata model yang bunyinya paling mirip dengan target (pesaing pilihan-paksa)."""
    from rapidfuzz import process, distance
    _load()
    pool = [w for w in _vocab if abs(len(w) - len(target)) <= 2 and w != target]
    found = process.extract(target, pool, scorer=distance.Levenshtein.distance, limit=limit, score_cutoff=2)
    return [w for w, _, _ in found]


def syllable_feedback(target, heard):
    """Tandai suku kata target yang hurufnya tidak cocok dengan yang terdengar."""
    flat = target.replace(' ', '')
    bad = set()
    if heard:
        for tag, i1, i2, _, _ in SequenceMatcher(None, flat, heard.replace(' ', ''), autojunk=False).get_opcodes():
            if tag != 'equal':
                bad.update(range(i1, max(i2, i1 + 1)))
    else:
        bad = set(range(len(flat)))
    result, pos = [], 0
    for word in target.split():
        for s in syllables(word):
            span = set(range(pos, pos + len(s)))
            result.append({'text': s, 'ok': not (span & bad)})
            pos += len(s)
    return result


def assess(path, target_text):
    target_tokens = tokens(target_text)
    if not target_tokens:
        raise ValueError('Kata tidak valid.')
    target = ' '.join(target_tokens)
    pcm = decode_pcm(path)
    duration = len(pcm) / 2 / RATE
    free = recognize(pcm)
    heard = ' '.join(w['word'] for w in free)
    _load()
    in_vocab = all(t in _vocab for t in target_tokens)
    forced = None
    if in_vocab and free:
        options = [target]
        if len(target_tokens) == 1:
            options += competitors(target)
        else:
            # Frasa/kata ulang: ganti satu kata per posisi dengan pesaingnya, plus potongan sebagian.
            for k, tok in enumerate(target_tokens):
                for alt in competitors(tok, limit=4):
                    options.append(' '.join(target_tokens[:k] + [alt] + target_tokens[k + 1:]))
            options += [t for t in dict.fromkeys(target_tokens)]
            options = list(dict.fromkeys(options))[:30]
        result = recognize(pcm, options)
        said = ' '.join(w['word'] for w in result)
        if result:
            forced = {'winner': said, 'target_won': said == target, 'confidence': round(sum(w['conf'] for w in result) / len(result) * 100, 1), 'competitors': options[1:]}
    similarity = round(SequenceMatcher(None, target.replace(' ', ''), heard.replace(' ', ''), autojunk=False).ratio() * 100, 1) if heard else None
    if not heard:
        score = None
    elif forced:
        acoustic = forced['confidence'] if forced['target_won'] else 0
        score = round(0.35 * similarity + 0.65 * acoustic, 1)
    else:
        score = similarity
    verdict = None if score is None else 'tepat' if score >= 85 else 'hampir' if score >= 60 else 'latihan'
    return {
        'target': target, 'transcript': heard, 'words': free, 'duration': round(duration, 2),
        'score': score, 'verdict': verdict, 'similarity': similarity,
        'forced_choice': forced, 'in_vocabulary': in_vocab,
        'syllables': syllable_feedback(target, target if verdict == 'tepat' else heard),
        'model': MODEL_NAME,
    }


def word_confidence(path, reference):
    """Kepercayaan akustik per kata bacaan (untuk sesi membaca) dari dekode bebas Vosk."""
    import jiwer
    from analytics import normalize
    words = recognize(decode_pcm(path))
    hyp = [w['word'] for w in words]
    # Indeks mengikuti normalize(reference).split() agar sejalan dengan anotasi analytics.align;
    # kata ulang seperti "kupu-kupu" dipecah untuk Vosk lalu digabung kembali.
    ref, origin = [], []
    for i, word in enumerate(normalize(reference).split()):
        for part in tokens(word):
            ref.append(part); origin.append(i)
    if not ref or not hyp:
        return {'model': MODEL_NAME, 'transcript': ' '.join(hyp), 'words': [], 'mean_confidence': None, 'weak_words': []}
    out = jiwer.process_words(' '.join(ref), ' '.join(hyp))
    per_word = {}
    for chunk in out.alignments[0]:
        if chunk.type == 'equal':
            for k in range(chunk.ref_end_idx - chunk.ref_start_idx):
                i = origin[chunk.ref_start_idx + k]
                per_word[i] = min(per_word.get(i, 1.0), words[chunk.hyp_start_idx + k]['conf'])
    original = normalize(reference).split()
    matched = [{'index': i, 'word': original[i], 'conf': round(c, 3)} for i, c in sorted(per_word.items())]
    mean = round(sum(m['conf'] for m in matched) / len(matched) * 100, 1) if matched else None
    weak = sorted([m for m in matched if m['conf'] < 0.6], key=lambda m: m['conf'])[:10]
    return {'model': MODEL_NAME, 'transcript': ' '.join(hyp), 'words': matched, 'mean_confidence': mean, 'weak_words': weak}
