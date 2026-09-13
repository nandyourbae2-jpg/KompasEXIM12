# KOMPAS EXIM ERP — Import Department User Guidebook (Canva Content Package)

This document contains the complete, copy-paste-ready **User Training & SOP Guidebook Package** for the KOMPAS EXIM ERP Import Department. It is specially formatted for direct transfer into **Canva presentation decks, training workbooks, slide layouts, and PDF manuals**.

> [!NOTE]
> All workflows, business rules, field validations, and button behaviors in this guidebook are derived strictly from the active KOMPAS EXIM ERP codebase.

---

# TABLE OF CONTENTS & CANVA SLIDE MATRIX

| Slide / Page | Section | Module | Canva Template Recommendation |
| :--- | :--- | :--- | :--- |
| **Page 1** | Title Slide | Overall ERP | Executive Cover Deck |
| **Page 2** | System Overview & Objectives | System Overview | Corporate Intro Slide |
| **Page 3** | Global Navigation Map | System Navigation | Process Map / Flowchart Slide |
| **Pages 4–8** | Module 1: Import Operational & Container Logistics | Import Operations | Split Screen: Text Left + UI Placeholder Right |
| **Pages 9–12** | Module 2: Financial Commitment & Request Ledger | Financial Commitments | Form & Table Breakdown Slide |
| **Pages 13–16** | Module 3: Payment Tracker & Job Orders | Payment Tracker | Invoice & Status Indicator Slide |
| **Pages 17–20** | Module 4: Realisasi Dana MTB (Petty Cash Realization) | Petty Cash Realization | Accounting Ledger Table Slide |
| **Pages 21–23** | Module 5: PIB Customs & Debit Notes Claims | Customs & Claims | Approval & Claim Card Slide |
| **Pages 24–26** | Module 6: Supervisor Control Tower | Supervisor Operations | Metric Dashboard Slide |
| **Pages 27–29** | Module 7: Manager Executive Dashboard | Executive Manager View | Analytics & Donut Chart Slide |
| **Page 30** | Troubleshooting & Self-Healing Matrix | System Troubleshooting | 2-Column Warning / Matrix Slide |
| **Page 31** | Final Q&A and Screenshot Checklist | Appendix | Checklist & Q&A Slide |

---

# MODULE 1: IMPORT OPERATIONAL & CONTAINER LOGISTICS

## 1. Module Overview
- **Purpose**: Tracks inbound shipment logistics from overseas supplier dispatch through port customs arrival (ATA), container movements (Port → Warehouse → Depo return), and container-level demurrage/storage cost rollups.
- **Business Objective**: Prevent container demurrage penalties, eliminate manual Excel tracking, and provide 100% visibility over vessel schedules and container detention milestones.
- **When to Use**: When a new import order is placed, when vessel ETD/ETA/ATA dates are updated, and whenever containers move through port/warehouse gates.
- **Related Modules**: Document Monitoring, Financial Commitment, Payment Tracker, Supervisor Control Tower.
- **Estimated Reading Time**: 15 minutes.
- **Learning Objectives**: After completing this section, operational staff will be able to create import projects, attach containers, track gate-out/gate-in milestones, toggle issue flags, and calculate container cost rollups.

---

## 2. Navigation Path
```
Workspace
 └── Import Operational (/workspace/import-operational)
      ├── Shipment List View
      └── Shipment Detail View (/workspace/import-operational/:id)
           ├── Tab 1: Identitas (Shipment Metadata & ETA/ATA)
           ├── Tab 2: Depo & Kontainer (Gate In/Out Milestones)
           ├── Tab 3: Trucking & Storage (Transport Vendors)
           ├── Tab 4: LOLO & Cost Rollup (Storage/Recooling Costs)
           └── Tab 5: Line & Perizinan (Customs Documents)
```

---

## 3. Screen Breakdown

### Screen 1.1: Import Operational Shipment List (`ImportOpsList.jsx`)
- **Screen Name**: Import Operational Workspace
- **Purpose**: Lists all active and completed import shipments with real-time stage badges (`Shipment Active`, `Delivery Active`, `Financial Settlement`, `Status Complete`).
- **Screenshot Placeholder**:
  `[CANVA IMAGE PLACEHOLDER 1.1: Import Operational Shipment Table]`
- **Components Displayed**:
  - Header Title & **+ Shipment Baru** primary button.
  - Search Input bar (Filter by UN, Supplier, Invoice, BL).
  - Category Badge Filter Pills (`RM`, `Ind. Food`, `Ind. Pckg`, `Aset`, `Misc`).
  - Shipment Summary Table with stage progress bars.
- **Table Columns**: UN Number, Kat Badge, Supplier, Invoice No, BL No, ETA/ATA, Transport Mode, Stage Badge, Progress %, Actions.
- **Filters**: Category filter tabs, Transport Mode dropdown (`FCL`, `LCL Sea`, `LCL Air`, `Courier`).
- **Search**: Free text search filtering UN, Supplier, and Invoice numbers.
- **Buttons**: `+ Shipment Baru`, `Detail Shipment` (chevron button), `Delete` (trash icon).
- **Status Indicators**:
  - `Shipment Active` (Blue, 25% Progress): Vessel in transit; ATA not recorded.
  - `Delivery Active` (Yellow, 50% Progress): Vessel arrived; containers being delivered.
  - `Financial Settlement` (Orange, 75% Progress): All containers delivered; invoices pending.
  - `Status Complete` (Green, 100% Progress): Logistics and vendor invoices fully paid.

### Screen 1.2: Add Shipment Modal (`AddShipmentModal`)
- **Screen Name**: Tambah Shipment Modal (2-Step Wizard)
- **Purpose**: Connects an existing Import Project to an operational shipment or creates a standalone shipment.
- **Screenshot Placeholder**:
  `[CANVA IMAGE PLACEHOLDER 1.2: Add Shipment Modal Form]`
- **Components Displayed**:
  - Step 1: Project Selector (`Pilih Import Project`).
  - Step 2: Auto-filled Shipment Form (UN, Supplier, Category, BL No, Transport Mode, Container Quantity).
- **Buttons**: `Batal`, `Kembali`, `Lanjutkan`, `Simpan Shipment`.

---

## 4. Field-by-Field Explanation

