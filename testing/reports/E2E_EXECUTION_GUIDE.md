# Panduan Eksekusi Pengujian E2E (Execution Guide) — KOMPAS EXIM

Panduan ini ditujukan bagi **Developer** dan **Tim QA** di Departemen IT untuk menjalankan, men-debug, dan mengintegrasikan suite pengujian *End-to-End* (E2E) Playwright.

---

## 1. Prasyarat Lingkungan (Prerequisites)

- **Node.js**: Versi `>= 20.0.0`
- **NPM**: Versi `>= 9.0.0`
- **Playwright Browsers**: Sudah terpasang (Chromium)

Jika baru pertama kali meng-clone repositori, jalankan:
```bash
# 1. Install seluruh dependensi frontend dan dev tools
npm install

# 2. Install dependensi backend
cd backend && npm install && cd ..

# 3. Install browser engine Playwright (Chromium)
npx playwright install chromium
```

---

## 2. Menjalankan Pengujian

### A. Eksekusi Seluruh Suite (Headless Mode)
Jalankan perintah ini untuk eksekusi otomatis standar (cocok untuk verifikasi cepat dan CI/CD):
```bash
npm run test:e2e
```

### B. Mode Interaktif (Playwright UI Mode)
Sangat direkomendasikan saat mengembangkan fitur baru atau men-debug langkah uji:
```bash
npm run test:e2e:ui
```
*Fitur UI Mode:*
- *Time-Travel Debugging*: Melihat DOM dan tangkapan layar di setiap langkah aksi.
- *Watch Mode*: Menjalankan ulang tes secara otomatis saat file spec diubah.
- *Inspector*: Melihat selector locator secara visual.

### C. Menjalankan Berdasarkan Departemen / File Spesifik
Anda dapat mengeksekusi pengujian hanya untuk departemen tertentu:

```bash
# Menjalankan pengujian Departemen Import saja
npx playwright test e2e/import/

# Menjalankan pengujian Departemen AO (Kanban & Kasbon)
npx playwright test e2e/ao/

# Menjalankan pengujian Departemen AE (Checklist & Handover)
npx playwright test e2e/ae/

# Menjalankan pengujian Departemen Keuangan & Vendor
npx playwright test e2e/finance/

# Menjalankan pengujian Isolasi Hak Akses (RBAC)
npx playwright test e2e/rbac/department-isolation.spec.js
```

---

## 3. Melihat Laporan Hasil Uji (HTML Report)

Setelah tes selesai dieksekusi, Playwright menghasilkan laporan visual interaktif:
```bash
npm run test:e2e:report
```
Perintah ini akan membuka browser lokal di port default (`http://localhost:9323`) yang menampilkan:
- Status kelulusan setiap skenario (*Passed*, *Failed*, *Flaky*).
- Durasi eksekusi per langkah (*step timing*).
- Trace file interaktif untuk langkah yang gagal atau membutuhkan investigasi.
- Video rekaman eksekusi dan screenshot saat kegagalan terjadi.

---

## 4. Konfigurasi Pengujian (`playwright.config.js`)

Pengujian dikonfigurasi dengan karakteristik:
- **Base URL**: `http://127.0.0.1:5173` (Frontend Vite)
- **Web Server Otomatis**: Playwright otomatis menyalakan backend dan frontend jika belum aktif saat tes dijalankan.
- **Isolasi Database**: Menggunakan SQLite test terpisah (`backend/kompas-exim-test.db`) sehingga data operasional utama tidak terpengaruh.
- **Otentikasi Global**: `e2e/auth.setup.js` menyiapkan state login untuk peran Supervisor, Staff Import, AO, AE, dan Finance.

---

## 5. Integrasi CI/CD (GitHub Actions)

Alur kerja otomatis tersedia pada `.github/workflows/ci.yml`. Pada setiap *Push* atau *Pull Request*:
1. Repositori di-checkout dan dependensi di-cache.
2. Migrasi skema database SQLite diinisialisasi.
3. Test suite Playwright dieksekusi secara otomatis.
4. Laporan HTML Playwright diunggah sebagai *Artifact* GitHub Actions yang dapat diunduh langsung oleh Tim IT.
