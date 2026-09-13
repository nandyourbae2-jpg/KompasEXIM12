import re
file_path = "backend/src/verify_phase8.js"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("uuidv4()", "require('crypto').randomUUID()")

with open(file_path, "w") as f:
    f.write(content)
