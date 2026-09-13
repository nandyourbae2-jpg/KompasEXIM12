import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { CheckSquare, ArrowRight, Clock } from 'lucide-react';
import SlideOver from '../../components/SlideOver';
import ActionFormEngine from './ActionFormEngine';
import '../Supervisor/AeControlTower.css';

const AeTodaysActions = () => {
  const { user } = useAuthStore();
  const token = user?.token;
  const navigate = useNavigate();

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Slide-over state
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  const fetchActions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/my-actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setActions(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchActions();
  }, [token]);

  const handleExecute = (job) => {
    setSelectedJob(job);
    setIsSlideOverOpen(true);
  };

  const handleActionComplete = async (activityId, result, evidence, remark) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${selectedJob.id}/actions/${activityId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ result, evidence, remark })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      // Close slide-over
      setIsSlideOverOpen(false);
      setSelectedJob(null);
      
      // Target diffing: remove it from the actions list locally immediately for optimistic UI
      setActions(prev => prev.filter(j => j.id !== selectedJob.id));
      
      // Background sync
      fetchActions();
    } catch (err) {
      alert(`Failed to execute action: ${err.message}`);
    }
  };

  if (loading) return <div className="ae-control-tower"><div style={{ padding: '32px', textAlign: 'center' }}>Loading Actions...</div></div>;
  if (error) return <div className="ae-control-tower"><div style={{ color: 'red', padding: '32px' }}>Error: {error}</div></div>;

  return (
    <div className="ae-control-tower">
      <div className="act-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="act-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={24} color="#3b82f6" /> Today's Actions
          </h1>
          <p className="act-subtitle">Your immediate execution queue. External waits and blocked items are hidden.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {actions.length === 0 ? (
           <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center', color: '#64748b' }}>
             No executable actions required today.
           </div>
        ) : actions.map(job => (
          <div key={job.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px' }}>{job.invoice_no}</span>
                 <span style={{ fontSize: '13px', color: '#64748b' }}>{job.buyer}</span>
                 {job.priority === 'OVERDUE' && <span style={{ fontSize: '11px', fontWeight: 600, color: '#b91c1c', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>OVERDUE</span>}
               </div>
               
               <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
                 {job.nextAction}
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                 <Clock size={14} /> Stage: {job.currentStage}
               </div>
            </div>

            <button onClick={() => handleExecute(job)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#2563eb'} onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}>
              Execute <ArrowRight size={16} />
            </button>

          </div>
        ))}
      </div>

      {/* Execute SlideOver */}
      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)}
        title="Execute Action"
        subtitle={selectedJob ? `Inv: ${selectedJob.invoice_no}` : ''}
        width="600px"
      >
        {selectedJob && selectedJob.pendingActionObj && (
           <ActionFormEngine 
              activity={selectedJob.pendingActionObj} 
              onComplete={handleActionComplete} 
           />
        )}
      </SlideOver>
    </div>
  );
};

export default AeTodaysActions;
