const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../kompas-exim.db'));

console.log('Starting AE Architecture Refactoring Migration...');

try {
  db.transaction(() => {
    // 1. Add reference_id to tasks table
    try {
      db.prepare('ALTER TABLE tasks ADD COLUMN reference_id TEXT;').run();
      console.log('Added reference_id to tasks table.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('reference_id column already exists in tasks table.');
      } else {
        throw e;
      }
    }

    // Since SQLite has limited ALTER TABLE support, we need to recreate the AE tables to update their foreign keys.
    // Let's drop them and recreate them, pointing to tasks(id) instead of ae_admin_records(id).

    console.log('Dropping existing AE tables...');
    db.prepare('DROP TABLE IF EXISTS ae_audit_logs;').run();
    db.prepare('DROP TABLE IF EXISTS ae_executive_directives;').run();
    db.prepare('DROP TABLE IF EXISTS ae_followup_records;').run();
    db.prepare('DROP TABLE IF EXISTS ae_discrepancies;').run();
    db.prepare('DROP TABLE IF EXISTS ae_document_versions;').run();
    db.prepare('DROP TABLE IF EXISTS ae_document_checklists;').run();
    db.prepare('DROP TABLE IF EXISTS ae_admin_records;').run();

    console.log('Recreating AE tables pointing to tasks table...');

    // ae_document_checklists points to tasks
    db.prepare(`
      CREATE TABLE ae_document_checklists (
        id TEXT PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        doc_type TEXT NOT NULL,
        is_mandatory INTEGER NOT NULL DEFAULT 1,
        verification_status TEXT NOT NULL DEFAULT 'Not Submitted' CHECK(verification_status IN ('Not Submitted', 'Submitted', 'Under Review', 'Verified', 'Rejected', 'Revision Required', 'Missing')),
        verified_by_id TEXT REFERENCES users(id),
        verified_at TEXT,
        remarks TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    db.prepare(`
      CREATE TABLE ae_document_versions (
        id TEXT PRIMARY KEY,
        ae_document_checklist_id TEXT REFERENCES ae_document_checklists(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        file_hash TEXT,
        uploaded_by_id TEXT REFERENCES users(id),
        uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    db.prepare(`
      CREATE TABLE ae_discrepancies (
        id TEXT PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        document_type TEXT,
        discrepancy_category TEXT NOT NULL,
        severity_level TEXT NOT NULL CHECK(severity_level IN ('Critical', 'High', 'Medium', 'Low')),
        description TEXT NOT NULL,
        reported_by_id TEXT REFERENCES users(id),
        reported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        target_resolution_date TEXT,
        resolution_status TEXT NOT NULL DEFAULT 'Open' CHECK(resolution_status IN ('Open', 'Investigating', 'Action Required', 'Waiting', 'Resolved', 'Closed')),
        resolved_by_id TEXT REFERENCES users(id),
        resolved_at TEXT,
        resolution_notes TEXT,
        is_escalated INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    db.prepare(`
      CREATE TABLE ae_followup_records (
        id TEXT PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        followup_type TEXT NOT NULL,
        target_party TEXT NOT NULL,
        pic_name TEXT,
        contact_date TEXT,
        due_date TEXT,
        status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'Waiting Response', 'Follow-Up Required', 'Responded', 'Resolved', 'Escalated', 'Closed')),
        priority TEXT NOT NULL DEFAULT 'Medium',
        last_response TEXT,
        notes TEXT,
        created_by_id TEXT REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    db.prepare(`
      CREATE TABLE ae_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id),
        action TEXT NOT NULL,
        payload JSON,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    console.log('Creating indices...');
    db.prepare('CREATE INDEX idx_ae_checklist_task ON ae_document_checklists(task_id);').run();
    db.prepare('CREATE INDEX idx_ae_discrepancy_task ON ae_discrepancies(task_id);').run();
    db.prepare('CREATE INDEX idx_ae_followup_task ON ae_followup_records(task_id);').run();
    db.prepare('CREATE INDEX idx_tasks_reference_id ON tasks(reference_id);').run();

  })();
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
}
