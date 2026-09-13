import sys

with open('src/config/departmentFeatures.jsx', 'r') as f:
    content = f.read()

old_ae_config = """  'Administrasi Export': {
    label: 'Administrasi Export (AE)',
    supervisorMenu: [
      { key: 'dashboard', label: 'AE Control Tower', component: 'AeControlTower', icon: <LayoutDashboard size={18} /> },
      { key: 'source', label: 'Log Schedule Source', component: 'SourceManagementPage', icon: <Database size={18} /> },
      { key: 'match-review', label: 'Match Review Center', component: 'MatchReviewCenter', icon: <AlertOctagon size={18} /> },
    ],
    staffMenu: [
      { key: 'dashboard', label: 'My Work', component: 'AeMyWork', icon: <LayoutDashboard size={18} /> },
    ],
  },"""

new_ae_config = """  'Administrasi Export': {
    label: 'Administrasi Export (AE)',
    supervisorMenu: [
      { key: 'dashboard', label: 'AE Control Tower', component: 'AeControlTower', icon: <LayoutDashboard size={18} /> },
      { key: 'source', label: 'Log Schedule Source', component: 'SourceManagementPage', icon: <Database size={18} /> },
      { key: 'match-review', label: 'Match Review Center', component: 'MatchReviewCenter', icon: <AlertOctagon size={18} /> },
    ],
    staffMenu: [
      {
        groupLabel: "WORK",
        items: [
           { key: 'dashboard', label: 'My Work', component: 'AeMyWork', icon: <LayoutDashboard size={18} /> },
           { key: 'jobs', label: 'My Jobs', component: 'AeMyJobs', icon: <Layers size={18} /> },
           { key: 'actions', label: "Today's Actions", component: 'AeTodaysActions', icon: <CheckSquare size={18} /> },
        ]
      },
      {
        groupLabel: "OPERATIONS",
        items: [
           { key: 'documents', label: 'Documents', component: 'AeDocuments', icon: <FileText size={18} /> },
           { key: 'waiting', label: 'Waiting / Blocked', component: 'AeWaiting', icon: <AlertOctagon size={18} /> },
           { key: 'handover', label: 'Handover', component: 'AeHandover', icon: <Ship size={18} /> },
        ]
      },
      {
        groupLabel: "REFERENCE",
        items: [
           { key: 'history', label: 'Activity History', component: 'AeHistory', icon: <History size={18} /> },
        ]
      },
      {
        groupLabel: "SYSTEM",
        items: [
           { key: 'notifications', label: 'Notifications', component: 'AeNotifications', icon: <Bell size={18} /> },
        ]
      }
    ],
  },"""

if old_ae_config in content:
    content = content.replace(old_ae_config, new_ae_config)
    
    # We need to ensure we import Layers, History, etc.
    if "Layers," not in content:
        content = content.replace("LayoutDashboard,", "LayoutDashboard, Layers,")
    
    with open('src/config/departmentFeatures.jsx', 'w') as f:
        f.write(content)
    print("Patched departmentFeatures.jsx")
else:
    print("Not found")
