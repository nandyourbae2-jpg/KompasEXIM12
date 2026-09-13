import sys

with open('src/pages/Staff/AeMyJobs.jsx', 'r') as f:
    content = f.read()

old_table_header = """            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>BUSINESS IDENTITY</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>CLOSING DOCS</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>STAGE</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>NEXT ACTION</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>RISK</th>
              </tr>
            </thead>"""

new_table_header = """            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>INVOICE</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>BUYER / DESTINATION</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>SCHEDULE (CLOSING / ETD)</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>STATUS / PROGRESS</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>STAGE</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>URGENCY</th>
              </tr>
            </thead>"""

content = content.replace(old_table_header, new_table_header)

old_table_body = """                <tr key={job.id} onClick={() => navigate(`/workspace/staff/job-detail/${job.id}`)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>Inv: {job.invoice_no || '-'}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{job.destination} • {job.buyer}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 500, color: !job.closing_docs ? '#ef4444' : '#1e293b', fontSize: '14px' }}>{job.closing_docs || 'INCOMPLETE'}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{job.etd ? `ETD: ${job.etd}` : 'ETD INCOMPLETE'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{job.currentStage}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#3b82f6' }}>{job.nextAction}</span>
                    {job.blocker && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>Blocked</div>}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#ef4444' : '#64748b', padding: '4px 8px', background: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#fef2f2' : '#f8fafc', borderRadius: '4px' }}>
                      {(!job.closing_docs || !job.etd) ? '-' : job.priority}
                    </span>
                  </td>
                </tr>"""

new_table_body = """                <tr key={job.id} onClick={() => navigate(`/workspace/staff/job-detail/${job.id}`)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                    {job.invoice_no || '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>{job.buyer || '-'}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{job.destination || '-'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: !job.closing_docs ? '#ef4444' : '#334155' }}>Docs: {job.closing_docs || 'MISSING'} {job.closing_docs_time || ''}</div>
                    <div style={{ fontSize: '13px', color: !job.etd ? '#ef4444' : '#64748b', marginTop: '4px' }}>ETD: {job.etd || 'MISSING'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>{job.ae_status || 'Pending'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      {job.progress !== undefined ? `${job.progress}%` : (job.nextAction === 'Checklist not initialized' ? job.nextAction : '0%')}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{job.currentStage}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#ef4444' : '#64748b', padding: '4px 8px', background: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#fef2f2' : '#f8fafc', borderRadius: '4px' }}>
                      {(!job.closing_docs || !job.etd) ? '-' : job.priority}
                    </span>
                  </td>
                </tr>"""

content = content.replace(old_table_body, new_table_body)

# Colspan fallback
content = content.replace('colSpan="5"', 'colSpan="6"')

with open('src/pages/Staff/AeMyJobs.jsx', 'w') as f:
    f.write(content)
print("Rewritten MyJobs")
