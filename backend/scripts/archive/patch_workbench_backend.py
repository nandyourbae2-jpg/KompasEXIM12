import sys

with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

# Replace GET /jobs/:id/workbench logic
old_fetch = """
    // Fetch Documents & Activities (from ae_job_checklists mapping for now)
    const checklist = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(job.id);
    let items = [];
    if (checklist) {
       items = db.prepare(`
         SELECT i.*, g.name as stage_name, m.label as document_name
         FROM ae_job_checklist_items i
         JOIN ae_checklist_items m ON i.checklist_item_id = m.id
         JOIN ae_checklist_groups g ON m.group_id = g.id
         WHERE i.job_checklist_id = ?
         ORDER BY g.sort_order ASC, m.sort_order ASC
       `).all(checklist.id);
    }
"""

new_fetch = """
    // Auto Generate if missing
    let checklist = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(job.id);
    if (!checklist || checklist.status === 'PENDING CONFIGURATION') {
       AeWorkflowEngine.autoGenerateChecklist(job.id, req.user.id);
       checklist = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(job.id);
    }

    let items = [];
    if (checklist && checklist.status === 'GENERATED') {
       items = db.prepare(`
         SELECT i.*, g.name as stage_name, m.label as document_name, m.action_type
         FROM ae_job_checklist_items i
         JOIN ae_checklist_items m ON i.checklist_item_id = m.id
         JOIN ae_checklist_groups g ON m.group_id = g.id
         WHERE i.job_checklist_id = ?
         ORDER BY g.sort_order ASC, m.sort_order ASC
       `).all(checklist.id);
    }
"""

content = content.replace(old_fetch, new_fetch)

with open('src/routes/v2/aeRoutes.js', 'w') as f:
    f.write(content)
