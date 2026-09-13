import sys

with open('src/pages/Staff/AeJobWorkbench.jsx', 'r') as f:
    content = f.read()

old_pipeline = """           {/* Document Pipeline */}
           {Object.keys(workbench).length > 0 && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <h3 style={{ margin: 0, fontSize: '15px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <FileText size={16} /> Document Pipeline
               </h3>
               {Object.keys(workbench).map(stageName => (
                 <div key={stageName} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                   <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                     <h2 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>{stageName}</h2>
                   </div>
                   
                   <div style={{ padding: '16px' }}>
                     {Object.keys(workbench[stageName]).map(docName => {
                       const docData = workbench[stageName][docName];
                       const docVersion = docData.activities[0]?.version || 1;
                       
                       return (
                         <div key={docName} style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#fff' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>📄 {docName}</h3>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Version: V{docVersion} • State: {docData.activities[0]?.doc_state || 'DRAFT'}</div>
                              </div>
                           </div>
                           
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             {docData.activities.map(act => (
                               <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px', background: act.status === 'COMPLETED' ? '#f0fdf4' : (act.status === 'FAILED' ? '#fef2f2' : '#f8fafc'), borderRadius: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {act.status === 'COMPLETED' ? <CheckCircle size={14} color="#10b981"/> : <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #cbd5e1' }}></span>}
                                    <span style={{ color: act.status === 'COMPLETED' ? '#065f46' : '#1e293b', fontWeight: act.status === 'IN PROGRESS' ? 600 : 400 }}>{act.activity_name || act.action}</span>
                                  </div>
                                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{act.status}</span>
                               </div>
                             ))}
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 </div>
               ))}
             </div>
           )}"""

new_pipeline = """           {/* Document Workbench */}
           {Object.keys(workbench).length > 0 && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
               <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Layers size={18} /> Document Workbench
               </h3>
               
               <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto' }}>
                 {Object.keys(workbench).map(stageName => (
                   <button 
                     key={stageName} 
                     style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        borderBottom: '2px solid #3b82f6', 
                        padding: '12px 16px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#1e40af', 
                        cursor: 'pointer', 
                        whiteSpace: 'nowrap' 
                     }}
                   >
                     {stageName.toUpperCase()}
                   </button>
                 ))}
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {Object.keys(workbench).map(stageName => (
                    <div key={stageName}>
                     {Object.keys(workbench[stageName]).map(docName => {
                       const docData = workbench[stageName][docName];
                       const isNA = docData.activities.some(act => act.status === 'N/A' || act.activity_name === 'N/A');
                       
                       return (
                         <div key={docName} style={{ marginBottom: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{docName}</h3>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                                   {isNA ? (
                                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569' }}>N/A — Excluded by template rule</span>
                                   ) : (
                                      <>
                                        V{docData.activities[0]?.version || 1} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> 
                                        <span style={{ color: '#0f172a' }}>{docData.activities[0]?.doc_state || 'PENDING'}</span>
                                      </>
                                   )}
                                </div>
                              </div>
                           </div>
                           
                           {!isNA && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {docData.activities.map((act, idx) => {
                                   let symbol = '○';
                                   let color = '#94a3b8';
                                   let bg = 'transparent';
                                   let isCurrent = false;

                                   if (act.status === 'COMPLETED') {
                                      symbol = '✓';
                                      color = '#10b981';
                                   } else if (nextActivity && act.id === nextActivity.id) {
                                      symbol = '●';
                                      color = '#2563eb';
                                      bg = '#eff6ff';
                                      isCurrent = true;
                                   }

                                   return (
                                     <React.Fragment key={act.id}>
                                        <div 
                                          onClick={() => {
                                             if (isCurrent) {
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                             }
                                          }}
                                          style={{ 
                                             display: 'flex', 
                                             alignItems: 'center', 
                                             gap: '6px', 
                                             fontSize: '13px', 
                                             fontWeight: isCurrent ? 700 : 500, 
                                             color, 
                                             background: bg,
                                             padding: '6px 10px',
                                             borderRadius: '20px',
                                             cursor: isCurrent ? 'pointer' : 'default',
                                             border: isCurrent ? '1px solid #bfdbfe' : '1px solid transparent'
                                          }}
                                        >
                                           <span style={{ fontSize: '14px' }}>{symbol}</span>
                                           {act.activity_name || act.action}
                                        </div>
                                        {idx < docData.activities.length - 1 && (
                                           <div style={{ color: '#cbd5e1', fontSize: '14px' }}>→</div>
                                        )}
                                     </React.Fragment>
                                   )
                                })}
                              </div>
                           )}
                         </div>
                       )
                     })}
                    </div>
                 ))}
               </div>
             </div>
           )}"""

if old_pipeline in content:
    content = content.replace(old_pipeline, new_pipeline)
    with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
        f.write(content)
    print("Patched AeJobWorkbench.jsx Document Workbench")
else:
    print("Could not find old_pipeline")
