import React from 'react';
import usePaymentStore from '../../../store/usePaymentStore';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';

const PaymentHistoryModal = ({ joId, onClose }) => {
  const { jobOrders } = usePaymentStore();
  const jo = jobOrders.find(j => j.id === joId);

  if (!jo) return null;

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
      backgroundColor: 'var(--color-canvas)', padding: 'var(--spacing-xl)', borderRadius: 'var(--rounded-lg)',
      width: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-product)', 
      display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', fontFamily: 'var(--font-family-body)'
    },
    header: {
      display: 'flex', flexDirection: 'column', gap: '4px'
    },
    title: {
      fontFamily: 'var(--font-family-display)', fontSize: '24px', fontWeight: '600', margin: 0, letterSpacing: '0.196px'
    },
    subtitle: {
      fontSize: '14px', color: 'var(--color-ink-muted-80)'
    },
    list: {
      display: 'flex', flexDirection: 'column', gap: '12px'
    },
    historyCard: {
      backgroundColor: 'var(--color-canvas-parchment)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-md)',
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    amount: {
      fontSize: '17px',
      fontWeight: '600',
      color: 'var(--color-ink)',
      marginBottom: '4px'
    },
    meta: {
      fontSize: '12px',
      color: 'var(--color-ink-muted-80)'
    },
    footer: {
      display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)'
    }
  };

  const formatMoney = (val) => `${jo.currency} ${val.toLocaleString('id-ID')}`;

  // Urutan terbaru di atas
  const reversedPayments = [...jo.payments].reverse();

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        <div style={styles.header}>
          <h2 style={styles.title}>Riwayat Pembayaran</h2>
          <span style={styles.subtitle}>{jo.id} · {jo.vendorName}</span>
        </div>
        
        <div style={styles.list}>
          {reversedPayments.map(p => (
            <div key={p.id} style={styles.historyCard}>
              <div>
                <div style={styles.amount}>{formatMoney(p.amount)}</div>
                <div style={styles.meta}>
                  {p.date} · {p.method || 'Transfer'}
                </div>
              </div>
              <div>
                <Badge type="docstatus" value="Terealisasi" /> 
              </div>
            </div>
          ))}
        </div>
        
        <div style={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
        </div>
        
      </div>
    </div>
  );
};

export default PaymentHistoryModal;
