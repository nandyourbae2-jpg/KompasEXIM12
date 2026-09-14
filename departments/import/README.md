# 🚢 Departemen Import (Comprehensive Module Architecture)

Dokumen ini memetakan arsitektur lengkap, alur bisnis, serta lokasi fisik source code (*Frontend, Backend, dan Database*) untuk seluruh modul di dalam **Departemen Import**.

---

## 🧭 1. Navigasi Utama (Core Operational)

### 1.1 Peta Tugas
* **URL:** `#/workspace/tasks`
* **Deskripsi:** Visualisasi status tugas operasional impor, pemetaan prioritas, dan deadline SLA tim import.
* **Frontend:**
  * Component: `src/pages/Workspace/TaskMap.jsx`
  * Sub-komponen: `src/components/TaskBoard.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/tasks.js`
  * Controller: `backend/src/controllers/tasksController.js` (atau via route handler)
* **Tabel Database:** `tasks`, `task_assignments`, `task_checklists`

### 1.2 Dokumen Monitoring
* **URL:** `#/workspace/dokumen-monitoring`
* **Deskripsi:** Hub pelacakan dokumen kepabeanan impor (B/L, PIB, Invoice, Packing List, Certificate of Origin, SPPB).
* **Frontend:**
  * Layout: `src/pages/Workspace/DokumenMonitoring/DokumenMonitoringLayout.jsx`
  * List: `src/pages/Workspace/DokumenMonitoring/DokumenMonitoringList.jsx`
  * Detail: `src/pages/Workspace/DokumenMonitoring/DokumenMonitoringDetail.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/documents.js`
* **Tabel Database:** `documents`, `document_versions`, `document_verifications`

---

## 📦 2. Workspace Import

### 2.1 Assign Import Project
* **URL:** `#/workspace/staff/assign-import-project`
* **Deskripsi:** Penugasan proyek impor baru kepada personil staff import sesuai kargo dan pelabuhan bongkar.
* **Frontend:**
  * Component: `src/pages/Workspace/ImportProject/AssignImportProject.jsx`
  * Test: `src/pages/Workspace/ImportProject/AssignImportProject.test.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/importOperations.js` (Endpoint: `/projects/assign`)
* **Tabel Database:** `import_projects`, `staff_assignments`

### 2.2 PIB Request (Pemberitahuan Impor Barang)
* **URL:** `#/workspace/staff/pib-request`
* **Deskripsi:** Pengajuan dokumen PIB oleh staff, kalkulasi estimasi bea masuk/pajak, dan approval supervisor sebelum sinkronisasi.
* **Frontend:**
  * List: `src/pages/Workspace/PibRequest/PibRequestList.jsx`
  * Detail/Form: `src/pages/Workspace/PibRequest/PibRequestDetail.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/financialRequestLedger.js` / `backend/src/routes/v1/importOperations.js`
* **Tabel Database:** `pib_requests`, `pib_items`, `pib_taxes`

### 2.3 Import Operational (OTHE Timeline & Detail)
* **URL:** `#/workspace/import-operational`
* **Deskripsi:** Meja kerja operasional lapangan lengkap dengan 8 tab monitoring biaya & perizinan:
  1. **Tab Ringkasan:** Ikhtisar shipment, vessel, ETD/ETA, status pabean (`src/pages/Workspace/ImportOps/tabs/TabRingkasan.jsx`)
  2. **Tab Line Perizinan:** Izin impor, Lartas, kuota kementerian (`src/pages/Workspace/ImportOps/tabs/TabLinePerizinan.jsx`)
  3. **Tab Trucking:** Pengaturan armada dan surat jalan pengeluaran kontainer (`src/pages/Workspace/ImportOps/tabs/TabTrucking.jsx`)
  4. **Tab Depo:** Pengembalian empty container ke depo pelayaran (`src/pages/Workspace/ImportOps/tabs/TabDepo.jsx`)
  5. **Tab LoLo (Lift-on / Lift-off):** Biaya handling pelabuhan / terminal (`src/pages/Workspace/ImportOps/tabs/TabLolo.jsx`)
  6. **Tab Other Cost:** Biaya tak terduga, demurrage, detention (`src/pages/Workspace/ImportOps/tabs/TabOtherCost.jsx`)
  7. **Tab Identitas:** Consignee, Shipper, Notify Party (`src/pages/Workspace/ImportOps/tabs/TabIdentitas.jsx`)
  8. **Tab Claim & Evaluasi:** Catatan kerusakan kargo atau klaim asuransi (`src/pages/Workspace/ImportOps/tabs/TabClaimEvaluasi.jsx`)
* **Frontend:**
  * List: `src/pages/Workspace/ImportOps/ImportOpsList.jsx`
  * Layout: `src/pages/Workspace/ImportOps/ImportOpsLayout.jsx`
  * Detail: `src/pages/Workspace/ImportOps/ShipmentDetail.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/importOperations.js` & `backend/src/routes/v1/containerCosts.js`
* **Tabel Database:** `import_operations`, `shipment_details`, `container_costs`

