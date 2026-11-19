# PWA Mata Elang MADAS Sedarah

Aplikasi direktori anggota untuk MADAS Sedarah DPC Kota Probolinggo.
Pengunjung dapat melihat dan mencari data. Hanya akun admin yang terdaftar
di tabel `admin_users` Supabase yang dapat menambah, mengubah, dan menghapus data.

## Deploy ke GitHub Pages

### 1. Buat repository
1. Login ke GitHub.
2. Klik **New repository**.
3. Beri nama, misalnya `madas-mata-elang`.
4. Pilih **Public** jika situs akan dibuka oleh semua anggota.
5. Klik **Create repository**.

### 2. Upload file aplikasi
1. Ekstrak file ZIP aplikasi di komputer.
2. Buka repository GitHub yang baru dibuat.
3. Klik **Add file > Upload files**.
4. Upload seluruh ISI folder aplikasi (jangan upload folder pembungkusnya).
5. Pastikan `index.html` terlihat di halaman utama repository.
6. Klik **Commit changes**.

### 3. Siapkan database dan admin di Supabase
1. Buat project di https://supabase.com.
2. Buka **SQL Editor**.
3. Salin seluruh isi `supabase-setup.sql`, lalu jalankan (**Run**).
4. Buka **Authentication > Users > Add user** untuk membuat email dan password admin.
5. Salin **User UID** admin tersebut.
6. Di SQL Editor jalankan perintah berikut, ganti UUID dengan User UID yang sebenarnya:

   ```sql
   insert into public.admin_users (user_id)
   values ('UUID-AKUN-ADMIN');
   ```

7. Buka **Project Settings > API** dan salin **Project URL** serta **anon/public key**.

### 4. Hubungkan aplikasi ke Supabase
1. Di repository GitHub, buka file `app.js`.
2. Klik ikon pensil (**Edit**).
3. Cari bagian paling atas:

   ```js
   const SUPABASE_URL = "ISI_SUPABASE_PROJECT_URL";
   const SUPABASE_ANON_KEY = "ISI_SUPABASE_ANON_KEY";
   ```

4. Ganti nilai tersebut dengan Project URL dan anon/public key dari Supabase.
5. Klik **Commit changes**.

   **Penting:** gunakan anon/public key saja. Jangan pernah memasukkan `service_role` key ke dalam aplikasi atau repository publik.

### 5. Aktifkan GitHub Pages
1. Buka **Settings** repository.
2. Pilih **Pages** di menu sebelah kiri.
3. Pada **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih branch `main` dan folder `/(root)`.
5. Klik **Save**.
6. Tunggu proses selesai. GitHub akan menampilkan alamat website, biasanya:
   `https://NAMA-AKUN.github.io/NAMA-REPOSITORY/`

### 6. Pasang di iPad/iPhone
1. Buka alamat GitHub Pages menggunakan Safari.
2. Tekan tombol **Bagikan**.
3. Pilih **Tambahkan ke Layar Utama**.
4. Buka ikon aplikasi MADAS dari layar utama.

## Catatan penting
- GitHub Pages hanya meng-host file aplikasi statis. Data anggota dan autentikasi admin disimpan di Supabase.
- Pengunjung bisa melihat data tanpa login; hanya admin yang terdaftar di `admin_users` bisa mengelola data.
- RLS (Row Level Security) pada Supabase membatasi operasi tulis ke admin.
- Aplikasi menyimpan file tampilan agar dapat dibuka kembali saat offline setelah pernah dimuat. Membaca data terbaru dan mengelola data memerlukan internet.
- Repository publik berarti kode aplikasi dapat dilihat siapa pun. Itu normal untuk GitHub Pages; jangan simpan password atau service-role key di kode.
