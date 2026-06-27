# 🏡 Sistem Informasi Administrasi Rukun Tetangga (SI-RT Elite)

Aplikasi manajemen administrasi dan pembukuan keuangan kas mandiri tingkat Rukun Tetangga (RT) berbasis Web Progresif. Sistem ini mengintegrasikan performa API Agregasi dari **Laravel** dan antarmuka premium adaptif bertema gelap dari **React.js + Tailwind CSS v4**.

---

## 🛠️ Tech Stack & Prasyarat Sistem

Sebelum memulai instalasi, pastikan mesin lokal Anda sudah terpasang perkakas berikut:
* **PHP** >= 8.2 (Lengkap dengan ekstensi `pdo_mysql`, `mbstring`, `openssl`)
* **Composer** >= 2.x
* **Node.js** >= 18.x & **npm** >= 9.x
* **MySQL** atau **MariaDB Server**

---

## 🟢 Langkah 1: Instalasi & Konfigurasi Backend (Laravel API)

1. **Masuk ke direktori proyek backend Anda:**
   ```bash
   cd path/to/your/backend-folder
   ```

2. **Instal seluruh dependensi package PHP via Composer:**
   ```bash
   composer install
   ```

3. **Salin dan sesuaikan berkas konfigurasi lingkungan (.env):**
   ```bash
   cp .env.example .env
   ```

4. **Buka file `.env` dan sesuaikan kredensial database Anda:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=db_rt_elite
   DB_USERNAME=root
   DB_PASSWORD=your_secure_password
   ```

5. **Generate Application Key baru:**
   ```bash
   php artisan key:generate
   ```

6. **Tautkan direktori penyimpanan untuk penanganan unggah KTP:**
   ```bash
   php artisan storage:link
   ```

---

## 🗄️ Langkah 2: Migrasi Database & Seeding Data Sampel

Sistem ini dibekali dengan mesin kalkulasi keuangan otomatis berbasis data riil. Jalankan perintah migrasi beserta *Seeder* untuk mensimulasikan data penunggakan, pembayaran tahunan, dan pengeluaran operasional:

```bash
php artisan migrate:fresh --seed
```

*Catatan: Proses ini otomatis akan mengeksekusi `TransaksiKeuanganSeeder` untuk menyuntikkan data sampel keuangan dinamis sepanjang tahun buku 2026. Untuk username & password login menggunakan email : rt@rt.com dan passwword : rt-2026*

---

## 🔵 Langkah 3: Instalasi & Konfigurasi Frontend (React.js Client)

1. **Masuk ke direktori proyek frontend Anda:**
   ```bash
   cd path/to/your/frontend-folder
   ```

2. **Instal seluruh dependensi package node modules:**
   ```bash
   npm install
   ```

---

## 🚀 Langkah 4: Menjalankan Aplikasi

Untuk menguji aplikasi di browser lokal Anda, jalankan kedua server (Backend dan Frontend) secara bersamaan:

### 1. Jalankan Server API Laravel (Terminal 1):
```bash
php artisan serve
```
*Server backend akan berjalan secara default di URL: `http://127.0.0.1:8000`*

### 2. Jalankan Server Dev Client React (Terminal 2):
```bash
npm run dev
```
*Server frontend akan berjalan secara default di URL: `http://localhost:5173`*

Buka tautan frontend di browser Anda dan sistem siap diuji coba!

---