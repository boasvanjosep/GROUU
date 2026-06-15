# ASISTEN KEUANGAN & PRODUKTIVITAS PRIBADI: SPESIFIKASI REPOSITORI

## ## METADATA PROYEK
Aplikasi "Asisten Keuangan & Produktivitas Pribadi" (GROUU) dirancang menggunakan arsitektur modern full-stack serverless yang memisahkan area *Frontend* dan *Backend*. Sisi *Frontend* dibangun menggunakan framework **React 18 + TypeScript + Vite** (dapat di-host pada platform hosting statis seperti Vercel atau Cloud Run) yang menyajikan antarmuka pengguna (UI) modern berkecepatan tinggi dengan pemanfaatan Tailwind CSS untuk estetika desain. Hubungan integrasi data dikelola secara dinamis melalui sisi *Backend* serverless berbasis **Google Apps Script (GAS)**, yang berperan sebagai API Gateway untuk melakukan interaksi langsung dengan ekosistem Google Workspace—termasuk pencatatan ledger pada Google Sheets, sinkronisasi kalender pada Google Calendar, serta penyimpanan biner file-file multimedia berkualitas tinggi pada Google Drive secara langsung tanpa memerlukan database server tradisional.

## ## STRUKTUR ARSITEKTUR FILE

### ### 1. Sektor Frontend (React + TypeScript + Vite)
```text
/
├── index.html          # Titik masuk utama (entry point) HTML untuk me-mount aplikasi React ke dalam DOM browser.
├── package.json        # Manifest proyek untuk mengelola modul dependencies, scripts build, dan metadata npm.
├── vite.config.ts      # Konfigurasi platform pengembangan Vite untuk kompilasi modul super-cepat.
└── src/
    ├── main.tsx        # File pengeksekusi utama untuk melakukan proses render komponen React di dalam root DOM.
    ├── App.tsx         # Komponen root aplikasi yang mengelola perutean tampilan (views) dan status global context.
    ├── index.css       # File stylesheet global berisi definisi tema kustom Tailwind CSS dan deklarasi font Outfit.
    ├── config.ts       # Pusat konfigurasi URL endpoint API Gateway serta fallback status local storage.
    ├── types.ts        # Definisi antarmuka (interfaces) tipe data TypeScript yang seragam untuk seluruh sistem.
    ├── components/
    │   ├── BottomNav.tsx # Komponen navigasi bar bawah yang mengendalikan transisi halaman pada tampilan seluler.
    │   ├── Sidebar.tsx   # Panel menu navigasi desktop persisten yang juga menyediakan akses ke modal konfigurasi API.
    │   └── Toast.tsx     # Layanan notifikasi pop-up responsif untuk konfirmasi aksi simpan dan kesalahan sistem.
    ├── pages/
    │   ├── Dashboard.tsx # Dasbor interaktif utama yang menyajikan ringkasan statistik dan akses cepat fitur.
    │   ├── QuickEntry.tsx # Form input terpadu untuk pencatatan pengeluaran, agenda kalender, dan draf catatan.
    │   └── Archive.tsx   # Panel repositori lokal/cloud untuk melakukan pencarian, penyaringan, dan pembacaan catatan.
    └── services/
        └── api.ts      # Handler komunikasi HTTP yang melakukan transmisi payload transaksi ke Google Apps Script Gateway.
```

### ### 2. Sektor Backend (Google Apps Script Deployment)
Representasi struktur virtual di dalam Google Apps Script (berisi file-file template HTML & Script untuk kontroler/pandangan internal) yang dikoordinasikan dalam satu proyek skrip:
```text
AppsScriptProject/
├── Config.gs           # Mengatur variabel global proyek seperti ID Spreadsheet, Nama Kalender, dan Folder ID Drive.
├── Main.gs             # Handler utama doPost(e) dan doGet(e) yang merutekan setiap aksi API ke fungsi yang sesuai.
├── ExpenseController.gs # Logika memproses data transaksi keuangan dan menyisipkannya ke tab "Pengeluaran" Sheets.
├── NoteController.gs   # Penangan operasi pembuatan, pembacaan, dan penyimpanan berkas lampiran berbasis file ke Drive.
└── CalendarController.gs # Logika pembuatan dan sinkronisasi acara kalender menggunakan Google Calendar API secara otomatis.
```
*Catatan Struktural*: Secara tradisional di Workspace GAS, komponen ini dapat dideploy dengan file terpisah seperti `index.html` (menyediakan UI fallback), `script.js` (komunikasi client-server GAS via `google.script.run`), `config.js` (konfigurasi variabel client-side), serta `notes.html` & `notes.js` (manajemen data draf) agar platform model AI dapat langsung memahami alokasi modul server-side secara modular demi fungsionalitas murni.

