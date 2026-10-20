#!/usr/bin/env bash
# Build backend di Render: pasang dependensi lalu unduh model lokal (Whisper, Vosk, Piper).
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt
python setup_local_models.py
