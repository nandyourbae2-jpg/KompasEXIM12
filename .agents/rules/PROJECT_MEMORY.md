---
description: Memori Proyek Jangka Panjang (Project Memory). File ini memberikan konteks otomatis kepada AI tentang arsitektur, status proyek, dan modul yang sudah selesai dibangun.
---

# 🧠 Kompas EXIM - Project Memory

File ini berfungsi sebagai **ingatan permanen** bagi AI di seluruh sesi percakapan. AI akan merujuk ke file ini untuk memahami konteks besar proyek.

## 1. Identitas & Arsitektur Proyek
- **Nama Proyek:** Kompas EXIM (Platform Manajemen Ekspor-Impor).
- **Tech Stack:** 
  - **Frontend:** React.js, Vite, React Router DOM (v6).
  - **Backend:** Node.js, Express.js.
  - **Database:** SQLite (menggunakan `better-sqlite3`).
- **Filosofi UI/UX:** Sangat ketat menggunakan **Apple Human Interface Guidelines (Apple-style)**. Hal ini mencakup penggunaan font sistem (Inter/SF Pro), warna netral (*canvas, parchment*), *glassmorphism*, sudut melengkung halus (*rounded-pill*), serta *Segmented Control Tabs* yang responsif.
- **Konsep Navigasi:** Menggunakan pola campuran. *Dynamic Registry* terpusat di `src/config/departmentFeatures.jsx` untuk membangun *Sidebar* berdasarkan departemen *user*, yang berpadu dengan *Static Routing* (seperti `ImportOpsLayout`) di `App.jsx`.

## 2. Status Modul Utama (Telah Selesai & Stabil)
Sistem ini membagi akses berdasarkan *Role* (Staff vs Supervisor/Manager) dan Departemen.

### 🏢 Departemen Administrasi Export (AE)
- **AE Workboard (Staff):** Berfungsi sebagai kokpit/ruang kerja staf AE. Terdiri dari 2 Tab Utama (menggunakan *Apple Segmented Control*):
  1. **Antrean Pekerjaan:** Menampilkan daftar *job* ekspor. Terintegrasi dengan *ActionFormEngine* untuk mengeksekusi aktivitas secara dinamis dan melakukan "Serahkan Draft / Original".
  2. **Buku Ekspedisi Handover:** Mencatat riwayat dokumen yang diserahkan ke tim AO. Mengambil data asli dari `handover_events` dan melihat status serah terima dari tabel `ao_tasks`. Menu *Handover* terpisah di sidebar telah dihapus untuk konsolidasi ke Workboard.
- **AE Control Tower (Supervisor):** Fitur untuk Supervisor memantau dan membagikan tugas (Assignment) kepada staf secara *real-time*.

### 🛳️ Departemen Import
- **Import Operational (Staff):** Tersusun secara rapi di bawah pelindung tata letak `<ImportOpsLayout />` (diatur di `App.jsx`), yang berisi:
  - *Shipment List* (`/workspace/import-operational`)
  - *Shipment Detail* (`/workspace/import-operational/:id`)
  - *Analysis* (`/workspace/import-analysis`)
  - *PlanGDG* (`/workspace/import-plangdg`)
  - *Master Data Import* (`/workspace/import-master`)
- **Peta Tugas & Dokumen Monitoring:** Fitur global operasional yang secara eksplisit diregistrasikan.

### 🏦 Departemen Account Officer (AO)
- Bertugas untuk menerima *handover* fisik/dokumen dari AE. Sinkronisasi status dilakukan secara *real-time* via *Handover Ledger* di sisi AE dan *Verifikasi AO* di sisi AO.

## 3. Catatan Penting untuk AI
1. **Dilarang Merusak Status Quo:** Fitur Import dan AE saat ini sudah berada dalam status **STABIL**. Jangan melakukan perubahan yang menghapus atau menimpa *layout* mereka.
2. **Backward Compatibility:** Apabila membuat menu baru, selalu pastikan sinkronisasi *path* di `departmentFeatures.jsx` dengan rute yang sesuai di `App.jsx`.
3. **Estetika Diutamakan:** Jangan pernah menggunakan UI bergaya *default bootstrap* atau *plain HTML*. Selalu tiru komponen *Apple-style* dari `.css` token yang ada di repositori.
