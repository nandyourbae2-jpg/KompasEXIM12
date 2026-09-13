# Feature Documentation: Financial Commitment & Request Ledger

## 1. Business Purpose & Overview

The **Financial Commitment & Request Ledger** module is designed to provide financial predictability for import operations. When an import project is initialized, the system automatically evaluates trade terms (Incoterms) and transport modes to calculate baseline financial commitments before vendor invoices arrive.

- **Module Owner**: Import Financial Controller / Import Staff.
- **Related Modules**: Import Operational (`import_projects`), Payment Tracker (`job_orders`), Manager Dashboard.
- **Implementation Status**: **Current Implementation** (Ledger tables, Incoterm rule engine, and allocation schemas fully implemented).

---

## 2. User Roles & Access Control

| Role | Allowed Actions | Restrictions | Approval Flow |
| :--- | :--- | :--- | :--- |
| **Staff Dept** | View commitments, create manual financial requests | Cannot approve financial requests | Draft → Submitted |
| **Supervisor** | View, edit, approve, or reject financial requests | Cannot alter rule engine defaults | Submitted → Approved / Rejected |
| **Manager** | View consolidated financial commitments & allocations | Read-only executive view | N/A |
| **Admin** | Configure `ref_commitment_rules` master rules | Full system access | N/A |

---

## 3. Navigation Path & UI Description

- **Navigation Path**: `Workspace` → `Financial Request` (`/workspace/financial-request`)
- **UI Components**: `FinancialRequestList.jsx`, `FinancialRequestDetail.jsx`

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Screenshot Placeholder: Financial Request Ledger Dashboard UI]        │
│ Description: Table listing financial requests with filtering tabs     │
│ (All, Draft, Submitted, Checked1, Approved, Rejected).                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Field-by-Field Documentation

### Database Table: `financial_requests` & `financial_request_ledger`

| Field Name | Database Column | Data Type | Required | Default Value | Validation Rules | Business Meaning | Example Value |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Request Number | `request_number` | `VARCHAR` | YES | Auto-generated | Unique string (`REQ-{timestamp}-{rand}`) | Unique financial request tracking ID | `REQ-172295000-482` |
| Source | `sumber` | `VARCHAR` | YES | `'manual'` | Must be `'import_operational'` or `'manual'` | Origin of financial request | `'import_operational'` |
| Project Link | `import_project_id` | `INTEGER` | YES | `NULL` | FK to `import_projects(id)` | Foreign key link to import project | `12` |
| Shipment Link | `shipment_id` | `INTEGER` | NO | `NULL` | FK to `import_shipments(id)` | Foreign key link to specific shipment | `45` |
| Cost Category | `cost_category` / `jenis_pengajuan` | `VARCHAR` | YES | N/A | Standardized category string | Category of cost (Trucking, Freight, PIB) | `'Trucking'` |
| Estimated Amount | `estimasi_nominal` / `baseline_amount` | `REAL` | YES | `0` | Numeric ≥ 0 | Estimated financial commitment | `15000000.00` |
| Currency | `mata_uang` / `currency` | `VARCHAR` | YES | `'IDR'` | 3-letter currency code | Currency code | `'IDR'` |
| Status | `status` | `VARCHAR` | YES | `'Draft'` | Enum (`Draft`, `Submitted`, `Checked1`, `Approved`, `Rejected`, `Cancelled`) | Request approval state | `'Submitted'` |

---

## 5. Button Actions & Interactive Dialogs

| Button Name | UI Location | Action / Behavior | Backend API Called | Success Message / Toast |
| :--- | :--- | :--- | :--- | :--- |
| **+ Buat Pengajuan** | Header Action | Opens creation modal form | N/A (Frontend state) | N/A |
| **Submit Pengajuan** | Form Action | Validates & submits request for approval | `POST /api/financial-requests` | "Pengajuan dana berhasil dibuat" |
| **Setujui (Approve)** | Detail View | Supervisor approves financial request | `PATCH /api/financial-requests/:id/status` | "Pengajuan dana disetujui" |
| **Tolak (Reject)** | Detail View | Prompts modal for rejection notes | `PATCH /api/financial-requests/:id/status` | "Pengajuan dana ditolak" |

---

## 6. Backend API Specifications

### Endpoint: `POST /api/v2/commitments/evaluate`
- **Method**: `POST`
- **Purpose**: Evaluates active Incoterm rules and spawns commitments for a new project.
- **Request Body**:
```json
{
  "projectId": 12,
  "incoterm": "FOB",
  "transportMode": "FCL"
}
```
- **Response Schema (200 OK)**:
```json
{
  "success": true,
  "spawned": [
    { "cost_category": "Freight & Line", "baseline_amount": 25000000, "type": "STANDARD" },
    { "cost_category": "Trucking", "baseline_amount": 8000000, "type": "STANDARD" }
  ]
}
```

---

## 7. Business Rules & Validation

1. **Rule Engine Execution**: When `CommitmentEngine.evaluate()` triggers, active rules in `ref_commitment_rules` matching `incoterm` and `transport_mode` insert standard ledger rows.
2. **Approval Hierarchy**: Staff cannot self-approve requests. Submitting changes status to `Submitted`. Approval requires Supervisor or Manager JWT token.
3. **Allocation Gating**: Financial allocations (`financial_allocations`) can only link to job orders whose `total_invoice` matches or exceeds allocated amounts.

---

## 8. Functional, Negative & Edge Testing Checklist

- [x] **Functional Test**: Create project with FOB Incoterm → verify auto-spawned ledger rows in `financial_request_ledger`.
- [x] **Negative Test**: Submit financial request with missing `cost_category` → verify HTTP 400 validation error.
- [x] **Edge Case**: Concurrent double-approval by two supervisors → verify database version lock prevents double approval.
