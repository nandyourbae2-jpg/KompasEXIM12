# 🚢 Departemen Import (Comprehensive Enterprise Module Architecture)

Dokumen ini memetakan arsitektur lengkap, alur bisnis, serta lokasi fisik source code (*Frontend, Backend, dan Database*) untuk seluruh modul di dalam **Departemen Import**, mencakup tingkat **Staff Operasional** maupun **Supervisor (Control Tower)**.

---

## 🛡️ 1. Supervisor Workspace & Control Tower (SPV Import)

### 1.1 MY WORKSPACE (Supervisor Personal)
* **Dashboard Saya:**
  * **URL:** `#/workspace/supervisor/dashboard-saya`
  * **Deskripsi:** Ringkasan KPI harian, status review mendesak, dan personal activity log supervisor.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/MyDashboard.jsx`
* **My Tasks:**
  * **URL:** `#/workspace/supervisor/my-tasks`
  * **Deskripsi:** Daftar tugas pribadi yang harus dieksekusi atau ditindaklanjuti oleh supervisor.
  * **Frontend:** `src/components/supervisor/MyTasksPersonal.jsx`
* **Approval Center:**
  * **URL:** `#/workspace/supervisor/approval`
  * **Deskripsi:** Gerbang persetujuan tunggal (*Approval Gate*) untuk pengajuan dokumen PIB, permohonan Financial Request, dan pengeluaran kas bon.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/ApprovalCenter.jsx`
  * **Backend:** `backend/src/routes/v1/financialRequestLedger.js` (Endpoint: `/approve`, `/reject`)
* **My Notes:**
  * **URL:** `#/workspace/supervisor/notes`
  * **Deskripsi:** Catatan internal supervisor, instruksi khusus ke staff, dan memo kebijakan pabean.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/MyNotes.jsx`

### 1.2 TEAM CONTROL TOWER (Import Management & Monitoring)
* **Department Dashboard:**
  * **URL:** `#/workspace/supervisor/dashboard`
  * **Deskripsi:** Metrik performa keseluruhan Departemen Import (volume kargo masuk, rasio jalur hijau/merah, status realisasi).
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/SpvDepartmentDashboard.jsx`
* **Assignment Center:**
  * **URL:** `#/workspace/supervisor/assignment`
  * **Deskripsi:** Papan kontrol distribusi alokasi kargo/proyek impor kepada seluruh staf operasional impor.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/AssignmentCenter.jsx`
* **Shipment Monitoring:**
  * **URL:** `#/workspace/supervisor/shipments`
  * **Deskripsi:** Pemantauan status kapal, ETA pelabuhan (Tanjung Priok, Tanjung Perak, dll), dan pergerakan kontainer.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/SpvShipmentMonitoring.jsx`
* **Operational Monitoring:**
  * **URL:** `#/workspace/supervisor/operations`
  * **Deskripsi:** Pengawasan tahapan teknis pabean (PIB Validation, SPPB terbit, Delivery Order release).
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/SpvOperationalMonitoring.jsx`
* **Financial Monitoring:**
  * **URL:** `#/workspace/supervisor/finance`
  * **Deskripsi:** Pengawasan arus komitmen dana impor, uang muka pelabuhan, dan verifikasi faktur biaya logistik.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/SpvFinancialMonitoring.jsx`
* **Vendor Monitoring:**
  * **URL:** `#/workspace/supervisor/vendor`
  * **Deskripsi:** Evaluasi SLA rekanan pelayaran (Shipping Line), vendor trucking armada, dan depo kontainer.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/SpvVendorMonitoring.jsx`
* **Issue & Escalation:**
  * **URL:** `#/workspace/supervisor/issues`
  * **Deskripsi:** Penanganan kontinjensi kargo tertahan di pelabuhan (Notul, Pemeriksaan Fisik/Behandle, Dwell Time kritis).
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/SpvIssueEscalation.jsx`
* **Staff Performance:**
  * **URL:** `#/workspace/supervisor/performance`
  * **Deskripsi:** Metrik produktivitas staf import, kecepatan penanganan dokumen, dan kepatuhan SOP.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/SpvStaffPerformance.jsx`
* **Analytics & Reports:**
  * **URL:** `#/workspace/supervisor/analytics`
  * **Deskripsi:** Laporan eksekutif berkala, tren komoditas impor, dan rekapitulasi efisiensi biaya.
  * **Frontend:** `src/pages/Workspace/Management/SpvImport/AnalyticsReports.jsx`
  * **Backend:** `backend/src/routes/v1/reports.js`

