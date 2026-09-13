# Feature Documentation: Reports, Debit Notes & PIB Requests

## 1. Business Purpose & Overview

The **Reports, Debit Notes & PIB Requests** module manages operational reporting, vendor claim recoveries (*Debit Notes*), and customs tax payment requests (*PIB Requests*).

- **Module Owner**: Import Operational Staff, Supervisor, Finance.
- **Related Modules**: Payment Tracker, Manager Dashboard, Customs Clearance.
- **Implementation Status**: **Current Implementation** (Report generation, Debit Note claim lifecycle, and PIB kasbon tracking fully operational).

---

## 2. Navigation Path & UI Description

- **Navigation Path**: `Workspace` → `Finance` → `Debit Note` (`/workspace/finance/debit-note`) & `Pib Request` (`/workspace/pib-request`)
- **UI Components**: `DebitNoteMonitoring.jsx`, `PibRequestList.jsx`, `PibRequestDetail.jsx`

---

## 3. Core Feature Subsystems

### A. Debit Notes Claims Engine (`debit_notes` table)
Issues financial claims against suppliers, shipping lines, or trucking vendors for damages, delay penalties, or tariff overcharges.

#### Claim Lifecycle Statuses:
`Draft` → `Diterbitkan` (Issued) → `Diakui` (Acknowledged) / `Negosiasi` → `Settled` (Paid/Recovered) OR `Ditolak` (Rejected).

### B. PIB Customs Request Engine (`pib_requests` table)
Calculates preliminary customs duties and taxes (BM, PPN, PPH) for kasbon cash advances prior to official customs bill release.

---

## 4. Database & API Specifications

### Table: `debit_notes`
- **Primary Key**: `id` (Integer Autoincrement)
- **Columns**: `dn_number` (Unique String), `import_project_id`, `claim_kategori` (`Claim Supplier`, `Claim Liner/FWD`, `Claim Trucking`), `jumlah_klaim`, `jumlah_recovery`, `status`.

### Table: `pib_requests`
- **Primary Key**: `id` (Integer Autoincrement)
- **Columns**: `request_number` (Unique String), `aju_pib`, `estimasi_bm`, `estimasi_ppn`, `estimasi_pph`, `kasbon_diminta`, `aktual_total`, `status`.

---

## 5. Functional & Edge Testing Checklist

- [x] **Functional Test**: Issue Debit Note claim → transition status from `Draft` to `Diterbitkan` → verify audit record created in `debit_note_status_history`.
- [x] **Negative Test**: Submit PIB request with zero `kasbon_diminta` → verify validation rejection.
