"""Integration regression tests for critical CORTEXIA backend modules.

Coverage focus:
- health/auth/authorization
- students/texts/sessions ownership controls
- speech/pronunciation/games flows
- research stats and training endpoints
"""

import io
import os
import time
import uuid

import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API_BASE = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def ensure_base_url():
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL not set")


@pytest.fixture(scope="session")
def api_client(ensure_base_url):
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    return session


@pytest.fixture(scope="session")
def test_accounts(api_client):
    suffix = uuid.uuid4().hex[:8]
    teacher1 = {
        "name": "TEST Teacher One",
        "email": f"test.teacher1.{suffix}@example.com",
        "password": "TestPass123!",
        "role": "teacher",
    }
    teacher2 = {
        "name": "TEST Teacher Two",
        "email": f"test.teacher2.{suffix}@example.com",
        "password": "TestPass123!",
        "role": "teacher",
    }
    student_user = {
        "name": "TEST Student User",
        "email": f"test.student.{suffix}@example.com",
        "password": "TestPass123!",
        "role": "student",
    }

    created = {}
    for label, payload in {
        "teacher1": teacher1,
        "teacher2": teacher2,
        "student_user": student_user,
    }.items():
        resp = api_client.post(f"{API_BASE}/auth/register", json=payload, timeout=40)
        assert resp.status_code == 200, f"register failed for {label}: {resp.text}"
        data = resp.json()
        created[label] = {
            "payload": payload,
            "token": data["token"],
            "user": data["user"],
        }

    yield created

    # best-effort logout (user records persist; documented in test report)
    for account in created.values():
        api_client.post(
            f"{API_BASE}/auth/logout",
            headers={"Authorization": f"Bearer {account['token']}"},
            timeout=30,
        )


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_health_ready(api_client):
    response = api_client.get(f"{API_BASE}/health", timeout=30)
    assert response.status_code == 200
    body = response.json()
    assert body["database"] == "connected"
    assert body["speech_model"] == "ready"


def test_unauthorized_request_denied(api_client):
    response = api_client.get(f"{API_BASE}/students", timeout=30)
    assert response.status_code == 401


def test_duplicate_email_registration_blocked(api_client, test_accounts):
    payload = test_accounts["teacher1"]["payload"]
    response = api_client.post(f"{API_BASE}/auth/register", json=payload, timeout=30)
    assert response.status_code == 409


def test_login_wrong_password_rejected(api_client, test_accounts):
    payload = {
        "email": test_accounts["teacher1"]["payload"]["email"],
        "password": "WrongPass123!",
    }
    response = api_client.post(f"{API_BASE}/auth/login", json=payload, timeout=30)
    assert response.status_code == 401


def test_student_role_cannot_access_teacher_endpoints(api_client, test_accounts):
    token = test_accounts["student_user"]["token"]
    text_payload = {"title": "TEST text", "content": "konten belajar sederhana", "level": 2}

    text_create = api_client.post(
        f"{API_BASE}/texts", json=text_payload, headers=auth_headers(token), timeout=30
    )
    audit_view = api_client.get(f"{API_BASE}/audit", headers=auth_headers(token), timeout=30)
    research_view = api_client.get(f"{API_BASE}/research", headers=auth_headers(token), timeout=60)

    assert text_create.status_code == 403
    assert audit_view.status_code == 403
    assert research_view.status_code == 403


@pytest.fixture(scope="session")
def teacher1_entities(api_client, test_accounts):
    token = test_accounts["teacher1"]["token"]
    student_payload = {"alias": "TEST Reader A", "grade": 3}
    text_payload = {
        "title": "TEST Cerita A",
        "content": "Ini teks pengujian untuk sesi membaca lokal.",
        "level": 3,
    }

    st_resp = api_client.post(
        f"{API_BASE}/students", json=student_payload, headers=auth_headers(token), timeout=30
    )
    tx_resp = api_client.post(
        f"{API_BASE}/texts", json=text_payload, headers=auth_headers(token), timeout=30
    )
    assert st_resp.status_code == 200, st_resp.text
    assert tx_resp.status_code == 200, tx_resp.text

    entities = {"student": st_resp.json(), "text": tx_resp.json(), "session_ids": []}
    yield entities

    # cleanup teacher-owned sessions first
    for sid in entities["session_ids"]:
        api_client.delete(
            f"{API_BASE}/sessions/{sid}", headers=auth_headers(token), timeout=30
        )
    api_client.delete(
        f"{API_BASE}/texts/{entities['text']['id']}", headers=auth_headers(token), timeout=30
    )
    api_client.delete(
        f"{API_BASE}/students/{entities['student']['id']}", headers=auth_headers(token), timeout=30
    )


