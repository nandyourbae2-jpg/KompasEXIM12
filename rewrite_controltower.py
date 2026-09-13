import sys

with open('src/pages/Supervisor/AeControlTower.jsx', 'r') as f:
    content = f.read()

old_table_header = """            <table className="act-table">
              <thead>
                <tr>
                  <th>Job Code</th>
                  <th>Priority</th>
                  <th>Destination</th>
                  <th>Closing Docs</th>
                  <th>Stage</th>
                  <th>Blocker</th>
                  <th>AE Assignee</th>
                  <th>Action</th>
                </tr>
              </thead>"""

new_table_header = """            <table className="act-table" style={{ width: '100%', minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>Business Identity</th>
                  <th>Closing Schedule</th>
                  <th>Prep</th>
                  <th>Soft</th>
                  <th>Final</th>
                  <th>Draft</th>
                  <th>Ori</th>
                  <th>AE Assignee</th>
                  <th>Action</th>
                </tr>
              </thead>"""

content = content.replace(old_table_header, new_table_header)

old_table_body = """                    <tr key={job.id}>
                      <td className="font-medium text-slate-800">{job.job_code}</td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#ef4444' : '#1e293b' }}>
                           {job.priority || '-'}
                        </span>
                      </td>
                      <td>{job.destination || '-'}</td>
                      <td>
                        {job.closing_docs ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{job.closing_docs}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>Pending Source</span>
                        )}
                      </td>
                      <td><span style={{ fontSize: '12px', textTransform: 'uppercase' }}>{job.currentStage || '-'}</span></td>
                      <td>
                         {job.blocker ? (
                            <span style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>BLOCKED</span>
                         ) : '-'}
                      </td>
                      <td>
                        {job.ae_assignee_name ? (
                          <span className="act-badge act-badge-assigned">
                            <Users size={12} /> {job.ae_assignee_name}
                          </span>
                        ) : (
                          <span className="act-badge act-badge-unassigned">Unassigned</span>
                        )}
                      </td>

                      <td>
                        <button 
                          className="act-btn-assign"
                          onClick={() => setSelectedJob(job)}
                        >
                          {job.ae_assignee_id ? 'Reassign' : 'Assign'}
                        </button>
                      </td>
                    </tr>"""

new_table_body = """                    <tr key={job.id}>
                      <td style={{ padding: '12px' }}>
                         <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{job.invoice_no || '-'}</div>
                         <div style={{ fontSize: '12px', color: '#64748b' }}>{job.buyer || '-'} • {job.destination || '-'}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                         <div style={{ fontWeight: 500, color: !job.closing_docs ? '#ef4444' : '#1e293b', fontSize: '13px' }}>{job.closing_docs || 'MISSING'}</div>
                         <div style={{ fontSize: '12px', color: !job.etd ? '#ef4444' : '#64748b' }}>ETD: {job.etd || 'MISSING'}</div>
                         <div style={{ marginTop: '4px' }}>
                             <span style={{ fontSize: '10px', fontWeight: 600, color: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#ef4444' : '#64748b', padding: '2px 6px', background: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#fef2f2' : '#f8fafc', borderRadius: '4px' }}>
                               {job.priority || '-'}
                             </span>
                         </div>
                      </td>
                      
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                         {job.currentStage === 'DOCUMENT PREPARATION' ? <span style={{ color: '#3b82f6' }}>●</span> : (job.progress > 10 ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: '#cbd5e1' }}>○</span>)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                         {job.currentStage === 'SOFT COPY DOCUMENT' ? <span style={{ color: '#3b82f6' }}>●</span> : (job.progress > 40 ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: '#cbd5e1' }}>○</span>)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                         {job.currentStage === 'FINAL DATA' ? <span style={{ color: '#3b82f6' }}>●</span> : (job.progress > 60 ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: '#cbd5e1' }}>○</span>)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                         {job.currentStage === 'DRAFT DOCUMENT' ? <span style={{ color: '#3b82f6' }}>●</span> : (job.progress > 80 ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: '#cbd5e1' }}>○</span>)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                         {job.currentStage === 'ORIGINAL DOCUMENT' ? <span style={{ color: '#3b82f6' }}>●</span> : (job.progress >= 100 ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: '#cbd5e1' }}>○</span>)}
                      </td>

                      <td style={{ padding: '12px' }}>
                        {job.ae_assignee_name ? (
                          <span className="act-badge act-badge-assigned">
                            <Users size={12} /> {job.ae_assignee_name}
                          </span>
                        ) : (
                          <span className="act-badge act-badge-unassigned">Unassigned</span>
                        )}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <button 
                          className="act-btn-assign"
                          onClick={() => setSelectedJob(job)}
                        >
                          {job.ae_assignee_id ? 'Reassign' : 'Assign'}
                        </button>
                      </td>
                    </tr>"""

content = content.replace(old_table_body, new_table_body)
content = content.replace('colSpan="8"', 'colSpan="9"')

with open('src/pages/Supervisor/AeControlTower.jsx', 'w') as f:
    f.write(content)
print("Rewritten ControlTower")
