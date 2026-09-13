const db = require('../database/db');

function resolveNextAction(exportJobId, itemId) {
  // Get current state
  const state = db.prepare(`
    SELECT * FROM job_checklist_state 
    WHERE export_job_id = ? AND item_id = ?
  `).get(exportJobId, itemId);

  if (!state) {
    // This item hasn't been started for this job.
    // The sequence starts from the first activity configured for this item.
    const sequence = db.prepare(`
      SELECT ca.* 
      FROM checklist_activities ca
      JOIN checklist_item_activity_rules ciar ON ca.id = ciar.activity_id
      WHERE ciar.item_id = ? AND ciar.berlaku = 1
      ORDER BY ca.urutan ASC
    `).all(itemId);

    return sequence.length > 0 
      ? { nextActivity: sequence[0].id, mode: 'EXECUTE', stateId: null } 
      : { nextActivity: null, mode: 'DONE', stateId: null };
  }

  // Get execution history for this state
  const executions = db.prepare(`
    SELECT * FROM activity_executions
    WHERE job_checklist_state_id = ?
    ORDER BY executed_at ASC
  `).all(state.id);

  const lastExec = executions.length > 0 ? executions[executions.length - 1] : null;

  // If last execution failed with REVISION_REQUIRED, fall back to previous activity
  if (lastExec && lastExec.result === 'FAIL' && lastExec.disposition === 'REVISION_REQUIRED') {
    return { nextActivity: lastExec.activity_id, mode: 'REVISE', stateId: state.id };
  }

  // Get the normal sequence
  const sequence = db.prepare(`
    SELECT ca.* 
    FROM checklist_activities ca
    JOIN checklist_item_activity_rules ciar ON ca.id = ciar.activity_id
    WHERE ciar.item_id = ? AND ciar.berlaku = 1
    ORDER BY ca.urutan ASC
  `).all(itemId);

  const completedIds = executions.filter(e => {
    try {
      if (e.result) {
        const parsed = JSON.parse(e.result);
        if (parsed.status === 'FAIL') return false;
      }
    } catch(err) {
      if (e.result === 'FAIL') return false;
    }
    return true;
  }).map(e => e.activity_id);
  const next = sequence.find(a => !completedIds.includes(a.id));

  return next 
    ? { nextActivity: next.id, mode: 'EXECUTE', stateId: state.id } 
    : { nextActivity: null, mode: 'DONE', stateId: state.id };
}

module.exports = {
  resolveNextAction
};
