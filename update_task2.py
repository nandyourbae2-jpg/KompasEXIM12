file_path = "/Users/macbookair/.gemini/antigravity-ide/brain/fd52c19a-ead8-476d-b343-77dc9eb1d7cf/task.md"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("`[ ]` Implement UI for generating checklist (if `PENDING CONFIGURATION`)", "`[x]` Implement UI for generating checklist (if `PENDING CONFIGURATION`)")
content = content.replace("`[ ]` Update `AeJobDetail.jsx` to render checklist groups and items", "`[x]` Update `AeJobDetail.jsx` to render checklist groups and items")
content = content.replace("`[ ]` Implement item status mutation without manual refresh", "`[x]` Implement item status mutation without manual refresh")

with open(file_path, "w") as f:
    f.write(content)
