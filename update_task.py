file_path = "/Users/macbookair/.gemini/antigravity-ide/brain/fd52c19a-ead8-476d-b343-77dc9eb1d7cf/task.md"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("`[ ]` Implement `AeChecklistRuleEngine` to evaluate deterministic JSON rules", "`[x]` Implement `AeChecklistRuleEngine` to evaluate deterministic JSON rules")
content = content.replace("`[ ]` `POST /api/v2/ae/jobs/:id/checklist/generate` (Rule evaluation and instantiation)", "`[x]` `POST /api/v2/ae/jobs/:id/checklist/generate` (Rule evaluation and instantiation)")
content = content.replace("`[ ]` `GET /api/v2/ae/jobs/:id/checklist` (Fetch instantiated checklist and progress)", "`[x]` `GET /api/v2/ae/jobs/:id/checklist` (Fetch instantiated checklist and progress)")
content = content.replace("`[ ]` `PATCH /api/v2/ae/jobs/:id/checklist/items/:itemId` (Update status/remarks/audit)", "`[x]` `PATCH /api/v2/ae/jobs/:id/checklist/items/:itemId` (Update status/remarks/audit)")

with open(file_path, "w") as f:
    f.write(content)
