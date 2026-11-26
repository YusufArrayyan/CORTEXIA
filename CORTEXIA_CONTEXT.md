# CORTEXIA_CONTEXT

Audit teknis untuk konteks laporan Capstone, White-Box Testing, dan perbandingan algoritma. Tanggal audit 27 November 2026, Asia/Jakarta. Snapshot berupa working tree lokal dengan HEAD `3973663`, termasuk perubahan tracked dan untracked. Nomor baris merujuk source pada saat audit dan dapat bergeser setelah penyuntingan.

Audit membaca source, metadata hasil evaluasi, dan arsip penelitian yang diberikan pengguna. Audit tidak menjalankan training, preprocessing ulang, inferensi artefak joblib, atau tes baru. Hasil tes terdahulu dibedakan menurut asal buktinya. Dokumen tidak memuat konfigurasi rahasia atau identitas peserta.

## 1. Status dan arsitektur

**Aktual** berarti ada jalur implementasi yang dipanggil aplikasi. **Eksperimen** berarti tersedia script atau evaluasi penelitian. **Rencana** berarti belum tersedia implementasi atau validasi yang diperlukan.

Perubahan belum di-commit yang tercakup dalam audit meliputi backend/analytics.py, content.py, pronunciation.py, requirements.txt, research.py, server.py, sessions.py, tests/test_fusion_unit.py, tests/test_real_audio_unit.py, frontend/src/components/Calibration.jsx, features.css, pages/Reading.jsx, pages/Research.jsx, dan pages/Results.jsx. Berkas untracked yang turut diaudit adalah backend/fluency.py, backend/tests/test_fluency_api.py, test_fluency_unit.py, serta backend/turead_summary.json. Semuanya perlu ikut dalam paket source untuk mereproduksi snapshot ini.

| Folder atau modul | Tanggung jawab |
|---|---|
| backend/server.py | FastAPI, lifespan, CORS, router, health, penyajian build |
| backend/core.py, auth.py | Motor/MongoDB, autentikasi, peran, audit |
| backend/content.py | Materi, profil pembaca, dashboard |
| backend/sessions.py | Upload, consent, analisis, penyimpanan, review, PDF |
| backend/analytics.py | Whisper, alignment, metrik suara/tatapan, fusi |
| backend/pronunciation.py | Vosk-ID, decode PCM, skor pelafalan |
| backend/fluency.py | WebRTC VAD dan lima fitur fluency |
| backend/ml_pipeline.py, research.py | Ekstraksi ETDD70, training LR/RF, evaluasi, API riset |
| backend/turead_summary.json | Ringkasan evaluasi TURead |
| backend/threshold_validation.py | Evaluasi ambang menggunakan label ahli |
| backend/tts.py, games.py | Suara contoh dan latihan |
| backend/models/ | Model pretrained suara dan artefak riset |
| backend/tests/ | Unit tests, API tests, fixture audio |
| frontend/src/pages/ | Reading, Results, Research, Dashboard, latihan |
| frontend/src/components/Calibration.jsx | Kalibrasi dan validasi mata |
| frontend/src/lib/media.js | MediaRecorder, WebGazer, kamera, TTS |
| frontend/public/ | WebGazer, MediaPipe lokal, aset visual |
| assets/dataset/ETDD70_v2/ | CSV sumber penelitian ETDD70 |
| scripts/ | Launcher, smoke test, utilitas data uji |
| docs/, test_reports/ | Dokumentasi terdahulu dan bukti tes tersimpan |
| render.yaml, backend/build.sh | Konfigurasi deployment dan unduhan model |

Assessment berjalan melalui browser → multipart POST /api/sessions → validasi dan pemrosesan audio → analyze → MongoDB → Results/PDF. Video diproses di browser. Backend menerima koordinat tatapan, kotak kata, kalibrasi, dan audio. Audio temporer dihapus dalam finally.

Riset berjalan melalui CSV → dataset_frame → train → laporan JSON dan pipeline joblib → halaman Riset. create_session tidak memanggil model klasifikasi ETDD70. Bukti utama ada pada backend/server.py:13 (lifespan), backend/sessions.py:110 (audio_result), :134 (create_session), :195 (review), :212 (report), dan backend/research.py:40 (research), :45 (run_training).

## 2. Algoritma yang digunakan

