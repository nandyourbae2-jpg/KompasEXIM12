# Feature Documentation: Supervisor Control Tower & Operations

## 1. Business Purpose & Overview

The **Supervisor Control Tower** module serves as the central operational command center for Import Department Supervisors. It aggregates real-time operational status, SLA delay alerts, pending financial approvals, task allocations, and staff performance metrics.

- **Module Owner**: Import Department Supervisor / Operations Manager.
- **Related Modules**: Import Operational, Financial Commitment, PIB Requests, Task Management.
- **Implementation Status**: **Current Implementation** (Control Tower KPIs, staff workload aggregator, task assignment, and department performance engine fully operational).

---

## 2. User Roles & Access Control

| Role | Allowed Actions | Restrictions | Approval Flow |
| :--- | :--- | :--- | :--- |
| **Supervisor** | View Control Tower, reassign tasks, approve/reject requests, resolve escalations | Cannot access Admin system settings | Full Supervisor Control |
| **Manager** | View Control Tower summaries | Executive view | Read-only / Review |
| **Staff Dept** | View assigned tasks in personal view | Cannot view supervisor departmental control tower | Restricted |

---

## 3. Navigation Path & UI Description

- **Navigation Path**: `Supervisor` → `Control Tower` (`/supervisor/control-tower`)
- **UI Components**: `ControlTower.jsx`, `StaffManagementPage.jsx`, `SpvShipmentMonitoring.jsx`, `SpvIssueEscalation.jsx`

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Screenshot Placeholder: Supervisor Control Tower Dashboard UI]       │
│ Description: Operational summary widgets showing Active Tasks, Overdue │
│ Shipments, Escalated Issues, and Staff Workload Distribution.          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Backend API Specifications & Domain Engine

### `TaskService.getStaffPerformance(departemen)`
Computes real-time performance indicators for all active import department staff:
- **Tugas Aktif**: Open tasks assigned to staff.
- **Selesai**: Tasks marked as `Selesai`.
- **Overdue**: Tasks with `tenggat < today` and status $\neq$ `Selesai`.
- **Completion Rate**: $\frac{\text{Selesai}}{\text{Total Tasks}} \times 100\%$

```json
[
  {
    "id": 3,
    "nama": "Budi Santoso",
    "employee_id": "EMP-003",
    "tipe_karyawan": "Karyawan Tetap",
    "tugas_aktif": 5,
    "selesai": 18,
    "overdue": 1,
    "completion_rate": 78
  }
]
```

---

## 5. Functional & Edge Testing Checklist

- [x] **Functional Test**: Reassign overdue task from Staff A to Staff B → verify `TaskService` updates assignee and logs entry in `task_status_history`.
- [x] **Negative Test**: Non-supervisor attempts to access `/supervisor/control-tower` → verify JWT route guard redirects to login / 403 Forbidden.
- [x] **Edge Case**: Department with zero assigned staff → verify Control Tower widgets render clean empty states without division-by-zero errors.
