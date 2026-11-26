"""Uji transkripsi pada rekaman suara manusia nyata (bukan TTS). Dilewati bila model Whisper belum ada."""
import os
import sys

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "cortexia_unit")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analytics import analyze, asr_ready, transcribe  # noqa: E402

SAMPLE = os.path.join(os.path.dirname(__file__), "fixtures", "bookbot_sample.wav")
REF = "Sepulang sekolah Fitri sangat lapar."


@pytest.mark.skipif(not asr_ready(), reason="Model Whisper belum tersedia")
def test_whisper_transcribes_real_recording():
    r = transcribe(SAMPLE)
    assert 3.5 < r["audio_duration"] < 4.0
    words = r["words"]
    assert len(words) == 5 and all(0 <= w["start"] <= w["end"] <= r["audio_duration"] + 0.1 for w in words)
    assert [w["start"] for w in words] == sorted(w["start"] for w in words)
    out = analyze(REF, r["transcript"], r["audio_duration"], [], {}, words)
    m = out["metrics"]
    assert m["wer"] == 0.0 and m["wer_source"] == "transkrip_otomatis"
    # 3,7 detik < MIN_SPEECH_S (5 detik): tidak cukup untuk dinilai, sehingga suara tidak boleh dianggap andal
    assert not m["speech_reliable"] and out["quality"] == "tidak_cukup"
    assert "terlalu pendek" in out["quality_reasons"][0]

@pytest.mark.parametrize("broken_whisper", [False, True], ids=["vosk-only", "whisper-load-failed"])
def test_reading_upload_fuses_local_vosk_and_gaze(monkeypatch, broken_whisper):
    import asyncio
    import io
    import wave

    from fastapi import UploadFile
    import pronunciation as pr
    import sessions

    monkeypatch.setattr(sessions, "asr_ready", lambda: broken_whisper)

    def unavailable(path):
        raise RuntimeError("Whisper snapshot unavailable")

    monkeypatch.setattr(sessions, "transcribe_pcm", unavailable)
    # Repeat the recording to exceed the minimum duration for reading sessions.
    recording = io.BytesIO()
    with wave.open(SAMPLE, "rb") as src, wave.open(recording, "wb") as dest:
        dest.setparams(src.getparams())
        dest.writeframes(src.readframes(src.getnframes()) * 2)
    recording.seek(0)
    reference = REF + " " + REF
    upload = UploadFile(file=recording, filename="reading.wav")
    speech = asyncio.run(sessions.session_speech(upload, reference))
    assert speech["model"] == pr.MODEL_NAME
    assert speech["pronunciation"]["words_matched"] > 0
    duration = speech["audio_duration"]
    points = [{"x": 0.15, "y": 0.5, "t": i / 10} for i in range(int(duration * 10))]
    calibration = {"passed": True, "validation_samples": 40, "median_error": 0.05}
    layout = [{"t": 0, "width": 800, "height": 600, "words": [
        {"i": i, "text": reference.split()[i], "x": i / 10, "y": 0.45, "w": 0.1, "h": 0.1, "line": 0}
        for i in range(10)
    ]}]
    analysis = analyze(reference, speech["transcript"], duration, points, calibration,
                       speech["words"], layout, speech["pronunciation"])
    assert analysis["metrics"]["multimodal"]["multimodal_complete"]
    assert analysis["metrics"]["word_observations"][0]["word"] == "sekolah"
