PANDUAN APLIKASI PWA MATA ELANG MADAS SEDARAH
================================================

ISI APLIKASI
- Pengunjung/pengguna biasa: hanya dapat melihat dan mencari data.
- Admin: login, menambah data nama, nomor lambung, dan plat nomor; admin juga dapat mengedit/menghapus data.
- Data disimpan online di Supabase, bukan hanya di perangkat.
- Tampilan aplikasi dan logo dapat dibuka kembali saat offline setelah pernah dimuat, tetapi data terbaru membutuhkan internet.
- Bisa dipasang di iPad/iPhone melalui Safari > Bagikan > Tambahkan ke Layar Utama.

PENTING: PENGATURAN AWAL WAJIB
Aplikasi ini memerlukan Supabase gratis (atau paket sesuai kebutuhan) sebagai database dan login.
Jangan mengunggah aplikasi sebelum langkah berikut selesai.

1. Buat project di https://supabase.com
2. Buka SQL Editor pada project, salin seluruh isi file supabase-setup.sql, lalu Run.
3. Buka Authentication > Users > Add user. Buat email dan password khusus admin.
4. Salin User UID admin yang baru dibuat.
5. Kembali ke SQL Editor, jalankan:
   insert into public.admin_users (user_id) values ('TEMPEL-UUID-ADMIN-DI-SINI');
   Ganti teks di dalam tanda petik dengan User UID yang sebenarnya.
6. Buka Project Settings > API. Salin Project URL dan anon/public key.
7. Buka file app.js. Ganti:
   const SUPABASE_URL = "ISI_SUPABASE_PROJECT_URL";
   const SUPABASE_ANON_KEY = "ISI_SUPABASE_ANON_KEY";
   dengan nilai dari Supabase. Gunakan anon/public key, JANGAN gunakan service_role key.
8. Simpan semua file.

CARA UNGGAH KE HOSTING
1. Pastikan hosting memiliki HTTPS/SSL aktif.
2. Unggah seluruh isi folder ini ke folder website (umumnya public_html), bukan hanya file ZIP.
3. Jika hosting menerima ZIP: unggah ZIP, lalu Extract. Pastikan index.html berada langsung di folder utama website.
4. Buka alamat website. Coba cari data dan login admin.
5. Di iPad/iPhone buka alamat tersebut menggunakan Safari > tombol Bagikan > Tambahkan ke Layar Utama.

CARA PAKAI
- Admin tekan tombol Admin, masukkan email dan password.
- Isi Nama Anggota, Nomor Lambung, dan Plat Nomor, lalu tekan Simpan Data.
- Tombol Edit/Hapus hanya muncul saat admin login.
- Pengunjung tidak perlu login dan tidak mendapat tombol pengelolaan data.

KEAMANAN
- Hak akses tulis ditegakkan di database dengan Row Level Security (RLS), bukan hanya disembunyikan di tampilan.
- Hanya UUID yang dimasukkan ke tabel admin_users yang menjadi admin.
- Jangan membagikan password admin.
- Jangan pernah memasukkan service_role key ke app.js atau file publik.
- Siapa pun yang dapat membuka situs dapat melihat data anggota, sesuai permintaan aplikasi publik baca-saja. Jangan simpan data pribadi sensitif di kolom ini.

TROUBLESHOOTING
- Pesan "Aplikasi belum terhubung": URL dan anon key di app.js belum diganti dengan benar.
- Data tidak muncul: pastikan SQL dijalankan, tabel members ada, koneksi internet aktif, dan policy SELECT tersedia.
- Tidak bisa login admin: pastikan user dibuat di Authentication > Users dan UUID-nya sudah dimasukkan ke admin_users.
- Tombol admin tidak muncul setelah login: akun tersebut belum tercatat sebagai admin_users.
