"""Run against a dedicated local test server with REACT_APP_BACKEND_URL set."""
import json
import os
from pathlib import Path
import uuid

import pytest
import requests


@pytest.mark.skipif(not os.getenv("REACT_APP_BACKEND_URL"), reason="Local API URL required")
def test_fluency_session_roundtrip():
    api = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api/"
    client = requests.Session()

    def request(method, path, **kwargs):
        response = client.request(method, api + path, timeout=40, **kwargs)
        response.raise_for_status()
        return response.json()

    user = request("POST", "auth/register", json=dict(name="QA Reader", role="teacher",
                   email=f"test-{uuid.uuid4().hex}@example.com", password="ExamplePass123!"))
    client.headers["Authorization"] = "Bearer " + user["token"]
    student = request("POST", "students", json=dict(alias="QA Reader", grade=2))
    text = request("GET", "texts")[0]
    wav = (Path(__file__).parent / "fixtures/bookbot_sample.wav").read_bytes()
    for mode, audio in [("speech", wav), ("multimodal", wav), ("gaze", None), ("multimodal", b"bad")]:
        points = [] if mode == "speech" else [dict(t=i/10, x=.5, y=.5) for i in range(36)]
        payload = dict(student_id=student["id"], text_id=text["id"], duration=3.7,
                       mode=mode, consent=True, gaze_points=points)
        doc = request("POST", "sessions", data={"payload": json.dumps(payload)},
                      files={"audio": ("s.wav", audio)} if audio is not None else None)
        metrics = doc["metrics"]
        measured = metrics["fluency"]
        path = "sessions/" + doc["id"]
        assert measured == request("GET", path)["metrics"]["fluency"]
        assert metrics["gaze_samples"] == len(points)
        assert (measured["pause_frequency_per_min"] is not None) == (audio == wav)
        if audio == wav:
            assert measured["wpm"] is not None
            reviewed = request("PATCH", path + "/review", json={"transcript": "Ini koreksi dari guru"})
            assert reviewed["metrics"]["fluency"] == measured
        print(mode, json.dumps({"wpm": metrics["wpm"], "fluency": measured}))
