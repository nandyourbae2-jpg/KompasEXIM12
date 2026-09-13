const AeWorkflowEngine = require('../../services/AeWorkflowEngine');
const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const ApiResponse = require('../../utils/ApiResponse');
const logger = require('../../utils/logger');
const { resolveTemplateForJob } = require('../../services/TemplateResolver');

// Middleware to ensure only AE users (or Managers) access these routes
router.use(authenticateToken);
router.use(authorizeDepartment('Administrasi Export'));

/**
 * GET /api/v2/ae/jobs
 * Fetch all AE jobs with source data and assignment details
 */
router.get('/jobs', (req, res, next) => {
  try {
    const jobs = db.prepare(`
      SELECT 
        e.*,
        u.nama as ae_assignee_name,
        u_ao.nama as ao_assignee_name
      FROM export_jobs e
      LEFT JOIN users u ON e.ae_assignee_id = u.id
      LEFT JOIN users u_ao ON e.ao_assignee_id = u_ao.id
      ORDER BY 
        CASE WHEN e.ae_status = 'Completed' THEN 1 ELSE 0 END,
        CASE WHEN e.closing_docs IS NULL THEN 1 ELSE 0 END, -- Push NULL closing_docs to end of priority
        e.closing_docs ASC,
        e.etd ASC,
        e.eta ASC,
        e.destination ASC
    `).all();

    const jobsWithContext = jobs.map(job => {
       const context = AeWorkflowEngine.getJobContext(job.id);
       return { ...job, ...context };
    });

    ApiResponse.send(req, res, jobsWithContext);
  } catch (error) {
    logger.error('Failed to fetch AE jobs', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v2/ae/staff-workload
 * Aggregates job counts by AE staff
 */
router.get('/staff-workload', requireRole(['Supervisor', 'Manager']), (req, res, next) => {
  try {
    // Only fetch staff from AE department
    const staffMembers = db.prepare(`
      SELECT id, nama, employee_id
      FROM users 
      WHERE departemen = 'Administrasi Export' 
      AND level_otoritas = 'Staff Dept'
      AND status_aktif = 1
    `).all();

    const workload = staffMembers.map(staff => {
      const counts = db.prepare(`
        SELECT 
          COUNT(CASE WHEN ae_status = 'Assigned' THEN 1 END) as assigned,
          COUNT(CASE WHEN ae_status = 'In Progress' THEN 1 END) as inProgress,
          COUNT(CASE WHEN ae_status = 'Review' THEN 1 END) as review,
          COUNT(CASE WHEN ae_status = 'Completed' THEN 1 END) as completed,
          COUNT(*) as total
        FROM export_jobs
        WHERE ae_assignee_id = ?
      `).get(staff.id);
      
      return {
        ...staff,
        workload: counts
      };
    });

    ApiResponse.send(req, res, workload);
  } catch (error) {
    logger.error('Failed to fetch staff workload', { error: error.message });
    next(error);
  }
});

/**
 * PATCH /api/v2/ae/jobs/:id/assignment
 * Assigns ae_assignee_id to a user
 */
router.patch('/jobs/:id/assignment', requireRole(['Supervisor', 'Manager']), (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    // Validate assigneeId (if not null, ensure it's a valid AE staff)
    if (assigneeId) {
      const user = db.prepare(`
        SELECT id FROM users 
        WHERE id = ? AND departemen = 'Administrasi Export'
      `).get(assigneeId);
      
      if (!user) {
        return res.status(400).json({ success: false, code: 400, errorCode: 'INVALID_USER', message: 'User is not valid or not in AE department' });
      }
    }

    // Resolve template if assigning a new staff
    let resolvedTemplateId = null;
    if (assigneeId) {
      const job = db.prepare('SELECT ae_template_id FROM export_jobs WHERE id = ?').get(id);
      resolvedTemplateId = job?.ae_template_id;
      if (!resolvedTemplateId) {
        try {
          const resolved = resolveTemplateForJob(id);
          if (resolved) resolvedTemplateId = resolved.id;
        } catch (e) {
          console.error("Error resolving template:", e);
        }
      }
    }

    // Update assignment
    const result = db.prepare(`
      UPDATE export_jobs 
      SET 
        ae_assignee_id = ?,
        ae_template_id = COALESCE(ae_template_id, ?),
        ae_status = CASE WHEN ? IS NULL THEN 'Pending' WHEN ae_status = 'Pending' THEN 'Assigned' ELSE ae_status END,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(assigneeId || null, resolvedTemplateId || null, assigneeId || null, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, code: 404, errorCode: 'NOT_FOUND', message: 'Job not found' });
    }

    try {
      if (assigneeId) {
        db.prepare(`
          INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details)
          VALUES (?, ?, 'ASSIGNMENT', 'EXPORT_JOB', ?)
        `).run(id, req.user.id, JSON.stringify({ assigneeId, description: `Assigned job to user ID ${assigneeId}` }));
      } else {
        db.prepare(`
          INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details)
          VALUES (?, ?, 'UNASSIGNMENT', 'EXPORT_JOB', 'Removed assignment')
        `).run(id, req.user.id);
      }
    } catch (e) {
      // ignore if table format is different or missing
    }

    const updatedJob = db.prepare(`
      SELECT e.*, u.nama as ae_assignee_name 
      FROM export_jobs e 
      LEFT JOIN users u ON e.ae_assignee_id = u.id 
      WHERE e.id = ?
    `).get(id);

    ApiResponse.send(req, res, updatedJob);
  } catch (error) {
    logger.error('Failed to assign job', { error: error.message, jobId: req.params.id });
    next(error);
  }
});


/**
 * GET /api/v2/ae/my-work
 */
router.get('/my-work', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const jobs = db.prepare(`SELECT id, ae_status FROM export_jobs WHERE ae_assignee_id = ?`).all(req.user.id);
    
    let actionRequired = 0;
    let waitingBlocked = 0;
    let handoverReady = 0; // for future
    let overdue = 0;
    let completed = 0;

    for (const job of jobs) {
      if (job.ae_status === 'Completed') {
        completed++;
        continue;
      }
      const context = AeWorkflowEngine.getJobContext(job.id);
      
      if (context.priority === 'OVERDUE') overdue++;
      
      if (context.blocker || !context.closing_docs || !context.etd || (context.nextAction || '').includes('WAITING')) {
        waitingBlocked++;
      } else if (context.nextAction && context.nextAction.startsWith('Execute:')) {
        actionRequired++;
      }
    }

    ApiResponse.send(req, res, { actionRequired, waitingBlocked, handoverReady, overdue, completed });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/ae/my-actions
 */
router.get('/my-actions', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const jobs = db.prepare(`SELECT * FROM export_jobs WHERE ae_assignee_id = ? AND ae_status != 'Completed'`).all(req.user.id);
    
    const actions = [];
    for (const job of jobs) {
       const context = AeWorkflowEngine.getJobContext(job.id);
       // Only include if it is a genuine STAFF ACTION (no waiting, no blockers)
       if (!context.blocker && context.closing_docs && context.etd && context.nextAction && context.nextAction.startsWith('Execute:')) {
          actions.push({ ...job, ...context });
       }
    }
    
    // Sort by priority logic (OVERDUE first)
    actions.sort((a, b) => {
       const p = { 'CRITICAL': 0, 'OVERDUE': 1, 'TODAY': 2, 'HIGH': 3, 'NORMAL': 4 };
       return (p[a.priority] || 99) - (p[b.priority] || 99);
    });

    ApiResponse.send(req, res, actions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/ae/my-blockers
 */
router.get('/my-blockers', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const jobs = db.prepare(`SELECT * FROM export_jobs WHERE ae_assignee_id = ? AND ae_status != 'Completed'`).all(req.user.id);
    
    const blockers = [];
    for (const job of jobs) {
       const context = AeWorkflowEngine.getJobContext(job.id);
       if (context.blocker || !context.closing_docs || !context.etd || (context.nextAction || '').includes('WAITING')) {
          blockers.push({ ...job, ...context });
       }
    }

    ApiResponse.send(req, res, blockers);
  } catch (error) {
    next(error);
  }
});
/**
 * GET /api/v2/ae/my-jobs
 * Fetch AE jobs assigned exclusively to the authenticated staff member
 */
router.get('/my-jobs', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const jobs = db.prepare(`
      SELECT 
        e.*,
        u.nama as ae_assignee_name,
        (SELECT remark FROM ae_job_remarks WHERE job_id = e.id ORDER BY created_at DESC LIMIT 1) as latest_remark
      FROM export_jobs e
      LEFT JOIN users u ON e.ae_assignee_id = u.id
      WHERE ae_assignee_id = ?
      ORDER BY 
        CASE WHEN ae_status = 'Completed' THEN 1 ELSE 0 END,
        CASE WHEN closing_docs < datetime('now') AND ae_status != 'Completed' THEN 0 ELSE 1 END,
        closing_docs ASC,
        closing_docs_time ASC,
        etd ASC
    `).all(req.user.id);

    const jobsWithContext = jobs.map(job => {
       const context = AeWorkflowEngine.getJobContext(job.id);
       return { ...job, ...context };
    });

    ApiResponse.send(req, res, jobsWithContext);
  } catch (error) {
    logger.error('Failed to fetch my jobs', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v2/ae/my-documents
 * Fetch all documents for jobs assigned to the authenticated staff member
 */
router.get('/my-documents', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const documents = db.prepare(`
      SELECT 
        d.id,
        d.job_id,
        d.document_name,
        d.state,
        j.invoice_no,
        j.buyer,
        v.version_number as current_version,
        (SELECT activity_name FROM ae_job_document_activities WHERE job_document_version_id = v.id AND status = 'PENDING' ORDER BY sequence_order ASC LIMIT 1) as activity_name,
        (SELECT status FROM ae_job_document_activities WHERE job_document_version_id = v.id AND status = 'PENDING' ORDER BY sequence_order ASC LIMIT 1) as activity_status
      FROM ae_job_documents d
      JOIN export_jobs j ON d.job_id = j.id
      JOIN ae_job_document_versions v ON v.job_document_id = d.id
      WHERE j.ae_assignee_id = ? 
        AND v.id = (SELECT MAX(id) FROM ae_job_document_versions WHERE job_document_id = d.id)
      ORDER BY 
        CASE WHEN d.state = 'COMPLETED' THEN 1 ELSE 0 END,
        j.closing_docs ASC
    `).all(req.user.id);

    ApiResponse.send(req, res, documents);
  } catch (error) {
    logger.error('Failed to fetch my documents', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v2/ae/documents/:id/timeline
 * Fetch the timeline of activities for a specific document
 */
router.get('/documents/:id/timeline', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate doc exists and belongs to the user's assigned job
    const doc = db.prepare(`
      SELECT d.id, d.document_name, j.ae_assignee_id 
      FROM ae_job_documents d
      JOIN export_jobs j ON d.job_id = j.id
      WHERE d.id = ?
    `).get(id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    if (doc.ae_assignee_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const activities = db.prepare(`
      SELECT a.* 
      FROM ae_job_document_activities a
      JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
      WHERE v.job_document_id = ?
        AND v.id = (SELECT MAX(id) FROM ae_job_document_versions WHERE job_document_id = ?)
      ORDER BY a.sequence_order ASC
    `).all(id, id);

    ApiResponse.send(req, res, activities);
  } catch (error) {
    logger.error('Failed to fetch document timeline', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v2/ae/jobs/:id
 * Fetch job detail with RBAC (Staff can only view their own)
 */
router.get('/jobs/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const job = db.prepare(`
      SELECT 
        e.*, 
        u.nama as ae_assignee_name,
        (SELECT remark FROM ae_job_remarks WHERE job_id = e.id ORDER BY created_at DESC LIMIT 1) as latest_remark
      FROM export_jobs e 
      LEFT JOIN users u ON e.ae_assignee_id = u.id 
      WHERE e.id = ?
    `).get(id);

    if (!job) {
      return res.status(404).json({ success: false, code: 404, errorCode: 'NOT_FOUND', message: 'Job not found' });
    }

    // RBAC Check for Staff
    if (req.user.level_otoritas === 'Staff Dept' && job.ae_assignee_id !== req.user.id) {
      return res.status(403).json({ success: false, code: 403, errorCode: 'FORBIDDEN', message: 'You are not assigned to this job' });
    }

    const context = AeWorkflowEngine.getJobContext(job.id);

    ApiResponse.send(req, res, { ...job, ...context });
  } catch (error) {
    logger.error('Failed to fetch job detail', { error: error.message, jobId: req.params.id });
    next(error);
  }
});

/**
 * GET /api/v2/ae/jobs/:id/workbench
 * Fetch consolidated job context (job + documents + activities + blockers + revisions)
 */
router.get('/jobs/:id/workbench', (req, res, next) => {
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
    
    // Fetch latest versions only
    const latestVersions = db.prepare(`
        SELECT MAX(v.id) as latest_id FROM ae_job_document_versions v
        JOIN ae_job_documents d ON v.job_document_id = d.id
        WHERE d.job_id = ?
        GROUP BY v.job_document_id
    `).all(job.id).map(r => r.latest_id);

    let items = [];
    if (latestVersions.length > 0) {
        items = db.prepare(`
            SELECT 
                a.id, a.activity_name, a.status,
                d.document_name, d.stage_name, d.state as doc_state,
                v.version_number
            FROM ae_job_document_activities a
            JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
            JOIN ae_job_documents d ON v.job_document_id = d.id
            WHERE v.id IN (${latestVersions.map(() => '?').join(',')})
            ORDER BY d.id ASC, a.sequence_order ASC
        `).all(...latestVersions);
    }

    const workbench = {};
    for (const item of items) {
       if (!workbench[item.stage_name]) workbench[item.stage_name] = {};
       if (!workbench[item.stage_name][item.document_name]) {
           workbench[item.stage_name][item.document_name] = { activities: [] };
       }
       
       workbench[item.stage_name][item.document_name].activities.push({
           id: item.id,
           activity_name: item.activity_name,
           status: item.status,
           version: item.version_number,
           doc_state: item.doc_state
       });
    }

    const blockers = db.prepare(`SELECT * FROM ae_job_blockers WHERE job_id = ? ORDER BY opened_at DESC`).all(job.id);
    
    const opsData = db.prepare(`SELECT * FROM ae_job_operational_data WHERE job_id = ?`).get(job.id);
    if (opsData) {
        job.peb_issuer = opsData.peb_issuer;
        job.draft_final_recipient = opsData.draft_final_recipient;
        job.bl_mbl = opsData.bl_mbl;
        job.cc_non_cc = opsData.cc_non_cc;
        job.coo_form = opsData.coo_form;
        job.qc_attend = opsData.qc_attend;
    }

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
});

router.post('/jobs/:id/actions/:actionId/execute', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const { id, actionId } = req.params;
    const { result, evidence_payload, remark, peb_issuer, draft_final_recipient } = req.body;

    const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);
    
    // Resolve user ID
    let execUserId = req.user.id;
    if (!execUserId && req.user.employee_id) {
        const u = db.prepare(`SELECT id FROM users WHERE employee_id = ?`).get(req.user.employee_id);
        if (u) execUserId = u.id;
    }
    if (!job) return res.status(404).json({ success: false, code: 404, message: 'Job not found' });
    
    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
       return res.status(403).json({ success: false, code: 403, message: 'Not authorized' });
    }

    const activity = db.prepare(`SELECT * FROM ae_job_document_activities WHERE id = ?`).get(actionId);
    if (!activity) return res.status(404).json({ success: false, code: 404, message: 'Activity not found' });

    db.transaction(() => {
        // Record result
        db.prepare(`
            INSERT INTO ae_job_activity_results (job_document_activity_id, action_result, disposition, evidence_payload, catatan, executed_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            actionId, 
            result === 'FAIL' ? 'FAIL' : 'PASS', 
            result === 'FAIL' ? 'REVISION_REQUIRED' : 'NONE', 
            evidence_payload ? JSON.stringify(evidence_payload) : null,
            remark,
            execUserId
        );

        // Update Operational Data if provided
        if (peb_issuer !== undefined || draft_final_recipient !== undefined) {
             db.prepare(`
                 UPDATE ae_job_operational_data 
                 SET peb_issuer = COALESCE(?, peb_issuer), 
                     draft_final_recipient = COALESCE(?, draft_final_recipient) 
                 WHERE job_id = ?
             `).run(peb_issuer, draft_final_recipient, id);
        }

        if (result === 'FAIL') {
            // Mark activity as completed (so it doesn't block infinitely without spawn)
            db.prepare(`UPDATE ae_job_document_activities SET status = 'COMPLETED' WHERE id = ?`).run(actionId);
            
            // Spawn V2
            const currentVer = db.prepare(`SELECT * FROM ae_job_document_versions WHERE id = ?`).get(activity.job_document_version_id);
            const doc = db.prepare(`SELECT * FROM ae_job_documents WHERE id = ?`).get(currentVer.job_document_id);
            
            const newVer = db.prepare(`INSERT INTO ae_job_document_versions (job_document_id, version_number) VALUES (?, ?)`).run(doc.id, currentVer.version_number + 1);
            
            // Re-spawn activities for this document based on the template logic.
            // For simplicity in this demo, we just duplicate the sequence of activities for V2.
            const allActs = db.prepare(`SELECT * FROM ae_job_document_activities WHERE job_document_version_id = ? ORDER BY sequence_order ASC`).all(currentVer.id);
            const insertAct = db.prepare(`INSERT INTO ae_job_document_activities (job_document_version_id, activity_name, sequence_order) VALUES (?, ?, ?)`);
            for (const act of allActs) {
                insertAct.run(newVer.lastInsertRowid, act.activity_name, act.sequence_order);
            }
        } else {
            // PASS or DONE
            db.prepare(`UPDATE ae_job_document_activities SET status = 'COMPLETED' WHERE id = ?`).run(actionId);
            
            // Update Document State based on Activity
            const currentVer = db.prepare(`SELECT * FROM ae_job_document_versions WHERE id = ?`).get(activity.job_document_version_id);
            const actName = activity.activity_name.toUpperCase();
            let newState = null;
            
            if (actName.includes('RECEIVE') || actName === 'RCVD') newState = 'RECEIVED';
            else if (actName.includes('FORMAT') || actName.includes('SCAN')) newState = 'DRAFT';
            else if (actName.includes('CHECK') || actName.includes('APPROVAL')) newState = 'FINAL';
            
            if (newState) {
                db.prepare(`UPDATE ae_job_documents SET state = ? WHERE id = ?`).run(newState, currentVer.job_document_id);
            }
        }
    })();

    const context = AeWorkflowEngine.getJobContext(id);

    res.json({
      success: true,
      data: {
        job: { ...job, ...context }
      }
    });

  } catch (err) {
    next(err);
  }
});

