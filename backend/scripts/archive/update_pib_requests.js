const fs = require('fs');
const path = require('path');
const fileLoc = path.join(__dirname, 'src/routes/v1/financials.js');
let file = fs.readFileSync(fileLoc, 'utf8');

file = file.replace(
  /router\.patch\('\/pib-requests\/:id',authenticateToken, \(req, res, next\) => \{\n  try \{\n    const \{ aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, kasbon_diminta, no_invoice_pib, bl_number \} = req\.body;\n    const estTotal = \(parseFloat\(estimasi_bm\) \|\| 0\) \+ \(parseFloat\(estimasi_ppn\) \|\| 0\) \+ \(parseFloat\(estimasi_pph\) \|\| 0\);\n    \n    db\.prepare\(`\n      UPDATE pib_requests \n      SET aju_pib = COALESCE\(\?, aju_pib\),\n          tanggal_pengajuan = COALESCE\(\?, tanggal_pengajuan\),\n          estimasi_bm = COALESCE\(\?, estimasi_bm\),\n          estimasi_ppn = COALESCE\(\?, estimasi_ppn\),\n          estimasi_pph = COALESCE\(\?, estimasi_pph\),\n          estimasi_total = COALESCE\(\?, estimasi_total\),\n          kasbon_diminta = COALESCE\(\?, kasbon_diminta\),\n          no_invoice_pib = COALESCE\(\?, no_invoice_pib\),\n          bl_number = COALESCE\(\?, bl_number\),\n          updated_at = datetime\('now'\)\n      WHERE id = \? AND status = 'Draft'\n    `\)\.run\(aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, estTotal, kasbon_diminta, no_invoice_pib, bl_number, req\.params\.id\);\n    res\.json\(\{ success: true \}\);\n  \} catch \(error\) \{ next\(error\); \}\n\}\);/,
  `router.patch('/pib-requests/:id',authenticateToken, async (req, res, next) => {
  try {
    const { aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, kasbon_diminta, no_invoice_pib, bl_number, version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    const estTotal = (parseFloat(estimasi_bm) || 0) + (parseFloat(estimasi_ppn) || 0) + (parseFloat(estimasi_pph) || 0);
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(\`
        UPDATE pib_requests 
        SET aju_pib = COALESCE(?, aju_pib),
            tanggal_pengajuan = COALESCE(?, tanggal_pengajuan),
            estimasi_bm = COALESCE(?, estimasi_bm),
            estimasi_ppn = COALESCE(?, estimasi_ppn),
            estimasi_pph = COALESCE(?, estimasi_pph),
            estimasi_total = COALESCE(?, estimasi_total),
            kasbon_diminta = COALESCE(?, kasbon_diminta),
            no_invoice_pib = COALESCE(?, no_invoice_pib),
            bl_number = COALESCE(?, bl_number),
            updated_at = datetime('now'),
            version = version + 1
        WHERE id = ? AND status = 'Draft' AND version = ?
      \`).run(aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, estTotal, kasbon_diminta, no_invoice_pib, bl_number, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});`
);

file = file.replace(
  /router\.patch\('\/pib-requests\/:id\/submit',authenticateToken, \(req, res, next\) => \{\n  try \{\n    db\.transaction\(\(\) => \{\n      db\.prepare\(`\n        UPDATE pib_requests\n        SET status = 'Submitted', submitted_at = datetime\('now'\), submitted_by_id = \?, updated_at = datetime\('now'\)\n        WHERE id = \? AND status IN \('Draft', 'Rejected'\)\n      `\)\.run\(req\.user\.id, req\.params\.id\);\n      db\.prepare\(`\n        INSERT INTO pib_request_history \(pib_request_id, status_dari, status_ke, dilakukan_oleh_id\)\n        VALUES \(\?, 'Draft', 'Submitted', \?\)\n      `\)\.run\(req\.params\.id, req\.user\.id\);\n    \}\)\(\);\n    res\.json\(\{ success: true \}\);\n  \} catch \(error\) \{ next\(error\); \}\n\}\);/,
  `router.patch('/pib-requests/:id/submit',authenticateToken, async (req, res, next) => {
  try {
    const { version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(\`
        UPDATE pib_requests
        SET status = 'Submitted', submitted_at = datetime('now'), submitted_by_id = ?, updated_at = datetime('now'), version = version + 1
        WHERE id = ? AND status IN ('Draft', 'Rejected') AND version = ?
      \`).run(req.user.id, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare(\`
        INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, 'Draft', 'Submitted', ?)
      \`).run(req.params.id, req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});`
);

