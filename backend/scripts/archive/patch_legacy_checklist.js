const db = require('./src/database/db');
const docsToUpdate = ['DO Internal', 'DO Liner', 'Data Forwarder', 'Data Loading', 'PI', 'Shipping Instruction (if any)', 'L/C (if any)'];

try {
  db.transaction(() => {
    // 1. Get the items
    const items = db.prepare(`SELECT id, nama_item FROM checklist_items WHERE nama_item IN (${docsToUpdate.map(d => `'${d}'`).join(',')})`).all();
    
    for (const item of items) {
      // Create new activities for this item
      // Preparation
      const resPrep = db.prepare(`INSERT INTO checklist_activities (item_id, nama_aktivitas, urutan) VALUES (?, 'Preparation', 1)`).run(item.id);
      db.prepare(`INSERT INTO checklist_item_activity_rules (item_id, activity_id, berlaku) VALUES (?, ?, 1)`).run(item.id, resPrep.lastInsertRowid);
      
      // Review
      const resRev = db.prepare(`INSERT INTO checklist_activities (item_id, nama_aktivitas, urutan) VALUES (?, 'Review', 2)`).run(item.id);
      db.prepare(`INSERT INTO checklist_item_activity_rules (item_id, activity_id, berlaku) VALUES (?, ?, 1)`).run(item.id, resRev.lastInsertRowid);

      // Final / Original
      const resFin = db.prepare(`INSERT INTO checklist_activities (item_id, nama_aktivitas, urutan) VALUES (?, 'Final / Original', 3)`).run(item.id);
      db.prepare(`INSERT INTO checklist_item_activity_rules (item_id, activity_id, berlaku) VALUES (?, ?, 1)`).run(item.id, resFin.lastInsertRowid);
      
      // Delete old rules for RCVD, Server Filing, Checked for these items
      // We know they were created earlier, so we just set berlaku = 0 or delete them
      db.prepare(`
        DELETE FROM checklist_item_activity_rules 
        WHERE item_id = ? AND activity_id IN (
          SELECT id FROM checklist_activities WHERE nama_aktivitas IN ('RCVD', 'Server Filing', 'Checked')
        )
      `).run(item.id);
    }
  })();
  console.log("Legacy checklist patched!");
} catch(e) {
  console.error(e);
}
