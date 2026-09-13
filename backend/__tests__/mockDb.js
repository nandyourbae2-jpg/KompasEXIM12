const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

if (!global.__TEST_DB__) {
  global.__TEST_DB__ = new Database(':memory:');
  global.__TEST_DB__.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(
    path.join(__dirname, '../src/database/schema.sql'), 'utf8'
  );
  global.__TEST_DB__.exec(schema);

  const migrations = [
    'phase7_handover.sql',
    'phase8_ae_workbench.sql',
    'phase9_ae_checklist_new.sql',
    'phase11_ae_complete_readiness.sql'
  ];

  for (const m of migrations) {
    try {
      const sql = fs.readFileSync(path.join(__dirname, '../src/database/migrations', m), 'utf8');
      global.__TEST_DB__.exec(sql);
    } catch (e) {
      console.error('Error applying test migration ' + m, e.message);
    }
  }

  // Ensure remarks table exists
  try {
    global.__TEST_DB__.prepare(`
      CREATE TABLE IF NOT EXISTS ae_job_remarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        actor_id INTEGER NOT NULL,
        remark TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
  } catch (e) {}
}

module.exports = global.__TEST_DB__;
