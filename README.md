# SIM-PESANTREN ERP — Tahap 1 & 2 (web)

Fondasi: login, pemulihan sandi, RBAC dari database, pengaturan lembaga, tahun ajaran,
manajemen pengguna & peran. Semua izin ditegakkan oleh RLS di PostgreSQL.

## Instalasi
1. Buat project di https://supabase.com.
2. Jalankan berurutan di SQL Editor: `supabase/migrations/001_*.sql`, `002_*.sql`, lalu `003_*.sql`.
3. Authentication > Users > Add user (buat akun admin pertama), lalu jalankan blok
   "Super Admin pertama" di akhir file 001 (hilangkan komentar, ganti email & nama).
4. `cp .env.example .env.local`, isi URL dan anon/publishable key.
5. `npm install && npm run dev` → http://localhost:3000
6. Authentication > URL Configuration: tambahkan `http://localhost:3000/auth/callback`
   dan URL produksi Anda ke Redirect URLs (untuk pemulihan kata sandi).

## Deployment
Vercel/Netlify: set dua environment variable di atas, lalu deploy. Jangan menyimpan
service role key di frontend.

## Tahap 2
Data santri (tambah/ubah/cari/filter/arsip, impor CSV dengan laporan kesalahan dan deteksi data ganda),
wali santri (satu wali banyak anak, hubungan harus disetujui), pegawai, kelas & pendaftaran kelas per
tahun ajaran, asrama (tabel siap, UI belum). Wali santri hanya bisa membaca anak yang hubungannya disetujui (RLS).
Belum ada: foto santri/pegawai, impor Excel (.xlsx; saat ini CSV), UI asrama, riwayat jabatan pegawai,
dokumen pegawai, UI rekening pegawai, ekspor.

## Status
Berfungsi (setelah dikonfigurasi & diuji oleh Anda): login/logout, pemulihan sandi,
sidebar berbasis izin, dasbor dari database, pengaturan lembaga, tahun ajaran,
aktivasi pengguna, penugasan peran.
Belum ada: unggah logo, undang pengguna dari UI (perlu server action dengan service role),
semua modul Tahap 2–7, APK Android (Capacitor, Tahap 7).
Belum diuji: seluruh kode ini ditulis tanpa dijalankan; jalankan `npm run build` dan uji tiap peran.
