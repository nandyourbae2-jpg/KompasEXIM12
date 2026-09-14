# 📋 Departemen AE (Account Executive / Administrasi & Operasional)

Dokumen ini memetakan arsitektur lengkap, alur bisnis, serta lokasi fisik source code (*Frontend, Backend, dan Database*) untuk seluruh modul di dalam **Departemen Account Executive (AE)**.

---

## 🧭 1. Workspace Staff AE

### 1.1 AE Workboard & Sequential Action Engine
* **URL:** `#/workspace/ae/workboard`
* **Deskripsi:** Eksekusi sekuensial aktivitas penanganan dokumen operasional ekspor dan job order.
* **Frontend:**
  * Component: `src/pages/Staff/AeWorkboard.jsx`
  * Action Engine: `src/pages/Staff/ActionFormEngine.jsx`
  * Handover Dokumen: `src/pages/Staff/AeHandover.jsx`
* **Backend:**
  * Controller: `backend/src/controllers/aeWorkboardController.js`
  * Engine: `backend/src/services/AeWorkflowEngine.js`
* **Tabel Database:** `ae_tasks`, `ae_activities`, `job_orders`

### 1.2 Documents Control Hub
* **URL:** `#/workspace/ae/documents`
* **Deskripsi:** Verifikasi dan kontrol dokumen resmi ekspor (Commercial Invoice, Packing List, Shipping Instructions).
* **Frontend:** `src/pages/Workspace/AE/AeDocumentControlHub.jsx`, `AeDocumentControl.jsx`, `AeDocumentArchivePage.jsx`
* **Backend:** `backend/src/routes/v1/documents.js`

### 1.3 Waiting / Blocked & Follow Up Center
* **URL:** `#/workspace/ae/waiting`
* **Deskripsi:** Monitoring dokumen atau aktivitas yang tertunda (blocked), eskalasi isu, dan tindak lanjut ke agen/klien.
* **Frontend:** `src/pages/Workspace/AE/AeWaiting.jsx`, `AeFollowUpCenter.jsx`, `AeIssueCenter.jsx`

### 1.4 Activity History
* **URL:** `#/workspace/ae/history`
* **Deskripsi:** Riwayat audit log seluruh mutasi dokumen dan tindakan staf AE.
* **Frontend:** `src/pages/Workspace/AE/AeActivityHistory.jsx`

---

## 🛡️ 2. Supervisor AE (Control Tower)

### 2.1 AE Control Tower
* **URL:** `#/workspace/ae/supervisor`
* **Deskripsi:** Dashboard metrik SLA dokumen ekspor dan monitoring beban kerja tim AE.
* **Frontend:** `src/pages/Supervisor/AeControlTower.jsx`, `src/pages/Workspace/AE/AeDashboard.jsx`

### 2.2 AE Assignment Board
* **Deskripsi:** Distribusi berkas job order ke staf AE.
* **Frontend:** `src/pages/Workspace/Management/SpvAE/AeAssignmentBoard.jsx`

### 2.3 Log Schedule Source & Match Review Center
* **Deskripsi:** Pengelolaan sumber jadwal logistik dan rekonsiliasi data manifest.
* **Frontend:**
  * Source Management: `src/pages/Workspace/SourceManagement/SourceManagementPage.jsx`
  * Match Review: `src/pages/Workspace/SourceManagement/MatchReviewCenter.jsx`
