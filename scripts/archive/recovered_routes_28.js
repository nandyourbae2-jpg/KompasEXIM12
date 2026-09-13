    const countStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN draft_confirmed_date IS NOT NULL AND original_receive_date IS NOT NULL THEN 1 ELSE 0 END) as complete
      FROM dokumen_monitoring_baris WHERE import_project_id = ?
    `);

    const allowedFields = [
      'draft_received_date',
      // Section 2: Scan Original
      'scan_receive_date', 'scan_shared_departemen',
      // Section 3: Original Physical
      'original_receive_date', 'original_awb_no', 'original_shared_departemen'
    ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          const oldVal = row[field];
          const isJsonField = field === 'scan_shared_departemen' || field === 'original_shared_departemen';
          const newVal = isJsonField ? JSON.stringify(req.body[field]) : req.body[field];

          const hasProgress = row.draft_received_date || row.draft_confirmed_date || row.scan_receive_date || row.original_receive_date || row.original_awb_no;

