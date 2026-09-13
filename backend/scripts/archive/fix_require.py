import sys
with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()
if "const AeWorkflowEngine = require('../../services/AeWorkflowEngine');" not in content:
    content = "const AeWorkflowEngine = require('../../services/AeWorkflowEngine');\n" + content
    with open('src/routes/v2/aeRoutes.js', 'w') as f:
        f.write(content)
