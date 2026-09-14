# 🎯 Departemen AO (Account Officer / Sales, SO & Banking)

Dokumen ini memetakan arsitektur lengkap, alur bisnis, serta lokasi fisik source code (*Frontend, Backend, dan Database*) untuk seluruh modul di dalam **Departemen Account Officer (AO)**.

---

## 🧭 1. Workspace Staff AO

### 1.1 AO Workboard (Kanban Board)
* **URL:** `#/workspace/ao/staff`
* **Deskripsi:** Papan kerja Kanban multi-kolom interaktif dengan filter status dan tanggal Apple-Style date pill.
* **Frontend:** `src/pages/Staff/AoWorkboard.jsx`, `src/pages/Workspace/AO/AoDashboard.jsx`
* **Backend:** `backend/src/controllers/aoWorkboardController.js`, `backend/src/routes/v1/aoModule.js`
* **Tabel Database:** `ao_workboards`, `ao_kanban_cards`, `ao_tasks`

### 1.2 Peta Tugas AO
* **URL:** `#/workspace/ao/task-map`
* **Deskripsi:** Visualisasi status tugas AO, pipeline prospek klien, dan delegasi penugasan.
* **Frontend:** `src/pages/Workspace/AoTaskMap.jsx`
* **Backend:** `backend/src/routes/v1/tasks.js`

### 1.3 DSCS Workspace (Bilik Kerja Personal)
* **URL:** `#/workspace/ao/dscs`
* **Deskripsi:** Ruang kerja terdedikasi untuk penanganan dokumen kargo spesifik (DSCS) dan order nasabah prioritas.
* **Frontend:** `src/pages/Staff/DscsWorkspace.jsx`

### 1.4 Modul Banking & Fasilitas AO
* **Kasbon Fasilitas:** `src/pages/Workspace/AO/AoKasbonFasilitas.jsx`
* **Bank Guarantee:** `src/pages/Workspace/AO/AoBankGuarantee.jsx`
* **L/C Management (Letter of Credit):** `src/pages/Workspace/AO/AoLcManagement.jsx`
* **FX Booking (Foreign Exchange Rate):** `src/pages/Workspace/AO/AoFxBooking.jsx`
* **TT Instruction (Telegraphic Transfer):** `src/pages/Workspace/AO/AoTtInstruction.jsx`

---

## 🛡️ 2. Supervisor AO (Control Tower)

### 2.1 AO Control Tower
* **URL:** `#/workspace/ao/supervisor`
* **Deskripsi:** Pengawasan KPI tim AO, monitoring fasilitas nasabah, dan approval penawaran harga.
* **Frontend:** `src/pages/Workspace/AO/AoDashboard.jsx`, `src/pages/Workspace/AO/AoSpvFacilityMonitoring.jsx`
* **Approval Center:** `src/pages/Workspace/AO/AoSpvApprovalCenter.jsx`

### 2.2 Setting SO Terms & Master Data
* **URL:** `#/workspace/ao/setting-so-terms`
* **Deskripsi:** Pengaturan syarat dan ketentuan Sales Order (SO), limit kredit nasabah, dan term of payment.
* **Frontend:** `src/pages/Workspace/AO/AoMasterData.jsx`

### 2.3 Log Schedule Monitoring
* **URL:** `#/workspace/ao/log-schedule`
* **Deskripsi:** Pemantauan jadwal kargo nasabah terhadap log schedule perkapalan dan penerbangan.
* **Frontend:** `src/pages/Workspace/AO/AoLogScheduleMonitoring.jsx`, `AoLogScheduleMonitoring.css`
