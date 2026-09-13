import re

file_path = "backend/src/routes/v2/aeRoutes.js"
with open(file_path, "r") as f:
    content = f.read()

# 1. Fix GET /jobs ORDER BY
old_order = """ORDER BY 
        CASE WHEN e.ae_status = 'Completed' THEN 1 ELSE 0 END,
        e.closing_docs ASC,
        e.closing_docs_time ASC,
        e.etd ASC"""

new_order = """ORDER BY 
        CASE WHEN e.ae_status = 'Completed' THEN 1 ELSE 0 END,
        CASE WHEN e.closing_docs IS NULL THEN 1 ELSE 0 END, -- Push NULL closing_docs to end of priority
        e.closing_docs ASC,
        e.etd ASC,
        e.eta ASC,
        e.destination ASC"""

content = content.replace(old_order, new_order)

# 2. Fix PATCH /jobs/:id/assignment to return ae_assignee_name
old_patch_return = "const updatedJob = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);"
new_patch_return = """const updatedJob = db.prepare(`
      SELECT e.*, u.nama as ae_assignee_name 
      FROM export_jobs e 
      LEFT JOIN users u ON e.ae_assignee_id = u.id 
      WHERE e.id = ?
    `).get(id);"""

content = content.replace(old_patch_return, new_patch_return)

with open(file_path, "w") as f:
    f.write(content)
print("aeRoutes.js patched successfully")