### 2.4 Analysis
* **URL:** `#/workspace/import-analysis`
* **Deskripsi:** Analitik dwell time pelabuhan, lead time kliring pabean, perbandingan biaya aktual vs anggaran.
* **Frontend:**
  * Router: `src/pages/Workspace/ImportOps/AnalysisRouter.jsx`
  * Page: `src/pages/Workspace/ImportOps/AnalysisPage.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/reports.js`

### 2.5 PlanGDG (Perencanaan Gudang)
* **URL:** `#/workspace/import-plangdg`
* **Deskripsi:** Perencanaan kapasitas penerimaan kargo di gudang tujuan dan jadwal bongkar muat.
* **Frontend:**
  * Component: `src/pages/Workspace/ImportOps/PlanGDGPage.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/master.js`

### 2.6 Master Data Import
* **URL:** `#/workspace/import-master`
* **Deskripsi:** Pengaturan master kode HS, tarif bea masuk, daftar pelabuhan muat/bongkar, dan jenis kemasan.
* **Frontend:**
  * Component: `src/pages/Workspace/ImportOps/MasterDataPage.jsx`
  * Dokumen Master: `src/pages/Workspace/ImportOps/MasterDataDokumen.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/master.js`

---

## 💰 3. Finansial & Relasi (Financial Commitment & Vendor)

### 3.1 Financial Commitment Workspace
* **URL:** `#/workspace/financial-request`
* **Deskripsi:** Pengajuan permohonan dana operasional proyek impor (uang muka pelabuhan, DO release fee, biaya trucking).
* **Frontend:**
  * List: `src/pages/Workspace/FinancialRequest/FinancialRequestList.jsx`
  * Detail: `src/pages/Workspace/FinancialRequest/FinancialRequestDetail.jsx`
  * Store: `src/store/useFinancialRequestStore.js`
* **Backend:**
  * Route: `backend/src/routes/v1/financialRequestLedger.js`
* **Tabel Database:** `financial_requests`, `financial_request_ledgers`

### 3.2 Financial Payment Tracker
* **URL:** `#/workspace/payments`
* **Deskripsi:** Pelacakan invoice vendor, realisasi pembayaran dana talangan, dan penjadwalan payment voucher.
* **Frontend:**
  * Dashboard: `src/pages/Workspace/Payment/PaymentDashboard.jsx`
  * Modals: `AddInvoiceModal.jsx`, `UpdatePaymentModal.jsx`, `PaymentHistoryModal.jsx`, `AssignToMtbModal.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/financials.js`
* **Tabel Database:** `vendor_invoices`, `payment_records`, `payment_vouchers`

### 3.3 Realisasi Dana Import (Mutasi Kas / MTB)
* **URL:** `#/workspace/realisasi-dana`
* **Deskripsi:** Pencatatan realisasi mutasi kas bon dan rekonsiliasi pengeluaran riil lapangan dengan dana yang disetujui.
* **Frontend:**
  * Layout: `src/pages/Workspace/Finance/RealisasiDana/RealisasiDanaLayout.jsx`
  * Tabs: `TabMtb.jsx`, `TabPib.jsx`, `TabMtbDetail.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/financials.js` (Endpoint: `/mtb`, `/realisasi`)
* **Tabel Database:** `mtb_periods`, `mtb_transactions`, `realisasi_records`

### 3.4 Debit Note Monitoring
* **URL:** `#/workspace/debit-notes`
* **Deskripsi:** Pemantauan dan penerbitan nota debit tagihan kepada pihak ketiga / agen / principal atas biaya reimbursable.
* **Frontend:**
  * Component: `src/pages/Workspace/Finance/DebitNote/DebitNoteMonitoring.jsx`
  * Modal: `DebitNoteFormModal.jsx`, `DebitNoteDetailPanel.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/financials.js`
* **Tabel Database:** `debit_notes`, `debit_note_items`

### 3.5 Manajemen Vendor
* **URL:** `#/workspace/vendors`
* **Deskripsi:** Database vendor rekanan operasional impor (Shipping Lines, Trucking Vendors, Depo Kontainer, Surveyor, Forwarder).
* **Frontend:**
  * Page: `src/pages/Workspace/Vendor/VendorManagementPage.jsx`
  * Modals: `VendorFormModal.jsx`, `VendorDetailPanel.jsx`, `VendorReviewModal.jsx`
* **Backend:**
  * Route: `backend/src/routes/v1/vendors.js`
* **Tabel Database:** `vendors`, `vendor_services`, `vendor_ratings`

---

## 🧪 4. Otomasi Pengujian E2E Terkait
Seluruh modul Departemen Import di atas telah diverifikasi dengan skrip Playwright:
* `testing/e2e/import/import-operational-crud.spec.js` (CUJ 1: Import Operational & OTHE)
* `testing/e2e/import/financial-request-to-payment-gate.spec.js` (Financial Request Gate)
* `testing/e2e/import/pib-request-to-othe-sync.spec.js` (Sinkronisasi PIB ke OTHE)
* `testing/e2e/import/realisasi-mtb-exclusion-rule.spec.js` (Realisasi Dana MTB)
* `testing/e2e/import/task-assignee-integrity.spec.js` (Integritas Peta Tugas)
* `testing/e2e/finance/vendor-and-payment-flow.spec.js` (CUJ 2: Vendor & Payment Tracker)
