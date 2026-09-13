const db = require('./backend/src/database/db');
const AeChecklistRuleEngine = require('./backend/src/services/AeChecklistRuleEngine');

// Check if we have an active template
const version = db.prepare(`
    SELECT v.* FROM ae_checklist_template_versions v
    JOIN ae_checklist_templates t ON v.template_id = t.id
    WHERE t.is_active = 1 AND v.is_published = 1
`).get();
console.log('Active Version:', version);

// See groups
const groups = db.prepare('SELECT * FROM ae_checklist_groups').all();
console.log('Groups:', groups);

// See items
const items = db.prepare('SELECT * FROM ae_checklist_items').all();
console.log('Items Count:', items.length);

// Rule test
const fakeJob = { product_type: 'WR', fasilitas_kite: 'YES' };
const applicable = AeChecklistRuleEngine.evaluate(items.find(i => i.code === 'SOFT_KITE_FMT').applicability_rules, fakeJob);
console.log('Is KITE Format applicable to WR + KITE=YES?', applicable);

const applicablePbn = AeChecklistRuleEngine.evaluate(items.find(i => i.code === 'FINAL_FWD_PBN').applicability_rules, {product_type: 'POUCH'});
console.log('Is FWD PBN applicable to POUCH?', applicablePbn);
