import sys

with open('src/pages/Staff/AeJobWorkbench.jsx', 'r') as f:
    content = f.read()

# I will replace the "My Next Action Module" with "Work Action Center"
old_action_module = """           {/* My Next Action Module */}
           <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #3b82f6', overflow: 'hidden', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}>
              <div style={{ padding: '16px 20px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#2563eb" />
                <h2 style={{ margin: 0, fontSize: '16px', color: '#1e40af', fontWeight: 600 }}>My Next Action</h2>
              </div>
              <div style={{ padding: '24px' }}>
                  {job.blocker ? (
                      <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', marginBottom: '12px' }}>
                             <ShieldAlert size={20} />
                             <span style={{ fontSize: '18px', fontWeight: 700 }}>ESCALATED / BLOCKED</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px', background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                             <strong>Reason:</strong> {job.blocker.reason}
                          </div>
                      </div>
                  ) : isSourceIncomplete ? (
                      <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '12px' }}>
                             <AlertCircle size={20} />
                             <span style={{ fontSize: '18px', fontWeight: 700 }}>WAITING ON EXPORT TEAM</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px', background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                             <strong>Missing Source Data:</strong> {!job.closing_docs ? 'Closing Docs ' : ''} {!job.etd ? 'ETD' : ''}
                          </div>
                      </div>
                  ) : nextActivity ? (
                      <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                             <div>
                               <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Activity</div>
                               <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{nextActivity.activity_name || nextActivity.action_type}</div>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                               <div style={{ fontSize: '12px', color: '#64748b' }}>Owner</div>
                               <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{job.ae_assignee_name || user?.nama || 'AE Staff'}</div>
                             </div>
                          </div>
                          
                          <div style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div><strong>Why:</strong> Document <span style={{ color: '#0f172a', fontWeight: 600 }}>{nextActivity.docName}</span> requires this step before proceeding to {nextActivity.stageName}.</div>
                              <div style={{ marginTop: '8px' }}><strong>Due:</strong> Dependent on Closing Docs ({job.closing_docs})</div>
                          </div>
                          
                          {isStaff && (
                              <ActionFormEngine 
                                activity={nextActivity} 
                                onComplete={handleActionComplete} 
                              />
                          )}
                      </div>
                  ) : (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#10b981' }}>
                          <CheckCircle size={48} style={{ margin: '0 auto 16px' }} />
                          <div style={{ fontSize: '20px', fontWeight: 700 }}>{job.nextAction}</div>
                          <p style={{ fontSize: '14px', color: '#64748b', margin: '8px 0 0' }}>All document workflow requirements met.</p>
                      </div>
                  )}
              </div>
           </div>"""

new_action_module = """           {/* Work Action Center */}
           <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #3b82f6', overflow: 'hidden', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}>
              
              <div style={{ padding: '16px 20px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#2563eb" />
                  <h2 style={{ margin: 0, fontSize: '16px', color: '#1e40af', fontWeight: 600 }}>Work Action Center</h2>
                </div>
                {nextActivity && (
                   <div style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', background: '#dbeafe', padding: '4px 8px', borderRadius: '4px' }}>
                     {nextActivity.activity_name || nextActivity.action_type}
                   </div>
                )}
              </div>
              
              <div style={{ padding: '24px' }}>
                  {job.blocker ? (
                      <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', marginBottom: '12px' }}>
                             <ShieldAlert size={20} />
                             <span style={{ fontSize: '18px', fontWeight: 700 }}>ESCALATED / BLOCKED</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px', background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                             <strong>Reason:</strong> {job.blocker.reason}
                          </div>
                      </div>
                  ) : isSourceIncomplete ? (
                      <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '12px' }}>
                             <AlertCircle size={20} />
                             <span style={{ fontSize: '18px', fontWeight: 700 }}>WAITING ON EXPORT TEAM</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px', background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                             <strong>Missing Source Data:</strong> {!job.closing_docs ? 'Closing Docs ' : ''} {!job.etd ? 'ETD' : ''}
                          </div>
                      </div>
                  ) : nextActivity ? (
                      <div>
                          {/* Context Bar Header */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
                             <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>CURRENT WORK</div>
                             <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{nextActivity.activity_name || nextActivity.action_type}</div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                             <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                               <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Document Context</div>
                               <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{nextActivity.docName}</div>
                               <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginTop: '4px' }}>State: {nextActivity.doc_state || 'PENDING'}</div>
                             </div>
                             <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                               <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Dependency</div>
                               <div style={{ fontSize: '14px', color: '#475569' }}>
                                 {nextActivity.stageName 
                                   ? `Required before proceeding to ${nextActivity.stageName}.`
                                   : 'Required before the next configured activity.'}
                               </div>
                               <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Assigned: {job.ae_assignee_name || user?.nama || 'AE Staff'}</div>
                             </div>
                          </div>
                          
                          {/* Execution Block */}
                          {isStaff && (
                              <ActionFormEngine 
                                activity={nextActivity} 
                                onComplete={handleActionComplete} 
                              />
                          )}
                      </div>
                  ) : (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#10b981' }}>
                          <CheckCircle size={48} style={{ margin: '0 auto 16px' }} />
                          <div style={{ fontSize: '20px', fontWeight: 700 }}>{job.nextAction}</div>
                          <p style={{ fontSize: '14px', color: '#64748b', margin: '8px 0 0' }}>All document workflow requirements met.</p>
                      </div>
                  )}
              </div>
           </div>"""

if old_action_module in content:
    content = content.replace(old_action_module, new_action_module)
    with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
        f.write(content)
    print("Patched AeJobWorkbench.jsx")
else:
    print("Could not find old_action_module")
