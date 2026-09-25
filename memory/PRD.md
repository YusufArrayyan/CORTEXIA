# CORTEXIA — Catatan implementasi

## Pernyataan asli pengguna
"buatkan saya sebuah web app Multimodal AI-Based Reading Difficulty Profiling Using Webcam-Based Gaze and Speech Analysis for Adaptive Learning Support untuk dataset sudah saya lampirkan, kemudian untuk draft atau alur kerja dalam sistem juga sudah saya masukkan, serta dataset yang bisa dicoba untuk machine learning dalam app juga saya sediakan, serta ui itu sudah ada pada folder pertama saya input, untuk logo juga itu svg. pakai tanpa data dummy, dan fully functioned"

Pilihan eksplisit: model lokal tanpa layanan AI berbayar; PRD v1.2 acuan utama, UI lampiran acuan visual. Folder awal kosong; pengguna mengunggah ulang ZIP valid.

## Lampiran dan temuan
- PRD CORTEXIA v1.2 dan proposal tersimpan di /app/assets.
- UI ZIP berisi 14 PNG referensi; ilustrasi asli diekstrak untuk frontend. Logo yang benar-benar tersedia adalah SVG.png, bukan berkas SVG.
- ETDD70_v2.zip: 70 peserta Ceko usia 9–10 tahun, label seimbang 35/35, 210 rekaman/3 tugas, eye tracker laboratorium 250 Hz, metrics/fixations/saccades/raw/ROI. Tidak ada audio atau pasangan gaze-speech berbahasa Indonesia.
- Teks Rani ditranskripsi dari UI Reading Assessment pengguna; konten pembelajaran bukan rekaman atau data peserta sintetis.

## Persona
- Guru/pendamping: mengelola alias pembaca, materi, sesi, koreksi dan laporan.
- Pelajar: menjalankan sesi, latihan kata, permainan bunyi, melihat perjalanan sendiri.
- Peneliti (akses guru pada versi ini): melatih dan meninjau ETDD70/CSV numeric lokal.
- Orang tua/admin terpisah merupakan backlog, bukan peran yang saat ini diimplementasikan.

## Kebutuhan inti statis
Consent sebelum capture, rekaman gaze/suara nyata, pemeriksaan perangkat dan kalibrasi, transkripsi/penyelarasan, kualitas modalitas, profil non-klinis, rekomendasi, dashboard/histori, model riset terukur tanpa kebocoran peserta, privasi dan audit. Tidak ada data siswa/histori/skor palsu atau layanan AI berbayar.

## Arsitektur
- React 19, React Router, Shadcn primitives, Nunito/DM Sans; UI oranye/lavender terang mengikuti aset pengguna.
- FastAPI /api port supervisor 8001, MongoDB dari backend/.env; frontend hanya REACT_APP_BACKEND_URL.
- Auth bcrypt + bearer token acak, hash token di DB, TTL 2 hari. Hak akses teacher/student dan kepemilikan per akun, tanpa akun default.
- WebGazer 3.5.3 dipaketkan lokal /public/webgazer.js. Model landmark diunduh pustaka ke browser; video tidak diunggah. 9 titik x5 klik lalu 3 titik validasi terpisah. Galat median dan banyak sampel dinilai; tidak ada simulasi gaze.
- MediaRecorder mengirim audio temporer ke faster-whisper base CPU int8 lokal. Audio dihapus dalam finally, video tidak disimpan. TTS espeak-ng bahasa Indonesia berjalan lokal.
- Jiwer alignment WER/substitusi/deletion/insertion. WPM dan jeda dari audio/word timestamps; gaze observasional I-DT sederhana dengan quality gate.
- Profil live memakai aturan observasional v1 (bukan prediksi model multimodal tervalidasi): kualitas, WER, WPM, on-text. Tidak membuat angka confidence. Data tidak cukup tidak diberi skor rekaan.
- ETDD70 research: 16 fitur numerik, LogisticRegression/RandomForest, imputer+scaler di setiap fold, StratifiedGroupKFold 5 fold per participant. OOF predictions untuk penjelajahan dataset. Hasil tidak diterapkan pada webcam Indonesia.
- Dataset/model artefak lokal di /app/assets/dataset dan backend/models; berkas model impor hanya bisa dilihat pemilik. Audio temporer tidak membutuhkan object storage.
- Dokumen sessions TTL 30 hari. Hapus profil menghapus sesi terkait. Audit mencatat aktivitas utama; PDF default tidak memuat alias siswa.

