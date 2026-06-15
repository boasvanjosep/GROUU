# GROUU

GROUU adalah aplikasi dashboard personal yang membantu Anda mengelola **keuangan**, **jadwal aktivitas**, dan **catatan ide** dalam satu tempat. Proyek ini dibuat responsif, minimalis, dan terhubung dengan **Google Sheets** melalui **Google Apps Script** sebagai backend ringan.

[Live Demo](https://grouu.vercel.app/)

---

## Overview

GROUU dirancang untuk menjadi workspace harian yang cepat dan sederhana:

- mencatat pengeluaran dengan cepat
- mengatur agenda dan aktivitas
- menyimpan blueprint notes beserta lampiran
- memakai Google Sheets sebagai penyimpanan data utama

---

## Features

- **Quick Entry Workspace**  
  Form terpadu untuk input data secara cepat di desktop maupun mobile.

- **Expense Ledger**  
  Pencatatan keuangan dengan kategori, metode pembayaran, dan format Rupiah.

- **Activity & Agenda Tracker**  
  Kelola jadwal kegiatan, waktu mulai-selesai, lokasi, dan catatan tambahan.

- **Blueprint Notes**  
  Simpan ide, referensi, dan file pendukung secara rapi.

- **Google Sheets Integration**  
  Data disimpan di Google Sheets melalui Google Apps Script, sehingga tidak membutuhkan database tradisional.

---

## Tech Stack

- **Frontend:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Backend / Storage:** Google Apps Script + Google Sheets

---

## Project Structure

Struktur utama project:

- `src/` — source frontend
- `api/` — endpoint/proxy backend
- `index.html`
- `vite.config.ts`
- `package.json`
- `.env.example`
- `.gitignore`

---

## Requirements

- Node.js
- npm

---

## Installation

```bash
git clone https://github.com/boasvanjosep/GROUU.git
cd GROUU
npm install
```

---

## Development

```bash
npm run dev
```

Pada konfigurasi saat ini, Vite berjalan di **port 3000** dan host `0.0.0.0`.

---

## Build

```bash
npm run build
```

## Preview Build

```bash
npm run preview
```

## Type Check

```bash
npm run lint
```

---

## Configuration

Untuk menghubungkan aplikasi ke instance Google Sheets milik Anda sendiri, siapkan:

- Spreadsheet ID
- Drive Folder ID
- Calendar ID
- Token autentikasi `GROUU_TOKEN`

Setelah itu, masukkan URL gateway dan token melalui menu konfigurasi di aplikasi.

---

## Security Notes

- Jangan commit file `.env` berisi kredensial asli.
- Simpan token dan ID layanan di tempat yang aman.
- Pastikan request ke backend selalu divalidasi menggunakan `grouuToken`.

---

## License

Released under the **Apache-2.0 License**.