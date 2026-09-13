/**
 * sourceRoutes.js
 * 
 * API routes for Log Schedule source ingestion & management.
 * Mounted at /api/v2/source
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const LogScheduleParser = require('../../services/logSchedule/LogScheduleParser');
const LogScheduleValidator = require('../../services/logSchedule/LogScheduleValidator');
const SourceSyncEngine = require('../../services/logSchedule/SourceSyncEngine');

// ─── Multer config for Excel uploads ──────────────────────────────────────
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `log-schedule-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file Excel (.xlsx, .xls) yang diperbolehkan.'));
    }
  }
});

// All source routes require authentication
router.use(authenticateToken);

// ─── Middleware: Restrict Source Management to AE Supervisor or Manager ───
// Import Department / other staff are NOT allowed to perform source ingestion
const requireSourceManagement = (req, res, next) => {
  if (!req.user || !req.user.level_otoritas) {
    return res.status(401).json({ success: false, error: 'User not authenticated.' });
  }
  // Manager has full cross-department access
  if (req.user.level_otoritas === 'Manager') {
    return next();
  }
  // AE Supervisor manages upstream Log Schedule source ingestion for AE/AO
  if (req.user.level_otoritas === 'Supervisor' && req.user.departemen === 'Administrasi Export') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Akses ditolak. Manajemen Log Schedule Source hanya dapat diakses oleh Supervisor AE atau Manager.'
  });
};

// ─── Middleware: Restrict Source Viewing to AE/AO Supervisor or Manager ───
const requireSourceViewing = (req, res, next) => {
  if (!req.user || !req.user.level_otoritas) {
    return res.status(401).json({ success: false, error: 'User not authenticated.' });
  }
  // Manager has full cross-department access
  if (req.user.level_otoritas === 'Manager') {
    return next();
  }
  // AE Supervisor or AO Supervisor can view Log Schedule
  if (req.user.level_otoritas === 'Supervisor' && (req.user.departemen === 'Administrasi Export' || req.user.departemen === 'Account Officer')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Akses ditolak. Monitoring Log Schedule Source hanya dapat diakses oleh Supervisor (AE/AO) atau Manager.'
  });
};

// ─── Danger: Wipe All Data (Dev Only) ────────────────────────
router.delete('/dev/wipe-all', requireRole(['Supervisor', 'Manager', 'System Admin']), (req, res, next) => {
  try {
    const statements = [
      'DELETE FROM ae_ao_handover_documents',
      'DELETE FROM ae_ao_handovers',
      'DELETE FROM ae_job_activity_results',
      'DELETE FROM ae_job_document_activities',
      'DELETE FROM ae_job_document_versions',
      'DELETE FROM ae_document_activity_audit',
      'DELETE FROM ae_job_documents',
      'DELETE FROM ae_job_checklist_items',
      'DELETE FROM ae_job_checklists',
      'DELETE FROM job_checklist_items',
      'DELETE FROM ae_supervisor_milestones',
      'DELETE FROM ae_job_operational_data',
      'DELETE FROM ae_job_blockers',
      'DELETE FROM containers',
      'DELETE FROM invoices',
      'DELETE FROM debit_notes',
      'DELETE FROM ae_document_checklists',
      'DELETE FROM ae_followup_records',
      'DELETE FROM ae_discrepancies',
      'DELETE FROM match_review_cases',
      'DELETE FROM source_identity_events',
      'DELETE FROM source_record_changes',
      'DELETE FROM source_records',
      'DELETE FROM export_jobs',
      'DELETE FROM source_imports'
    ];
    
    const transaction = db.transaction(() => {
      for (let sql of statements) {
        db.prepare(sql).run();
      }
    });
    
    transaction();
    return res.json({ success: true, message: 'Seluruh data Pipeline dan Import telah direset!' });
  } catch (error) {
    next(error);
  }
});

// ─── Middleware: Read Access for AE / AO Jobs ─────────────────────────────
const requireJobsReadAccess = (req, res, next) => {
  if (!req.user || !req.user.level_otoritas) {
    return res.status(401).json({ success: false, error: 'User not authenticated.' });
  }
  if (req.user.level_otoritas === 'Manager') {
    return next();
  }
  if (['Administrasi Export', 'Account Officer'].includes(req.user.departemen)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Akses ditolak. Hanya departemen AE, AO, atau Manager yang dapat mengakses data export jobs.'
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /upload — Upload Log Schedule Excel file
// ═══════════════════════════════════════════════════════════════════════════
router.post('/upload', requireSourceManagement, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File tidak ditemukan. Harap upload file Excel.' });
    }

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        storedPath: req.file.path,
        storedName: req.file.filename,
        sizeKb: Math.round(req.file.size / 1024 * 10) / 10,
      },
      message: 'File berhasil diupload. Lanjutkan ke validasi.'
    });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /validate — Validate uploaded file (returns preview/diff)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/validate', requireSourceManagement, (req, res, next) => {
  try {
    const { storedName } = req.body;
    if (!storedName) {
      return res.status(400).json({ success: false, error: 'storedName wajib diisi.' });
    }

    const filePath = path.join(uploadsDir, storedName);

    // 1. Parse Excel
    const parsed = LogScheduleParser.parse(filePath);
    if (parsed.errors.length > 0) {
      return res.json({
        success: true,
        data: {
          valid: false,
          fileErrors: parsed.errors,
          totalRows: 0,
          preview: null,
        }
      });
    }

    // 2. Validate columns
    const colCheck = LogScheduleParser.validateColumns(parsed.headers);
    if (!colCheck.valid) {
      return res.json({
        success: true,
        data: {
          valid: false,
          fileErrors: [`Kolom wajib tidak ditemukan: ${colCheck.missingColumns.join(', ')}`],
          totalRows: parsed.totalRows,
          matchedHeaders: parsed.headers,
          unmatchedHeaders: parsed.unmatchedHeaders,
          preview: null,
        }
      });
    }

    // 3. Validate and group rows
    const { groups, invalidRows, allErrors } = LogScheduleValidator.validateAndGroup(parsed.rows);

    // 4. Classify records by comparing with existing DB
    const preview = [];
    for (const [businessKey, group] of groups) {
      const normalized = LogScheduleValidator.normalizeRow(group.mergedRow);
      const existingJob = db.prepare('SELECT * FROM export_jobs WHERE business_key = ?').get(businessKey);

      let action = 'NEW';
      let changes = [];

      if (existingJob) {
        changes = SourceSyncEngine._detectChanges(existingJob, normalized);
        action = changes.length > 0 ? 'UPDATED' : 'UNCHANGED';
      }

      preview.push({
        businessKey,
        action,
        completeness: group.completeness,
        identityStrength: group.identityStrength,
        sourceRows: group.sourceRowNumbers,
        invoiceNo: normalized.raw_invoice_no,
        noBc: normalized.raw_no_bc,
        buyer: normalized.raw_buyer,
        destination: normalized.raw_destination,
        etd: normalized.raw_etd,
        closingDocs: normalized.raw_closing_docs,
        closingDocsTime: normalized.raw_closing_docs_time,
        vessel: normalized.raw_vessel,
        existingJobCode: existingJob ? existingJob.job_code : null,
        changes: changes.map(c => ({ field: c.field, old: c.oldValue, new: c.newValue })),
      });
    }

    // 5. Summary counts
    const actionCounts = { NEW: 0, UPDATED: 0, UNCHANGED: 0, INCOMPLETE: 0, INVALID: invalidRows.length };
    preview.forEach(p => {
      actionCounts[p.action]++;
      if (p.completeness !== 'COMPLETE') actionCounts.INCOMPLETE++;
    });

    const warnings = allErrors.filter(e => e.severity === 'warning');
    const errors   = allErrors.filter(e => e.severity === 'error' || !e.severity);

    res.json({
      success: true,
      data: {
        valid: true,
        totalRows: parsed.totalRows,
        matchedHeaders: parsed.headers,
        unmatchedHeaders: parsed.unmatchedHeaders,
        summary: actionCounts,
        preview,
        invalidRows: invalidRows.map(ir => ({
          excelRow: ir.excelRow,
          invoiceNo: ir.row.raw_invoice_no || null,
          noBc: ir.row.raw_no_bc || null,
          errors: ir.errors.map(e => e.message),
        })),
        warnings: warnings.map(w => w.message),
        validationErrors: errors.map(e => e.message),
      }
    });

  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /import — Execute the import/sync
// ═══════════════════════════════════════════════════════════════════════════
router.post('/import', requireSourceManagement, (req, res, next) => {
  try {
    const { storedName, fileName } = req.body;
    if (!storedName) {
      return res.status(400).json({ success: false, error: 'storedName wajib diisi.' });
    }

    const filePath = path.join(uploadsDir, storedName);
    const fileSizeKb = Math.round(fs.statSync(filePath).size / 1024 * 10) / 10;

    // 1. Parse
    const parsed = LogScheduleParser.parse(filePath);
    if (parsed.errors.length > 0) {
      return res.status(400).json({ success: false, error: parsed.errors.join('; ') });
    }

    // 2. Validate and group
    const { groups, invalidRows } = LogScheduleValidator.validateAndGroup(parsed.rows);

    // Normalize all groups
    for (const [key, group] of groups) {
      group.mergedRow = LogScheduleValidator.normalizeRow(group.mergedRow);
    }

    // 3. Generate import code
    const year = new Date().getFullYear();
    const prefix = `LS-${year}-`;
    const records = db.prepare(
      "SELECT import_code FROM source_imports WHERE import_code LIKE ?"
    ).all(`${prefix}%`);
    
    let maxNum = 0;
    for (const r of records) {
      const numStr = r.import_code.replace(prefix, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    const importCode = `${prefix}${String(nextNum).padStart(3, '0')}`;

    // 4. Create source_imports record
    const importResult = db.prepare(`
      INSERT INTO source_imports (import_code, file_name, file_path, file_size_kb, rows_read, uploaded_by_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(importCode, fileName || storedName, filePath, fileSizeKb, parsed.totalRows, req.user.id);

    const importId = importResult.lastInsertRowid;

    // 5. Execute sync
    const { summary, details } = SourceSyncEngine.execute({
      importId,
      groups,
      invalidRows,
      userId: req.user.id,
    });

    // 6. Audit log
    try {
      db.prepare(`
        INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description)
        VALUES (?, 'IMPORT', 'LOG_SCHEDULE', ?, ?)
      `).run(req.user.id, importId, `Log Schedule import: ${summary.new} new, ${summary.updated} updated, ${summary.unchanged} unchanged, ${summary.invalid} invalid`);
    } catch (e) {
      console.error('Audit log failed:', e.message);
    }

    res.json({
      success: true,
      data: {
        importId,
        importCode,
        fileName: fileName || storedName,
        summary,
        details: details.slice(0, 50), // Limit detail response size
        totalDetails: details.length,
      },
      message: `Import selesai: ${summary.new} baru, ${summary.updated} diperbarui, ${summary.unchanged} tidak berubah, ${summary.invalid} tidak valid.`
    });

  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /imports — List import history
// ═══════════════════════════════════════════════════════════════════════════
router.get('/imports', requireSourceViewing, (req, res, next) => {
  try {
    const showArchived = req.query.archived === 'true';
    
    const imports = db.prepare(`
      SELECT si.*, u.nama as uploaded_by_name
      FROM source_imports si
      LEFT JOIN users u ON si.uploaded_by_id = u.id
      WHERE si.is_archived = ?
      ORDER BY si.created_at DESC
      LIMIT 50
    `).all(showArchived ? 1 : 0);

    res.json({ success: true, data: imports });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /imports/active/changes — Get active source changes summary
// ═══════════════════════════════════════════════════════════════════════════
router.get('/imports/active/changes', requireSourceViewing, (req, res, next) => {
  try {
    const activeImport = db.prepare(`
      SELECT si.*, u.nama as uploaded_by_name
      FROM source_imports si
      LEFT JOIN users u ON si.uploaded_by_id = u.id
      WHERE si.is_archived = 0
      ORDER BY si.created_at DESC
      LIMIT 1
    `).get();

    if (!activeImport) {
      return res.json({ success: true, data: { activeImport: null, changes: [] } });
    }

    const changes = db.prepare(`
      SELECT src.*, ej.job_code, ej.business_key, ej.buyer, ej.destination, ej.vessel
      FROM source_record_changes src
      LEFT JOIN export_jobs ej ON src.export_job_id = ej.id
      WHERE src.source_import_id = ?
      ORDER BY src.changed_at DESC
      LIMIT 100
    `).all(activeImport.id);

    res.json({ success: true, data: { activeImport, changes } });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /active-schedule — Get all records of the active Log Schedule import
// ═══════════════════════════════════════════════════════════════════════════
router.get('/active-schedule', requireSourceViewing, (req, res, next) => {
  try {
    const activeImport = db.prepare(`
      SELECT si.*, u.nama as uploaded_by_name
      FROM source_imports si
      LEFT JOIN users u ON si.uploaded_by_id = u.id
      WHERE si.is_archived = 0
      ORDER BY si.created_at DESC
      LIMIT 1
    `).get();

    if (!activeImport) {
      return res.json({ success: true, data: { activeImport: null, records: [] } });
    }

    const records = db.prepare(`
      SELECT sr.*,
             ej.id as export_job_id,
             ej.job_code,
             ej.ae_status,
             ej.ae_assignee_id,
             ae_u.nama as ae_assignee_name,
             ae_u.employee_id as ae_employee_id,
             ej.ao_assignee_id,
             ao_u.nama as ao_assignee_name,
             ao_u.employee_id as ao_employee_id,
             ej.ao_status,
             ej.ao_remarks,
             ej.ae_handover_status,
             ej.ae_handover_at,
             ej.vessel,
             ej.destination,
             ej.buyer,
             ej.etd,
             ej.closing_docs
      FROM source_records sr
      LEFT JOIN export_jobs ej ON sr.export_job_id = ej.id
      LEFT JOIN users ae_u ON ej.ae_assignee_id = ae_u.id
      LEFT JOIN users ao_u ON ej.ao_assignee_id = ao_u.id
      WHERE sr.source_import_id = ?
      ORDER BY sr.raw_etd ASC, sr.id ASC
    `).all(activeImport.id);

    res.json({
      success: true,
      data: {
        activeImport,
        records,
      }
    });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /imports/:id — Import detail
// ═══════════════════════════════════════════════════════════════════════════
router.get('/imports/:id', requireSourceViewing, (req, res, next) => {
  try {
    const { id } = req.params;

    const importRecord = db.prepare(`
      SELECT si.*, u.nama as uploaded_by_name
      FROM source_imports si
      LEFT JOIN users u ON si.uploaded_by_id = u.id
      WHERE si.id = ?
    `).get(id);

    if (!importRecord) {
      return res.status(404).json({ success: false, error: 'Import tidak ditemukan.' });
    }

    // Get source records for this import
    const records = db.prepare(`
      SELECT sr.*, ej.job_code
      FROM source_records sr
      LEFT JOIN export_jobs ej ON sr.export_job_id = ej.id
      WHERE sr.source_import_id = ?
      ORDER BY sr.id
    `).all(id);

    // Get changes for this import
    const changes = db.prepare(`
      SELECT src.*, ej.job_code
      FROM source_record_changes src
      LEFT JOIN export_jobs ej ON src.export_job_id = ej.id
      WHERE src.source_import_id = ?
      ORDER BY src.changed_at
    `).all(id);

    res.json({
      success: true,
      data: {
        import: importRecord,
        records,
        changes,
      }
    });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /imports/:id — Safe delete or archive test import
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/imports/:id', requireSourceManagement, (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    
    // 1. Check if import exists
    const imp = db.prepare('SELECT * FROM source_imports WHERE id = ?').get(id);
    if (!imp) {
      return res.status(404).json({ success: false, code: 404, message: 'Import not found' });
    }

    if (force === 'true') {
        const statements = [
          // 1. Handover dependencies
          'DELETE FROM ae_ao_handover_documents WHERE handover_id IN (SELECT id FROM ae_ao_handovers WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?))',
          'DELETE FROM ae_ao_handovers WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          
          // 2. Document dependencies
          'DELETE FROM ae_job_activity_results WHERE job_document_activity_id IN (SELECT id FROM ae_job_document_activities WHERE job_document_version_id IN (SELECT id FROM ae_job_document_versions WHERE job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?))))',
          'DELETE FROM ae_job_document_activities WHERE job_document_version_id IN (SELECT id FROM ae_job_document_versions WHERE job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)))',
          'DELETE FROM ae_job_document_versions WHERE job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?))',
          'DELETE FROM ae_document_activity_audit WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          'DELETE FROM ae_job_documents WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',

          // 3. Old Phase 8 Checklists
          'DELETE FROM ae_job_checklist_items WHERE job_checklist_id IN (SELECT id FROM ae_job_checklists WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?))',
          'DELETE FROM ae_job_checklists WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',

          // 4. New Phase 9 Checklists & Milestones
          'DELETE FROM job_checklist_items WHERE export_job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          'DELETE FROM ae_supervisor_milestones WHERE export_job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',

          // 5. Direct Job Dependencies
          'DELETE FROM ae_job_operational_data WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          'DELETE FROM ae_job_blockers WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          
          // 6. AO / Shipment Dependencies
          'DELETE FROM containers WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          'DELETE FROM invoices WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          'DELETE FROM debit_notes WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          'DELETE FROM ae_document_checklists WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          'DELETE FROM ae_followup_records WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
          'DELETE FROM ae_discrepancies WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',

          // 7. Identity Events and Match Cases
          'DELETE FROM match_review_cases WHERE source_import_id = ?',
          'DELETE FROM source_identity_events WHERE source_import_id = ?',
          'DELETE FROM source_record_changes WHERE source_import_id = ?',

          // 8. Core Jobs and Source Records (CRITICAL ORDER: source_records depends on export_jobs, export_jobs depends on source_imports)
          'DELETE FROM source_records WHERE source_import_id = ?',
          'DELETE FROM export_jobs WHERE first_import_id = ? OR last_import_id = ?',
          
          // 9. Root
          'DELETE FROM source_imports WHERE id = ?'
        ];
        
        const transaction = db.transaction(() => {
          for (let sql of statements) {
            if (sql.includes('OR last_import_id')) {
              db.prepare(sql).run(id, id);
            } else {
              db.prepare(sql).run(id);
            }
          }
        });
        
        transaction();
        return res.json({ success: true, action: 'DELETED', message: 'Import dan semua Job yang berkaitan telah dihapus permanen.' });
    }

    // 2. Production check (if not forced)
    if (imp.records_new > 0 || imp.records_updated > 0) {
      return res.status(400).json({ success: false, code: 400, message: 'Protected production import cannot be deleted or archived.' });
    }

    // 3. Dependency check in export_jobs
    const depCount = db.prepare('SELECT count(*) as count FROM export_jobs WHERE first_import_id = ? OR last_import_id = ?').get(id, id).count;
    
    if (depCount > 0) {
      // Must archive instead of hard delete
      db.prepare('UPDATE source_imports SET is_archived = 1 WHERE id = ?').run(id);
      return res.json({ success: true, action: 'ARCHIVED', message: 'Test import archived because jobs depend on it.' });
    } else {
      // Hard delete safe
      const deleteChanges = db.prepare('DELETE FROM source_record_changes WHERE source_record_id IN (SELECT id FROM source_records WHERE source_import_id = ?)');
      const deleteRecords = db.prepare('DELETE FROM source_records WHERE source_import_id = ?');
      const deleteImport = db.prepare('DELETE FROM source_imports WHERE id = ?');
      
      const transaction = db.transaction(() => {
        deleteChanges.run(id);
        deleteRecords.run(id);
        deleteImport.run(id);
      });
      
      transaction();
      
      return res.json({ success: true, action: 'DELETED', message: 'Test import permanently deleted.' });
    }

  } catch (error) {
    console.error('Failed to delete/archive import', error);
    next(error);
  }
});
// ═══════════════════════════════════════════════════════════════════════════
// GET /jobs — List all export jobs (AE work queue)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/jobs', requireJobsReadAccess, (req, res, next) => {
  try {
    const { ae_status, ao_status, assignee, sort } = req.query;

    let where = '1=1';
    const params = [];

    if (ae_status) {
      where += ' AND ej.ae_status = ?';
      params.push(ae_status);
    }
    if (ao_status) {
      where += ' AND ej.ao_status = ?';
      params.push(ao_status);
    }
    if (assignee) {
      where += ' AND (ej.ae_assignee_id = ? OR ej.ao_assignee_id = ?)';
      params.push(assignee, assignee);
    }

    let orderBy = 'ej.closing_docs ASC, ej.etd ASC'; // Default: closest deadline first
    if (sort === 'etd') orderBy = 'ej.etd ASC';
    if (sort === 'created') orderBy = 'ej.created_at DESC';
    if (sort === 'updated') orderBy = 'ej.updated_at DESC';

    const jobs = db.prepare(`
      SELECT ej.*,
        ae_u.nama as ae_assignee_name,
        ao_u.nama as ao_assignee_name,
        creator.nama as created_by_name
      FROM export_jobs ej
      LEFT JOIN users ae_u ON ej.ae_assignee_id = ae_u.id
      LEFT JOIN users ao_u ON ej.ao_assignee_id = ao_u.id
      LEFT JOIN users creator ON ej.created_by_id = creator.id
      WHERE ${where}
      ORDER BY ${orderBy}
    `).all(...params);

    res.json({ success: true, data: jobs });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /jobs/:id — Single export job detail
// ═══════════════════════════════════════════════════════════════════════════
router.get('/jobs/:id', requireJobsReadAccess, (req, res, next) => {
  try {
    const job = db.prepare(`
      SELECT ej.*,
        ae_u.nama as ae_assignee_name,
        ao_u.nama as ao_assignee_name,
        creator.nama as created_by_name
      FROM export_jobs ej
      LEFT JOIN users ae_u ON ej.ae_assignee_id = ae_u.id
      LEFT JOIN users ao_u ON ej.ao_assignee_id = ao_u.id
      LEFT JOIN users creator ON ej.created_by_id = creator.id
      WHERE ej.id = ?
    `).get(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job tidak ditemukan.' });
    }

    // Get change history for this job
    const changeHistory = db.prepare(`
      SELECT src.*, si.import_code, si.file_name
      FROM source_record_changes src
      LEFT JOIN source_imports si ON src.source_import_id = si.id
      WHERE src.export_job_id = ?
      ORDER BY src.changed_at DESC
      LIMIT 100
    `).all(req.params.id);

    res.json({ success: true, data: { job, changeHistory } });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /jobs/:id/ae — Update AE-owned operational fields
// ═══════════════════════════════════════════════════════════════════════════
router.patch('/jobs/:id/ae', (req, res, next) => {
  try {
    const { id } = req.params;
    const { ae_assignee_id, ae_status, ae_progress, ae_remarks, ae_checklist, ae_handover_status, version } = req.body;

    const existing = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Job tidak ditemukan.' });
    if (version !== undefined && existing.version !== version) {
      return res.status(409).json({ success: false, error: 'Data sudah diubah oleh pengguna lain. Harap refresh.' });
    }

    // Build dynamic update
    const updates = [];
    const params = [];

    if (ae_assignee_id !== undefined) { updates.push('ae_assignee_id = ?'); params.push(ae_assignee_id); }
    if (ae_status !== undefined) { updates.push('ae_status = ?'); params.push(ae_status); }
    if (ae_progress !== undefined) { updates.push('ae_progress = ?'); params.push(ae_progress); }
    if (ae_remarks !== undefined) { updates.push('ae_remarks = ?'); params.push(ae_remarks); }
    if (ae_checklist !== undefined) { updates.push('ae_checklist = ?'); params.push(typeof ae_checklist === 'string' ? ae_checklist : JSON.stringify(ae_checklist)); }
    if (ae_handover_status !== undefined) {
      updates.push('ae_handover_status = ?');
      params.push(ae_handover_status);
      if (ae_handover_status === 'Draft Shared' || ae_handover_status === 'Final Shared' || ae_handover_status === 'Completed') {
        updates.push("ae_handover_at = datetime('now')");
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Tidak ada field yang diupdate.' });
    }

    updates.push("updated_at = datetime('now')");
    updates.push('version = version + 1');

    const sql = `UPDATE export_jobs SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    const result = db.prepare(sql).run(...params);
    if (result.changes === 0) {
      return res.status(409).json({ success: false, error: 'Update gagal.' });
    }

    // Audit
    try {
      db.prepare(`
        INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, reference, description)
        VALUES (?, 'UPDATE', 'EXPORT_JOB_AE', ?, ?, ?)
      `).run(req.user.id, id, existing.job_code, `AE fields updated: ${updates.filter(u => !u.includes('updated_at') && !u.includes('version')).join(', ')}`);
    } catch (e) {}

    const updated = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(id);
    res.json({ success: true, data: updated, message: 'Data AE berhasil diperbarui.' });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /jobs/:id/ao — Update AO-owned operational fields
// ═══════════════════════════════════════════════════════════════════════════
router.patch('/jobs/:id/ao', (req, res, next) => {
  try {
    const { id } = req.params;
    const { ao_assignee_id, ao_status, ao_progress, ao_remarks, ao_checklist, ao_verification_status, ao_completion_status, version } = req.body;

    const existing = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Job tidak ditemukan.' });
    if (version !== undefined && existing.version !== version) {
      return res.status(409).json({ success: false, error: 'Data sudah diubah oleh pengguna lain. Harap refresh.' });
    }

    const updates = [];
    const params = [];

    if (ao_assignee_id !== undefined) { updates.push('ao_assignee_id = ?'); params.push(ao_assignee_id); }
    if (ao_status !== undefined) { updates.push('ao_status = ?'); params.push(ao_status); }
    if (ao_progress !== undefined) { updates.push('ao_progress = ?'); params.push(ao_progress); }
    if (ao_remarks !== undefined) { updates.push('ao_remarks = ?'); params.push(ao_remarks); }
    if (ao_checklist !== undefined) { updates.push('ao_checklist = ?'); params.push(typeof ao_checklist === 'string' ? ao_checklist : JSON.stringify(ao_checklist)); }
    if (ao_verification_status !== undefined) { updates.push('ao_verification_status = ?'); params.push(ao_verification_status); }
    if (ao_completion_status !== undefined) { updates.push('ao_completion_status = ?'); params.push(ao_completion_status); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Tidak ada field yang diupdate.' });
    }

    updates.push("updated_at = datetime('now')");
    updates.push('version = version + 1');

    const sql = `UPDATE export_jobs SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    db.prepare(sql).run(...params);

    // Audit
    try {
      db.prepare(`
        INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, reference, description)
        VALUES (?, 'UPDATE', 'EXPORT_JOB_AO', ?, ?, ?)
      `).run(req.user.id, id, existing.job_code, `AO fields updated`);
    } catch (e) {}

    const updated = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(id);
    res.json({ success: true, data: updated, message: 'Data AO berhasil diperbarui.' });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /match-review — List pending ambiguous identity cases (Phase 2)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/match-review', requireSourceManagement, (req, res, next) => {
  try {
    const { status = 'PENDING_REVIEW' } = req.query;

    const cases = db.prepare(`
      SELECT
        mrc.*,
        sr.raw_invoice_no, sr.raw_no_bc, sr.raw_buyer, sr.raw_destination,
        si.import_code, si.file_name, si.started_at as import_date,
        u_uploader.nama as uploaded_by_name,
        u_resolver.nama as resolved_by_name
      FROM match_review_cases mrc
      LEFT JOIN source_records sr ON mrc.source_record_id = sr.id
      LEFT JOIN source_imports si ON mrc.source_import_id = si.id
      LEFT JOIN users u_uploader  ON si.uploaded_by_id = u_uploader.id
      LEFT JOIN users u_resolver  ON mrc.resolved_by_user_id = u_resolver.id
      WHERE mrc.status = ?
      ORDER BY mrc.created_at DESC
    `).all(status);

    // Enrich with candidate job details
    const enriched = cases.map(c => {
      let candidates = [];
      try {
        const ids = JSON.parse(c.candidate_job_ids || '[]');
        candidates = ids.map(jobId => {
          const job = db.prepare(`
            SELECT id, job_code, business_key, invoice_no, no_bc, buyer, destination,
                   closing_docs, etd, ae_status, ae_assignee_id
            FROM export_jobs WHERE id = ?
          `).get(jobId);
          return job || { id: jobId, error: 'Job not found' };
        });
      } catch {}
      return { ...c, candidates };
    });

    res.json({ success: true, data: enriched, count: enriched.length });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /match-review/:id/resolve — Resolve an ambiguous identity case (Phase 2)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/match-review/:id/resolve', requireSourceManagement, (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, targetJobId, notes } = req.body;

    // Valid resolutions
    const VALID_RESOLUTIONS = ['RESOLVED_MERGED', 'RESOLVED_NEW', 'RESOLVED_IGNORED'];
    if (!VALID_RESOLUTIONS.includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: `Invalid resolution. Must be one of: ${VALID_RESOLUTIONS.join(', ')}`
      });
    }

    const reviewCase = db.prepare('SELECT * FROM match_review_cases WHERE id = ?').get(id);
    if (!reviewCase) {
      return res.status(404).json({ success: false, error: 'Match review case not found.' });
    }
    if (reviewCase.status !== 'PENDING_REVIEW') {
      return res.status(409).json({ success: false, error: `Case is already resolved (status: ${reviewCase.status}).` });
    }

    if (resolution === 'RESOLVED_MERGED' && !targetJobId) {
      return res.status(400).json({ success: false, error: 'targetJobId is required for RESOLVED_MERGED.' });
    }

    // Perform resolution in a transaction
    const resolveTransaction = db.transaction(() => {
      // 1. Update the case
      db.prepare(`
        UPDATE match_review_cases SET
          status = ?, resolved_by_user_id = ?, resolved_job_id = ?,
          resolution_notes = ?, resolved_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(resolution, req.user.id, targetJobId || null, notes || null, id);

      // 2. If MERGED: update the source_record to point to the chosen job
      if (resolution === 'RESOLVED_MERGED' && targetJobId) {
        const targetJob = db.prepare('SELECT id, business_key FROM export_jobs WHERE id = ?').get(targetJobId);
        if (!targetJob) throw new Error(`Target job ${targetJobId} not found.`);

        db.prepare(`
          UPDATE source_records SET
            export_job_id = ?, sync_action = 'UPDATED'
          WHERE id = ?
        `).run(targetJobId, reviewCase.source_record_id);

        // Update the job's last_import_id
        db.prepare('UPDATE export_jobs SET last_import_id = ?, updated_at = datetime(\'now\'), version = version + 1 WHERE id = ?')
          .run(reviewCase.source_import_id, targetJobId);
      }

      // 3. Log identity event
      db.prepare(`
        INSERT INTO source_identity_events
          (action, export_job_id, source_record_id, source_import_id,
           old_business_key, new_business_key,
           old_identity_strength, new_identity_strength,
           reason, actor_user_id, match_review_case_id)
        VALUES ('MATCH_REVIEW_RESOLVED', ?, ?, ?, ?, ?, 'FALLBACK', ?, ?, ?, ?)
      `).run(
        targetJobId || null,
        reviewCase.source_record_id,
        reviewCase.source_import_id,
        `INV:${reviewCase.incoming_invoice}`,
        targetJobId ? (db.prepare('SELECT business_key FROM export_jobs WHERE id = ?').get(targetJobId) || {}).business_key : null,
        resolution === 'RESOLVED_MERGED' ? 'STRONG' : 'NONE',
        `Human resolved match review: ${resolution}. ${notes || ''}`,
        req.user.id,
        parseInt(id)
      );
    });

    resolveTransaction();

    const updatedCase = db.prepare('SELECT * FROM match_review_cases WHERE id = ?').get(id);
    res.json({
      success: true,
      data: updatedCase,
      message: `Match review case resolved as ${resolution}.`
    });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /identity-events — List source identity audit events (Phase 2)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/identity-events', requireSourceManagement, (req, res, next) => {
  try {
    const { jobId, importId, action } = req.query;
    let where = '1=1';
    const params = [];

    if (jobId)   { where += ' AND sie.export_job_id = ?';    params.push(jobId); }
    if (importId){ where += ' AND sie.source_import_id = ?'; params.push(importId); }
    if (action)  { where += ' AND sie.action = ?';           params.push(action); }

    const events = db.prepare(`
      SELECT
        sie.*,
        ej.invoice_no, ej.buyer, ej.destination,
        si.import_code,
        u.nama as actor_name
      FROM source_identity_events sie
      LEFT JOIN export_jobs ej ON sie.export_job_id = ej.id
      LEFT JOIN source_imports si ON sie.source_import_id = si.id
      LEFT JOIN users u ON sie.actor_user_id = u.id
      WHERE ${where}
      ORDER BY sie.created_at DESC
      LIMIT 200
    `).all(...params);

    res.json({ success: true, data: events });
  } catch (error) { next(error); }
});


// ═══════════════════════════════════════════════════════════════════════════
// GET /match-reviews — Fetch pending match review cases
// ═══════════════════════════════════════════════════════════════════════════
router.get('/match-reviews', requireSourceManagement, (req, res, next) => {
  try {
    const cases = db.prepare(`
      SELECT 
        m.*,
        s.raw_invoice_no, s.raw_destination, s.raw_buyer, s.raw_etd, s.raw_closing_docs,
        i.file_name as source_file_name
      FROM match_review_cases m
      JOIN source_records s ON m.source_record_id = s.id
      JOIN source_imports i ON m.source_import_id = i.id
      WHERE m.status = 'PENDING_REVIEW'
      ORDER BY m.id ASC
    `).all();

    // Fetch candidates for each case
    for (const c of cases) {
      if (c.candidate_job_ids) {
        let jobIds = [];
        try {
          jobIds = JSON.parse(c.candidate_job_ids);
        } catch(e) {}
        
        if (jobIds.length > 0) {
          const placeholders = jobIds.map(() => '?').join(',');
          c.candidates = db.prepare(`
            SELECT id, job_code, invoice_no, no_bc, buyer, destination, etd, closing_docs
            FROM export_jobs
            WHERE id IN (${placeholders})
          `).all(...jobIds);
        } else {
          c.candidates = [];
        }
      }
    }

    res.json({ success: true, data: cases });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /match-reviews/:id/resolve — Resolve a match review case
// ═══════════════════════════════════════════════════════════════════════════
router.post('/match-reviews/:id/resolve', requireSourceManagement, (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, targetJobId, resolutionNotes } = req.body;
    
    // resolution: 'MERGE', 'NEW', 'IGNORE'
    
    if (!['MERGE', 'NEW', 'IGNORE'].includes(resolution)) {
      return res.status(400).json({ success: false, error: 'Invalid resolution action' });
    }

    if (resolution === 'MERGE' && !targetJobId) {
      return res.status(400).json({ success: false, error: 'Target Job ID required for MERGE' });
    }

    const mCase = db.prepare('SELECT * FROM match_review_cases WHERE id = ? AND status = "PENDING_REVIEW"').get(id);
    if (!mCase) {
      return res.status(404).json({ success: false, error: 'Pending review case not found' });
    }

    const sourceRecord = db.prepare('SELECT * FROM source_records WHERE id = ?').get(mCase.source_record_id);

    db.transaction(() => {
      if (resolution === 'IGNORE') {
        db.prepare('UPDATE match_review_cases SET status = "RESOLVED_IGNORED", resolved_by_user_id = ?, resolution_notes = ? WHERE id = ?')
          .run(req.user.id, resolutionNotes || 'Ignored by user', id);
          
      } else if (resolution === 'NEW') {
        const row = SourceSyncEngine._reconstructRowFromSourceRecord(sourceRecord);
        const jobCode = SourceSyncEngine._generateJobCode();
        // Fallback business key if no BC is present:
        const invoiceNo = sourceRecord.raw_invoice_no;
        const noBc = sourceRecord.raw_no_bc || '';
        const businessKey = (invoiceNo && noBc) ? `${invoiceNo}|${noBc}` : `INV:${invoiceNo}-NEW-${Date.now()}`; // enforce uniqueness
        
        const jobId = SourceSyncEngine._createExportJob(jobCode, businessKey, row, mCase.source_import_id, req.user.id);
        
        db.prepare('UPDATE source_records SET export_job_id = ?, sync_action = "NEW", completeness = "PARTIAL", identity_strength = "STRONG_MANUAL" WHERE id = ?')
          .run(jobId, sourceRecord.id);
          
        db.prepare('UPDATE match_review_cases SET status = "RESOLVED_NEW", resolved_by_user_id = ?, resolved_job_id = ?, resolution_notes = ? WHERE id = ?')
          .run(req.user.id, jobId, resolutionNotes || 'Created as new job', id);
          
      } else if (resolution === 'MERGE') {
        const row = SourceSyncEngine._reconstructRowFromSourceRecord(sourceRecord);
        const existingJob = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(targetJobId);
        
        if (!existingJob) throw new Error('Target job not found');
        
        const changes = SourceSyncEngine._detectChanges(existingJob, row);
        
        if (changes.length > 0) {
          SourceSyncEngine._updateExportJobSourceFields(targetJobId, row, mCase.source_import_id);
          for (const change of changes) {
            db.prepare(`
              INSERT INTO source_record_changes
                (source_record_id, source_import_id, export_job_id, field_name, old_value, new_value)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(sourceRecord.id, mCase.source_import_id, targetJobId, change.field, change.oldValue, change.newValue);
          }
        }
        
        db.prepare('UPDATE source_records SET export_job_id = ?, sync_action = "UPDATED", identity_strength = "STRONG_MANUAL" WHERE id = ?')
          .run(targetJobId, sourceRecord.id);
          
        db.prepare('UPDATE match_review_cases SET status = "RESOLVED_MERGED", resolved_by_user_id = ?, resolved_job_id = ?, resolution_notes = ? WHERE id = ?')
          .run(req.user.id, targetJobId, resolutionNotes || 'Merged into existing job', id);
      }
    })();

    res.json({ success: true, data: { status: 'RESOLVED', resolution } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

