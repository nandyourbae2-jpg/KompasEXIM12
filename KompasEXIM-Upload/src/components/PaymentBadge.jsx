import React from 'react';
import usePaymentStore from '../store/usePaymentStore';

/**
 * PaymentBadge
 * Membaca status pembayaran dari usePaymentStore untuk kombinasi shipmentId dan importCategoryKey.
 */
const PaymentBadge = ({ shipmentId, categoryKey }) => {
  const { jobOrders } = usePaymentStore();
  
  const jo = jobOrders.find(j => j.shipmentId === shipmentId && j.importCategoryKey === categoryKey);
  
  if (!jo) return null; // Tidak ada sinkronisasi, tidak tampilkan badge

  let bg = 'var(--color-canvas-parchment)';
  let color = 'var(--color-ink-muted-48)';

  if (jo.status === 'Lunas') {
    bg = 'var(--color-status-success-bg)';
    color = 'var(--color-status-success)';
  } else if (jo.status === 'Bayar Sebagian') {
    bg = 'var(--color-status-warning-bg)';
    color = 'var(--color-status-warning)';
  } else if (jo.status === 'Belum Dibayar') {
    bg = 'var(--color-status-danger-bg)';
    color = 'var(--color-status-danger)';
  } else if (jo.sumber === 'terputus') {
    bg = 'var(--color-divider-soft)';
    color = 'var(--color-ink)';
  }

  const label = jo.sumber === 'terputus' ? 'Terputus' : jo.status;

  return (
    <span style={{
      display: 'inline-block',
      marginLeft: '8px',
      padding: '2px 8px',
      borderRadius: 'var(--rounded-xs)',
      fontSize: '10px',
      fontWeight: '700',
      backgroundColor: bg,
      color: color,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {label}
    </span>
  );
};

export default PaymentBadge;
