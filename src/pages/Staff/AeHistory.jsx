import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { History, Clock } from 'lucide-react';
import '../Supervisor/AeControlTower.css';

const AeHistory = () => {
  const { user } = useAuthStore();
  const token = user?.token;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ae/my-history`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setHistory(json.data || []);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  if (loading) return <div style={{ padding: '32px', textAlign: 'center' }}>Loading History...</div>;

  return (
    <div className="ae-control-tower">
      <div className="act-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="act-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={24} color="#3b82f6" /> Activity History
          </h1>
          <p className="act-subtitle">Ledger of all actions and executions performed by you.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {history.length === 0 ? (
           <div style={{ background: '#fff', padding: '48px', textAlign: 'center', color: '#64748b', borderRadius: '12px', border: '1px solid #e2e8f0' }}>No history found.</div>
        ) : history.map(h => (
          <div key={h.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', color: '#3b82f6' }}>
                <History size={20} />
             </div>
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{h.action}</div>
               <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>{h.description}</div>
               <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Clock size={12} /> {new Date(h.created_at).toLocaleString()}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AeHistory;
