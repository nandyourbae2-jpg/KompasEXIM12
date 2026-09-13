import re

file_path = "src/pages/Supervisor/AeControlTower.jsx"
with open(file_path, "r") as f:
    content = f.read()

bad_block = """                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No jobs found in this category.
                    </td>
                  </tr>
                ) : ("""

if bad_block in content:
    content = content.replace(bad_block, "")
    with open(file_path, "w") as f:
        f.write(content)
    print("Fixed bad block")
else:
    print("Bad block not found")
