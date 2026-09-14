# KOMPAS EXIM Platform

![KOMPAS EXIM](https://img.shields.io/badge/Status-Production%20Ready-success)
![Playwright Tests](https://img.shields.io/badge/E2E%20Tests-16%2F16%20Passed-brightgreen)
![React](https://img.shields.io/badge/React-19.0-blue)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)

Platform **KOMPAS EXIM** adalah sistem Enterprise Resource Planning (ERP) komprehensif yang dirancang untuk mengotomatisasi, melacak, dan mengelola seluruh siklus operasional Ekspor-Impor, logistik, dan penyelesaian keuangan pabean. Repositori ini berisi keseluruhan *source code* (Fullstack Monorepo) untuk kebutuhan internal **Departemen IT**.

---

## 🏢 Struktur Organisasi & Modul (Folder `departments/`)

Platform ini mengadopsi arsitektur modular dengan pemisahan direktori per departemen operasional di folder **`departments/`**:

- 🚢 **[Departemen IMPORT](departments/import/README.md)** : Kliring pabean impor (PIB), pengeluaran kontainer (DO), & financial request.
- 🎯 **[Departemen AO](departments/ao/README.md)** : Kanban Workboard (Account Officer), pipeline prospek, & manajemen tugas SLA.
- 📋 **[Departemen AE](departments/ae/README.md)** : Sequential checklist dokumen, interaksi klien, & administrasi job order.
- 🌍 **[Departemen EXPORT](departments/export/README.md)** : Siklus kargo ekspor, pabean PEB/NPE, & booking space kapal/udara.

---

## 🧪 Pengujian Sistem & QA (Folder `testing/`)

Semua skrip otomasi pengujian dan bukti kelulusan pengujian terpusat di dalam folder **`testing/`**:
- 📊 **[Laporan Eksekutif E2E (16/16 Skenario Passed)](testing/reports/E2E_TEST_REPORT.md)**
- 🛠️ **[Panduan Menjalankan Pengujian (Execution Guide)](testing/reports/E2E_EXECUTION_GUIDE.md)**
- 🧩 **[Matriks Pemetaan SOP ke Playwright (Test Matrix)](testing/reports/TEST_MATRIX.md)**
- 📁 **[Skrip Automated Test Playwright](testing/e2e/)**

---

## 📚 Dokumentasi Arsitektur & SOP IT (Folder `docs/`)

Semua dokumentasi arsitektur, basis data, API, dan SOP bisnis dapat ditemukan di direktori `docs/`:
- 🗺️ **[Arsitektur Sistem & Layering](docs/Architecture.md)**
- 📖 **[SOP Alur Bisnis](docs/SOP/SIMULATION_SOP.md)**
- 🗄️ **[Kamus Database & ERD](docs/Database/)**
- 🛡️ **[Matriks Keamanan RBAC](docs/Authorization_Matrix.md)**

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
