"""One-time local speech model setup; no paid inference service is involved."""
from pathlib import Path
from faster_whisper import WhisperModel

if __name__ == '__main__':
    directory=Path(__file__).parent/'models'/'whisper'
    WhisperModel('base',device='cpu',compute_type='int8',download_root=str(directory),cpu_threads=2)
    print('Model suara lokal siap.')