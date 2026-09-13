import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAppleModal } from '../../../../contexts/AppleModalContext';
import { 
  ShieldCheck, AlertTriangle, DollarSign, FileText, Clock,
  CheckCircle, XCircle, ChevronRight, RefreshCw, Briefcase,
  Landmark, AlertOctagon, Filter
} from 'lucide-react';

const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TABS = [
  { key: 'all', label: 'Semua', icon: <Briefcase size={14} /> },
  { key: 'financial', label: 'Financial Request', icon: <DollarSign size={14} /> },
  { key: 'pib', label: 'PIB Request', icon: <Landmark size={14} /> },
  { key: 'debit', label: 'Debit Note', icon: <AlertOctagon size={14} /> },
  { key: 'mtb', label: 'MTB', icon: <FileText size={14} /> },
];

const StatusBadge = ({ status }) => {
  const map = {
    'Submitted': { bg: '#DBEAFE', color: '#1D4ED8' },
    'Checked1': { bg: '#FEF3C7', color: '#D97706' },
    'Checked3': { bg: '#FDE68A', color: '#B45309' },
    'Approved': { bg: '#D1FAE5', color: '#065F46' },
    'Diterbitkan': { bg: '#DBEAFE', color: '#1D4ED8' },
    'Negosiasi': { bg: '#FEF3C7', color: '#D97706' },
    'Diakui': { bg: '#E0E7FF', color: '#4338CA' },
  };
  const s = map[status] || { bg: '#F1F5F9', color: '#475569' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
      backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap'
    }}>
      {status}
    </span>
  );
};

const KPICard = ({ title, value, subtitle, icon, color }) => (
  <div style={{
    backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-md)', padding: '20px', flex: 1, minWidth: '200px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>{title}</span>
      <div style={{ color: color || 'var(--color-ink-muted-48)' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '22px', fontWeight: 700, color: color || 'var(--color-ink)' }}>{value}</div>
    {subtitle && <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '6px' }}>{subtitle}</div>}
  </div>
);

