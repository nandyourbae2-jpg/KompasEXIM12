import sys
import re

with open('backend/src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

# We need to replace the router.get('/jobs/:id/workbench') implementation.
start_str = "router.get('/jobs/:id/workbench', (req, res, next) => {"
end_str = "router.post('/jobs/:id/actions/:actionId/execute', requireRole(['Staff Dept']), (req, res, next) => {"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

new_workbench = """router.get('/jobs/:id/workbench', (req, res, next) => {
  try {
    const { id } = req.params;
    
    const job = db.prepare(`SELECT e.*, u.nama as ae_assignee_name FROM export_jobs e LEFT JOIN users u ON e.ae_assignee_id = u.id WHERE e.id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, code: 404, message: 'Job not found' });

    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, code: 403, message: 'Not authorized' });
    }

    // Ensure generated
    AeWorkflowEngine.autoGenerateChecklist(job.id, req.user.id);
    
    const context = AeWorkflowEngine.getJobContext(job.id);
    
    const items = db.prepare(`
        SELECT 
            j.id, j.completed_at, j.catatan, j.evidence_payload,
            i.nama_item as document_name, 
            a.nama_aktivitas as activity_name, 
            g.nama_group as stage_name
        FROM job_checklist_items j
        JOIN checklist_items i ON j.item_id = i.id
        JOIN checklist_activities a ON j.activity_id = a.id
        JOIN checklist_groups g ON i.group_id = g.id
        WHERE j.export_job_id = ?
        ORDER BY g.urutan ASC, i.urutan ASC, a.urutan ASC
    `).all(job.id);

    // Reconstruct nested object: workbench[stageName][documentName] = { activities: [] }
    const workbench = {};
    for (const item of items) {
       if (!workbench[item.stage_name]) workbench[item.stage_name] = {};
       if (!workbench[item.stage_name][item.document_name]) {
           workbench[item.stage_name][item.document_name] = { activities: [] };
       }
       
       let status = 'PENDING';
       if (item.completed_at) status = 'COMPLETED';

       workbench[item.stage_name][item.document_name].activities.push({
           id: item.id,
           activity_name: item.activity_name,
           status: status,
           action: item.activity_name
       });
    }

    const blockers = db.prepare(`SELECT * FROM ae_job_blockers WHERE job_id = ? ORDER BY opened_at DESC`).all(job.id);

    res.json({
      success: true,
      data: {
        job: { ...job, ...context },
        workbench,
        blockers
      }
    });
  } catch (err) {
    next(err);
  }
});\n\n"""

content = content[:start_idx] + new_workbench + content[end_idx:]

with open('backend/src/routes/v2/aeRoutes.js', 'w') as f:
    f.write(content)
print("Rewritten /workbench route.")
