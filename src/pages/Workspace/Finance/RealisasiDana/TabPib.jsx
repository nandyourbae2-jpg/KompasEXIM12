import React, { useEffect, useState } from 'react';
import usePibStore from '../../../../store/usePibStore';
import useAuthStore from '../../../../store/useAuthStore';
import { Plus, Download, Package, Activity, Target, AlertTriangle } from 'lucide-react';
import Button from '../../../../components/Button';
import * as XLSX from 'xlsx';

const formatMoney = (amount) => `IDR ${amount.toLocaleString('id-ID')}`;

const getPibStatusBadge = (status) => {
  const colors = {
    'Draft': { bg: '#F1F5F9', text: '#475569' },
    'Verified': { bg: '#FEF3C7', text: '#D97706' },
    'Closed': { bg: '#DCFCE7', text: '#15803D' }
  };
  const c = colors[status] || colors['Draft'];
  return (
    <span style={{ backgroundColor: c.bg, color: c.text, padding: '4px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>
      {status}
    </span>
  );
};

const TabPib = () => {
  const { pibs, fetchPibs, createPib, deletePib, updatePibStatus } = usePibStore();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPib, setNewPib] = useState({
    no_kas: '', tgl_payment: '', unique_number: '', shipment: '', party: '', invoice: '', bl: '',
    aju_pib: '', amount_kasbon: 0, bm: 0, ppn: 0, pph: 0, periode: ''
  });

  useEffect(() => {
    fetchPibs();
  }, [fetchPibs]);

  const visiblePibs = pibs.filter(p => {
    if (user?.level_otoritas === 'Manager') return true;
    if (user?.level_otoritas === 'Supervisor' && p.departemen === user?.departemen) return true;
    if (user?.level_otoritas === 'Staff Dept' && p.departemen === user?.departemen) return true;
    return false;
  });

  const totalKasbon = visiblePibs.reduce((sum, p) => sum + (p.amount_kasbon || 0), 0);
  const totalRealisasi = visiblePibs.reduce((sum, p) => sum + (p.total_pib_realisasi || 0), 0);
  const totalLebih = visiblePibs.reduce((sum, p) => sum + (p.lebih_kurang > 0 ? p.lebih_kurang : 0), 0);
  const totalKurang = visiblePibs.reduce((sum, p) => sum + (p.lebih_kurang < 0 ? Math.abs(p.lebih_kurang) : 0), 0);

  const handleCreate = async () => {
    try {
      await createPib({
        ...newPib,
        amount_kasbon: Number(newPib.amount_kasbon),
        bm: Number(newPib.bm),
        ppn: Number(newPib.ppn),
        pph: Number(newPib.pph)
      });
      setIsModalOpen(false);
      setNewPib({
        no_kas: '', tgl_payment: '', unique_number: '', shipment: '', party: '', invoice: '', bl: '',
        aju_pib: '', amount_kasbon: 0, bm: 0, ppn: 0, pph: 0, expense_gp: '', periode: ''
      });
    } catch (e) { alert(e.message); }
  };

  const handleExport = () => {
    const wsData = [
      ['REALISASI PIB'],
      [],
      ['No. Kas', 'Tgl Payment', 'UN', 'Shipment', 'Party', 'Invoice', 'BL', 'AJU PIB', 'Kasbon', 'BM', 'PPN', 'PPH', 'Total PIB', 'Lebih (Kurang)', 'Status'],
      ...visiblePibs.map(p => [
        p.no_kas, p.tgl_payment, p.unique_number, p.shipment, p.party, p.invoice, p.bl, p.aju_pib,
        p.amount_kasbon, p.bm, p.ppn, p.pph, p.total_pib_realisasi, p.lebih_kurang, p.status
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PIB");
    XLSX.writeFile(wb, `Realisasi_PIB.xlsx`);
  };

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#E0E7FF', color: '#4338CA' }}><Package size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Kasbon PIB</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(totalKasbon)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706' }}><Target size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Realisasi Aktual</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(totalRealisasi)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D' }}><Activity size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Lebih (Sisa)</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(totalLebih)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#B91C1C' }}><AlertTriangle size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Kurang (Defisit)</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(totalKurang)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Daftar Realisasi PIB</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={handleExport}><Download size={16} /> Export Excel</Button>
          {user?.level_otoritas !== 'Manager' && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> Tambah PIB</Button>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: '12px', border: '1px solid var(--color-hairline)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '1800px', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', textAlign: 'left', borderBottom: '1px solid var(--color-hairline)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>No</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>Tgl Payment</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>No. Kas</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>UN</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>Shipment</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>Party</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>Invoice</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>BL</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>AJU PIB</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>Amount Kasbon</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>BM</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>PPN</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>PPH</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>Total PIB Realisasi</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>Lebih / Kurang</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>Expense GP</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visiblePibs.length === 0 ? (
              <tr><td colSpan={18} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>Belum ada data PIB</td></tr>
            ) : (
              visiblePibs.map((p, idx) => {
                const isLebih = p.lebih_kurang >= 0;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.tgl_payment}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>{p.no_kas}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.unique_number}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.shipment}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.party}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.invoice}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.bl}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.aju_pib}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.amount_kasbon?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.bm?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.ppn?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.pph?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>{p.total_pib_realisasi?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: isLebih ? 'var(--color-status-success)' : 'var(--color-status-danger)', backgroundColor: isLebih ? 'var(--color-status-success-bg)' : 'var(--color-status-danger-bg)', whiteSpace: 'nowrap' }}>
                      {p.lebih_kurang?.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>{p.expense_gp}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{getPibStatusBadge(p.status)}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <select 
                        value={p.status} 
                        onChange={e => updatePibStatus(p.id, e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas)', cursor: 'pointer' }}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Verified">Verified</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', width: '600px', borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Input Realisasi PIB</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>No. Kas (Voucher)</label>
                <input type="text" value={newPib.no_kas} onChange={e => setNewPib({...newPib, no_kas: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Tgl Payment*</label>
                <input type="date" value={newPib.tgl_payment} onChange={e => setNewPib({...newPib, tgl_payment: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Unique Number (IMP-XXX)</label>
                <input type="text" value={newPib.unique_number} onChange={e => setNewPib({...newPib, unique_number: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Shipment</label>
                <input type="text" value={newPib.shipment} onChange={e => setNewPib({...newPib, shipment: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Party</label>
                <input type="text" value={newPib.party} onChange={e => setNewPib({...newPib, party: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Invoice</label>
                <input type="text" value={newPib.invoice} onChange={e => setNewPib({...newPib, invoice: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>BL</label>
                <input type="text" value={newPib.bl} onChange={e => setNewPib({...newPib, bl: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nomor AJU PIB</label>
                <input type="text" value={newPib.aju_pib} onChange={e => setNewPib({...newPib, aju_pib: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
            </div>

            <h4 style={{ margin: '16px 0 8px 0', fontSize: '13px' }}>Kasbon & Realisasi</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Amount Kasbon Diterima</label>
                <input type="number" value={newPib.amount_kasbon} onChange={e => setNewPib({...newPib, amount_kasbon: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div />
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>BM (Bea Masuk)</label>
                <input type="number" value={newPib.bm} onChange={e => setNewPib({...newPib, bm: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>PPN</label>
                <input type="number" value={newPib.ppn} onChange={e => setNewPib({...newPib, ppn: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>PPH</label>
                <input type="number" value={newPib.pph} onChange={e => setNewPib({...newPib, pph: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Expense GP Ref</label>
                <input type="text" value={newPib.expense_gp} onChange={e => setNewPib({...newPib, expense_gp: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button variant="primary" onClick={handleCreate} disabled={!newPib.tgl_payment}>Simpan PIB</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabPib;
