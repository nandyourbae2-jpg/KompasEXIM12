file_path = "src/pages/Staff/AeJobDetail.jsx"
with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.strip() == "<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>" and i > 390 and i < 400:
        skip = True
        new_lines.append("""
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Checklist Tasks</h2>
            {!checklistData ? (
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Checklist belum digenerate.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {checklistData.groups.map(group => (
                  <div key={group.id}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
                      {group.name}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {group.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{item.action}</span>
                          </div>
""")
    if skip and "<div>" in line and "{user?.level_otoritas === 'Staff Dept'" in lines[i+1]:
        skip = False
    
    if not skip:
        new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)
