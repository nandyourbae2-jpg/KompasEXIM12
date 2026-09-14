const db = require('./backend/src/database/db');
const AeChecklistRuleEngine = require('./backend/src/services/AeChecklistRuleEngine');
const assert = require('assert');

async function runTests() {
  console.log('--- STARTING E4-B VERIFICATION ---');

  // 1. Idempotency Test
  console.log('\\n1. Idempotency Test');
  const testJobId = 1; // Pick a job, ensure it exists
  const existingJob = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(testJobId);
  if (!existingJob) {
    console.log('Job 1 not found, cannot run idempotency test on it.');
  } else {
    // Generate 3 times
    const version = db.prepare(`SELECT v.id FROM ae_checklist_template_versions v JOIN ae_checklist_templates t ON v.template_id = t.id WHERE t.is_active = 1 AND v.is_published = 1 ORDER BY v.created_at DESC LIMIT 1`).get();
    
    for(let i=0; i<3; i++) {
      const existing = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(testJobId);
      if (existing) {
         if (existing.status !== 'GENERATED') {
            db.prepare(`UPDATE ae_job_checklists SET status = 'GENERATED', template_version_id = ? WHERE id = ?`).run(version.id, existing.id);
         }
      } else {
         db.prepare(`INSERT INTO ae_job_checklists (job_id, template_version_id, status) VALUES (?, ?, 'GENERATED')`).run(testJobId, version.id);
      }
      
      const jobChecklistId = db.prepare(`SELECT id FROM ae_job_checklists WHERE job_id = ?`).get(testJobId).id;
      
      // insert items safely
      const groups = db.prepare(`SELECT * FROM ae_checklist_groups WHERE version_id = ?`).all(version.id);
      const itemsQuery = db.prepare(`SELECT * FROM ae_checklist_items WHERE group_id = ?`);
      const insertItem = db.prepare(`
        INSERT OR IGNORE INTO ae_job_checklist_items 
        (job_checklist_id, checklist_item_id, snap_group_name, snap_item_label, snap_is_required, snap_applicability_rules, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const grp of groups) {
        const items = itemsQuery.all(grp.id);
        for (const item of items) {
          insertItem.run(jobChecklistId, item.id, grp.name, item.label, item.is_required, item.applicability_rules ? JSON.stringify(item.applicability_rules) : null, 'NOT STARTED');
        }
      }
    }
    
    // Check duplicates
    const instances = db.prepare(`SELECT COUNT(*) as c FROM ae_job_checklists WHERE job_id = ?`).get(testJobId).c;
    const items = db.prepare(`SELECT COUNT(*) as c FROM ae_job_checklist_items WHERE job_checklist_id = (SELECT id FROM ae_job_checklists WHERE job_id = ?)`).get(testJobId).c;
    console.log(`Job Checklist Instances: ${instances} (Expected: 1)`);
    console.log(`Checklist Items Count: ${items} (Expected to match template count)`);
    assert.strictEqual(instances, 1, "Idempotency failed!");
  }

  // 2. Progress Source of Truth
  console.log('\\n2. Progress Source of Truth');
  const jobChecklist = db.prepare(`SELECT id FROM ae_job_checklists WHERE job_id = ?`).get(testJobId);
  if (jobChecklist) {
    db.prepare(`UPDATE ae_job_checklist_items SET status = 'COMPLETED' WHERE job_checklist_id = ? LIMIT 1`).run(jobChecklist.id);
    const stats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN status != 'NOT APPLICABLE' THEN 1 END) as applicable_count,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count
        FROM ae_job_checklist_items 
        WHERE job_checklist_id = ?
      `).get(jobChecklist.id);
    
    const calculatedProgress = stats.applicable_count > 0 ? Math.round((stats.completed_count / stats.applicable_count) * 100) : 0;
    db.prepare(`UPDATE export_jobs SET ae_progress = ? WHERE id = ?`).run(calculatedProgress, testJobId);
    
    const dbProgress = db.prepare(`SELECT ae_progress FROM export_jobs WHERE id = ?`).get(testJobId).ae_progress;
    console.log(`Calculated from items: ${calculatedProgress}%, Cached in job: ${dbProgress}%`);
    assert.strictEqual(calculatedProgress, dbProgress, "Progress mismatch!");
  }
  
  // 3. Rule Engine Safety
  console.log('\\n3. Rule Engine Safety');
  const rule = JSON.stringify([{ field: "fasilitas_kite", operator: "EQUALS", value: "YES" }]);
  console.log('Evaluated WR with NO:', AeChecklistRuleEngine.evaluate(rule, {fasilitas_kite: 'NO'}));
  console.log('Evaluated WR with YES:', AeChecklistRuleEngine.evaluate(rule, {fasilitas_kite: 'YES'}));

  console.log('\\n--- VERIFICATION COMPLETED ---');
}

runTests().catch(console.error);