| Algoritma | Peran | Status |
|---|---|---|
| WebGazer ridge, MediaPipe FaceMesh, Kalman | Estimasi gaze webcam | Runtime browser |
| I-DT | Fiksasi berdasarkan dispersi dan durasi | Runtime backend |
| faster-whisper base CPU int8 | Transkripsi Indonesia saat model lokal tersedia | Runtime bersyarat |
| Vosk/Kaldi bookbot model-id-id | Transkripsi fallback dan pronunciation | Runtime |
| WebRTC VAD mode 2 | Segmen suara dan jeda | Runtime |
| jiwer alignment/WER | Pencocokan kata dan kesalahan transkrip | Runtime |
| SequenceMatcher dan weighted phonetic Levenshtein | Skor ejaan dan pemilihan pesaing pelafalan | Runtime |
| LogisticRegression | Klasifikasi ETDD70 atau CSV impor | Riset |
| RandomForestClassifier | Alternatif klasifikasi riset | Riset |
| HistGradientBoostingRegressor | Estimasi WPM TURead | Eksperimen eksternal |
| Aturan ambang dan irisan kata | Fusi serta profil latihan pengguna | Runtime |

startGaze pada frontend/src/lib/media.js:57 mengaktifkan ridge dan Kalman. gazeFilter pada :106 menyediakan One Euro filter, tetapi Reading menggunakan listener WebGazer secara langsung. Keberadaan helper tidak membuktikan pemakaiannya pada jalur assessment.

## 3. Dataset dan batas penerapannya

### ETDD70 v2

Data mencakup 70 peserta, 210 rekaman, tiga tugas, dan dua kelas dengan 35 peserta per kelas. Sumber memakai bahasa Ceko dan eye-tracker penelitian. dataset_frame pada backend/ml_pipeline.py:21 membaca CSV metrik yang sudah tersedia. Training tidak menghitung ulang fiksasi dari video.

Sebelas fitur trial pada :19 meliputi jumlah/durasi fiksasi, dwell, jumlah/durasi/amplitudo saccade, regresi dalam/antarbaris, total regresi, dan progression. Lima fitur ROI pada :20 adalah dwell_time_aoi, n_fix_aoi, mean_fix_dur_aoi, skipped_aoi, n_revisits_aoi. Mean dihitung atas ROI bertipe subline. Totalnya 16 fitur; infinity diganti NaN.

Model ETDD70 tersedia di Riset. Profil pengguna memakai aturan analyze. Penghapusan catatan ETDD70 di UI hasil tidak mengaktifkan model ETDD70 pada webcam.

### BAHANA

README.txt dalam CORTEXIA_FLUENCY_FINAL (1).zip menjelaskan 140 audio dengan faster-whisper base.en, native word timestamps, dan VAD mode 2. cortexia_fluency_integrate.py mengintegrasikan hasil yang sudah tersedia. Arsip juga berisi dataset terintegrasi, timestamp, QC, dan summary.

Kontribusi ke aplikasi berupa definisi lima fitur pada backend/fluency.py. Penelitian Inggris memakai CMU dictionary 1.1.3 dengan pronunciation pertama dan hitungan vokal bertekanan. Runtime Indonesia memakai estimasi huruf vokal. Baris BAHANA tidak dipakai untuk melatih classifier pengguna. Implementasi aplikasi adalah adaptasi metode, dengan versi bahana-id-v1 dan id_orthographic_vowels_v1.

### TURead

CORTEXIA_TUREAD_EXPERIMENT.zip memuat README.txt, turead_multimodal.py, results/summary.json, metrics.csv, fold_metrics.csv, serta oof_predictions.csv. ZIP tidak memuat workbook input atau model deployment. Data individu dari OOF tidak disalin dalam dokumentasi.

backend/turead_summary.json:1 mencatat 37.416 observasi, 18.770 oral dan 18.646 silent. Seleksi menggunakan 16.087 observasi oral dari 196 peserta dengan target dibaca benar, Wpm positif, dan Articulation_duration valid. Sebanyak 2.683 observasi oral yang tidak memenuhi label benar dikeluarkan.

Delapan fitur eye adalah IA_SKIP, IA_FIRST_FIXATION_DURATION, IA_FIRST_RUN_DWELL_TIME, IA_FIRST_RUN_FIXATION_COUNT, TOTAL_FIXATION_DURATION, IA_REGRESSION_OUT_COUNT, REGRESSION_IN_COUNT, IA_REGRESSION_PATH_DURATION. Fitur speech adalah Articulation_duration. Target Wpm merupakan kecepatan membaca teks stimulus, dengan definisi waktu TURead. Word_count, komponen langsung target, screen timestamp, serta EVS/FSI yang terkait label dikecualikan.

