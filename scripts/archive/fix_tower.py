import re

file_path = "src/pages/Supervisor/AeControlTower.jsx"
with open(file_path, "r") as f:
    content = f.read()

# I will find the part from {matchReviewsError to null}</h2>
# and replace it with the proper structure
start_idx = content.find("{matchReviewsError ? (")
end_idx = content.find("</div>\n        \n        {loading ? (")
if start_idx != -1 and end_idx != -1:
    before = content[:start_idx]
    after = content[end_idx:]
    
    fixed_banner = """{matchReviewsError ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#b91c1c' }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Failed to load Match Reviews. API Error.</span>
        </div>
      ) : matchReviewsCount > 0 ? (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b45309' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>You have {matchReviewsCount} pending Source Match Review{matchReviewsCount > 1 ? 's' : ''}. Some imported log schedule rows are ambiguous.</span>
          </div>
          <button 
            onClick={() => navigate('/workspace/supervisor/match-review')}
            style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
          >
            Review Now
          </button>
        </div>
      ) : null}

      <div className="act-header">
        <div>
          <h1 className="act-title">AE Control Tower</h1>
          <p className="act-subtitle">Monitor workload, assign jobs, and track Administrasi Export performance.</p>
        </div>
        <button className="act-refresh-btn" onClick={fetchJobs} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="act-kpi-grid">
        <div className="act-kpi-card" onClick={() => setFilterMode('All')} data-active={filterMode === 'All'}>
          <div className="act-kpi-icon blue"><FileText size={24} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.total}</span>
            <span className="act-kpi-label">Total Active Jobs</span>
          </div>
        </div>
        <div className="act-kpi-card" onClick={() => setFilterMode('Unassigned')} data-active={filterMode === 'Unassigned'}>
          <div className="act-kpi-icon orange"><AlertCircle size={24} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.unassigned}</span>
            <span className="act-kpi-label">Unassigned</span>
          </div>
        </div>
        <div className="act-kpi-card" onClick={() => setFilterMode('Assigned')} data-active={filterMode === 'Assigned'}>
          <div className="act-kpi-icon purple"><Users size={24} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.assigned}</span>
            <span className="act-kpi-label">In Progress</span>
          </div>
        </div>
        <div className="act-kpi-card">
          <div className="act-kpi-icon red"><Clock size={24} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.overdue}</span>
            <span className="act-kpi-label">Overdue</span>
          </div>
        </div>
        <div className="act-kpi-card">
          <div className="act-kpi-icon green"><CheckCircle size={24} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.completed}</span>
            <span className="act-kpi-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Workload Table */}
      <div className="act-table-container">
        <div className="act-table-header">
          <h2>Job Pipeline ({filterMode})</h2>
        """
    
    with open(file_path, "w") as f:
        f.write(before + fixed_banner + after)
    print("Fixed syntax")