| Field Name | Description | Required / Optional | Validation Rules | Example Value | Business Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unique Number (UN)** | Unique operational project tracking number | **Required** | Cannot be blank; must be unique | `UN-2026-0089` | Maps shipment to master import project |
| **Kategori (Kat)** | Material classification | **Required** | Must be valid option (`RM`, `Ind. Food`, `Ind. Pckg`, etc.) | `RM` (Raw Material) | Determines cost allocation default |
| **Supplier** | Overseas vendor / shipper company name | **Required** | Cannot be blank | `PT GLOBAL CHEMICALS` | Used for vendor SLA reporting |
| **Invoice No** | Supplier commercial invoice number | **Required** | Cannot be blank | `INV-2026-8812` | Mandatory link for Payment Tracker |
| **BL / AWB No** | Bill of Lading or Air Waybill number | Optional | Standard alphanumeric | `MAEU98234110` | Key document reference for customs |
| **ETA Port** | Estimated Arrival Date at destination port | Optional | Valid date format (`YYYY-MM-DD`) | `2026-08-15` | Baseline date for delay calculation |
| **ATA Port** | Actual Arrival Date at destination port | Optional | Valid date format (`YYYY-MM-DD`) | `2026-08-15` | **Triggers stage move to Delivery Active** |
| **Container No** | 11-digit ISO Container Identifier | **Required** | Must follow ISO pattern (4 letters + 7 digits) | `MSKU7890123` | Mandatory for container tracking |
| **Gate Out Port** | Date container physically left port gates | Optional | Date timestamp | `2026-08-16 10:30` | Starts detention free-time clock |
| **Gate In WH** | Date container arrived at factory warehouse | Optional | Date timestamp | `2026-08-16 14:15` | Confirms factory arrival |
| **Gate Out WH** | Date empty container returned to depo | Optional | Date timestamp | `2026-08-17 09:00` | **Triggers stage move to Financial Settlement** |

---

## 5. Button Reference

| Button Name | Screen Location | Purpose | Backend Action | Validation Rules | Success Result | Failure Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **+ Shipment Baru** | Header (`ImportOpsList`) | Opens creation modal wizard | None (Client Modal) | None | Modal opens | N/A |
| **Simpan Shipment** | Modal (`AddShipmentModal`) | Creates shipment record | `POST /api/import-operational/shipments` | UN, Supplier, Invoice required | Redirects to Shipment Detail View | Shows red alert error toast |
| **Simpan Container** | `ShipmentDetail` Tab 2 | Saves container dates & vendors | `PUT /api/import-operational/containers/:id` | Valid container number format | Updates container timeline badge | Displays validation error |
| **Fish Issue Toggle** | Container Table | Marks quarantine inspection flag | `PATCH /api/import-operational/containers/:id/issues` | User must be Staff or Supervisor | Highlights row yellow + updates SLA analytics | Toast error |
| **Hapus Shipment** | Action Menu | Soft-deletes shipment record | `DELETE /api/import-operational/shipments/:id` | Password confirmation | Removes row from table view | Error message shown |

---

## 6. Step-by-Step User Workflow

### Workflow 1.1: Creating a New Import Shipment & Tracking Containers
1. **Step 1**: Open **Workspace → Import Operational** from the main sidebar.
   - *Expected Result*: The Shipment List page renders with existing shipments.
2. **Step 2**: Click the **+ Shipment Baru** button in the top right corner.
   - *Expected Result*: The Add Shipment Modal window opens.
3. **Step 3**: Select an existing Import Project from the dropdown list OR choose "Input Manual".
   - *Expected Result*: Form fields (UN, Supplier, Invoice, ETA) automatically populate.
4. **Step 4**: Fill in container details (Container Number, Transport Mode `FCL`, Quantity) and click **Simpan Shipment**.
   - *Expected Result*: The backend saves the shipment and redirects to the **Shipment Detail View**.
5. **Step 5**: When the vessel arrives, enter the **ATA Port** date in Tab 1 and click **Simpan Metadata**.
   - *Expected Result*: The shipment status badge automatically updates from `Shipment Active` to `Delivery Active` (50% Progress).
6. **Step 6**: In Tab 2 (Depo & Kontainer), record **Gate Out Port**, **Gate In WH**, and **Gate Out WH** timestamps as the container moves.
   - *Expected Result*: Once all containers have `Gate Out WH`, the shipment status automatically promotes to `Financial Settlement` (75% Progress).

---

## 7. Actual Business Rules
1. **Stage Promotion Rule**:
   - `Shipment Active` (25%): Assigned automatically when `ATA` date is empty.
   - `Delivery Active` (50%): Assigned automatically when `ATA` date is entered, but not all containers have `Gate Out WH`.
   - `Financial Settlement` (75%): Assigned automatically when all containers have `Gate Out WH`, but open invoices remain unpaid.
   - `Status Complete` (100%): Assigned automatically when all containers are delivered AND all linked Job Orders are fully paid (`Lunas`).
2. **Container ISO Rule**: Container numbers must be unique across active shipments.
3. **Stage Single Source of Truth**: Frontend components NEVER compute stages manually; all stages are returned strictly by `ShipmentService.js`.

---

## 8. Common Errors & Solutions

| Error Message | Underlying Cause | User Solution |
| :--- | :--- | :--- |
| **"Mohon lengkapi field wajib (UN, Supplier, Invoice)"** | Form submitted with blank UN, Supplier, or Invoice fields. | Fill in all highlighted red input boxes before clicking Save. |
| **"Container number invalid format"** | Entered container number does not conform to 11-character ISO pattern. | Verify container code (e.g. 4 letters + 7 numbers like `MSKU1234567`). |
| **Stage stuck at "Shipment Active"** | Vessel arrival (ATA) date was not filled in. | Navigate to Tab 1 (Identitas), enter the ATA date, and click Save. |

---

## 9. Tips & Best Practices
- **DO**: Enter ATA immediately when the vessel docks to maintain accurate SLA performance metrics.
- **DO**: Toggle issue flags (`Queue Issue`, `Fish Issue`) as soon as delays occur to alert the Supervisor Control Tower.
- **DON'T**: Enter `Gate Out WH` before the container has physically left the warehouse.

---

## 10. Frequently Asked Questions (FAQ)