router.put('/jobs/:id/operational-data', requireRole(['Staff Dept', 'Supervisor']), (req, res, next) => {
  try {
    const { id } = req.params;
    const { bl_mbl, cc_non_cc, coo_form, qc_attend } = req.body;
    
    const insertOps = db.prepare(`INSERT OR IGNORE INTO ae_job_operational_data (job_id) VALUES (?)`);
    insertOps.run(id);

    db.prepare(`
        UPDATE ae_job_operational_data 
        SET bl_mbl = ?, cc_non_cc = ?, coo_form = ?, qc_attend = ? 
        WHERE job_id = ?
    `).run(bl_mbl, cc_non_cc, coo_form, qc_attend, id);
    
    // Optionally update export_jobs term if needed, skipping for now
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v2/ae/jobs/:id/fields
 * Update specific editable fields on an export job (e.g. container_qty).
 * Only whitelisted fields are allowed to prevent SQL injection or tampering.
 */
router.patch('/jobs/:id/fields', requireRole(['Staff Dept', 'Supervisor', 'Manager']), (req, res, next) => {
  try {
    const { id } = req.params;
    const ALLOWED_FIELDS = ['container_qty'];
    const updates = req.body; // { container_qty: 2 }

    const fieldsToUpdate = Object.keys(updates).filter(k => ALLOWED_FIELDS.includes(k));
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this job' });
    }

    const setClauses = fieldsToUpdate.map(f => `${f} = ?`).join(', ');
    const values = fieldsToUpdate.map(f => updates[f]);
    db.prepare(`UPDATE export_jobs SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);

    res.json({ success: true, updated: fieldsToUpdate });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v2/ae/jobs/:id/remarks
 * Get all remarks for a job (newest first)
 */
router.get('/jobs/:id/remarks', (req, res, next) => {
  try {
    const { id } = req.params;

    const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const remarks = db.prepare(`
      SELECT r.id, r.remark, r.created_at, u.nama as actor_name
      FROM ae_job_remarks r
      LEFT JOIN users u ON r.actor_id = u.id
      WHERE r.job_id = ?
      ORDER BY r.created_at DESC
    `).all(id);

    res.json({ success: true, data: remarks });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v2/ae/jobs/:id/remarks
 * Add a remark to a job
 */
router.post('/jobs/:id/remarks', requireRole(['Staff Dept', 'Supervisor']), (req, res, next) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    if (!remark || !remark.trim()) {
      return res.status(400).json({ success: false, message: 'Remark cannot be empty' });
    }

    const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const info = db.prepare(`
      INSERT INTO ae_job_remarks (job_id, actor_id, remark)
      VALUES (?, ?, ?)
    `).run(id, req.user.id, remark.trim());

    const saved = db.prepare(`
      SELECT r.id, r.remark, r.created_at, u.nama as actor_name
      FROM ae_job_remarks r
      LEFT JOIN users u ON r.actor_id = u.id
      WHERE r.id = ?
    `).get(info.lastInsertRowid);

    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});
/**
 * GET /api/v2/ae/my-handovers
 * Get list of handovers for the current user or all if manager
 */
router.get('/my-handovers', requireRole(['Staff Dept', 'Supervisor', 'Manager']), (req, res, next) => {
  try {
    let query = `
      SELECT 
        h.id,
        h.export_job_id as job_id,
        h.handover_type,
        h.dokumen_package,
        h.created_at,
        h.remark,
        h.is_urgent_force,
        j.invoice_no,
        j.buyer,
        j.destination,
        j.vessel,
        j.ae_handover_status,
        u_sender.nama as sender_name,
        u_recv.nama as receiver_name,
        CASE 
          WHEN EXISTS (SELECT 1 FROM ao_tasks t WHERE t.job_id = h.export_job_id AND t.created_at >= h.created_at) THEN 'Diterima AO'
          ELSE 'Menunggu Review AO'
        END as ao_receipt_status
      FROM handover_events h
      JOIN export_jobs j ON h.export_job_id = j.id
      LEFT JOIN users u_sender ON h.sender_id = u_sender.id
      LEFT JOIN users u_recv ON h.receiver_id = u_recv.id
    `;
    const params = [];
    
    if (req.user.level_otoritas === 'Staff Dept') {
      query += ` WHERE j.ae_assignee_id = ?`;
      params.push(req.user.id);
    }
    
    query += ` ORDER BY h.created_at DESC`;
    
    const handovers = db.prepare(query).all(...params);
    res.json({ success: true, data: handovers });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v2/ae/handovers
 * Create a new handover record
 */
router.post('/handovers', requireRole(['Staff Dept', 'Supervisor', 'Manager']), (req, res, next) => {
  try {
    const { job_id, handover_type, event_type, notes } = req.body;
    
    if (!job_id || !handover_type || !event_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(job_id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this job' });
    }

    const info = db.prepare(`
      INSERT INTO ae_handovers (job_id, handover_type, event_type, notes)
      VALUES (?, ?, ?, ?)
    `).run(job_id, handover_type, event_type, notes || null);
    
    res.json({ success: true, message: 'Handover created successfully', id: info.lastInsertRowid });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v2/ae/jobs/:id/handover-document
 * For Document-by-Document Handover (BL, INVOICE, PACKING LIST, COO, etc.)
 */
router.post('/jobs/:id/handover-document', requireRole(['Staff Dept', 'AE Staff', 'Supervisor', 'Manager']), (req, res, next) => {
  try {
    const { id } = req.params;
    const { document_name, remark, receiver_id } = req.body;
    const senderId = req.user ? req.user.id : null;

    if (!document_name) {
      return res.status(400).json({ success: false, message: 'document_name is required' });
    }

    const job = db.prepare('SELECT id, ao_assignee_id FROM export_jobs WHERE id = ?').get(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Target Staff AO is receiver_id if given, or existing job.ao_assignee_id
    const targetAoId = receiver_id || job.ao_assignee_id || null;
    let receiverUser = null;
    if (targetAoId) {
      receiverUser = db.prepare("SELECT id, nama FROM users WHERE id = ?").get(targetAoId);
    }

    db.transaction(() => {
      // Create a specific handover event for this document
      db.prepare(`
        INSERT INTO handover_events (export_job_id, handover_type, dokumen_package, receiver_id, sender_id, remark, is_urgent_force, status)
        VALUES (?, ?, ?, ?, ?, ?, 0, 'PENDING')
      `).run(id, 'DOCUMENT', JSON.stringify([document_name]), targetAoId, senderId, remark || null);

      // Update the main job status
      const isFinal = document_name.toLowerCase().includes('original') || document_name.toLowerCase().includes('coo') || document_name.toLowerCase().includes('peb');
      const aeHandoverStatus = isFinal ? 'Final Shared' : 'Draft Shared';

      db.prepare(`
        UPDATE export_jobs 
        SET ae_handover_status = CASE WHEN ae_handover_status = 'Not Started' THEN ? ELSE ae_handover_status END,
            ae_handover_at = datetime('now'),
            ao_assignee_id = COALESCE(?, ao_assignee_id),
            ao_status = CASE WHEN ao_status = 'Pending' AND ? IS NOT NULL THEN 'Assigned' ELSE ao_status END
        WHERE id = ?
      `).run(aeHandoverStatus, targetAoId, targetAoId, id);

      // Ensure ao_job_context exists
      db.prepare(`INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)`).run(id);

      // --- Sync to document_checklists ---
      const contextRow = db.prepare('SELECT document_checklists FROM ao_job_context WHERE job_id = ?').get(id);
      let checklists = [];
      if (contextRow && contextRow.document_checklists) {
        try {
          checklists = JSON.parse(contextRow.document_checklists);
          if (!Array.isArray(checklists)) checklists = [];
        } catch(e) {}
      }
      const senderName = req.user ? req.user.nama : 'Unknown';
      const nowTs = new Date().toISOString();
      if (!checklists.find(c => c.name === document_name && c.category === 'AE')) {
        checklists.push({
          id: 'ae_handover_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          category: 'AE',
          name: document_name,
          isCompleted: false,
          deadline: null,
          sender_staff_name: senderName,
          source: 'AE_HANDOVER',
          timestamp: nowTs
        });
        db.prepare('UPDATE ao_job_context SET document_checklists = ? WHERE job_id = ?').run(JSON.stringify(checklists), id);
      }
      // ------------------------------------

      // Insert task directly to Staff AO if assigned
      if (targetAoId) {
        const taskType = `Verifikasi ${document_name}`;
        const existing = db.prepare('SELECT id FROM ao_tasks WHERE job_id = ? AND task_type = ?').get(id, taskType);
        if (existing) {
          db.prepare(`
            UPDATE ao_tasks 
            SET assigned_to = ?, status = 'PENDING', updated_at = datetime('now')
            WHERE id = ?
          `).run(targetAoId, existing.id);
        } else {
          db.prepare(`
            INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date)
            VALUES (?, 'DOC', ?, ?, ?, 'PENDING', 'NORMAL', date('now', '+2 days'))
          `).run(
            id,
            taskType,
            `Tugas verifikasi dokumen (${document_name}) diserahkan langsung oleh Staff AE kepada Staff AO (${receiverUser ? receiverUser.nama : 'Staff AO'}).`,
            targetAoId
          );
        }
      }
    })();

    const receiverNotice = receiverUser ? ` langsung ke Staff AO (${receiverUser.nama})` : ' ke AO';
    res.json({ success: true, message: `${document_name} berhasil diserahkan${receiverNotice}.` });
  } catch (err) {
    next(err);
  }
});

// GET /api/v2/ae/handover-targets
router.get('/handover-targets', (req, res, next) => {
  try {
    const targets = db.prepare(`
      SELECT id, nama, employee_id 
      FROM users 
      WHERE departemen = 'Account Officer' AND level_otoritas = 'Staff Dept' AND status_aktif = 1
      ORDER BY nama ASC
    `).all();
    res.json({ success: true, data: targets });
  } catch(err) {
    next(err);
  }
});

// POST /api/v2/ae/jobs/:id/handover
router.post('/jobs/:id/handover', (req, res, next) => {
  try {
    const { id } = req.params;
    const { handover_type, documents, receiver_id, remark, dokumen_package, is_urgent_force } = req.body;
    const senderId = req.user ? req.user.id : null;

    const job = db.prepare('SELECT id, invoice_no, ao_assignee_id FROM export_jobs WHERE id = ?').get(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Resolve documents list
    let docList = [];
    if (Array.isArray(documents) && documents.length > 0) {
      docList = documents;
    } else if (Array.isArray(dokumen_package) && dokumen_package.length > 0) {
      docList = dokumen_package;
    } else if (typeof dokumen_package === 'string') {
      try { 
        const parsed = JSON.parse(dokumen_package);
        docList = Array.isArray(parsed) ? parsed : [dokumen_package];
      } catch(e) { 
        docList = [dokumen_package]; 
      }
    } else if (handover_type) {
      docList = [handover_type];
    } else {
      docList = ['Draft Dokumen'];
    }

    const typeName = docList.length === 1 ? docList[0] : docList.join(', ');
    const pkgString = JSON.stringify(docList);

    // Target Staff AO is receiver_id if given, or existing job.ao_assignee_id
    const targetAoId = receiver_id || job.ao_assignee_id || null;
    let receiverUser = null;
    if (targetAoId) {
      receiverUser = db.prepare("SELECT id, nama FROM users WHERE id = ?").get(targetAoId);
    }

    db.transaction(() => {
      // 1. Insert or Update Handover Event (Prevent duplicate pending cards for the same job)
      const existingPending = db.prepare(`
        SELECT id FROM handover_events 
        WHERE export_job_id = ? AND status = 'PENDING'
      `).get(id);

      if (existingPending) {
        db.prepare(`
          UPDATE handover_events 
          SET handover_type = ?, dokumen_package = ?, receiver_id = ?, sender_id = ?, remark = ?, is_urgent_force = ?, created_at = datetime('now')
          WHERE id = ?
        `).run(typeName, pkgString, targetAoId, senderId, remark || null, is_urgent_force ? 1 : 0, existingPending.id);
      } else {
        db.prepare(`
          INSERT INTO handover_events (export_job_id, handover_type, dokumen_package, receiver_id, sender_id, remark, is_urgent_force, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `).run(id, typeName, pkgString, targetAoId, senderId, remark || null, is_urgent_force ? 1 : 0);
      }

      // 2. Update export_jobs (respecting CHECK constraint: 'Not Started', 'Draft Shared', 'Final Shared', 'Completed')
      const isFinal = docList.some(d => d.toLowerCase().includes('original') || d.toLowerCase().includes('coo') || d.toLowerCase().includes('peb'));
      const aeHandoverStatus = isFinal ? 'Final Shared' : 'Draft Shared';

      if (targetAoId) {
        db.prepare(`
          UPDATE export_jobs 
          SET ae_handover_status = ?, 
              ae_handover_at = datetime('now'),
              ao_assignee_id = ?,
              ao_status = 'Assigned'
          WHERE id = ?
        `).run(aeHandoverStatus, targetAoId, id);
      } else {
        db.prepare(`
          UPDATE export_jobs 
          SET ae_handover_status = ?, 
              ae_handover_at = datetime('now'),
              ao_status = 'Pending'
          WHERE id = ?
        `).run(aeHandoverStatus, id);
      }

      // 3. Ensure ao_job_context exists
      db.prepare(`INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)`).run(id);

      // --- Sync to document_checklists ---
      const contextRow = db.prepare('SELECT document_checklists FROM ao_job_context WHERE job_id = ?').get(id);
      let checklists = [];
      if (contextRow && contextRow.document_checklists) {
        try {
          checklists = JSON.parse(contextRow.document_checklists);
          if (!Array.isArray(checklists)) checklists = [];
        } catch(e) {}
      }
      const senderName = req.user ? req.user.nama : 'Unknown';
      const nowTs = new Date().toISOString();
      let updatedChecklists = false;
      for (const doc of docList) {
        if (!checklists.find(c => c.name === doc && c.category === 'AE')) {
          checklists.push({
            id: 'ae_handover_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            category: 'AE',
            name: doc,
            isCompleted: false,
            deadline: null,
            sender_staff_name: senderName,
            source: 'AE_HANDOVER',
            timestamp: nowTs
          });
          updatedChecklists = true;
        }
      }
      if (updatedChecklists) {
        db.prepare('UPDATE ao_job_context SET document_checklists = ? WHERE job_id = ?').run(JSON.stringify(checklists), id);
      }
      // ------------------------------------

      // 4. Create tasks in ao_tasks directly assigned to receiver Staff AO
      if (targetAoId) {
        for (const doc of docList) {
          const taskType = `Verifikasi ${doc}`;
          const existing = db.prepare('SELECT id FROM ao_tasks WHERE job_id = ? AND task_type = ?').get(id, taskType);
          if (existing) {
            db.prepare(`
              UPDATE ao_tasks 
              SET assigned_to = ?, status = 'PENDING', priority = ?, updated_at = datetime('now')
              WHERE id = ?
            `).run(targetAoId, is_urgent_force ? 'HIGH' : 'NORMAL', existing.id);
          } else {
            db.prepare(`
              INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date)
              VALUES (?, 'DOC', ?, ?, ?, 'PENDING', ?, date('now', '+2 days'))
            `).run(
              id,
              taskType,
              `Tugas verifikasi ${doc} diserahterimakan langsung oleh Staff AE ke Staff AO (${receiverUser ? receiverUser.nama : 'Staff AO'}).`,
              targetAoId,
              is_urgent_force ? 'HIGH' : 'NORMAL'
            );
          }
        }
      }
    })();

    // Recalculate AE workflow context just in case
    try {
      AeWorkflowEngine.recalculateGroupCompletion(id);
    } catch(e) {}

    const receiverNotice = receiverUser ? ` langsung ke Staff AO (${receiverUser.nama})` : ' ke AO';
    res.json({ success: true, message: `Handover dokumen (${typeName}) berhasil diserahkan${receiverNotice}.` });
  } catch(err) {
    next(err);
  }
});

module.exports = router;

