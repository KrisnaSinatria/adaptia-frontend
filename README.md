# ADAPTIA — Uji Pemahaman dengan Mengajari AI

**Tim:** nama grup
**Kompetisi:** IT RUSH 2026  
**Subtema 1:** Inclusive Education and Future Skills

ADAPTIA membantu mahasiswa menguji pemahaman dengan menjelaskan jawabannya kepada **Boby, murid AI yang bertanya kembali**. Dosen dapat membaca alasan mahasiswa, meninjau bukti per kriteria, dan menentukan pendampingan berikutnya.

## Latar belakang

Jawaban akhir yang benar belum selalu memperlihatkan cara mahasiswa memahami sebuah konsep. Saat diminta menjelaskan alasan, menanggapi pernyataan yang keliru, atau menghadapi kasus baru, bagian yang masih membingungkan bisa menjadi lebih terlihat. Dalam tugas tertulis, proses berpikir ini sering belum tergali melalui pertanyaan lanjutan.

Dosen juga perlu membaca penjelasan setiap mahasiswa untuk mengetahui letak kesulitannya. Hasil akhir atau satu angka saja memberikan konteks yang terbatas untuk memilih siapa yang membutuhkan bantuan dan bagian apa yang perlu diperjelas. ADAPTIA dirancang untuk mengumpulkan penjelasan tersebut dalam alur asesmen yang dapat ditinjau dosen.

## Solusi

ADAPTIA menggunakan pendekatan **reverse tutoring**. Mahasiswa menjelaskan jawaban dan alasan kepada Boby, yang berperan sebagai murid AI. Boby mengajukan pertanyaan lanjutan dan menyampaikan pernyataan uji yang perlu ditanggapi mahasiswa dengan pilihan setuju atau tidak setuju beserta alasannya.

Alur belajar terdiri dari **Praktik → Jelaskan ke Boby → Penerapan**. Penjelasan mahasiswa menjadi bahan tinjauan per kriteria pemahaman. Pada versi terintegrasi, AI membantu mengusulkan temuan dengan kutipan jawaban sebagai bukti. Dosen memeriksa temuan, memberi catatan, dan menentukan tindak lanjut. Asesmen ini bersifat formatif untuk membantu proses belajar.

## Pengguna dan fitur utama

| Pengguna | Fitur | Tujuan |
| --- | --- | --- |
| Mahasiswa | Dashboard dan daftar sesi | Melihat sesi yang perlu dikerjakan, kemajuan, serta batas waktu. |
| Mahasiswa | Ruang asesmen | Mengerjakan praktik, menjelaskan alasan kepada Boby, dan menjawab soal penerapan. |
| Mahasiswa | Ringkasan dan catatan dosen | Membaca bagian yang sudah kuat, bagian yang perlu diperjelas, dan umpan balik. |
| Mahasiswa | Kegiatan penguatan | Melihat latihan lanjutan dari dosen dan kemajuannya. |
| Dosen | Penyiapan sesi | Menentukan materi, tugas, pertanyaan, dan kriteria pemahaman. |
| Dosen | Tinjauan hasil | Membaca jawaban dan percakapan, memeriksa temuan, serta memberikan koreksi dan catatan. |
| Dosen | Peta kelas dan pendampingan | Melihat kebutuhan belajar mahasiswa dan menyiapkan tindak lanjut. |

Fitur di atas menggambarkan alur purwarupa. Sumber data, penyimpanan, dan penggunaan AI mengikuti versi yang dijalankan, sebagaimana dijelaskan pada bagian **Cakupan versi**.

## Alur penggunaan