Script memakai HistGradientBoostingRegressor dengan max_iter=100, max_leaf_nodes=15, min_samples_leaf=30, learning_rate=0.1, l2_regularization=1, early_stopping=False, random_state=42. Missing eye features dipertahankan sebagai NaN. Lima GroupKFold berdasarkan peserta digunakan untuk eye-only, speech-only, multimodal, dan baseline median, dengan parameter tetap.

Integrasi aktual menampilkan ringkasan penelitian melalui backend/research.py:40 dan frontend/src/pages/Research.jsx. word_observations pada assessment menambahkan pengamatan webcam/ASR per kata. Kesetaraan pengamatan ini dengan seluruh sembilan fitur TURead belum tervalidasi. Inferensi model TURead untuk pengguna, FSI, dan eye–voice span belum tersedia.

## 4. Audio, pronunciation, dan VAD

reading_audio pada backend/sessions.py:60 mendecode audio sekali melalui pronunciation.decode_pcm (:44), memakai PyAV untuk mono signed PCM16 16 kHz. analytics.validate_pcm (:55) menolak audio kurang dari 0,1 detik dan hening digital. Upload sesi dibatasi 25 MB dan durasi 900 detik.

analytics.transcribe_pcm (:30) memakai CPU int8, language=id, beam_size=5, word_timestamps=True, vad_filter=True, condition_on_previous_text=False. Segmen dengan no_speech_prob >0,7 dilewati. PCM dan timestamp dipakai kembali untuk fluency. VAD internal Whisper untuk ASR dan WebRTC untuk fluency merupakan dua proses dengan tujuan berbeda.

whisper_directory (:11) mencari model.bin lebih dari 1024 byte disertai konfigurasi, tokenizer, dan vocabulary. Pemeriksaan ini menghindari penunjuk teks kecil pada checkout lokal, tetapi belum memverifikasi integritas bobot. Saat Whisper gagal/tidak tersedia, reading_audio mencoba Vosk. Kegagalan semua ASR dengan PCM valid masih memungkinkan pengukuran jeda. Kegagalan decode menghasilkan audio unavailable; session_speech (:126) menjaga hasil tatapan tetap dapat disimpan.

pronunciation.recognize (:59) mengeluarkan kata, confidence, dan timestamp. assess (:218) pada latihan pelafalan menjalankan decode bebas dan pilihan paksa target melawan pesaing bila memungkinkan. Pesaing dipilih dengan RapidFuzz dan jarak fonetik berbobot pada competitors (:188), phonetic_distance (:173), substitution_cost (:150).

Skor gabungan assess adalah 0,35 × similarity ejaan + 0,65 × confidence jika target menang. Kontribusi confidence nol bila pesaing menang. Jika pilihan paksa tidak tersedia, skor memakai similarity. Tanpa ucapan skor null. Verdict tepat mulai 85, hampir mulai 60. Suku kata untuk feedback menggunakan aturan pemenggalan pronunciation.syllables (:95).

Sesi membaca menggunakan align_confidence (:282), yang mengambil confidence dari kata Vosk yang cocok dengan referensi. Mean confidence hanya dihitung atas matched words dan coverage dilaporkan. Skor assess dan confidence sesi membaca adalah keluaran dengan definisi berbeda.

fluency.segments pada backend/fluency.py:23 membuat VAD baru setiap audio. Parameter aktual adalah mode 2, 16 kHz, PCM16 mono, frame 20 ms, fill gap ≤100 ms, lalu buang segmen suara <60 ms. Frame akhir yang tidak lengkap tidak diklasifikasikan. measure (:46) menghitung pause internal ≥250 ms dan long pause ≥500 ms.

| Fitur | Definisi |
|---|---|
| metrics.wpm legacy | Jumlah kata transkrip ternormalisasi ×60 / durasi rekaman |
| metrics.fluency.wpm | Jumlah token ASR ×60 / rentang ujaran VAD |
| Articulation rate | Estimasi suku kata / jumlah durasi suara aktif |
| Mean length of run | Estimasi suku kata / (jumlah pause +1) |
| Pause frequency | Jumlah pause ×60 / rentang ujaran |
| Mean pause duration | Total durasi pause / jumlah pause; null jika tidak ada pause |

