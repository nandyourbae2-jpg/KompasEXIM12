# Matriks Pengujian E2E (Test Matrix) — KOMPAS EXIM

Matriks ini memetakan seluruh kebutuhan operasional (*Business Requirements* & SOP) ke skenario pengujian Playwright di repositori `e2e/`.

---

## 1. Pemetaan Departemen Operasional (Import, AO, AE, Export)

| Departemen | Modul / Fitur | Acuan SOP / PRD | File Spesifikasi Pengujian Playwright | Cakupan Asersi & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| **IMPORT** | **Manajemen Proyek Impor** | SOP-IMP-01 (Kargo Masuk) | `e2e/import/import-operational-crud.spec.js` | Form input shipment, kalkulasi ETA/ETD, status kontainer, pencegahan duplikasi nomor kontainer. |
| **IMPORT** | **Sinkronisasi PIB ke OTHE** | SOP-IMP-02 (Pabean PIB) | `e2e/import/pib-request-to-othe-sync.spec.js` | Sinkronisasi permohonan PIB, mapping nomor aju, status billing, audit trail mutasi. |
| **IMPORT** | **Financial Request & Payment Gate** | SOP-FIN-01 (Komitmen Biaya) | `e2e/import/financial-request-to-payment-gate.spec.js` | Pengajuan D/O, storage, demurrage, payment gate verification, status mutasi ledger. |
| **IMPORT** | **Integritas Penugasan Tugas** | PRD Bab 4.2 (Task PIC) | `e2e/import/task-assignee-integrity.spec.js` | Validasi PIC tugas, pencegahan tugas tak bertuan (*orphaned tasks*), sinkronisasi status staf. |
| **IMPORT** | **Pengecualian Realisasi MTB** | SOP-IMP-04 (Moving to Bonded)| `e2e/import/realisasi-mtb-exclusion-rule.spec.js` | Kalkulasi biaya MTB, filter eksklusi biaya non-operasional, validasi pembukuan realisasi dana. |
| **AO** | **Workboard Kanban Multi-Tahap** | SOP-AO-01 (Pekerjaan Administrasi)| `e2e/ao/kanban-board-full.spec.js` | Transisi status (Queue ➔ In Progress ➔ Pending ➔ Done), Date Pill Apple style, audit log stage. |
| **AO** | **Pengajuan Kasbon dari PIB** | SOP-AO-02 (Kasbon Terintegrasi) | `e2e/ao/kasbon-from-pib-request.spec.js` | Autocomplete data dari PIB, pembuatan voucher kasbon otomatis, validasi batas nominal. |
| **AE** | **Sequential Checklist Engine** | SOP-AE-01 (Verifikasi Kepatuhan)| `e2e/ae/checklist-sequential-execution.spec.js` | Aturan strict order checklist, pencegahan loncat tahap, form submission modal interaktif. |
| **AE** | **Serah Terima Dokumen (Handover)**| SOP-AE-02 (Chain of Custody) | `e2e/ae/document-handover-cycle.spec.js` | Bukti fisik/digital B/L, Packing List, Invoice, konfirmasi tanda terima klien. |
| **EXPORT** | **Dokumen Ekspor (PEB/BL/COO)** | PRD Bab 4.3 (Dokumen Ekspor) | `e2e/rbac/department-isolation.spec.js` (Export scope) | Verifikasi hak akses dokumen kategori PEB, B/L ekspor, dan COO Form D/E/AK. |
| **EXPORT** | **Peta Tugas & Jadwal Ekspor** | PRD Bab 4.1 (Task Map Ekspor)| `e2e/rbac/department-isolation.spec.js` | Isolasi peta tugas ekspor (Booking, Stuffing, Pabean PEB, On Board). |

---

## 2. Pemetaan Departemen Pendukung & Pengawasan

| Departemen | Modul / Fitur | Acuan SOP / PRD | File Spesifikasi Pengujian Playwright | Cakupan Asersi & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| **FINANCE** | **Realisasi Dana Operasional** | SOP-FIN-02 (Pertanggungjawaban) | `e2e/finance/realisasi-dana-crud.spec.js` | CRUD realisasi dana kasbon, lampiran kuitansi, penutupan selisih lebih/kurang bayar. |
| **FINANCE** | **Pembayaran Vendor** | SOP-FIN-03 (Approval Vendor) | `e2e/finance/vendor-and-payment-flow.spec.js` | Pendaftaran tagihan vendor pelayaran, alur approval multi-level, status lunas. |
| **LOGISTICS**| **Pelacakan Pengiriman & Segel** | SOP-LOG-01 (Tracking Kontainer) | `e2e/logistic/status-shipment-tracking.spec.js` | Tracking nomor segel kontainer, status Gate-In pelabuhan, notifikasi keterlambatan kargo. |
| **MANAGER** | **Dashboard Analitik Eksekutif**| PRD Bab 5 (Control Tower) | `e2e/manager/executive-dashboards.spec.js` | Metrik waktu tunggu pabean (dwell time), volume impor/ekspor, utilisasi staf per departemen. |
| **SECURITY** | **Isolasi Hak Akses (RBAC)** | PRD Bab 3.2 (Keamanan Akses) | `e2e/rbac/department-isolation.spec.js` | Staf Import tidak dapat mengubah data AE, staf AO tidak dapat mengakses payment gate Finance. |
| **FRONTEND** | **Reaktivitas UI (No Stale UI)**| Standard UX Quality | `e2e/regression/no-stale-ui-after-mutation.spec.js` | Data UI otomatis sinkron paska mutasi API tanpa refresh halaman manual. |
