import re
file_path = "backend/src/verify_phase7.js"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("const { v4: uuidv4 } = require('uuid');", "const crypto = require('crypto');\nconst uuidv4 = () => crypto.randomUUID();")

with open(file_path, "w") as f:
    f.write(content)
