# Departemen AO (Account Officer / Sales & Marketing)

## 📌 Ringkasan Departemen
Departemen Account Officer (AO) bertindak sebagai ujung tombak penjualan dan hubungan pelanggan (CRM). Departemen ini mengelola pipeline prospek (leads), penawaran harga (quotations), negosiasi biaya, target revenue, dan koordinasi pesanan awal ke bagian operasional.

---

## 🗺️ Pemetaan Komponen & File Terkait

### 1. Frontend (User Interface)
* **Kanban & Pipeline Board:** `src/pages/AOWorkboard.jsx`, `src/pages/AOKanbanPage.jsx`
* **Manajemen Prospek (Leads/Clients):** `src/pages/ClientsPage.jsx`, `src/components/ao/`
* **Penawaran Harga (Quotations):** `src/pages/QuotationsPage.jsx`, `src/components/quotation/`
* **Filter & Analytics AO:** `src/components/ao/AOAnalytics.jsx`

### 2. Backend (API & Business Logic)
* **Controller:** 
  * `backend/src/controllers/aoWorkboardController.js`
  * `backend/src/controllers/quotationController.js`
  * `backend/src/controllers/clientController.js`
* **Service:** 
  * `backend/src/services/AoWorkboardService.js`
  * `backend/src/services/QuotationService.js`
* **Database Table:** 
  * `ao_leads`, `ao_workboards`, `quotations`, `clients`, `sales_targets`

### 3. Automated Test Terkait
* Skrip E2E: `testing/e2e/ao/` dan `testing/e2e/ao-kanban.spec.js`
* Laporan Verifikasi: `testing/reports/E2E_TEST_REPORT.md` (Bagian CUJ 2 - AO Kanban & Sales Pipeline)

---

## 🔄 Alur Bisnis Inti (Core User Journey)
1. **Lead Ingestion:** Menerima permintaan rate dari calon nasabah / eksportir-importir.
2. **Quotation Generation:** Menghitung freight rate, handling fee, trucking, dan margin keuntungan.
3. **Closing / Won Deal:** Quotation disetujui klien (Deal Closed/Won).
4. **Handoff ke AE & Operasional:** Pembentukan data Booking / Work Order awal untuk dieksekusi departemen operasional.
