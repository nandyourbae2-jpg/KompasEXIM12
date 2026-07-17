import re
with open('/Users/macbookair/.gemini/antigravity-ide/brain/e8fea363-9f36-4088-8942-b3ede6d89268/task.md', 'r') as f:
    content = f.read()

content = content.replace("- `[/]` 1", "- `[x]` 1")
for i in range(2, 10):
    content = content.replace(f"- `[ ]` {i}.", f"- `[x]` {i}.")
content = content.replace("- `[ ]` TaskCard", "- `[x]` TaskCard")
content = content.replace("- `[ ]` TaskMap", "- `[x]` TaskMap")
content = content.replace("- `[ ]` AssignTaskModal", "- `[x]` AssignTaskModal")
content = content.replace("- `[ ]` ImportSupervisorDashboard", "- `[x]` ImportSupervisorDashboard")
content = content.replace("- `[ ]` 10", "- `[/]` 10")

with open('/Users/macbookair/.gemini/antigravity-ide/brain/e8fea363-9f36-4088-8942-b3ede6d89268/task.md', 'w') as f:
    f.write(content)
