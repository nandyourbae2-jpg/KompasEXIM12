# KOMPAS EXIM ERP — Logistics & ERP Glossary

This document provides definitive explanations of all technical logistics, customs clearance, financial accounting, and software architecture terms used throughout the KOMPAS EXIM ERP system and guidebook documentation.

---

## 🚚 Logistics & Shipping Terminology

### ATA (Actual Time of Arrival)
The exact date and time a vessel, aircraft, or transport carrier arrives at the destination port or port of discharge. In KOMPAS EXIM, setting ATA promotes a shipment from `Shipment Active` to `Delivery Active`.

### ATD (Actual Time of Departure)
The exact date and time a vessel departs from the port of origin.

### ETA (Estimated Time of Arrival)
The scheduled arrival date of a shipment at the destination port. Used by `ShipmentService` to measure SLA delay metrics.

### ETD (Estimated Time of Departure)
The scheduled departure date of a shipment from the origin port.

### BL / SWB / AWB (Bill of Lading / Sea Waybill / Air Waybill)
The official legal document issued by a carrier to detail the type, quantity, and destination of the goods being carried.

### CBM (Cubic Meter)
Standard metric unit of measurement for shipment volume used in sea and air freight calculations.

### FCL (Full Container Load)
A shipment container dedicated exclusively to one importer.

### LCL (Less than Container Load)
A consolidated container carrying cargo from multiple importers.

### Free Time Destination
The number of fee-free days granted by shipping lines or port terminals before demurrage or detention charges begin accruing.

### Gate Out Port
The timestamp when a container physically exits the port terminal gates onto a truck chassis.

### Gate In Warehouse
The timestamp when a container arrives and enters the destination factory or warehouse gates.

### Gate Out Warehouse
The timestamp when an empty or offloaded container exits the warehouse to be returned to the depo. In KOMPAS EXIM, all containers reaching `gate_out_wh` promotes the shipment stage to `Financial Settlement`.

---

## 🛃 Customs & Legal Terminology

### AJU PIB (Nomor Pengajuan Pemberitahuan Impor Barang)
The unique 26-digit registration number assigned by Indonesian Customs (Bea Cukai) for import declarations.

### BM (Bea Masuk)
Import Duty tariff levied on goods imported into Indonesia.

### PPN (Pajak Pertambahan Nilai)
Value-Added Tax (11%) applied to imported goods.

### PPH (Pajak Penghasilan Pasal 22 Import)
Income Tax withholding applied to import goods based on API/API-U licensing.

### HS Code (Harmonized System Code)
Standardized numerical method of classifying traded products used by customs authorities worldwide.

---

## 💰 Financial & Accounting Terminology

### Debit Note (DN)
An official commercial document issued by an importer to a supplier, liner, or vendor to claim financial recovery for damages, short-shipment, or operational overcharges.

### DPP (Dasar Pengenaan Pajak)
The tax base amount before tax (VAT/PPN) is applied.

### Job Order (JO)
An internal work and payment tracking record linked to a specific vendor invoice, specifying cost category, DPP, PPN, and payment history.

### MTB (Realisasi Dana MTB / Petty Cash Realization)
A specialized cash-realization ledger used by the import department to process cash advances, vendor expense claims, and daily operational disbursements.

### PPh 23 (Pajak Penghasilan Pasal 23)
Indonesian income tax withheld on domestic services (e.g. trucking, handling fees).

---

## 💻 ERP System Architecture Terminology

### Dual-Key Strategy
A software pattern used in KOMPAS EXIM where queries look up records using `import_shipment_id` first, falling back to legacy `shipment_un` if `import_shipment_id` is null.

### Optimistic Concurrency Control
A database locking strategy where table updates verify that the record's `version` number matches the expected version before writing, preventing race conditions without heavy table locks.

### Single Source of Truth (SSOT)
An architectural rule ensuring that a given data calculation (e.g., stage, health score, cost total) is executed in exactly one backend domain class.
