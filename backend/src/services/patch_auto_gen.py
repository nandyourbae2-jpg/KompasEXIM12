import sys

with open('AeWorkflowEngine.js', 'r') as f:
    content = f.read()

old_gen = """
    const transaction = db.transaction(() => {
      let jobChecklistId;
      const existing = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(jobId);
      
      if (existing) {
        if (existing.status === 'GENERATED') return existing.id; // Idempotent
        db.prepare(`UPDATE ae_job_checklists SET status = 'GENERATED', template_version_id = ? WHERE id = ?`).run(version.id, existing.id);
        jobChecklistId = existing.id;
      } else {
        const result = db.prepare(`
          INSERT INTO ae_job_checklists (job_id, template_version_id, status)
          VALUES (?, ?, 'GENERATED')
        `).run(jobId, version.id);
        jobChecklistId = result.lastInsertRowid;
      }

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
          const isApplicable = AeChecklistRuleEngine.evaluate(item.applicability_rules, job);
          const status = isApplicable ? 'NOT STARTED' : 'NOT APPLICABLE';
          
          insertItem.run(
            jobChecklistId, 
            item.id, 
            grp.name, 
            item.label, 
            item.is_required, 
            item.applicability_rules ? JSON.stringify(item.applicability_rules) : null,
            status
          );
        }
      }
      return jobChecklistId;
    });
"""

new_gen = """
    const transaction = db.transaction(() => {
      let jobChecklistId;
      const existing = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(jobId);
      if (existing && existing.status === 'GENERATED') return existing.id; // Idempotent
      
      if (existing) {
        db.prepare(`UPDATE ae_job_checklists SET status = 'GENERATED', template_version_id = ? WHERE id = ?`).run(version.id, existing.id);
        jobChecklistId = existing.id;
      } else {
        const result = db.prepare(`INSERT INTO ae_job_checklists (job_id, template_version_id, status) VALUES (?, ?, 'GENERATED')`).run(jobId, version.id);
        jobChecklistId = result.lastInsertRowid;
      }

      // Group items by label to form logical documents
      const groups = db.prepare(`SELECT * FROM ae_checklist_groups WHERE version_id = ? ORDER BY sort_order ASC`).all(version.id);
      const itemsQuery = db.prepare(`SELECT * FROM ae_checklist_items WHERE group_id = ? ORDER BY sort_order ASC`);
      
      // We still map back to the checklist items for tracking legacy reasons, 
      // but primarily we populate ae_job_documents, versions, and activities
      const insertDoc = db.prepare(`INSERT OR IGNORE INTO ae_job_documents (job_id, document_name, state) VALUES (?, ?, 'MISSING')`);
      const getDoc = db.prepare(`SELECT id FROM ae_job_documents WHERE job_id = ? AND document_name = ?`);
      const insertVer = db.prepare(`INSERT OR IGNORE INTO ae_job_document_versions (logical_document_id, version_number, reason) VALUES (?, 1, 'Initial Generation')`);
      const insertAct = db.prepare(`INSERT OR IGNORE INTO ae_job_document_activities (job_document_id, activity_name, status, version) VALUES (?, ?, ?, 1)`);
      
      // Keep old checklist items synced just in case
      const insertItem = db.prepare(`
        INSERT OR IGNORE INTO ae_job_checklist_items 
        (job_checklist_id, checklist_item_id, snap_group_name, snap_item_label, snap_is_required, snap_applicability_rules, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const grp of groups) {
        const items = itemsQuery.all(grp.id);
        for (const item of items) {
          const isApplicable = AeChecklistRuleEngine.evaluate(item.applicability_rules, job);
          const actStatus = isApplicable ? 'PENDING' : 'NOT APPLICABLE';
          
          insertItem.run(
            jobChecklistId, item.id, grp.name, item.label, item.is_required, 
            item.applicability_rules ? JSON.stringify(item.applicability_rules) : null,
            isApplicable ? 'NOT STARTED' : 'NOT APPLICABLE'
          );

          // We use item.label as document_name and item.action_type + some suffix for activity name
          // Since the template design was a flat list, we assume item.label IS the document name 
          // and item.action_type (or group name) defines the activity.
          const docName = item.label;
          insertDoc.run(jobId, docName);
          const docId = getDoc.get(jobId, docName).id;
          insertVer.run(docId);
          insertAct.run(docId, grp.name + ' - ' + (item.action_type || 'OTHER'), actStatus);
        }
      }
      return jobChecklistId;
    });
"""

content = content.replace(old_gen, new_gen)

with open('AeWorkflowEngine.js', 'w') as f:
    f.write(content)