**Q1: Can I add multiple containers to a single shipment?**  
*A*: Yes. You can add as many containers as needed under Tab 2 (Depo & Kontainer).

**Q2: What happens if a container is delayed at customs inspection?**  
*A*: Click the `Fish Issue` or `Queue Issue` toggle switch on that container's row. This instantly flags the delay on the **Supervisor Control Tower** and includes the incident in monthly delay reports.

---

## 11. Screenshot Checklist for Canva Deck

- [ ] **Screenshot 1.1**: Import Operational Workspace Table (`/workspace/import-operational`)
- [ ] **Screenshot 1.2**: Add Shipment Modal Wizard (`AddShipmentModal.jsx`)
- [ ] **Screenshot 1.3**: Shipment Detail View — Tab Identitas (`ShipmentDetail.jsx`)
- [ ] **Screenshot 1.4**: Container Logistics & Movement Table — Tab Depo (`TabDepo.jsx`)
- [ ] **Screenshot 1.5**: Container Cost Rollup Section (`CostInputSection.jsx`)

---

## 12. Canva Page Layout Recommendation
- **Slide 4**: Module Title & Purpose Overview (Split Layout: Text Box Left, Icon Grid Right).
- **Slide 5**: Screen Breakdown — Shipment Workspace Table (Full width screenshot with callout lines).
- **Slide 6**: Step-by-Step Workflow — Creating & Updating Shipments (Numbered 1-6 Process Cards).
- **Slide 7**: Container Milestones & Stage Transition Logic (Diagram: 25% → 50% → 75% → 100%).
- **Slide 8**: Common Troubleshooting & FAQ (Two-column card layout).

---

## 13. Trainer Presentation Notes

> *"Welcome to Module 1: Import Operational & Container Logistics. In this module, operational staff manage the physical journey of import cargo. Notice the stage badges on the shipment list—these badges update automatically based on real logistics events. Remember: as soon as the vessel docks, enter the ATA date. That single action moves the shipment from 'Shipment Active' to 'Delivery Active' and feeds real-time SLA metrics into the Manager's dashboard."*

---
---

# MODULE 2: FINANCIAL COMMITMENT & REQUEST LEDGER

## 1. Module Overview
- **Purpose**: Automatically generates pre-calculated financial commitments based on trade Incoterms (FOB, CIF, EXW) and transport modes (FCL/LCL) upon project creation, and manages manual financial requests.
- **Business Objective**: Eliminate unexpected import operational costs by locking in baseline financial commitments before vendor invoices arrive.
- **When to Use**: Upon initialization of a new import project, or when staff need to request operational funds for port/customs expenses.
- **Related Modules**: Import Operational, Payment Tracker, Supervisor Approval Center.
- **Estimated Reading Time**: 10 minutes.
- **Learning Objectives**: After completing this section, staff will understand how Incoterms spawn baseline commitments and how to submit financial requests for supervisor approval.

---

## 2. Navigation Path
```
Workspace
 └── Financial Request (/workspace/financial-request)
      ├── Financial Request List View
      └── Financial Request Detail View (/workspace/financial-request/:id)
```

---

## 3. Screen Breakdown

### Screen 2.1: Financial Request List View (`FinancialRequestList.jsx`)
- **Screen Name**: Financial Request Ledger
- **Purpose**: Displays baseline commitments auto-spawned by the Incoterm engine alongside manual financial requests, showing approval states (`Draft`, `Submitted`, `Checked1`, `Approved`, `Rejected`).
- **Screenshot Placeholder**:
  `[CANVA IMAGE PLACEHOLDER 2.1: Financial Request Table View]`
- **Components Displayed**:
  - Filter Tabs (`Semua`, `Draft`, `Submitted`, `Disetujui`, `Ditolak`).
  - **+ Buat Pengajuan** primary action button.
  - Financial Ledger Table displaying Request Number, Category, Baseline Amount, Currency, Status, and Actions.

---

## 4. Field-by-Field Explanation

| Field Name | Description | Required / Optional | Validation Rules | Example Value | Business Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Request Number** | System-generated tracking ID | **Required** | Auto-generated (`REQ-{timestamp}-{rand}`) | `REQ-17229500-12` | Immutable reference key |
| **Cost Category** | Cost category classification | **Required** | Must select valid category | `Trucking` | Maps to `FinancialService` buckets |
| **Estimated Amount** | Estimated baseline cost | **Required** | Numeric > 0 | `15,000,000` | Baseline for allocation comparison |
| **Currency** | Transaction currency | **Required** | 3-letter currency code | `IDR` | Defaults to `IDR` |
| **Status** | Approval state | **Required** | Controlled by backend | `Submitted` | Controls edit permissions |

---

## 5. Button Reference

| Button Name | Screen Location | Purpose | Backend Action | Success Result | Failure Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **+ Buat Pengajuan** | Header | Opens financial request modal | None (Client Modal) | Form modal opens | N/A |
| **Submit Pengajuan** | Form Modal | Submits request for supervisor review | `POST /api/financial-requests` | Status changes to `Submitted` | Red error alert |
| **Setujui (Approve)** | Detail View | Supervisor approves financial request | `PATCH /api/financial-requests/:id/status` | Status updates to `Approved` | Error notification |

---

## 6. Step-by-Step User Workflow

### Workflow 2.1: Submitting a Financial Request
1. **Step 1**: Navigate to **Workspace → Financial Request**.
2. **Step 2**: Click **+ Buat Pengajuan**.
3. **Step 3**: Select Cost Category (e.g. `Trucking`), enter Estimated Amount (e.g. `15,000,000`), and select the target Import Project.
4. **Step 4**: Click **Submit Pengajuan**.
   - *Expected Result*: Request status is set to `Submitted` and appears in the Supervisor's Approval Center.

---

## 7. Actual Business Rules
1. **Incoterm Auto-Spawning**: Creating a project with `FOB` automatically spawns baseline commitments for Freight and Trucking via `CommitmentEngine.js`.
2. **Approval Gate**: Staff cannot approve their own financial requests. Status transitions from `Draft` → `Submitted` → `Approved` (requires Supervisor authority).

---

## 8. Common Errors & Solutions

| Error Message | Cause | Solution |
| :--- | :--- | :--- |
| **"Nominal estimasi harus lebih dari 0"** | Submitted form with zero or empty amount. | Enter a positive numerical estimation amount. |
| **"Access Denied: Supervisor level required"** | Staff attempted to click the Approve button. | Log in with Supervisor credentials to approve requests. |

