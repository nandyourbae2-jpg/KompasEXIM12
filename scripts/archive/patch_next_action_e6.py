import re

file_path = "backend/src/routes/v2/aeRoutes.js"
with open(file_path, "r") as f:
    content = f.read()

new_next_action = """
    // Find next checklist item
    const checklist = db.prepare(`SELECT id FROM ae_job_checklists WHERE job_id = ?`).get(id);
    let nextChecklist = null;
    if (checklist) {
      nextChecklist = db.prepare(`
          SELECT i.snap_item_label as action, i.status
          FROM ae_job_checklist_items i
          JOIN ae_checklist_items m ON i.checklist_item_id = m.id
          JOIN ae_checklist_groups g ON m.group_id = g.id
          WHERE i.job_checklist_id = ? AND i.status IN ('NOT STARTED', 'IN PROGRESS', 'WAITING')
          ORDER BY g.sort_order ASC, m.sort_order ASC
          LIMIT 1
      `).get(checklist.id);
    }

    // Find next document activity
    const nextDocAct = db.prepare(`
       SELECT a.activity_name, d.document_name
       FROM ae_job_document_activities a
       JOIN ae_job_documents d ON a.job_document_id = d.id
       WHERE d.job_id = ? AND a.status IN ('PENDING', 'IN PROGRESS')
       ORDER BY d.id ASC, a.id ASC
       LIMIT 1
    `).get(id);

    let finalAction = "None";
    if (nextDocAct) {
       finalAction = `${nextDocAct.activity_name} (${nextDocAct.document_name})`;
    } else if (nextChecklist) {
       finalAction = nextChecklist.action;
    } else {
       // If no generated checklist yet
       const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);
       if (!job.closing_docs || !job.closing_docs_time) {
          finalAction = "Awaiting Source Update";
       } else {
          finalAction = "Generate Checklist";
       }
    }

    return ApiResponse.send(req, res, { action: finalAction });
"""

content = re.sub(r'const nextItem = db\.prepare\(`[\s\S]*?`\)\.get\(checklistId\);\n[\s\S]*?return ApiResponse\.send\(req, res, \{ action: nextItem \? nextItem\.action : \'None\' \}\);', new_next_action, content)

with open(file_path, "w") as f:
    f.write(content)
print("Next Action patched.")
