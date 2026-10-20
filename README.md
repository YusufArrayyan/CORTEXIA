# CORTEXIA

Profil kesulitan membaca berbasis webcam (gaze) dan suara. Semua model berjalan lokal.

## Menjalankan di localhost (Windows)

Prasyarat: Python 3.12+, Node 20+, MongoDB (portable di `..\tools\mongodb-*` atau layanan lokal di port 27017).

```bash
# sekali saja
cd backend && python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python setup_local_models.py
cd ../frontend && npm install --legacy-peer-deps
```

Jalankan tiga proses (urutannya begini):

```bash
scripts/run-mongodb.cmd
```

```bash
scripts/run-backend.cmd
```

```bash
scripts/run-frontend.cmd
```

Lalu buka **http://localhost:3000**. Gunakan `localhost`, bukan `127.0.0.1`, karena WebGazer hanya mengizinkan kamera di https atau localhost.

## Model lokal

| Fungsi | Model | Lokasi |
|---|---|---|
| Transkripsi bacaan | faster-whisper base (int8) | `backend/models/whisper` |
| Pelafalan & kejelasan kata | Vosk/Kaldi `model-id-id` dari [bookbot-kids/speech-recognizer-bahasa-indonesian](https://github.com/bookbot-kids/speech-recognizer-bahasa-indonesian), dilatih dengan ujaran anak | `backend/models/vosk-id` |
| Suara contoh & game | Piper `id_ID-news_tts-medium`, cadangan suara browser | `backend/models/piper` |
| Pelacak mata | WebGazer 3.5.3 + MediaPipe FaceMesh (WASM) yang disajikan lokal | `frontend/public/mediapipe` |

Uji asap API: `backend/.venv/Scripts/python scripts/smoke_test.py <audio.wav> <kata>`.
