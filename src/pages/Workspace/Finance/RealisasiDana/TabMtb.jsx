import React, { useEffect, useState } from 'react';
import useMtbStore from '../../../../store/useMtbStore';
import useAuthStore from '../../../../store/useAuthStore';
import { useAppleModal } from '../../../../contexts/AppleModalContext';
import { Plus, ArrowDownRight, ArrowUpRight, Activity, Clock, Trash2 } from 'lucide-react';
import Button from '../../../../components/Button';

const formatMoney = (amount) => {
  return `IDR ${amount.toLocaleString('id-ID')}`;
};

const getStatusBadge = (status) => {
  const colors = {
    'Draft': { bg: '#F1F5F9', text: '#475569' },
    'Submitted': { bg: '#DBEAFE', text: '#1D4ED8' },
    'Checked1': { bg: '#FEF3C7', text: '#D97706' },
    'Approved': { bg: '#DCFCE7', text: '#15803D' }
  };
  const color = colors[status] || colors['Draft'];
  
  let label = status;
  if (status === 'Checked1') label = 'Checked (SPV)';
  
  return (
    <span style={{
      backgroundColor: color.bg,
      color: color.text,
      padding: '4px 8px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600'
    }}>
      {label}
    </span>
  );
};

const TabMtb = ({ onOpenDetail }) => {
  const { periodes, fetchPeriodes, createPeriode, deletePeriode } = useMtbStore();
  const { user } = useAuthStore();
  const { confirm, alert } = useAppleModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPeriode, setNewPeriode] = useState({
    nama_periode: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    saldo_awal: 0
  });

  useEffect(() => {
    fetchPeriodes();
  }, [fetchPeriodes]);

  // Filter visibility based on Role
  const visiblePeriodes = periodes.filter(p => {
    if (user?.level_otoritas === 'Manager') return true;
    if (user?.level_otoritas === 'Supervisor' && p.departemen === user?.departemen) return true;
    if (user?.level_otoritas === 'Staff Dept' && p.departemen === user?.departemen) return true;
    return p.prepared_by_id === user?.id;
  });

  // KPI Calculations (Tahun ini)
  const currentYear = new Date().getFullYear().toString();
  const yearPeriodes = visiblePeriodes.filter(p => p.tanggal_mulai.startsWith(currentYear));
  
  const totalDanaKeluar = yearPeriodes.reduce((sum, p) => sum + (p.total_kredit || 0), 0);
  const totalDanaBalik = yearPeriodes.reduce((sum, p) => sum + (p.total_debet || 0), 0);
  const netPengeluaran = totalDanaKeluar - totalDanaBalik;
  const pendingApprovalCount = visiblePeriodes.filter(p => p.status !== 'Approved' && p.status !== 'Draft').length;

  const handleCreate = async () => {
    try {
      await createPeriode({
        ...newPeriode,
        saldo_awal: Number(newPeriode.saldo_awal)
      });
      setIsModalOpen(false);
      setNewPeriode({ nama_periode: '', tanggal_mulai: '', tanggal_selesai: '', saldo_awal: 0 });
    } catch (error) {
      await alert(error.message);
    }
  };

  const handleDelete = async (p) => {
    if (await confirm(`Yakin ingin menghapus periode "${p.nama_periode}"?\n\nSemua transaksi di dalam periode ini juga akan ikut terhapus secara permanen.`)) {
      try {
        await deletePeriode(p.id);
      } catch (err) {
        await alert(err.message || 'Gagal menghapus periode');
      }
    }
  };

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#B91C1C' }}><ArrowUpRight size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Dana Keluar (YTD)</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(totalDanaKeluar)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D' }}><ArrowDownRight size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Dana Balik (YTD)</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(totalDanaBalik)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#E0E7FF', color: '#4338CA' }}><Activity size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Net Pengeluaran</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(netPengeluaran)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706' }}><Clock size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Pending Approval</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{pendingApprovalCount} Periode</div>
        </div>
      </div>

      {/* Header Table & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Daftar Periode MTB</h2>
        {user?.level_otoritas !== 'Manager' && (
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Buat Periode Baru
          </Button>
        )}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Periode</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Tanggal</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Saldo Awal</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Kredit</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Debet</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Saldo Akhir</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visiblePeriodes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                  Tidak ada data periode MTB
                </td>
              </tr>
            ) : (
              visiblePeriodes.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{p.nama_periode}</td>
                  <td style={{ padding: '12px 16px' }}>{p.tanggal_mulai} s.d {p.tanggal_selesai}</td>
                  <td style={{ padding: '12px 16px' }}>{formatMoney(p.saldo_awal)}</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>{formatMoney(p.total_kredit || 0)}</td>
                  <td style={{ padding: '12px 16px', color: '#16A34A' }}>{formatMoney(p.total_debet || 0)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{formatMoney(p.saldo_akhir || p.saldo_awal)}</td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(p.status)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="secondary" onClick={() => onOpenDetail(p.id)}>
                        Detail
                      </Button>
                      <button 
                        onClick={() => handleDelete(p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-status-danger)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '4px',
                        }}
                        title="Hapus Periode"
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--color-status-danger-bg)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Periode */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', width: '400px', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Buat Periode MTB Baru</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Nama Periode (Contoh: 01-10 AUG 2026)</label>
                <input 
                  type="text" 
                  value={newPeriode.nama_periode}
                  onChange={e => setNewPeriode({...newPeriode, nama_periode: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-hairline)', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Tanggal Mulai</label>
                <input 
                  type="date" 
                  value={newPeriode.tanggal_mulai}
                  onChange={e => setNewPeriode({...newPeriode, tanggal_mulai: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-hairline)', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Tanggal Selesai</label>
                <input 
                  type="date" 
                  value={newPeriode.tanggal_selesai}
                  onChange={e => setNewPeriode({...newPeriode, tanggal_selesai: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-hairline)', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Saldo Awal</label>
                <input 
                  type="number" 
                  value={newPeriode.saldo_awal}
                  onChange={e => setNewPeriode({...newPeriode, saldo_awal: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-hairline)', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button variant="primary" onClick={handleCreate} disabled={!newPeriode.nama_periode || !newPeriode.tanggal_mulai}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabMtb;
