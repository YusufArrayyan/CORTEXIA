"""Live adaptation of BAHANA fluency definitions for Indonesian reading."""
import math
import re
import unicodedata
from itertools import groupby

RATE = 16000
FRAME_MS = 20
GAP_FILL_MS = 100
MIN_SPEECH_MS = 60
PAUSE_MS = 250
LONG_PAUSE_MS = 500
EPS = 0.000002


def unavailable(flag=None):
    return dict(method_version="bahana-id-v1", transcript_source="asr_original",
                syllable_method="id_orthographic_vowels_v1", qc_flags=[flag] if flag else [],
                wpm=None, articulation_rate_syllables_per_sec=None, mlr_syllables_per_run=None,
                pause_frequency_per_min=None, mean_pause_duration_sec=None)


def segments(pcm):
    import webrtcvad
    vad = webrtcvad.Vad(2)
    size = RATE * FRAME_MS // 1000 * 2
    # Only complete frames are classified; retain their original audio offsets.
    frames = (vad.is_speech(pcm[i:i+size], RATE) for i in range(0, len(pcm)-size+1, size))
    regions = []
    start = 0
    for active, group in groupby(frames):
        end = start + sum(1 for _ in group) * FRAME_MS
        if active:
            if regions and start - regions[-1][1] <= GAP_FILL_MS:
                regions[-1][1] = end
            else:
                regions.append([start, end])
        start = end
    return [(a / 1000, b / 1000) for a, b in regions if b-a >= MIN_SPEECH_MS]


def tokens(text):
    return re.findall(r"[\w]+(?:'[\w]+)?", unicodedata.normalize("NFKC", text).lower())


def measure(pcm, transcript, words):
    result = unavailable()
    regions = segments(pcm)
    if not regions:
        return unavailable("NO_VAD_SPEECH")
    span = regions[-1][1] - regions[0][0]
    speech = sum(b-a for a, b in regions)
    gaps = [c-b for (_, b), (c, _) in zip(regions, regions[1:]) if c-b >= PAUSE_MS/1000-EPS]
    result.update(utterance_duration_sec=round(span, 6), articulation_duration_sec=round(speech, 6),
                  long_pause_count=sum(g >= LONG_PAUSE_MS/1000-EPS for g in gaps),
                  run_count=len(gaps)+1, pause_frequency_per_min=round(60*len(gaps)/span, 6),
                  mean_pause_duration_sec=round(sum(gaps)/len(gaps), 6) if gaps else None)
    flags = result["qc_flags"]
    lexical = tokens(transcript)
    if not words or not lexical:
        flags.append("EMPTY_WORD_TIMESTAMPS")
        return result
    if tokens(" ".join(w["word"] for w in words)) != lexical:
        flags.append("WORD_TEXT_MISMATCH")
    duration = len(pcm)/(2*RATE)
    prev = 0
    covered = total = 0
    j = 0
    for word in words:
        a, b = word.get("start"), word.get("end")
        if not all(isinstance(v, (int,float)) and not isinstance(v,bool) and math.isfinite(v) for v in (a,b)) or not (0 <= a < b <= duration+EPS) or a < prev-EPS:
            flags.append("INVALID_WORD_TIME")
            return result
        prev = b
        total += b-a
        while j < len(regions) and regions[j][1] <= a:
            j += 1
        k = j
        while k < len(regions) and regions[k][0] < b:
            covered += max(0, min(b, regions[k][1])-max(a, regions[k][0]))
            k += 1
    if flags:
        return result
    if words[0]["start"] < regions[0][0]-.25 or prev > regions[-1][1]+.25:
        flags.append("WORD_OUTSIDE_VAD_BOUNDARY_GT_250MS")
    if covered/total < .8:
        flags.append("WORD_VAD_OVERLAP_LT_80PCT")
    if len(lexical) <= 1:
        flags.append("ONE_WORD_OR_LESS")
    result["wpm"] = round(60*len(lexical)/span, 6)
    # Orthographic proxy only: each written vowel is one nucleus. Diphthongs,
    # abbreviations and loanwords can differ from the actual spoken syllables.
    counts = [len(re.findall("[aiueo]", w)) if re.fullmatch("[a-z]+", w) else 0 for w in lexical]
    if all(counts):
        result.update(articulation_rate_syllables_per_sec=round(sum(counts)/speech, 6),
                      mlr_syllables_per_run=round(sum(counts)/(len(gaps)+1), 6))
    else:
        flags.append("SYLLABLE_COUNT_UNAVAILABLE")
    return result