const ManagerExecutiveApproval = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const { alert } = useAppleModal();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api('/manager/executive-approvals');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas-parchment)' }}>
        <p style={{ color: 'var(--color-ink-muted-80)', fontWeight: 600 }}>Memuat Executive Approval Center...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ padding: '24px', backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', borderRadius: 'var(--rounded-md)' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={18} /> {error}</h3>
          <button onClick={fetchData} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: 'var(--color-status-danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  // Build unified list
  const allItems = [];
  (data.high_value_financial || []).forEach(item => {
    allItems.push({ ...item, _type: 'financial', _label: 'Financial Request', _amount: item.estimasi_nominal, _reference: item.request_number, _desc: item.jenis_pengajuan });
  });
  (data.pending_pib || []).forEach(item => {
    allItems.push({ ...item, _type: 'pib', _label: 'PIB Request', _amount: item.kasbon_diminta, _reference: item.request_number, _desc: `AJU: ${item.aju_pib || '—'}` });
  });
  (data.pending_debit_notes || []).forEach(item => {
    allItems.push({ ...item, _type: 'debit', _label: 'Debit Note', _amount: item.jumlah_klaim, _reference: item.dn_number || `DN-${item.id}`, _desc: `Klaim: ${item.claim_kepada}` });
  });
  (data.pending_mtb || []).forEach(item => {
    allItems.push({ ...item, _type: 'mtb', _label: 'MTB', _amount: item.total_realisasi, _reference: item.nama_periode, _desc: 'Realisasi Dana' });
  });

  const filteredItems = activeTab === 'all' ? allItems : allItems.filter(i => i._type === activeTab);

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: 'var(--color-canvas-parchment)', fontFamily: 'var(--font-family-body)' }}>
      
      {/* Header */}
      <div style={{ padding: '32px 40px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={28} color="var(--color-primary)" /> Executive Approval Center
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', margin: 0 }}>
              Pusat persetujuan manajerial — Transaksi bernilai tinggi, PIB, Debit Note, dan MTB yang membutuhkan keputusan Anda.
            </p>
          </div>
          <button onClick={fetchData} style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--rounded-md)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)'
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <KPICard 
            title="Total Menunggu Keputusan" 
            value={summary.total_pending} 
            subtitle="Item memerlukan review Anda"
            icon={<Clock size={20} />}
            color={summary.total_pending > 0 ? 'var(--color-status-warning)' : 'var(--color-status-success)'}
          />
          <KPICard 
            title="Nilai di Tangan Anda" 
            value={formatRupiah(summary.total_value_at_stake)}
            subtitle="Total nilai transaksi pending"
            icon={<DollarSign size={20} />}
            color="var(--color-primary)"
          />
          <KPICard 
            title="Financial ≥ 100 Juta" 
            value={summary.high_value_requests}
            subtitle={`Threshold: ${formatRupiah(summary.threshold)}`}
            icon={<AlertTriangle size={20} />}
            color={summary.high_value_requests > 0 ? '#DC2626' : 'var(--color-status-success)'}
          />
          <KPICard 
            title="Debit Notes Aktif" 
            value={summary.pending_debit_notes}
            subtitle="Klaim yang perlu ditindaklanjuti"
            icon={<AlertOctagon size={20} />}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '0' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', fontSize: '13px', fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-ink-muted-80)',
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.15s ease'
            }}>
              {tab.icon} {tab.label}
              {tab.key !== 'all' && (
                <span style={{
                  backgroundColor: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-divider-soft)',
                  color: activeTab === tab.key ? 'white' : 'var(--color-ink-muted-80)',
                  padding: '1px 7px', borderRadius: '999px', fontSize: '11px', fontWeight: 600
                }}>
                  {allItems.filter(i => i._type === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', overflow: 'hidden' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
              <CheckCircle size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Tidak ada item pending di kategori ini.</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Semua transaksi sudah ditangani dengan baik.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-80)', fontSize: '11px', textTransform: 'uppercase' }}>Tipe</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-80)', fontSize: '11px', textTransform: 'uppercase' }}>Referensi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-80)', fontSize: '11px', textTransform: 'uppercase' }}>Deskripsi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-80)', fontSize: '11px', textTransform: 'uppercase' }}>Proyek</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-ink-muted-80)', fontSize: '11px', textTransform: 'uppercase' }}>Nominal</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-ink-muted-80)', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-ink-muted-80)', fontSize: '11px', textTransform: 'uppercase' }}>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const typeColor = {
                    financial: '#1D4ED8', pib: '#7C3AED', debit: '#DC2626', mtb: '#059669'
                  }[item._type] || '#475569';
                  
                  return (
                    <tr key={`${item._type}-${item.id}`}
                      onClick={() => setSelectedItem(selectedItem?.id === item.id && selectedItem?._type === item._type ? null : item)}
                      style={{ 
                        borderBottom: '1px solid var(--color-hairline)', cursor: 'pointer',
                        backgroundColor: selectedItem?.id === item.id && selectedItem?._type === item._type ? 'var(--color-canvas-parchment)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedItem?.id === item.id && selectedItem?._type === item._type ? 'var(--color-canvas-parchment)' : 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                          backgroundColor: typeColor + '15', color: typeColor
                        }}>
                          {item._label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>{item._reference}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-ink-muted-80)' }}>{item._desc}</td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{item.project_code || '—'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--color-ink)' }}>{formatRupiah(item._amount)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}><StatusBadge status={item.status} /></td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>{formatDate(item.submitted_at || item.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selectedItem && (
          <div style={{
            backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)',
            border: '1px solid var(--color-hairline)', padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                Detail: {selectedItem._reference}
              </h3>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-48)' }}>
                <XCircle size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 600, marginBottom: '2px' }}>Tipe</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedItem._label}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 600, marginBottom: '2px' }}>Nominal</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatRupiah(selectedItem._amount)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 600, marginBottom: '2px' }}>Status</div>
                <StatusBadge status={selectedItem.status} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 600, marginBottom: '2px' }}>Proyek</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedItem.project_code || '—'}</div>
              </div>
              {selectedItem.vendor_nama_manual && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 600, marginBottom: '2px' }}>Vendor</div>
                  <div style={{ fontSize: '14px' }}>{selectedItem.vendor_nama_manual}</div>
                </div>
              )}
              {selectedItem.submitted_by_nama && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 600, marginBottom: '2px' }}>Diajukan Oleh</div>
                  <div style={{ fontSize: '14px' }}>{selectedItem.submitted_by_nama}</div>
                </div>
              )}
              {selectedItem.keterangan && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 600, marginBottom: '2px' }}>Keterangan</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', backgroundColor: 'var(--color-canvas-parchment)', padding: '10px 14px', borderRadius: '6px' }}>{selectedItem.keterangan}</div>
                </div>
              )}
              {selectedItem.catatan_klaim && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 600, marginBottom: '2px' }}>Catatan Klaim</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', backgroundColor: 'var(--color-canvas-parchment)', padding: '10px 14px', borderRadius: '6px' }}>{selectedItem.catatan_klaim}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerExecutiveApproval;
