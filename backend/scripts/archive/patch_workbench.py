import sys
with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

target = """    // RBAC
    if (req.user.level_otoritas === 'Staff Dept' && job.ae_assignee_id !== req.user.id) {
      return res.status(403).json({ success: false, code: 403, message: 'Not authorized' });
    }"""

replacement = """    // RBAC
    console.log("job.ae_assignee_id", job.ae_assignee_id, typeof job.ae_assignee_id);
    console.log("req.user.id", req.user.id, typeof req.user.id);
    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, code: 403, message: 'Not authorized', user_id: req.user.id, job_assignee: job.ae_assignee_id });
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/routes/v2/aeRoutes.js', 'w') as f:
        f.write(content)
else:
    print("target not found")
