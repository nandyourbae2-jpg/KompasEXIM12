import sys

with open('src/pages/Staff/AeMyWork.jsx', 'r') as f:
    content = f.read()

# I will replace the summary cards click logic
content = content.replace(
    """<div className="act-kpi-card" onClick={() => setFilterMode('All')} data-active={filterMode === 'All'}>""",
    """<div className="act-kpi-card" onClick={() => navigate('/workspace/staff/jobs')} data-active={false}>"""
)
content = content.replace(
    """<div className="act-kpi-card" onClick={() => setFilterMode('Action Required')} data-active={filterMode === 'Action Required'}>""",
    """<div className="act-kpi-card" onClick={() => navigate('/workspace/staff/actions')} data-active={false}>"""
)
content = content.replace(
    """<div className="act-kpi-card" onClick={() => setFilterMode('At Risk')} data-active={filterMode === 'At Risk'}>""",
    """<div className="act-kpi-card" onClick={() => navigate('/workspace/staff/jobs?filter=overdue')} data-active={false}>"""
)
content = content.replace(
    """<div className="act-kpi-card" onClick={() => setFilterMode('Completed')} data-active={filterMode === 'Completed'}>""",
    """<div className="act-kpi-card" onClick={() => navigate('/workspace/staff/jobs?filter=completed')} data-active={false}>"""
)

# Replace the "View All Jobs ->" button
content = content.replace(
    """<span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }} onClick={() => setFilterMode('All')}>View All Jobs &rarr;</span>""",
    """<span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/workspace/staff/jobs')}>View All Jobs &rarr;</span>"""
)

# And the title
content = content.replace(
    """<h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>{filterMode === 'All' ? 'My Active Jobs' : filterMode === 'Action Required' ? 'My Action Queue' : filterMode === 'At Risk' ? 'Blocked & Overdue' : 'Completed Jobs'}</h2>""",
    """<h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Active Jobs Preview</h2>"""
)

with open('src/pages/Staff/AeMyWork.jsx', 'w') as f:
    f.write(content)
print("Patched AeMyWork links")