Rentang ujaran dimulai dari suara pertama sampai suara terakhir dan mencakup gap internal. Legacy normalize mempertahankan kata berhubung, sedangkan tokenisasi fluency memisahkan tanda hubung. Selisih WPM dapat berasal dari tokenisasi maupun denominator.

QC memeriksa konsistensi transkrip dan timestamp, durasi kata positif, batas audio, urutan, serta overlap. Kegagalan struktural menggugurkan metrik berbasis kata. Flag boundary >250 ms, overlap VAD <80%, satu kata, reference WER ≥50%, dan suku kata tidak tersedia digunakan untuk peninjauan. Estimasi Indonesia menghitung huruf aiueo untuk token alfabet Latin; angka, singkatan tanpa vokal, dan token tidak didukung dapat menyebabkan null. Diftong dan kata serapan dapat berbeda dari jumlah suku kata terucap.

review pada sessions.py:195 memperbarui metrik transkrip legacy, reading_error_rate, dan asr_wer. Fluency serta word_observations asli dipertahankan sehingga jumlah kata koreksi tidak dicampurkan ke timestamp asli untuk fitur baru. Jeda legacy tetap memakai timestamp ASR.

## 5. Eye tracking dan multimodal fusion

Reading.jsx mengubah koordinat layar ke koordinat relatif area bacaan, menyimpan layout kata dan baris, dan mengukur ulang melalui ResizeObserver. Pause dikeluarkan dari jam sesi. Perubahan viewport menonaktifkan pencatatan gaze dan menandai kalibrasi tidak layak. Bacaan dipusatkan; preview tersembunyi saat membaca dan titik kalibrasi.

Calibration.jsx:10 menetapkan lima titik latihan; :11 menetapkan titik validasi terpisah. Refinement menambah titik sekitar area bermasalah. Median error maksimal 0,16 layar dan minimal 15 sampel menjadi syarat lulus. Model kalibrasi dapat dipakai ulang selama 15 menit dengan viewport sama dan batas drift kepala, disertai validasi ulang.

analytics.clean_gaze (:118) memeriksa koordinat, waktu, duplicate, dan statistik sampel. clean_layouts (:143) memvalidasi kotak. _idt (:160) memakai dispersi 80 px, minimal 120 ms, dan gap maksimum 0,5 detik. assign_word (:188) mencari baris dan kata terdekat dengan toleransi. classify_transitions (:204) mengklasifikasikan regresi, progression, dan return sweep.

gaze_metrics (:222) menghitung cakupan, on-text percentage, dwell, revisit, skipped words, regression rate, urutan baca, serta statistik first fixation/first visit. Gaze usable membutuhkan kalibrasi valid, minimal 20 titik, dan cakupan ≥30% terhadap acuan 8 Hz. Cakupan adalah ukuran ketersediaan sampel.

speech_metrics (:471) mensyaratkan rekaman ≥5 detik, ≥3 kata, serta mean confidence ≥60% atau transkrip sudah direview. analyze (:494) menetapkan kualitas layak/parsial/tidak_cukup berdasarkan modalitas yang lolos.

fuse (:367) menggabungkan kata substitute/delete dari alignment dengan kata yang dwell-nya ≥1,5× median atau visits ≥2. Concordance adalah proporsi kata salah yang juga sulit menurut gaze; ambang 40%. Insertion tidak masuk himpunan kesalahan kata referensi. WER >20 dan WPM <60 ikut menentukan pola/profil. Aturan lain tersedia di konstanta sekitar analytics.py:359.

pronunciation_gaze_words berisi kata matched Vosk dengan confidence <0,6 yang juga termasuk kata sulit gaze. Daftar ini tidak menjadi input formula concordance. word_observations (:323) menggunakan alignment equal, memvalidasi timestamp dan pemetaan satu token, lalu menggabungkan durasi kata ASR dengan first_fixation_ms, first_visit_ms, first_visit_fixations, dan total_fixation_ms. Ini adalah pengamatan sesi, belum inferensi model TURead.

## 6. Arti hybrid machine learning

