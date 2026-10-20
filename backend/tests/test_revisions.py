"""Regresi untuk revisi: TTS Piper, pelafalan Vosk (bookbot), analisis tatapan per kata,
kejelasan pelafalan di sesi membaca, game Ikuti Kata, dan integrasi dashboard/laporan.

Jalankan terhadap backend lokal: REACT_APP_BACKEND_URL=http://127.0.0.1:8001 pytest tests/test_revisions.py
"""
import json
import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL not set")
    s = requests.Session()
    email = f"rev.teacher.{uuid.uuid4().hex[:10]}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "Rev Teacher", "email": email, "password": "RevPass123!", "role": "teacher"}, timeout=30)
    assert r.status_code == 200, r.text
    s.headers["Authorization"] = "Bearer " + r.json()["token"]
    return s


def tts(client, text):
    r = client.get(f"{API}/speech/synthesize", params={"text": text}, timeout=60)
    assert r.status_code == 200 and r.content[:4] == b"RIFF", r.text[:200]
    return r.content


@pytest.fixture(scope="module")
def entities(client):
    student = client.post(f"{API}/students", json={"alias": "Rev Pembaca", "grade": 2}, timeout=30).json()
    text = client.get(f"{API}/texts", timeout=30).json()[0]
    return student, text


def test_health_reports_local_models(client):
    h = client.get(f"{API}/health", timeout=30).json()
    assert h["speech_model"] == "ready"
    assert h["pronunciation_model"] == "ready"
    assert h["tts"].startswith("piper")


def test_tts_uses_piper(client):
    r = client.get(f"{API}/speech/synthesize", params={"text": "kupu-kupu"}, timeout=60)
    assert r.status_code == 200
    assert r.headers["content-type"] == "audio/wav"
    assert r.headers.get("x-tts-engine", "").startswith("piper")
    assert len(r.content) > 5000


def test_pronunciation_correct_word_scores_higher_than_wrong_word(client):
    good = client.post(f"{API}/pronunciation", data={"word": "apel", "consent": "true"}, files={"audio": ("a.wav", tts(client, "apel"))}, timeout=120).json()
    bad = client.post(f"{API}/pronunciation", data={"word": "apel", "consent": "true"}, files={"audio": ("b.wav", tts(client, "mawar"))}, timeout=120).json()
    ga, ba = good["assessment"], bad["assessment"]
    assert ga["model"].startswith("Vosk")
    assert ga["score"] is not None and ga["verdict"] in ("tepat", "hampir")
    assert [s["text"] for s in ga["syllables"]] == ["a", "pel"]
    assert ga["forced_choice"]["competitors"]
    assert ba["score"] is None or ba["score"] < ga["score"]


def test_pronunciation_reduplicated_word_uses_competitors(client):
    r = client.post(f"{API}/pronunciation", data={"word": "kupu-kupu", "consent": "true"}, files={"audio": ("k.wav", tts(client, "kupu-kupu"))}, timeout=120).json()
    a = r["assessment"]
    assert a["target"] == "kupu kupu"
    assert [s["text"] for s in a["syllables"]] == ["ku", "pu", "ku", "pu"]
    if a["forced_choice"]:
        assert len(a["forced_choice"]["competitors"]) > 0


