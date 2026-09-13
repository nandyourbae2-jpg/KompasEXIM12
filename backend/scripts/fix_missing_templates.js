const db = require('../src/database/db');
const { resolveTemplateForJob } = require('../src/services/TemplateResolver');

const jobs = db.prepare('SELECT id, invoice_no FROM export_jobs WHERE ae_assignee_id IS NOT NULL AND ae_template_id IS NULL').all();

console.log(`Found ${jobs.length} jobs with missing templates...`);

const updateStmt = db.prepare('UPDATE export_jobs SET ae_template_id = ? WHERE id = ?');

let fixedCount = 0;
for (const job of jobs) {
  try {
    const resolved = resolveTemplateForJob(job.id);
    if (resolved) {
      updateStmt.run(resolved.id, job.id);
      console.log(`- Job ${job.invoice_no} (ID: ${job.id}) updated with template ${resolved.nama_template}`);
      fixedCount++;
    } else {
      console.log(`- Job ${job.invoice_no} (ID: ${job.id}) COULD NOT BE RESOLVED`);
    }
  } catch (err) {
    console.error(`- Error resolving Job ${job.id}:`, err.message);
  }
}
console.log(`Successfully fixed ${fixedCount} jobs.`);