---

## 9. Tips & Best Practices
- **DO**: Verify that trade Incoterms are correct during project creation so `CommitmentEngine` spawns accurate baseline figures.
- **DON'T**: Create manual financial requests for costs already covered by auto-spawned baseline commitments.

---

## 10. Frequently Asked Questions (FAQ)

**Q1: Where do auto-generated commitments come from?**  
*A*: They are automatically created by `CommitmentEngine.js` matching active rules in `ref_commitment_rules` against your project's Incoterms.

---

## 11. Screenshot Checklist for Canva Deck
- [ ] **Screenshot 2.1**: Financial Request Ledger View (`FinancialRequestList.jsx`)
- [ ] **Screenshot 2.2**: Create Financial Request Modal Form

---

## 12. Canva Page Layout Recommendation
- **Slide 9**: Financial Commitment Overview & Incoterm Rules (Diagram layout).
- **Slide 10**: Screen Breakdown — Financial Request Ledger Table.
- **Slide 11**: Step-by-Step Approval Workflow (Staff Submit → Supervisor Approve).
- **Slide 12**: Summary & Key Business Rules.

---

## 13. Trainer Presentation Notes
> *"In Module 2, notice how KOMPAS EXIM locks in cost predictability. When you select an Incoterm like FOB, the engine automatically populates estimated ledger rows. This prevents unexpected invoices from surprising the finance department later."*

---
---

# MODULE 3: PAYMENT TRACKER & VENDOR JOB ORDERS

## 1. Module Overview
- **Purpose**: Manages vendor invoices, reconciles job orders against shipments, logs itemized payments, and tracks payment statuses (`Belum Dibayar`, `Bayar Sebagian`, `Lunas`).
- **Business Objective**: Ensure accurate vendor billing, prevent duplicate invoice payments, and provide financial auditability for every shipping expense.
- **When to Use**: When vendor invoices arrive for freight, trucking, depo, or customs services, and when logging payment disbursements.
- **Related Modules**: Import Operational, Realisasi Dana MTB, Manager Dashboard.
- **Estimated Reading Time**: 12 minutes.
- **Learning Objectives**: After completing this section, staff will be able to create Job Orders, log vendor payments, review payment histories, and hand off fully paid orders to Realisasi Dana MTB.

---

## 2. Navigation Path
```
Workspace
 └── Payment Tracker (/workspace/payment)
      ├── Payment Dashboard View
      ├── Modal: Add Invoice / Job Order
      ├── Modal: Update Payment
      ├── Modal: Payment History
      └── Modal: Assign to MTB
```

---

## 3. Screen Breakdown

### Screen 3.1: Payment Dashboard (`PaymentDashboard.jsx`)
- **Screen Name**: Payment Tracker Dashboard
- **Purpose**: Displays aggregated financial cards (Total Invoice, Total Paid, Outstanding Balance) and the Job Orders table.
- **Screenshot Placeholder**:
  `[CANVA IMAGE PLACEHOLDER 3.1: Payment Tracker Dashboard]`
- **Components Displayed**:
  - Financial Summary Cards (Total Invoice, Total Paid, Outstanding).
  - Search bar & Filter Dropdowns (Status: `All`, `Belum Dibayar`, `Bayar Sebagian`, `Lunas`).
  - **+ Tambah Invoice** action button.
  - Job Order Table with payment status badges.
- **Buttons**: `+ Tambah Invoice`, `Bayar / Update`, `Riwayat Bayar`, `Assign to MTB`.

---

## 4. Field-by-Field Explanation

| Field Name | Description | Required / Optional | Validation Rules | Example Value | Business Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **JO Code** | Unique Job Order Code | **Required** | Auto-generated (`JO-{timestamp}`) | `JO-172295001` | Unique payment tracking key |
| **Vendor** | Logistics service provider | **Required** | Select from active vendors | `PT TATA TRUCKING` | FK link to `vendors` master table |
| **Cost Category** | Cost classification | **Required** | Select standard cost category | `TRUC (Warehouse)` | Classified by `FinancialService` |
| **Invoice No** | Vendor invoice number | **Required** | Cannot be empty | `INV-2026-9901` | Prevents duplicate vendor billing |
| **DPP** | Tax Base Amount | **Required** | Numeric ≥ 0 | `5,000,000` | Tax calculation foundation |
| **Tax % (PPN)** | PPN Percentage | Optional | Numeric (0 - 100) | `11.0` | Default 11% PPN |
| **Total Invoice** | Total billing amount | **Required** | Computed (`DPP + PPN`) | `5,550,000` | Total billing obligation |
| **Total Paid** | Total accumulated payments | System | Calculated from `payment_logs` | `5,550,000` | Determines payment status |

---

## 5. Button Reference

| Button Name | Location | Purpose | Backend Action | Success Result | Failure Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **+ Tambah Invoice** | Header | Opens invoice creation form | None (Client Modal) | Form modal opens | N/A |
| **Simpan Invoice** | Modal | Saves new Job Order | `POST /api/job-orders` | Adds row to table | Error toast shown |
| **Bayar / Update** | Row Action | Opens payment entry modal | None (Client Modal) | Payment modal opens | N/A |
| **Simpan Pembayaran** | Modal | Logs payment disbursement | `POST /api/job-orders/:id/payments` | Updates status badge to `Lunas` | Validation alert |
| **Assign to MTB** | Row Action | Hands off paid JO to MTB | `POST /api/realisasi-mtb/transactions` | Assigns JO to open MTB period | Eligibility error |

---

## 6. Step-by-Step User Workflow

### Workflow 3.1: Recording an Invoice & Logging Payment
1. **Step 1**: Open **Workspace → Payment Tracker**.
2. **Step 2**: Click **+ Tambah Invoice**.
3. **Step 3**: Select Vendor, enter Invoice Number, select Cost Category, enter DPP, and link the Shipment UN Number.
4. **Step 4**: Click **Simpan Invoice**.
   - *Expected Result*: Job Order is saved with status `Belum Dibayar`.
