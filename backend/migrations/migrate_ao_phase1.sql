-- Migration Script for Account Officer (AO) Workspace

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    industry TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Suspended')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);

-- 2. Create ao_customer_assignments table
CREATE TABLE IF NOT EXISTS ao_customer_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    version INTEGER DEFAULT 1,
    UNIQUE(user_id, customer_id)
);

-- 3. Create invoices (Accounts Receivable) table
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    shipment_type TEXT NOT NULL CHECK(shipment_type IN ('IMPORT', 'EXPORT')),
    shipment_id INTEGER NOT NULL, -- Logical FK to either import_shipments or ae_export_shipments
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'IDR',
    due_date TEXT,
    status TEXT DEFAULT 'UNPAID' CHECK(status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);

-- 4. Alter ae_followup_records to support generic entities
ALTER TABLE ae_followup_records ADD COLUMN related_entity_type TEXT;
ALTER TABLE ae_followup_records ADD COLUMN related_entity_id INTEGER;

-- Initialize existing records to default to SHIPMENT type for backward compatibility
UPDATE ae_followup_records SET related_entity_type = 'SHIPMENT', related_entity_id = shipment_id WHERE shipment_id IS NOT NULL;

-- 5. Alter ae_discrepancies to support generic entities
ALTER TABLE ae_discrepancies ADD COLUMN related_entity_type TEXT;
ALTER TABLE ae_discrepancies ADD COLUMN related_entity_id INTEGER;

-- Initialize existing records
UPDATE ae_discrepancies SET related_entity_type = 'SHIPMENT', related_entity_id = shipment_id WHERE shipment_id IS NOT NULL;

-- 6. Indexes for new tables and generalized columns
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_followups_entity ON ae_followup_records(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_entity ON ae_discrepancies(related_entity_type, related_entity_id);