1. **Dosen menyiapkan sesi.** Materi, tugas, dan kriteria pemahaman menjadi acuan asesmen.
2. **Mahasiswa mengerjakan praktik.** Mahasiswa menulis langkah pengerjaan dan penjelasan awal dengan kata-katanya sendiri.
3. **Mahasiswa menjelaskan kepada Boby.** Percakapan dibatasi tiga pertanyaan. Mahasiswa memberi alasan dan menanggapi pernyataan uji. Pada versi yang mendukung suara, transkrip dapat diperiksa sebelum dikirim.
4. **Mahasiswa menjawab penerapan.** Kasus baru memberi kesempatan untuk menggunakan konsep yang sama dalam situasi berbeda.
5. **Dosen meninjau hasil.** Dosen membaca bukti, memutuskan temuan, dan memberikan umpan balik atau kegiatan penguatan.
6. **Mahasiswa membaca hasil tinjauan.** Ringkasan dan catatan dosen membantu mahasiswa menentukan bagian yang perlu dipelajari kembali.

## Demo untuk juri

**[Buka ADAPTIA di Vercel](https://adaptia-frontend.vercel.app/)**

Pilih **Masuk**, lalu **Demo sebagai mahasiswa** atau **Demo sebagai dosen**. Tombol demo memakai profil contoh tanpa akun pribadi, email kampus, atau kata sandi.

| Peran | Alur yang bisa dicoba |
| --- | --- |
| Mahasiswa | Buka **Sesi Belajar**, pilih sesi contoh, lalu kerjakan **Praktik → Ajari Boby → Penerapan**. Pada sesi yang sudah ditinjau, buka **Lihat ringkasan** untuk membaca hasil dan catatan dosen. |
| Dosen | Buka **Sesi Asesmen** untuk menyiapkan tugas dan kriteria pemahaman. Gunakan area **Tinjauan** untuk membuka bukti jawaban, meninjau temuan, dan memberi catatan. **Peta Kelas** dan **Pendampingan** menampilkan contoh tindak lanjut. |

## Cakupan versi

| Versi | Perilaku |
| --- | --- |
| Frontend `main` | Purwarupa statis yang berjalan di browser dengan data contoh dari `src/lib/data.ts`. Dialog Boby memakai skrip, mikrofon mengisi transkrip contoh, dan demo analisis di landing page memakai aturan kata kunci. Perubahan pada penyimpanan dalam memori hilang saat halaman dimuat ulang. |
| Frontend `experiment` + backend | Alur sesi dan peninjauan tertentu memakai API. Sejumlah layar tetap memakai data contoh. Pengenalan suara pada alur Queue memakai fitur browser yang didukung, misalnya Chrome, dan mengisi jawaban teks yang dapat diedit. |

Website Vercel adalah deployment demo. Untuk mereproduksi branch `main` yang didokumentasikan di sini, gunakan langkah lokal di bawah. Pada versi terintegrasi, label **Mode skrip** menandai sesi yang memakai respons simulasi.

## Arsitektur

Pada purwarupa statis, React menampilkan halaman dari data contoh dan menyimpan interaksi sementara di browser. Pada versi terintegrasi, frontend mengakses FastAPI melalui lapisan API, lalu backend berkomunikasi dengan database dan penyedia model.

```text
Browser mahasiswa / dosen
          |
          v
Frontend React + Vite
          | HTTP /api
          v
Backend FastAPI
          |-- Supabase / PostgreSQL    sesi, jawaban, dan tinjauan
          |-- Groq                    dialog Boby dan analisis bukti
          v
Hasil dan bukti ditampilkan untuk ditinjau dosen
```

Pada branch `experiment`, permintaan frontend dipusatkan di `src/lib/api.ts`. Pengaturan URL dasar API menentukan tujuan permintaan. Backend menyimpan kredensial database dan model.

## Cara AI digunakan dan batasannya

1. Frontend mengirim jawaban teks atau transkrip ke API FastAPI. Pada mode `live`, Boby memakai **OpenAI GPT-OSS 20B melalui Groq** untuk membuat pertanyaan lanjutan. Pernyataan uji dipilih dari bank soal.
2. **OpenAI GPT-OSS 120B melalui Groq** menyiapkan usulan temuan per kriteria. Backend memeriksa struktur keluaran dan mencocokkan kutipan dengan jawaban mahasiswa.
3. Dosen tetap meninjau temuan, mengubahnya bila perlu, dan memutuskan hasil serta tindak lanjut. Backend juga menyediakan `LLM_MODE=scripted` untuk demo berbasis skrip dan aturan.

[Repo frontend](https://github.com/KrisnaSinatria/adaptia-frontend) · [Branch frontend terintegrasi](https://github.com/KrisnaSinatria/adaptia-frontend/tree/experiment) · [Repo dan petunjuk backend](https://github.com/KrisnaSinatria/adaptia-backend#readme)

| Bagian | Masukan | Pemeriksaan dan keputusan |
| --- | --- | --- |
| Pertanyaan Boby | Jawaban mahasiswa dan konteks sesi | Percakapan mengikuti batas tiga pertanyaan. Mode respons ditandai sebagai `live` atau `scripted`. |
| Pernyataan uji | Bank pernyataan, kunci, dan alasan mahasiswa | Pilihan mahasiswa dibandingkan dengan kunci. Dosen dapat membaca alasan dalam konteks percakapan. |
| Analisis bukti | Jawaban, percakapan, dan kriteria pemahaman | Struktur respons dan keberadaan kutipan diperiksa sebelum temuan ditampilkan. |
| Hasil tinjauan | Usulan temuan dan bukti | Dosen menerima, mengoreksi, atau menolak temuan serta menambahkan catatan. |

AI dapat salah menafsirkan negasi, koreksi diri, atau penjelasan yang kurang lengkap. Kutipan yang ditemukan dalam jawaban tetap perlu dibaca dalam konteksnya. Persentase yang ditampilkan merujuk pada capaian kriteria sesi dan perlu dibaca bersama status tinjauan dosen.

## Data demo dan evaluasi

Nama, jawaban, dan hasil pada data contoh digunakan untuk memperagakan alur produk. Topik yang tampil mengikuti data pada versi atau deployment yang dibuka. Rekaman demo terbaru menggunakan materi **Titik Impas Usaha**, sedangkan salinan `main` yang diperiksa masih memuat contoh **Stack & Queue**.

Efektivitas belajar, akurasi analisis, dan penghematan waktu dosen perlu diukur melalui evaluasi tersendiri. Hasil demo belum membuktikan peningkatan pemahaman mahasiswa.

## Menjalankan frontend secara lokal

Gunakan Node.js 22 dan npm. Jalankan di Git Bash jika memakai Windows.

```bash
git clone https://github.com/KrisnaSinatria/adaptia-frontend.git
cd adaptia-frontend
npm ci
npm run dev
```

Buka alamat yang dicetak Vite, biasanya `http://localhost:5173/`. Branch `main` bisa dijalankan langsung tanpa file `.env` atau kredensial API.

| Perintah | Hasil |
| --- | --- |
| `npm run build` | Memeriksa tipe TypeScript dan membuat build di `dist/`. |
| `npm run preview` | Menyajikan hasil build lokal. Jalankan `npm run build` terlebih dahulu. |
| `npm run build:single` | Membuat `dist-single/index.html` dengan aset tertanam. |

Untuk mencoba branch `experiment`, siapkan backend dan database demo mengikuti README backend. Vite meneruskan `/api` ke `http://127.0.0.1:8000` saat pengembangan. Jika alamat lokal berbeda, gunakan `ADAPTIA_BACKEND_URL`. Pada deployment frontend terintegrasi, atur `VITE_API_URL` ke URL dasar backend yang berakhir dengan `/api`, lalu izinkan origin frontend di konfigurasi CORS backend. Simpan kredensial Supabase dan Groq hanya di backend.

## Variabel lingkungan versi terintegrasi

| Lokasi | Variabel | Kegunaan |
| --- | --- | --- |
| Frontend, saat build | `VITE_API_URL` | URL dasar API publik, berakhir dengan `/api`. |
| Frontend, server pengembangan | `ADAPTIA_BACKEND_URL` | Tujuan proxy Vite, bawaan `http://127.0.0.1:8000`. |
| Backend | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Menghubungkan API dengan database Supabase. |
| Backend | `GROQ_API_KEY` | Mengakses model melalui Groq. |
| Backend | `JWT_SECRET` | Menandatangani token sesi demo. |
| Backend | `LLM_MODEL`, `LLM_ANALYST_MODEL` | Memilih model Boby dan analis bukti. |
| Backend | `LLM_MODE` | Memilih mode `live` atau `scripted`. |
| Backend | `LLM_REASONING_EFFORT`, `LLM_TIMEOUT_SECONDS` | Mengatur penalaran model dan batas waktu permintaan. |
| Backend | `ALLOWED_ORIGINS`, `RATE_LIMIT_ENABLED` | Mengatur origin frontend yang diizinkan dan pembatasan laju permintaan. |

Gunakan `.env.example` dari repo backend sebagai acuan pengisian. Nilai rahasia disimpan dalam `.env` lokal atau konfigurasi hosting dan dikecualikan dari repository publik. Setiap variabel frontend berawalan `VITE_` dapat terbaca oleh browser.

## Peta kode

| Lokasi | Isi |
| --- | --- |
| [`src/App.tsx`](src/App.tsx) dan [`src/lib/router.tsx`](src/lib/router.tsx) | Navigasi berbasis hash, termasuk `#masuk`, `#mahasiswa`, dan `#dosen`. |
| [`src/landing/`](src/landing/) | Landing page dan simulasi interaktif Boby. |
| [`src/pages/student/`](src/pages/student/) | Sesi belajar, asesmen, ringkasan hasil, dan penguatan. |
| [`src/pages/lecturer/`](src/pages/lecturer/) | Penyiapan sesi, tinjauan, peta kelas, dan pendampingan. |
| [`src/lib/data.ts`](src/lib/data.ts) dan [`src/lib/store.ts`](src/lib/store.ts) | Data contoh serta penyimpanan sementara untuk purwarupa statis. |

## Penggunaan template, library, aset, dan AI assistant

| Kategori | Penggunaan |
| --- | --- |
| Frontend dan build | React, React DOM, TypeScript, Vite, `@vitejs/plugin-react`, `vite-plugin-singlefile`, `@types/react`, dan `@types/react-dom`. Versi yang terpasang dapat diperiksa di [`package-lock.json`](package-lock.json). |
| Tampilan | Tailwind CSS dan `@tailwindcss/vite` untuk styling, GSAP dan `@gsap/react` untuk animasi, serta Lucide React untuk ikon. |
| Font | Plus Jakarta Sans dan JetBrains Mono melalui Fontsource Variable, dengan berkas font di [`src/assets/fonts/`](src/assets/fonts/). |
| Kode dan aset yang disertakan | Efek animasi dari **Transitions.dev**. Ketentuannya tersedia di [`src/vendor/ui-generation.LICENSE.txt`](src/vendor/ui-generation.LICENSE.txt). Helper grafik [`src/vendor/charts.js`](src/vendor/charts.js) mencantumkan atribusi **tasteskill** pada header. Ilustrasi Boby tersedia sebagai SVG di [`src/components/Boby.tsx`](src/components/Boby.tsx), dan gambar di [`src/assets/previews/`](src/assets/previews/) adalah pratinjau antarmuka ADAPTIA. |
| Alat pengujian | Playwright digunakan oleh skrip pemeriksaan alur dan tangkapan layar di [`scripts/`](scripts/). |
| Backend dan layanan | Python, FastAPI, Uvicorn, Pydantic, pydantic-settings, supabase-py, Groq Python SDK, PyJWT, SlowAPI, HTTPX, dan pytest. Vercel menyajikan frontend, Supabase/PostgreSQL menyediakan database, dan Groq menyediakan akses ke model. Repo backend juga menyertakan konfigurasi deployment untuk Render. |
| AI coding assistant | **Claude (Anthropic)** membantu pengerjaan purwarupa frontend. **OpenAI Codex** membantu penelusuran dan eksperimen integrasi frontend–backend serta penyusunan dokumentasi. |
| Model AI di dalam produk | **OpenAI GPT-OSS 20B** untuk dialog Boby dan **OpenAI GPT-OSS 120B** untuk usulan temuan, melalui Groq pada mode `live`. |

**ADAPTIA — Proof the Understanding**