Arsitektur runtime menggabungkan model terlatih untuk persepsi, pemrosesan sinyal, dan aturan interpretasi. Ini mendukung penjelasan hybrid pada tingkat sistem. Tidak ditemukan voting, stacking, atau ensemble LR+RF untuk assessment. LR dan RF merupakan pilihan estimator alternatif dalam riset. Fusion runtime berbasis aturan pada dua modalitas, sedangkan fusion terlatih tersedia dalam eksperimen TURead. Tidak ada penggabungan baris ETDD70, BAHANA, dan TURead menjadi dataset supervised pengguna.

## 7. LR, RF, training, dan hasil evaluasi

backend/ml_pipeline.py:55, train, menyusun SimpleImputer(strategy=median) → StandardScaler → estimator. Pipeline memastikan preprocessing dipelajari pada fold training.

LR memakai max_iter=3000, C=0.1, class_weight=balanced, random_state=42. RF memakai n_estimators=160, max_depth=5, min_samples_leaf=3, n_jobs=2, class_weight=balanced, random_state=42. Parameter lainnya mengikuti default versi sklearn terpasang.

CV memakai StratifiedGroupKFold lima fold, shuffle=True, random_state=42, groups=subject_id. cross_val_predict dipanggil untuk label, probabilitas, dan baseline most_frequent. Setelah OOF selesai, model difit pada seluruh data dan disimpan sebagai joblib. Feature importance berasal dari absolute coefficient LR atau feature_importances_ RF pada fit akhir.

Kode sekarang menyediakan participant_metrics (:41), berupa rerata probabilitas OOF per peserta dengan ambang 0,5, dan metadata lingkungan/hash. Artefak lama yang diperiksa belum memiliki participant_level. Accuracy/F1 pada laporan lama adalah nilai per rekaman, meskipun pembagian fold berbasis peserta.

| Artefak di backend/models/research/ | Dataset | Accuracy | Macro-F1 |
|---|---|---:|---:|
| 20260925-064658-logistic.json | ETDD70, 210 rekaman, 70 peserta | 0,7714 | 0,7704 |
| 20261001-131250-forest.json | ETDD70, 210 rekaman, 70 peserta | 0,7810 | 0,7809 |
| 20261001-131251-logistic.json | CSV impor, 10 rekaman, 10 peserta, dua fitur | 1,0000 | 1,0000 |

Sebagian artefak berada dalam subfolder kepemilikan akun, yang tidak disalin ke dokumen. Nilai 100% berasal dari CSV impor. Confusion matrix LR ETDD70 adalah [[88,17],[31,74]], RF [[83,22],[24,81]]. Keduanya mencatat overlap peserta nol dan 56 peserta training/14 peserta testing per fold. Selisih accuracy sekitar 0,96 poin persentase belum membuktikan keunggulan signifikan RF.

| TURead | MAE kata/menit | R² |
|---|---:|---:|
| Median baseline | 14,3615 | -0,0015 |
| Eye-only | 13,4412 | 0,1162 |
| Speech-only | 13,6638 | 0,0877 |
| Multimodal | 13,3309 | 0,1331 |

Bukti angka berada di backend/turead_summary.json:47. Perbaikan MAE multimodal atas eye-only sekitar 0,1103. Generalisasi teks baru, uji signifikansi, external test, dan validasi klinis belum disediakan.

## 8. Prosedur LR versus RF untuk pengujian berikutnya

Instruksi berikut belum dijalankan dalam audit. UI guru menyediakan Riset → pilih Logistic Regression → Latih model → tunggu job selesai → pilih Random Forest → Latih model. Gunakan ETDD70 yang sama. Endpoint POST /api/research/train menerima algorithm logistic atau forest (research.py:53). Endpoint import CSV (:60) menggunakan logistic.

Alternatif Python dari root repository, dengan dependensi lingkungan backend sudah tersedia, menyimpan kedua hasil pada direktori baru.

```powershell
Push-Location backend
@'
from datetime import datetime, timezone
from pathlib import Path
from ml_pipeline import train

destination = Path('models') / ('comparison-' + datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S'))
destination.mkdir(exist_ok=False)
for algorithm in ('logistic', 'forest'):
    report = train(algorithm=algorithm, output_dir=destination)
    print(algorithm, report['accuracy'], report['macro_f1'], report['participant_level'])
'@ | .\.venv\Scripts\python.exe -
Pop-Location
```

Catat versi lingkungan, hash dataset, 210 rekaman, 70 peserta, 16 fitur, dan overlap nol. Laporkan nilai per rekaman dan per peserta secara terpisah. Bandingkan accuracy, macro-F1, precision/recall, confusion matrix, variasi fold, dan baseline. Nilai fit akhir seluruh data tidak digunakan sebagai nilai generalisasi. Pipeline belum melakukan hyperparameter search. Evaluasi eksternal/nested CV dan confidence interval dapat menjadi rencana pengembangan.

