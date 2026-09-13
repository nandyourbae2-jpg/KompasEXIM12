const db = require('../database/db');

class AeWorkflowEngine {
  static recalculateGroupCompletion(jobId) {
    const { resolveNextAction } = require('./WorkflowEngine');
    const job = db.prepare('SELECT ae_template_id FROM export_jobs WHERE id = ?').get(jobId);
    if (!job || !job.ae_template_id) return null;

    const items = db.prepare(`
        SELECT i.id, g.nama_group as stageName 
        FROM checklist_items i
        JOIN checklist_groups g ON i.group_id = g.id
        WHERE g.template_id = ?
        ORDER BY g.urutan ASC, i.urutan ASC
    `).all(job.ae_template_id);

    let totalDone = 0;
    let nextAction = null;
    let currentStage = 'PREPARATION';

    const groupStats = {};

    for (const item of items) {
        if (!groupStats[item.stageName]) {
            groupStats[item.stageName] = { total: 0, done: 0 };
        }
        groupStats[item.stageName].total += 1;

        const actionData = resolveNextAction(jobId, item.id);
        if (actionData.mode === 'DONE') {
            totalDone++;
            groupStats[item.stageName].done += 1;
        } else if (!nextAction && actionData.nextActivity) {
            const act = db.prepare('SELECT nama_aktivitas FROM checklist_activities WHERE id = ?').get(actionData.nextActivity);
            if (act) {
                nextAction = `Execute: ${act.nama_aktivitas}`;
                currentStage = item.stageName;
            }
        }
    }

    const groupProgress = {};
    for (const [groupName, stats] of Object.entries(groupStats)) {
        groupProgress[groupName] = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    }

    const pct = items.length > 0 ? Math.round((totalDone / items.length) * 100) : 0;
    const aeStatus = pct === 100 ? 'Completed' : (pct > 0 ? 'In Progress' : 'Assigned');

    db.prepare(`
        UPDATE export_jobs 
        SET ae_progress = ?, 
            ae_status = ?,
            ae_checklist = json_set(COALESCE(ae_checklist, '{}'), '$.current_work', ?, '$.current_stage', ?),
            job_checklist_group_progress = ?
        WHERE id = ?
    `).run(pct, aeStatus, nextAction, currentStage, JSON.stringify(groupProgress), jobId);

    return { pct, aeStatus, nextAction, currentStage, groupProgress };
  }

  static autoGenerateChecklist(jobId, userId) {
    const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(jobId);
    if (!job) return null;

    let company = '';
    let product = job.product_type || '';
    if (job.job_code && job.job_code.includes('PBN')) company = 'PBN';
    else if (job.job_code && job.job_code.includes('PSB')) company = 'PSB';
    else if (job.job_code && job.job_code.includes('PSFI')) company = 'PSFI';
    else if (job.job_code && job.job_code.includes('SAMICO')) company = 'SAMICO';
    else company = 'PBN'; 

    let templateQuery;
    if (company === 'PBN') {
      templateQuery = db.prepare(`SELECT * FROM checklist_templates WHERE company = ? AND product = ?`).get(company, product);
    } else {
      templateQuery = db.prepare(`SELECT * FROM checklist_templates WHERE company = ?`).get(company);
    }
    
    if (!templateQuery && company === 'PBN') {
        templateQuery = db.prepare(`SELECT * FROM checklist_templates WHERE company = ? LIMIT 1`).get(company);
    }
    
    if (!templateQuery) return null;

    const transaction = db.transaction(() => {
        const existing = db.prepare(`SELECT count(*) as count FROM ae_job_documents WHERE job_id = ?`).get(jobId);
        if (existing.count > 0) return true;
        
        let kondisi = null;
        if (job.cc_non_cc === 'CC') kondisi = 'CNF/CIF All In';
        else kondisi = 'CNF/CIF Direct Liner';

        const rules = db.prepare(`
            SELECT 
                r.item_id, r.activity_id, 
                g.nama_group, g.kondisi_final_data,
                i.nama_item as doc_name,
                a.nama_aktivitas as act_name, a.urutan as act_order
            FROM checklist_item_activity_rules r
            JOIN checklist_items i ON r.item_id = i.id
            JOIN checklist_activities a ON r.activity_id = a.id
            JOIN checklist_groups g ON i.group_id = g.id
            WHERE g.template_id = ? AND r.berlaku = 1
            ORDER BY g.urutan ASC, i.urutan ASC, a.urutan ASC
        `).all(templateQuery.id);

        const insertDoc = db.prepare(`INSERT INTO ae_job_documents (job_id, stage_name, document_name) VALUES (?, ?, ?)`);
        const insertVer = db.prepare(`INSERT INTO ae_job_document_versions (job_document_id, version_number) VALUES (?, 1)`);
        const insertAct = db.prepare(`INSERT INTO ae_job_document_activities (job_document_version_id, activity_name, sequence_order) VALUES (?, ?, ?)`);
        const insertOps = db.prepare(`INSERT OR IGNORE INTO ae_job_operational_data (job_id) VALUES (?)`);
        insertOps.run(jobId);

        let currentItemId = null;
        let currentDocVerId = null;

        for (const rule of rules) {
            if (rule.kondisi_final_data && rule.kondisi_final_data !== kondisi) continue;
            
            if (rule.item_id !== currentItemId) {
                const resDoc = insertDoc.run(jobId, rule.nama_group, rule.doc_name);
                const resVer = insertVer.run(resDoc.lastInsertRowid);
                currentDocVerId = resVer.lastInsertRowid;
                currentItemId = rule.item_id;
            }

            insertAct.run(currentDocVerId, rule.act_name, rule.act_order);
        }
        return true;
    });

    transaction();
    return true;
  }

