import sys

# We'll just generate the whole file
content = """import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, AlertCircle, FileText, Activity, CheckCircle, Search, Layers, ShieldAlert, CheckSquare, Calendar, Anchor, Truck, User } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import ActionFormEngine from './ActionFormEngine';
import '../Supervisor/AeControlTower.css';

const AeJobWorkbench = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const token = user?.token;
  
  const [job, setJob] = useState(null);
  const [workbench, setWorkbench] = useState({});
  const [blockers, setBlockers] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationalData, setOperationalData] = useState({ bl_mbl: '', cc_non_cc: '', coo_form: '', qc_attend: '' });
  const [savingOps, setSavingOps] = useState(false);
  const [qcAttendApplicable, setQcAttendApplicable] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  const fetchWorkbench = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/workbench`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Gagal memuat workbench');
      
      setJob(json.data.job);
      setWorkbench(json.data.workbench);
      setBlockers(json.data.blockers);
      setQcAttendApplicable(json.data.job.qcAttendApplicable || false);
      setOperationalData({
         bl_mbl: json.data.job.bl_mbl || '',
         cc_non_cc: json.data.job.cc_non_cc || '',
         coo_form: json.data.job.coo_form || '',
         qc_attend: json.data.job.qc_attend || ''
      });
      setError(null);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setHistory(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token && id) fetchWorkbench();
  }, [token, id]);

  const handleActionComplete = async (activityId, result, evidence, remark) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/actions/${activityId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ result, evidence_payload: evidence, remark })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      await fetchWorkbench();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveOperationalData = async () => {
    setSavingOps(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/operational-data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(operationalData)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      alert('Operational data saved.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingOps(false);
    }
  };

  if (loading) return <div className="ae-control-tower"><div style={{ padding: '32px', textAlign: 'center' }}>Memuat Workbench...</div></div>;
  if (error) return <div className="ae-control-tower"><div style={{ padding: '32px', color: 'red' }}>Error: {error}</div></div>;

  const isStaff = user?.role === 'Staff Dept' || user?.role === 'Manager' || user?.role === 'Supervisor';
  const isSourceIncomplete = !job.closing_docs || !job.etd;
  const nextActivity = job.pendingActionObj;

  return (
    <div className="ae-control-tower" style={{ paddingBottom: '64px' }}>
      
      {/* Top Header: Read-Only Source Context */}
      <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', marginBottom: '24px', color: '#fff' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
               <ArrowLeft size={16} /> Back
            </button>
            <div>
               <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Inv: {job.invoice_no || '-'} <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 400 }}>| {job.job_code}</span></h1>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
               <span style={{ background: job.ae_status === 'Completed' ? '#10b981' : '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{job.ae_status}</span>
               {job.priority !== 'NORMAL' && <span style={{ background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{job.priority}</span>}
            </div>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <div>
               <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Customer Context</div>
               <div style={{ fontSize: '14px', fontWeight: 500 }}>Buyer: {job.buyer || '-'}</div>
               <div style={{ fontSize: '14px', fontWeight: 500 }}>Dest: {job.destination || '-'} ({job.destination_country || '-'})</div>
            </div>
            <div>
               <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={14} /> Product & Cargo</div>
               <div style={{ fontSize: '14px', fontWeight: 500 }}>Type: {job.product_type || '-'}</div>
               <div style={{ fontSize: '14px', fontWeight: 500 }}>Qty FCL: {job.container_qty || '-'}</div>
            </div>
            <div>
               <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Schedule (Source)</div>
               <div style={{ fontSize: '14px', fontWeight: 500, color: !job.closing_docs ? '#f87171' : '#fff' }}>Closing Docs: {job.closing_docs || 'MISSING'}</div>
               <div style={{ fontSize: '14px', fontWeight: 500, color: !job.etd ? '#f87171' : '#fff' }}>ETD: {job.etd || 'MISSING'}</div>
            </div>
            <div>
               <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Anchor size={14} /> Routing</div>
               <div style={{ fontSize: '14px', fontWeight: 500 }}>Liner: {job.liner || '-'}</div>
               <div style={{ fontSize: '14px', fontWeight: 500 }}>FWD: {job.fwd_trucking || '-'}</div>
            </div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '65% 35%', gap: '24px' }}>
        
        {/* Left Column: Primary Workflow (65%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           
           {/* My Next Action Module */}
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
           </div>

           {/* Document Pipeline */}
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
           )}
        </div>

        {/* Right Column: Secondary Meta (35%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Operational Data */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Operational Data</h2>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
               Owned by Administrasi Export. Values persist independently of source sync.
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>BL / MBL</label>
                  <input type="text" value={operationalData.bl_mbl} onChange={e => setOperationalData({...operationalData, bl_mbl: e.target.value})} disabled={!isStaff} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
               </div>
               <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>CC / Non-CC</label>
                  <select value={operationalData.cc_non_cc} onChange={e => setOperationalData({...operationalData, cc_non_cc: e.target.value})} disabled={!isStaff} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="">- Select -</option>
                    <option value="CC">CC</option>
                    <option value="NON_CC">NON CC</option>
                  </select>
               </div>
               <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>COO Form</label>
                  <input type="text" value={operationalData.coo_form} onChange={e => setOperationalData({...operationalData, coo_form: e.target.value})} disabled={!isStaff} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
               </div>
               <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>QC Attend</label>
                  {!qcAttendApplicable ? (
                     <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '13px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        N/A (Business Validation Required)
                     </div>
                  ) : (
                     <select value={operationalData.qc_attend} onChange={e => setOperationalData({...operationalData, qc_attend: e.target.value})} disabled={!isStaff} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                       <option value="">- Select -</option>
                       <option value="YES">YES</option>
                       <option value="NO">NO</option>
                     </select>
                  )}
               </div>
               {isStaff && (
                  <button onClick={handleSaveOperationalData} disabled={savingOps} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', marginTop: '8px', fontWeight: 600 }}>
                     {savingOps ? 'Saving...' : 'Save Data'}
                  </button>
               )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
             <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#64748b"/> Activity Ledger
             </h2>
             {history.length === 0 ? (
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>No activity logged yet.</p>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '2px solid #e2e8f0', marginLeft: '8px', paddingLeft: '16px' }}>
                   {history.map(item => (
                      <div key={item.id} style={{ position: 'relative' }}>
                         <div style={{ position: 'absolute', left: '-23px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#cbd5e1', border: '2px solid #fff' }}></div>
                         <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{item.action}</div>
                         <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>{item.description}</div>
                         <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{new Date(item.created_at).toLocaleString()} • {item.user_name || item.user_id}</div>
                      </div>
                   ))}
                </div>
             )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AeJobWorkbench;
"""

with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
    f.write(content)

print("Rewrote AeJobWorkbench.jsx")