## 9. Script serta hasil tes tersedia

| Bukti | Interpretasi |
|---|---|
| test_reports/pytest/pytest_results.xml | 18 tests, tanpa failure/error/skip, sekitar 14,62 detik, 1 Oktober 2026 |
| test_reports/iteration_3.json | Narasi historis test_api_integration.py; bukan verifikasi semua perubahan terbaru |
| Log percakapan sebelum audit | Suite unit terakhir 91 passed, 1 skipped, 10 warnings |
| Uji API sebelum audit | Simpan–baca–review, speech-only, gaze-only, multimodal, audio rusak dengan MongoDB lokal |
| Uji UI sebelum audit | Edge headless dan sensor simulasi, 1280×720 serta 390×740 |
| Build sebelum audit | npm run build berhasil |
| Audit ini | Analisis statis dan pembacaan hasil, tanpa menjalankan ulang tes |

Uji Whisper dilewati karena bobot lokal tidak tersedia pada eksekusi terakhir. Vosk memakai fixture audio nyata; gaze integrasi menggunakan titik sintetis. Bukti ini belum mengukur akurasi tatapan manusia.

Unit suites tersedia pada backend/tests/test_analysis_unit.py, test_gaze_unit.py, test_speech_unit.py, test_pronunciation_unit.py, test_fusion_unit.py, test_fluency_unit.py, test_integration_unit.py, test_threshold_validation_unit.py, dan test_real_audio_unit.py.

```powershell
.\backend\.venv\Scripts\python.exe -m pytest backend/tests -k unit -q
```

backend/pytest.ini memakai dua worker xdist dan loadscope. HTTP suites tersedia dalam test_api_integration.py, test_hardening_integration.py, test_revisions.py, test_fluency_api.py. Untuk HTTP, jalankan backend dengan database uji terpisah dan arahkan REACT_APP_BACKEND_URL ke server itu. Beberapa suite membuat data serta menjalankan training, sehingga jangan menjalankannya pada database operasional.

threshold_validation.py:57 menyediakan sensitivitas, spesifisitas, dan sweep Youden terhadap label pendamping. Pemakaian adalah python threshold_validation.py labels.csv --min-sessions 30. Pemilihan dan evaluasi threshold pada data yang sama belum memberi estimasi independen.

Script turead_multimodal.py berada dalam ZIP eksperimen; cortexia_fluency_integrate.py berada dalam ZIP BAHANA. setup_local_models.py mengunduh pretrained models. scripts/smoke_test.py menguji jalur aplikasi menggunakan audio dan konfigurasi akun uji. Audit tidak menyalin konfigurasi akun atau prediksi individu.

## 10. Pemetaan White-Box Testing

| Unit dan baris source | Cabang penting | Bukti tes |
|---|---|---|
| analytics.calibration_ok :112 | passed false, error invalid, batas 0,16/15 sampel | test_gaze_unit.py:24 |
| analytics._idt :160 | batas 120 ms, dispersi, gap | test_gaze_unit.py:85, :90, :97, :105 |
| clean_gaze/layouts :118/:143 | duplicate, NaN, range, urutan | test_gaze_unit.py:38, :58, :127 |
| speech_metrics :471 | confidence rendah, durasi, review | test_analysis_unit.py:18, :28, :36 |
| fuse :367 | parsial, concordance 40%, median nol | test_fusion_unit.py:24, :41, :68, :75 |
| pronunciation.assess :218 | target/pesaing menang, OOV, kosong | test_pronunciation_unit.py:50, :59, :76, :82 |
| fluency.segments :23 | reset VAD, gap, minimum segmen | test_fluency_unit.py:10 |
| fluency.measure :46 | rumus, timestamp invalid, tanpa pause | test_fluency_unit.py:29, :41, :48 |
| word_observations :323 | insertion, repetition, invalid time | test_fusion_unit.py:129 |
| gaze_metrics :222 | kunjungan pertama dan kembali ke kata | test_fusion_unit.py:140 |
| sessions.reading_audio :60 | Vosk-only dan Whisper gagal | test_real_audio_unit.py:32 |
| create/review sessions :134/:195 | persistensi, koreksi, audio rusak | test_fluency_api.py:12 |
| threshold_validation.evaluate :57 | missing label, sampel kecil | test_threshold_validation_unit.py:19, :27, :35 |