---

## 🧭 2. Navigasi Utama (Core Operational)

### 2.1 Peta Tugas
* **URL:** `#/workspace/tasks`
* **Deskripsi:** Visualisasi status tugas operasional impor, pemetaan prioritas, dan deadline SLA tim import.
* **Frontend:** `src/pages/Workspace/TaskMap.jsx`, `src/components/TaskBoard.jsx`
* **Backend:** `backend/src/routes/v1/tasks.js`
* **Tabel Database:** `tasks`, `task_assignments`, `task_checklists`

### 2.2 Dokumen Monitoring
* **URL:** `#/workspace/dokumen-monitoring`
* **Deskripsi:** Hub pelacakan dokumen kepabeanan impor (B/L, PIB, Invoice, Packing List, COO, SPPB).
* **Frontend:**
  * Layout: `src/pages/Workspace/DokumenMonitoring/DokumenMonitoringLayout.jsx`
  * List: `src/pages/Workspace/DokumenMonitoring/DokumenMonitoringList.jsx`
  * Detail: `src/pages/Workspace/DokumenMonitoring/DokumenMonitoringDetail.jsx`
* **Backend:** `backend/src/routes/v1/documents.js`
* **Tabel Database:** `documents`, `document_versions`, `document_verifications`

---

## 📦 3. Workspace Import (Staff Operasional)

### 3.1 Assign Import Project
* **URL:** `#/workspace/staff/assign-import-project`
* **Deskripsi:** Penugasan proyek impor baru kepada personil staff import sesuai kargo dan pelabuhan bongkar.
* **Frontend:** `src/pages/Workspace/ImportProject/AssignImportProject.jsx`
* **Backend:** `backend/src/routes/v1/importOperations.js` (Endpoint: `/projects/assign`)
* **Tabel Database:** `import_projects`, `staff_assignments`

### 3.2 PIB Request (Pemberitahuan Impor Barang)
* **URL:** `#/workspace/staff/pib-request`
* **Deskripsi:** Pengajuan dokumen PIB oleh staff, kalkulasi estimasi bea masuk/pajak, dan approval supervisor sebelum sinkronisasi.
* **Frontend:**
  * List: `src/pages/Workspace/PibRequest/PibRequestList.jsx`
  * Detail/Form: `src/pages/Workspace/PibRequest/PibRequestDetail.jsx`
* **Backend:** `backend/src/routes/v1/financialRequestLedger.js` / `backend/src/routes/v1/importOperations.js`
* **Tabel Database:** `pib_requests`, `pib_items`, `pib_taxes`

### 3.3 Import Operational (OTHE Timeline & Detail)
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
* **Backend:** `backend/src/routes/v1/importOperations.js` & `backend/src/routes/v1/containerCosts.js`
* **Tabel Database:** `import_operations`, `shipment_details`, `container_costs`

### 3.4 Analysis
* **URL:** `#/workspace/import-analysis`
* **Deskripsi:** Analitik dwell time pelabuhan, lead time kliring pabean, perbandingan biaya aktual vs anggaran.
* **Frontend:** `src/pages/Workspace/ImportOps/AnalysisRouter.jsx`, `AnalysisPage.jsx`
* **Backend:** `backend/src/routes/v1/reports.js`

### 3.5 PlanGDG (Perencanaan Gudang)
* **URL:** `#/workspace/import-plangdg`
* **Deskripsi:** Perencanaan kapasitas penerimaan kargo di gudang tujuan dan jadwal bongkar muat.
* **Frontend:** `src/pages/Workspace/ImportOps/PlanGDGPage.jsx`
* **Backend:** `backend/src/routes/v1/master.js`

### 3.6 Master Data Import
* **URL:** `#/workspace/import-master`
* **Deskripsi:** Pengaturan master kode HS, tarif bea masuk, daftar pelabuhan muat/bongkar, dan jenis kemasan.
* **Frontend:** `src/pages/Workspace/ImportOps/MasterDataPage.jsx`, `MasterDataDokumen.jsx`
* **Backend:** `backend/src/routes/v1/master.js`

---

