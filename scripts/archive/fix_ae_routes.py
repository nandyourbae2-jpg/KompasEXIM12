import sys

with open('backend/src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

# Replace req.user.id with user id lookup
target = """const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);"""
replacement = """const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);
    
    // Resolve user ID
    let execUserId = req.user.id;
    if (!execUserId && req.user.employee_id) {
        const u = db.prepare(`SELECT id FROM users WHERE employee_id = ?`).get(req.user.employee_id);
        if (u) execUserId = u.id;
    }"""

content = content.replace(target, replacement)

# Replace req.user.id inside INSERT with execUserId
target_insert = """req.user.id"""
# I only want to replace it in the INSERT INTO ae_job_activity_results block.
# Let's just use string replace for that specific section
content = content.replace("""evidence_payload ? JSON.stringify(evidence_payload) : null,
            remark,
            req.user.id""", """evidence_payload ? JSON.stringify(evidence_payload) : null,
            remark,
            execUserId""")

with open('backend/src/routes/v2/aeRoutes.js', 'w') as f:
    f.write(content)
