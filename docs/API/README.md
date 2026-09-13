# KOMPAS EXIM ERP — REST API Specification Catalog

This document provides complete, definitive technical specifications for all HTTP REST API endpoints implemented in the KOMPAS EXIM ERP backend server (`backend/index.js` and `backend/src/routes/*`).

---

## 1. Global API Standards

- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`
- **Authentication Header**: `Authorization: Bearer <jwt_token>`
- **Response Format**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

---

## 2. API Endpoint Directory

### Authentication & System Routes

#### `POST /api/login`
- **Purpose**: Authenticates user credentials and returns JWT bearer token.
- **Request Body**:
```json
{
  "employee_id": "EMP-001",
  "password": "password123"
}
```
- **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "employee_id": "EMP-001",
    "name": "Budi Santoso",
    "level_otoritas": "Manager",
    "departemen": "Import"
  }
}
```

---

### Import Operational Routes

#### `GET /api/import-operational/shipments`
- **Purpose**: Retrieves all import shipments enriched with stage calculation and progress %.
- **Domain Service**: `ShipmentService.getAllShipmentsWithStage()`
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "shipment_code": "SHP-2026-001",
    "un": "UN-2026-0012",
    "supplier": "GLOBAL CHEM CO",
    "stage": "Delivery Active",
    "progress": 50
  }
]
```

#### `POST /api/import-operational/shipments`
- **Purpose**: Creates a new import shipment and attaches initial container records.
- **Request Body**:
```json
{
  "un": "UN-2026-0089",
  "kat": "RM",
  "supplier": "PT GLOBAL CHEMICALS",
  "inv": "INV-8910",
  "modeTransport": "FCL",
  "importProjectId": 12
}
```

---

### Realisasi Dana MTB Routes

#### `GET /api/realisasi-mtb/periode`
- **Purpose**: Retrieves all MTB petty cash realization periods with running balance statistics.
- **Service**: `MtbService`

#### `POST /api/realisasi-mtb/transactions`
- **Purpose**: Inserts a new MTB realization transaction, updates running balance, and writes audit history.
- **Request Body**:
```json
{
  "periode_id": 1,
  "tgl_payment": "2026-08-06",
  "category": "LOLO (Reimb)",
  "amount_exclude_tax": 1000000,
  "vat": 110000,
  "pot_pph23_diskon": 20000,
  "debet": 0,
  "job_order_id": 15
}
```

---

### Supervisor & Manager Dashboard Routes

#### `GET /api/control-tower/stats`
- **Purpose**: Returns Supervisor Control Tower KPIs (active tasks, overdue, escalations, active shipments).

#### `GET /api/manager/dashboard`
- **Purpose**: Returns Executive Manager Dashboard payload (financial breakdown, payment stats, department health, SLA analytics).
- **Domain Services**: `FinancialService`, `ShipmentService`, `TaskService`.
