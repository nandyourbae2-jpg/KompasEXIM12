import React, { useState } from 'react';

const OperationalAlertsManager = ({ alerts = [], onAddAlert, onRemoveAlert }) => {
  const [newAlert, setNewAlert] = useState('');

  const handleAdd = () => {
    if (newAlert.trim()) {
      onAddAlert(newAlert.trim());
      setNewAlert('');
    }
  };

  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{
      backgroundColor: 'var(--color-annotation-highlight-bg)',
      border: '1px solid var(--color-annotation-highlight-border)',
      padding: '20px', borderRadius: 'var(--rounded-lg)', marginBottom: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            <svg style={{ height: '20px', width: '20px', color: '#ca8a04' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div style={{ marginLeft: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#854d0e', letterSpacing: '-0.374px', margin: 0 }}>Operational Alerts (Active Business Rules)</h3>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#a16207' }}>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }}>
                {alerts.map((alert, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '500', letterSpacing: '-0.374px' }}>{alert}</span>
                    {onRemoveAlert && (
                      <button 
                        onClick={() => onRemoveAlert(idx)} 
                        style={{ color: 'var(--color-status-danger)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginLeft: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {onAddAlert && (
        <div style={{ marginTop: '16px', marginLeft: '32px', display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            value={newAlert}
            onChange={(e) => setNewAlert(e.target.value)}
            placeholder="Add new pinned alert..."
            style={{ fontSize: '14px', border: '1px solid var(--color-annotation-highlight-border)', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', borderRadius: 'var(--rounded-md)', padding: '6px 12px', width: '100%', maxWidth: '400px' }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button 
            onClick={handleAdd}
            style={{ backgroundColor: '#ca8a04', color: '#fff', padding: '6px 16px', borderRadius: 'var(--rounded-pill)', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
          >
            Pin Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default OperationalAlertsManager;
