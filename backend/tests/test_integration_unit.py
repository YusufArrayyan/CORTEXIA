"""Prioritas 5 — uji unit integrasi: sanitasi NaN/Infinity, isolasi kegagalan, kontrak keluaran analyze."""
import json
import math
import os
import sys
import asyncio

import numpy as np
os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "cortexia_unit")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import analytics  # noqa: E402
from auth import InvitationInput  # noqa: E402
from content import StudentInput  # noqa: E402
from analytics import analyze, sanitize  # noqa: E402

REF = "Rani pergi ke taman bunga, lalu duduk di bangku."
CAL_OK = {"median_error": 0.08, "validation_samples": 40, "passed": True}

# Kunci yang dipakai frontend (Results.jsx, Dashboard.jsx, laporan PDF) — tidak boleh hilang.
TOP_KEYS = {"metrics", "profile", "quality", "quality_reasons", "recommendations", "profile_method", "confidence", "limitations"}
METRIC_KEYS = {"accuracy", "wer", "wpm", "substitutions", "deletions", "insertions", "annotations", "on_text_percent",
               "gaze_coverage", "gaze_usable", "gaze_samples", "fixations", "mean_fixation_ms", "regressions", "gaze",
               "asr_confidence", "asr_uncertain_words", "speech_reliable", "pronunciation", "multimodal", "speech_error"}


def words(text, prob=0.9):
    return [{"word": w, "start": i * 0.6, "end": i * 0.6 + 0.4, "probability": prob} for i, w in enumerate(text.split())]


def all_floats(obj):
    if isinstance(obj, dict):
        for v in obj.values():
            yield from all_floats(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from all_floats(v)
    elif isinstance(obj, float):
        yield obj


def test_sanitize_replaces_non_finite_and_numpy_types():
    clean, bad = sanitize({"a": float("nan"), "b": [1.0, float("inf"), np.float64(2.5), np.int64(3)], "c": {"d": -float("inf")}, "e": True})
    assert bad == 3
    assert clean == {"a": None, "b": [1.0, None, 2.5, 3], "c": {"d": None}, "e": True}
    assert type(clean["b"][3]) is int


def test_analyze_output_keeps_api_contract():
    r = analyze(REF, REF, 8, [], {}, words(REF))
    assert TOP_KEYS <= set(r) and METRIC_KEYS <= set(r["metrics"])
    assert {"basis", "agreement_words", "concordance", "pattern", "explanation"} <= set(r["metrics"]["multimodal"])
    assert r["analysis_warnings"] == []


def test_analyze_output_is_json_and_finite():
    pts = [{"x": 0.5, "y": 0.5, "t": round(i * 0.1, 3)} for i in range(80)]
    r = analyze(REF, REF, 8, pts, CAL_OK, words(REF), layouts=[{"t": 0, "width": 800, "height": 400, "words": [
        {"i": i, "text": w, "x": 0.1 * i, "y": 0.45, "w": 0.09, "h": 0.1, "line": 0} for i, w in enumerate(REF.split())]}])
    json.dumps(r, allow_nan=False)
    assert all(math.isfinite(v) for v in all_floats(r))


def test_non_finite_pronunciation_values_are_not_stored_as_valid():
    pron = {"mean_confidence": float("nan"), "weak_words": [], "words": []}
    r = analyze(REF, REF, 8, [], {}, words(REF), pronunciation=pron)
    assert r["metrics"]["pronunciation"]["mean_confidence"] is None
    assert any("NaN/Infinity" in w for w in r["analysis_warnings"])


def test_gaze_failure_keeps_speech_result(monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("rusak")
    monkeypatch.setattr(analytics, "gaze_metrics", boom)
    r = analyze(REF, REF, 8, [{"x": 0.5, "y": 0.5, "t": 0.1}], CAL_OK, words(REF))
    assert r["metrics"]["speech_reliable"] and r["metrics"]["accuracy"] == 100.0
    assert r["metrics"]["gaze_usable"] is False and r["quality"] == "parsial"
    assert any("tatapan gagal" in w for w in r["analysis_warnings"])


def test_speech_failure_keeps_gaze_result():
    pts = [{"x": 0.5, "y": 0.5, "t": round(i * 0.1, 3)} for i in range(80)]
    r = analyze(REF, "", 8, pts, CAL_OK, [], speech_error="Audio tidak dapat dianalisis.")
    assert r["metrics"]["gaze_usable"] and r["metrics"]["accuracy"] is None
    assert r["quality"] == "parsial" and r["metrics"]["modalities_passed"] == ["tatapan"]
    assert r["metrics"]["multimodal"]["basis"] == "tatapan saja"


def test_student_invitation_code_is_trimmed_and_case_insensitive():
    assert InvitationInput(code="  aBcD-1234  ").code == "ABCD-1234"


def test_student_profile_input_has_no_invitation_field():
    assert StudentInput(alias="Pembaca", grade=1).model_dump() == {"alias": "Pembaca", "grade": 1}
    assert set(StudentInput.model_fields) == {"alias", "grade"}