file = file.replace(
  /router\.patch\('\/pib-requests\/:id\/reject',authenticateToken, \(req, res, next\) => \{\n  try \{\n    if \(req\.user\.level_otoritas !== 'Supervisor' && req\.user\.level_otoritas !== 'Manager'\) \{\n      return res\.status\(403\)\.json\(\{ error: 'Hanya SPV\/Manager yang bisa reject' \}\);\n    \}\n    db\.transaction\(\(\) => \{\n      db\.prepare\(`\n        UPDATE pib_requests SET\n          status = 'Rejected', rejected_by_id = \?, rejected_at = datetime\('now'\), catatan_approval = \?, updated_at = datetime\('now'\)\n        WHERE id = \? AND status = 'Submitted'\n      `\)\.run\(req\.user\.id, req\.body\.catatan, req\.params\.id\);\n      \n      db\.prepare\(`\n        INSERT INTO pib_request_history \(pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id\)\n        VALUES \(\?, 'Submitted', 'Rejected', \?, \?\)\n      `\)\.run\(req\.params\.id, req\.body\.catatan, req\.user\.id\);\n    \}\)\(\);\n    res\.json\(\{ success: true \}\);\n  \} catch \(error\) \{ next\(error\); \}\n\}\);/,
  `router.patch('/pib-requests/:id/reject',authenticateToken, async (req, res, next) => {
  try {
    const { version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    if (req.user.level_otoritas !== 'Supervisor' && req.user.level_otoritas !== 'Manager') {
      return res.status(403).json({ error: 'Hanya SPV/Manager yang bisa reject' });
    }
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(\`
        UPDATE pib_requests SET
          status = 'Rejected', rejected_by_id = ?, rejected_at = datetime('now'), catatan_approval = ?, updated_at = datetime('now'), version = version + 1
        WHERE id = ? AND status = 'Submitted' AND version = ?
      \`).run(req.user.id, req.body.catatan, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare(\`
        INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id)
        VALUES (?, 'Submitted', 'Rejected', ?, ?)
      \`).run(req.params.id, req.body.catatan, req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});`
);

// approve endpoint has a huge logic chunk, it's safer to just replace the UPDATE statement and wrap in TransactionManager
let approveEndpointRegex = /router\.patch\('\/pib-requests\/:id\/approve',authenticateToken, \(req, res, next\) => \{([\s\S]*?)res\.json\(\{ success: true, message: 'PIB Request diapprove\. OTHE dan Realisasi PIB sudah dibuat otomatis\.' \}\);\n  \} catch \(error\) \{ next\(error\); \}\n\}\);/;
let approveMatch = file.match(approveEndpointRegex);
if (approveMatch) {
  let approveBody = approveMatch[1];
  approveBody = approveBody.replace(/db\.transaction\(\(\) => \{/, 'const { version } = req.body;\n    if (version === undefined) throw new VersionRequiredError();\n    await TransactionManager.execute(async (tx) => {');
  approveBody = approveBody.replace(/db\.prepare/g, 'tx.db.prepare');
  approveBody = approveBody.replace(/UPDATE pib_requests SET\n          status = 'Approved', approved_by_id = \?, approved_at = \?, updated_at = \?\n        WHERE id = \?/, 'UPDATE pib_requests SET\n          status = \\\'Approved\\\', approved_by_id = ?, approved_at = ?, updated_at = ?, version = version + 1\n        WHERE id = ? AND version = ?');
  approveBody = approveBody.replace(/\)\.run\(req\.user\.id, now, now, pibReq\.id\);/, ').run(req.user.id, now, now, pibReq.id, version);\n      if (info.changes === 0) throw new ConcurrencyConflictError();');
  approveBody = approveBody.replace(/tx\.db\.prepare\(`\n        UPDATE pib_requests SET/, 'const info = tx.db.prepare(`\n        UPDATE pib_requests SET');
  approveBody = approveBody.replace(/\}\)\(\);/, '});');
  file = file.replace(approveEndpointRegex, `router.patch('/pib-requests/:id/approve',authenticateToken, async (req, res, next) => {${approveBody}res.json({ success: true, message: 'PIB Request diapprove. OTHE dan Realisasi PIB sudah dibuat otomatis.' });\n  } catch (error) { next(error); }\n});`);
}


fs.writeFileSync(fileLoc, file);
