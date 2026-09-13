import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { AlertOctagon, Clock, User, CheckCircle, Search } from 'lucide-react';
import SlideOver from '../../components/SlideOver';
import '../Supervisor/AeControlTower.css';

const AeWaiting = () => {
  const { user } = useAuthStore();
  const token = user?.token;
  const navigate = useNavigate();

  const [blockers, setBlockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Slide-over state
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  const fetchBlockers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/my-blockers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setBlockers(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBlockers();
  }, [token]);

  const handleAction = (job) => {
    setSelectedJob(job);
    setIsSlideOverOpen(true);
    setResolutionNote('');
  };

  const handleResolve = async () => {
    if (!resolutionNote) return alert('Resolution note is required');
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${selectedJob.id}/blockers/${selectedJob.blocker?.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resolution_note: resolutionNote })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      setIsSlideOverOpen(false);
      setSelectedJob(null);
      setBlockers(prev => prev.filter(b => b.id !== selectedJob.id));
      fetchBlockers();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  if (loading) return <div className="ae-control-tower"><div style={{ padding: '32px', textAlign: 'center' }}>Loading Blockers...</div></div>;
  if (error) return <div className="ae-control-tower"><div style={{ color: 'red', padding: '32px' }}>Error: {error}</div></div>;

  return (
    <div className="ae-control-tower">
      <div className="act-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="act-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={24} color="#ef4444" /> Waiting / Blocked Queue
          </h1>
          <p className="act-subtitle">Track jobs blocked by issues or waiting on external dependencies.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {blockers.length === 0 ? (
           <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center', color: '#64748b' }}>
             No jobs are currently blocked or waiting.
           </div>
        ) : blockers.map(job => (
          <div key={job.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px' }}>{job.invoice_no}</span>
                 <span style={{ fontSize: '13px', color: '#64748b' }}>{job.buyer}</span>
               </div>
               
               <div style={{ fontSize: '18px', fontWeight: 600, color: job.blocker ? '#b91c1c' : '#b45309' }}>
                 {job.nextAction}
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                 {job.blocker && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Reported by: {job.blocker.reported_by_name}</span>}
                 {job.blocker && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(job.blocker.reported_at).toLocaleString()}</span>}
               </div>
            </div>

            <button onClick={() => handleAction(job)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              {job.blocker ? 'Resolve / Follow Up' : 'View Source'} 
            </button>

          </div>
        ))}
      </div>

      {/* SlideOver */}
      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)}
        title={selectedJob?.blocker ? 'Resolve Blocker' : 'Missing Source'}
        subtitle={selectedJob ? `Inv: ${selectedJob.invoice_no}` : ''}
        width="500px"
      >
        {selectedJob && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             {selectedJob.blocker ? (
                <>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b', marginBottom: '8px' }}>Reason: {selectedJob.blocker.reason}</div>
                    <div style={{ fontSize: '13px', color: '#b91c1c' }}>Reported by: {selectedJob.blocker.reported_by_name}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Resolution Note</label>
                    <textarea 
                      value={resolutionNote}
                      onChange={e => setResolutionNote(e.target.value)}
                      placeholder="How was this resolved? Or add a follow up note..."
                      style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', minHeight: '120px', resize: 'vertical' }}
                    />
                  </div>
                  
                  <button onClick={handleResolve} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <CheckCircle size={18} /> Submit Resolution
                  </button>
                </>
             ) : (
                <>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#b45309', marginBottom: '8px' }}>Source documents are missing from Export Team.</div>
                    <div style={{ fontSize: '13px', color: '#92400e' }}>Awaiting explicit source data updates before this job can proceed to Preparation.</div>
                  </div>
                  <button onClick={() => { setIsSlideOverOpen(false); navigate(`/workspace/staff/job-detail/${selectedJob.id}`); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <Search size={18} /> Open Job Workbench
                  </button>
                </>
             )}
           </div>
        )}
      </SlideOver>
    </div>
  );
};

export default AeWaiting;
