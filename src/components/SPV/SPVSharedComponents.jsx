import React from 'react';

// KPICard.jsx
export const KPICard = ({ title, value, sub, subColor, icon }) => (
  <div style={{
    background: 'var(--color-canvas)',
    border: '1px solid var(--color-hairline)',
    borderRadius: '16px', 
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
  }}>
    {icon && (
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        color: subColor || 'var(--color-primary-muted)',
        opacity: 0.3
      }}>
        {icon}
      </div>
    )}
    <p style={{ 
      fontSize: '12px', 
      fontWeight: '600', 
      color: 'var(--color-ink-muted-48)',
      letterSpacing: '0.8px', 
      margin: '0 0 16px', 
      textTransform: 'uppercase' 
    }}>
      {title}
    </p>
    <p style={{ 
      fontSize: '36px', 
      fontWeight: '700', 
      margin: '0 0 8px', 
      color: 'var(--color-ink)',
      lineHeight: '1'
    }}>
      {value}
    </p>
    {sub && (
      <p style={{ 
        fontSize: '13px', 
        fontWeight: '500', 
        margin: 0, 
        color: subColor 
      }}>
        {sub}
      </p>
    )}
  </div>
);

// StatusBadge.jsx
export const StatusBadge = ({ status }) => {
  const colors = {
    'Backlog':        { bg: '#f5f5f5',                          text: '#737373' },
    'Akan Dikerjakan':{ bg: 'var(--color-status-info-bg)',      text: 'var(--color-status-info)' },
    'Dalam Proses':   { bg: 'var(--color-status-warning-bg)',   text: 'var(--color-status-warning)' },
    'Review':         { bg: '#eef2ff',                          text: '#4f46e5' },
    'Selesai':        { bg: 'var(--color-status-success-bg)',   text: 'var(--color-status-success)' },
    'Ditolak':        { bg: 'var(--color-status-danger-bg)',    text: 'var(--color-status-danger)' },
  };
  const c = colors[status] || colors['Backlog'];
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '4px 12px', borderRadius: '24px', fontSize: '12px', fontWeight: '600',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {status}
    </span>
  );
};

// StageBadge.jsx
export const StageBadge = ({ stage }) => {
  const colors = {
    'Shipment Active':      { bg: 'var(--color-status-info-bg)',    text: 'var(--color-status-info)' },
    'Delivery Active':      { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)' },
    'Financial Settlement': { bg: '#fff7ed',                        text: '#ea580c' },
    'Status Complete':      { bg: 'var(--color-status-success-bg)', text: 'var(--color-status-success)' },
  };
  const c = colors[stage] || { bg: '#f5f5f5', text: '#737373' };
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '4px 12px', borderRadius: '24px', fontSize: '12px', fontWeight: '600',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {stage}
    </span>
  );
};
