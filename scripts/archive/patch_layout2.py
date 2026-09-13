import sys

with open('src/pages/Staff/AeJobWorkbench.jsx', 'r') as f:
    content = f.read()

old_col = "<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>"
new_col = "<div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1, minHeight: '100%' }}>"

if old_col in content:
    content = content.replace(old_col, new_col, 1) # Only first occurrence (Left Column)
    with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
        f.write(content)
    print("Patched flexGrow")
else:
    print("Could not find old_col")
