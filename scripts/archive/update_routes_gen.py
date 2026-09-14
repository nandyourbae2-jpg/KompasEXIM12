import re

file_path = "backend/src/routes/v2/aeRoutes.js"
with open(file_path, "r") as f:
    content = f.read()

old_generate_code = """
    // Find active template version
    const version = db.prepare(`
      SELECT v.* FROM ae_checklist_template_versions v
      JOIN ae_checklist_templates t ON v.template_id = t.id
      WHERE t.is_active = 1 AND v.is_published = 1
      ORDER BY v.created_at DESC LIMIT 1
    `).get();
"""

new_generate_code = """
    // Determine which template fits the job
    const templateName = AeChecklistRuleEngine.determineTemplateName(job);
    if (!templateName) {
       // Cannot determine template
       const existing = db.prepare(`SELECT id FROM ae_job_checklists WHERE job_id = ?`).get(id);
       if (!existing) {
         db.prepare(`INSERT INTO ae_job_checklists (job_id, status) VALUES (?, 'PENDING CONFIGURATION')`).run(id);
       } else {
         db.prepare(`UPDATE ae_job_checklists SET status = 'PENDING CONFIGURATION' WHERE id = ?`).run(existing.id);
       }
       return res.status(400).json({ success: false, code: 400, message: 'Could not match job to any business template. PENDING CONFIGURATION.' });
    }

    // Find active template version for this specific template
    const version = db.prepare(`
      SELECT v.* FROM ae_checklist_template_versions v
      JOIN ae_checklist_templates t ON v.template_id = t.id
      WHERE t.is_active = 1 AND v.is_published = 1 AND t.name = ?
      ORDER BY v.created_at DESC LIMIT 1
    `).get(templateName);
"""

if old_generate_code.strip() in content:
    content = content.replace(old_generate_code.strip(), new_generate_code.strip())
    with open(file_path, "w") as f:
        f.write(content)
    print("aeRoutes.js generate logic updated.")
else:
    print("aeRoutes.js old code not found. Could not replace.")