5. **Step 5**: When payment is disbursed, click **Bayar / Update** on the Job Order row.
6. **Step 6**: Enter Payment Amount, Payment Date, and Payment Method (e.g. `Bank Transfer`), then click **Simpan Pembayaran**.
   - *Expected Result*: Status badge automatically updates to `Lunas` (Fully Paid).

---

## 7. Actual Business Rules
1. **Dynamic Payment Status Engine (`statusBadgeJO`)**:
   - `Lunas`: `total_paid >= total_invoice` AND `total_invoice > 0`.
   - `Bayar Sebagian`: `total_paid > 0` AND `total_paid < total_invoice`.
   - `Belum Dibayar`: `total_paid === 0`.
2. **Completion Trigger**: When all Job Orders linked to a shipment reach `Lunas` AND all containers are delivered, `ShipmentService` promotes shipment stage to `Status Complete` (100%).

---

## 8. Common Errors & Solutions

| Error Message | Cause | Solution |
| :--- | :--- | :--- |
| **"Nilai pembayaran melebihi sisa tagihan"** | Payment entered exceeds outstanding balance. | Enter an amount equal to or less than the outstanding balance. |
| **"Job Order is not fully paid"** | Attempted to click Assign to MTB on unpaid JO. | Fully pay the invoice until status reads `Lunas` before assigning to MTB. |

---

## 9. Tips & Best Practices
- **DO**: Check existing invoice numbers before saving to avoid duplicate billing entries.
- **DON'T**: Leave Job Orders without linking a Shipment UN number.

---

## 10. Frequently Asked Questions (FAQ)

**Q1: Can I make partial payments on a Job Order?**  
*A*: Yes. Enter the partial amount in the payment modal. The status will update to `Bayar Sebagian` and track the remaining balance.

---

## 11. Screenshot Checklist for Canva Deck
- [ ] **Screenshot 3.1**: Payment Tracker Dashboard (`PaymentDashboard.jsx`)
- [ ] **Screenshot 3.2**: Add Invoice Modal (`AddInvoiceModal.jsx`)
- [ ] **Screenshot 3.3**: Update Payment Modal (`UpdatePaymentModal.jsx`)

---

## 12. Canva Page Layout Recommendation
- **Slide 13**: Module Overview & Payment Status Badge Rules.
- **Slide 14**: Payment Tracker Dashboard Overview.
- **Slide 15**: Step-by-Step Invoice Entry & Payment Logging.
- **Slide 16**: Job Order Handoff to Realisasi MTB.

---

## 13. Trainer Presentation Notes
> *"In Module 3, focus on the status badges: Red for Belum Dibayar, Yellow for Bayar Sebagian, and Green for Lunas. As soon as you log payments equal to the invoice total, the system marks it Lunas and enables the 'Assign to MTB' button."*

---
---

# MODULE 4: REALISASI DANA MTB (PETTY CASH REALIZATION)

## 1. Module Overview
- **Purpose**: Manages petty cash realizations, advance settlements, and cash disbursements, featuring running balance calculations (`saldo_running`) and transaction audit trails.
- **Business Objective**: Maintain transparent, audit-ready petty cash accounting and enforce `EligibilityRuleEngine` gating before cash realization.
- **When to Use**: Daily operational cash expense entry, advance settlements, and monthly period closure.
- **Related Modules**: Payment Tracker, Supervisor Approval Center.
- **Estimated Reading Time**: 15 minutes.
- **Learning Objectives**: After completing this section, staff will be able to manage MTB periods, enter transactions, review running balances, and understand optimistic locking concurrency rules.

---

## 2. Navigation Path
```
Workspace
 └── Finance (/workspace/finance/realisasi-dana)
      └── Tab MTB (Realisasi Dana MTB)
           ├── Period Selector Dropdown
           ├── MTB Transaction Table
           └── Action: + Tambah Transaksi / Assign JO
```

---

## 3. Screen Breakdown

### Screen 4.1: Realisasi Dana MTB View (`TabMtb.jsx` & `TabMtbDetail.jsx`)
- **Screen Name**: Realisasi Dana MTB Accounting View
- **Purpose**: Displays the Excel-style petty cash accounting ledger for the selected period.
- **Screenshot Placeholder**:
  `[CANVA IMAGE PLACEHOLDER 4.1: MTB Accounting Ledger View]`
- **Components Displayed**:
  - Period Header Cards (Saldo Awal, Total Debet, Total Kredit, Saldo Akhir, Period Status).
  - Transaction Table displaying Payment Date, Category, Unique Number, Debet, Kredit, Tax Deductions (PPh23), and Running Balance.
  - Action buttons (**+ Tambah Transaksi**, **Submit Period**).

---

## 4. Field-by-Field Explanation

| Field Name | Description | Required / Optional | Validation Rules | Example Value | Business Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Payment Date** | Date cash was paid out | **Required** | Valid date format | `2026-08-05` | Transaction recording timestamp |
| **Category** | Expense classification | **Required** | Select valid category | `LOLO (Reimb)` | Auto-filled if linked to JO |
| **Debet** | Cash top-up / advance inflow | Optional | Numeric ≥ 0 | `10,000,000` | Increases running balance |
| **Kredit** | Net cash outflow | Optional | Auto-calculated | `3,500,000` | Decreases running balance |
| **PPh 23 Tax** | Income tax withholding deduction | Optional | Numeric ≥ 0 | `70,000` | Deducted from gross credit |
| **Saldo Running** | Cumulative period balance | System | Auto-calculated | `46,500,000` | $\text{Balance}_{n-1} - \text{Kredit} + \text{Debet}$ |
| **Version** | Optimistic lock version | System | Integer | `1` | Prevents race conditions |

---

## 5. Button Reference

| Button Name | Location | Purpose | Backend Action | Success Result | Failure Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **+ Tambah Transaksi** | Header | Opens transaction form | None (Client Modal) | Modal opens | N/A |
| **Simpan Transaksi** | Modal | Executes atomic transaction | `POST /api/realisasi-mtb/transactions` | Recalculates running balance | Eligibility / Concurrency error |
| **Submit Period** | Header | Submits period for SPV check | `PATCH /api/realisasi-mtb/periode/:id/status` | Status updates to `Submitted` | Error alert |

---

## 6. Step-by-Step User Workflow

