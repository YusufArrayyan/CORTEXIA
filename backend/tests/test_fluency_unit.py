import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import fluency


def test_frames_reset_and_smoothing(monkeypatch):
    import webrtcvad
    calls = []
    class Vad:
        def __init__(self, mode):
            calls.append(mode)

        def is_speech(self, frame, rate):
            assert len(frame) == 640 and rate == 16000
            return bool(frame[0])

    monkeypatch.setattr(webrtcvad, "Vad", Vad)
    mask = [0, 1, 1, 1] + [0]*5 + [1]*3 + [0]*6 + [1]*2
    pcm = b"".join(bytes([n])*640 for n in mask)
    for _ in range(2):
        assert fluency.segments(pcm) == [(0.02, 0.24)]
    assert calls == [2, 2]


def test_operational_definitions(monkeypatch):
    monkeypatch.setattr(fluency, "segments", lambda _: [(0.5, 1), (1.5, 2)])
    words = [dict(word="saya", start=.5, end=1), dict(word="baca", start=1.5, end=2)]
    out = fluency.measure(bytes(96000), "Saya baca.", words)
    assert out["wpm"] == 80 and out["articulation_rate_syllables_per_sec"] == 4
    assert out["mlr_syllables_per_run"] == 2 and out["pause_frequency_per_min"] == 40
    assert out["mean_pause_duration_sec"] == .5 and out["long_pause_count"] == 1
    assert out["qc_flags"] == []


@pytest.mark.parametrize("transcript,word,end", [("apel","apel",0), ("apel","apel",float("nan")),
                                                ("apel","apel",2), ("saya","apel",.4)])
def test_word_failures_keep_pause_metrics(monkeypatch, transcript, word, end):
    monkeypatch.setattr(fluency, "segments", lambda _: [(0, 1)])
    out = fluency.measure(bytes(32000), transcript, [dict(word=word,start=0,end=end)])
    assert out["wpm"] is None and out["mlr_syllables_per_run"] is None and out["qc_flags"]
    assert out["pause_frequency_per_min"] == 0 and out["mean_pause_duration_sec"] is None


def test_empty_and_unknown(monkeypatch):
    assert fluency.measure(b"", "", [])["wpm"] is None
    monkeypatch.setattr(fluency, "segments", lambda _: [(0, 1)])
    out = fluency.measure(bytes(32000), "123", [dict(word="123",start=0,end=.8)])
    assert out["wpm"] == 60 and out["articulation_rate_syllables_per_sec"] is None
