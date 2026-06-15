# GROUU: Personal Financial & Productivity Co-Pilot 🚀

GROUU adalah aplikasi asisten keuangan dan produktivitas pribadi modern berbasis **Full-Stack Serverless Architecture**. Aplikasi ini menggunakan **React 18 + TypeScript + Vite** di sisi Frontend dan memanfaatkan **Google Apps Script (GAS)** sebagai API Gateway serverless untuk berinteraksi langsung dengan ekosistem Google Workspace (Sheets, Calendar, Drive) tanpa memerlukan database tradisional.

Untuk mencegah celah *open-relay* pada Google Apps Script, proyek ini menggunakan **Vercel Serverless Functions** sebagai secure reverse proxy yang dilengkapi validasi lintas token (`GROUU_TOKEN`) dan proteksi bypass non-browser client.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Secure Proxy:** Vercel Serverless Functions (Node.js).
- **Backend/Database:** Google Apps Script (GAS), Google Sheets (Ledger), Google Calendar (Agenda), Google Drive (Binary Storage).

---

## 🔒 Fitur Keamanan (Production-Ready)

1. **Pre-Shared Access Token (`GROUU_TOKEN`):** Otentikasi berlapis dari Frontend -> Vercel Proxy -> Google Apps Script menggunakan token terenkripsi yang disimpan di Vercel Env dan GAS Script Properties.
2. **Anti-Bypass Protection:** Memblokir request ilegal langsung dari non-browser clients (seperti cURL, Postman, atau bot scanner).
3. **Zero Hardcoded Credentials:** Tidak ada ID Spreadsheet, ID Folder Drive, atau Token yang ditulis di dalam source code. Semua dibaca dinamis melalui memori server.

---

## 📁 Struktur Repositori

```text
/
├── index.html          # Entry point utama aplikasi
├── package.json        # Manifest npm & dependencies
├── vite.config.ts      # Konfigurasi bundler Vite
├── api/
│   └── gas.js          # Node.js Serverless Proxy (Vercel Backend)
└── src/
    ├── main.tsx        # Pengeksekusi utama DOM React
    ├── App.tsx         # Root component & global routing
    ├── config.ts       # Sinkronisasi konfig & local storage sanitizer
    ├── types.ts        # Definisi tipe data TypeScript
    ├── components/     # Sidebar, BottomNav, Toast UI
    ├── pages/          # Dashboard, QuickEntry, Archive (Daftar Catatan)
    └── services/       # Handler Axios/Fetch dengan injeksi GROUU_TOKEN
