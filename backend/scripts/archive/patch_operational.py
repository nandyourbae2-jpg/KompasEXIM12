import sys
with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

patch = """
/**
 * PATCH /api/v2/ae/jobs/:id/operational-data
 * Update operational fields (BL, CC, COO FORM, QC ATTEND)
 */
router.patch('/jobs/:id/operational-data', (req, res, next) => {
  try {
    const { id } = req.params;
    const { bl_mbl, cc_non_cc, coo_form, qc_attend } = req.body;

    if (req.user.level_otoritas === 'Staff Dept') {
      const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
      if (!job || job.ae_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    db.prepare(`
      UPDATE export_jobs 
      SET bl_mbl = coalesce(?, bl_mbl),
          cc_non_cc = coalesce(?, cc_non_cc),
          coo_form = coalesce(?, coo_form),
          qc_attend = coalesce(?, qc_attend)
      WHERE id = ?
    `).run(bl_mbl, cc_non_cc, coo_form, qc_attend, id);
    
    db.prepare(`INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details) VALUES (?, ?, 'OPERATIONAL_DATA_UPDATED', 'EXPORT_JOB', ?)`).run(id, req.user.id, JSON.stringify({ bl_mbl, cc_non_cc, coo_form, qc_attend }));

    const updatedJob = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);
    return require('../../utils/ApiResponse').send(req, res, updatedJob);
  } catch (error) {
    next(error);
  }
});
"""

if patch not in content:
    content = content.replace('module.exports = router;', patch + '\nmodule.exports = router;')
    with open('src/routes/v2/aeRoutes.js', 'w') as f:
        f.write(content)