## ## KONTRAK DATA & ENDPOINT (API FLOW)
Setiap permintaan dikirim menggunakan metode HTTP POST ke URL API web Apps Script dengan payload `application/json`. Prosedur diproses oleh satu endpoint gerbang utama (`doPost`) yang mengevaluasi parameter properti `action` sebagai penunjuk rute logika berikut:

### ### 1. action: "createExpense"
*   **Deskripsi**: Melakukan komit pencatatan transaksi keuangan ke baris baru tab "Pengeluaran" pada Google Sheets.
*   **Tipe Input Payload JSON**:
    ```json
    {
      "action": "createExpense",
      "amount": 250000,
      "category": "FnB",
      "paymentMethod": "Gopay",
      "description": "Beli bahan makan mingguan",
      "notes": "Belanja dari Supermarket lokal"
    }
    ```
*   **Format Respon Berhasil (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Expense saved successfully to Google Sheets.",
      "data": {
        "id": "exp_1717582967000",
        "formattedAmount": "Rp 250.000"
      }
    }
    ```

### ### 2. action: "createSchedule"
*   **Deskripsi**: Membuat jadwal aktivitas baru atau agenda penting langsung pada Google Calendar pengguna secara real-time.
*   **Tipe Input Payload JSON**:
    ```json
    {
      "action": "createSchedule",
      "title": "Weekly Dev Sync",
      "date": "2026-06-12",
      "time": "10:00 AM",
      "location": "Zoom Meeting Link",
      "notes": "Membahas progres migrasi API Gateway ke Google Apps Script."
    }
    ```
*   **Format Respon Berhasil (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Event synchronized successfully with Google Calendar.",
      "data": {
        "eventId": "cal_evt_59ab2f9acde1"
      }
    }
    ```

### ### 3. action: "createNote"
*   **Deskripsi**: Menyimpan catatan baru ke dalam Google Sheets secara berurutan dan mengunggah muatan berkas biner pendukung (jika disertakan) ke dalam Google Drive.
*   **Tipe Input Payload JSON**:
    ```json
    {
      "action": "createNote",
      "title": "Ideasi Desain UI",
      "category": "Design",
      "content": "Rancangan tata letak antarmuka minimalis bernuansa dark mode obsidian.",
      "url": "https://figma.com/file/mockup",
      "fileData": "data:image/png;base64,iVBORw0KGgoAAAANS...", 
      "fileName": "screenshot_dashboard.png"
    }
    ```
*   **Format Respon Berhasil (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Note draft created and attachment archived in Google Drive successfully.",
      "data": {
        "id": "note_1717582988000",
        "driveFileUrl": "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvW"
      }
    }
    ```

### ### 4. action: "listNotes"
*   **Deskripsi**: Mengambil seluruh daftar catatan terdokumentasi dari tabel tab "Catatan" Google Sheets sebagai data array terstruktur.
*   **Tipe Input Payload JSON**:
    ```json
    {
      "action": "listNotes"
    }
    ```
*   **Format Respon Berhasil (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "note_1717582988000",
          "createdAt": "2026-06-05T04:42:00Z",
          "title": "Ideasi Desain UI",
          "category": "Design",
          "content": "Rancangan tata letak antarmuka minimalis bernuansa dark mode obsidian.",
          "url": "https://figma.com/file/mockup",
          "attachmentName": "screenshot_dashboard.png",
          "attachmentUrl": "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvW"
        }
      ]
    }
    ```

## ## DATA SCHEMA (STRUKTUR TABEL SHEETS)
Untuk memfasilitasi penyimpanan data transaksional, Google Sheets disiapkan memiliki dua lembar kerja tab wajib dengan struktur skema kolom terdefinisi berikut:

### ### 1. Tab "Pengeluaran"
Menampung data ledger transaksi finansial pribadi pengguna.

