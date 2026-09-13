# Kompas EXIM - Authorization Matrix

This document maps every protected endpoint to its corresponding authentication requirements, role-based access controls, department scopes, business owners, and audit responsibilities. It is a permanent artifact of the ERP Technical Guidebook.

| Endpoint | HTTP Method | Authentication | Allowed Roles | Department Scope | Business Owner | Audit Responsibility |
|----------|-------------|----------------|---------------|------------------|----------------|----------------------|
| `/api/document-types` | `POST` | Yes | `Manager`, `Supervisor` | None | Head of Ops | System Admin |
| `/api/document-types/:name` | `DELETE` | Yes | `Manager`, `Supervisor` | None | Head of Ops | System Admin |
| `/api/reports` | `GET` | Yes | `Manager`, `Supervisor`, `Staff Dept` | Required | Department Head | System Admin |
| `/api/documents` | `GET` | Yes | Any valid token | Required | Document Controller| System Admin |
| `/api/documents` | `POST` | Yes | `Manager`, `Supervisor`, `Staff Dept`| Required | Document Controller| User ID Logged |
| `/api/documents/:id` | `PATCH` | Yes | `Manager`, `Supervisor`, `Staff Dept`| None | Document Controller| User ID Logged |
| `/api/tasks` | `GET` | Yes | Any valid token | Required | Operation Lead | System Admin |
| `/api/tasks` | `POST` | Yes | `Manager`, `Supervisor` | None | Operation Lead | User ID Logged |
| `/api/tasks/:id` | `PATCH` | Yes | `Manager`, `Supervisor`, `Staff Dept`| None | Task Assignee | User ID Logged |
| `/api/tasks/:id/move` | `POST` | Yes | `Manager`, `Supervisor`, `Staff Dept`| None | Task Assignee | User ID Logged |
| `/api/tasks/:id` | `DELETE` | Yes | `Manager`, `Supervisor` | None | Operation Lead | User ID Logged |
| `/api/import-shipments/:id/container-costs` | `GET` | Yes | Any valid token | Required | Finance Controller | System Admin |
| `/api/container-costs` | `POST` | Yes | `Manager`, `Supervisor`, `Staff Dept`| Required | Finance Controller | User ID Logged |
| `/api/container-costs/:id` | `PATCH` | Yes | `Manager`, `Supervisor`, `Staff Dept`| Required | Finance Controller | User ID Logged |
| `/api/container-costs/:id` | `DELETE` | Yes | `Manager`, `Supervisor` | Required | Finance Controller | User ID Logged |
| `/api/financial-request-ledger/by-project`| `GET` | Yes | Any valid token | Required | Finance Controller | System Admin |
| `/api/financial-request-ledger` | `GET` | Yes | Any valid token | Required | Finance Controller | System Admin |
| `/api/financial-request-ledger/manual` | `POST` | Yes | `Manager`, `Supervisor`, `Staff Dept`| Required | Finance Controller | User ID Logged |
| `/api/financial-request-ledger/:id` | `PUT` | Yes | `Manager`, `Supervisor`, `Staff Dept`| Required | Finance Controller | User ID Logged |
| `/api/financial-request-ledger/push-to-payment`| `POST`| Yes | `Manager`, `Supervisor` | Required | Finance Controller | User ID Logged |
| `/api/v2/commitments/engine/evaluate` | `POST` | Yes | `Manager`, `Supervisor` | Required | Operation Lead | User ID Logged |
| `/api/v2/commitments/:id/verify` | `PATCH` | Yes | `Manager`, `Supervisor`, `Staff Dept`| Required | Finance Controller | User ID Logged |

## Notes
- `Manager` role automatically bypasses Department Authorization.
- All mutating actions (`POST`, `PATCH`, `PUT`, `DELETE`) require structured logging of the acting User ID.
