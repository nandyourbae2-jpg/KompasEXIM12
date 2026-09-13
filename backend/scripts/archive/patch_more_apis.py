import sys

with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

new_apis = """
/**
 * GET /api/v2/ae/my-work
 */
router.get('/my-work', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const jobs = db.prepare(`SELECT id, ae_status FROM export_jobs WHERE ae_assignee_id = ?`).all(req.user.id);
    
    let actionRequired = 0;
    let waitingBlocked = 0;
    let handoverReady = 0; // for future
    let overdue = 0;
    let completed = 0;

    for (const job of jobs) {
      if (job.ae_status === 'Completed') {
        completed++;
        continue;
      }
      const context = AeWorkflowEngine.getJobContext(job.id);
      
      if (context.priority === 'OVERDUE') overdue++;
      
      if (context.blocker || !context.closing_docs || !context.etd || (context.nextAction || '').includes('WAITING')) {
        waitingBlocked++;
      } else if (context.nextAction && context.nextAction.startsWith('Execute:')) {
        actionRequired++;
      }
    }

    ApiResponse.send(req, res, { actionRequired, waitingBlocked, handoverReady, overdue, completed });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/ae/my-actions
 */
router.get('/my-actions', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const jobs = db.prepare(`SELECT * FROM export_jobs WHERE ae_assignee_id = ? AND ae_status != 'Completed'`).all(req.user.id);
    
    const actions = [];
    for (const job of jobs) {
       const context = AeWorkflowEngine.getJobContext(job.id);
       // Only include if it is a genuine STAFF ACTION (no waiting, no blockers)
       if (!context.blocker && context.closing_docs && context.etd && context.nextAction && context.nextAction.startsWith('Execute:')) {
          actions.push({ ...job, ...context });
       }
    }
    
    // Sort by priority logic (OVERDUE first)
    actions.sort((a, b) => {
       const p = { 'CRITICAL': 0, 'OVERDUE': 1, 'TODAY': 2, 'HIGH': 3, 'NORMAL': 4 };
       return (p[a.priority] || 99) - (p[b.priority] || 99);
    });

    ApiResponse.send(req, res, actions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/ae/my-blockers
 */
router.get('/my-blockers', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const jobs = db.prepare(`SELECT * FROM export_jobs WHERE ae_assignee_id = ? AND ae_status != 'Completed'`).all(req.user.id);
    
    const blockers = [];
    for (const job of jobs) {
       const context = AeWorkflowEngine.getJobContext(job.id);
       if (context.blocker || !context.closing_docs || !context.etd || (context.nextAction || '').includes('WAITING')) {
          blockers.push({ ...job, ...context });
       }
    }

    ApiResponse.send(req, res, blockers);
  } catch (error) {
    next(error);
  }
});
"""

# Insert right before GET /api/v2/ae/my-jobs
marker = "router.get('/my-jobs'"
if marker in content:
    idx = content.find(marker)
    # find previous JSDoc
    comment_idx = content.rfind("/**", 0, idx)
    
    content = content[:comment_idx] + new_apis + content[comment_idx:]
    with open('src/routes/v2/aeRoutes.js', 'w') as f:
        f.write(content)
    print("Patched more APIs")
else:
    print("Marker not found")
