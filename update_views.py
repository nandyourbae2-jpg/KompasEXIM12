import os
import re

def insert_import(content, import_stmt):
    if import_stmt in content: return content
    # Find last import
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    if last_import_idx != -1:
        lines.insert(last_import_idx + 1, import_stmt)
    else:
        lines.insert(0, import_stmt)
    return '\n'.join(lines)


# 1. ImportSupervisorDashboard.jsx
file = 'src/pages/Supervisor/ImportSupervisorDashboard.jsx'
with open(file, 'r') as f: content = f.read()
content = content.replace("t.assignee === staff.name", "t.assigneeId === staff.id")
content = content.replace("{task.assignee}", "{getUserName(task.assigneeId)}")
# For active badge
content = content.replace("{staff.name}", "{staff.name} {staff.status_aktif === false && <span style={{marginLeft:'4px', fontSize:'10px', padding:'2px 4px', backgroundColor:'#fee2e2', color:'#ef4444', borderRadius:'4px'}}>Nonaktif</span>}")
content = insert_import(content, "import { getUserName } from '../../utils/userLookup';")
with open(file, 'w') as f: f.write(content)

# 2. ManagerImportReport.jsx
file = 'src/pages/Manager/ManagerImportReport.jsx'
with open(file, 'r') as f: content = f.read()
content = content.replace("t.assignee === staff.name", "t.assigneeId === staff.id")
content = content.replace("{report.dibuat_oleh}", "{getUserName(report.dibuatOlehId)}")
content = content.replace("{staff.name}", "{staff.name} {staff.status_aktif === false && <span style={{marginLeft:'4px', fontSize:'10px', padding:'2px 4px', backgroundColor:'#fee2e2', color:'#ef4444', borderRadius:'4px'}}>Nonaktif</span>}")
content = insert_import(content, "import { getUserName } from '../../utils/userLookup';")
with open(file, 'w') as f: f.write(content)

# 3. ManagerHome.jsx
file = 'src/pages/Manager/ManagerHome.jsx'
with open(file, 'r') as f: content = f.read()
content = content.replace("{rep.dibuat_oleh}", "{getUserName(rep.dibuatOlehId)}")
content = content.replace("{alert.dibuat_oleh}", "{getUserName(alert.dibuatOlehId)}")
content = content.replace("{t.assignee}", "{getUserName(t.assigneeId)}")
content = insert_import(content, "import { getUserName } from '../../utils/userLookup';")
with open(file, 'w') as f: f.write(content)

# 4. TaskCard.jsx
file = 'src/components/TaskCard.jsx'
with open(file, 'r') as f: content = f.read()
content = content.replace("task.assignee ?", "task.assigneeId ?")
content = content.replace("task.assignee.charAt(0)", "getUserName(task.assigneeId).charAt(0)")
content = content.replace("{task.assignee || 'Belum di-assign'}", "{task.assigneeId ? getUserName(task.assigneeId) : 'Belum di-assign'}")
content = insert_import(content, "import { getUserName } from '../utils/userLookup';")
with open(file, 'w') as f: f.write(content)

# 5. TaskDetailModal.jsx
file = 'src/components/TaskDetailModal.jsx'
with open(file, 'r') as f: content = f.read()
content = content.replace("{task.assignee && (", "{task.assigneeId && (")
content = content.replace("{task.assignee.charAt(0).toUpperCase()}", "{getUserName(task.assigneeId).charAt(0).toUpperCase()}")
content = content.replace("{task.assignee}", "{getUserName(task.assigneeId)}")
content = insert_import(content, "import { getUserName } from '../utils/userLookup';")
with open(file, 'w') as f: f.write(content)

# 6. TaskMap.jsx
file = 'src/pages/Workspace/TaskMap.jsx'
with open(file, 'r') as f: content = f.read()
content = content.replace("t.assignee === user.name", "t.assigneeId === user.id")
content = content.replace("t.assignee === user?.name", "t.assigneeId === user?.id")
content = content.replace("assignee: newTaskAssignee || (user?.name || 'User')", "assigneeId: newTaskAssignee || (user?.id || 1)")
with open(file, 'w') as f: f.write(content)

# 7. DocumentTable.jsx
file = 'src/pages/Workspace/DocumentTable.jsx'
if os.path.exists(file):
    with open(file, 'r') as f: content = f.read()
    content = content.replace("{doc.uploadedBy}", "{getUserName(doc.uploadedById)}")
    content = insert_import(content, "import { getUserName } from '../../utils/userLookup';")
    with open(file, 'w') as f: f.write(content)

# 8. ImportOpsList.jsx
file = 'src/pages/Workspace/ImportOps/ImportOpsList.jsx'
if os.path.exists(file):
    with open(file, 'r') as f: content = f.read()
    content = content.replace("createdBy: user?.name || 'User'", "createdById: user?.id || null")
    with open(file, 'w') as f: f.write(content)
