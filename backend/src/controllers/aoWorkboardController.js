const db = require('../database/db');

class AoWorkboardController {
  
  // ==========================================
  // SUPERVISOR ENDPOINTS
  // ==========================================

  // GET /api/ao/supervisor/handovers
  static getHandovers(req, res) {
    try {
      const query = `
        SELECT 
          h.id as handover_event_id,
          h.id,
          h.export_job_id,
          h.handover_type,
          h.dokumen_package,
          h.remark as handover_remark,
          h.created_at as ae_handover_at,
          h.receiver_id,
          j.invoice_no,
          j.buyer,
          j.destination,
          j.ae_handover_status,
          u.nama as sender_name,
          r.nama as receiver_name
        FROM handover_events h
        JOIN export_jobs j ON h.export_job_id = j.id
        LEFT JOIN users u ON h.sender_id = u.id
        LEFT JOIN users r ON h.receiver_id = r.id
        WHERE h.status = 'PENDING' OR h.status IS NULL
        ORDER BY h.created_at DESC
      `;
      const raw = db.prepare(query).all();
      const handovers = raw.map(item => {
        let docs = [];
        try {
          docs = JSON.parse(item.dokumen_package);
          if (!Array.isArray(docs)) docs = [item.dokumen_package];
        } catch(e) {
          docs = item.dokumen_package ? item.dokumen_package.split(',').map(s => s.trim()) : [item.handover_type || 'Dokumen Export'];
        }
        return {
          ...item,
          documents: docs
        };
      });
      res.json({ success: true, data: handovers });
    } catch (err) {
      console.error('Error in getHandovers:', err);
      res.status(500).json({ success: false, message: 'Gagal mengambil data handovers' });
    }
  }

