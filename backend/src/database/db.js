const Database = require('better-sqlite3');
const path = require('path');
const dbFile = process.env.NODE_ENV === 'test' ? 'kompas-exim-test.db' : 'kompas-exim.db';
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../', dbFile);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

try {
  db.prepare('ALTER TABLE import_shipments ADD COLUMN atd TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE users ADD COLUMN personal_notes TEXT').run();
} catch (e) {}

// AE Workboard: Job Remarks
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS ae_job_remarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      actor_id INTEGER NOT NULL,
      remark TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
} catch (e) {}

// AE Normalized Performance Indexes
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_ae_job_docs_job ON ae_job_documents(job_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_ae_job_doc_vers_doc ON ae_job_document_versions(job_document_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_ae_job_doc_acts_ver ON ae_job_document_activities(job_document_version_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_ae_job_act_res_act ON ae_job_activity_results(job_document_activity_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_ae_job_remarks_job ON ae_job_remarks(job_id)').run();
} catch (e) {}

module.exports = db;

