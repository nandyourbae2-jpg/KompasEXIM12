import re

file_path = "src/config/departmentFeatures.jsx"
with open(file_path, "r") as f:
    content = f.read()

replacement = """
    supervisorMenu: [
      { key: 'dashboard', label: 'AE Control Tower', component: 'AeControlTower', icon: <LayoutDashboard size={18} /> },
      { key: 'source', label: 'Log Schedule Source', component: 'SourceManagementPage', icon: <Database size={18} /> },
      { key: 'match-review', label: 'Match Review Center', component: 'MatchReviewCenter', icon: <AlertOctagon size={18} /> },
    ],
"""

content = re.sub(r"supervisorMenu: \[\n\s+{ key: 'dashboard', label: 'AE Control Tower'[\s\S]*?{ key: 'source', label: 'Log Schedule Source'[\s\S]*?\],\n", replacement.lstrip(), content)

with open(file_path, "w") as f:
    f.write(content)
print("Dept patched")