Jumlah tes lulus tidak membuktikan branch coverage. Laporan coverage terbaru belum ditemukan dalam bukti yang diperiksa. Untuk White-Box Testing, buat control-flow graph fungsi terpilih, hitung keputusan dan jalur independen dari snapshot, lalu hubungkan input/expected output dengan tes. Angka kompleksitas siklomatik belum dihitung dalam audit ini.

## 11. Selesai, tersisa, dan keterbatasan

Runtime telah menyediakan consent, autentikasi, modalitas parsial, transkripsi fallback, pronunciation, fluency, kalibrasi, pemetaan gaze ke kata, fusi aturan, observasi per kata, review, dashboard, PDF, dan hasil riset. Ownership query, idempotency key, unique index, serta expires_at dengan TTL 30 hari ada di sessions.py:134 dan server.py:13. Penghapusan TTL MongoDB bersifat asinkron.

PDF report pada sessions.py:212 mencantumkan metrik legacy dan ringkasan fusi. Lima fitur fluency dan tabel word_observations belum seluruhnya ditambahkan ke PDF. UI Results sudah menampilkan keduanya.

Pekerjaan yang masih diperlukan adalah artefak inferensi TURead dan validasi fitur, validasi domain ETDD70 terhadap webcam/Indonesia, anotasi independen kesalahan baca, validasi ASR/VAD/suku kata, ablation fusi, coverage terbaru, uji kamera dan mikrofon fisik, serta pemeriksaan hosting akhir.

- Confidence ASR belum dikalibrasi sebagai probabilitas ketepatan pelafalan. WER sebelum review mencampur galat ASR dan pembaca.
- Webcam memiliki noise, drift, variasi sampling, serta ketergantungan ambang piksel pada viewport. Cakupan sampel berbeda dari akurasi koordinat.
- VAD dapat salah mendeteksi napas/noise. Smoothing memengaruhi durasi aktif. Suku kata ortografis belum divalidasi terhadap ucapan pengguna sasaran.
- Ambang WER/WPM, gaze, serta concordance masih heuristik. Fungsi validasi tersedia, tetapi hasil label ahli yang memvalidasi ambang tersebut belum ditunjukkan.
- Observasi matched-word dapat memilih kata yang lebih mudah dikenali. Evaluasi perlu mencatat coverage dan kegagalan alignment.
- Jam audio dan gaze belum memiliki bukti sinkronisasi presisi laboratorium. FSI tidak dihitung oleh eksperimen maupun runtime saat ini.
- Pemeriksaan kesiapan model adalah pemeriksaan berkas dasar. Health ready belum menjamin semua jalur inferensi berhasil.
- train langsung mengandalkan validitas input; endpoint CSV menambahkan pemeriksaan label konsisten dan minimal peserta per kelas.
- requirements aplikasi, lingkungan eksekusi lokal, dan lingkungan TURead dapat berbeda versinya. Reproduksi perlu mencatat versi aktual.
- Penghapusan catatan riset dari UI tidak merupakan bukti validasi klinis atau domain baru.

## 12. Penggunaan dalam laporan maksimal 50 halaman

Rumusan yang didukung implementasi adalah sistem assessment membaca multimodal dengan persepsi berbasis model terlatih, ekstraksi fitur audio/tatapan, serta interpretasi aturan pada tingkat kata. ETDD70 mendukung eksperimen klasifikasi tatapan; BAHANA mendukung definisi fluency; TURead menyediakan eksperimen regresi multimodal eksploratif.

Alokasi awal yang dapat disesuaikan dengan pedoman kampus adalah pendahuluan 5 halaman, teori 7, metode/dataset 10, implementasi 10, pengujian/pembahasan 13, penutup 3, referensi 2. Ketentuan halaman awal/lampiran mengikuti institusi.

Dalam tabel hasil, nyatakan unit rekaman, peserta, percobaan, kata, atau sesi secara eksplisit. Cantumkan sumber angka dan tanggal pengujian. Klaim bahwa LR/RF menentukan profil pengguna, bahwa ketiga dataset dilatih bersama, atau bahwa pengamatan kata merupakan prediksi TURead belum didukung snapshot ini. Probabilitas risiko klinis memerlukan penelitian validasi tersendiri.
