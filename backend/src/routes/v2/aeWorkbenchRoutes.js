const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { resolveNextAction } = require('../../services/WorkflowEngine');
const AeWorkflowEngine = require('../../services/AeWorkflowEngine');
const { resolveTemplateForJob } = require('../../services/TemplateResolver');
router.use(authenticateToken);
const requireAeStaff = requireRole(['Staff Dept', 'AE Staff', 'Supervisor', 'Manager']);

// Helper: check if current user is SPV/Manager (can see all jobs)
const isPrivilegedUser = (user) => ['Supervisor', 'Manager', 'Director'].includes(user?.level_otoritas);

// Helper: ensure job has a template, resolve one if missing
function ensureTemplate(jobId, jobCode, productType) {
  try {
    const resolved = resolveTemplateForJob(jobId);
    return resolved ? resolved.id : 1;
  } catch(e) {
    return 1;
  }
}

router.get('/jobs/:id', requireAeStaff, (req, res, next) => {
  try {
    const { id } = req.params;
    
    const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // STRICT ASSIGNEE MODEL: Staff Dept hanya bisa buka job yang di-assign ke mereka.
    // Supervisor & Manager bebas akses semua job.
    if (!isPrivilegedUser(req.user) && String(job.ae_assignee_id) !== String(req.user.id)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Akses ditolak. Job ini tidak ditugaskan kepada Anda.',
          code: 'NOT_YOUR_JOB'
        });
    }

    // Get the template items
    // First, we need to know what template this job uses.
    let templateId = job.ae_template_id;
    if (!templateId) {
        // Auto-resolve template based on job profile
        templateId = ensureTemplate(job.id, job.job_code, job.product_type);
        // Persist so next load is instant
        if (templateId) {
          db.prepare(`UPDATE export_jobs SET ae_template_id = ? WHERE id = ? AND ae_template_id IS NULL`).run(templateId, job.id);
        }
    }
    
    // Get all groups and items for this template
    const items = db.prepare(`
      SELECT i.id, i.nama_item, g.nama_group, i.group_id
      FROM checklist_items i
      JOIN checklist_groups g ON i.group_id = g.id
      WHERE g.template_id = ?
      ORDER BY g.urutan ASC, i.urutan ASC
    `).all(templateId);

    // Compute next action for each item
    const itemsWithAction = items.map(item => {
      const actionData = resolveNextAction(job.id, item.id);
      
      let nextActivityDetails = null;
      if (actionData.nextActivity) {
          nextActivityDetails = db.prepare('SELECT * FROM checklist_activities WHERE id = ?').get(actionData.nextActivity);
      }

      // Fetch all activities for this item to build sequence indicator
      const allActivities = db.prepare(`
        SELECT ca.* 
        FROM checklist_activities ca
        JOIN checklist_item_activity_rules ciar ON ca.id = ciar.activity_id
        WHERE ciar.item_id = ? AND ciar.berlaku = 1
        ORDER BY ca.urutan ASC
      `).all(item.id);

      // Fetch executions if state exists
      let executions = [];
      if (actionData.stateId) {
        executions = db.prepare(`
          SELECT ae.*, u.nama as actor_name
          FROM activity_executions ae
          LEFT JOIN users u ON ae.actor_id = u.id
          WHERE ae.job_checklist_state_id = ?
          ORDER BY ae.executed_at ASC
        `).all(actionData.stateId);
      }

      return {
        ...item,
        state_id: actionData.stateId,
        current_activity_id: actionData.nextActivity,
        next_action_mode: actionData.mode,
        next_activity: nextActivityDetails,
        all_activities: allActivities,
        executions: executions
      };
    });

    // Fetch stage milestones for this job
    const stageMilestones = db.prepare(`
      SELECT stage_name, target_date, completed_date, notes, updated_at
      FROM ae_stage_milestones
      WHERE export_job_id = ?
    `).all(id);
    // Convert to a map: { 'Document Preparation': { target_date, completed_date, ... }, ... }
    const milestonesMap = {};
    for (const m of stageMilestones) {
      milestonesMap[m.stage_name] = m;
    }

    res.json({
      success: true,
      data: {
        job,
        items: itemsWithAction,
        stage_milestones: milestonesMap
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /jobs/:id/items/:itemId/execute
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/jobs/:id/items/:itemId/execute', requireAeStaff, upload.single('evidence_path'), (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    let { activity_id, status, result, disposition, remark, evidence_path, execution_date } = req.body;
    
    if (req.file) {
      evidence_path = req.file.path;
    }

    const actorId = req.user.id;
    // Use provided execution_date or default to now
    const execAt = execution_date ? execution_date : null;

    // Get or Create state
    let state = db.prepare('SELECT id FROM job_checklist_state WHERE export_job_id = ? AND item_id = ?').get(id, itemId);
    
    db.transaction(() => {
        if (!state) {
            const info = db.prepare(`
                INSERT INTO job_checklist_state (export_job_id, item_id, current_activity_id) 
                VALUES (?, ?, ?)
            `).run(id, itemId, activity_id);
            state = { id: info.lastInsertRowid };
        } else {
            db.prepare(`
                UPDATE job_checklist_state 
                SET current_activity_id = ?, updated_at = datetime('now')
                WHERE id = ?
            `).run(activity_id, state.id);
        }

        // Insert history — support custom execution_date as executed_at
        if (execAt) {
          db.prepare(`
              INSERT INTO activity_executions 
              (job_checklist_state_id, activity_id, status, result, disposition, remark, evidence_path, actor_id, executed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(state.id, activity_id, status || 'COMPLETED', result, disposition, remark, evidence_path, actorId, execAt);
        } else {
          db.prepare(`
              INSERT INTO activity_executions 
              (job_checklist_state_id, activity_id, status, result, disposition, remark, evidence_path, actor_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(state.id, activity_id, status || 'COMPLETED', result, disposition, remark, evidence_path, actorId);
        }
    })();

    // POST-SAVE HOOK: Menghitung ulang total progress berdasarkan items
    AeWorkflowEngine.recalculateGroupCompletion(id);

    res.json({ success: true, message: 'Activity executed' });
  } catch (err) {
    next(err);
  }
});

// PUT /jobs/:id/stages/:stageName/date — Set or update stage milestone date
router.put('/jobs/:id/stages/:stageName/date', requireAeStaff, (req, res, next) => {
  try {
    const { id, stageName } = req.params;
    const { target_date, completed_date, notes } = req.body;
    const updatedById = req.user.id;

    const job = db.prepare('SELECT id FROM export_jobs WHERE id = ?').get(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    db.prepare(`
      INSERT INTO ae_stage_milestones (export_job_id, stage_name, target_date, completed_date, notes, updated_by_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(export_job_id, stage_name) DO UPDATE SET
        target_date = excluded.target_date,
        completed_date = excluded.completed_date,
        notes = excluded.notes,
        updated_by_id = excluded.updated_by_id,
        updated_at = datetime('now')
    `).run(id, stageName, target_date || null, completed_date || null, notes || null, updatedById);

    const updated = db.prepare('SELECT * FROM ae_stage_milestones WHERE export_job_id = ? AND stage_name = ?').get(id, stageName);
    res.json({ success: true, message: 'Stage date updated', data: updated });
  } catch (err) {
    next(err);
  }
});

// GET /handover-targets
router.get('/handover-targets', requireAeStaff, (req, res, next) => {
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

// POST /jobs/:id/handover
router.post('/jobs/:id/handover', requireAeStaff, (req, res, next) => {
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
      // 1. Insert Handover Event
      db.prepare(`
        INSERT INTO handover_events (export_job_id, handover_type, dokumen_package, receiver_id, sender_id, remark, is_urgent_force, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
      `).run(id, typeName, pkgString, targetAoId, senderId, remark || null, is_urgent_force ? 1 : 0);

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

// POST /jobs/:id/handover-document
// For Document-by-Document Handover (BL, INVOICE, PACKING LIST, COO, DATA LOADING)
router.post('/jobs/:id/handover-document', requireAeStaff, (req, res, next) => {
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
  } catch(err) {
    next(err);
  }
});

module.exports = router;
