const db = require('./db');

function seedChecklist() {
  console.log('Seeding AE Checklist Template v2026.1...');
  
  // 1. Template
  const templateResult = db.prepare(`
    INSERT INTO ae_checklist_templates (name, description, is_active)
    VALUES ('Standard AE Checklist', 'Default checklist for Export Administration', 1)
  `).run();
  
  const templateId = templateResult.lastInsertRowid;
  
  // 2. Template Version
  const versionResult = db.prepare(`
    INSERT INTO ae_checklist_template_versions (template_id, version_name, is_published)
    VALUES (?, 'v2026.1', 1)
  `).run(templateId);
  
  const versionId = versionResult.lastInsertRowid;
  
  // 3. Groups
  const insertGroup = db.prepare(`
    INSERT INTO ae_checklist_groups (version_id, name, sort_order)
    VALUES (?, ?, ?)
  `);
  
  const grpDocPrep = insertGroup.run(versionId, 'DOCUMENT PREPARATION', 1).lastInsertRowid;
  const grpSoftCopy = insertGroup.run(versionId, 'SOFT COPY DOCUMENT', 2).lastInsertRowid;
  const grpFinalData = insertGroup.run(versionId, 'FINAL DATA', 3).lastInsertRowid;
  const grpDraft = insertGroup.run(versionId, 'DRAFT DOCUMENT', 4).lastInsertRowid;
  const grpOriginal = insertGroup.run(versionId, 'ORIGINAL DOCUMENT', 5).lastInsertRowid;
  
  // 4. Items
  const insertItem = db.prepare(`
    INSERT INTO ae_checklist_items (group_id, label, code, sort_order, is_required, applicability_rules)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  // DOCUMENT PREPARATION
  insertItem.run(grpDocPrep, 'Invoice Received', 'DOC_PREP_INV_RCVD', 1, 1, '[]');
  insertItem.run(grpDocPrep, 'Invoice Checked', 'DOC_PREP_INV_CHK', 2, 1, '[]');
  insertItem.run(grpDocPrep, 'Packing List Received', 'DOC_PREP_PL_RCVD', 3, 1, '[]');
  
  // KITE specific
  insertItem.run(grpSoftCopy, 'Format KITE', 'SOFT_KITE_FMT', 1, 1, JSON.stringify([
    { field: 'fasilitas_kite', operator: 'EQUALS', value: 'YES' }
  ]));
  insertItem.run(grpSoftCopy, 'Email to PIC PEB KITE', 'SOFT_KITE_EMAIL', 2, 1, JSON.stringify([
    { field: 'fasilitas_kite', operator: 'EQUALS', value: 'YES' }
  ]));
  
  // Specific Product (e.g. WR, FG)
  insertItem.run(grpFinalData, 'Forwarder PBN', 'FINAL_FWD_PBN', 1, 1, JSON.stringify([
    { field: 'product_type', operator: 'IN', value: ['WR', 'FG', 'PBN'] }
  ]));
  
  insertItem.run(grpDraft, 'Print for AO Checking', 'DRAFT_AO_CHK', 1, 1, '[]');
  insertItem.run(grpOriginal, 'Scan Copy Original', 'ORIG_SCAN', 1, 1, '[]');
  
  console.log('Seeding completed.');
}

seedChecklist();