def test_student_create_list_persist(api_client, test_accounts, teacher1_entities):
    token = test_accounts["teacher1"]["token"]
    response = api_client.get(f"{API_BASE}/students", headers=auth_headers(token), timeout=30)
    assert response.status_code == 200
    students = response.json()
    assert any(s["id"] == teacher1_entities["student"]["id"] for s in students)


def test_cross_user_cannot_delete_other_student(api_client, test_accounts, teacher1_entities):
    token = test_accounts["teacher2"]["token"]
    student_id = teacher1_entities["student"]["id"]
    response = api_client.delete(
        f"{API_BASE}/students/{student_id}", headers=auth_headers(token), timeout=30
    )
    assert response.status_code == 404


def test_cross_user_cannot_delete_other_text(api_client, test_accounts, teacher1_entities):
    token = test_accounts["teacher2"]["token"]
    text_id = teacher1_entities["text"]["id"]
    response = api_client.delete(
        f"{API_BASE}/texts/{text_id}", headers=auth_headers(token), timeout=30
    )
    assert response.status_code == 404


def test_speech_synthesis_returns_wav(api_client):
    response = api_client.get(
        f"{API_BASE}/speech/synthesize", params={"text": "selamat pagi"}, timeout=40
    )
    assert response.status_code == 200
    assert response.headers.get("content-type", "").startswith("audio/wav")
    assert len(response.content) > 200


def test_create_session_requires_consent(api_client, test_accounts, teacher1_entities):
    token = test_accounts["teacher1"]["token"]
    payload = {
        "student_id": teacher1_entities["student"]["id"],
        "text_id": teacher1_entities["text"]["id"],
        "consent": False,
        "mode": "speech",
        "duration": 8,
        "gaze_points": [],
        "calibration": {"median_error": None, "validation_samples": 0, "passed": False},
    }
    response = api_client.post(
        f"{API_BASE}/sessions",
        headers=auth_headers(token),
        data={"payload": __import__("json").dumps(payload)},
        timeout=50,
    )
    assert response.status_code == 400


def test_create_session_invalid_audio_returns_422(api_client, test_accounts, teacher1_entities):
    token = test_accounts["teacher1"]["token"]
    payload = {
        "student_id": teacher1_entities["student"]["id"],
        "text_id": teacher1_entities["text"]["id"],
        "consent": True,
        "mode": "speech",
        "duration": 7,
        "gaze_points": [],
        "calibration": {"median_error": None, "validation_samples": 0, "passed": False},
    }
    bad_audio = io.BytesIO(b"abc")
    files = {"audio": ("tiny.webm", bad_audio, "audio/webm")}
    response = api_client.post(
        f"{API_BASE}/sessions",
        headers=auth_headers(token),
        data={"payload": __import__("json").dumps(payload)},
        files=files,
        timeout=50,
    )
    assert response.status_code == 422


def test_create_session_with_generated_audio_and_review(api_client, test_accounts, teacher1_entities):
    token = test_accounts["teacher1"]["token"]
    wav = api_client.get(
        f"{API_BASE}/speech/synthesize", params={"text": "rani pergi ke taman"}, timeout=40
    )
    assert wav.status_code == 200

    payload = {
        "student_id": teacher1_entities["student"]["id"],
        "text_id": teacher1_entities["text"]["id"],
        "consent": True,
        "mode": "speech",
        "duration": 12,
        "gaze_points": [],
        "calibration": {"median_error": None, "validation_samples": 0, "passed": False},
    }
    files = {"audio": ("tts.wav", io.BytesIO(wav.content), "audio/wav")}
    create_resp = api_client.post(
        f"{API_BASE}/sessions",
        headers=auth_headers(token),
        data={"payload": __import__("json").dumps(payload)},
        files=files,
        timeout=120,
    )
    assert create_resp.status_code == 200, create_resp.text

    created = create_resp.json()
    teacher1_entities["session_ids"].append(created["id"])

    session_get = api_client.get(
        f"{API_BASE}/sessions/{created['id']}", headers=auth_headers(token), timeout=40
    )
    assert session_get.status_code == 200
    assert session_get.json()["student_id"] == teacher1_entities["student"]["id"]

    review_resp = api_client.patch(
        f"{API_BASE}/sessions/{created['id']}/review",
        headers=auth_headers(token),
        json={"transcript": "rani pergi ke taman", "note": "TEST review"},
        timeout=60,
    )
    assert review_resp.status_code == 200
    assert review_resp.json().get("reviewed") is True

    report_resp = api_client.get(
        f"{API_BASE}/sessions/{created['id']}/report", headers=auth_headers(token), timeout=60
    )
    assert report_resp.status_code == 200
    assert report_resp.headers.get("content-type", "").startswith("application/pdf")


