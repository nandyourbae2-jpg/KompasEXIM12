# Feature Documentation: Manager Executive Dashboard

## 1. Business Purpose & Overview

The **Manager Executive Dashboard** provides high-level corporate oversight for executive management, department heads, and internal auditors. It consolidates strategic operational metrics, financial settlement progress, cost breakdowns by category, department health scores, and executive report reviews.

- **Module Owner**: General Manager / Import Department Head.
- **Related Modules**: All Import Department Modules (`ShipmentService`, `FinancialService`, `TaskService`).
- **Implementation Status**: **Current Implementation** (Manager Dashboard, Cost Monitoring, Department Health Engine, and Report Feedback fully operational).

---

## 2. User Roles & Access Control

| Role | Allowed Actions | Restrictions | Approval Flow |
| :--- | :--- | :--- | :--- |
| **Manager** | View executive dashboard widgets, review problem reports, provide manager feedback | Read-only operational data; executive authority | Final Review & Feedback |
| **Supervisor** | View summary metrics | Restricted executive widgets | Read-only |
| **Staff Dept** | No access to manager view | Access forbidden | N/A |

---

## 3. Navigation Path & UI Description

- **Navigation Path**: `Manager` → `Dashboard` (`/manager/dashboard` or `/manager/reports`)
- **UI Components**: `ManagerHome.jsx`, `ManagerImportReport.jsx`, `ManagerImportOverview.jsx`

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Screenshot Placeholder: Manager Executive Dashboard UI]              │
│ Description: Executive overview displaying Financial Settlement KPIs,  │
│ Cost Category Breakdown Donut Chart, and Department Health Cards.     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Executive Key Performance Indicators (KPIs)

### A. Cost Category Breakdown (`FinancialService.getCostBreakdown`)
Aggregates invoice and payment totals across standardized buckets:

$$\text{Grand Outstanding} = \text{Grand Total Invoice} - \text{Grand Total Paid}$$

```json
{
  "categories": [
    { "name": "Trucking", "total_invoice": 120000000, "total_paid": 95000000 },
    { "name": "Freight & Line", "total_invoice": 340000000, "total_paid": 340000000 }
  ],
  "grand_total_invoice": 460000000,
  "grand_total_paid": 435000000,
  "grand_outstanding": 25000000
}
```

### B. Department Health Score (`TaskService.getDepartmentHealth`)
Evaluates operational health across departments based on overdue task ratios, outputting status ratings: `Sangat Baik`, `Perlu Perhatian`, or `Kritis`.

---

## 5. Functional & Edge Testing Checklist

- [x] **Functional Test**: Filter cost breakdown by YTD period → verify `FinancialService` accurately filters SQL query parameters.
- [x] **Negative Test**: Non-manager role attempts to post manager report feedback → verify HTTP 403 Forbidden response.
- [x] **Edge Case**: Period with zero total tasks → health score engine handles zero tasks cleanly, returning 100 score (`Sangat Baik`).
