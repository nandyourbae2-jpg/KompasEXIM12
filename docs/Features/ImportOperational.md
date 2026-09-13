# Feature Documentation: Import Operational & Container Logistics

## 1. Business Purpose & Overview

The **Import Operational & Container Logistics** module manages the physical execution of inbound shipments. It tracks vessel schedules (ETD, ETA, ATA), shipping line details, container movements (Stack, Gate Out Port, Trucking Repo, Gate In Warehouse, Offloading, Gate Out Warehouse), and container-level costs (Storage, Monitoring, Recooling, LOLO, Inap Sasis).

- **Module Owner**: Import Operational Staff & Logistics Coordinator.
- **Related Modules**: Document Monitoring, Payment Tracker, Supervisor Control Tower.
- **Implementation Status**: **Current Implementation** (Full container lifecycle, issue tracking, container cost calculations operational).

---

## 2. User Roles & Access Control

| Role | Allowed Actions | Restrictions | Approval Flow |
| :--- | :--- | :--- | :--- |
| **Staff Dept** | Create/edit projects, shipments, containers, costs | Cannot override closed period data | Direct input |
| **Supervisor** | View all operational shipments, audit container delays | Read/Write operational oversight | Override flag |
| **Manager** | View operational KPIs, clearance SLA performance | Read-only executive view | N/A |
| **Admin** | Full system permissions | N/A | N/A |

---

## 3. Navigation Path & UI Description

- **Navigation Path**: `Workspace` → `Import Operational` (`/workspace/import-operational`)
- **UI Components**: `ImportOpsList.jsx`, `ShipmentDetail.jsx`, `TabIdentitas.jsx`, `TabDepo.jsx`, `TabLolo.jsx`, `TabTrucking.jsx`, `CostInputSection.jsx`

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Screenshot Placeholder: Import Operational Shipment Detail UI]        │
│ Description: Tabbed operational layout showing Shipment Identity,      │
│ Container Table with Gate Out/In milestones, and Cost Section.         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Field-by-Field Documentation

### Database Table: `import_projects`

| Field Name | Database Column | Data Type | Required | Validation Rules | Business Meaning | Example Value |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Task UN | `task_unique_number` | `VARCHAR` | YES | Unique String | Unique operational project identifier | `UN-2026-0089` |
| Supplier | `supplier` | `VARCHAR` | YES | Non-empty | Supplier / Exporter company name | `PT GLOBAL CHEMICALS LTD` |
| Import Type | `import_type` | `VARCHAR` | YES | Enum (`Raw Material`, `Indirect Mat. Food`, etc.) | Classification of imported goods | `'Raw Material'` |
| BL / AWB No | `bl_no` | `VARCHAR` | NO | String | Bill of Lading / Air Waybill number | `MAEU98234110` |
| ETA Port | `eta` | `TEXT` | NO | Date format `YYYY-MM-DD` | Estimated time of arrival at port | `2026-08-15` |
| Free Time | `free_time_destination` | `INTEGER` | NO | Integer ≥ 0 | Granted demurrage free time (days) | `14` |

### Database Table: `containers`

| Field Name | Database Column | Data Type | Required | Validation Rules | Business Meaning | Example Value |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Container No | `no_kontainer` | `VARCHAR` | YES | 11-char alphanumeric | Unique container ISO code | `MSKU7890123` |
| Gate Out Port | `gate_out` | `TEXT` | NO | Date timestamp | Date container exited port terminal | `2026-08-16 10:30` |
| Trucking Vendor | `trucking_wh_vendor` | `VARCHAR` | NO | String | Vendor transporting container to WH | `PT TATA TRUCKING` |
| Gate In WH | `gate_in_wh` | `TEXT` | NO | Date timestamp | Date container arrived at warehouse | `2026-08-16 14:15` |
| Gate Out WH | `gate_out_wh` | `TEXT` | NO | Date timestamp | Date empty container returned to depo | `2026-08-17 09:00` |
| Fish Issue | `fish_issue` | `INTEGER` | NO | 0 or 1 | Quarantine / Quarantine inspection flag | `0` |
| Queue Issue | `queue_issue` | `INTEGER` | NO | 0 or 1 | Port congestion / trucking queue flag | `1` |

---

## 5. Button Actions & Modals

| Button Name | UI Location | Action / Behavior | Backend Endpoint |
| :--- | :--- | :--- | :--- |
| **+ Shipment Baru** | `ImportOpsList.jsx` | Opens 2-step `AddShipmentModal` | `POST /api/import-operational/shipments` |
| **Simpan Container** | `ShipmentDetail.jsx` | Saves container movement timestamps | `PUT /api/import-operational/containers/:id` |
| **Toggle Issue Flag** | Container Row | Toggles Fish/Queue/Space issue status | `PATCH /api/import-operational/containers/:id/issues` |
| **Hitung Cost Rollup** | `CostInputSection` | Recalculates storage, monitoring, & detention | Client & `POST /api/container-costs` |

---

## 6. Backend API Specifications

### Endpoint: `GET /api/import-operational/shipments`
- **Method**: `GET`
- **Response**: Array of shipments enriched with `stage` and `progress` via `ShipmentService.getAllShipmentsWithStage()`.

```json
[
  {
    "id": 10,
    "shipment_code": "SHP-2026-004",
    "un": "UN-2026-0089",
    "supplier": "PT GLOBAL CHEMICALS LTD",
    "eta": "2026-08-15",
    "ata": "2026-08-15",
    "stage": "Delivery Active",
    "progress": 50
  }
]
```

---

## 7. Business Rules & Stage Transitions

`ShipmentService.js` enforces the 4 operational stages:
1. `Shipment Active` (25%): `ata` is null (Vessel in transit).
2. `Delivery Active` (50%): `ata` recorded, but NOT all containers have `gate_out_wh`.
3. `Financial Settlement` (75%): All containers have `gate_out_wh`, but open vendor invoices exist.
4. `Status Complete` (100%): All containers delivered AND all linked job orders fully paid (`Lunas`).

---

## 8. Functional & Edge Testing Checklist

- [x] **Functional Test**: Record container `gate_out_wh` for all containers → verify shipment stage auto-promotes to `Financial Settlement`.
- [x] **Negative Test**: Enter invalid container number format → verify frontend input validation.
- [x] **Edge Case**: Shipment with zero containers → verify default stage assignment handles zero-container edge cases safely without crashing.