def _layout(words):
    boxes = [{"i": i, "text": w, "x": (i % 7) * 0.14, "y": (i // 7) * 0.16, "w": 0.12, "h": 0.1, "line": i // 7} for i, w in enumerate(words)]
    return boxes


def _gaze(boxes, skip=(), regress_at=None):
    pts, t = [], 0.0
    for b in boxes:
        if b["i"] in skip:
            continue
        for k in range(6):
            pts.append({"x": b["x"] + 0.06 + 0.002 * k, "y": b["y"] + 0.05, "t": round(t, 3)}); t += 0.05
        t += 0.04
        if b["i"] == regress_at:
            prev = boxes[b["i"] - 2]
            for k in range(6):
                pts.append({"x": prev["x"] + 0.06, "y": prev["y"] + 0.05, "t": round(t, 3)}); t += 0.05
            t += 0.04
    return pts, t


def test_gaze_session_word_level_analysis_review_report(client, entities):
    student, text = entities
    words = text["content"].split(" ")
    boxes = _layout(words)
    pts, duration = _gaze(boxes, skip={3, 12}, regress_at=9)
    payload = {"student_id": student["id"], "text_id": text["id"], "consent": True, "mode": "gaze", "duration": duration,
               "gaze_points": pts, "layouts": [{"t": 0, "width": 820, "height": 420, "words": boxes}],
               "calibration": {"median_error": 0.08, "validation_samples": 40, "passed": True}}
    r = client.post(f"{API}/sessions", data={"payload": json.dumps(payload)}, timeout=120)
    assert r.status_code == 200, r.text
    s = r.json(); m = s["metrics"]; g = m["gaze"]
    assert m["gaze_usable"] is True
    assert m["fixations"] >= len(words) - 2
    assert g["regressions_within_line"] == 1
    assert g["skipped_words_percent"] == round(2 / len(words) * 100, 1)
    assert g["reading_order_percent"] > 80
    assert g["longest_dwell"] and all(ch.isalnum() or ch == "-" for ch in g["longest_dwell"][0]["word"])
    assert g["scanpath"] and g["line_timeline"]
    # Koreksi transkrip menghitung ulang tanpa menghilangkan analisis tatapan.
    rv = client.patch(f"{API}/sessions/{s['id']}/review", json={"transcript": text["content"], "note": "uji"}, timeout=60).json()
    assert rv["metrics"]["accuracy"] == 100.0
    assert rv["metrics"]["gaze"]["regressions_within_line"] == 1
    pdf = client.get(f"{API}/sessions/{s['id']}/report", timeout=60)
    assert pdf.status_code == 200 and pdf.content[:4] == b"%PDF"
    # Dashboard memuat sesi tanpa data mentah yang berat.
    d = client.get(f"{API}/dashboard", timeout=30).json()
    row = next(x for x in d["sessions"] if x["id"] == s["id"])
    assert "layouts" not in row and "scanpath" not in row["metrics"]["gaze"]
    assert client.delete(f"{API}/sessions/{s['id']}", timeout=30).status_code == 200


def test_uncalibrated_gaze_is_analyzed_but_flagged(client, entities):
    student, text = entities
    boxes = _layout(text["content"].split(" "))
    pts, duration = _gaze(boxes)
    payload = {"student_id": student["id"], "text_id": text["id"], "consent": True, "mode": "gaze", "duration": duration,
               "gaze_points": pts, "layouts": [{"t": 0, "width": 820, "height": 420, "words": boxes}],
               "calibration": {"median_error": 0.3, "validation_samples": 30, "passed": False}}
    s = client.post(f"{API}/sessions", data={"payload": json.dumps(payload)}, timeout=120).json()
    assert s["metrics"]["gaze_usable"] is False and s["metrics"]["gaze_analyzable"] is True
    assert s["metrics"]["gaze"]["words_fixated_percent"] == 100.0
    client.delete(f"{API}/sessions/{s['id']}", timeout=30)


def test_invalid_layout_rejected(client, entities):
    student, text = entities
    payload = {"student_id": student["id"], "text_id": text["id"], "consent": True, "mode": "gaze", "duration": 5,
               "layouts": [{"t": 0, "width": 800, "height": 400, "words": [{"i": 0, "text": "x", "x": 99, "y": 0, "w": 0.1, "h": 0.1, "line": 0}]}]}
    r = client.post(f"{API}/sessions", data={"payload": json.dumps(payload)}, timeout=30)
    assert r.status_code == 422


def test_reading_session_audio_gets_pronunciation_clarity(client, entities):
    student, text = entities
    audio = tts(client, " ".join(text["content"].split(" ")[:12]))
    payload = {"student_id": student["id"], "text_id": text["id"], "consent": True, "mode": "speech", "duration": 6}
    s = client.post(f"{API}/sessions", data={"payload": json.dumps(payload)}, files={"audio": ("r.wav", audio)}, timeout=300).json()
    pron = s["metrics"]["pronunciation"]
    assert s["transcript"]
    assert pron and pron["model"].startswith("Vosk") and pron["mean_confidence"] is not None
    assert all("index" in w and "conf" in w for w in pron["words"])
    client.delete(f"{API}/sessions/{s['id']}", timeout=30)


def test_gaze_game_levels_finish_and_dashboard_practices(client):
    levels = client.get(f"{API}/games/gaze/levels", timeout=30).json()
    assert [l["level"] for l in levels] == [1, 2, 3] and all(len(l["sentences"]) == 3 for l in levels)
    words = [{"word": w, "hit": i != 2, "dwell_ms": 700, "time_ms": 1200 + i * 100} for i, w in enumerate(levels[0]["sentences"][0].split())]
    r = client.post(f"{API}/games/gaze/finish", json={"level": 1, "score": 50, "words": words, "calibration_error": 0.1, "duration": 30}, timeout=30)
    assert r.status_code == 200
    g = r.json()
    assert g["kind"] == "gaze_game" and g["words_hit"] == len(words) - 1
    d = client.get(f"{API}/dashboard", timeout=30).json()
    kinds = {p["kind"] for p in d["practices"]}
    assert "gaze_game" in kinds and "pronunciation" in kinds
    assert all("words" not in p for p in d["practices"])
    bad = client.post(f"{API}/games/gaze/finish", json={"level": 9, "score": 1, "words": [], "duration": 1}, timeout=30)
    assert bad.status_code == 422


def test_cleanup_student(client, entities):
    student, _ = entities
    assert client.delete(f"{API}/students/{student['id']}", timeout=30).status_code == 200
