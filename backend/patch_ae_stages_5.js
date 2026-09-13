const db = require('./src/database/db');

console.log('Running patch for new AE document stages: Prep, Soft, Final, Draft, Original...');

const docsToUpdate = ['DO Internal', 'DO Liner', 'Data Forwarder', 'Data Loading', 'PI', 'Shipping Instruction (if any)', 'L/C (if any)'];
const newActivities = ['Prep', 'Soft', 'Final', 'Draft', 'Original'];

try {
  db.transaction(() => {
    // 1. Get the items
    const items = db.prepare(`SELECT id, nama_item, group_id FROM checklist_items WHERE nama_item IN (${docsToUpdate.map(d => `'${d}'`).join(',')})`).all();
    
    for (const item of items) {
      console.log(`Patching item ${item.nama_item} (id: ${item.id}, group_id: ${item.group_id})`);
      
      // We insert new activities to checklist_activities for the group_id (if they don't already exist)
      const activityIds = [];
      let seq = 1;
      for (const actName of newActivities) {
        // Find if the activity already exists for this group
        let act = db.prepare(`SELECT id FROM checklist_activities WHERE group_id = ? AND nama_aktivitas = ?`).get(item.group_id, actName);
        if (!act) {
          const info = db.prepare(`INSERT INTO checklist_activities (group_id, nama_aktivitas, urutan) VALUES (?, ?, ?)`).run(item.group_id, actName, seq);
          act = { id: info.lastInsertRowid };
        }
        activityIds.push(act.id);
        seq++;
      }
      
      // Delete OLD rules for this item
      db.prepare(`
        DELETE FROM checklist_item_activity_rules 
        WHERE item_id = ? AND activity_id IN (
          SELECT id FROM checklist_activities WHERE nama_aktivitas IN ('Preparation', 'Review', 'Final / Original')
        )
      `).run(item.id);

      // Insert NEW rules
      for (const actId of activityIds) {
        const ruleExists = db.prepare(`SELECT id FROM checklist_item_activity_rules WHERE item_id = ? AND activity_id = ?`).get(item.id, actId);
        if (!ruleExists) {
          db.prepare(`INSERT INTO checklist_item_activity_rules (item_id, activity_id, berlaku) VALUES (?, ?, 1)`).run(item.id, actId);
        }
      }
      
      // Also, update the active job's history (ae_job_document_activities) for these docs so timeline matches
      // But they are recorded by job_document_version_id
      // Let's just wipe out pending activities for these docs and recreate them
      const docVer = db.prepare(`
        SELECT v.id FROM ae_job_document_versions v
        JOIN ae_job_documents d ON v.job_document_id = d.id
        WHERE d.document_name = ?
        ORDER BY v.id DESC LIMIT 1
      `).get(item.nama_item.toUpperCase().replace(' (IF ANY)', ''));

      if (docVer) {
        db.prepare(`DELETE FROM ae_job_document_activities WHERE job_document_version_id = ? AND status = 'PENDING'`).run(docVer.id);
        
        let vSeq = 1;
        for (const actName of newActivities) {
          // Check if a completed one exists
          const exists = db.prepare(`SELECT id FROM ae_job_document_activities WHERE job_document_version_id = ? AND activity_name = ?`).get(docVer.id, actName);
          if (!exists) {
            db.prepare(`
              INSERT INTO ae_job_document_activities (job_document_version_id, activity_name, sequence_order, status)
              VALUES (?, ?, ?, 'PENDING')
            `).run(docVer.id, actName, vSeq);
          }
          vSeq++;
        }
      }
    }
  })();
  console.log("Legacy checklist patched with 5 stages!");
} catch(e) {
  console.error(e);
}
