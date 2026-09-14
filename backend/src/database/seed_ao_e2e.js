const db = require('./db');

try {
  console.log('Seeding AO Kanban tasks for E2E...');
  
  db.transaction(() => {
    let job = db.prepare('SELECT id FROM export_jobs WHERE invoice_no = ?').get('INV-E2E-001');
    if (!job) {
      const result = db.prepare(`
        INSERT INTO export_jobs (job_code, business_key, invoice_no, buyer, destination, ae_status, ao_status, ao_assignee_id)
        VALUES ('E2E-JOB-001', 'BK-E2E-001', 'INV-E2E-001', 'PT Buyer E2E', 'Singapore', 'Completed', 'Assigned', 105)
      `).run();
      job = { id: result.lastInsertRowid };
    }

    // Insert Task 1 (WAITING -> Akan Dikerjakan)
    db.prepare(`
      INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date)
      VALUES (?, 'DOC', 'E2E Task Waiting', 'Task for drag and drop test', 105, 'WAITING', 'NORMAL', date('now', '+2 days'))
    `).run(job.id);

    // Insert Task 2 (IN_PROGRESS -> Dalam Proses)
    db.prepare(`
      INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date)
      VALUES (?, 'DOC', 'E2E Task In Progress', 'Task that is already in progress', 105, 'IN_PROGRESS', 'HIGH', date('now', '+1 days'))
    `).run(job.id);

    // Insert Task 3 (Unauthorized task - belongs to another AO user)
    // EXIM-AO-02 ID is 106
    db.prepare(`
      INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date)
      VALUES (?, 'DOC', 'E2E Unauthorized Task', 'Task belonging to someone else', 106, 'WAITING', 'CRITICAL', date('now', '+3 days'))
    `).run(job.id);
  })();

  console.log('Successfully seeded AO tasks.');
} catch (error) {
  console.error('Failed to seed AO tasks:', error);
}
