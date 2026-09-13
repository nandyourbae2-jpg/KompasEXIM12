const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/v2/sourceRoutes.js');
let content = fs.readFileSync(file, 'utf8');

const injection = `
// ═══════════════════════════════════════════════════════════════════════════
// GET /match-reviews — Fetch pending match review cases
// ═══════════════════════════════════════════════════════════════════════════
router.get('/match-reviews', requireSourceManagement, (req, res, next) => {
  try {
    const cases = db.prepare(\`
      SELECT 
        m.*,
        s.raw_invoice_no, s.raw_destination, s.raw_buyer, s.raw_etd, s.raw_closing_docs,
        i.file_name as source_file_name
      FROM match_review_cases m
      JOIN source_records s ON m.source_record_id = s.id
      JOIN source_imports i ON m.source_import_id = i.id
      WHERE m.status = 'PENDING_REVIEW'
      ORDER BY m.id ASC
    \`).all();

    // Fetch candidates for each case
    for (const c of cases) {
      if (c.candidate_job_ids) {
        let jobIds = [];
        try {
          jobIds = JSON.parse(c.candidate_job_ids);
        } catch(e) {}
        
        if (jobIds.length > 0) {
          const placeholders = jobIds.map(() => '?').join(',');
          c.candidates = db.prepare(\`
            SELECT id, job_code, invoice_no, no_bc, buyer, destination, etd, closing_docs
            FROM export_jobs
            WHERE id IN (\${placeholders})
          \`).all(...jobIds);
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
        const businessKey = (invoiceNo && noBc) ? \`\${invoiceNo}|\${noBc}\` : \`INV:\${invoiceNo}-NEW-\${Date.now()}\`; // enforce uniqueness
        
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
            db.prepare(\`
              INSERT INTO source_record_changes
                (source_record_id, source_import_id, export_job_id, field_name, old_value, new_value)
              VALUES (?, ?, ?, ?, ?, ?)
            \`).run(sourceRecord.id, mCase.source_import_id, targetJobId, change.field, change.oldValue, change.newValue);
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
`;

if (!content.includes('GET /match-reviews')) {
  content = content.replace('module.exports = router;', injection + '\nmodule.exports = router;');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Routes added successfully.');
} else {
  console.log('Routes already exist.');
}
