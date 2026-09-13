import React, { useState, useEffect } from 'react';
import useDebitNoteStore from '../../../../../store/useDebitNoteStore';
import useAuthStore from '../../../../../store/useAuthStore';
import { useAppleModal } from '../../../../../contexts/AppleModalContext';
import Button from '../../../../../components/Button';
import Badge from '../../../../../components/Badge';
import { X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusBadge = {
  'Draft': { bg: 'var(--color-status-neutral-bg)', text: 'var(--color-status-neutral)' },
  'Diterbitkan': { bg: 'var(--color-status-info-bg)', text: 'var(--color-status-info)' },
  'Diakui': { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)' },
  'Negosiasi': { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)' },
  'Settled': { bg: 'var(--color-status-success-bg)', text: 'var(--color-status-success)' },
  'Ditolak': { bg: 'var(--color-status-danger-bg)', text: 'var(--color-status-danger)' },
};

const DebitNoteDetailPanel = ({ dnId, onClose }) => {
  const { currentDebitNote: dn, fetchDebitNoteById, updateStatus, updateRecovery, deleteDebitNote } = useDebitNoteStore();
  const { user } = useAuthStore();
  const { confirm, alert } = useAppleModal();
  
  const [newStatus, setNewStatus] = useState('');
  const [catatan, setCatatan] = useState('');
  const [nomorDN, setNomorDN] = useState('');
  
  const [recoveryAmount, setRecoveryAmount] = useState('');
  const [recoveryDate, setRecoveryDate] = useState('');
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (dnId) {
      fetchDebitNoteById(dnId).then(data => {
        setNewStatus(data.status);
        setNomorDN(data.nomor_dn_actual || '');
        setRecoveryAmount(data.jumlah_recovery || 0);
        setRecoveryDate(data.tanggal_recovery || new Date().toISOString().split('T')[0]);
      });
    }
  }, [dnId, fetchDebitNoteById]);

  if (!dn) return null;

  const isPembuat = user?.id === dn.dibuat_oleh_id;
  const isManager = user?.level_otoritas === 'Manager';
  const isSpv = user?.level_otoritas === 'Supervisor';
  
  const canEditStatus = !isManager && (isSpv || isPembuat);
  const canUpdateRecovery = !isManager && (isSpv || isPembuat) && dn.status === 'Settled';
  const canDelete = !isManager && dn.status === 'Draft' && (isPembuat || isSpv);

  const handleUpdateStatus = async () => {
    setError('');
    if (newStatus === 'Ditolak' && !catatan) {
      setError('Catatan wajib diisi jika klaim Ditolak.');
      return;
    }
    if (newStatus === 'Diterbitkan' && (!nomorDN || !nomorDN.trim())) {
      setError('Nomor DN wajib diisi untuk status Diterbitkan');
      return;
    }
    if (newStatus === dn.status && (newStatus !== 'Diterbitkan' || nomorDN === (dn.nomor_dn_actual || ''))) return;

    try {
      await updateStatus(dn.id, newStatus, catatan, nomorDN, dn.version);
      fetchDebitNoteById(dn.id);
      setCatatan('');
    } catch (err) {
      setError(err.message || 'Gagal update status');
    }
  };

  const handleUpdateRecovery = async () => {
    setError('');
    try {
      await updateRecovery(dn.id, recoveryAmount, recoveryDate, dn.version);
      fetchDebitNoteById(dn.id);
    } catch (err) {
      setError(err.message || 'Gagal update recovery');
    }
  };

  const handleDelete = async () => {
    if (await confirm('Yakin ingin menghapus Debit Note ini?')) {
      try {
        await deleteDebitNote(dn.id);
        onClose();
      } catch (err) {
        setError(err.message || 'Gagal menghapus');
      }
    }
  };

  const formatMoney = (amount) => {
    if (dn.mata_uang === 'USD') return `$ ${Number(amount).toLocaleString('en-US')}`;
    return `IDR ${Number(amount).toLocaleString('id-ID')}`;
  };

  const b = statusBadge[dn.status] || statusBadge['Draft'];
  const recoveryPercent = dn.jumlah_klaim > 0 ? Math.min(100, Math.round((dn.jumlah_recovery / dn.jumlah_klaim) * 100)) : 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: 'var(--color-canvas)', width: '600px', maxWidth: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--color-ink)' }}>{dn.dn_number}</h2>
              <Badge bg={b.bg} text={b.text}>{dn.status}</Badge>
            </div>
            <div style={{ color: 'var(--color-ink-muted)', fontSize: '14px' }}>
              {dn.claim_kategori} — <strong>{dn.claim_jenis}</strong>
            </div>
            <div style={{ color: 'var(--color-ink-muted-48)', fontSize: '13px', marginTop: '4px' }}>
              Import Project: {dn.task_unique_number || '-'} | {dn.project_supplier || '-'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {error && <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', fontSize: '13px' }}>{error}</div>}

          {/* Informasi Klaim */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-ink)' }}>Informasi Klaim</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', backgroundColor: 'var(--color-canvas-parchment)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <span style={{ color: 'var(--color-ink-muted)', display: 'block', marginBottom: '4px' }}>Diklaim Kepada</span>
                <strong>{dn.claim_kepada}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-ink-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Aju DN</span>
                <strong>{new Date(dn.tanggal_dn).toLocaleDateString('id-ID')}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-ink-muted)', display: 'block', marginBottom: '4px' }}>Dibuat Oleh</span>
                <strong>{dn.dibuat_oleh_nama || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-ink-muted)', display: 'block', marginBottom: '4px' }}>Nomor DN (Actual)</span>
                <strong>{dn.nomor_dn_actual || <span style={{ color: 'var(--color-ink-muted-48)', fontWeight: 'normal' }}>Belum diterbitkan</span>}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--color-ink-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi</span>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{dn.deskripsi}</p>
              </div>
            </div>
          </div>

          {/* Recovery */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-ink)' }}>Status Recovery</h3>
            <div style={{ backgroundColor: 'var(--color-canvas-parchment)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span>Recovery: <strong>{formatMoney(dn.jumlah_recovery)}</strong></span>
                <span>Klaim: <strong>{formatMoney(dn.jumlah_klaim)}</strong></span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-hairline)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${recoveryPercent}%`, height: '100%', backgroundColor: recoveryPercent === 100 ? '#10B981' : '#3B82F6', transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                Outstanding: <strong>{formatMoney(dn.jumlah_klaim - dn.jumlah_recovery)}</strong>
              </div>
            </div>
          </div>

          {/* Update Recovery (if Settled & Allowed) */}
          {canUpdateRecovery && (
            <div style={{ padding: '16px', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Update Recovery</h4>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted)', marginBottom: '4px' }}>Jumlah Diterima</label>
                  <input type="number" value={recoveryAmount} onChange={e => setRecoveryAmount(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted)', marginBottom: '4px' }}>Tanggal Terima</label>
                  <input type="date" value={recoveryDate} onChange={e => setRecoveryDate(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none' }} />
                </div>
                <Button variant="primary" onClick={handleUpdateRecovery}>Simpan</Button>
              </div>
            </div>
          )}

          {/* Ubah Status */}
          {canEditStatus && (
            <div style={{ padding: '16px', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Ubah Status</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none' }}>
                  <option value="Draft">Draft</option>
                  <option value="Diterbitkan">Diterbitkan</option>
                  <option value="Diakui">Diakui</option>
                  <option value="Negosiasi">Negosiasi</option>
                  <option value="Settled">Settled</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
                <Button variant="primary" onClick={handleUpdateStatus} disabled={newStatus === dn.status && (newStatus !== 'Diterbitkan' || nomorDN === (dn.nomor_dn_actual || ''))}>Update Status</Button>
              </div>
              {newStatus === 'Diterbitkan' && (
                <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    Nomor DN <span style={{ color: 'var(--color-status-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={nomorDN}
                    onChange={e => setNomorDN(e.target.value)}
                    placeholder="Masukkan nomor Debit Note yang diterbitkan"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none' }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px', marginBottom: '0' }}>
                    Nomor ini akan tercatat sebagai "Nomor DN (Actual)" dan tidak bisa dikosongkan lagi
                  </p>
                </div>
              )}
              {newStatus === 'Ditolak' && (
                <textarea 
                  value={catatan} onChange={e => setCatatan(e.target.value)} 
                  placeholder="Catatan penolakan (wajib)..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none', minHeight: '60px', marginTop: '8px' }}
                />
              )}
            </div>
          )}

          {/* Riwayat Status */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-ink)' }}>Riwayat Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dn.history?.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                  {i !== dn.history.length - 1 && <div style={{ position: 'absolute', left: '8px', top: '24px', bottom: '-12px', width: '2px', backgroundColor: 'var(--color-hairline)' }} />}
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--color-canvas)', border: '2px solid var(--color-primary)', flexShrink: 0, marginTop: '2px', zIndex: 1 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>
                      {h.status_dari ? `${h.status_dari} ➔ ${h.status_ke}` : h.status_ke}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                      {new Date(h.diubah_pada).toLocaleString('id-ID')} • {h.diubah_oleh_nama || 'Sistem'}
                    </div>
                    {h.catatan && (
                      <div style={{ marginTop: '4px', fontSize: '12px', backgroundColor: 'var(--color-canvas-parchment)', padding: '6px', borderRadius: '4px' }}>
                        {h.catatan}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {canDelete && (
            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--color-hairline)' }}>
              <Button variant="danger" onClick={handleDelete} style={{ width: '100%' }}>
                Hapus Debit Note (Draft)
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DebitNoteDetailPanel;
