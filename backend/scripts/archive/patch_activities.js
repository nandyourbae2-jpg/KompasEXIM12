const db = require('./src/database/db');
const docsToUpdate = ['DO INTERNAL', 'DO LINER', 'DATA FORWARDER', 'DATA LOADING', 'PI', 'SHIPPING INSTRUCTION', 'L/C'];

try {
  const versions = db.prepare(`
    SELECT v.id, d.document_name 
    FROM ae_job_document_versions v 
    JOIN ae_job_documents d ON v.job_document_id = d.id
  `).all();
  
  const updateStmt = db.prepare(`UPDATE ae_job_document_activities SET activity_name = ? WHERE id = ?`);
  const insertStmt = db.prepare(`INSERT INTO ae_job_document_activities (job_document_version_id, activity_name, sequence_order, status) VALUES (?, ?, ?, 'PENDING')`);
  
  db.transaction(() => {
    for (const v of versions) {
      const docName = v.document_name.toUpperCase();
      if (docsToUpdate.includes(docName)) {
        const activities = db.prepare(`SELECT * FROM ae_job_document_activities WHERE job_document_version_id = ? ORDER BY sequence_order`).all(v.id);
        
        if (activities.length === 3 && activities[0].activity_name === 'RCVD') {
          updateStmt.run('PREPARATION', activities[0].id);
          updateStmt.run('REVIEW', activities[1].id);
          updateStmt.run('FINAL / ORIGINAL', activities[2].id);
        }
      }
    }
  })();
  console.log("Migration successful!");
} catch(e) {
  console.error(e);
}