## 💰 4. Finansial & Relasi (Financial Commitment & Vendor)

### 4.1 Financial Commitment Workspace
* **URL:** `#/workspace/financial-request`
* **Deskripsi:** Pengajuan permohonan dana operasional proyek impor (uang muka pelabuhan, DO release fee, biaya trucking).
* **Frontend:**
  * List: `src/pages/Workspace/FinancialRequest/FinancialRequestList.jsx`
  * Detail: `src/pages/Workspace/FinancialRequest/FinancialRequestDetail.jsx`
  * Store: `src/store/useFinancialRequestStore.js`
* **Backend:** `backend/src/routes/v1/financialRequestLedger.js`
* **Tabel Database:** `financial_requests`, `financial_request_ledgers`

### 4.2 Financial Payment Tracker
* **URL:** `#/workspace/payments`
* **Deskripsi:** Pelacakan invoice vendor, realisasi pembayaran dana talangan, dan penjadwalan payment voucher.
* **Frontend:**
  * Dashboard: `src/pages/Workspace/Payment/PaymentDashboard.jsx`
  * Modals: `AddInvoiceModal.jsx`, `UpdatePaymentModal.jsx`, `PaymentHistoryModal.jsx`, `AssignToMtbModal.jsx`
* **Backend:** `backend/src/routes/v1/financials.js`
* **Tabel Database:** `vendor_invoices`, `payment_records`, `payment_vouchers`

### 4.3 Realisasi Dana Import (Mutasi Kas / MTB)
* **URL:** `#/workspace/realisasi-dana`
* **Deskripsi:** Pencatatan realisasi mutasi kas bon dan rekonsiliasi pengeluaran riil lapangan dengan dana yang disetujui.
* **Frontend:**
  * Layout: `src/pages/Workspace/Finance/RealisasiDana/RealisasiDanaLayout.jsx`
  * Tabs: `TabMtb.jsx`, `TabPib.jsx`, `TabMtbDetail.jsx`
* **Backend:** `backend/src/routes/v1/financials.js` (Endpoint: `/mtb`, `/realisasi`)
* **Tabel Database:** `mtb_periods`, `mtb_transactions`, `realisasi_records`

### 4.4 Debit Note Monitoring
* **URL:** `#/workspace/debit-notes`
* **Deskripsi:** Pemantauan dan penerbitan nota debit tagihan kepada pihak ketiga / agen / principal atas biaya reimbursable.
* **Frontend:** `src/pages/Workspace/Finance/DebitNote/DebitNoteMonitoring.jsx`, `DebitNoteFormModal.jsx`, `DebitNoteDetailPanel.jsx`
* **Backend:** `backend/src/routes/v1/financials.js`
* **Tabel Database:** `debit_notes`, `debit_note_items`

### 4.5 Manajemen Vendor
* **URL:** `#/workspace/vendors`
* **Deskripsi:** Database vendor rekanan operasional impor (Shipping Lines, Trucking Vendors, Depo Kontainer, Surveyor, Forwarder).
* **Frontend:** `src/pages/Workspace/Vendor/VendorManagementPage.jsx`, `VendorFormModal.jsx`, `VendorDetailPanel.jsx`, `VendorReviewModal.jsx`
* **Backend:** `backend/src/routes/v1/vendors.js`
* **Tabel Database:** `vendors`, `vendor_services`, `vendor_ratings`

---

## 🧪 5. Otomasi Pengujian E2E Terkait
Seluruh modul Staff & Supervisor Departemen Import di atas diverifikasi dengan skrip Playwright:
* `testing/e2e/import/import-operational-crud.spec.js` (CUJ 1: Import Operational & OTHE)
* `testing/e2e/import/financial-request-to-payment-gate.spec.js` (Financial Request Gate)
* `testing/e2e/import/pib-request-to-othe-sync.spec.js` (Sinkronisasi PIB ke OTHE)
* `testing/e2e/import/realisasi-mtb-exclusion-rule.spec.js` (Realisasi Dana MTB)
* `testing/e2e/import/task-assignee-integrity.spec.js` (Integritas Peta Tugas)
* `testing/e2e/finance/vendor-and-payment-flow.spec.js` (CUJ 2: Vendor & Payment Tracker)
* `testing/e2e/rbac/department-isolation.spec.js` (Isolasi Hak Akses Supervisor & Staff)
