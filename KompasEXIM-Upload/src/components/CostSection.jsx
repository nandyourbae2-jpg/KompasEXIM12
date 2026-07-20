import React from 'react';
import { fmtRupiah } from '../utils/importCalc';

/**
 * CostSection
 * Container untuk setiap blok kategori biaya.
 * Menampilkan judul di atas dan total (kalkulasi) di bagian bawah.
 */
const CostSection = ({ title, children, total, totalLabel = 'Total' }) => {
  return (
    <div style={{
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-lg)',
      backgroundColor: 'var(--color-canvas)',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-hairline)',
        fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)',
      }}>
        {title}
      </div>

      {/* Konten Field */}
      <div style={{ padding: '20px' }}>
        {children}
      </div>

      {/* Footer Total */}
      {total !== undefined && total !== null && (
        <div style={{
          padding: '14px 20px',
          backgroundColor: 'var(--color-canvas-parchment)',
          borderTop: '1px solid var(--color-hairline)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
            {totalLabel}
          </span>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>
            Rp {fmtRupiah(total)}
          </span>
        </div>
      )}
    </div>
  );
};

export default CostSection;
