"""Prioritas 4 — uji unit fusi multimodal: quality gate suara, pemisahan WER/WPM, concordance, hasil parsial."""
import os
import sys

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "cortexia_unit")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analytics import analyze, fuse  # noqa: E402

REF = "Rani pergi ke taman bunga, lalu duduk di bangku."  # 9 kata
CAL_OK = {"median_error": 0.08, "validation_samples": 40, "passed": True}


def metrics(wer=30, wpm=80, errors=(3, 4), hard=(3, 4), on_text=90, regression=10, skipped=5):
    return {
        "accuracy": max(0, 100 - wer), "wer": wer, "wpm": wpm, "on_text_percent": on_text, "gaze_usable": True,
        "annotations": [{"index": i, "type": "substitute" if i in errors else "equal"} for i in range(9)],
        "gaze": {"regression_rate": regression, "skipped_words_percent": skipped,
                 "words": [{"index": i, "ms": 900 if i in hard else 200, "visits": 1} for i in range(9)]},
    }


def test_unreliable_speech_is_excluded_from_fusion():
    out = fuse(REF, metrics(), speech_reliable=False)
    assert out["basis"] == "tatapan saja" and not out["multimodal_complete"]
    assert out["speech_error_words"] == 0 and out["agreement_words"] == [] and out["concordance"] is None
    assert out["speech_excluded_reason"] == "transkrip otomatis belum andal"
    assert out["pattern"] is None and "transkrip otomatis belum andal" in out["explanation"]


def test_global_gaze_irregularity_does_not_claim_same_word_difficulty():
    # WER tinggi, tatapan tidak teratur secara global, tetapi kata sulit tatapan != kata salah ucap -> concordance 0%
    out = fuse(REF, metrics(wer=30, errors=(3, 4), hard=(7,), on_text=50), True)
    assert out["concordance"] == 0.0 and out["concordant"] is False
    assert not out["pattern"].startswith("Kesulitan pengenalan kata")
    assert out["pattern"].startswith("Kesalahan ucap dan alur visual tidak teratur")
    assert "50" in out["explanation"] and "0" in out["explanation"]


def test_concordance_threshold_boundary():
    # 5 kata salah; 2 juga sulit ditatap -> 40% (lolos), 1 -> 20% (tidak)
    at = fuse(REF, metrics(errors=(0, 1, 2, 3, 4), hard=(0, 1)), True)
    below = fuse(REF, metrics(errors=(0, 1, 2, 3, 4), hard=(0,)), True)
    assert at["concordance"] == 40.0 and at["concordant"] and at["pattern"].startswith("Kesulitan pengenalan kata")
    assert below["concordance"] == 20.0 and not below["concordant"]
    assert below["pattern"] == "Kesalahan ucap tanpa hambatan visual yang jelas"


def test_slow_but_accurate_is_not_called_word_recognition_difficulty():
    out = fuse(REF, metrics(wer=0, wpm=40, errors=(), hard=(3,), on_text=50), True)
    assert out["signals"]["word_accuracy_low"] is False and out["signals"]["fluency_low"] is True
    assert out["pattern"] == "Bacaan lambat dengan alur visual tidak teratur"
    out = fuse(REF, metrics(wer=0, wpm=40, errors=(), hard=()), True)
    assert out["pattern"] == "Bacaan lambat tanpa hambatan visual yang jelas"


def test_inaccurate_speech_with_regular_gaze():
    out = fuse(REF, metrics(wer=30, wpm=80, errors=(3, 4), hard=()), True)
    assert out["pattern"] == "Kesalahan ucap tanpa hambatan visual yang jelas" and "WER 30" in out["explanation"]


def test_fluent_both_modalities():
    out = fuse(REF, metrics(wer=0, wpm=90, errors=(), hard=()), True)
    assert out["pattern"] == "Suara dan tatapan sama-sama lancar" and out["concordance"] is None


def test_dwell_rule_safe_with_zero_median():
    m = metrics()
    m["gaze"]["words"] = [{"index": i, "ms": 0, "visits": 1} for i in range(9)]
    out = fuse(REF, m, True)
    assert out["gaze_difficult_words"] == 0 and out["concordance"] == 0.0


def test_no_modality():
    m = {"accuracy": None, "gaze_usable": False, "gaze": None}
    out = fuse(REF, m, False)
    assert out["basis"] == "tidak ada" and out["pattern"] is None


# ---------- kualitas & profil dari analyze ----------

