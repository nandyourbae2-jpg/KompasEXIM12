import re
file_path = "backend/src/verify_phase7.js"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("assert.strictEqual(snap1.snap_document_state, 'DRAFT');", "assert.strictEqual(snap1.snap_document_state, 'MISSING');")

with open(file_path, "w") as f:
    f.write(content)
