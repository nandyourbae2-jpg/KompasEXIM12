const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const router = express.Router();
const db = require('../../database/db');
const { requireRole } = require('../../middleware/auth');
const { resolveTemplateForJob } = require('../../services/TemplateResolver');

// Middleware to ensure user is Supervisor for AE
const requireAeSupervisor = requireRole(['Supervisor', 'Manager']);

router.use(authenticateToken);

// GET /unassigned
router.get('/unassigned', requireAeSupervisor, (req, res, next) => {
  try {
    const jobs = db.prepare(`
      SELECT * FROM export_jobs
      WHERE ae_assignee_id IS NULL
      ORDER BY id DESC
    `).all();

    // Map through jobs and attempt to resolve templates
    const enrichedJobs = jobs.map(job => {
      let templateName = null;
      let templateId = null;
      
      try {
        const resolved = resolveTemplateForJob(job.id);
        if (resolved) {
          templateName = resolved.nama_template;
          templateId = resolved.id;
        }
      } catch (err) {
        // Ignore resolution errors for now, just means it's unresolved
      }

      return {
        id: job.id,
        invoice_number: job.invoice_no,
        buyer: job.buyer,
        template_name: templateName,
        template_id: templateId
      };
    });

    res.json({ success: true, data: enrichedJobs });
  } catch (error) {
    next(error);
  }
});

// GET /staff-workload
router.get('/staff-workload', requireAeSupervisor, (req, res, next) => {
  try {
    const staff = db.prepare(`
      SELECT u.id, u.nama, u.departemen,
             (SELECT count(*) FROM export_jobs e WHERE e.ae_assignee_id = u.id AND e.ae_status NOT IN ('Completed', 'Cancelled')) as active_jobs
      FROM users u
      WHERE u.departemen = 'Administrasi Export' AND u.level_otoritas IN ('Staff', 'AE Staff', 'Staff Dept') AND u.status_aktif = 1
    `).all();

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
});

// POST /assign
router.post('/assign', requireAeSupervisor, (req, res, next) => {
  try {
    const { export_job_id, staff_id, reason } = req.body;
    
    if (!export_job_id || !staff_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const job = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(export_job_id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    // Resolve template dynamically if not already assigned
    let resolvedTemplateId = job.ae_template_id;
    if (!resolvedTemplateId) {
        const resolved = resolveTemplateForJob(job.id);
        if (!resolved) {
            return res.status(400).json({ success: false, message: 'Cannot assign job without a resolved template. Please review data.' });
        }
        resolvedTemplateId = resolved.id;
    }

    const previousOwnerId = job.ae_assignee_id;
    const actorId = req.user.id; // from auth middleware

    db.transaction(() => {
      // 1. Assign to staff and set template
      db.prepare(`
        UPDATE export_jobs 
        SET ae_assignee_id = ?, ae_status = 'Assigned', ae_template_id = ?
        WHERE id = ?
      `).run(staff_id, resolvedTemplateId, export_job_id);

      // 2. Audit trail
      db.prepare(`
        INSERT INTO ae_assignment_history 
        (export_job_id, previous_owner_id, new_owner_id, actor_id, reason)
        VALUES (?, ?, ?, ?, ?)
      `).run(export_job_id, previousOwnerId, staff_id, actorId, reason || 'Supervisor Assignment');
    })();

    res.json({ success: true, message: 'Job assigned successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
