import sys

with open('src/App.jsx', 'r') as f:
    content = f.read()

old_logic = """const DynamicStaffPage = () => {
  const { key } = useParams();
  const { user } = useAuthStore();

  const deptConfig = DEPARTMENT_FEATURES[user?.departemen] || {};
  const allMenu = deptConfig.staffMenu || [];
  const matchedItem = allMenu.find(m => m.key === key);"""

new_logic = """const DynamicStaffPage = () => {
  const { key } = useParams();
  const { user } = useAuthStore();

  const deptConfig = DEPARTMENT_FEATURES[user?.departemen] || {};
  const allMenu = deptConfig.staffMenu || [];
  
  let matchedItem = null;
  if (allMenu.length > 0 && allMenu[0].groupLabel) {
     for (const group of allMenu) {
        const found = group.items.find(m => m.key === key);
        if (found) {
           matchedItem = found;
           break;
        }
     }
  } else {
     matchedItem = allMenu.find(m => m.key === key);
  }
"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('src/App.jsx', 'w') as f:
        f.write(content)
    print("Patched DynamicStaffPage")
else:
    print("Could not find DynamicStaffPage marker")
