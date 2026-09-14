import sys

with open('AeWorkflowEngine.js', 'r') as f:
    content = f.read()

generate_func = """
  static async autoGenerateChecklist(jobId, userId) {
    const AeChecklistRuleEngine = require('./AeChecklistRuleEngine');
    const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(jobId);
    if (!job) return null;

    const templateName = AeChecklistRuleEngine.determineTemplateName(job);
    if (!templateName) {
       const existing = db.prepare(`SELECT id FROM ae_job_checklists WHERE job_id = ?`).get(jobId);
       if (!existing) {
         db.prepare(`INSERT INTO ae_job_checklists (job_id, status) VALUES (?, 'PENDING CONFIGURATION')`).run(jobId);
       } else {
         db.prepare(`UPDATE ae_job_checklists SET status = 'PENDING CONFIGURATION' WHERE id = ?`).run(existing.id);
       }
       return null;
    }

    const version = db.prepare(`
      SELECT v.* FROM ae_checklist_template_versions v
      JOIN ae_checklist_templates t ON v.template_id = t.id
      WHERE t.is_active = 1 AND v.is_published = 1 AND t.name = ?
      ORDER BY v.created_at DESC LIMIT 1
    `).get(templateName);

    if (!version) return null;

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

    const finalId = transaction();
    
    // Audit
    if (userId) {
      try {
        db.prepare(`INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, 'GENERATE_CHECKLIST', 'EXPORT_JOB', ?, 'Checklist auto-generated based on source template', ?)`).run(userId, jobId, templateName);
      } catch (e) {}
    }
    return finalId;
  }
"""

content = content.replace("class AeWorkflowEngine {", "class AeWorkflowEngine {" + generate_func)

with open('AeWorkflowEngine.js', 'w') as f:
    f.write(content)
