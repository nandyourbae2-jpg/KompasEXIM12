import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Bell, Check, Clock } from 'lucide-react';
import '../Supervisor/AeControlTower.css';

const AeNotifications = () => {
  const { user } = useAuthStore();
  const token = user?.token;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/my-notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setNotifications(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/ae/my-notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // optimistically update
      setNotifications(prev => prev.map(n => n.audit_id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: '32px', textAlign: 'center' }}>Loading Notifications...</div>;

  return (
    <div className="ae-control-tower">
      <div className="act-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="act-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={24} color="#3b82f6" /> Notifications
          </h1>
          <p className="act-subtitle">System ledger and events related to your assigned jobs.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notifications.length === 0 ? (
           <div style={{ background: '#fff', padding: '48px', textAlign: 'center', color: '#64748b', borderRadius: '12px', border: '1px solid #e2e8f0' }}>No notifications found.</div>
        ) : notifications.map(n => (
          <div key={n.audit_id} style={{ 
            background: n.is_read ? '#fff' : '#f0fdfa', 
            borderRadius: '12px', 
            border: n.is_read ? '1px solid #e2e8f0' : '1px solid #5eead4', 
            padding: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            boxShadow: n.is_read ? 'none' : '0 2px 4px rgba(20, 184, 166, 0.1)'
          }}>
             <div style={{ padding: '12px', background: n.is_read ? '#f1f5f9' : '#ccfbf1', borderRadius: '8px', color: n.is_read ? '#64748b' : '#0f766e' }}>
                <Bell size={20} />
             </div>
             <div style={{ flex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                 <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px' }}>Inv: {n.invoice_no}</span>
               </div>
               <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{n.action}</div>
               <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>{n.description}</div>
               <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Clock size={12} /> {new Date(n.created_at).toLocaleString()}
               </div>
             </div>
             {!n.is_read && (
               <button 
                 onClick={() => markAsRead(n.audit_id)}
                 style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 500 }}
                 onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; }}
                 onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
               >
                 <Check size={16} color="#10b981" /> Mark Read
               </button>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AeNotifications;