### Workflow 4.1: Entering an MTB Transaction
1. **Step 1**: Open **Workspace → Finance → Realisasi Dana → Tab MTB**.
2. **Step 2**: Select the active period (e.g. `MTB August 2026`) from the period dropdown.
3. **Step 3**: Click **+ Tambah Transaksi**.
4. **Step 4**: Enter Payment Date, Category, Amount Exclude Tax, VAT, and Tax Deductions (PPh23).
5. **Step 5**: Click **Simpan Transaksi**.
   - *Expected Result*: Transaction inserts successfully; backend `MtbService` recalculates all running balances atomically.

---

## 7. Actual Business Rules
1. **Eligibility Rule (`EligibilityRuleEngine.js`)**: A Job Order CANNOT enter MTB unless:
   - `payment_status === 'PAID'` (Fully paid).
   - Category is permitted by master data configuration.
   - Job Order has not already been realized in MTB.
2. **Running Balance Engine**:
   $$\text{Saldo Running}_n = \text{Saldo Running}_{n-1} - \text{Kredit}_n + \text{Debet}_n$$
3. **Optimistic Locking**: Transaction updates verify `WHERE id = ? AND version = ?`. If version mismatch occurs, update aborts with HTTP 409 Conflict.

---

## 8. Common Errors & Solutions

| Error Message | Cause | Solution |
| :--- | :--- | :--- |
| **"Job Order not eligible for MTB: Job Order is not fully paid"** | Selected JO is unpaid. | Fully pay JO in Payment Tracker first. |
| **"Transaction has been modified by another user. Please refresh"** | Optimistic lock version conflict. | Refresh page to load latest version, then retry. |

---

## 9. Tips & Best Practices
- **DO**: Re-check running balances after deleting or editing historical transactions.
- **DON'T**: Attempt to edit transactions in a period marked `Approved`.

---

## 10. Frequently Asked Questions (FAQ)

**Q1: How does the system calculate Saldo Running?**  
*A*: `MtbService.recalculateRunningBalance()` automatically recomputes cumulative balances row-by-row in chronological sequence whenever changes occur.

---

## 11. Screenshot Checklist for Canva Deck
- [ ] **Screenshot 4.1**: Realisasi Dana MTB Accounting View (`TabMtb.jsx`)
- [ ] **Screenshot 4.2**: Add MTB Transaction Modal

---

## 12. Canva Page Layout Recommendation
- **Slide 17**: Realisasi MTB Overview & Gating Rules.
- **Slide 18**: Accounting Table Breakdown & Running Balance Formula.
- **Slide 19**: Step-by-Step Transaction Entry & Audit Trail.
- **Slide 20**: Concurrency Locking & Period Closure.

---

## 13. Trainer Presentation Notes
> *"In Module 4, pay close attention to the Saldo Running column. The backend recalculates this balance automatically. Notice also that the system protects against double entries: you cannot add an unpaid invoice to MTB!"*

---
---

# MODULE 5: PIB CUSTOMS & DEBIT NOTES CLAIMS

## 1. Module Overview
- **Purpose**: Manages customs tax payments (*PIB Requests*) and vendor claim recoveries (*Debit Notes*).
- **Business Objective**: Provide accurate customs kasbon estimations and recover costs for vendor delays or damaged cargo.
- **When to Use**: When preparing customs declarations (PIB) or issuing commercial claims against shipping lines or suppliers.
- **Related Modules**: Import Operational, Payment Tracker.
- **Estimated Reading Time**: 10 minutes.
- **Learning Objectives**: Understand PIB kasbon submission, customs tax estimations, and the Debit Note claim lifecycle.

---

## 2. Navigation Path
```
Workspace
 ├── PIB Request (/workspace/pib-request)
 └── Finance → Debit Note (/workspace/finance/debit-note)
```

---

## 3. Screen Breakdown

### Screen 5.1: PIB Request List (`PibRequestList.jsx`)
- **Purpose**: Tracks customs duty advance payments (BM, PPN, PPH).
- **Screenshot Placeholder**: `[CANVA IMAGE PLACEHOLDER 5.1: PIB Request List View]`

### Screen 5.2: Debit Note Monitoring (`DebitNoteMonitoring.jsx`)
- **Purpose**: Tracks commercial claim recoveries against vendors.
- **Screenshot Placeholder**: `[CANVA IMAGE PLACEHOLDER 5.2: Debit Note Claims Table]`

---

## 4. Field-by-Field Explanation

| Field Name | Description | Required / Optional | Example Value | Business Rule |
| :--- | :--- | :--- | :--- | :--- |
| **AJU PIB** | 26-digit customs registration code | **Required** | `000000-000000-20260806-001234` | Unique customs identifier |
| **Kasbon Diminta** | Requested customs advance amount | **Required** | `45,000,000` | Advance payment request |
| **DN Number** | Debit Note claim tracking number | **Required** | `DN-0012-2026` | Unique claim identifier |
| **Claim Category** | Target entity for claim | **Required** | `Claim Liner/FWD` | Enum (`Supplier`, `Liner`, `Trucking`) |

---

## 5. Step-by-Step User Workflow
1. Navigate to **Workspace → PIB Request**.
2. Click **+ Buat Request PIB**, enter AJU PIB, estimated BM, PPN, PPH, and requested kasbon.
3. Click **Submit Request**. Supervisor approves request in Approval Center.

---

## 6. Common Errors & Solutions
- **Error**: "Nominal kasbon melebihi batas estimasi total pajak."
- **Solution**: Adjust `Kasbon Diminta` so it does not exceed total estimated customs taxes (BM + PPN + PPH).

---

## 7. Canva Page Layout Recommendation
- **Slide 21**: PIB Customs Request Lifecycle.
- **Slide 22**: Debit Note Claim Recovery Workflow.
- **Slide 23**: Summary & Key Rules.

---

## 8. Trainer Presentation Notes
> *"Module 5 handles customs taxes and vendor claims. Ensure AJU PIB numbers match official customs documents exactly before submitting."*

---
---

# MODULE 6: SUPERVISOR CONTROL TOWER & STAFF OPERATIONS

## 1. Module Overview
- **Purpose**: Provides department supervisors with real-time operational oversight, task reassignment, SLA bottleneck monitoring, and staff performance metrics.
- **Business Objective**: Maintain department health, prevent task overdue bottlenecks, and streamline approval workflows.
- **When to Use**: Daily operational oversight, staff task distribution, and issue resolution.
- **Related Modules**: All Import Department Modules.
- **Estimated Reading Time**: 10 minutes.

