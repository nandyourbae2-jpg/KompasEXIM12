const fs = require('fs');
const db = require('./db');

function seedActualTemplates() {
  console.log('Seeding AE Checklist Templates v2026.2 (Phase 5)...');
  
  // Truncate previous templates (safe because they are dummy E4-B ones)
  db.prepare('DELETE FROM ae_job_checklist_items').run();
  db.prepare('DELETE FROM ae_job_checklists').run();
  db.prepare('DELETE FROM ae_checklist_items').run();
  db.prepare('DELETE FROM ae_checklist_groups').run();
  db.prepare('DELETE FROM ae_checklist_template_versions').run();
  db.prepare('DELETE FROM ae_checklist_templates').run();
  
  const dump = fs.readFileSync('../scratch/dump2.txt', 'utf8');
  const lines = dump.split('\n');

  let currentSheet = '';
  let templateId = null;
  let versionId = null;
  let currentGroup = '';
  let groupId = null;
  
  let groupSortCounter = 0;
  let itemSortCounter = 0;

  const insertTemplate = db.prepare('INSERT INTO ae_checklist_templates (name, description, is_active) VALUES (?, ?, 1)');
  const insertVersion = db.prepare('INSERT INTO ae_checklist_template_versions (template_id, version_name, is_published) VALUES (?, ?, 1)');
  const insertGroup = db.prepare('INSERT INTO ae_checklist_groups (version_id, name, sort_order) VALUES (?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO ae_checklist_items (group_id, label, code, sort_order, is_required, applicability_rules) VALUES (?, ?, ?, ?, ?, ?)');

  lines.forEach(line => {
    if (line.startsWith('=== SHEET:')) {
      currentSheet = line.replace('=== SHEET: ', '').replace(' ===', '').trim();
      currentGroup = '';
      groupSortCounter = 0;
      
      // Create Template and Version
      templateId = insertTemplate.run(currentSheet, `Template extracted for ${currentSheet}`).lastInsertRowid;
      versionId = insertVersion.run(templateId, 'v2026.2').lastInsertRowid;
      
    } else if (line.startsWith('[')) {
      try {
        const row = JSON.parse(line);
        if (!row || row.length === 0) return;
        
        const firstCell = String(row[0] || '').trim();
        
        if (firstCell.startsWith('DOCUMENT PREPARATION') || 
            firstCell.startsWith('SOFT COPY DOCUMENT') || 
            firstCell.startsWith('FINAL DATA') || 
            firstCell.startsWith('DRAFT') || 
            firstCell.startsWith('ORIGINAL')) {
           
           currentGroup = firstCell.split('(')[0].trim();
           groupSortCounter++;
           itemSortCounter = 0;
           groupId = insertGroup.run(versionId, currentGroup, groupSortCounter).lastInsertRowid;
           
        } else if (firstCell.match(/^\d+\.$/) || (row[1] && currentGroup && typeof row[1] === 'string' && !firstCell)) {
           // It's a checklist item
           let itemLabel = row[1];
           if (firstCell.match(/^\d+\.$/)) itemLabel = row[1]; // Normal case
           else if (!firstCell && row[1]) itemLabel = row[1]; // Some sheets omit numbers
           
           if (!itemLabel || typeof itemLabel !== 'string') return;
           
           itemLabel = itemLabel.trim();
           if(itemLabel === '') return;
           
           itemSortCounter++;
           
           // Construct logic: KITE
           let rules = null;
           let isRequired = 1;
           
           if (itemLabel.includes('KITE')) {
               rules = JSON.stringify([{ field: 'fasilitas_kite', operator: 'EQUALS', value: 'YES' }]);
           }
           
           // L/C (Pending validation logic)
           if (itemLabel.includes('L/C')) {
               rules = JSON.stringify([{ field: 'payment_term', operator: 'EQUALS', value: 'L/C' }]);
           }

           const code = `${currentSheet}_${currentGroup}_${itemSortCounter}`.replace(/[^A-Z0-9_]/ig, '_').toUpperCase().substring(0, 50);
           
           insertItem.run(groupId, itemLabel, code, itemSortCounter, isRequired, rules);
        }
      } catch(e) {}
    }
  });

  console.log('Template seeding (Phase 5) completed successfully.');
}

seedActualTemplates();