## Implementasi 2026-09-25
- Beranda tiga aktivitas memakai ilustrasi asli, navbar responsif, login/daftar/logout.
- Reading: profil pembaca, pilih materi, consent, cek perangkat terpisah, video preview/mic meter, 9-point calibration dan held-out validation, speech-only jika gaze tidak layak, rekaman/pausa/timer/ukuran teks/panduan kata, kirim dan retry analisis, hasil tersimpan.
- Pronunciation: daftar kata, kata custom, suara contoh TTS lokal, rekam ASR lokal, kecocokan transkripsi nyata, tidak mengklaim evaluasi fonem.
- Hasil: quality gates, metrik, anotasi kata, koreksi guru dan riwayat, rekomendasi berbasis pengamatan, jejak gaze, detail model/metode/retensi, ekspor PDF.
- Dashboard: jumlah nyata, riwayat/filter/pencarian, create/list/delete pembaca dan materi, grafik tren, audit. Tidak ada siswa contoh.
- Game Center: permainan cocokan bunyi 5 soal dengan skor server/persistensi dan suara lokal; Ikuti Kata/Ayo Baca membuka latihan membaca gaze/multimodal (bukan engine game terpisah).
- Research: 70 peserta/210 rekaman/16 fitur asli. Baseline LogisticRegression accuracy 0.7714, macro-F1 0.7704, majority macro-F1 0.3333; semua fold 56 peserta train/14 test/0 overlap. Artefak 20260925-064658-logistic.
- Latih ulang logistic/forest via UI dan job polling. Impor CSV fitur numerik tervalidasi, label biner/per participant, min5 participant/class. OOF inspection berdasarkan subjek dan tugas, heatmap fiksasi asli, confusion matrix, fitur, fold scores, versi.
- Tes: build frontend sukses; health database/ASR ready; 18/18 backend pytest, frontend critical flows dan mobile 360/390 + desktop1920 lulus. Akun dan data tes dibersihkan. Tidak ada mocked API. Ketepatan fisik webcam perlu validasi partisipan nyata.

## Batasan eksplisit dan backlog prioritas
### P0 — validasi sebelum penggunaan keputusan pendidikan
- Kumpulkan dataset gaze-webcam + audio Indonesia berpasangan, consent/label pendamping dan split per peserta. ETDD70 tidak dapat menyediakan data audio yang tidak ada.
- Validasi kalibrasi/akurasi webcam dengan peserta nyata dan performa ASR ucapan anak. Uji browser tidak menggantikan validasi fisik/klinikal.
- Early/late fusion, ablation multimodal dan confidence terkalibrasi belum diimplementasikan; perlu dataset multimodal yang sesuai. Profil sekarang adalah observasi aturan, bukan klaim ML multimodal terlatih.
### P1
- Role admin/orang tua/peneliti terpisah, sharing anak terbatas, manajemen role dan aturan.
- Edit profil/materi, penugasan intervensi dan monitoring kepatuhan longitudinal.
- Forced phoneme alignment/prosody anak; model speech Indonesia yang dievaluasi.
- Koreksi transkrip mengubah alignment kata/metrik, bukan timestamp ASR asli.
- Latihan mata garis/kata dan game Ikuti Kata yang terpisah dari reading assessment.
- Job inferensi persisten tahan restart (saat ini request + retry, pelatihan job status process-local).
### P2
- Reset password, verifikasi email, lisensi/open source model inventory rinci, peningkatan aksesibilitas dan lokalisasi.
- PDF longitudinal, export anonymized aggregate dataset, grafik per tugas/tingkat kesulitan.

## Langkah berikutnya
1. Validasi perangkat dan ujaran nyata bersama pendamping.
2. Prioritaskan dataset multimodal Indonesia berpasangan untuk training/fusion yang sahih.
3. Kembangkan pembagian peran orang tua/admin dan penugasan latihan.

## Menjalankan
Supervisor mengelola frontend/backend; environment tidak diubah. Model speech sudah diunduh. Untuk setup ulang, jalankan backend/setup_local_models.py; sistem memerlukan espeak-ng untuk TTS. Dataset harus tetap diekstrak di /app/assets/dataset/ETDD70_v2/data/data. Baseline dapat direproduksi dengan python backend/ml_pipeline.py. Model/asset besar bukan bagian source-code yang ringan; pertahankan direktori tersebut.