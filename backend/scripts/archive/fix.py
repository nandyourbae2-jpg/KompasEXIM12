import sys
with open('src/routes/v2/aeRoutes.js', 'r') as f:
    lines = f.readlines()
with open('src/routes/v2/aeRoutes.js', 'w') as f:
    for line in lines:
        if "const AeWorkflowEngine = require('../../services/AeWorkflowEngine');" in line:
            pass # remove this line
        else:
            f.write(line)
