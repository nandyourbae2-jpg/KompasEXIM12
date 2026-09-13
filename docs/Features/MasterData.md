# Feature Documentation: Master Data & Vendor Management

## 1. Business Purpose & Overview

The **Master Data & Vendor Management** module maintains core reference data across the ERP, including logistics vendor profiles (forwarders, trucking companies), master document types, department registries, and cost classification keys.

- **Module Owner**: Master Data Administrator / Import Supervisor.
- **Related Modules**: Import Operational, Payment Tracker, Document Monitoring.
- **Implementation Status**: **Current Implementation** (Vendor CRUD, ratings, document types, and department master tables fully operational).

---

## 2. Navigation Path & UI Description

- **Navigation Path**: `Workspace` → `Vendor` (`/workspace/vendor`) & `Master Data` (`/workspace/master-data`)
- **UI Components**: `VendorManagementPage.jsx`, `VendorFormModal.jsx`, `VendorDetailPanel.jsx`, `MasterDataPage.jsx`, `MasterDataDokumen.jsx`

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Screenshot Placeholder: Vendor Management Dashboard UI]              │
│ Description: Vendor directory table with Service Classification        │
│ (Trucking/Forwarder), Star Rating system, and Contact Panel.          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Table Documentation

### Table: `vendors`
- **Primary Key**: `id` (Integer Autoincrement)
- **Columns**: `nama`, `service_type` (`Trucking` / `Forwarder`), `region`, `status` (`Aktif` / `Tidak Aktif`), `rating` (Float), `review_count`, `kontak_nama`, `kontak_email`, `kontak_telepon`, `alamat`, `layanan` (JSON array).

### Table: `master_data_dokumen`
- **Primary Key**: `id` (Integer Autoincrement)
- **Columns**: `kode_dokumen` (Unique String), `nama_dokumen`, `keterangan`.

---

## 4. Functional & Edge Testing Checklist

- [x] **Functional Test**: Create new vendor with `service_type = 'Trucking'` → verify vendor becomes available in shipment container dropdowns.
- [x] **Negative Test**: Create duplicate master document with existing `kode_dokumen` → verify unique constraint enforcement.
