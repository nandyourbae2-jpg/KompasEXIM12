const db = require('../database/db');
const AeWorkflowEngine = require('../services/AeWorkflowEngine');

exports.getMyJobs = (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT 
        j.*,
        u_ao.nama as ao_assignee_name,
        COALESCE(j.ae_progress, 0) as progress,
        (SELECT remark FROM ae_job_remarks WHERE job_id = j.id ORDER BY created_at DESC, id DESC LIMIT 1) as latest_remark
      FROM export_jobs j
      LEFT JOIN users u_ao ON j.ao_assignee_id = u_ao.id
      WHERE j.ae_status NOT IN ('Completed', 'Cancelled')
        AND j.ae_assignee_id = ?
      ORDER BY j.created_at DESC
    `).all(req.user.id);

    const enrichedJobs = jobs.map(job => {
      const ctx = AeWorkflowEngine.getJobContext(job.id);
      return {
        ...job,
        progress: ctx.progress,
        priority: ctx.priority,
        nextAction: ctx.nextAction,
        pendingActionObj: ctx.pendingActionObj,
        ae_status: job.ae_status || 'Pending'
      };
    });

    res.json({ success: true, data: enrichedJobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyWork = (req, res) => {
  try {
    const jobs = db.prepare(`SELECT id, ae_status FROM export_jobs WHERE ae_assignee_id = ?`).all(req.user.id);
    let actionRequired = 0;
    let waitingBlocked = 0;
    let overdue = 0;
    let completed = 0;

    for (const job of jobs) {
      if (job.ae_status === 'Completed') {
        completed++;
        continue;
      }
      const context = AeWorkflowEngine.getJobContext(job.id);
      if (context.priority === 'OVERDUE') overdue++;
      if (context.blocker || (context.nextAction || '').includes('Waiting') || (context.nextAction || '').includes('Missing Source')) {
        waitingBlocked++;
      } else if (context.nextAction && context.pendingActionObj) {
        actionRequired++;
      }
    }

    res.json({ success: true, data: { actionRequired, overdue, waitingBlocked, completed } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getJobById = (req, res) => {
  try {
    const { jobId } = req.params;
    const job = db.prepare(`
      SELECT 
        j.*,
        (SELECT remark FROM ae_job_remarks WHERE job_id = j.id ORDER BY created_at DESC, id DESC LIMIT 1) as latest_remark
      FROM export_jobs j
      WHERE j.id = ?
    `).get(jobId);

    if (!job) return res.status(404).json({ success: false, error: 'Not found' });

    const ctx = AeWorkflowEngine.getJobContext(job.id);
    const enrichedJob = {
      ...job,
      progress: ctx.progress,
      priority: ctx.priority,
      nextAction: ctx.nextAction,
      pendingActionObj: ctx.pendingActionObj,
      ae_status: job.ae_status || 'Pending'
    };

    res.json({ success: true, data: enrichedJob });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addRemark = (req, res) => {
  try {
    const { jobId } = req.params;
    const { remark } = req.body;
    
    if (!remark) return res.status(400).json({ success: false, error: 'Remark is required' });

    const job = db.prepare('SELECT id, ae_assignee_id FROM export_jobs WHERE id = ?').get(jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    // RBAC: Staff can only add remarks on assigned jobs
    if (req.user.level_otoritas === 'Staff Dept' && job.ae_assignee_id && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Access forbidden. You are not assigned to this job.' });
    }

    db.prepare(`
      INSERT INTO ae_job_remarks (job_id, actor_id, remark)
      VALUES (?, ?, ?)
    `).run(jobId, req.user.id, remark);

    // Update job last updated
    db.prepare(`UPDATE export_jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(jobId);

    res.json({ success: true, message: 'Remark added' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.executeActivity = (req, res) => {
  try {
    const { jobId, itemId } = req.params;
    const { activity_id, status, result, disposition, remark, evidence_path } = req.body;

    const job = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    // RBAC: Staff can only execute activities on assigned jobs
    if (req.user.level_otoritas === 'Staff Dept' && job.ae_assignee_id && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Access forbidden. You are not assigned to this job.' });
    }

    // Find the target activity
    let targetActivity = null;
    if (activity_id) {
      targetActivity = db.prepare(`
        SELECT a.*, v.job_document_id, v.version_number, d.stage_name, d.document_name
        FROM ae_job_document_activities a
        JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
        JOIN ae_job_documents d ON v.job_document_id = d.id
        WHERE a.id = ? AND d.job_id = ?
      `).get(activity_id, jobId);
    }

    if (!targetActivity && itemId) {
      // Check if itemId is an activity id or a document id
      targetActivity = db.prepare(`
        SELECT a.*, v.job_document_id, v.version_number, d.stage_name, d.document_name
        FROM ae_job_document_activities a
        JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
        JOIN ae_job_documents d ON v.job_document_id = d.id
        WHERE a.id = ? AND d.job_id = ?
      `).get(itemId, jobId);

      if (!targetActivity) {
        // Look for the next pending activity for document itemId
        targetActivity = db.prepare(`
          SELECT a.*, v.job_document_id, v.version_number, d.stage_name, d.document_name
          FROM ae_job_document_activities a
          JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
          JOIN ae_job_documents d ON v.job_document_id = d.id
          WHERE d.id = ? AND d.job_id = ? AND a.status = 'PENDING'
          ORDER BY a.sequence_order ASC
          LIMIT 1
        `).get(itemId, jobId);
      }
    }

    if (!targetActivity) {
      // Fallback: pick next pending activity for this job
      targetActivity = db.prepare(`
        SELECT a.*, v.job_document_id, v.version_number, d.stage_name, d.document_name
        FROM ae_job_document_activities a
        JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
        JOIN ae_job_documents d ON v.job_document_id = d.id
        WHERE d.job_id = ? AND a.status = 'PENDING'
        ORDER BY d.id ASC, a.sequence_order ASC
        LIMIT 1
      `).get(jobId);
    }

    if (!targetActivity) {
      return res.status(400).json({ success: false, error: 'No pending activity found for this job' });
    }

    const tx = db.transaction(() => {
      // 1. Mark activity as COMPLETED
      db.prepare(`
        UPDATE ae_job_document_activities 
        SET status = 'COMPLETED' 
        WHERE id = ?
      `).run(targetActivity.id);

      // 2. Insert into ae_job_activity_results
      const resultStr = typeof result === 'object' ? JSON.stringify(result) : (result || 'PASS');
      db.prepare(`
        INSERT INTO ae_job_activity_results 
        (job_document_activity_id, action_result, disposition, evidence_payload, catatan, executed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        targetActivity.id,
        resultStr,
        disposition || 'NONE',
        evidence_path ? JSON.stringify({ path: evidence_path }) : null,
        remark || '',
        req.user.id
      );

      // 3. Update document state based on completed activity
      const actUpper = (targetActivity.activity_name || '').toUpperCase();
      let newDocState = null;
      if (actUpper.includes('RECEIVE') || actUpper === 'RCVD') newDocState = 'RECEIVED';
      else if (actUpper.includes('FORMAT') || actUpper.includes('SCAN') || actUpper.includes('FILING')) newDocState = 'DRAFT';
      else if (actUpper.includes('CHECK') || actUpper.includes('APPROVAL')) newDocState = 'FINAL';

      // Check if all activities for this document version are complete
      const pendingInDoc = db.prepare(`
        SELECT COUNT(*) as count 
        FROM ae_job_document_activities 
        WHERE job_document_version_id = ? AND status = 'PENDING'
      `).get(targetActivity.job_document_version_id);

      if (pendingInDoc && pendingInDoc.count === 0) {
        newDocState = 'COMPLETED';
      }

      if (newDocState) {
        db.prepare(`UPDATE ae_job_documents SET state = ? WHERE id = ?`).run(newDocState, targetActivity.job_document_id);
      }

      // 4. Calculate new overall progress
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM ae_job_document_activities a
        JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
        JOIN ae_job_documents d ON v.job_document_id = d.id
        WHERE d.job_id = ?
      `).get(jobId);

      const total = stats.total || 1;
      const completed = stats.completed || 0;
      const progress = Math.round((completed / total) * 100);
      const newStatus = progress === 100 ? 'Completed' : (progress > 0 ? 'In Progress' : (job.ae_status || 'Assigned'));

      db.prepare(`
        UPDATE export_jobs 
        SET ae_progress = ?, ae_status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(progress, newStatus, jobId);

      // 5. Add remark if provided
      if (remark) {
        db.prepare(`
          INSERT INTO ae_job_remarks (job_id, actor_id, remark)
          VALUES (?, ?, ?)
        `).run(jobId, req.user.id, `[${targetActivity.activity_name} - ${targetActivity.document_name}] ${remark}`);
      }

      return { progress, newStatus };
    });

    const execResult = tx();
    const ctx = AeWorkflowEngine.getJobContext(jobId);

    res.json({
      success: true,
      message: 'Activity executed successfully',
      data: {
        progress: execResult.progress,
        status: execResult.newStatus,
        nextAction: ctx.nextAction,
        pendingActionObj: ctx.pendingActionObj
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSupervisorQueue = (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT 
        j.*,
        u.nama as assignee_name,
        u_ao.nama as ao_assignee_name
      FROM export_jobs j
      LEFT JOIN users u ON j.ae_assignee_id = u.id
      LEFT JOIN users u_ao ON j.ao_assignee_id = u_ao.id
      WHERE j.ae_status NOT IN ('Completed', 'Cancelled')
      ORDER BY j.created_at DESC
    `).all();

    const needsAssignment = jobs.filter(j => !j.ae_assignee_id);
    const assigned = jobs.filter(j => j.ae_assignee_id);

    res.json({ success: true, data: { needsAssignment, assigned } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.assignJob = (req, res) => {
  try {
    const { jobId } = req.params;
    const { assignee_id, remark } = req.body;

    if (!assignee_id) return res.status(400).json({ success: false, error: 'Assignee is required' });

    const job = db.prepare('SELECT id, ae_assignee_id FROM export_jobs WHERE id = ?').get(jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    if (job.ae_assignee_id) return res.status(400).json({ success: false, error: 'Job already assigned. Use reassign API.' });

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE export_jobs 
        SET ae_assignee_id = ?, ae_status = 'Assigned', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(assignee_id, jobId);

      db.prepare(`
        INSERT INTO ae_job_assignments (job_id, assigned_to_user_id, assigned_by_user_id, status, remark)
        VALUES (?, ?, ?, 'ASSIGNED', ?)
      `).run(jobId, assignee_id, req.user.id, remark || '');
    });

    transaction();
    
    // Auto-generate checklist items for the newly assigned job
    AeWorkflowEngine.autoGenerateChecklist(jobId, assignee_id);

    res.json({ success: true, message: 'Job assigned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.reassignJob = (req, res) => {
  try {
    const { jobId } = req.params;
    const { assignee_id, remark } = req.body;

    if (!assignee_id) return res.status(400).json({ success: false, error: 'Assignee is required' });

    const job = db.prepare('SELECT id, ae_assignee_id FROM export_jobs WHERE id = ?').get(jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    if (!job.ae_assignee_id) return res.status(400).json({ success: false, error: 'Job not assigned. Use assign API.' });

    // Get old and new assignee names for better audit trail
    const oldAssignee = db.prepare('SELECT id, nama FROM users WHERE id = ?').get(job.ae_assignee_id);
    const newAssignee = db.prepare('SELECT id, nama FROM users WHERE id = ?').get(assignee_id);
    
    const oldName = oldAssignee?.nama || `User #${job.ae_assignee_id}`;
    const newName = newAssignee?.nama || `User #${assignee_id}`;
    const reassignRemark = remark || `Dialihkan dari ${oldName} ke ${newName}`;

    const transaction = db.transaction(() => {
      // Create REASSIGNED audit record
      db.prepare(`
        INSERT INTO ae_job_assignments (job_id, assigned_to_user_id, assigned_by_user_id, status, remark)
        VALUES (?, ?, ?, 'REASSIGNED', ?)
      `).run(jobId, assignee_id, req.user.id, reassignRemark);

      // Update assignee — state (job_checklist_state, ae_stage_milestones, etc.) stays intact
      // New assignee inherits all previous progress — this is the Strict Assignee model
      db.prepare(`
        UPDATE export_jobs 
        SET ae_assignee_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(assignee_id, jobId);
    });

    transaction();

    // Auto-generate checklist if it doesn't exist yet for this job
    try {
      const docCount = db.prepare('SELECT COUNT(*) as c FROM ae_job_documents WHERE job_id = ?').get(jobId);
      if (docCount.c === 0) {
        AeWorkflowEngine.autoGenerateChecklist(jobId, assignee_id);
      }
    } catch(e) { /* non-critical */ }

    res.json({ 
      success: true, 
      message: `Job berhasil dialihkan ke ${newName}.`,
      data: { oldAssignee: oldName, newAssignee: newName }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAtd = (req, res) => {
  try {
    const { jobId } = req.params;
    const { atd } = req.body;
    
    const job = db.prepare('SELECT id, ae_assignee_id FROM export_jobs WHERE id = ?').get(jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    // RBAC: Staff can only update ATD on assigned jobs, Supervisors can update any
    if (req.user.level_otoritas === 'Staff Dept' && job.ae_assignee_id && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Access forbidden. You are not assigned to this job.' });
    }

    db.transaction(() => {
      // 1. Update export_jobs
      db.prepare(`UPDATE export_jobs SET atd = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(atd || null, jobId);
      
      // 2. Also update ao_job_context if exists, to keep it in sync for AO module
      const contextExists = db.prepare('SELECT id FROM ao_job_context WHERE job_id = ?').get(jobId);
      if (contextExists) {
         db.prepare(`UPDATE ao_job_context SET atd = ?, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?`).run(atd || null, jobId);
      }
    })();

    res.json({ success: true, message: 'ATD updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
