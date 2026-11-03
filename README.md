# ADAPTIA — purwarupa terintegrasi

Landing page + Ruang Mahasiswa + Ruang Dosen. Alur sesi dan peninjauan menggunakan API backend; layar lain yang belum terhubung masih memakai data contoh di `src/lib/data.ts`.

```bash
npm install
npm run dev            # pengembangan
npm run build          # dist/ untuk Vercel/Netlify (static)
npm run build:single   # dist-single/index.html, satu berkas berisi semua aset
```

## Menjalankan dengan backend

Jalankan backend terlebih dahulu di `http://127.0.0.1:8000`, termasuk konfigurasi Supabase dan migrasi sesuai dokumentasi backend. Jalankan `npm run dev` pada frontend. Vite meneruskan permintaan `/api` ke backend; atur `ADAPTIA_BACKEND_URL` jika alamat backend lokal berbeda. Untuk deployment, atur `VITE_API_URL` ke URL API backend yang berakhir dengan `/api`, dan pastikan CORS di backend mengizinkan alamat frontend.

Login saat ini menggunakan akun demo dari backend. Latihan suara masih simulasi; belum terhubung ke pengenalan suara. Jangan menjalankan seed backend pada database berisi data penting: seed menghapus data yang ada.

## Rute (hash)
| Rute | Layar |
|---|---|
| `#` | Landing |
| `#mahasiswa` · `#mahasiswa--sesi--antrean-queue` · `#mahasiswa--penguatan` · `#mahasiswa--ringkasan--stack-vs-queue` | Ruang Mahasiswa |
| `#dosen` · `#dosen--sesi` · `#dosen--sesi--baru` · `#dosen--tinjauan--operasi-stack` · `#dosen--pendampingan` · `#dosen--pendampingan--tugaskan` · `#dosen--perkembangan` · `#dosen--bank-kegiatan` | Ruang Dosen |


