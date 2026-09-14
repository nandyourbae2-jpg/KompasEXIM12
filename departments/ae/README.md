# Departemen AE (Account Executive / Operasional & Administrasi)

## 📌 Ringkasan Departemen
Departemen Account Executive (AE) bertanggung jawab atas eksekusi operasional pesanan dari AO, administrasi dokumen pengiriman, monitoring status real-time, koordinasi penagihan (billing), pembuatan faktur/invoice, serta pencatatan biaya operasional (disbursement/job costing).

---

## 🗺️ Pemetaan Komponen & File Terkait

### 1. Frontend (User Interface)
* **Dashboard Administrasi AE:** `src/pages/AEAdministration.jsx`, `src/pages/AEWorkboard.jsx`
* **Invoicing & Billing:** `src/pages/InvoiceDetailPage.jsx`, `src/pages/InvoicesPage.jsx`
* **Job Costing & Biaya:** `src/components/ae/CostingSheet.jsx`, `src/components/ae/`
* **Dokumen Operasional:** `src/components/documents/DocumentUploader.jsx`

### 2. Backend (API & Business Logic)
* **Controller:** 
  * `backend/src/controllers/aeAdministrationController.js`
  * `backend/src/controllers/invoiceController.js`
  * `backend/src/controllers/billingController.js`
* **Service:** 
  * `backend/src/services/AeAdministrationService.js`
  * `backend/src/services/InvoiceService.js`
* **Database Table:** 
  * `ae_tasks`, `job_orders`, `invoices`, `invoice_items`, `operational_costs`

### 3. Automated Test Terkait
* Skrip E2E: `testing/e2e/ae/` dan `testing/e2e/ae-workboard.spec.js`
* Laporan Verifikasi: `testing/reports/E2E_TEST_REPORT.md` (Bagian CUJ 3 - AE Administration & Invoicing)

---

## 🔄 Alur Bisnis Inti (Core User Journey)
1. **Verifikasi Booking & Job Order:** Menerima handoff pesanan dari AO dan memeriksa kelengkapan terms.
2. **Koordinasi Operasional & Dokumen:** Mengunggah dokumen resmi (B/L, Commercial Invoice, Packing List).
3. **Pencatatan Biaya (Actual Costing):** Mencatat tagihan dari shipping line, depo kontainer, dan pihak ketiga.
4. **Billing & Invoice Generation:** Menerbitkan faktur resmi kepada pelanggan serta sinkronisasi status pembayaran dengan Finance.
