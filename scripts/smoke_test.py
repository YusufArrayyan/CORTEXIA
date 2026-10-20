"""Uji asap lokal: login akun uji, pelafalan Vosk, sesi membaca dengan tatapan sintetis + layout kata.

Jalankan: backend/.venv/Scripts/python scripts/smoke_test.py <audio.wav>
Akun uji dibaca dari scripts/dev-test-account.txt (dibuat bila belum ada).
"""
import json, sys, uuid, urllib.request, urllib.error
from pathlib import Path

API = 'http://127.0.0.1:8001/api'
ACCOUNT = dict(l.split('=', 1) for l in (Path(__file__).parent / 'dev-test-account.txt').read_text().splitlines() if '=' in l and not l.startswith('#'))


def call(method, path, token=None, json_body=None, form=None):
    headers = {}
    data = None
    if token: headers['Authorization'] = 'Bearer ' + token
    if json_body is not None:
        data = json.dumps(json_body).encode(); headers['Content-Type'] = 'application/json'
    if form is not None:
        boundary = uuid.uuid4().hex; parts = []
        for k, v in form.items():
            if isinstance(v, tuple):
                parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{v[0]}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode() + v[1] + b'\r\n')
            else:
                parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        data = b''.join(parts) + f'--{boundary}--\r\n'.encode(); headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary
    req = urllib.request.Request(API + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=300) as r: return r.status, json.loads(r.read() or b'null')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'null')


def main():
    audio = Path(sys.argv[1]).read_bytes()
    status, body = call('POST', '/auth/login', json_body={'email': ACCOUNT['email'], 'password': ACCOUNT['password']})
    if status != 200:
        status, body = call('POST', '/auth/register', json_body={'name': 'Guru Dev', 'email': ACCOUNT['email'], 'password': ACCOUNT['password'], 'role': 'teacher'})
    assert status == 200, body
    token = body['token']
    status, p = call('POST', '/pronunciation', token, form={'word': sys.argv[2] if len(sys.argv) > 2 else 'apel', 'consent': 'true', 'audio': ('a.wav', audio)})
    a = p.get('assessment') or {}
    print('pronunciation', status, a.get('transcript'), a.get('score'), a.get('verdict'), [(s['text'], s['ok']) for s in a.get('syllables', [])])
    _, students = call('GET', '/students', token)
    if not students:
        _, s = call('POST', '/students', token, json_body={'alias': 'Pembaca Uji', 'grade': 2}); students = [s]
    _, texts = call('GET', '/texts', token)
    text = texts[0]; words = text['content'].split(' ')
    # Layout sintetis: 8 kata per baris, tiap kata 0.1 lebar, baris 0.2 tinggi.
    boxes = [{'i': i, 'text': w, 'x': (i % 8) * 0.12, 'y': (i // 8) * 0.2, 'w': 0.1, 'h': 0.12, 'line': i // 8} for i, w in enumerate(words)]
    points = []; t = 0.0
    for b in boxes:
        for k in range(5):
            points.append({'x': b['x'] + 0.05 + 0.003 * k, 'y': b['y'] + 0.06, 't': round(t, 3)}); t += 0.06
        if b['i'] == 10:  # satu regresi dalam baris
            for k in range(5): points.append({'x': boxes[8]['x'] + 0.05, 'y': boxes[8]['y'] + 0.06, 't': round(t, 3)}); t += 0.06
    payload = {'student_id': students[0]['id'], 'text_id': text['id'], 'consent': True, 'mode': 'multimodal', 'duration': t,
               'gaze_points': points, 'layouts': [{'t': 0, 'width': 800, 'height': 400, 'words': boxes}],
               'calibration': {'median_error': 0.08, 'validation_samples': 40, 'passed': True}}
    status, s = call('POST', '/sessions', token, form={'payload': json.dumps(payload), 'audio': ('r.wav', audio)})
    assert status == 200, s
    m = s['metrics']; g = m['gaze']
    print('session', status, s['quality'], s['profile'])
    print(' gaze', {k: m[k] for k in ['gaze_usable', 'gaze_samples', 'fixations', 'mean_fixation_ms', 'regressions', 'on_text_percent']})
    print(' detail', {k: g.get(k) for k in ['words_fixated_percent', 'skipped_words_percent', 'regressions_within_line', 'regressions_between_line', 'return_sweeps', 'reading_order_percent']})
    print(' pronunciation', (m.get('pronunciation') or {}).get('mean_confidence'), (m.get('pronunciation') or {}).get('transcript'))
    print(' recs', s['recommendations'])
    status, _ = call('DELETE', f"/sessions/{s['id']}", token)
    print('cleanup', status)


if __name__ == '__main__':
    main()
