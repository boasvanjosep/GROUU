# GROUU — All-in-One Personal Workspace Dashboard

GROUU adalah aplikasi dashboard minimalis dan responsif yang dirancang untuk mengelola produktivitas dan finansial pribadi dalam satu layar. Aplikasi ini menggabungkan pencatatan pengeluaran (expense ledger), manajemen jadwal kegiatan (activity planner), dan penyimpanan catatan ide (blueprint notes) tanpa memerlukan database pihak ketiga yang rumit.

Live Demo: https://grouu.vercel.app/

---

## Fitur Utama

* **Quick Entry Workspace** — Input pengeluaran, agenda kegiatan, atau catatan memo secara kilat melalui satu formulir terpadu yang 100% responsif di layar HP maupun desktop.
* **Smart Expense Ledger** — Pencatatan keuangan dengan format otomatis Rupiah dan pilihan metode pembayaran bertingkat (Cash, Bank, E-Wallet, atau Custom).
* **Activity & Agenda Tracker** — Kelola jadwal harian, waktu mulai-selesai, hingga tautan langsung ke ruang meeting (seperti Zoom/Google Meet).
* **Cloud Database Gratis** — Menggunakan Google Sheets sebagai tempat penyimpanan data utama, sehingga data Anda aman, transparan, dan bisa diakses kapan saja secara gratis.

---

## Tech Stack yang Digunakan

Aplikasi ini dibangun menggunakan kombinasi teknologi modern untuk performa yang cepat dan tampilan yang interaktif:

* **Frontend Framework:** React 18 (TypeScript)
* **Build Tool:** Vite (Super cepat untuk pengembangan lokal)
* **Styling & UI:** Tailwind CSS (Untuk desain antarmuka modern dan responsif)
* **Icons:** Lucide React
* **Database & Backend:** Google Sheets API + Google Apps Script (GAS)

---

## Cara Menjalankan Proyek Secara Lokal

Jika Anda ingin mencoba atau mengembangkan aplikasi ini di komputer sendiri, ikuti langkah mudah berikut:

### Prasyarat
Pastikan Anda sudah menginstal Node.js di komputer Anda.

### 1. Clone Repositori
Buka terminal/command prompt, lalu jalankan perintah:
git clone https://github.com/boasvanjosep/GROUU.git
cd GROUU

### 2. Instal Dependency
Instal semua modul/pustaka yang dibutuhkan oleh proyek:
npm install

### 3. Jalankan Aplikasi (Development Mode)
Mulai server lokal untuk melihat aplikasi berjalan di browser:
npm run dev

Buka alamat http://localhost:5173 (atau port yang tertera di terminal) di browser Anda.

---

## Integrasi dengan Google Sheets Anda

Agar data yang Anda input di aplikasi ini tersimpan ke Google Sheets Anda sendiri, Anda hanya perlu memasukkan API URL Gateway dan Token Google Apps Script Anda langsung melalui tombol Konfigurasi (ikon gerigi) yang ada di dalam aplikasi web GROUU. 

Tidak perlu mengubah source code, semuanya bisa dikonfigurasi langsung dari halaman depan!

---

## Lisensi

Proyek ini dilisensikan di bawah Apache-2.0 License. Silakan gunakan, modifikasi, dan kembangkan sesuai kebutuhan Anda!