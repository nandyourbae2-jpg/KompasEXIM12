import sys

with open('AeWorkflowEngine.js', 'r') as f:
    content = f.read()

old_ctx = """
    // 3. Fetch Job Checklist (We are mapping flat checklists to Stage/Document UI dynamically for now)
    const jobChecklist = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(jobId);
    
    let nextAction = null;
    let currentStage = 'PREPARATION'; // default
    let isBlocked = !!activeBlocker;
    let priority = 'NORMAL';

    if (jobChecklist && jobChecklist.status !== 'PENDING CONFIGURATION') {
      const items = db.prepare(`
        SELECT i.*, g.sort_order as group_sort, m.sort_order as item_sort, g.name as stage_name
        FROM ae_job_checklist_items i
        JOIN ae_checklist_items m ON i.checklist_item_id = m.id
        JOIN ae_checklist_groups g ON m.group_id = g.id
        WHERE i.job_checklist_id = ? 
        ORDER BY g.sort_order ASC, m.sort_order ASC
      `).all(jobChecklist.id);

      // Determine Stage: A stage advances if all its required activities are COMPLETED or NOT APPLICABLE
      let stageProgress = {};
      items.forEach(item => {
        if (!stageProgress[item.stage_name]) stageProgress[item.stage_name] = { total: 0, completed: 0 };
        if (item.snap_is_required) {
          stageProgress[item.stage_name].total++;
          if (item.status === 'COMPLETED' || item.status === 'NOT APPLICABLE') {
             stageProgress[item.stage_name].completed++;
          }
        }
      });

      // Simple derivation based on group sort
      const stages = ['PREPARATION', 'SOFT COPY', 'FINAL DATA', 'DRAFT', 'ORIGINAL'];
      for (const stage of stages) {
        currentStage = stage;
        const sp = stageProgress[stage];
        if (sp && sp.completed < sp.total) {
           break; // Stop at the first incomplete stage
        }
      }

      // Determine Next Action
      if (activeBlocker) {
        nextAction = `Resolve: ${activeBlocker.reason}`;
      } else if (sourceIncomplete) {
        nextAction = `Waiting For: EXPORT TEAM (Missing Source)`;
      } else {
        const nextItem = items.find(i => ['NOT STARTED', 'IN PROGRESS', 'WAITING'].includes(i.status) && i.snap_is_required);
        if (nextItem) {
           if (nextItem.status === 'WAITING') {
              nextAction = `Waiting For: EXTERNAL`;
           } else {
              nextAction = `Execute: ${nextItem.snap_item_label}`;
           }
        } else {
           nextAction = 'All Activities Completed';
        }
      }
    } else {
      if (sourceIncomplete) {
         nextAction = `Waiting For: EXPORT TEAM (Missing Source)`;
      } else {
         nextAction = 'Awaiting Configuration';
      }
    }
"""

new_ctx = """
    let nextAction = null;
    let currentStage = 'PREPARATION'; // default
    let isBlocked = !!activeBlocker;
    let priority = 'NORMAL';

    // 3. Fetch from real documents/activities
    const docs = db.prepare(`SELECT * FROM ae_job_documents WHERE job_id = ?`).all(jobId);
    
    if (docs.length > 0) {
      const activities = db.prepare(`
        SELECT a.*, d.document_name, d.state as doc_state 
        FROM ae_job_document_activities a
        JOIN ae_job_documents d ON a.job_document_id = d.id
        WHERE d.job_id = ? 
        ORDER BY a.id ASC
      `).all(jobId);

      // Determine Next Action
      if (activeBlocker) {
        nextAction = `Resolve: ${activeBlocker.reason}`;
      } else if (sourceIncomplete) {
        nextAction = `Waiting For: EXPORT TEAM (Missing Source)`;
      } else {
        const nextActivity = activities.find(a => ['PENDING', 'IN PROGRESS'].includes(a.status));
        if (nextActivity) {
           nextAction = `Execute: ${nextActivity.activity_name}`;
           currentStage = nextActivity.activity_name.split(' - ')[0] || currentStage;
        } else {
           nextAction = 'All Activities Completed';
           currentStage = 'ORIGINAL'; // Or Handover Ready
        }
      }
    } else {
      if (sourceIncomplete) {
         nextAction = `Waiting For: EXPORT TEAM (Missing Source)`;
      } else {
         nextAction = 'Awaiting Configuration';
      }
    }
"""

content = content.replace(old_ctx, new_ctx)
with open('AeWorkflowEngine.js', 'w') as f:
    f.write(content)
