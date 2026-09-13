import re

file_path = "src/pages/Staff/AeJobDetail.jsx"
with open(file_path, "r") as f:
    content = f.read()

new_content = """import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, AlertCircle, FileText, Activity, CheckCircle, Search, Layers, ShieldAlert, CheckSquare } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import '../Supervisor/AeControlTower.css'; // Reuse some basic classes

const AeJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const token = user?.token;
  
  const [job, setJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [checklistData, setChecklistData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const [jobRes, histRes, chkRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ae/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/checklist`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const jobJson = await jobRes.json();
      const histJson = await histRes.json();
      const chkJson = await chkRes.json();

      if (!jobJson.success) throw new Error(jobJson.message || 'Gagal memuat detail job');
      
      setJob(jobJson.data);
      if (histJson.success) setHistory(histJson.data);
      if (chkJson.success) {
        setChecklistData(chkJson.data);
      } else {
        setChecklistData(null); // Explicitly null if not found
      }
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchJobDetail();
  }, [token, id]);

  const handleStartWork = async () => {
    if (!window.confirm('Are you sure you want to start work on this job?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      await fetchJobDetail();
    } catch (err) {
      alert(`Gagal memulai: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateChecklist = async () => {
    setChecklistLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/checklist/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      // Refresh to get new checklist
      await fetchJobDetail();
    } catch (err) {
      alert(`Gagal generate checklist: ${err.message}`);
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleUpdateChecklistStatus = async (itemId, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/checklist/items/${itemId}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      // Optimistic update of UI
      setChecklistData(prev => {
        const newGroups = { ...prev.groups };
        for (const groupName in newGroups) {
          const idx = newGroups[groupName].findIndex(i => i.id === itemId);
          if (idx !== -1) {
            newGroups[groupName][idx] = json.data.item;
            break;
          }
        }
        return { ...prev, groups: newGroups };
      });
      
      // Update global progress cache silently
      setJob(prev => ({ ...prev, ae_progress: json.data.progress }));
      
      // Fetch history in background
      fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if(data.success) setHistory(data.data); });

    } catch (err) {
      alert(`Gagal update status: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="ae-control-tower">
        <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading job details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ae-control-tower">
        <button onClick={() => navigate(-1)} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <ArrowLeft size={16}/> Back
        </button>
        <div className="act-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="ae-control-tower">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}>
          <ArrowLeft size={18}/>
        </button>
        <div>
          <h1 className="act-title">Job Detail: {job.job_code}</h1>
          <p className="act-subtitle">Invoice: {job.invoice_no || '-'} • Buyer: {job.buyer || '-'}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          {job.ae_status === 'Assigned' && user?.level_otoritas === 'Staff Dept' && (
            <button 
              onClick={handleStartWork}
              disabled={actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <Play size={16} />
              {actionLoading ? 'Starting...' : 'Start Work'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Job Overview */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#3b82f6"/> AE Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Assignee</span>
                <span style={{ fontWeight: 500, color: '#1e293b' }}>{job.ae_assignee_name || 'Unassigned'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</span>
                <span className={`act-status-badge act-status-${job.ae_status?.toLowerCase().replace(' ', '-')}`}>{job.ae_status}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Progress</span>
                <span style={{ fontWeight: 500, color: '#1e293b' }}>{job.ae_progress}%</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Handover Status</span>
                <span style={{ fontWeight: 500, color: '#1e293b' }}>{job.ae_handover_status}</span>
              </div>
            </div>
          </div>

          {/* Checklist Area */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={18} color="#10b981"/> Operational Checklist
              </h2>
              
              {!checklistData && user?.level_otoritas === 'Staff Dept' && (
                <button 
                  onClick={handleGenerateChecklist}
                  disabled={checklistLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: checklistLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500 }}
                >
                  <Layers size={14}/> {checklistLoading ? 'Generating...' : 'Evaluate & Generate Checklist'}
                </button>
              )}
            </div>

            {!checklistData ? (
              <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <ShieldAlert size={32} color="#64748b" style={{ margin: '0 auto 12px' }}/>
                <h3 style={{ margin: '0 0 4px', color: '#334155', fontSize: '15px' }}>Checklist Pending Configuration</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>The checklist rules have not been evaluated for this job yet.</p>
                {(!job.product_type || !job.fasilitas_kite || !job.destination) && (
                  <div style={{ marginTop: '12px', display: 'inline-block', padding: '6px 12px', backgroundColor: '#fff7ed', color: '#c2410c', borderRadius: '6px', fontSize: '12px', border: '1px solid #ffedd5' }}>
                    <strong>Notice:</strong> Source data is incomplete. Generation may fail.
                  </div>
                )}
              </div>
            ) : checklistData.status === 'PENDING CONFIGURATION' ? (
              <div style={{ padding: '32px', textAlign: 'center', background: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                <ShieldAlert size={32} color="#c2410c" style={{ margin: '0 auto 12px' }}/>
                <h3 style={{ margin: '0 0 4px', color: '#9a3412', fontSize: '15px' }}>Configuration Blocked</h3>
                <p style={{ margin: 0, color: '#c2410c', fontSize: '13px' }}>Missing required source fields to safely evaluate rules.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.keys(checklistData.groups || {}).map((groupName, i) => (
                  <div key={i}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      {groupName}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {checklistData.groups[groupName].map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: item.status === 'NOT APPLICABLE' ? '#f8fafc' : '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', opacity: item.status === 'NOT APPLICABLE' ? 0.6 : 1 }}>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                              {item.status === 'COMPLETED' ? <CheckCircle size={18} color="#10b981"/> : 
                               item.status === 'NOT APPLICABLE' ? <span style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '18px' }}>-</span> :
                               <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #cbd5e1' }}/>}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b', textDecoration: item.status === 'NOT APPLICABLE' ? 'line-through' : 'none' }}>
                                {item.snap_item_label}
                                {item.snap_is_required === 1 && item.status !== 'NOT APPLICABLE' && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                              </div>
                              {item.remarks && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{item.remarks}</div>}
                            </div>
                          </div>

                          <div>
                            {user?.level_otoritas === 'Staff Dept' && job.ae_assignee_id === user?.id ? (
                              <select 
                                value={item.status}
                                onChange={(e) => handleUpdateChecklistStatus(item.id, item.status, e.target.value)}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', outline: 'none' }}
                                disabled={item.status === 'NOT APPLICABLE'}
                              >
                                <option value="NOT STARTED">Not Started</option>
                                <option value="IN PROGRESS">In Progress</option>
                                <option value="WAITING">Waiting</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="BLOCKED">Blocked</option>
                                <option value="NOT APPLICABLE">Not Applicable</option>
                              </select>
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 500, padding: '4px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                                {item.status}
                              </span>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Source Information */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Source Integrity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Destination</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>{job.destination || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Product Type</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>{job.product_type || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>KITE</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>{job.fasilitas_kite || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Closing Docs</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>{job.closing_docs || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>ETD</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>{job.etd || '-'}</span>
              </div>
            </div>
          </div>

          {/* Activity History */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#64748b"/> Activity History
            </h2>
            {history.length === 0 ? (
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>No activity recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {history.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ marginTop: '2px' }}><Clock size={16} color="#94a3b8" /></div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{log.description}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        by {log.user_name} • {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
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

export default AeJobDetail;
"""

with open(file_path, "w") as f:
    f.write(new_content)

print("AeJobDetail.jsx rewritten successfully.")
