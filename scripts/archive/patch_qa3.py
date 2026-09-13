import re
file_path = "backend/src/verify_phase8.js"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("VALUES ('PARTIAL-123', 'PARTIAL-123', 'TEST', 'TEST', NULL, NULL)", "VALUES ('PARTIAL-123', 'PARTIAL-123', 'TEST', 'TEST', 'TEST', NULL, NULL)")

with open(file_path, "w") as f:
    f.write(content)