def low_conf_words(text):
    return [{"word": w, "start": i * 0.6, "end": i * 0.6 + 0.4, "probability": 0.3} for i, w in enumerate(text.split())]


def test_quality_tidak_cukup_when_no_modality_passes():
    r = analyze(REF, "Rani pergi ke taman lalu duduk di bantal", 8, [], {}, low_conf_words(REF))
    assert r["quality"] == "tidak_cukup" and r["metrics"]["modalities_passed"] == []
    assert r["profile"] == "Data belum cukup" and "Koreksi transkripsi" in r["recommendations"][0]


def test_unreliable_high_wer_does_not_drive_profile():
    pts = [{"x": 0.5, "y": 0.5, "t": round(i * 0.1, 3)} for i in range(80)]
    r = analyze(REF, "Rani pergi ke taman lalu duduk di bantal", 8, pts, CAL_OK, low_conf_words(REF))
    assert r["quality"] == "parsial" and r["metrics"]["modalities_passed"] == ["tatapan"]
    assert r["profile"] != "Latihan ketepatan kata"
    assert r["metrics"]["multimodal"]["basis"] == "tatapan saja"
    assert r["metrics"]["wer"] is not None  # metrik tetap ditampilkan untuk kompatibilitas API


def test_reviewed_transcript_restores_speech_profile_with_reason():
    r = analyze(REF, "Rani pergi ke taman lalu duduk di bantal", 8, [], {}, low_conf_words(REF), reviewed=True)
    assert r["quality"] == "parsial" and r["metrics"]["modalities_passed"] == ["suara"]
    assert r["profile"] == "Latihan ketepatan kata" and "WER" in r["profile_reason"] and "ditinjau" in r["profile_reason"]


def test_exclusion_reason_matches_cause():
    pts = [{"x": 0.5, "y": 0.5, "t": round(i * 0.1, 3)} for i in range(40)]
    short = analyze(REF, "Rani pergi ke taman", 3, pts, CAL_OK, low_conf_words(REF), reviewed=True)
    f = short["metrics"]["multimodal"]
    assert f["speech_excluded_reason"].startswith("rekaman suara terlalu pendek") and "koreksi transkripsi" not in f["explanation"]
    unsure = analyze(REF, REF, 8, pts, CAL_OK, low_conf_words(REF))
    f = unsure["metrics"]["multimodal"]
    assert f["speech_excluded_reason"] == "transkrip otomatis belum andal" and "koreksi transkripsi" in f["explanation"]


def test_pronunciation_and_gaze_agree_on_reference_index():
    m = metrics(errors=(), hard=(3,))
    m["pronunciation"] = {"words": [
        {"index": 3, "conf": 0.42}, {"index": 4, "conf": 0.32}, {"index": 5, "conf": 0.99}
    ]}
    combined = fuse(REF, m, True)
    assert combined["pronunciation_gaze_words"] == [{"index": 3, "word": "taman", "conf": 0.42}]
    assert combined["speech_error_words"] == 0
    assert fuse(REF, m, False)["pronunciation_gaze_words"] == []


def test_observations_align_insertions_and_repeated_words():
    from analytics import word_observations
    words = [dict(word=w, start=i, end=i+.25) for i,w in enumerate("aku eh baca aku".split())]
    gaze = [dict(index=2, ms=450, first_fixation_ms=150, first_visit_ms=300, first_visit_fixations=2)]
    rows = word_observations("aku baca aku", "aku eh baca aku", words, gaze, 4)
    assert len(rows) == 1 and rows[0]["display_index"] == 2
    assert rows[0]["word"] == "aku" and rows[0]["asr_word_duration_ms"] == 250
    words[-1]["end"] = 5
    assert word_observations("aku baca aku", "aku eh baca aku", words, gaze, 4) == []


def test_first_visit_excludes_time_after_return():
    from analytics import gaze_metrics
    positions = [0.1]*10 + [0.8]*10 + [0.1]*10
    points = [{"x":x, "y":0.5, "t":i/10} for i,x in enumerate(positions)]
    layout = {"t":0, "width":900, "height":500, "words":[
        {"i":i, "text":word, "x":x, "y":.45, "w":.1, "h":.1, "line":0}
        for i,(word,x) in enumerate([("aku",.05),("baca",.75)])]}
    measured = gaze_metrics(points, 3, CAL_OK, [layout])["gaze"]["words"][0]
    assert measured["visits"] == 2 and measured["first_visit_fixations"] == 1
    assert measured["first_fixation_ms"] == measured["first_visit_ms"] == 900
    assert measured["ms"] == 1800