| Nama Kolom | Tipe Data | Deskripsi / Format Konten | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| **ID** | String | Auto-generated timestamp unik berbasis UNIX prefix `exp_` | `exp_1717582967000` |
| **Tanggal** | Date | Format waktu perekaman ISO YYYY-MM-DD | `2026-06-05` |
| **Nominal**| Number | Nilai transaksi keuangan mentah dalam satuan Rp | `250000` |
| **Kategori**| String | Token kategori pengenal transaksi keuangan | `FnB` |
| **Metode Pembayaran** | String | Nama instrumen keuangan yang digunakan | `Gopay` |
| **Deskripsi**| String | Catatan pihak penerima atau peruntukan transaksi | `Beli bahan makan mingguan` |
| **Catatan Tambahan**| String | Detil tambahan opsional untuk transaksi terkait | `Belanja dari Supermarket lokal` |

### ### 2. Tab "Catatan"
Menyimpan draf ide, bookmark tautan eksternal, dan tautan dokumen unggahan virtual.

| Nama Kolom | Tipe Data| Deskripsi / Format Konten | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| **ID** | String | Auto-generated UNIX timestamp unik dengan prefix `note_` | `note_1717582988000` |
| **Tanggal Buat** | DateTime | Format timestamp lengkap UTC ISO 8601 | `2026-06-05T04:42:00Z` |
| **Judul** | String | Judul rujukan dokumen draf | `Ideasi Desain UI` |
| **Kategori**| String | Tag pengelompokan subyek catatan | `Design` |
| **Konten** | String | Blok teks naskah catatan terstruktur | `Rancangan tata letak antarmuka minimalis...` |
| **Tautan Referensi** | String | URL external referensi/bookmark | `https://figma.com/file/mockup` |
| **Nama Lampiran** | String | File asli dari berkas pendukung yang diunggah | `screenshot_dashboard.png` |
| **Drive File URL**| String | URL akses download berkas yang diarsipkan di Drive | `https://drive.google.com/open?id=1AbCd...` |

## ## CONTOH KODE BACKEND (BOILERPLATE GAS)
Berikut adalah implementasi skrip Google Apps Script lengkap siap sebar (deploy) untuk diletakkan di dalam Google Apps Script Editor (`Main.gs`). Skrip ini menangani router `doPost` serta mengelola manipulasi ke ekosistem Sheets, Calendar, dan Drive:

