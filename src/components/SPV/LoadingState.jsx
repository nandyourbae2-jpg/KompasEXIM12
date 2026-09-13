import React from 'react';

export const LoadingState = ({ message = 'Memuat data...' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', padding: '4rem',
    color: 'var(--color-ink-muted-48)'
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
    <p>{message}</p>
  </div>
);
