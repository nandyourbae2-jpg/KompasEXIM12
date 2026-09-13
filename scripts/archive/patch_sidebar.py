import sys

with open('src/components/Sidebar.jsx', 'r') as f:
    content = f.read()

old_staff_render = """            {renderNavGroup('Navigasi Utama', coreOperational, false, 'staff')}
            {renderNavGroup(`WORKSPACE ${deptConfig.label}`, staffMenu, false, 'staff')}
            {showFinanceVendor && renderNavGroup('Finansial & Relasi', financeVendorItems)}"""

new_staff_render = """            {renderNavGroup('Navigasi Utama', coreOperational, false, 'staff')}
            {
               // If staffMenu contains groupLabel, render them as separate groups, else render as flat
               staffMenu.length > 0 && staffMenu[0].groupLabel 
                 ? staffMenu.map(group => renderNavGroup(group.groupLabel, group.items, false, 'staff'))
                 : renderNavGroup(`WORKSPACE ${deptConfig.label}`, staffMenu, false, 'staff')
            }
            {showFinanceVendor && renderNavGroup('Finansial & Relasi', financeVendorItems)}"""

if old_staff_render in content:
    content = content.replace(old_staff_render, new_staff_render)
    with open('src/components/Sidebar.jsx', 'w') as f:
        f.write(content)
    print("Patched Sidebar.jsx")
else:
    print("Could not find Sidebar.jsx marker")
