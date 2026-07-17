import React, { useState } from 'react';
import usePaymentStore from '../../../store/usePaymentStore';
import useAuthStore from '../../../store/useAuthStore';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import { UploadCloud } from 'lucide-react';

const UpdatePaymentModal = ({ joId, onClose }) => {
  const { jobOrders, updatePayment } = usePaymentStore();
  const { user } = useAuthStore();
  
  const jo = jobOrders.find(j => j.id === joId);
  const [amountStr, setAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [fileMock, setFileMock] = useState(null);
  const [formError, setFormError] = useState('');

  if (!jo) return null;

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setAmountStr('');
      return;
    }
    const formatted = parseInt(rawValue, 10).toLocaleString('id-ID');
    setAmountStr(formatted);
  };

  const handleSave = () => {
    const numAmount = parseInt(amountStr.replace(/\./g, ''), 10);
    if (!numAmount || numAmount <= 0) {
      setFormError('Jumlah Bayar Baru wajib diisi dengan angka valid'); return;
    }
    if (numAmount > jo.remainingBalance) {
      setFormError('Nominal bayar tidak boleh melebihi sisa tagihan'); return;
    }
    if (!paymentDate) {
      setFormError('Tanggal Bayar wajib diisi'); return;
    }
    if (!fileMock) {
      setFormError('Bukti transfer wajib diupload sebelum submit.'); return;
    }

    // Call updatePayment, but wait, updatePayment logic in store uses today date by default
    // We should pass the custom date and method!
    updatePayment(joId, numAmount, fileMock, user, paymentDate, paymentMethod);
    onClose();
  };

  const formatMoney = (val) => `${jo.currency} ${val.toLocaleString('id-ID')}`;

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
      backgroundColor: 'var(--color-canvas)', 
      padding: 'var(--spacing-xl)', 
      borderRadius: 'var(--rounded-lg)',
      width: '560px', 
      maxHeight: '90vh', 
      overflowY: 'auto', 
      boxShadow: 'var(--shadow-product)', 
      display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)',
      fontFamily: 'var(--font-family-body)'
    },
    header: {
      display: 'flex', flexDirection: 'column', gap: '4px'
    },
    labelSmall: {
      fontSize: '14px', color: 'var(--color-ink-muted-80)', fontWeight: '600'
    },
    title: {
      fontFamily: 'var(--font-family-display)', fontSize: '28px', fontWeight: '600', margin: 0, letterSpacing: '0.196px'
    },
    subtitle: {
      fontSize: '17px', color: 'var(--color-ink-muted-80)'
    },
    summaryBox: {
      backgroundColor: 'var(--color-canvas-parchment)', 
      padding: 'var(--spacing-md)', 
      borderRadius: 'var(--rounded-md)', 
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
    },
    summaryItem: {
      display: 'flex', flexDirection: 'column', gap: '4px'
    },
    summaryValue: {
      fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)'
    },
    errorBox: {
      backgroundColor: 'var(--color-badge-critical)', color: '#fff', padding: '12px 16px', borderRadius: 'var(--rounded-sm)', fontSize: '14px', fontWeight: '600'
    },
    inputGroup: {
      display: 'flex', flexDirection: 'column', gap: '8px'
    },
    input: {
      width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '17px', fontFamily: 'var(--font-family-body)', outline: 'none', boxSizing: 'border-box'
    },
    uploadArea: {
      border: '2px dashed var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '32px', textAlign: 'center', backgroundColor: 'var(--color-canvas-parchment)', cursor: 'pointer', position: 'relative'
    },
    footer: {
      display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--spacing-md)'
    }
  };

  const isFormValid = amountStr && paymentDate && fileMock;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        <div style={styles.header}>
          <span style={styles.labelSmall}>Input Realisasi Pembayaran</span>
          <h2 style={styles.title}>{jo.id}</h2>
          <span style={styles.subtitle}>{jo.vendorName} · {jo.costType}</span>
        </div>
        
        {formError && <div style={styles.errorBox}>{formError}</div>}
        
        <div style={styles.summaryBox}>
          <div style={styles.summaryItem}>
            <span style={styles.labelSmall}>Total Invoice</span>
            <span style={styles.summaryValue}>{formatMoney(jo.totalInvoice)}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.labelSmall}>Sudah Dibayar</span>
            <span style={{...styles.summaryValue, color: '#34c759'}}>{formatMoney(jo.totalPaid)}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.labelSmall}>Sisa Tagihan</span>
            <span style={{...styles.summaryValue, color: '#ff3b30'}}>{formatMoney(jo.remainingBalance)}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.labelSmall}>Status Sekarang</span>
            <div><Badge type="paymentstatus" value={jo.status} /></div>
          </div>
        </div>

        {jo.remainingBalance > 0 ? (
          <>
            <div style={styles.inputGroup}>
              <label style={styles.labelSmall}>Jumlah Bayar Baru *</label>
              <input type="text" value={amountStr} onChange={handleAmountChange} placeholder="Contoh: 100.000.000" style={styles.input} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={styles.inputGroup}>
                <label style={styles.labelSmall}>Tanggal Bayar *</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.labelSmall}>Metode Pembayaran</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={styles.input}>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.labelSmall}>Bukti Transfer *</label>
              <div style={styles.uploadArea}>
                <UploadCloud size={32} color="var(--color-ink-muted-48)" style={{ margin: '0 auto 12px auto' }} />
                <div style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', fontWeight: '600' }}>
                  {fileMock ? fileMock.name : 'Klik untuk pilih bukti transfer'}
                </div>
                <input type="file" onChange={e => setFileMock(e.target.files[0])} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '24px', backgroundColor: '#e5f9eb', color: '#108034', borderRadius: 'var(--rounded-sm)', textAlign: 'center', fontWeight: '600' }}>
            Tagihan ini sudah lunas sepenuhnya.
          </div>
        )}
        
        <div style={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          {jo.remainingBalance > 0 && (
            <Button variant="primary" onClick={handleSave} disabled={!isFormValid}>
              Simpan Pembayaran
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePaymentModal;
