import sys

with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

replacements = [
    (
        "INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details) VALUES (?, ?, ?, ?, ?)",
        "INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, ?, ?, ?, ?, ?)"
    ),
    (
        "INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details) VALUES (?, ?, 'BLOCKER_RAISED', 'BLOCKER', ?)",
        "INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, 'BLOCKER_RAISED', 'EXPORT_JOB', ?, 'Blocker raised', ?)"
    ),
    (
        "run(id, req.user.id, JSON.stringify({ reason, remark }))",
        "run(req.user.id, id, JSON.stringify({ reason, remark }))"
    ),
    (
        "INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details) VALUES (?, ?, 'BLOCKER_RESOLVED', 'BLOCKER', ?)",
        "INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, 'BLOCKER_RESOLVED', 'EXPORT_JOB', ?, 'Blocker resolved', ?)"
    ),
    (
        "run(id, req.user.id, JSON.stringify({ blockerId, remark }))",
        "run(req.user.id, id, JSON.stringify({ blockerId, remark }))"
    ),
    (
        "INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details) VALUES (?, ?, 'REVISION_CREATED', 'DOCUMENT', ?)",
        "INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, 'REVISION_CREATED', 'EXPORT_JOB', ?, 'Revision created', ?)"
    ),
    (
        "run(doc.job_id, req.user.id, JSON.stringify({ document_id: id, version: nextVersion, reason }))",
        "run(req.user.id, doc.job_id, JSON.stringify({ document_id: id, version: nextVersion, reason }))"
    ),
    (
        "INSERT INTO ae_audit_logs (job_id, actor_id, action, context, details) VALUES (?, ?, 'OPERATIONAL_DATA_UPDATED', 'EXPORT_JOB', ?)",
        "INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, 'OPERATIONAL_DATA_UPDATED', 'EXPORT_JOB', ?, 'Operational data updated', ?)"
    ),
    (
        "run(id, req.user.id, JSON.stringify({ bl_mbl, cc_non_cc, coo_form, qc_attend }))",
        "run(req.user.id, id, JSON.stringify({ bl_mbl, cc_non_cc, coo_form, qc_attend }))"
    )
]

for old, new in replacements:
    content = content.replace(old, new)

with open('src/routes/v2/aeRoutes.js', 'w') as f:
    f.write(content)
