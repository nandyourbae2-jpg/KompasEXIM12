# KOMPAS EXIM ERP — Troubleshooting & Self-Healing Guide

This document provides error diagnosis, root cause analysis, and resolution procedures for operational users and technical system administrators.

---

## 1. System Self-Healing & Error Logging Architecture

When an unexpected exception occurs in the React client, the application's global `ErrorBoundary` component catches the crash and automatically transmits a diagnostic stack trace to the backend via `POST /api/log-error`.

Stack traces are logged to `backend/frontend-error.log` for root-cause diagnosis.

---

## 2. Common Exception & Troubleshooting Matrix

| Symptom / Error Message | Potential Cause | Solution Procedure |
| :--- | :--- | :--- |
| **HTTP 409 Conflict: "Transaction modified by another user"** | Optimistic locking version mismatch in `MtbService`. Another user modified the row concurrently. | Refresh the page to load the latest `version` integer, then re-apply your changes. |
| **"Job Order not eligible for MTB: Job Order is not fully paid"** | Attempting to assign an unpaid or partially paid Job Order to Realisasi Dana MTB. | Complete all invoice payments in **Payment Tracker** until status reads `Lunas`, then retry assignment. |
| **"Job Order category cannot be realized through MTB"** | `EligibilityRuleEngine` blocked cost category (e.g. `TRUC (Repo Depo)`). | Category is routed out of MTB. Settle expense through standard accounts payable invoice workflow instead. |
| **Shipment Stage stuck at "Shipment Active"** | Vessel arrival date (`ata`) has not been entered in shipment detail. | Input `ata` date in **Import Operational → Shipment Detail → Tab Identitas**. Stage will auto-promote to `Delivery Active`. |
| **Shipment Stage stuck at "Delivery Active"** | One or more containers attached to the shipment lack a `gate_out_wh` timestamp. | Ensure all containers have completed warehouse offloading and `gate_out_wh` timestamp is recorded. |
| **HTTP 401 Unauthorized: "Tidak ada token autentikasi"** | JWT session token expired or invalid login. | Log out and log back in to refresh JWT bearer token in localStorage. |

---

## 3. Database Maintenance & Recovery

### Diagnostic Command: SQLite Integrity Check
```bash
sqlite3 backend/kompas-exim.db "PRAGMA integrity_check;"
```

### Emergency Balance Recalculation:
If running balances become misaligned in MTB periods due to an external system recovery, trigger `MtbService.recalculateRunningBalance(periode_id)` via Node script:
```bash
node -e "const db=require('./src/database/db'); const MtbService=require('./src/services/mtbService'); new MtbService(db).recalculateRunningBalance(1);"
```
