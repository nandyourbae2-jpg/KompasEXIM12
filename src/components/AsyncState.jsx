import React from 'react';

export function LoadingSpinner({ message = 'Memuat data...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-ink-muted-48)' }}>
      <div style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }}>⏳</div>
      <p style={{ marginTop: '0.5rem', fontSize: '14px' }}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ color: 'var(--color-status-danger)', marginBottom: '1rem', fontSize: '14px', fontWeight: '500' }}>
        ⚠️ {message}
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{ 
          background: 'var(--color-surface-pearl)', 
          border: '1px solid var(--color-divider-soft)',
          padding: '8px 16px', borderRadius: 'var(--rounded-pill)',
          cursor: 'pointer', fontSize: '13px', color: 'var(--color-ink)'
        }}>
          Coba Lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'Belum ada data' }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-ink-muted-48)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
      <p style={{ fontSize: '14px' }}>{message}</p>
    </div>
  );
}
