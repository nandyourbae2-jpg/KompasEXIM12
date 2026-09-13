const db = require('../database/db');

function evaluateRule(job, rule) {
  const value = job[rule.field_kondisi];
  switch (rule.operator) {
    case '=':
      return value === rule.nilai_kondisi;
    case '!=':
      return value !== rule.nilai_kondisi;
    case 'IN':
      const arr = rule.nilai_kondisi.split(',').map(s => s.trim());
      return arr.includes(value);
    case 'LIKE':
      return value && value.includes(rule.nilai_kondisi);
    default:
      return false; // Unsupported operator
  }
}

function evaluateAllRulesMatch(rulesString, job) {
  if (!rulesString) return true; // No rules mean it matches everything (default template)
  
  // rulesString is like: "company:=:PBN|product:=:WR" (we'll split by |)
  const ruleItems = rulesString.split('|');
  for (const item of ruleItems) {
    const parts = item.split(':');
    if (parts.length >= 3) {
      const field_kondisi = parts[0];
      const operator = parts[1];
      const nilai_kondisi = parts.slice(2).join(':'); // Re-join in case value has colon
      
      const ruleObj = { field_kondisi, operator, nilai_kondisi };
      if (!evaluateRule(job, ruleObj)) {
        return false;
      }
    }
  }
  return true;
}

function resolveTemplateForJob(exportJobId) {
  const job = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(exportJobId);
  if (!job) throw new Error('Job not found');

  const templates = db.prepare(`
    SELECT t.*, GROUP_CONCAT(r.field_kondisi || ':' || r.operator || ':' || r.nilai_kondisi, '|') as rules,
           (SELECT MAX(prioritas) FROM checklist_template_rules WHERE template_id = t.id) as max_priority
    FROM checklist_templates t
    LEFT JOIN checklist_template_rules r ON r.template_id = t.id
    WHERE t.aktif = 1
    GROUP BY t.id
    ORDER BY max_priority DESC
  `).all();

  const matchedTemplates = [];

  for (const tpl of templates) {
    if (evaluateAllRulesMatch(tpl.rules, job)) {
      matchedTemplates.push(tpl);
    }
  }

  if (matchedTemplates.length === 0) {
    return null; // Template Resolution Required
  }

  // Check if multiple templates matched with the exact same highest priority
  if (matchedTemplates.length > 1) {
    const highestPriority = matchedTemplates[0].max_priority;
    const samePriorityMatches = matchedTemplates.filter(t => t.max_priority === highestPriority);
    
    if (samePriorityMatches.length > 1) {
      console.warn(`Ambiguous template match for Job ${job.id}. Using the first matched template: ${matchedTemplates[0].nama_template}`);
      // Fallback: use the first matched template instead of requiring human resolution,
      // since the UI doesn't have a template picker yet.
      return matchedTemplates[0];
    }
  }

  return matchedTemplates[0];
}

module.exports = {
  resolveTemplateForJob
};
