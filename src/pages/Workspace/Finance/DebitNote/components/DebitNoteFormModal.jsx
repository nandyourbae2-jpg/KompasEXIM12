import React, { useState, useEffect } from 'react';
import useDebitNoteStore from '../../../../../store/useDebitNoteStore';
import useImportProjectStore from '../../../../../store/useImportProjectStore';
import useFinancialRequestStore from '../../../../../store/useFinancialRequestStore';
import Button from '../../../../../components/Button';
import { X } from 'lucide-react';

const CLAIM_JENIS = {
  'Claim Supplier': ['Manufacturing Defect', 'Shortage (Kekurangan Barang)', 'Document Discrepancy', 'Quality Issue', 'Lainnya'],
  'Claim Liner/FWD': ['Transit Damage', 'Keterlambatan Pengapalan', 'Keterlambatan Transit', 'Overcharging', 'Bill of Lading Error', 'Lainnya'],
  'Claim Trucking': ['Demurrage & Detention', 'Road Transit Damage', 'Kerusakan Segel', 'Keterlambatan Pengiriman', 'Lainnya']
};

const DebitNoteFormModal = ({ isOpen, onClose, initialData = null }) => {
  const { createDebitNote } = useDebitNoteStore();
  const { importProjects, fetchImportProjects } = useImportProjectStore();
  const { requests: financialRequests, fetchRequests: fetchFinancialRequests } = useFinancialRequestStore();
  
  const [formData, setFormData] = useState({
    import_project_id: '',
    claim_kategori: 'Claim Supplier',
    claim_jenis: '',
    claim_kepada: '',
    jumlah_klaim: '',
    mata_uang: 'IDR',
    deskripsi: '',
    tanggal_dn: new Date().toISOString().split('T')[0],
    linked_job_order_id: '',
    financial_request_id: ''
  });
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchImportProjects();
      fetchFinancialRequests();
      if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
      } else {
        setFormData({
          import_project_id: '', claim_kategori: 'Claim Supplier', claim_jenis: '',
          claim_kepada: '', jumlah_klaim: '', mata_uang: 'IDR', deskripsi: '',
          tanggal_dn: new Date().toISOString().split('T')[0], linked_job_order_id: '', financial_request_id: ''
        });
      }
      setError('');
    }
  }, [isOpen, initialData, fetchImportProjects, fetchFinancialRequests]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.claim_jenis || !formData.claim_kepada || !formData.jumlah_klaim || !formData.deskripsi) {
      setError('Harap lengkapi semua field yang wajib diisi (*)');
      return;
    }

    try {
      await createDebitNote(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan Debit Note');
    }
  };

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted)', marginBottom: '4px' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: 'var(--color-canvas)', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: 'calc(100vw - 48px)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Buat Debit Note Baru</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', fontSize: '13px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div>
            <label style={labelStyle}>Import Project</label>
            <select style={inputStyle} value={formData.import_project_id} onChange={e => setFormData({...formData, import_project_id: e.target.value})}>
              <option value="">-- Pilih Import Project (Opsional) --</option>
              {importProjects.map(p => (
                <option key={p.id} value={p.id}>{p.task_unique_number} — {p.supplier}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Kategori Klaim *</label>
            <select style={inputStyle} value={formData.claim_kategori} onChange={e => setFormData({...formData, claim_kategori: e.target.value, claim_jenis: ''})}>
              <option value="Claim Supplier">Claim Supplier</option>
              <option value="Claim Liner/FWD">Claim Liner/FWD</option>
              <option value="Claim Trucking">Claim Trucking</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Terkait Financial Request (Opsional)</label>
            <select style={inputStyle} value={formData.financial_request_id} onChange={e => setFormData({...formData, financial_request_id: e.target.value})}>
              <option value="">-- Pilih Financial Request --</option>
              {financialRequests.map(r => (
                <option key={r.id} value={r.id}>{r.request_number} — {r.jenis_pengajuan}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Jenis Klaim *</label>
            <select style={inputStyle} value={formData.claim_jenis} onChange={e => setFormData({...formData, claim_jenis: e.target.value})}>
              <option value="">-- Pilih Jenis Klaim --</option>
              {CLAIM_JENIS[formData.claim_kategori].map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Diklaim Kepada (Nama Pihak) *</label>
            <input type="text" style={inputStyle} placeholder="Misal: PT Tanto Intim Line" value={formData.claim_kepada} onChange={e => setFormData({...formData, claim_kepada: e.target.value})} />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Jumlah Klaim *</label>
              <input type="number" style={inputStyle} placeholder="0" value={formData.jumlah_klaim} onChange={e => setFormData({...formData, jumlah_klaim: e.target.value})} />
            </div>
            <div style={{ width: '100px' }}>
              <label style={labelStyle}>Mata Uang</label>
              <select style={inputStyle} value={formData.mata_uang} onChange={e => setFormData({...formData, mata_uang: e.target.value})}>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tanggal DN *</label>
            <input type="date" style={inputStyle} value={formData.tanggal_dn} onChange={e => setFormData({...formData, tanggal_dn: e.target.value})} />
          </div>

          <div>
            <label style={labelStyle}>Deskripsi / Kronologi Kejadian *</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Tuliskan kronologi singkat mengapa klaim diajukan..." value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
            <Button variant="primary" type="submit">Simpan Debit Note</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebitNoteFormModal;
