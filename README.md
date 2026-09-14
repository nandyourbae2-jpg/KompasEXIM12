# KOMPAS EXIM Platform

![KOMPAS EXIM](https://img.shields.io/badge/Status-Production%20Ready-success)
![Playwright Tests](https://img.shields.io/badge/E2E%20Tests-16%2F16%20Passed-brightgreen)
![React](https://img.shields.io/badge/React-19.0-blue)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)

Platform **KOMPAS EXIM** adalah sistem Enterprise Resource Planning (ERP) komprehensif yang dirancang untuk mengotomatisasi, melacak, dan mengelola seluruh siklus operasional Ekspor-Impor, logistik, dan penyelesaian keuangan pabean. Repositori ini berisi keseluruhan *source code* (Fullstack Monorepo) untuk kebutuhan internal **Departemen IT**.

---

## 🏢 Struktur Organisasi & Modul (Per Departemen)

Platform ini mengadopsi arsitektur yang sangat modular dengan pemisahan Hak Akses (RBAC) yang ketat antar departemen operasional utama:

### 1. Departemen IMPORT
Fokus pada kliring pabean impor, penagihan, dan pengeluaran barang.
- **Modul**: Manajemen Proyek Impor, Sinkronisasi PIB ke OTHE, Financial Request & Payment Gate, Integritas Task Assignee, Aturan Pengecualian Realisasi MTB.
- 📍 *Frontend*: `src/pages/Workspace/ImportOps/`, `src/pages/Workspace/PibRequest/`
- 📍 *Backend*: `backend/src/routes/v1/importOperations.js`

### 2. Departemen AO (Administration Officer)
Fokus pada manajemen tugas administratif, penugasan, dan delegasi SLA.
- **Modul**: Kanban Workboard Multi-Tahap (Apple-Style Date Pill), Pengajuan Kasbon dari PIB Request, Peta Tugas & Delegasi.
- 📍 *Frontend*: `src/pages/Staff/AoWorkboard.jsx`
- 📍 *Backend*: `backend/src/controllers/aoWorkboardController.js`

### 3. Departemen AE (Account Executive)
Fokus pada kepatuhan urutan dokumen, interaksi klien, dan serah terima dokumen legal.
- **Modul**: Sequential Checklist Execution Engine, Siklus Serah Terima Dokumen (Chain of Custody), Meja Kerja Terpadu & Notifikasi Klien.
- 📍 *Frontend*: `src/pages/Staff/ActionFormEngine.jsx`, `src/pages/Staff/AeHandover.jsx`
- 📍 *Backend*: `backend/src/services/AeWorkflowEngine.js`

### 4. Departemen EXPORT
Fokus pada siklus kargo ekspor dan dokumen pabean PEB/COO.
- **Modul**: Manajemen Dokumen Ekspor (PEB/BL/COO), Peta Tugas Operasional Ekspor, Pelacakan Status Pengapalan.
- 📍 *Frontend*: `src/pages/Workspace/DocumentMap.jsx` (Filter: Export)
- 📍 *Backend*: Terintegrasi pada modul Tasks dan Documents inti.

### 5. Departemen Pendukung (Cross-Functional)
- **Finance**: Modul Realisasi Dana, Kasbon, dan Approval Tagihan Vendor.
- **Logistik**: Pelacakan Status Shipment & Validasi Segel Kontainer.
- **Manager**: Dashboard Eksekutif, Analitik Waktu Tunggu (Dwell Time), dan Utilasi Staf.

---

## 📚 Dokumentasi Resmi IT

Semua dokumentasi arsitektur, basis data, API, SOP bisnis, dan hasil pengujian E2E dapat ditemukan di dalam direktori `docs/`:

- 🗺️ **[Arsitektur Sistem & Layering](docs/Architecture.md)**
- 📖 **[SOP Alur Bisnis](docs/SOP/SIMULATION_SOP.md)**
- 🗄️ **[Kamus Database & ERD](docs/Database/)**
- 🛡️ **[Matriks Keamanan RBAC](docs/Authorization_Matrix.md)**

### 🎯 Hasil Pengujian End-to-End (E2E)
Departemen IT mewajibkan laporan pengujian terpadu. Silakan rujuk modul di bawah ini untuk melihat metrik 100% kelulusan skenario:
- 📊 **[Laporan Eksekutif E2E (16/16 Skenario Passed)](docs/Testing/E2E_TEST_REPORT.md)**
- 🛠️ **[Panduan Menjalankan Pengujian (Execution Guide)](docs/Testing/E2E_EXECUTION_GUIDE.md)**
- 🧩 **[Matriks Pemetaan SOP ke Playwright (Test Matrix)](docs/Testing/TEST_MATRIX.md)**

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat
Pastikan Anda telah menginstal:
- Node.js (v20+)
- NPM (v9+)
- Chromium (via Playwright)

### 2. Instalasi Dependensi
```bash
# Clone repositori (Hanya untuk internal IT)
git clone <repository_url>
cd KOMPAS-EXIM

# Install dependensi frontend root
npm install

# Install dependensi backend
cd backend && npm install && cd ..
```

### 3. Konfigurasi Lingkungan
Gandakan file template lingkungan:
```bash
cp .env.example .env
cp .env.example backend/.env
```
*(Sesuaikan JWT_SECRET pada backend/.env untuk environment produksi)*

### 4. Menjalankan Aplikasi Lokal
Buka dua terminal terpisah:

**Terminal 1 (Backend Node.js API)**:
```bash
cd backend
node index.js
```

**Terminal 2 (Frontend React Vite)**:
```bash
npm run dev
```
Aplikasi frontend akan tersedia di `http://localhost:5173`.

---

## 🧪 Panduan Verifikasi Pengujian

Untuk memvalidasi integritas aplikasi secara menyeluruh, Anda dapat menggunakan suite Playwright:

```bash
# Menjalankan pengujian (Headless)
npm run test:e2e

# Menjalankan pengujian dengan Antarmuka Debug Interaktif (UI Mode)
npm run test:e2e:ui

# Membuka Laporan HTML Interaktif
npm run test:e2e:report
```

---
*Dikembangkan secara internal untuk kebutuhan operasional KOMPAS EXIM ERP Platform.*