def test_cross_user_cannot_access_other_session(api_client, test_accounts, teacher1_entities):
    if not teacher1_entities["session_ids"]:
        pytest.skip("No session id created")

    token = test_accounts["teacher2"]["token"]
    sid = teacher1_entities["session_ids"][0]
    response = api_client.get(f"{API_BASE}/sessions/{sid}", headers=auth_headers(token), timeout=30)
    assert response.status_code == 404


def test_pronunciation_requires_consent(api_client, test_accounts):
    token = test_accounts["teacher1"]["token"]
    files = {"audio": ("word.webm", io.BytesIO(b"abc"), "audio/webm")}
    response = api_client.post(
        f"{API_BASE}/pronunciation",
        headers=auth_headers(token),
        data={"word": "apel", "consent": "false"},
        files=files,
        timeout=40,
    )
    assert response.status_code == 400


def test_games_full_flow_and_complete_prevention(api_client, test_accounts):
    token = test_accounts["teacher1"]["token"]
    start = api_client.post(f"{API_BASE}/games/start", headers=auth_headers(token), timeout=30)
    assert start.status_code == 200
    game = start.json()

    for _ in range(5):
        choice = game["question"]["options"][0]
        step = api_client.post(
            f"{API_BASE}/games/{game['id']}/answer",
            headers=auth_headers(token),
            json={"choice": choice},
            timeout=30,
        )
        assert step.status_code == 200
        game = step.json()["game"]

    assert game["complete"] is True

    extra = api_client.post(
        f"{API_BASE}/games/{game['id']}/answer",
        headers=auth_headers(token),
        json={"choice": "apel"},
        timeout=30,
    )
    assert extra.status_code == 409


def test_research_stats_and_subject_detail(api_client, test_accounts):
    token = test_accounts["teacher1"]["token"]
    research = api_client.get(f"{API_BASE}/research", headers=auth_headers(token), timeout=120)
    assert research.status_code == 200
    data = research.json()
    assert data["participants"] == 70
    assert data["recordings"] == 210

    detail = api_client.get(
        f"{API_BASE}/research/subjects/1003",
        params={"task": "T4_Meaningful_Text"},
        headers=auth_headers(token),
        timeout=120,
    )
    assert detail.status_code == 200
    body = detail.json()
    assert body["subject_id"] == "1003"
    assert len(body["fixations"]) > 0


def test_research_train_forest_and_poll(api_client, test_accounts):
    token = test_accounts["teacher1"]["token"]
    start = api_client.post(
        f"{API_BASE}/research/train",
        headers=auth_headers(token),
        json={"algorithm": "forest"},
        timeout=40,
    )
    assert start.status_code == 202

    status = None
    for _ in range(80):
        r = api_client.get(f"{API_BASE}/research", headers=auth_headers(token), timeout=120)
        assert r.status_code == 200
        status = r.json().get("job", {}).get("status")
        if status in {"complete", "failed", "idle"}:
            break
        time.sleep(2)

    assert status == "complete"


def test_research_csv_import_invalid_and_valid(api_client, test_accounts):
    token = test_accounts["teacher1"]["token"]

    bad_csv = io.BytesIO(b"subject_id,label\n1001,0\n1002,1\n")
    bad = api_client.post(
        f"{API_BASE}/research/import",
        headers=auth_headers(token),
        files={"file": ("bad.csv", bad_csv, "text/csv")},
        timeout=40,
    )
    assert bad.status_code == 422

    rows = ["subject_id,label,feat_a,feat_b"]
    # 5 subjects/class minimum, unique labels per subject
    for i in range(1, 6):
        rows.append(f"A{i},0,{0.1 * i:.2f},{0.2 * i:.2f}")
    for i in range(1, 6):
        rows.append(f"B{i},1,{1.0 + 0.1 * i:.2f},{1.2 + 0.1 * i:.2f}")
    good_csv = io.BytesIO("\n".join(rows).encode("utf-8"))
    good = api_client.post(
        f"{API_BASE}/research/import",
        headers=auth_headers(token),
        files={"file": ("good.csv", good_csv, "text/csv")},
        timeout=40,
    )
    assert good.status_code == 202
