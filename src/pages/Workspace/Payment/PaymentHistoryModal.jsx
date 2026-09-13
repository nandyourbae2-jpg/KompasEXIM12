import React from 'react';
import usePaymentStore from '../../../store/usePaymentStore';
import { CheckCircle2 } from 'lucide-react';

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
      backgroundColor: '#ffffff', padding: '32px', borderRadius: '18px',
      width: '500px', maxHeight: '90vh', overflowY: 'auto', 
      boxShadow: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0', 
      display: 'flex', flexDirection: 'column', gap: '24px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    },
    header: {
      display: 'flex', flexDirection: 'column', gap: '4px'
    },
    title: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif', 
      fontSize: '28px', fontWeight: '600', margin: 0, letterSpacing: '0.196px', color: '#1d1d1f'
    },
    subtitle: {
      fontSize: '14px', color: '#7a7a7a', fontWeight: '400', letterSpacing: '-0.224px'
    },
    timelineContainer: {
      display: 'flex', flexDirection: 'column', marginTop: '8px'
    },
    timelineItem: {
      display: 'flex', position: 'relative', paddingBottom: '24px'
    },
    timelineLine: {
      position: 'absolute', left: '11px', top: '24px', bottom: '0',
      width: '2px', backgroundColor: '#e0e0e0'
    },
    timelineIcon: {
      zIndex: 1, backgroundColor: '#ffffff', display: 'flex', 
      alignItems: 'flex-start', justifyContent: 'center', padding: '0',
      flexShrink: 0, width: '24px', height: '24px'
    },
    timelineContent: {
      marginLeft: '16px', display: 'flex', flexDirection: 'column', flex: 1,
      backgroundColor: '#f5f5f7', padding: '16px', 
      borderRadius: '11px', border: '1px solid #e0e0e0'
    },
    amount: {
      fontSize: '17px', fontWeight: '600', color: '#1d1d1f', marginBottom: '4px', letterSpacing: '-0.374px'
    },
    meta: {
      fontSize: '14px', color: '#7a7a7a', letterSpacing: '-0.224px'
    },
    footer: {
      display: 'flex', justifyContent: 'flex-end', marginTop: '16px'
    },
    emptyState: {
      textAlign: 'center', color: 'var(--color-ink-muted-80)', padding: '32px 0'
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
        
        <div style={styles.timelineContainer}>
          {reversedPayments.length === 0 ? (
            <div style={styles.emptyState}>Belum ada riwayat pembayaran.</div>
          ) : (
            reversedPayments.map((p, index) => {
              const isLast = index === reversedPayments.length - 1;
              return (
                <div key={p.id} style={styles.timelineItem}>
                  {!isLast && <div style={styles.timelineLine}></div>}
                  <div style={styles.timelineIcon}>
                    <CheckCircle2 size={24} color="#34c759" />
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={styles.amount}>{formatMoney(p.amount)}</div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#34c759', backgroundColor: '#e7f8ec', padding: '4px 10px', borderRadius: '9999px', letterSpacing: '-0.224px' }}>
                        Berhasil
                      </span>
                    </div>
                    <div style={styles.meta}>
                      {p.date} &middot; {p.method || 'Transfer'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div style={styles.footer}>
          <button 
            onClick={onClose} 
            style={{ 
              backgroundColor: '#0066cc', color: '#ffffff', border: 'none', 
              padding: '11px 22px', borderRadius: '9999px', 
              fontSize: '17px', fontWeight: '400', letterSpacing: '-0.374px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default PaymentHistoryModal;