---

## 2. Navigation Path
```
Supervisor
 ├── Control Tower (/supervisor/control-tower)
 └── Staff Management (/supervisor/staff-management)
```

---

## 3. Screen Breakdown & Metrics

### Screen 6.1: Control Tower Dashboard (`ControlTower.jsx`)
- **Screenshot Placeholder**: `[CANVA IMAGE PLACEHOLDER 6.1: Supervisor Control Tower]`
- **Key Metrics Displayed**:
  - **Tugas Aktif**: Total open tasks.
  - **Overdue Tasks**: Tasks past deadline.
  - **Escalated Issues**: Issue reports requiring supervisor intervention.
  - **Staff Workload**: Task distribution per staff member.

---

## 4. Staff Performance Formula (`TaskService.js`)
$$\text{Completion Rate} = \left(\frac{\text{Selesai}}{\text{Total Assigned Tasks}}\right) \times 100\%$$

---

## 5. Canva Page Layout Recommendation
- **Slide 24**: Supervisor Control Tower Command Center.
- **Slide 25**: Task Reassignment & Escalation Workflow.
- **Slide 26**: Staff Workload & Performance Analytics.

---

## 6. Trainer Presentation Notes
> *"Supervisors use the Control Tower to identify bottlenecks early. If a staff member has overdue tasks, the supervisor can reassign them with a single click."*

---
---

# MODULE 7: MANAGER EXECUTIVE DASHBOARD & REPORTS

## 1. Module Overview
- **Purpose**: Provides executive management with high-level corporate analytics, cost breakdowns by category, department health scores, and financial settlement KPIs.
- **Business Objective**: Deliver strategic business intelligence and financial clarity without requiring manual spreadsheet compilation.
- **When to Use**: Executive reviews, monthly financial audits, and department performance evaluation.
- **Estimated Reading Time**: 10 minutes.

---

## 2. Navigation Path
```
Manager
 ├── Dashboard (/manager/dashboard)
 └── Import Reports (/manager/reports)
```

---

## 3. Screen Breakdown & Executive Widgets

### Screen 7.1: Manager Dashboard (`ManagerHome.jsx`)
- **Screenshot Placeholder**: `[CANVA IMAGE PLACEHOLDER 7.1: Manager Executive Dashboard]`
- **Widgets Displayed**:
  - **Financial Settlement KPI**: Total Invoiced vs Paid vs Outstanding.
  - **Cost Breakdown Donut Chart**: Cost categories (Trucking, Freight, PIB, Depo, Lolo).
  - **Department Health Card**: Health score (0 - 100) and status (`Sangat Baik`, `Perlu Perhatian`, `Kritis`).
  - **SLA Analytics**: On-time vs delayed shipment performance.

---

## 4. Department Health Formula (`TaskService.js`)
$$\text{Health Score} = \max\left(0, 100 - \left(\frac{\text{Overdue Tasks}}{\text{Total Tasks}} \times 100\right)\right)$$

---

## 5. Canva Page Layout Recommendation
- **Slide 27**: Executive Overview & Financial Settlement KPIs.
- **Slide 28**: Cost Category Breakdown & Donut Chart.
- **Slide 29**: Department Health Score & SLA Analytics.

---

## 6. Trainer Presentation Notes
> *"The Manager Dashboard synthesizes data from across the entire ERP. The Department Health score reflects real task deadlines, giving executives an instant health check."*

---
---

# MODULE 8: MASTER DATA MANAGEMENT

## 1. Module Overview
- **Purpose**: Centralized management of core reference data including Vendors (Suppliers, Forwarders, Trucking), System Users, and Master Documents.
- **Business Objective**: Maintain a Single Source of Truth for all dropdowns, vendor SLAs, and access control across the ERP.
- **When to Use**: When onboarding a new vendor, hiring a new employee, or updating bank account details for payments.
- **Related Modules**: Payment Tracker, Debit Note Monitoring, System Access.
- **Estimated Reading Time**: 5 minutes.

---

## 2. Navigation Path
```
Workspace
 └── Master Data (/master-data)
      ├── Master Data Vendor
      ├── Master Data User
      └── Master Data Dokumen
```

---

## 3. Screen Breakdown

### Screen 8.1: Master Data Vendor (`MasterVendor.jsx`)
- **Screen Name**: Vendor Management
- **Purpose**: Add and edit vendor details, including banking information and categories.
- **Screenshot Placeholder**: `[CANVA IMAGE PLACEHOLDER 8.1: Vendor Management Table]`
- **Components Displayed**:
  - Filter by Category (Supplier, Forwarder, Trucking, Pelayaran, Asuransi).
  - Data Table: Code, Name, Category, Bank Details, Status.
  - Action buttons: Add Vendor, Edit, Delete.

---

## 4. Field-by-Field Explanation

| Field Name | Description | Required / Optional | Validation Rules | Business Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Vendor Code** | Unique identifier | **Required** | `VND-001` format | Used in SLA tracking |
| **Vendor Name** | Legal entity name | **Required** | Cannot be blank | Displayed in Payment Tracker |
| **Kategori** | Vendor type | **Required** | Must be valid enum | Determines where vendor appears |
| **Bank Account** | Payment details | Optional | Numeric | Crucial for Financial Settlement |

---

## 5. Step-by-Step User Workflow
1. Navigate to **Master Data → Master Data Vendor**.
2. Click **+ Tambah Vendor**.
3. Fill in the Vendor Code, Name, Category, and Banking Details.
4. Click **Simpan**. The vendor immediately becomes available in the Payment Tracker dropdowns.

---

## 6. Actual Business Rules
- **No Hard Deletes**: If a vendor has been used in a Job Order, they cannot be deleted. Their status must be set to `Inactive` instead.

---

## 7. Canva Page Layout Recommendation
- **Slide 30**: Master Data Management Overview.
- **Slide 31**: Vendor Entry & Business Rules.

---
---

# MODULE 9: TASK MANAGEMENT & DOCUMENT MONITORING

