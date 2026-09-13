import sys

with open('backend/src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

target = """            // PASS or DONE
            db.prepare(`UPDATE ae_job_document_activities SET status = 'COMPLETED' WHERE id = ?`).run(actionId);"""

replacement = """            // PASS or DONE
            db.prepare(`UPDATE ae_job_document_activities SET status = 'COMPLETED' WHERE id = ?`).run(actionId);
            
            // Update Document State based on Activity
            const currentVer = db.prepare(`SELECT * FROM ae_job_document_versions WHERE id = ?`).get(activity.job_document_version_id);
            const actName = activity.activity_name.toUpperCase();
            let newState = null;
            
            if (actName.includes('RECEIVE') || actName === 'RCVD') newState = 'RECEIVED';
            else if (actName.includes('FORMAT') || actName.includes('SCAN')) newState = 'DRAFT';
            else if (actName.includes('CHECK') || actName.includes('APPROVAL')) newState = 'FINAL';
            
            if (newState) {
                db.prepare(`UPDATE ae_job_documents SET state = ? WHERE id = ?`).run(newState, currentVer.job_document_id);
            }"""

content = content.replace(target, replacement)

with open('backend/src/routes/v2/aeRoutes.js', 'w') as f:
    f.write(content)

