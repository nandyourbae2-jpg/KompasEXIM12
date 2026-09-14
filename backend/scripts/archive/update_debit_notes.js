const fs = require('fs');
const path = require('path');
const fileLoc = path.join(__dirname, 'src/routes/v1/financials.js');
let file = fs.readFileSync(fileLoc, 'utf8');

if (!file.includes('TransactionManager')) {
  file = file.replace(/const db = require\('\.\.\/\.\.\/database\/db'\);/, 'const db = require(\'../../database/db\');\nconst { TransactionManager } = require(\'../../database/TransactionManager\');\nconst { ConcurrencyConflictError, VersionRequiredError } = require(\'../../utils/errors\');');
}

file = file.replace(
  /router\.patch\('\/debit-notes\/:id',authenticateToken, \(req, res, next\) => \{\n  try \{\n    const \{ claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, tanggal_dn \} = req\.body;\n    const dn = db\.prepare\('SELECT status FROM debit_notes WHERE id = \?'\)\.get\(req\.params\.id\);\n    if \(!dn \|\| \(dn\.status !== 'Draft' && dn\.status !== 'Diterbitkan'\)\) \{\n      return res\.status\(403\)\.json\(\{ error: 'Hanya DN dengan status Draft atau Diterbitkan yang dapat diedit\.' \}\);\n    \}\n\n    db\.prepare\(`\n      UPDATE debit_notes \n      SET claim_kategori=\?, claim_jenis=\?, claim_kepada=\?, jumlah_klaim=\?, deskripsi=\?, linked_job_order_id=\?, mata_uang=\?, tanggal_dn=\?, updated_at=datetime\('now'\)\n      WHERE id = \?\n    `\)\.run\(claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id \|\| null, mata_uang, tanggal_dn, req\.params\.id\);\n    res\.json\(\{ success: true \}\);\n  \} catch \(error\) \{ next\(error\); \}\n\}\);/,
  `router.patch('/debit-notes/:id',authenticateToken, async (req, res, next) => {
  try {
    const { claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, tanggal_dn, version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const dn = tx.db.prepare('SELECT status FROM debit_notes WHERE id = ?').get(req.params.id);
      if (!dn || (dn.status !== 'Draft' && dn.status !== 'Diterbitkan')) {
        throw new Error('Hanya DN dengan status Draft atau Diterbitkan yang dapat diedit.');
      }
      const info = tx.db.prepare(\`
        UPDATE debit_notes 
        SET claim_kategori=?, claim_jenis=?, claim_kepada=?, jumlah_klaim=?, deskripsi=?, linked_job_order_id=?, mata_uang=?, tanggal_dn=?, updated_at=datetime('now'), version = version + 1
        WHERE id = ? AND version = ?
      \`).run(claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id || null, mata_uang, tanggal_dn, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});`
);

file = file.replace(
  /router\.patch\('\/debit-notes\/:id\/status',authenticateToken, \(req, res, next\) => \{\n  try \{\n    const \{ status_ke, catatan \} = req\.body;\n    if \(status_ke === 'Ditolak' && !catatan\) \{\n      return res\.status\(400\)\.json\(\{ error: 'Catatan wajib diisi jika klaim Ditolak\.' \}\);\n    \}\n\n    db\.transaction\(\(\) => \{\n      const dn = db\.prepare\('SELECT status FROM debit_notes WHERE id = \?'\)\.get\(req\.params\.id\);\n      db\.prepare\(`UPDATE debit_notes SET status = \?, updated_at = datetime\('now'\) WHERE id = \?`\)\.run\(status_ke, req\.params\.id\);\n      db\.prepare\('INSERT INTO debit_note_status_history \(debit_note_id, status_dari, status_ke, catatan, diubah_oleh_id\) VALUES \(\?, \?, \?, \?, \?\)'\)\.run\(req\.params\.id, dn \? dn\.status : '', status_ke, catatan \|\| null, req\.user\.id\);\n    \}\)\(\);\n    res\.json\(\{ success: true \}\);\n  \} catch \(error\) \{ next\(error\); \}\n\}\);/,
  `router.patch('/debit-notes/:id/status',authenticateToken, async (req, res, next) => {
  try {
    const { status_ke, catatan, version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    if (status_ke === 'Ditolak' && !catatan) {
      return res.status(400).json({ error: 'Catatan wajib diisi jika klaim Ditolak.' });
    }
    await TransactionManager.execute(async (tx) => {
      const dn = tx.db.prepare('SELECT status FROM debit_notes WHERE id = ?').get(req.params.id);
      const info = tx.db.prepare(\`UPDATE debit_notes SET status = ?, updated_at = datetime('now'), version = version + 1 WHERE id = ? AND version = ?\`).run(status_ke, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare('INSERT INTO debit_note_status_history (debit_note_id, status_dari, status_ke, catatan, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)').run(req.params.id, dn ? dn.status : '', status_ke, catatan || null, req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});`
);

file = file.replace(
  /router\.patch\('\/debit-notes\/:id\/recovery',authenticateToken, \(req, res, next\) => \{\n  try \{\n    const \{ jumlah_recovery, tanggal_recovery \} = req\.body;\n    db\.prepare\(`UPDATE debit_notes SET jumlah_recovery = \?, tanggal_recovery = \?, updated_at = datetime\('now'\) WHERE id = \?`\)\.run\(jumlah_recovery, tanggal_recovery, req\.params\.id\);\n    res\.json\(\{ success: true \}\);\n  \} catch \(error\) \{ next\(error\); \}\n\}\);/,
  `router.patch('/debit-notes/:id/recovery',authenticateToken, async (req, res, next) => {
  try {
    const { jumlah_recovery, tanggal_recovery, version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(\`UPDATE debit_notes SET jumlah_recovery = ?, tanggal_recovery = ?, updated_at = datetime('now'), version = version + 1 WHERE id = ? AND version = ?\`).run(jumlah_recovery, tanggal_recovery, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});`
);

fs.writeFileSync(fileLoc, file);
