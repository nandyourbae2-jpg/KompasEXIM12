import React, { useState, useEffect } from 'react';
import useDebitNoteStore from '../../../../store/useDebitNoteStore';
import useAuthStore from '../../../../store/useAuthStore';
import { Plus, Search, FileText, Download, Activity, FileCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import Badge from '../../../../components/Badge';
import Button from '../../../../components/Button';
import DebitNoteFormModal from './components/DebitNoteFormModal';
import DebitNoteDetailPanel from './components/DebitNoteDetailPanel';

const statusBadge = {
  'Draft': { bg: 'var(--color-status-neutral-bg)', text: 'var(--color-status-neutral)' },
  'Diterbitkan': { bg: 'var(--color-status-info-bg)', text: 'var(--color-status-info)' },
  'Diakui': { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)' },
  'Negosiasi': { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)' },
  'Settled': { bg: 'var(--color-status-success-bg)', text: 'var(--color-status-success)' },
  'Ditolak': { bg: 'var(--color-status-danger-bg)', text: 'var(--color-status-danger)' },
};

const categoryBadge = {
  'Claim Supplier': { bg: '#FCE7F3', text: '#BE185D' },
  'Claim Liner/FWD': { bg: '#E0E7FF', text: '#4338CA' },
  'Claim Trucking': { bg: '#FEF3C7', text: '#D97706' },
};

const DebitNoteMonitoring = () => {
  const { debitNotes, summary, availableMonths, fetchDebitNotes, fetchSummary, fetchAvailableMonths } = useDebitNoteStore();
  const { user } = useAuthStore();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDnId, setSelectedDnId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterBulan, setFilterBulan] = useState('');

  const namaBulan = ['Januari','Februari','Maret','April','Mei','Juni',
                     'Juli','Agustus','September','Oktober','November','Desember'];

  useEffect(() => {
    fetchAvailableMonths();
  }, [fetchAvailableMonths]);

  useEffect(() => {
    fetchDebitNotes({
      search: searchQuery,
      kategori: filterKategori,
      status: filterStatus,
      bulan: filterBulan
    });
    fetchSummary(filterBulan);
  }, [fetchDebitNotes, fetchSummary, searchQuery, filterKategori, filterStatus, filterBulan]);

  const formatMoney = (amount, currency = 'IDR') => {
    if (currency === 'USD') return `$ ${amount.toLocaleString('en-US')}`;
    return `IDR ${amount.toLocaleString('id-ID')}`;
  };

  const handleExport = () => {
    const tanggalExport = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const periodeLabel = filterBulan
      ? namaBulan[parseInt(filterBulan.split('-')[1]) - 1] + ' ' + filterBulan.split('-')[0]
      : 'Semua Periode';

    const headerRows = [
      [`Laporan Debit Note Monitoring — ${periodeLabel}`],
      ['PT Pahala Bahari Nusantara | Departemen EXIM — Import'],
      [`Diekspor pada: ${tanggalExport}`],
      [],
      ['No', 'DN Number', 'Import Project', 'Pihak Diklaim', 'Kategori', 'Jenis Klaim', 'Mata Uang', 'Jumlah Klaim', 'Recovery', 'Outstanding', 'Status', 'Tanggal DN']
    ];

    const dataRows = debitNotes.map((dn, idx) => {
      const claim = Number(dn.jumlah_klaim) || 0;
      const recovery = Number(dn.jumlah_recovery) || 0;
      return [
        idx + 1,
        dn.dn_number,
        dn.task_unique_number || '-',
        dn.claim_kepada,
        dn.claim_kategori,
        dn.claim_jenis,
        dn.mata_uang || 'IDR',
        claim,
        recovery,
        claim - recovery,
        dn.status,
        dn.tanggal_dn
      ];
    });

    const totalKlaimIDR = debitNotes.filter(d => (d.mata_uang || 'IDR') === 'IDR').reduce((s, d) => s + (Number(d.jumlah_klaim) || 0), 0);
    const totalRecoveryIDR = debitNotes.filter(d => (d.mata_uang || 'IDR') === 'IDR').reduce((s, d) => s + (d.status === 'Settled' ? (Number(d.jumlah_recovery) || 0) : 0), 0);
    const totalKlaimUSD = debitNotes.filter(d => d.mata_uang === 'USD').reduce((s, d) => s + (Number(d.jumlah_klaim) || 0), 0);
    const totalRecoveryUSD = debitNotes.filter(d => d.mata_uang === 'USD').reduce((s, d) => s + (d.status === 'Settled' ? (Number(d.jumlah_recovery) || 0) : 0), 0);

    dataRows.push(['TOTAL IDR', '', '', '', '', '', 'IDR', totalKlaimIDR, totalRecoveryIDR, totalKlaimIDR - totalRecoveryIDR, '', '']);
    if (totalKlaimUSD > 0 || totalRecoveryUSD > 0) {
      dataRows.push(['TOTAL USD', '', '', '', '', '', 'USD', totalKlaimUSD, totalRecoveryUSD, totalKlaimUSD - totalRecoveryUSD, '', '']);
    }

    const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);
    
    // Set column widths
    ws['!cols'] = [
      {wch:5}, {wch:15}, {wch:20}, {wch:25}, {wch:20}, {wch:25}, {wch:10}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}
    ];
    // Merge title rows
    ws['!merges'] = [
      { s: {r:0, c:0}, e: {r:0, c:11} },
      { s: {r:1, c:0}, e: {r:1, c:11} },
      { s: {r:2, c:0}, e: {r:2, c:11} }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Debit Notes");
    XLSX.writeFile(wb, `DebitNoteMonitoring_${periodeLabel.replace(' ','_')}_${new Date().getTime()}.xlsx`);
  };

  const isManager = user?.level_otoritas === 'Manager';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)', fontFamily: 'var(--font-family-body)' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 20px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 4px 0', letterSpacing: '-0.374px' }}>
              Debit Note Monitoring
            </h1>
            <p style={{ margin: 0, color: 'var(--color-ink-muted-80)', fontSize: '14px' }}>
              Pelacakan klaim kerugian dan pemulihan (recovery) dari pihak ketiga
            </p>
          </div>
          {!isManager && (
            <Button variant="primary" onClick={() => setIsAddOpen(true)}>
              <Plus size={16} /> Buat Debit Note
            </Button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F3E8FF', color: '#7E22CE' }}><AlertTriangle size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Klaim</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(summary?.total_klaim || 0)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D' }}><CheckCircle size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Total Recovery</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{formatMoney(summary?.total_recovery || 0)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#B91C1C' }}><Activity size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Outstanding</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#B91C1C' }}>{formatMoney(summary?.outstanding || 0)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#E0E7FF', color: '#4338CA' }}><FileText size={20} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>DN Aktif (Berjalan)</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)' }}>{summary?.dn_aktif || 0} Dokumen</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted-48)' }} />
          <input 
            type="text" 
            placeholder="Cari DN No., Pihak, Deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', borderRadius: 'var(--rounded-md)',
              border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} style={{ padding: '8px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none' }}>
            <option value="Semua Kategori">Semua Kategori</option>
            <option value="Claim Supplier">Claim Supplier</option>
            <option value="Claim Liner/FWD">Claim Liner/FWD</option>
            <option value="Claim Trucking">Claim Trucking</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none' }}>
            <option value="Semua Status">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Diterbitkan">Diterbitkan</option>
            <option value="Diakui">Diakui</option>
            <option value="Negosiasi">Negosiasi</option>
            <option value="Settled">Settled</option>
            <option value="Ditolak">Ditolak</option>
          </select>

          <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} style={{ padding: '8px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none' }}>
            <option value="">Semua Bulan</option>
            {availableMonths.map(m => (
              <option key={m.month_key} value={m.month_key}>
                {namaBulan[parseInt(m.bulan)-1]} {m.tahun}
              </option>
            ))}
          </select>

          <Button variant="secondary" onClick={handleExport}>
            <Download size={14} /> Export Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Nomor Aju DN</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Tanggal Aju DN</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Request / Project</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Pihak Diklaim</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Kategori & Jenis</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Jumlah Klaim</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Outstanding</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Nomor DN (Actual)</th>
            </tr>
          </thead>
          <tbody>
            {debitNotes.map(dn => {
              const b = statusBadge[dn.status] || statusBadge['Draft'];
              const cBadge = categoryBadge[dn.claim_kategori] || statusBadge['Draft'];
              const outstanding = dn.jumlah_klaim - dn.jumlah_recovery;

              return (
                <tr key={dn.id} style={{ borderBottom: '1px solid var(--color-hairline)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setSelectedDnId(dn.id)}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-primary)' }}>{dn.dn_number}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted)' }}>{new Date(dn.tanggal_dn).toLocaleDateString('id-ID')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '500' }}>{dn.project_supplier || '-'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{dn.task_unique_number || 'Tidak Ada Project'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '500' }}>{dn.claim_kepada}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', backgroundColor: cBadge.bg, color: cBadge.text, marginBottom: '4px' }}>
                      {dn.claim_kategori}
                    </div>
                    <div style={{ color: 'var(--color-ink-muted)' }}>{dn.claim_jenis}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{formatMoney(dn.jumlah_klaim, dn.mata_uang)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: outstanding > 0 ? '#B91C1C' : '#15803D' }}>
                    {formatMoney(outstanding, dn.mata_uang)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: b.bg, color: b.text, padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {dn.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {dn.nomor_dn_actual 
                      ? <span style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{dn.nomor_dn_actual}</span> 
                      : <span style={{ color: 'var(--color-ink-muted-48)' }}>—</span>}
                  </td>
                </tr>
              );
            })}
            {debitNotes.length === 0 && (
              <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>Tidak ada data Debit Note</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <DebitNoteFormModal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); fetchDebitNotes(); }} />
      {selectedDnId && <DebitNoteDetailPanel dnId={selectedDnId} onClose={() => { setSelectedDnId(null); fetchDebitNotes(); fetchSummary(filterBulan); }} />}

    </div>
  );
};

export default DebitNoteMonitoring;
