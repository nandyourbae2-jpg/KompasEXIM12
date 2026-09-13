import re

file_path = "src/pages/Staff/AeMyWork.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace the top error banner
error_banner_old = """      {error && (
        <div className="act-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}"""
error_banner_new = """      {error && (
        <div className="act-error" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171' }}>
          <AlertCircle size={20} />
          <span>{(error.includes('Token') || error.includes('kedaluwarsa') || error.includes('Sesi')) ? 'Session Anda telah berakhir. Silakan login kembali.' : error}</span>
        </div>
      )}"""
content = content.replace(error_banner_old, error_banner_new)

# Hide KPIs when error
kpi_old = """      {/* KPI Cards */}
      <div className="act-kpi-grid">"""
kpi_new = """      {/* KPI Cards */}
      {!error && (
      <div className="act-kpi-grid">"""
content = content.replace(kpi_old, kpi_new)

kpi_end_old = """        </div>
      </div>

      {/* Table */}"""
kpi_end_new = """        </div>
      </div>
      )}

      {/* Table */}"""
content = content.replace(kpi_end_old, kpi_end_new)

# Handle table error vs empty state
table_logic_old = """              <tbody>
                {displayedJobs.length === 0 ? ("""
table_logic_new = """              <tbody>
                {error ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#ef4444' }}>
                      <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
                      {(error.includes('Token') || error.includes('kedaluwarsa') || error.includes('Sesi')) ? 'Session Anda telah berakhir. Silakan login kembali.' : 'Data gagal dimuat. API Error.'}
                    </td>
                  </tr>
                ) : displayedJobs.length === 0 ? ("""
content = content.replace(table_logic_old, table_logic_new)

with open(file_path, "w") as f:
    f.write(content)
