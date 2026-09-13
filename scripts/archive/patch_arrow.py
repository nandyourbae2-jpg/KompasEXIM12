import sys

with open('src/pages/Staff/AeJobWorkbench.jsx', 'r') as f:
    content = f.read()

old_arrow = """                                        {idx < docData.activities.length - 1 && (
                                           <div style={{ color: '#cbd5e1', fontSize: '14px' }}>→</div>
                                        )}"""

if old_arrow in content:
    content = content.replace(old_arrow, "")
    with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
        f.write(content)
    print("Removed arrow")
else:
    print("Could not find old_arrow")
