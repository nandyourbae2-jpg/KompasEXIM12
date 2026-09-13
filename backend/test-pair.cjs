const Database = require('better-sqlite3');
const db = new Database('kompas-exim.db');

const job_id = 1;
const ao_assignee_id = 105;
const dscs_assignee_id = 115;
const remarks = "Test remarks";

try {
  db.transaction(() => {
    db.prepare(`
      UPDATE export_jobs
      SET ao_assignee_id = ?,
          dscs_assignee_id = ?,
          ao_remarks = ?,
          ao_status = 'Assigned',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(ao_assignee_id, dscs_assignee_id || null, remarks || null, job_id);

    db.prepare(`
      UPDATE ao_tasks
      SET assigned_to = ?, updated_at = datetime('now')
      WHERE job_id = ? AND workstream != 'DSCS' AND (assigned_to IS NULL OR assigned_to = 0)
    `).run(ao_assignee_id, job_id);

    if (dscs_assignee_id) {
      const dscsTask = db.prepare("SELECT id FROM ao_tasks WHERE job_id = ? AND workstream = 'DSCS'").get(job_id);
      if (dscsTask) {
        db.prepare("UPDATE ao_tasks SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?").run(dscs_assignee_id, dscsTask.id);
      } else {
        db.prepare(`
          INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority)
          VALUES (?, 'DSCS', 'Penerbitan Dokumen', 'Pengecekan kesesuaian data tangkap nelayan', ?, 'PENDING', 'NORMAL')
        `).run(job_id, dscs_assignee_id);
      }
      db.prepare("INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)").run(job_id);
    } else {
      db.prepare("DELETE FROM ao_tasks WHERE job_id = ? AND workstream = 'DSCS' AND status = 'PENDING'").run(job_id);
    }

    db.prepare(`
      UPDATE handover_events
      SET receiver_id = ?
      WHERE export_job_id = ? AND (receiver_id IS NULL) AND (status = 'PENDING' OR status IS NULL)
    `).run(ao_assignee_id, job_id);
  })();
  console.log("SUCCESS");
} catch (e) {
  console.error("TRANSACTION ERROR:", e);
}
