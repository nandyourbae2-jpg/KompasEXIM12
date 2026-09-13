import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import useMtbStore from '../../../store/useMtbStore';
import { X, Check } from 'lucide-react';

const AssignToMtbModal = ({ isOpen, onClose, selectedOrders, onSuccess }) => {
  const { periodes, fetchPeriodes, bulkCreateTransaksi } = useMtbStore();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPeriodes();
      setSelectedPeriodeId('');
    }
  }, [isOpen, fetchPeriodes]);

  if (!isOpen) return null;

  // Filter only Draft or active periods
  const activePeriodes = periodes.filter(p => p.status === 'Draft' || p.status === 'Submitted' || p.status === 'Checked1');

  const handleSubmit = async () => {
    if (!selectedPeriodeId) {
      alert('Silakan pilih Periode Buku Kas (MTB)');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const payloads = selectedOrders.map(jo => ({
        periode_id: selectedPeriodeId,
        tgl_payment: jo.tanggal_invoice || today,
        unique_number: jo.shipmentUn || '',
        category: jo.costType || 'LAINNYA',
        shipment: jo.shipmentUn || '',
        party: '',
        invoice_shipment: jo.invoiceNo || '',
        bl_number: '',
        no_kwitansi: '',
        amount_exclude_tax: jo.dpp || 0,
        vat: jo.tax || 0,
        pot_pph23_diskon: 0,
        materai_adm: 0,
        adm_bank: 0,
        kredit: jo.totalInvoice || 0,
        debet: 0,
        expense_gp: ''
      }));

      await bulkCreateTransaksi(selectedPeriodeId, payloads);
      onSuccess();
      onClose();
    } catch (e) {
      alert('Gagal memproses mutasi: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--color-canvas)', width: '500px', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Tarik ke Buku Kas (MTB)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-ink-muted)' }}>
            Anda akan membuat mutasi (pengeluaran) untuk <strong>{selectedOrders.length} tagihan</strong>. Silakan pilih Buku Kas tujuan:
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: '500' }}>Periode Buku Kas (MTB) *</label>
            <select 
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-hairline)' }}
            >
              <option value="">-- Pilih Periode --</option>
              {activePeriodes.map(p => (
                <option key={p.id} value={p.id}>{p.nama_periode} (Saldo: {p.saldo_akhir?.toLocaleString('id-ID')})</option>
              ))}
            </select>
            {activePeriodes.length === 0 && (
              <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                Tidak ada periode buku kas (MTB) yang aktif (Draft/Submitted). Silakan buat periode baru di menu Realisasi Dana terlebih dahulu.
              </p>
            )}
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-hairline)', borderRadius: '6px', padding: '10px', backgroundColor: '#F8FAFC' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>Tagihan Terpilih:</div>
            {selectedOrders.map(jo => (
              <div key={jo.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--color-hairline)', padding: '6px 0' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{jo.invoiceNo || jo.id}</div>
                  <div style={{ color: 'var(--color-ink-muted)', fontSize: '11px' }}>{jo.vendorName}</div>
                </div>
                <div style={{ fontWeight: '600', color: '#B91C1C' }}>
                  IDR {jo.totalInvoice?.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={!selectedPeriodeId || isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? 'Memproses...' : <><Check size={16} /> Proses Mutasi</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignToMtbModal;
