import React from 'react';
import { Construction } from 'lucide-react';

/**
 * PlaceholderPage — generic coming soon placeholder
 * Dipakai sementara untuk halaman yang dikerjakan di Batch 2 / Batch 3.
 */
const PlaceholderPage = ({ title, batch }) => (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: 'var(--color-canvas-parchment)',
    padding: '48px',
    textAlign: 'center',
    color: 'var(--color-ink-muted-48)',
  }}>
    <Construction size={40} strokeWidth={1.5} />
    <div style={{ fontSize: '22px', fontWeight: '600', color: 'var(--color-ink)', letterSpacing: '-0.374px' }}>
      {title}
    </div>
    <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
      Halaman ini dikerjakan di <strong>{batch}</strong>.<br />
      Setelah Batch 1 di-approve dan di-verifikasi, coding akan dilanjutkan.
    </div>
  </div>
);

export default PlaceholderPage;