  static getJobContext(jobId) {
    const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(jobId);
    if (!job) return {};

    const activeBlocker = db.prepare(`SELECT * FROM ae_job_blockers WHERE job_id = ? AND status = 'OPEN' ORDER BY opened_at DESC LIMIT 1`).get(jobId);
    const sourceIncomplete = !job.closing_docs;

    let nextAction = null;
    let currentStage = 'PREPARATION'; 
    let isBlocked = !!activeBlocker;
    let priority = 'NORMAL';
    let pendingActionObj = null;
    let progress = 0;

    // Check if checklist documents exist in ae_job_documents
    const docCountRow = db.prepare(`SELECT COUNT(*) as c FROM ae_job_documents WHERE job_id = ?`).get(jobId);
    if ((!docCountRow || docCountRow.c === 0) && job.ae_assignee_id) {
        AeWorkflowEngine.autoGenerateChecklist(jobId, job.ae_assignee_id);
    }

    const stats = db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM ae_job_document_activities a
        JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
        JOIN ae_job_documents d ON v.job_document_id = d.id
        WHERE d.job_id = ?
    `).get(jobId);

    if (stats && stats.total > 0) {
        progress = Math.round((stats.completed / stats.total) * 100);
        
        const nextPending = db.prepare(`
            SELECT 
                a.id as activity_id, a.activity_name, a.status as act_status,
                d.id as doc_id, d.document_name as docName, d.stage_name as stageName, d.state as doc_state,
                v.id as version_id, v.version_number
            FROM ae_job_document_activities a
            JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
            JOIN ae_job_documents d ON v.job_document_id = d.id
            WHERE d.job_id = ? AND a.status = 'PENDING'
            ORDER BY d.id ASC, a.sequence_order ASC
            LIMIT 1
        `).get(jobId);

        if (activeBlocker) {
            nextAction = `Resolve: ${activeBlocker.reason}`;
        } else if (sourceIncomplete) {
            nextAction = `Waiting For: EXPORT TEAM (Missing Source)`;
        } else if (nextPending) {
            nextAction = `${nextPending.activity_name} - ${nextPending.docName}`;
            currentStage = nextPending.stageName;
            pendingActionObj = {
                id: nextPending.activity_id,
                activity_id: nextPending.activity_id,
                activity_name: nextPending.activity_name,
                doc_id: nextPending.doc_id,
                docName: nextPending.docName,
                stageName: nextPending.stageName,
                doc_state: nextPending.doc_state,
                version: nextPending.version_number
            };
        } else {
            if (job.ae_handover_status === 'Final Shared') {
                nextAction = 'READY FOR CLOSURE';
            } else if (job.ae_handover_status === 'Draft Shared') {
                nextAction = 'READY FOR FINAL HANDOVER';
            } else {
                nextAction = 'READY FOR DRAFT HANDOVER';
            }
            currentStage = 'HANDOVER';
        }
    } else {
        if (sourceIncomplete) {
            nextAction = `Waiting For: EXPORT TEAM (Missing Source)`;
            progress = 0;
        } else {
            nextAction = 'Checklist not initialized';
            progress = 0;
        }
    }

    if (job.closing_docs) {
       const closingDate = new Date(job.closing_docs);
       const now = new Date();
       const diffHours = (closingDate - now) / (1000 * 60 * 60);

       if (diffHours < 0) priority = 'OVERDUE';
       else if (diffHours <= 24 || (isBlocked)) priority = 'CRITICAL';
       else if (diffHours <= 72) priority = 'AT RISK';
    }

    let qcAttendApplicable = false;
    const qcBuyers = ['TMI', 'HDE', 'ITOCHU', 'KIBU', 'JAIS', 'POP', 'PBN'];
    if (job.buyer && qcBuyers.some(b => job.buyer.toUpperCase().includes(b)) && job.product_type === 'WR') {
        qcAttendApplicable = true;
    }

    return {
      currentStage: isBlocked ? `${currentStage} (BLOCKED)` : currentStage,
      nextAction: nextAction || 'Pending',
      priority,
      progress,
      blocker: activeBlocker || null,
      pendingActionObj,
      qcAttendApplicable
    };
  }
}

module.exports = AeWorkflowEngine;