  // POST /api/ao/supervisor/handovers/:id/accept
  static acceptHandover(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;

      // Find handover event by event id or export_job_id
      let event = db.prepare("SELECT * FROM handover_events WHERE id = ?").get(id);
      if (!event) {
        event = db.prepare("SELECT * FROM handover_events WHERE export_job_id = ? AND (status = 'PENDING' OR status IS NULL) ORDER BY id DESC LIMIT 1").get(id);
      }

      const jobId = event ? event.export_job_id : id;
      const job = db.prepare("SELECT * FROM export_jobs WHERE id = ?").get(jobId);
      if (!job) return res.status(404).json({ success: false, message: "Job not found" });

      let docs = [];
      if (event && event.dokumen_package) {
        try {
          docs = JSON.parse(event.dokumen_package);
          if (!Array.isArray(docs)) docs = [event.dokumen_package];
        } catch(e) {
          docs = event.dokumen_package.split(',').map(s => s.trim());
        }
      } else if (event && event.handover_type) {
        docs = [event.handover_type];
      } else {
        docs = ['Dokumen Export'];
      }

      db.transaction(() => {
        const targetAssignee = (event && event.receiver_id) || job.ao_assignee_id || null;
        const stmtGetExisting = db.prepare('SELECT id, assigned_to FROM ao_tasks WHERE job_id = ? AND task_type = ?');
        const stmtInsert = db.prepare(`
          INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date)
          VALUES (?, 'DOC', ?, ?, ?, 'PENDING', 'NORMAL', date('now', '+2 days'))
        `);
        const stmtUpdate = db.prepare('UPDATE ao_tasks SET assigned_to = ? WHERE id = ?');

        // Create an AO verification task for each handed over document if not yet existing
        for (const doc of docs) {
          const taskType = `Verifikasi ${doc}`;
          const existing = stmtGetExisting.get(jobId, taskType);
          if (!existing) {
            stmtInsert.run(jobId, taskType, `Tugas verifikasi dari Handover AE untuk dokumen: ${doc}.`, targetAssignee);
          } else if (targetAssignee && !existing.assigned_to) {
            stmtUpdate.run(targetAssignee, existing.id);
          }
        }

        // Mark handover event as accepted
        if (event) {
          db.prepare(`
            UPDATE handover_events 
            SET status = 'ACCEPTED', accepted_at = datetime('now'), accepted_by_id = ?
            WHERE id = ?
          `).run(userId, event.id);
        }

        // Update export_jobs status
        db.prepare(`
          UPDATE export_jobs
          SET ao_assignee_id = COALESCE(?, ao_assignee_id),
              ao_status = CASE WHEN COALESCE(?, ao_assignee_id) IS NOT NULL THEN 'Assigned' ELSE 'In Progress' END
          WHERE id = ?
        `).run(targetAssignee, targetAssignee, jobId);
      })();

      res.json({ success: true, message: 'Handover dokumen berhasil diterima dan dicatat ke Tim AO.' });
    } catch(err) {
      console.error('Error in acceptHandover:', err);
      res.status(500).json({ success: false, message: 'Gagal menerima handover' });
    }
  }

  // GET /api/ao/supervisor/tasks
  static getSupervisorTasks(req, res) {
    try {
      const { staff_id } = req.query;
      let whereClause = '';
      let params = [];
      if (staff_id) {
        whereClause = 'WHERE t.assigned_to = ?';
        params.push(staff_id);
      }
      const query = `
        SELECT 
          t.*,
          j.job_code, j.invoice_no, j.buyer, j.destination, j.vessel,
          c.operational_alerts,
          u.nama as assignee_name
        FROM ao_tasks t
        JOIN export_jobs j ON t.job_id = j.id
        LEFT JOIN ao_job_context c ON c.job_id = j.id
        LEFT JOIN users u ON t.assigned_to = u.id
        ${whereClause}
        ORDER BY 
          CASE t.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END,
          t.due_date ASC
      `;
      const tasks = db.prepare(query).all(...params);
      res.json({ success: true, data: tasks });
    } catch (error) {
      console.error('Error in getSupervisorTasks:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data tasks' });
    }
  }

  // POST /api/ao/supervisor/tasks
  static createSupervisorTask(req, res) {
    try {
      const { job_id, workstream, task_type, description, assigned_to, due_date } = req.body;
      if (!job_id || !workstream || !task_type) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      db.transaction(() => {
        // Ensure ao_job_context exists
        db.prepare(`INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)`).run(job_id);

        const stmt = db.prepare(`
          INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, due_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(job_id, workstream, task_type, description, assigned_to || null, due_date || null);
        
        // Audit
        db.prepare(`
          INSERT INTO ao_task_audits (task_id, actor_id, action, new_value)
          VALUES (?, ?, 'CREATE', ?)
        `).run(result.lastInsertRowid, req.user.id, JSON.stringify(req.body));
      })();

      res.json({ success: true, message: 'Task created successfully' });
    } catch (error) {
      console.error('Error in createSupervisorTask:', error);
      res.status(500).json({ success: false, message: 'Gagal membuat task' });
    }
  }

  // PUT /api/ao/supervisor/tasks/:id/assign
  static assignTask(req, res) {
    try {
      const { id } = req.params;
      const { assigned_to, due_date } = req.body; 
      
      const task = db.prepare('SELECT assigned_to, due_date FROM ao_tasks WHERE id = ?').get(id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      db.transaction(() => {
        // Build update query dynamically
        let updates = ['updated_at = datetime(\'now\')'];
        let params = [];
        
        if (assigned_to !== undefined) {
          updates.push('assigned_to = ?');
          params.push(assigned_to);
        }
        if (due_date !== undefined) {
          updates.push('due_date = ?');
          params.push(due_date);
        }
        
        params.push(id);
        
        db.prepare(`UPDATE ao_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        
        db.prepare(`
          INSERT INTO ao_task_audits (task_id, actor_id, action, old_value, new_value)
          VALUES (?, ?, 'ASSIGN', ?, ?)
        `).run(id, req.user.id, JSON.stringify({ assigned_to: task.assigned_to, due_date: task.due_date }), JSON.stringify({ assigned_to, due_date }));
      })();

      res.json({ success: true, message: 'Task assigned successfully' });
    } catch (error) {
      console.error('Error in assignTask:', error);
      res.status(500).json({ success: false, message: 'Gagal assign task' });
    }
  }

  // GET /api/ao/supervisor/workload
  static getSupervisorWorkload(req, res) {
    try {
      const query = `
        SELECT 
          u.id as user_id, 
          u.nama as assignee_name,
          COUNT(t.id) as total_tasks,
          SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN t.status != 'COMPLETED' AND t.due_date < datetime('now') THEN 1 ELSE 0 END) as overdue_tasks,
          SUM(CASE WHEN t.status = 'WAITING' THEN 1 ELSE 0 END) as waiting_tasks
        FROM users u
        LEFT JOIN ao_tasks t ON t.assigned_to = u.id
        WHERE u.status_aktif = 1 
          AND ((u.level_otoritas = 'Staff Dept' AND u.departemen = 'Account Officer') OR u.departemen = 'DSCS')
        GROUP BY u.id
      `;
      const workload = db.prepare(query).all();
      res.json({ success: true, data: workload });
    } catch (error) {
      console.error('Error in getSupervisorWorkload:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil beban kerja' });
    }
  }

  // PUT /api/ao/supervisor/jobs/:job_id/alerts
  static updateOperationalAlerts(req, res) {
    try {
      const { job_id } = req.params;
      const { operational_alerts } = req.body;

      db.transaction(() => {
        db.prepare(`INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)`).run(job_id);
        db.prepare(`UPDATE ao_job_context SET operational_alerts = ?, updated_at = datetime('now') WHERE job_id = ?`).run(operational_alerts, job_id);
      })();

      res.json({ success: true, message: 'Operational alerts updated' });
    } catch (error) {
      console.error('Error in updateOperationalAlerts:', error);
      res.status(500).json({ success: false, message: 'Gagal update alerts' });
    }
  }

  // ==========================================
  // DOC PLANNER ENDPOINTS
  // ==========================================

  // GET /api/v2/ao-workboard/supervisor/doc-planner/jobs
  static getDocPlannerJobs(req, res) {
    try {
      const jobs = db.prepare(`
        SELECT 
          j.id, j.invoice_no, j.buyer, j.destination, j.etd, j.atd, j.vessel,
          j.ao_assignee_id, u.nama as ao_assignee_name,
          c.document_checklists, c.reminder_notes, c.terms_incoterm, c.terms_payment
        FROM export_jobs j
        LEFT JOIN users u ON j.ao_assignee_id = u.id
        LEFT JOIN ao_job_context c ON c.job_id = j.id
        WHERE j.ae_status NOT IN ('Completed', 'Cancelled')
          AND j.ao_status NOT IN ('Completed', 'Cancelled')
        ORDER BY 
          CASE WHEN j.etd IS NOT NULL THEN j.etd ELSE '9999-12-31' END ASC,
          j.id DESC
      `).all();

      const data = jobs.map(j => {
        let docs = [];
        if (j.document_checklists) {
          try { docs = JSON.parse(j.document_checklists); if (!Array.isArray(docs)) docs = []; } catch(e) {}
        }
        return { ...j, document_checklists: docs };
      });
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error in getDocPlannerJobs:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data Doc Planner' });
    }
  }

  // PUT /api/v2/ao-workboard/supervisor/jobs/:job_id/doc-plan
  static updateDocPlan(req, res) {
    try {
      const { job_id } = req.params;
      const { document_checklists, reminder_notes, terms_incoterm, terms_payment } = req.body;

      db.transaction(() => {
        db.prepare('INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)').run(job_id);
        
        let updates = [];
        let params = [];
        if (document_checklists !== undefined) {
          updates.push('document_checklists = ?');
          params.push(typeof document_checklists === 'string' ? document_checklists : JSON.stringify(document_checklists));
        }
        if (reminder_notes !== undefined) {
          updates.push('reminder_notes = ?');
          params.push(reminder_notes);
        }
        if (terms_incoterm !== undefined) {
          updates.push('terms_incoterm = ?');
          params.push(terms_incoterm);
        }
        if (terms_payment !== undefined) {
          updates.push('terms_payment = ?');
          params.push(terms_payment);
        }

        if (updates.length > 0) {
          updates.push("updated_at = datetime('now')");
          params.push(job_id);
          db.prepare(`UPDATE ao_job_context SET ${updates.join(', ')} WHERE job_id = ?`).run(...params);
        }

        // Sinkronisasi otomatis ke Staff AO terkait (Tasks & Status)
        const job = db.prepare('SELECT id, invoice_no, ao_assignee_id, ao_status FROM export_jobs WHERE id = ?').get(job_id);
        if (job && job.ao_assignee_id) {
          // Update status AO ke In Progress jika belum aktif
          if (['Pending', 'Not Started'].includes(job.ao_status)) {
            db.prepare("UPDATE export_jobs SET ao_status = 'In Progress', updated_at = datetime('now') WHERE id = ?").run(job_id);
          }

          // Generate tugas kelengkapan dokumen di ao_tasks untuk Staf AO
          if (Array.isArray(document_checklists)) {
            const stmtGetExisting = db.prepare('SELECT id, assigned_to FROM ao_tasks WHERE job_id = ? AND task_type = ?');
            const stmtInsert = db.prepare(`
              INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date)
              VALUES (?, 'DOC', ?, ?, ?, 'PENDING', 'NORMAL', date('now', '+2 days'))
            `);
            const stmtUpdateAssignee = db.prepare('UPDATE ao_tasks SET assigned_to = ? WHERE id = ?');
            const stmtDelete = db.prepare('DELETE FROM ao_tasks WHERE id = ?');

            // 1. Dapatkan daftar task kelengkapan saat ini
            const existingTasks = db.prepare("SELECT id, task_type FROM ao_tasks WHERE job_id = ? AND workstream = 'DOC' AND task_type LIKE 'Kelengkapan %'").all(job_id);
            const newDocNames = new Set(document_checklists.map(doc => `Kelengkapan ${doc.name}`));

            // 2. Hapus task lama yang sudah tidak ada di matrix baru
            for (const task of existingTasks) {
              if (!newDocNames.has(task.task_type)) {
                stmtDelete.run(task.id);
              }
            }

            // 3. Tambahkan atau update task yang ada di matrix baru
            for (const doc of document_checklists) {
              const taskType = `Kelengkapan ${doc.name}`;
              const existing = stmtGetExisting.get(job_id, taskType);
              if (!existing) {
                stmtInsert.run(job_id, taskType, `Instruksi SO Terms (${doc.category || 'Dokumen'}): ${doc.name}. ${reminder_notes || ''}`, job.ao_assignee_id);
              } else if (!existing.assigned_to) {
                stmtUpdateAssignee.run(job.ao_assignee_id, existing.id);
              }
            }
          }
        }
      })();

      res.json({ success: true, message: 'SO Terms & Matrix Dokumen berhasil disimpan dan diteruskan ke Staf AO' });
    } catch (error) {
      console.error('Error in updateDocPlan:', error);
      res.status(500).json({ success: false, message: 'Gagal update Doc Plan: ' + error.message });
    }
  }

  // ==========================================
  // STAFF ENDPOINTS
  // ==========================================

  // GET /api/ao/staff/tasks (legacy, kept for backward compat)
  static getStaffTasks(req, res) {
    try {
      const query = `
        SELECT 
          t.*,
          j.job_code, j.invoice_no, j.buyer, j.destination, j.vessel,
          c.operational_alerts
        FROM ao_tasks t
        JOIN export_jobs j ON t.job_id = j.id
        LEFT JOIN ao_job_context c ON c.job_id = j.id
        WHERE t.assigned_to = ? AND t.workstream != 'DSCS'
        ORDER BY 
          CASE t.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END,
          t.due_date ASC
      `;
      const tasks = db.prepare(query).all(req.user.id);
      res.json({ success: true, data: tasks });
    } catch (error) {
      console.error('Error in getStaffTasks:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil tasks' });
    }
  }

  // ==========================================
  // PHASE 13: STAFF AO MY JOBS (7 EXCEL FIELD GROUPS)
  // ==========================================

  // GET /api/v2/ao-workboard/staff/my-jobs
  // Returns all active jobs assigned to the logged-in AO Staff with all 7 Excel Daily field groups
  static getStaffMyJobs(req, res) {
    try {
      const jobs = db.prepare(`
        SELECT
          j.id, j.invoice_no, j.job_code,
          j.buyer, j.product_type, j.container_qty, j.destination,
          j.fwd_trucking, j.liner, j.etd, j.eta, j.atd, j.req_trucking,
          j.bl_mbl, j.cc_non_cc, j.pi, j.coo_form,
          j.ae_handover_status, j.ae_handover_at,
          j.ao_status, j.ao_remarks,
          ae_u.nama as ae_assignee_name,
          ao_u.nama as ao_assignee_name,
          c.operational_alerts, c.operational_status, c.current_action,
          c.pending_docs, c.remarks,
          c.email_draft_date, c.email_ori_date,
          c.dscs_due_date, c.dscs_done_date, c.dscs_status,
          c.cc_due_date, c.cc_done_date,
          c.courier_status, c.bank_submission_status,
          c.ds_date, c.fishing_gear, c.jml_fv, c.total_cont_fcl, c.species,
          c.atd as ao_atd, c.eta_update,
          c.terms_incoterm, c.terms_payment,
          c.document_stage, c.document_checklists, c.reminder_notes,
          c.category_tracking,
          c.completed_at, c.completed_by_id,
          (SELECT COUNT(*) FROM ao_tasks t WHERE t.job_id = j.id AND t.status = 'PENDING' AND t.assigned_to = j.ao_assignee_id) as pending_task_count
        FROM export_jobs j
        LEFT JOIN users ae_u ON j.ae_assignee_id = ae_u.id
        LEFT JOIN users ao_u ON j.ao_assignee_id = ao_u.id
        LEFT JOIN ao_job_context c ON c.job_id = j.id
        WHERE j.ao_assignee_id = ?
          AND (c.document_stage IS NULL OR c.document_stage != 'COMPLETED')
          AND j.ao_status NOT IN ('Completed', 'Cancelled')
        ORDER BY
          CASE WHEN j.etd IS NOT NULL THEN j.etd ELSE '9999-12-31' END ASC,
          j.id DESC
      `).all(req.user.id);

      res.json({ success: true, data: jobs });
    } catch (error) {
      console.error('Error in getStaffMyJobs:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data pekerjaan AO' });
    }
  }

  // PUT /api/v2/ao-workboard/staff/jobs/:job_id/execution
  // Update operational execution fields for a job (7 Excel field groups D, E, F, G)
  static updateJobExecution(req, res) {
    try {
      const { job_id } = req.params;
      const {
        operational_status, current_action, pending_docs, remarks,
        email_draft_date, email_ori_date,
        cc_due_date, cc_done_date,
        dscs_due_date, dscs_done_date, dscs_status,
        courier_status, bank_submission_status,
        eta_update, document_stage, document_checklists,
        category_tracking
      } = req.body;

      const job = db.prepare('SELECT ao_assignee_id FROM export_jobs WHERE id = ?').get(job_id);
      if (!job) return res.status(404).json({ success: false, message: 'Job tidak ditemukan' });

      // RBAC: only assigned AO staff (or supervisor/manager) can update
      if (req.user.level_otoritas === 'Staff Dept' && job.ao_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Anda tidak ditugaskan ke job ini' });
      }

      db.transaction(() => {
        // Ensure context row exists
        db.prepare('INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)').run(job_id);

        db.prepare(`
          UPDATE ao_job_context SET
            operational_status = COALESCE(?, operational_status),
            current_action = COALESCE(?, current_action),
            pending_docs = COALESCE(?, pending_docs),
            remarks = COALESCE(?, remarks),
            email_draft_date = COALESCE(?, email_draft_date),
            email_ori_date = COALESCE(?, email_ori_date),
            cc_due_date = COALESCE(?, cc_due_date),
            cc_done_date = COALESCE(?, cc_done_date),
            dscs_due_date = COALESCE(?, dscs_due_date),
            dscs_done_date = COALESCE(?, dscs_done_date),
            dscs_status = COALESCE(?, dscs_status),
            courier_status = COALESCE(?, courier_status),
            bank_submission_status = COALESCE(?, bank_submission_status),
            eta_update = COALESCE(?, eta_update),
            document_stage = COALESCE(?, document_stage),
            document_checklists = COALESCE(?, document_checklists),
            category_tracking = COALESCE(?, category_tracking),
            updated_at = datetime('now')
          WHERE job_id = ?
        `).run(
          operational_status, current_action, pending_docs, remarks,
          email_draft_date, email_ori_date,
          cc_due_date, cc_done_date,
          dscs_due_date, dscs_done_date, dscs_status,
          courier_status, bank_submission_status,
          eta_update || null, document_stage || null, document_checklists || null,
          category_tracking || null,
          job_id
        );

        // Audit the update
        const auditTask = db.prepare(
          'SELECT id FROM ao_tasks WHERE job_id = ? AND workstream = ? ORDER BY id ASC LIMIT 1'
        ).get(job_id, 'AO_CORE');
        if (auditTask) {
          db.prepare(`
            INSERT INTO ao_task_audits (task_id, actor_id, action, new_value)
            VALUES (?, ?, 'UPDATE', ?)
          `).run(auditTask.id, req.user.id, JSON.stringify({ operational_status, current_action, pending_docs, remarks }));
        }
      })();

      res.json({ success: true, message: 'Data eksekusi pekerjaan berhasil diperbarui' });
    } catch (error) {
      console.error('Error in updateJobExecution:', error);
      res.status(500).json({ success: false, message: 'Gagal memperbarui data eksekusi' });
    }
  }

  // ==========================================
  // PHASE 13: STAFF AO HANDOVER INBOX
  // ==========================================

  // GET /api/v2/ao-workboard/staff/handovers
  // Returns pending handovers destined for the logged-in AO Staff (assigned by Ka Vicky)
  static getStaffHandovers(req, res) {
    try {
      const handovers = db.prepare(`
        SELECT
          he.id, he.export_job_id, he.handover_type, he.dokumen_package,
          he.remark as handover_remark, he.created_at as handover_at,
          he.status, he.accepted_at,
          j.invoice_no, j.buyer, j.destination, j.etd, j.eta,
          j.product_type, j.container_qty,
          ae_u.nama as ae_sender_name
        FROM handover_events he
        JOIN export_jobs j ON he.export_job_id = j.id
        LEFT JOIN users ae_u ON he.sender_id = ae_u.id
        WHERE he.receiver_id = ?
        ORDER BY
          CASE he.status WHEN 'PENDING' THEN 0 ELSE 1 END ASC,
          he.created_at DESC
      `).all(req.user.id);

      const result = handovers.map(h => {
        let docs = [];
        try {
          docs = JSON.parse(h.dokumen_package);
          if (!Array.isArray(docs)) docs = [h.dokumen_package];
        } catch(e) {
          docs = h.dokumen_package ? h.dokumen_package.split(',').map(s => s.trim()) : [h.handover_type || 'Dokumen Export'];
        }
        return { ...h, documents: docs };
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error in getStaffHandovers:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data handover masuk' });
    }
  }

  // POST /api/v2/ao-workboard/staff/handovers/:id/accept
  // AO Staff confirms receipt of handover -> generates verification tasks
  static acceptStaffHandover(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const handover = db.prepare('SELECT * FROM handover_events WHERE id = ?').get(id);
      if (!handover) return res.status(404).json({ success: false, message: 'Handover tidak ditemukan' });

      // RBAC: only the receiver can accept, or supervisor/manager
      if (req.user.level_otoritas === 'Staff Dept' && handover.receiver_id !== userId) {
        return res.status(403).json({ success: false, message: 'Anda tidak berhak menerima handover ini' });
      }

      if (handover.status === 'ACCEPTED') {
        return res.status(400).json({ success: false, message: 'Handover ini sudah diterima sebelumnya' });
      }

      let docs = [];
      try {
        docs = JSON.parse(handover.dokumen_package);
        if (!Array.isArray(docs)) docs = [handover.dokumen_package];
      } catch(e) {
        docs = handover.dokumen_package ? handover.dokumen_package.split(',').map(s => s.trim()) : [handover.handover_type || 'Dokumen Export'];
      }

      db.transaction(() => {
        // 1. Mark handover as accepted
        db.prepare(`
          UPDATE handover_events
          SET status = 'ACCEPTED', accepted_at = datetime('now'), accepted_by_id = ?
          WHERE id = ?
        `).run(userId, id);

        // 2. Ensure ao_job_context row exists
        db.prepare('INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)').run(handover.export_job_id);

        // 3. Create document verification tasks for each document
        const stmtGetExistingTask = db.prepare('SELECT id FROM ao_tasks WHERE job_id = ? AND task_type = ?');
        const stmtInsertTask = db.prepare(`
          INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date)
          VALUES (?, 'DOC', ?, ?, ?, 'PENDING', 'NORMAL', date('now', '+2 days'))
        `);

        for (const doc of docs) {
          const taskType = `Verifikasi: ${doc}`;
          const existing = stmtGetExistingTask.get(handover.export_job_id, taskType);
          if (!existing) {
            stmtInsertTask.run(handover.export_job_id, taskType, `Verifikasi dan pemrosesan dokumen: ${doc}`, userId);
          }
        }

        // 4. Update export_jobs ao_status to In Progress
        db.prepare(`
          UPDATE export_jobs SET ao_status = 'In Progress', updated_at = datetime('now')
          WHERE id = ? AND (ao_status = 'Assigned' OR ao_status IS NULL)
        `).run(handover.export_job_id);
      })();

      res.json({ success: true, message: 'Handover berhasil diterima. Tugas verifikasi dokumen telah dibuat di workboard Anda.' });
    } catch (error) {
      console.error('Error in acceptStaffHandover:', error);
      res.status(500).json({ success: false, message: 'Gagal menerima handover' });
    }
  }

  // PUT /api/ao/staff/tasks/:id/status
  static updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      
      const task = db.prepare('SELECT status, remarks, assigned_to FROM ao_tasks WHERE id = ?').get(id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      // RBAC Validation for Staff
      if (req.user.level_otoritas === 'Staff Dept' && req.user.departemen !== 'DSCS' && task.assigned_to?.toString() !== req.user.id?.toString()) {
          console.error(`[RBAC 403] user.id=${req.user.id}, task.assigned_to=${task.assigned_to}, level=${req.user.level_otoritas}, dept=${req.user.departemen}`);
          return res.status(403).json({ success: false, message: 'Access forbidden. You are not assigned to this task.' });
      }

      db.transaction(() => {
        db.prepare('UPDATE ao_tasks SET status = ?, remarks = COALESCE(?, remarks), updated_at = datetime(\'now\') WHERE id = ?').run(status, remarks || null, id);
        
        db.prepare(`
          INSERT INTO ao_task_audits (task_id, actor_id, action, old_value, new_value)
          VALUES (?, ?, 'STATUS_CHANGE', ?, ?)
        `).run(
            id, req.user.id, 
            JSON.stringify({ status: task.status, remarks: task.remarks }), 
            JSON.stringify({ status, remarks: remarks || null })
        );
      })();

      res.json({ success: true, message: 'Task updated successfully' });
    } catch (error) {
      console.error('Error in updateTaskStatus:', error);
      res.status(500).json({ success: false, message: 'Gagal update task: ' + error.message });
    }
  }

  // ==========================================
  // PHASE 13: DSCS PERSONAL WORKSPACE (KHUSUS ERICA)
  // ==========================================

  // GET /api/v2/ao-workboard/dscs/my-work
  // Returns DSCS jobs assigned to Erica (strict scope: only Erica or Supervisor/Manager can access)
  static getDscsMyWork(req, res) {
    try {
      // RBAC: Staff Dept can only see their own DSCS jobs
      const isStaff = req.user.level_otoritas === 'Staff Dept';
      const isDscsScope = req.user.personal_notes === 'scope:DSCS' || req.user.employee_id === 'DSCS-01';

      if (isStaff && !isDscsScope) {
        return res.status(403).json({
          success: false,
          message: 'Halaman ini adalah bilik kerja personal DSCS khusus Erica. Anda tidak memiliki akses.'
        });
      }

      // For staff: only their own DSCS tasks. For supervisor/manager: all DSCS tasks
      const assigneeFilter = isStaff ? `AND c_task.assigned_to = ${req.user.id}` : '';

      const jobs = db.prepare(`
        SELECT
          j.id as job_id, j.invoice_no, j.buyer, j.destination, j.etd, j.eta,
          j.container_qty,
          c.id as context_id, c.species, c.ds_date, c.fishing_gear,
          c.jml_fv, c.total_cont_fcl, c.dscs_status, c.dscs_done_date,
          c.remarks as dscs_remarks, c.operational_alerts,
          c.dscs_due_date,
          erica_u.nama as assigned_to_name,
          dscs_t.id as dscs_task_id, dscs_t.status as task_status,
          dscs_t.due_date as task_due_date, dscs_t.remarks as task_remarks,
          dscs_t.created_at as task_created_at, dscs_t.updated_at as task_updated_at
        FROM export_jobs j
        JOIN ao_job_context c ON c.job_id = j.id
        JOIN ao_tasks dscs_t ON (dscs_t.job_id = j.id AND dscs_t.workstream = 'DSCS')
        LEFT JOIN users erica_u ON dscs_t.assigned_to = erica_u.id
        WHERE 1=1 ${isStaff ? 'AND dscs_t.assigned_to = ' + req.user.id : ''}
        ORDER BY
          CASE dscs_t.status WHEN 'PENDING' THEN 0 WHEN 'IN_PROGRESS' THEN 1 WHEN 'WAITING' THEN 2 ELSE 3 END ASC,
          CASE WHEN j.etd IS NOT NULL THEN j.etd ELSE '9999-12-31' END ASC
      `).all();

      res.json({ success: true, data: jobs });
    } catch (error) {
      console.error('Error in getDscsMyWork:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data DSCS' });
    }
  }

  // Legacy getDscsTasks (supervisor view, kept for backward compat)
  static getDscsTasks(req, res) {
    try {
      const query = `
        SELECT 
          t.*,
          j.job_code, j.invoice_no, j.buyer, j.destination, j.vessel, j.etd, j.eta,
          c.operational_alerts, c.ds_date, c.fishing_gear, c.jml_fv, c.species,
          c.dscs_status, c.dscs_done_date, c.dscs_due_date, c.total_cont_fcl,
          u.nama as assignee_name
        FROM ao_tasks t
        JOIN export_jobs j ON t.job_id = j.id
        LEFT JOIN ao_job_context c ON c.job_id = j.id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.workstream = 'DSCS'
        ORDER BY t.due_date ASC
      `;
      const tasks = db.prepare(query).all();
      res.json({ success: true, data: tasks });
    } catch (error) {
      console.error('Error in getDscsTasks:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil DSCS tasks' });
    }
  }

  // PUT /api/v2/ao-workboard/dscs/jobs/:job_id/update
  // Erica updates DSCS fields for her assigned job
  static updateDscsJob(req, res) {
    try {
      const { job_id } = req.params;
      const {
        species, ds_date, fishing_gear, jml_fv, total_cont_fcl,
        dscs_status, dscs_done_date, dscs_due_date, remarks
      } = req.body;

      // RBAC: Only Erica (DSCS scope staff) or Supervisor/Manager
      const isStaff = req.user.level_otoritas === 'Staff Dept';
      const isDscsScope = req.user.personal_notes === 'scope:DSCS' || req.user.employee_id === 'DSCS-01';
      if (isStaff && !isDscsScope) {
        return res.status(403).json({ success: false, message: 'Hanya Erica (DSCS Staff) yang dapat memperbarui data DSCS' });
      }

      // If Erica is staff, verify this DSCS job is actually assigned to her
      if (isStaff) {
        const task = db.prepare('SELECT id, assigned_to FROM ao_tasks WHERE job_id = ? AND workstream = ?').get(job_id, 'DSCS');
        if (!task || task.assigned_to !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Job DSCS ini tidak ditugaskan kepada Anda' });
        }
      }

      db.transaction(() => {
        db.prepare('INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)').run(job_id);

        db.prepare(`
          UPDATE ao_job_context SET
            species = COALESCE(?, species),
            ds_date = COALESCE(?, ds_date),
            fishing_gear = COALESCE(?, fishing_gear),
            jml_fv = COALESCE(?, jml_fv),
            total_cont_fcl = COALESCE(?, total_cont_fcl),
            dscs_status = COALESCE(?, dscs_status),
            dscs_done_date = COALESCE(?, dscs_done_date),
            dscs_due_date = COALESCE(?, dscs_due_date),
            remarks = COALESCE(?, remarks),
            updated_at = datetime('now')
          WHERE job_id = ?
        `).run(species, ds_date, fishing_gear, jml_fv, total_cont_fcl, dscs_status, dscs_done_date, dscs_due_date, remarks, job_id);

        // Update task status if dscs_status is COMPLETED
        if (dscs_status === 'COMPLETED') {
          db.prepare(`
            UPDATE ao_tasks SET status = 'COMPLETED', updated_at = datetime('now')
            WHERE job_id = ? AND workstream = 'DSCS'
          `).run(job_id);
        } else if (dscs_status === 'IN_PROGRESS' || dscs_status === 'VERIFICATION') {
          db.prepare(`
            UPDATE ao_tasks SET status = 'IN_PROGRESS', updated_at = datetime('now')
            WHERE job_id = ? AND workstream = 'DSCS'
          `).run(job_id);
        }

        // Audit
        const dscsTask = db.prepare('SELECT id FROM ao_tasks WHERE job_id = ? AND workstream = ? LIMIT 1').get(job_id, 'DSCS');
        if (dscsTask) {
          db.prepare(`
            INSERT INTO ao_task_audits (task_id, actor_id, action, new_value)
            VALUES (?, ?, 'UPDATE', ?)
          `).run(dscsTask.id, req.user.id, JSON.stringify({ dscs_status, dscs_done_date, fishing_gear, jml_fv, remarks }));
        }
      })();

      res.json({ success: true, message: 'Data DSCS berhasil diperbarui' });
    } catch (error) {
      console.error('Error in updateDscsJob:', error);
      res.status(500).json({ success: false, message: 'Gagal memperbarui data DSCS' });
    }
  }

  // GET /api/v2/ao-workboard/dscs/jobs/:job_id/history
  // Returns audit history for a DSCS job
  static getDscsHistory(req, res) {
    try {
      const { job_id } = req.params;

      const history = db.prepare(`
        SELECT
          a.id, a.action, a.old_value, a.new_value, a.created_at,
          u.nama as actor_name, u.employee_id as actor_emp_id
        FROM ao_task_audits a
        JOIN ao_tasks t ON a.task_id = t.id
        JOIN users u ON a.actor_id = u.id
        WHERE t.job_id = ? AND t.workstream = 'DSCS'
        ORDER BY a.created_at DESC
        LIMIT 50
      `).all(job_id);

      res.json({ success: true, data: history });
    } catch (error) {
      console.error('Error in getDscsHistory:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil riwayat DSCS' });
    }
  }
  // ==========================================
  // AE → AO PAIRING CENTER ENDPOINTS
  // ==========================================

  // GET /api/v2/ao-workboard/supervisor/ao-staff
  // Returns list of active AO staff for dropdown selection in Pairing Center
  static getAoStaffList(req, res) {
    try {
      const staff = db.prepare(`
        SELECT u.id, u.employee_id, u.nama,
          (SELECT COUNT(t.id) FROM ao_tasks t WHERE t.assigned_to = u.id AND t.status NOT IN ('COMPLETED','CANCELLED')) as active_tasks
        FROM users u
        WHERE u.status_aktif = 1
          AND u.level_otoritas = 'Staff Dept'
          AND u.departemen = 'Account Officer'
          AND (u.personal_notes IS NULL OR u.personal_notes NOT LIKE '%scope:DSCS%')
          AND u.employee_id NOT LIKE 'DSCS-%'
        ORDER BY u.nama ASC
      `).all();
      res.json({ success: true, data: staff });
    } catch (err) {
      console.error('Error in getAoStaffList:', err);
      res.status(500).json({ success: false, message: 'Gagal mengambil daftar Staf AO' });
    }
  }

  // GET /api/v2/ao-workboard/supervisor/dscs-staff
  // Returns list of DSCS specialists
  static getDscsStaffList(req, res) {
    try {
      const staff = db.prepare(`
        SELECT id, employee_id, nama
        FROM users
        WHERE status_aktif = 1
          AND (departemen = 'DSCS' OR personal_notes = 'scope:DSCS' OR employee_id = 'DSCS-01')
      `).all();
      res.json({ success: true, data: staff });
    } catch (err) {
      console.error('Error in getDscsStaffList:', err);
      res.status(500).json({ success: false, message: 'Gagal mengambil daftar PIC DSCS' });
    }
  }

  // GET /api/v2/ao-workboard/supervisor/pairing-jobs
  // Returns all active export jobs that have an AE assignee (assigned by Ka Amel),
  // sorted by priority (unpaired first, then by ETD ascending)
  static getPairingJobs(req, res) {
    try {
      const jobs = db.prepare(`
        SELECT
          j.id, j.invoice_no, j.job_code, j.buyer, j.destination,
          j.vessel, j.etd, j.closing_docs, j.closing_docs_time,
          j.container_qty, j.liner, j.fasilitas_kite, j.description_goods, j.product_type,
          j.ae_status, j.ae_handover_status, j.ae_handover_at,
          j.ao_assignee_id, j.ao_status, j.ao_remarks,
          j.dscs_assignee_id,
          ae_u.id as ae_user_id, ae_u.nama as ae_assignee_name, ae_u.employee_id as ae_employee_id,
          ao_u.nama as ao_assignee_name, ao_u.employee_id as ao_employee_id,
          dscs_u.nama as dscs_assignee_name, dscs_u.employee_id as dscs_employee_id,
          c.dscs_due_date, c.terms_incoterm, c.terms_payment,
          (SELECT COUNT(t.id) FROM ao_tasks t WHERE t.job_id = j.id AND t.status NOT IN ('COMPLETED','CANCELLED') AND t.workstream != 'DSCS') as pending_ao_tasks,
          (SELECT status FROM ao_tasks t WHERE t.job_id = j.id AND t.workstream = 'DSCS' LIMIT 1) as dscs_task_status
        FROM export_jobs j
        JOIN users ae_u ON j.ae_assignee_id = ae_u.id
        LEFT JOIN users ao_u ON j.ao_assignee_id = ao_u.id
        LEFT JOIN users dscs_u ON j.dscs_assignee_id = dscs_u.id
        LEFT JOIN ao_job_context c ON c.job_id = j.id
        WHERE j.ae_status NOT IN ('Completed','Cancelled')
          AND j.ae_assignee_id IS NOT NULL
        ORDER BY
          CASE WHEN j.ao_assignee_id IS NULL THEN 0 ELSE 1 END ASC,
          CASE WHEN j.etd IS NOT NULL THEN j.etd ELSE '9999-12-31' END ASC,
          j.id DESC
      `).all();
      res.json({ success: true, data: jobs });
    } catch (err) {
      console.error('Error in getPairingJobs:', err);
      res.status(500).json({ success: false, message: 'Gagal mengambil data pairing jobs' });
    }
  }

  // PUT /api/v2/ao-workboard/supervisor/jobs/:job_id/pair
  // Ka Vicky pairs / re-pairs an AO staff to an invoice
  static pairJob(req, res) {
    try {
      const { job_id } = req.params;
      const { ao_assignee_id, remarks, dscs_assignee_id, dscs_due_date, terms_incoterm, terms_payment, document_checklists } = req.body;
      const actorId = req.user ? req.user.id : null;

      if (!ao_assignee_id) {
        return res.status(400).json({ success: false, message: 'ao_assignee_id diperlukan untuk pairing' });
      }

      const job = db.prepare('SELECT id, invoice_no, ao_assignee_id FROM export_jobs WHERE id = ?').get(job_id);
      if (!job) return res.status(404).json({ success: false, message: 'Job tidak ditemukan' });

      const aoStaff = db.prepare("SELECT id, nama FROM users WHERE id = ? AND status_aktif = 1 AND level_otoritas = 'Staff Dept' AND departemen = 'Account Officer'").get(ao_assignee_id);
      if (!aoStaff) return res.status(400).json({ success: false, message: 'Staf AO tidak valid atau tidak aktif' });

      let dscsStaff = null;
      if (dscs_assignee_id) {
        dscsStaff = db.prepare("SELECT id, nama FROM users WHERE id = ? AND status_aktif = 1").get(dscs_assignee_id);
        if (!dscsStaff) return res.status(400).json({ success: false, message: 'PIC DSCS tidak valid atau tidak aktif' });
      }

      db.transaction(() => {
        // 1. Update export_jobs
        db.prepare(`
          UPDATE export_jobs
          SET ao_assignee_id = ?,
              dscs_assignee_id = ?,
              ao_remarks = ?,
              ao_status = 'Assigned',
              updated_at = datetime('now')
          WHERE id = ?
        `).run(ao_assignee_id, dscs_assignee_id || null, remarks || null, job_id);

        // 1b. Save terms & checklist into ao_job_context
        db.prepare('INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)').run(job_id);
        const termsUpdates = [];
        const termsParams = [];
        if (terms_incoterm) { termsUpdates.push('terms_incoterm = ?'); termsParams.push(terms_incoterm); }
        if (terms_payment) { termsUpdates.push('terms_payment = ?'); termsParams.push(terms_payment); }
        if (dscs_due_date) { termsUpdates.push('dscs_due_date = ?'); termsParams.push(dscs_due_date); }
        if (document_checklists) { termsUpdates.push('document_checklists = ?'); termsParams.push(typeof document_checklists === 'string' ? document_checklists : JSON.stringify(document_checklists)); }
        if (termsUpdates.length > 0) {
          termsUpdates.push("updated_at = datetime('now')");
          termsParams.push(job_id);
          db.prepare(`UPDATE ao_job_context SET ${termsUpdates.join(', ')} WHERE job_id = ?`).run(...termsParams);
        }

        // 2. Update existing unassigned ao_tasks for this job (excluding DSCS workstream)
        db.prepare(`
          UPDATE ao_tasks
          SET assigned_to = ?, updated_at = datetime('now')
          WHERE job_id = ? AND workstream != 'DSCS' AND (assigned_to IS NULL OR assigned_to = 0)
        `).run(ao_assignee_id, job_id);

        // 3. Handle DSCS Workstream task
        if (dscs_assignee_id) {
          // If DSCS task exists, assign it to the new PIC
          const dscsTask = db.prepare("SELECT id FROM ao_tasks WHERE job_id = ? AND workstream = 'DSCS'").get(job_id);
          if (dscsTask) {
            db.prepare("UPDATE ao_tasks SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?").run(dscs_assignee_id, dscsTask.id);
          } else {
            db.prepare(`
              INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority)
              VALUES (?, 'DSCS', 'Penerbitan Dokumen', 'Pengecekan kesesuaian data tangkap nelayan', ?, 'PENDING', 'NORMAL')
            `).run(job_id, dscs_assignee_id);
          }
          // Ensure ao_job_context exists so Erica has context
          db.prepare("INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)").run(job_id);
        } else {
          // If DSCS PIC is cleared, remove any unstarted pending DSCS tasks
          db.prepare("DELETE FROM ao_tasks WHERE job_id = ? AND workstream = 'DSCS' AND status = 'PENDING'").run(job_id);
        }

        // 4. Update pending handover_events without a receiver
        db.prepare(`
          UPDATE handover_events
          SET receiver_id = ?
          WHERE export_job_id = ? AND (receiver_id IS NULL) AND (status = 'PENDING' OR status IS NULL)
        `).run(ao_assignee_id, job_id);
      })();

      res.json({
        success: true,
        message: dscs_assignee_id 
          ? `Berhasil mencocokkan ${job.invoice_no} ke Staf AO: ${aoStaff.nama} & DSCS: ${dscsStaff.nama}`
          : `Berhasil mencocokkan ${job.invoice_no} ke Staf AO: ${aoStaff.nama}`,
        data: { job_id, ao_assignee_id, ao_assignee_name: aoStaff.nama, dscs_assignee_id, dscs_assignee_name: dscsStaff?.nama, ao_remarks: remarks }
      });
    } catch (err) {
      console.error('Error in pairJob:', err);
      res.status(500).json({ success: false, message: 'Gagal melakukan pairing Staf AO: ' + err.message });
    }
  }

  // ==========================================
  // PHASE 15: STAGES MONITORING & COMPLETED VAULT
  // ==========================================

  // GET /api/v2/ao-workboard/supervisor/stages-monitoring
  // Returns all active AO jobs with 5-stage document progress, filterable by staff and stage
  static getStagesMonitoring(req, res) {
    try {
      const { staff_id, stage, search } = req.query;

      let whereClause = `WHERE j.ao_assignee_id IS NOT NULL AND j.ao_status NOT IN ('Cancelled')`;
      let params = [];

      // Exclude completed jobs (they go to completed vault)
      whereClause += ` AND (c.document_stage IS NULL OR c.document_stage != 'COMPLETED')`;

      if (staff_id) {
        whereClause += ` AND j.ao_assignee_id = ?`;
        params.push(staff_id);
      }
      if (stage) {
        whereClause += ` AND c.document_stage = ?`;
        params.push(stage);
      }
      if (search) {
        whereClause += ` AND (j.invoice_no LIKE ? OR j.buyer LIKE ? OR j.vessel LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q);
      }

      const jobs = db.prepare(`
        SELECT
          j.id, j.invoice_no, j.job_code, j.buyer, j.destination,
          j.vessel, j.liner, j.etd, j.eta, j.atd, j.container_qty,
          j.product_type, j.description_goods,
          j.ao_assignee_id, j.dscs_assignee_id,
          ao_u.nama as ao_assignee_name, ao_u.employee_id as ao_employee_id,
          dscs_u.nama as dscs_assignee_name,
          c.document_stage, c.document_checklists,
          c.terms_incoterm, c.terms_payment,
          c.eta_update, c.atd as ao_atd,
          c.dscs_status, c.dscs_due_date, c.dscs_done_date,
          c.operational_status, c.operational_alerts
        FROM export_jobs j
        LEFT JOIN users ao_u ON j.ao_assignee_id = ao_u.id
        LEFT JOIN users dscs_u ON j.dscs_assignee_id = dscs_u.id
        LEFT JOIN ao_job_context c ON c.job_id = j.id
        ${whereClause}
        ORDER BY
          CASE c.document_stage
            WHEN 'PREPARATION' THEN 1
            WHEN 'DRAFT' THEN 2
            WHEN 'FINAL_DRAFT' THEN 3
            WHEN 'ORIGINAL' THEN 4
            WHEN 'SUBMIT_BANK' THEN 5
            ELSE 0
          END ASC,
          CASE WHEN j.etd IS NOT NULL THEN j.etd ELSE '9999-12-31' END ASC,
          j.id DESC
      `).all(...params);

      res.json({ success: true, data: jobs });
    } catch (error) {
      console.error('Error in getStagesMonitoring:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data monitoring tahapan' });
    }
  }

  // PUT /api/v2/ao-workboard/supervisor/jobs/:job_id/stage
  // Update the document stage for a job
  static updateDocumentStage(req, res) {
    try {
      const { job_id } = req.params;
      const { document_stage } = req.body;

      const validStages = ['PREPARATION', 'DRAFT', 'FINAL_DRAFT', 'ORIGINAL', 'SUBMIT_BANK', 'COMPLETED'];
      if (!validStages.includes(document_stage)) {
        return res.status(400).json({ success: false, message: `Tahapan tidak valid. Pilihan: ${validStages.join(', ')}` });
      }

      db.transaction(() => {
        db.prepare('INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)').run(job_id);
        db.prepare(`UPDATE ao_job_context SET document_stage = ?, updated_at = datetime('now') WHERE job_id = ?`).run(document_stage, job_id);
      })();

      res.json({ success: true, message: `Tahapan dokumen berhasil diubah ke ${document_stage}` });
    } catch (error) {
      console.error('Error in updateDocumentStage:', error);
      res.status(500).json({ success: false, message: 'Gagal memperbarui tahapan dokumen' });
    }
  }

  // PUT /api/v2/ao-workboard/staff/jobs/:job_id/checklist
  // Update the document checklist JSON for a job
  static updateDocumentChecklist(req, res) {
    try {
      const { job_id } = req.params;
      const { document_checklists } = req.body;

      if (!document_checklists) {
        return res.status(400).json({ success: false, message: 'document_checklists diperlukan' });
      }

      const job = db.prepare('SELECT ao_assignee_id FROM export_jobs WHERE id = ?').get(job_id);
      if (!job) return res.status(404).json({ success: false, message: 'Job tidak ditemukan' });

      // RBAC: only assigned AO staff or supervisor/manager
      if (req.user.level_otoritas === 'Staff Dept' && job.ao_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Anda tidak ditugaskan ke job ini' });
      }

      const checklistStr = typeof document_checklists === 'string' ? document_checklists : JSON.stringify(document_checklists);

      db.transaction(() => {
        db.prepare('INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)').run(job_id);
        db.prepare(`UPDATE ao_job_context SET document_checklists = ?, updated_at = datetime('now') WHERE job_id = ?`).run(checklistStr, job_id);
      })();

      res.json({ success: true, message: 'Checklist dokumen berhasil diperbarui' });
    } catch (error) {
      console.error('Error in updateDocumentChecklist:', error);
      res.status(500).json({ success: false, message: 'Gagal memperbarui checklist dokumen' });
    }
  }

  // PUT /api/v2/ao-workboard/jobs/:job_id/complete
  // Mark a shipment/job as completed
  static completeJob(req, res) {
    try {
      const { job_id } = req.params;
      const userId = req.user.id;

      const job = db.prepare('SELECT id, invoice_no, ao_assignee_id FROM export_jobs WHERE id = ?').get(job_id);
      if (!job) return res.status(404).json({ success: false, message: 'Job tidak ditemukan' });

      db.transaction(() => {
        // 1. Mark ao_job_context as completed
        db.prepare('INSERT OR IGNORE INTO ao_job_context (job_id) VALUES (?)').run(job_id);
        db.prepare(`
          UPDATE ao_job_context
          SET document_stage = 'COMPLETED',
              completed_at = datetime('now'),
              completed_by_id = ?,
              updated_at = datetime('now')
          WHERE job_id = ?
        `).run(userId, job_id);

        // 2. Update export_jobs ao_status
        db.prepare(`
          UPDATE export_jobs
          SET ao_status = 'Completed',
              updated_at = datetime('now')
          WHERE id = ?
        `).run(job_id);

        // 3. Complete all remaining AO tasks
        db.prepare(`
          UPDATE ao_tasks
          SET status = 'COMPLETED', updated_at = datetime('now')
          WHERE job_id = ? AND status NOT IN ('COMPLETED', 'CANCELLED')
        `).run(job_id);
      })();

      res.json({ success: true, message: `Shipment ${job.invoice_no} berhasil diselesaikan dan masuk ke penampung shipment selesai.` });
    } catch (error) {
      console.error('Error in completeJob:', error);
      res.status(500).json({ success: false, message: 'Gagal menyelesaikan shipment' });
    }
  }

  // GET /api/v2/ao-workboard/supervisor/completed-shipments
  // Returns completed shipments sorted by invoice number ascending (numeric)
  static getCompletedShipments(req, res) {
    try {
      const { search } = req.query;
      let whereClause = `WHERE c.document_stage = 'COMPLETED'`;
      let params = [];

      if (search) {
        whereClause += ` AND (j.invoice_no LIKE ? OR j.buyer LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q);
      }

      const jobs = db.prepare(`
        SELECT
          j.id, j.invoice_no, j.job_code, j.buyer, j.destination,
          j.vessel, j.liner, j.etd, j.eta, j.atd, j.container_qty,
          j.product_type,
          j.ao_assignee_id, j.dscs_assignee_id,
          ao_u.nama as ao_assignee_name,
          dscs_u.nama as dscs_assignee_name,
          c.completed_at, c.terms_incoterm, c.terms_payment,
          c.document_stage,
          comp_u.nama as completed_by_name
        FROM export_jobs j
        JOIN ao_job_context c ON c.job_id = j.id
        LEFT JOIN users ao_u ON j.ao_assignee_id = ao_u.id
        LEFT JOIN users dscs_u ON j.dscs_assignee_id = dscs_u.id
        LEFT JOIN users comp_u ON c.completed_by_id = comp_u.id
        ${whereClause}
        ORDER BY CAST(REPLACE(REPLACE(j.invoice_no, 'INV-', ''), 'INV', '') AS INTEGER) ASC, j.invoice_no ASC
      `).all(...params);

      res.json({ success: true, data: jobs });
    } catch (error) {
      console.error('Error in getCompletedShipments:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data shipment selesai' });
    }
  }
}

module.exports = AoWorkboardController;
