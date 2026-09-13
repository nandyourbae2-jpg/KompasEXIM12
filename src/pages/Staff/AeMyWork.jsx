import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { LayoutDashboard, CheckSquare, AlertOctagon, Layers, Clock } from 'lucide-react';
import '../Supervisor/AeControlTower.css';

const AeMyWork = () => {
  const { user } = useAuthStore();
  const token = user?.token;
  const navigate = useNavigate();

  const [kpis, setKpis] = useState({ actionRequired: 0, atRisk: 0, completed: 0, totalActive: 0 });
  const [jobsPreview, setJobsPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  useEffect(() => {
    const fetchMetricsAndJobs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ae/my-work`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        
        const data = json.data || {};
        setKpis({
          actionRequired: data.actionRequired || 0,
          atRisk: (data.waitingBlocked || 0) + (data.overdue || 0),
          completed: data.completed || 0,
          totalActive: (data.actionRequired || 0) + (data.waitingBlocked || 0) + (data.handoverReady || 0) + (data.overdue || 0)
        });

        // Small preview list
        const resJobs = await fetch(`${API_BASE_URL}/ae/my-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const jsonJobs = await resJobs.json();
        setJobsPreview((jsonJobs.data || []).slice(0, 5));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchMetricsAndJobs();
  }, [token]);

  if (loading) return <div className="ae-control-tower"><div style={{ padding: '32px', textAlign: 'center' }}>Loading My Work...</div></div>;
  if (error) return <div className="ae-control-tower"><div style={{ color: 'red', padding: '32px' }}>Error: {error}</div></div>;

  return (
    <div className="ae-control-tower">
      <div className="act-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="act-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={24} color="#3b82f6" /> My Work
          </h1>
          <p className="act-subtitle">Personal operational overview. Select a queue to begin.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="act-kpi-card" onClick={() => navigate('/workspace/staff/actions')} style={{ cursor: 'pointer', border: '1px solid #bfdbfe' }}>
          <div className="act-kpi-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><CheckSquare size={20} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.actionRequired}</span>
            <span className="act-kpi-label" style={{ color: '#1e40af' }}>Today's Actions</span>
          </div>
        </div>
        <div className="act-kpi-card" onClick={() => navigate('/workspace/staff/waiting')} style={{ cursor: 'pointer', border: '1px solid #fecaca' }}>
          <div className="act-kpi-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><AlertOctagon size={20} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.atRisk}</span>
            <span className="act-kpi-label" style={{ color: '#991b1b' }}>Waiting / Blocked</span>
          </div>
        </div>
        <div className="act-kpi-card" onClick={() => navigate('/workspace/staff/jobs')} style={{ cursor: 'pointer', border: '1px solid #e2e8f0' }}>
          <div className="act-kpi-icon" style={{ background: '#f1f5f9', color: '#64748b' }}><Layers size={20} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.totalActive}</span>
            <span className="act-kpi-label">Active Jobs</span>
          </div>
        </div>
        <div className="act-kpi-card" onClick={() => navigate('/workspace/staff/jobs?filter=completed')} style={{ cursor: 'pointer', border: '1px solid #a7f3d0' }}>
          <div className="act-kpi-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><CheckSquare size={20} /></div>
          <div className="act-kpi-info">
            <span className="act-kpi-value">{kpis.completed}</span>
            <span className="act-kpi-label" style={{ color: '#065f46' }}>Completed</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Recent Jobs Preview</h2>
            <button onClick={() => navigate('/workspace/staff/jobs')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>View All &rarr;</button>
         </div>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           {jobsPreview.map(job => (
             <div key={job.id} onClick={() => navigate(`/workspace/staff/job-detail/${job.id}`)} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Inv: {job.invoice_no}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{job.buyer} • Stage: {job.currentStage}</div>
                </div>
                <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 500 }}>{job.nextAction}</div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default AeMyWork;
