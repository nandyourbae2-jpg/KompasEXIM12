import re

file_path = "backend/src/routes/v2/aeRoutes.js"
with open(file_path, "r") as f:
    content = f.read()

new_routes = """
/**
 * GET /api/v2/ae/jobs/:id/handovers
 * Fetch handover history
 */
router.get('/jobs/:id/handovers', (req, res, next) => {
  try {
    const { id } = req.params;
    
    // RBAC
    if (req.user.level_otoritas === 'Staff Dept') {
      const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
      if (!job || job.ae_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, code: 403, errorCode: 'FORBIDDEN', message: 'You are not assigned to this job' });
      }
    }

    const handovers = db.prepare(`SELECT * FROM ae_ao_handovers WHERE job_id = ? ORDER BY created_at DESC`).all(id);
    const documents = db.prepare(`
      SELECT d.* FROM ae_ao_handover_documents d
      JOIN ae_ao_handovers h ON d.handover_id = h.id
      WHERE h.job_id = ?
    `).all(id);

    const result = handovers.map(h => {
      h.documents = documents.filter(d => d.handover_id === h.id);
      return h;
    });

    return ApiResponse.send(req, res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/ae/jobs/:id/handovers
 * Create an immutable handover event
 */
router.post('/jobs/:id/handovers', (req, res, next) => {
  try {
    const { id } = req.params;
    const { request_id, handover_type, remarks, document_references } = req.body;

    if (!['DRAFT', 'FINAL'].includes(handover_type)) {
       return res.status(400).json({ success: false, code: 400, message: 'Invalid handover_type' });
    }
    
    const event_type = 'SHARED'; // AE Staff can only create SHARED events
    const sender_id = req.user.id;

    if (req.user.level_otoritas === 'Staff Dept') {
      const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
      if (!job || job.ae_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, code: 403, errorCode: 'FORBIDDEN', message: 'Not authorized' });
      }
    } else {
       // Only AE Staff should create handovers in this phase, or optionally Supervisors
       return res.status(403).json({ success: false, code: 403, message: 'Supervisors cannot create handovers on behalf of staff yet.' });
    }

    // Idempotency check
    const existing = db.prepare(`SELECT * FROM ae_ao_handovers WHERE job_id = ? AND sender_id = ? AND request_id = ?`).get(id, sender_id, request_id);
    if (existing) {
       existing.documents = db.prepare(`SELECT * FROM ae_ao_handover_documents WHERE handover_id = ?`).all(existing.id);
       return res.status(200).json({ success: true, data: existing, message: 'Already processed' });
    }

    const insertHandover = db.prepare(`
      INSERT INTO ae_ao_handovers (job_id, request_id, sender_id, handover_type, event_type, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertDocSnap = db.prepare(`
      INSERT INTO ae_ao_handover_documents (handover_id, job_document_id, snap_document_name, snap_document_state, snap_version)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Fetch current state of documents to snapshot them safely on backend
    const getDoc = db.prepare(`
      SELECT d.id, d.document_name, d.state, (SELECT version FROM ae_job_document_activities a WHERE a.job_document_id = d.id LIMIT 1) as max_version
      FROM ae_job_documents d
      WHERE d.id = ? AND d.job_id = ?
    `);

    let newHandoverId;
    db.transaction(() => {
       const info = insertHandover.run(id, request_id, sender_id, handover_type, event_type, remarks);
       newHandoverId = info.lastInsertRowid;

       if (document_references && Array.isArray(document_references)) {
          // Remove duplicates requested by client
          const uniqueDocs = [...new Set(document_references.map(d => d.job_document_id))];
          
          for (const docId of uniqueDocs) {
             const actualDoc = getDoc.get(docId, id);
             if (!actualDoc) {
                throw new Error(`Document ID ${docId} does not belong to job ${id} or does not exist`);
             }
             // snap_version is technically per-activity in current schema, we'll store max_version or a default
             const snap_version = actualDoc.max_version || 1;
             
             insertDocSnap.run(newHandoverId, actualDoc.id, actualDoc.document_name, actualDoc.state, snap_version);
          }
       }
       
       // Log Audit Event for Source tracking
       const insertAudit = db.prepare(`INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details) VALUES (?, ?, ?, ?, ?)`);
       try {
           insertAudit.run(id, sender_id, `HANDOVER_${handover_type}_${event_type}`, 'HANDOVER', JSON.stringify({ request_id, remarks }));
       } catch (e) {
           // Ignore if ae_audit_logs does not exist, as we log implicitly via the event table
       }
    })();

    const handover = db.prepare(`SELECT * FROM ae_ao_handovers WHERE id = ?`).get(newHandoverId);
    handover.documents = db.prepare(`SELECT * FROM ae_ao_handover_documents WHERE handover_id = ?`).all(newHandoverId);

    return res.status(201).json({ success: true, data: handover, message: 'Handover created successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
       return res.status(409).json({ success: false, code: 409, message: 'Duplicate handover request' });
    }
    next(error);
  }
});
"""

if "router.get('/jobs/:id/handovers'" not in content:
    content = content.replace("module.exports = router;", new_routes + "\nmodule.exports = router;")

with open(file_path, "w") as f:
    f.write(content)
print("aeRoutes.js patched for handovers.")