## 1. Module Overview
- **Purpose**: Tracks individual staff daily tasks and monitors the lifecycle of physical and digital import documents.
- **Business Objective**: Ensure no operational deadline is missed and prevent delays caused by missing original documents.
- **When to Use**: Daily routine for all Staff Dept users to check assigned work and confirm document receipts.
- **Related Modules**: Supervisor Control Tower, Import Operational.
- **Estimated Reading Time**: 8 minutes.

---

## 2. Navigation Path
```
Workspace
 ├── Peta Tugas (/workspace/peta-tugas)
 └── Dokumen Monitoring (/workspace/dokumen-monitoring)
```

---

## 3. Screen Breakdown

### Screen 9.1: Peta Tugas (Task Board)
- **Screenshot Placeholder**: `[CANVA IMAGE PLACEHOLDER 9.1: Kanban Task Board]`
- **Components**:
  - Kanban columns: `To Do`, `In Progress`, `Done`, `Overdue`.
  - Task Cards displaying deadline, assigned user, and priority.

### Screen 9.2: Dokumen Monitoring
- **Screenshot Placeholder**: `[CANVA IMAGE PLACEHOLDER 9.2: Document Stage Table]`
- **Components**:
  - Table showing Document Name, Shipment UN, and three confirmation columns: `Draft`, `Scan Received`, `Original Received`.

---

## 4. Field-by-Field Explanation

| Field Name | Description | Required / Optional | Business Rule |
| :--- | :--- | :--- | :--- |
| **Deadline** | Task due date | **Required** | Determines Overdue KPI for Supervisor |
| **Confirm Scan** | Checkbox for digital receipt | **Required** | Logs timestamp and User ID in audit trail |
| **Confirm Original**| Checkbox for physical receipt | **Required** | Completes the document lifecycle |

---

## 5. Step-by-Step User Workflow
1. Navigate to **Workspace → Peta Tugas**.
2. Drag a task from `To Do` to `In Progress`.
3. Complete the physical work (e.g., receive a document from courier).
4. Navigate to **Dokumen Monitoring**.
5. Click **Confirm Original** on the respective document row. The system logs your ID and the exact time of receipt.

---

## 6. Actual Business Rules
- **Document Audit Trail**: Confirming a document inserts an immutable log in the `dokumen_monitoring_riwayat` table.
- **Overdue Penalty**: Tasks not marked `Done` past their deadline immediately lower the Department Health Score on the Manager Dashboard.

---

## 7. Canva Page Layout Recommendation
- **Slide 32**: Peta Tugas (Task Management) Kanban View.
- **Slide 33**: Document Monitoring & Confirmation Workflow.

---
---

# MODULE 10: REPORTING & COMMUNICATION

## 1. Module Overview
- **Purpose**: Facilitates formal cross-departmental communication, weekly progress reports, and problem escalation.
- **Business Objective**: Replace scattered WhatsApp messages with centralized, auditable problem reports.
- **When to Use**: When escalating a blocked shipment or submitting end-of-week summaries.
- **Related Modules**: Supervisor Control Tower.
- **Estimated Reading Time**: 5 minutes.

---

## 2. Navigation Path
```
Workspace
 └── Reports (/reports)
```

---

## 3. Step-by-Step User Workflow
1. Navigate to **Reports**.
2. Click **+ Buat Laporan**. Select type `Problem Report`.
3. Fill in the title and description of the operational block.
4. Click **Simpan**. The report is instantly visible to Supervisors.
5. Supervisors can click **Tanggapi** to provide official directives, which are logged chronologically.

---

## 4. Canva Page Layout Recommendation
- **Slide 34**: Problem Reporting & Escalation Workflow.

---
---

# MODULE 11: SYSTEM ACCESS & SECURITY

## 1. Module Overview
- **Purpose**: Manages user authentication, role-based access control (RBAC), and session security.
- **Business Objective**: Protect sensitive financial and operational data from unauthorized access.

---

## 2. Business Rules & Roles
1. **Staff Dept**: Can only view and edit operational data within their own department. Cannot approve financial requests.
2. **Supervisor**: Can approve financial requests and view control tower analytics for their department only.
3. **Manager**: Full read-only access to global dashboards and approval authority for high-value requests.

---

## 3. Canva Page Layout Recommendation
- **Slide 35**: User Roles & Authorization Matrix.

---
---

# APPENDIX: SYSTEM TROUBLESHOOTING & CANVA DECK CHECKLIST

## 1. Complete System Troubleshooting Matrix

| Symptom / Error | Cause | Solution |
| :--- | :--- | :--- |
| **HTTP 409 Conflict: Version Mismatch** | Concurrency conflict in `MtbService`. | Refresh page and re-apply edit. |
| **"Job Order is not fully paid"** | Attempting to assign unpaid JO to MTB. | Fully pay invoice in Payment Tracker first. |
| **Stage stuck at "Shipment Active"** | Vessel ATA date not entered. | Enter ATA date in Shipment Detail View. |
| **HTTP 401 Unauthorized** | Expired JWT bearer token. | Log out and log back in. |
| **"Akses Ditolak" (Access Denied)** | Insufficient Role privileges. | Request Supervisor or Manager to perform the action. |

---

## 2. Final Canva Presentation Deck Page Matrix (37 Slides)

- **Slide 1**: Title Cover (KOMPAS EXIM ERP Import Department Guidebook)
- **Slide 2**: System Executive Overview & Objectives
- **Slide 3**: Global System Navigation Map
- **Slides 4–8**: Module 1 (Import Operational & Container Logistics)
- **Slides 9–12**: Module 2 (Financial Commitment & Request Ledger)
- **Slides 13–16**: Module 3 (Payment Tracker & Job Orders)
- **Slides 17–20**: Module 4 (Realisasi Dana MTB Petty Cash Realization)
- **Slides 21–23**: Module 5 (PIB Customs & Debit Notes Claims)
- **Slides 24–26**: Module 6 (Supervisor Control Tower & Staff Operations)
- **Slides 27–29**: Module 7 (Manager Executive Dashboard & Analytics)
- **Slides 30–31**: Module 8 (Master Data Management)
- **Slides 32–33**: Module 9 (Task & Document Monitoring)
- **Slide 34**: Module 10 (Reporting & Communication)
- **Slide 35**: Module 11 (System Access & Security Roles)
- **Slide 36**: Troubleshooting & Self-Healing Matrix
- **Slide 37**: Q&A, Certification & Training Sign-off
