/**
 * rebalance_ae_jobs.js
 * Script untuk mendistribusikan job unassigned ke Monica, Wenny, Ama
 * Run: node backend/src/database/seeds/rebalance_ae_jobs.js
 */

const db = require('../db');
const AeWorkflowEngine = require('../../services/AeWorkflowEngine');

const MONICA_ID = 101;
const WENNY_ID = 107;
const AMA_ID = 108;
const SPV_ID = 102;

function resolveTemplate(jobCode, productType) {
  let company = 'PBN';
  if (jobCode) {
    if (jobCode.includes('PSB')) company = 'PSB';
    else if (jobCode.includes('PSFI')) company = 'PSFI';
    else if (jobCode.includes('SAMICO')) company = 'SAMICO';
  }

  let template = null;
  if (company === 'PBN' && productType) {
    template = db.prepare(`SELECT id FROM checklist_templates WHERE company = ? AND product = ?`).get(company, productType);
  }
  if (!template) {
    template = db.prepare(`SELECT id FROM checklist_templates WHERE company = ? ORDER BY id ASC LIMIT 1`).get(company);
  }
  if (!template) template = { id: 1 };
  return template.id;
}

function run() {
  console.log('=== AE Job Rebalance & Seeding ===\n');

  const unassigned = db.prepare(
    `SELECT id, invoice_no, job_code, product_type FROM export_jobs WHERE ae_assignee_id IS NULL ORDER BY id ASC`
  ).all();

  console.log(`Found ${unassigned.length} unassigned jobs.\n`);

  const staffCycle = [MONICA_ID, WENNY_ID, AMA_ID];

  const assignStmt = db.prepare(`
    UPDATE export_jobs 
    SET ae_assignee_id = ?, ae_template_id = COALESCE(ae_template_id, ?), ae_status = 'Assigned', updated_at = datetime('now')
    WHERE id = ?
  `);

  let hasAssignmentTable = false;
  try {
    db.prepare(`SELECT 1 FROM ae_job_assignments LIMIT 1`).get();
    hasAssignmentTable = true;
  } catch(e) {}

  const tx = db.transaction(() => {
    unassigned.forEach((job, idx) => {
      const assigneeId = staffCycle[idx % 3];
      const templateId = resolveTemplate(job.job_code, job.product_type);
      assignStmt.run(assigneeId, templateId, job.id);
      if (hasAssignmentTable) {
        try {
          db.prepare(`INSERT INTO ae_job_assignments (job_id, assigned_to_user_id, assigned_by_user_id, status, remark) VALUES (?, ?, ?, 'ASSIGNED', 'Distribusi awal sistem')`).run(job.id, assigneeId, SPV_ID);
        } catch(e) {}
      }
      const name = assigneeId === MONICA_ID ? 'Monica' : (assigneeId === WENNY_ID ? 'Wenny' : 'Ama');
      console.log(`  [${idx+1}] Job ${job.id} (${job.invoice_no}) -> ${name} | Template: ${templateId}`);
    });
  });
  tx();

  console.log('\n=== Auto-generating Checklists ===\n');
  const allJobs = db.prepare(`SELECT id, ae_assignee_id FROM export_jobs WHERE ae_assignee_id IN (?, ?, ?) AND ae_status != 'Completed'`).all(MONICA_ID, WENNY_ID, AMA_ID);
  let gen = 0;
  for (const job of allJobs) {
    try {
      const existing = db.prepare(`SELECT COUNT(*) as c FROM ae_job_documents WHERE job_id = ?`).get(job.id);
      if (existing.c === 0) { AeWorkflowEngine.autoGenerateChecklist(job.id, job.ae_assignee_id); gen++; }
    } catch(e) { console.warn(`  Warning job ${job.id}: ${e.message}`); }
  }
  console.log(`  Generated checklists for ${gen} jobs.\n`);

  const dist = db.prepare(`SELECT u.nama, u.employee_id, COUNT(j.id) as cnt FROM users u LEFT JOIN export_jobs j ON j.ae_assignee_id = u.id AND j.ae_status != 'Completed' WHERE u.departemen = 'Administrasi Export' AND u.level_otoritas = 'Staff Dept' GROUP BY u.id ORDER BY u.id`).all();
  console.log('=== Final Distribution ===');
  dist.forEach(d => console.log(`  ${d.nama} (${d.employee_id}): ${d.cnt} active jobs`));
  console.log('\nDone!');
}

run();
