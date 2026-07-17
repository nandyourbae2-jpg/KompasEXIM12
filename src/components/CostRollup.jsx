import React from 'react';
import { fmtRupiah } from '../utils/importCalc';

/**
 * CostRollup
 * Menampilkan baris subtotal / roll-up landed di dalam tab.
 * Jika isGrand = true, stylingnya lebih menonjol (gelap).
 */
const CostRollup = ({ label, value, isGrand = false, hint }) => {
  if (isGrand) {
    return (
      <div style={{
        backgroundColor: 'var(--color-ink)',
        color: 'var(--color-on-dark)',
        padding: '16px 20px',
        borderRadius: 'var(--rounded-lg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-product)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px' }}>
            {label}
          </span>
          {hint && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{hint}</span>}
        </div>
        <span style={{ fontSize: '20px', fontWeight: '700' }}>
          Rp {fmtRupiah(value)}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-status-info-bg)',
      border: '1px solid var(--color-status-info)',
      color: 'var(--color-primary)',
      padding: '14px 20px',
      borderRadius: 'var(--rounded-md)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px' }}>
          {label}
        </span>
        {hint && <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '2px' }}>{hint}</span>}
      </div>
      <span style={{ fontSize: '16px', fontWeight: '700' }}>
        Rp {fmtRupiah(value)}
      </span>
    </div>
  );
};

export default CostRollup;
