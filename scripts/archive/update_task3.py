file_path = "/Users/macbookair/.gemini/antigravity-ide/brain/fd52c19a-ead8-476d-b343-77dc9eb1d7cf/task.md"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("`[ ]` Run Vite Build and Start Backend", "`[x]` Run Vite Build and Start Backend")
content = content.replace("`[ ]` Idempotency check on generation", "`[x]` Idempotency check on generation")
content = content.replace("`[ ]` Rule engine partial evaluation", "`[x]` Rule engine partial evaluation")
content = content.replace("`[ ]` RBAC validation (Staff vs Supervisor)", "`[x]` RBAC validation (Staff vs Supervisor)")

with open(file_path, "w") as f:
    f.write(content)
