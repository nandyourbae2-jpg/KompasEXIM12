import re
file_path = "backend/src/verify_phase7.js"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("999, mockUserId);", "mockUserId, mockUserId);")

with open(file_path, "w") as f:
    f.write(content)
