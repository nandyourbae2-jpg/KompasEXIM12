import React from 'react';

export const ErrorState = ({ message, onRetry }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', padding: '4rem'
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
    <p style={{ color: 'var(--color-status-danger)', marginBottom: '1rem' }}>
      {message || 'Gagal memuat data'}
    </p>
    {onRetry && (
      <button onClick={onRetry} style={{
        background: 'var(--color-primary)', color: 'white',
        border: 'none', borderRadius: '8px',
        padding: '8px 16px', cursor: 'pointer'
      }}>
        Coba Lagi
      </button>
    )}
  </div>
);
