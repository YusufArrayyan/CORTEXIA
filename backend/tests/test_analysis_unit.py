"""Uji unit analisis tanpa server: keyakinan transkrip, alasan kualitas, dan fusi suara + tatapan."""
import os
import sys

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "cortexia_unit")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analytics import analyze, display_to_reference, fuse  # noqa: E402

REF = "Rani pergi ke taman bunga, lalu duduk di bangku."


def words(text, prob):
    return [{"word": w, "start": i * 0.6, "end": i * 0.6 + 0.4, "probability": prob} for i, w in enumerate(text.split())]


def test_confident_transcript_is_reliable():
    r = analyze(REF, REF, 8, [], {}, words(REF, 0.9))
    m = r["metrics"]
    assert m["asr_confidence"] == 90.0 and m["speech_reliable"]
    assert r["quality"] == "parsial"  # suara layak, tatapan tidak ada
    assert r["quality_reasons"][0].startswith("Suara memadai")
    assert "Tatapan belum memadai" in r["quality_reasons"][1]
    assert m["multimodal"]["basis"] == "suara saja"


def test_low_confidence_transcript_needs_review():
    r = analyze(REF, REF, 8, [], {}, words(REF, 0.3))
    m = r["metrics"]
    assert not m["speech_reliable"] and len(m["asr_uncertain_words"]) == len(REF.split())
    assert "perlu ditinjau" in r["quality_reasons"][0]
    assert any("kurang yakin" in x for x in r["recommendations"])


def test_reviewed_transcript_skips_confidence():
    r = analyze(REF, REF, 8, [], {}, words(REF, 0.3), reviewed=True)
    assert r["metrics"]["speech_reliable"] and r["metrics"]["asr_confidence"] is None


def test_speech_error_keeps_session_with_reason():
    r = analyze(REF, "", 8, [], {}, [], speech_error="Model transkripsi belum tersedia di server.")
    assert r["quality"] == "tidak_cukup"
    assert r["quality_reasons"][0] == "Suara tidak dianalisis: Model transkripsi belum tersedia di server."
    assert any("hanya berdasarkan tatapan" in x for x in r["recommendations"])


def test_display_tokens_map_to_reference_words():
    mapping = display_to_reference("Anak-anak bermain, lalu — pulang.")
    assert mapping == {0: [0], 1: [1], 2: [2], 3: [], 4: [3]}


def test_fusion_flags_words_hard_in_both_modalities():
    # "taman" (indeks 3) dan "bunga" (4) salah diucap; tatapan lama di keduanya.
    m = {
        "accuracy": 70, "wer": 30, "wpm": 80, "on_text_percent": 90, "gaze_usable": True,
        "annotations": [{"index": i, "type": "substitute" if i in (3, 4) else "equal"} for i in range(9)],
        "gaze": {"regression_rate": 10, "skipped_words_percent": 5,
                 "words": [{"index": i, "ms": 900 if i in (3, 4) else 200, "visits": 1} for i in range(9)]},
    }
    out = fuse(REF, m, True)
    assert out["basis"] == "suara + tatapan"
    assert [w["word"] for w in out["agreement_words"]] == ["taman", "bunga"]
    assert out["concordance"] == 100.0
    assert out["pattern"].startswith("Kesulitan pengenalan kata")


def test_fusion_speech_errors_without_visual_difficulty():
    m = {
        "accuracy": 70, "wer": 30, "wpm": 80, "on_text_percent": 90, "gaze_usable": True,
        "annotations": [{"index": i, "type": "substitute" if i in (3, 4) else "equal"} for i in range(9)],
        "gaze": {"regression_rate": 10, "skipped_words_percent": 5,
                 "words": [{"index": i, "ms": 200, "visits": 1} for i in range(9)]},
    }
    out = fuse(REF, m, True)
    assert out["agreement_words"] == [] and out["concordance"] == 0.0
    assert out["pattern"].startswith("Kesalahan ucap tanpa hambatan visual")
