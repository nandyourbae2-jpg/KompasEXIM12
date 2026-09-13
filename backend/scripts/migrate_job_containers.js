const db = require('../src/database/db');

console.log('Running migration...');

db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_containers (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      export_job_id  INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
      no_container   TEXT NOT NULL,
      no_booking     TEXT,
      source_row     INTEGER,
      created_at     TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_job_containers_job ON job_containers(export_job_id);

    CREATE TABLE IF NOT EXISTS system_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_by INTEGER REFERENCES users(id),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
})();

console.log('Migration successful.');
