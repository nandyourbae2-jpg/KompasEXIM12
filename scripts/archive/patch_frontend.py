import sys
with open('AeJobWorkbench.jsx', 'r') as f:
    content = f.read()

# 1. Add history state
if "const [history, setHistory] = useState([]);" not in content:
    content = content.replace(
        "const [blockers, setBlockers] = useState([]);",
        "const [blockers, setBlockers] = useState([]);\n  const [history, setHistory] = useState([]);"
    )

# 2. Add handleGenerateChecklist
if "handleGenerateChecklist" not in content:
    content = content.replace(
        "const handleStartWork = async () => {",
        """const handleGenerateChecklist = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/generate-checklist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      await fetchWorkbench();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json) setHistory(json);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWork = async () => {"""
    )

# 3. Call fetchHistory inside fetchWorkbench
if "fetchHistory();" not in content:
    content = content.replace(
        "setBlockers(json.data.blockers);",
        "setBlockers(json.data.blockers);\n      fetchHistory();"
    )

# 4. Modify rendering of Left Column to handle Empty State and show Timeline
left_col_start = "{/* Left Column: Documents & Activities */}"
left_col_end = "{/* Right Column: Context & Blockers */}"
old_left_col = content[content.index(left_col_start):content.index(left_col_end)]

new_left_col = """{/* Left Column: Documents & Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           {Object.keys(workbench).length === 0 ? (
             <div style={{ background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', padding: '48px', textAlign: 'center' }}>
                <Layers size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>Workflow Not Configured</h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>Checklist and Document Requirements have not been generated for this job.</p>
                {isStaff && (
                   <button onClick={handleGenerateChecklist} disabled={actionLoading} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                     {actionLoading ? 'Generating...' : 'Generate Checklist'}
                   </button>
                )}
             </div>
           ) : (
             Object.keys(workbench).map(stageName => (
               <div key={stageName} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                 <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Layers size={18} color="#3b82f6" />
                   <h2 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{stageName}</h2>
                 </div>
                 
                 <div style={{ padding: '16px' }}>
                   {Object.keys(workbench[stageName]).map(docName => {
                     const docData = workbench[stageName][docName];
                     
                     return (
                       <div key={docName} style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#fff' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>📄 {docName}</h3>
                         </div>
                         
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                           {docData.activities.map(act => (
                             <div key={act.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                     <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{act.activity_name || act.action}</div>
                                     <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Status: {act.status}</div>
                                  </div>
                                  {act.status === 'COMPLETED' ? (
                                     <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                                        <CheckCircle size={14} /> Completed
                                     </div>
                                  ) : (
                                     <span style={{ fontSize: '12px', padding: '2px 8px', background: '#e2e8f0', borderRadius: '4px' }}>{act.status}</span>
                                  )}
                               </div>
                               
                               {isStaff && act.status !== 'COMPLETED' && act.status !== 'NOT APPLICABLE' && act.status !== 'BLOCKED' && (
                                  <ActionFormEngine 
                                    activity={act} 
                                    onComplete={handleActionComplete} 
                                    disabled={job.ae_status !== 'In Progress' && job.ae_status !== 'Assigned'}
                                  />
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </div>
             ))
           )}
           
           {/* Activity Timeline */}
           <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginTop: '8px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Activity size={18} color="#64748b"/> History Feed
              </h2>
              {history.length === 0 ? (
                 <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>No activity logged yet.</p>
              ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid #e2e8f0', marginLeft: '8px', paddingLeft: '16px' }}>
                    {history.map(item => (
                       <div key={item.id} style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', border: '2px solid #fff' }}></div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{item.action}</div>
                          <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{item.description}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{new Date(item.created_at).toLocaleString()} • by {item.user_name || item.user_id}</div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

        """

content = content.replace(old_left_col, new_left_col)

with open('AeJobWorkbench.jsx', 'w') as f:
    f.write(content)