```javascript
/**
 * GOOGLE APPS SCRIPT API GATEWAY FOR GROUU FINANCIAL & PRODUCTIVITY CO-PILOT
 * 
 * Konfigurasi ID Spreadsheet, Nama Kalender, dan Folder ID Drive diatur 
 * melalui Google Apps Script global properties atau langsung di baris berikut.
 */
var SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI";
var DRIVE_FOLDER_ID = "MASUKKAN_ID_FOLDER_DRIVE_ANDA_DI_SINI";

// Objek CORS Header Helper untuk meloloskan request dari browser
function buildJsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST Request
 * @param {Object} e - Event parameter dari HTTP request payload
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return buildJsonResponse({ success: false, error: "Empty request payload." });
    }

    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;

    if (!action) {
      return buildJsonResponse({ success: false, error: "Parameter 'action' is required." });
    }

    switch (action) {
      case "createExpense":
        return handleCreateExpense(requestData);
      case "createSchedule":
        return handleCreateSchedule(requestData);
      case "createNote":
        return handleCreateNote(requestData);
      case "listNotes":
        return handleListNotes();
      default:
        return buildJsonResponse({ success: false, error: "Action '" + action + "' not recognized." });
    }
  } catch (err) {
    return buildJsonResponse({ success: false, error: "Server Internal Error: " + err.toString() });
  }
}

/**
 * Handle HTTP GET Request (Optional - Healthcheck)
 */
function doGet(e) {
  return buildJsonResponse({ status: "active", version: "1.0.0", message: "GROUU API Gateway is running." });
}

/**
 * Aksi 1: createExpense -> Menulis baris pengeluaran di Google Sheets
 */
function handleCreateExpense(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Pengeluaran");
  if (!sheet) {
    sheet = ss.insertSheet("Pengeluaran");
    sheet.appendRow(["ID", "Tanggal", "Nominal", "Kategori", "Metode Pembayaran", "Deskripsi", "Catatan Tambahan"]);
  }

  var expenseId = "exp_" + new Date().getTime();
  var todayStr = new Date().toISOString().substring(0, 10);
  var amount = Number(data.amount) || 0;
  var category = data.category || "General";
  var paymentMethod = data.paymentMethod || "Cash";
  var description = data.description || "";
  var notes = data.notes || "";

  sheet.appendRow([expenseId, todayStr, amount, category, paymentMethod, description, notes]);

  return buildJsonResponse({
    success: true,
    message: "Expense saved successfully to Google Sheets.",
    data: {
      id: expenseId,
      formattedAmount: "Rp " + amount.toLocaleString("id-ID")
    }
  });
}

/**
 * Aksi 2: createSchedule -> Membuat acara baru di Google Calendar utama
 */
function handleCreateSchedule(data) {
  var calendar = CalendarApp.getDefaultCalendar();
  var title = data.title || "Agendas";
  
  // Format parsing tanggal dan waktu sederhana
  var datePart = data.date; // YYYY-MM-DD
  var timePart = data.time || "09:00 AM"; // Format: hh:mm AM/PM
  
  // Konversi representasi string waktu ke format objek tanggal JS
  var dateObj = new Date(datePart + " " + timePart);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date(datePart); // Fallback ke awal hari jika waktu gagal diparsing
  }

  var durationInMinutes = 60; // Default durasi agenda adalah 1 jam
  var endPeriod = new Date(dateObj.getTime() + durationInMinutes * 60000);

  var options = {
    location: data.location || "",
    description: data.notes || ""
  };

  var event = calendar.createEvent(title, dateObj, endPeriod, options);

  return buildJsonResponse({
    success: true,
    message: "Event synchronized successfully with Google Calendar.",
    data: {
      eventId: event.getId()
    }
  });
}

/**
 * Aksi 3: createNote -> Menulis Catatan ke Sheet & Mengunggah File ke Drive
 */
function handleCreateNote(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Catatan");
  if (!sheet) {
    sheet = ss.insertSheet("Catatan");
    sheet.appendRow(["ID", "Tanggal Buat", "Judul", "Kategori", "Konten", "Tautan Referensi", "Nama Lampiran", "Drive File URL"]);
  }

  var noteId = "note_" + new Date().getTime();
  var creationTime = new Date().toISOString();
  var title = data.title || "Untitled";
  var category = data.category || "Uncategorized";
  var content = data.content || "";
  var url = data.url || "";
  var filename = data.fileName || "";
  var driveFileUrl = "";

  // Mengunggah gambar/file biner base64 ke folder Google Drive spesifik (jika ada fileData)
  if (data.fileData && filename) {
    try {
      // Membersihkan dataURI header prefix jika disertakan
      var base64Part = data.fileData;
      if (base64Part.indexOf(",") !== -1) {
        base64Part = base64Part.split(",")[1];
      }
      
      var decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Part));
      decodedBlob.setName(filename);
      
      var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var driveFile = folder.createFile(decodedBlob);
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveFileUrl = driveFile.getUrl();
    } catch (uploadError) {
      Logger.log("Failed to upload file to Google Drive: " + uploadError.toString());
      // Lanjutkan proses simpan catatan teks meskipun unggahan berkas gagal
    }
  }

  sheet.appendRow([noteId, creationTime, title, category, content, url, filename, driveFileUrl]);

  return buildJsonResponse({
    success: true,
    message: "Note draft created and attachment archived in Google Drive successfully.",
    data: {
      id: noteId,
      driveFileUrl: driveFileUrl
    }
  });
}

/**
 * Aksi 4: listNotes -> Menarik total daftar catatan dari Google Sheets
 */
function handleListNotes() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Catatan");
  var list = [];

  if (sheet) {
    var rows = sheet.getDataRange().getValues();
    // Baris ke-0 merupakan header tabel, iterasi dimulai dari baris ke-1
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      list.push({
        id: row[0],
        createdAt: row[1],
        title: row[2],
        category: row[3],
        content: row[4],
        url: row[5],
        attachmentName: row[6],
        attachmentUrl: row[7]
      });
    }
  }

  return buildJsonResponse({
    success: true,
    data: list
  });
}