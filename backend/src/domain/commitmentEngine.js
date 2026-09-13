const db = require('../database/db');

class CommitmentEngine {
  /**
   * Evaluates business rules and spawns financial commitments for a project
   */
  static evaluate(projectId, incoterm, transportMode) {
    console.log(`[CommitmentEngine] Evaluating rules for Project ${projectId}, Incoterm: ${incoterm}, Mode: ${transportMode}`);

    const rules = db.prepare('SELECT * FROM ref_commitment_rules WHERE is_active = 1').all();
    const spawnedCommitments = [];

    const insertStmt = db.prepare(`
      INSERT INTO financial_request_ledger 
      (request_number, import_project_id, cost_category, source, status, baseline_amount, currency)
      VALUES (?, ?, ?, 'standard', 'Pending', ?, 'IDR')
    `);

    db.transaction(() => {
      rules.forEach(rule => {
        let appliesIncoterm = false;
        let appliesMode = false;

        try {
          const incoterms = JSON.parse(rule.incoterm_applies_to || '[]');
          const modes = JSON.parse(rule.transport_mode || '[]');
          
          if (incoterms.includes(incoterm)) appliesIncoterm = true;
          if (modes.includes(transportMode)) appliesMode = true;
        } catch (e) {
          console.error('[CommitmentEngine] Rule parsing error', e);
        }

        if (appliesIncoterm && appliesMode) {
          const reqNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          
          insertStmt.run(
            reqNumber,
            projectId,
            rule.cost_category,
            rule.default_baseline_amount
          );
          
          spawnedCommitments.push({
            cost_category: rule.cost_category,
            baseline_amount: rule.default_baseline_amount,
            type: rule.commitment_type
          });
        }
      });
    })();

    console.log(`[CommitmentEngine] Spawned ${spawnedCommitments.length} commitments for Project ${projectId}`);
    return spawnedCommitments;
  }
}

module.exports = CommitmentEngine;
