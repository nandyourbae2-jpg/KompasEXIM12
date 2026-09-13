import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Clock, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import useDokumenMonitoringStore from '../../../store/useDokumenMonitoringStore';
import useImportOperationalStore from '../../../store/useImportOperationalStore';
import useAuthStore from '../../../store/useAuthStore';
import api from '../../../lib/api';
import { useAppleModal } from '../../../contexts/AppleModalContext';

// ── Helper: hitung status per baris ──────────────────────────────────────────
function hitungStatus(row) {
  if (row.draft_confirmed_date && row.original_receive_date) return 'Complete';
  if (row.original_receive_date) return 'Original Diterima';
  if (row.scan_receive_date) return 'Scan Diterima';
  if (row.draft_confirmed_date) return 'Draft Dikonfirmasi';
  if (row.draft_received_date) return 'Draft Diterima';
  return 'Belum Mulai';
}

// ── Helper: Format Riwayat ─────────────────────────────────────────────────
function formatFieldName(field) {
  const map = {
    draft_received_date: 'Receive Date (Draft)',
    scan_receive_date: 'Receive Date (Scan)',
    scan_shared_departemen: 'Shared Dept (Scan)',
    original_receive_date: 'Receive Date (Original)',
    original_awb_no: 'AWB No. (Original)',
    original_shared_departemen: 'Shared Dept (Original)'
  };
  return map[field] || field;
}

function formatFieldValue(field, value) {
  if (!value) return '—';
  if (field.includes('date')) {
    const d = value.substring(0, 10);
    if (d.includes('-')) {
      const [y, m, d2] = d.split('-');
      return `${d2}/${m}/${y}`;
    }
  }
  if (field.includes('departemen')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch { }
  }
  return value;
}

const STATUS_CONFIG = {
  'Complete':           { bg: '#d1fae5', color: '#065f46', emoji: '🟢' },
  'Original Diterima':  { bg: '#e0f2fe', color: '#0c4a6e', emoji: '🔵' },
  'Scan Diterima':      { bg: '#ede9fe', color: '#4c1d95', emoji: '🟣' },
  'Draft Dikonfirmasi': { bg: '#dbeafe', color: '#1e3a8a', emoji: '🔵' },
  'Draft Diterima':     { bg: '#fef3c7', color: '#92400e', emoji: '🟡' },
  'Belum Mulai':        { bg: '#fee2e2', color: '#991b1b', emoji: '🔴' },
};

const DEPT_OPTIONS = ['Import', 'Export', 'Account Officer', 'Administrasi Export'];

// ── Sub-components ────────────────────────────────────────────────────────────
const StatusBadge = ({ row }) => {
  const label = hitungStatus(row);
  const cfg = STATUS_CONFIG[label] || STATUS_CONFIG['Belum Mulai'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap',
      fontSize: '11px', fontWeight: 600,
      backgroundColor: cfg.bg, color: cfg.color,
    }}>
      {cfg.emoji} {label}
    </span>
  );
};

const InputDate = ({ value, onSave, disabled }) => {
  const [val, setVal] = useState(value || '');
  useEffect(() => { setVal(value || ''); }, [value]);
  return (
    <input
      type="date"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={e => onSave(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%', padding: '5px 8px', fontSize: '12px',
        border: '1px solid var(--color-hairline)', borderRadius: '6px',
        backgroundColor: disabled ? 'var(--color-canvas-parchment)' : 'var(--color-canvas)',
        color: 'var(--color-ink)', fontFamily: 'var(--font-family-body)',
      }}
    />
  );
};

const InputText = ({ value, onSave, placeholder }) => {
  const [val, setVal] = useState(value || '');
  useEffect(() => { setVal(value || ''); }, [value]);
  return (
    <input
      type="text"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={e => onSave(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '5px 8px', fontSize: '12px',
        border: '1px solid var(--color-hairline)', borderRadius: '6px',
        backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)',
        fontFamily: 'var(--font-family-body)',
      }}
    />
  );
};

const SharedDeptSelect = ({ value, onSave, options = [] }) => {
  const parsed = (() => {
    try { return typeof value === 'string' ? JSON.parse(value) : (value || []); }
    catch { return []; }
  })();
  const [selected, setSelected] = useState(parsed);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const p = (() => { try { return typeof value === 'string' ? JSON.parse(value) : (value || []); } catch { return []; } })();
    setSelected(p);
  }, [value]);

  const toggle = (dept) => {
    const next = selected.includes(dept) ? selected.filter(d => d !== dept) : [...selected, dept];
    setSelected(next);
    onSave(next);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 8px', border: '1px solid var(--color-hairline)', borderRadius: '6px',
          backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)',
          fontSize: '11px', cursor: 'pointer', minHeight: '26px', display: 'flex', alignItems: 'center'
        }}
      >
        {selected.length === 0 ? <span style={{color: 'var(--color-ink-muted-48)'}}>Pilih Dept...</span> : `${selected.length} dipilih`}
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
          borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 50, maxHeight: '150px', overflowY: 'auto', padding: '4px'
        }}>
          {options.length === 0 && <div style={{padding: '4px', fontSize: '11px', color: 'var(--color-ink-muted-48)'}}>Kosong</div>}
          {options.map(opt => {
            const dept = opt.nama_departemen;
            return (
              <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', padding: '4px' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(dept)}
                  onChange={() => toggle(dept)}
                  style={{ accentColor: 'var(--color-primary)', width: '12px', height: '12px' }}
                />
                {dept}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginBottom: '2px', fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: '13px', color: 'var(--color-ink)', fontWeight: 600 }}>{value || '—'}</div>
  </div>
);

// ── Section Header Styles ─────────────────────────────────────────────────────
const thBase = {
  padding: '8px 10px', fontSize: '11px', fontWeight: 700,
  border: '1px solid rgba(0,0,0,0.1)', whiteSpace: 'nowrap', textAlign: 'center',
};

const thSection = (bg, color) => ({
  ...thBase, backgroundColor: bg, color: color,
  letterSpacing: '0.5px', textTransform: 'uppercase',
});

const thSub = (bg, color) => ({
  ...thBase, backgroundColor: bg, color: color, fontWeight: 600, fontSize: '10px',
});

const tdBase = {
  padding: '8px 10px', borderBottom: '1px solid var(--color-hairline)',
  verticalAlign: 'top',
};

// ── Main Component ────────────────────────────────────────────────────────────
const DokumenMonitoringDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    monitoringRows,
    monitoringRowsLoading,
    fetchMonitoringRows,
    updateMonitoringField,
    confirmDraft,
    confirmScan,
    confirmOriginal,
  } = useDokumenMonitoringStore();

  const [projectData, setProjectData] = useState(null);
  const [saveStatus, setSaveStatus] = useState({}); // { `${rowId}_${field}`: 'saving'|'saved'|'error' }
  const [globalSaveStatus, setGlobalSaveStatus] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // row object
  const [riwayatModal, setRiwayatModal] = useState(null); // row object
  const [riwayatData, setRiwayatData] = useState([]);
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const { alert } = useAppleModal();

  const { departemenList, fetchDepartemen } = useImportOperationalStore();

  useEffect(() => {
    fetchMonitoringRows(projectId);
    api('/import-projects').then(res => {
      const p = res.find(r => String(r.id) === String(projectId));
      if (p) setProjectData(p);
    });
    fetchDepartemen();
  }, [projectId, fetchMonitoringRows, fetchDepartemen]);

  const handleSaveField = useCallback(async (rowId, field, value) => {
    const key = `${rowId}_${field}`;
    setSaveStatus(prev => ({ ...prev, [key]: 'saving' }));
    setGlobalSaveStatus('saving');
    try {
      await updateMonitoringField(rowId, field, value, user?.id);
      setSaveStatus(prev => ({ ...prev, [key]: 'saved' }));
      setGlobalSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus(prev => { const n = { ...prev }; delete n[key]; return n; });
        setGlobalSaveStatus(null);
      }, 2000);
    } catch {
      setSaveStatus(prev => ({ ...prev, [key]: 'error' }));
      setGlobalSaveStatus('error');
      setTimeout(() => {
        setSaveStatus(prev => { const n = { ...prev }; delete n[key]; return n; });
        setGlobalSaveStatus(null);
      }, 3000);
    }
  }, [updateMonitoringField, user?.id]);

  const handleConfirmSubmit = async () => {
    if (!confirmModal) return;
    setConfirmingId(confirmModal.id);
    try {
      if (confirmModal.type === 'scan') {
        await confirmScan(confirmModal.id, user?.id);
      } else if (confirmModal.type === 'original') {
        await confirmOriginal(confirmModal.id, user?.id);
      } else {
        await confirmDraft(confirmModal.id, user?.id);
      }
      setConfirmModal(null);
    } catch (err) {
      await alert(err.message || 'Gagal konfirmasi');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleViewRiwayat = async (row) => {
    setRiwayatModal(row);
    setRiwayatLoading(true);
    setRiwayatData([]);
    try {
      const data = await api(`/dokumen-monitoring/${row.id}/riwayat`);
      setRiwayatData(data);
    } catch { }
    finally { setRiwayatLoading(false); }
  };

  const handleExportExcel = () => {
    if (!monitoringRows.length) return;

    const aoa = [];
    // Row 1 – section headers (merged)
    aoa.push([
      'No', 'Nama Dokumen', 'Status',
      'DRAFT', '', // colspan 2
      'SCAN ORIGINAL', '', // colspan 2
      'ORIGINAL PHYSICAL DOCUMENT', '', '', // colspan 3
    ]);
    // Row 2 – sub-headers
    aoa.push([
      '', '', '',
      'Tracer Date\nReceived', 'Confirm',
      'Receive Date', 'Shared Dept',
      'Receive Date', 'AWB No.', 'Shared Dept',
    ]);
    // Data rows
    monitoringRows.forEach((row, i) => {
      const parsedScanDept = (() => { try { return JSON.parse(row.scan_shared_departemen || '[]'); } catch { return []; } })();
      const parsedOrigDept = (() => { try { return JSON.parse(row.original_shared_departemen || '[]'); } catch { return []; } })();
      aoa.push([
        i + 1,
        `[${row.kode_dokumen}] ${row.nama_dokumen}`,
        hitungStatus(row),
        row.draft_received_date || '',
        row.draft_confirmed_date ? `${row.draft_confirmed_date} (by ${row.confirmed_by_nama || '?'})` : '',
        row.scan_receive_date || '',
        parsedScanDept.join(', '),
        row.original_receive_date || '',
        row.original_awb_no || '',
        parsedOrigDept.join(', '),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Merges for section headers
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // No
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Nama Dokumen
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Status
      { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } }, // DRAFT
      { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }, // SCAN ORIGINAL
      { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } }, // ORIGINAL PHYSICAL DOCUMENT
    ];
    ws['!cols'] = [
      { wch: 4 }, { wch: 35 }, { wch: 18 },
      { wch: 14 }, { wch: 22 },
      { wch: 14 }, { wch: 25 },
      { wch: 14 }, { wch: 18 }, { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, projectData?.task_unique_number || 'Monitoring');
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `DokumenMonitoring_${projectData?.task_unique_number || 'Project'}_${today}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 32px', borderBottom: '1px solid var(--color-hairline)',
        backgroundColor: 'var(--color-canvas)',
      }}>
        <button
          onClick={() => navigate('/workspace/dokumen-monitoring')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'var(--color-primary)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, marginBottom: '14px', fontSize: '13px',
          }}
        >
          <ArrowLeft size={14} /> Kembali ke List
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '26px', fontWeight: 700, color: 'var(--color-ink)',
              margin: '0 0 12px 0', fontFamily: 'var(--font-family-display)',
              letterSpacing: '-0.3px',
            }}>
              Checklist Dokumen: {projectData?.task_unique_number || '…'}
            </h1>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <InfoItem label="Supplier" value={projectData?.supplier} />
              <InfoItem label="Invoice No" value={projectData?.invoice_no} />
              <InfoItem label="PO/CO No" value={projectData?.po_co_no} />
              <InfoItem label="B/L No" value={projectData?.bl_no} />
              <InfoItem label="ETD" value={projectData?.etd} />
              <InfoItem label="ETA" value={projectData?.eta} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Global save indicator */}
            {globalSaveStatus && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px',
                color: globalSaveStatus === 'error' ? '#dc2626' : globalSaveStatus === 'saved' ? '#16a34a' : 'var(--color-primary)',
              }}>
                {globalSaveStatus === 'saving' && '● Menyimpan…'}
                {globalSaveStatus === 'saved' && <><Check size={13} /> Tersimpan</>}
                {globalSaveStatus === 'error' && <><AlertTriangle size={13} /> Gagal menyimpan</>}
              </span>
            )}
            <button
              onClick={handleExportExcel}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)',
                border: '1px solid var(--color-hairline)', fontSize: '13px', fontWeight: 500,
              }}
            >
              <Download size={15} /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── Table Area ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        <div style={{
          backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
          borderRadius: '12px', overflow: 'auto',
        }}>
          {monitoringRowsLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
              Memuat checklist…
            </div>
          ) : monitoringRows.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
              Belum ada dokumen yang di-assign ke project ini.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                {/* ── ROW 1: Section Labels ── */}
                <tr>
                  <th rowSpan={2} style={{ ...thBase, backgroundColor: '#f8fafc', color: 'var(--color-ink)', width: '36px', borderRight: '1px solid rgba(0,0,0,0.08)' }}>No</th>
                  <th rowSpan={2} style={{ ...thBase, backgroundColor: '#f8fafc', color: 'var(--color-ink)', width: '200px', textAlign: 'left', borderRight: '1px solid rgba(0,0,0,0.08)' }}>Nama Dokumen</th>
                  <th rowSpan={2} style={{ ...thBase, backgroundColor: '#f8fafc', color: 'var(--color-ink)', width: '120px', borderRight: '1px solid rgba(0,0,0,0.12)' }}>Status</th>

                  {/* DRAFT */}
                  <th colSpan={2} style={thSection('#dbeafe', '#1e40af')}>
                    📄 DRAFT
                  </th>

                  {/* SCAN ORIGINAL */}
                  <th colSpan={3} style={{ ...thSection('#d1fae5', '#065f46'), borderLeft: '2px solid rgba(0,0,0,0.12)' }}>
                    🖨 SCAN ORIGINAL
                  </th>

                  {/* ORIGINAL PHYSICAL */}
                  <th colSpan={4} style={{ ...thSection('#fef3c7', '#78350f'), borderLeft: '2px solid rgba(0,0,0,0.12)' }}>
                    📦 ORIGINAL PHYSICAL DOCUMENT
                  </th>

                  <th rowSpan={2} style={{ ...thBase, backgroundColor: '#f8fafc', width: '32px', borderLeft: '1px solid rgba(0,0,0,0.08)' }}>Riwayat</th>
                </tr>

                {/* ── ROW 2: Sub-column Labels ── */}
                <tr>
                  {/* DRAFT sub-cols */}
                  <th style={thSub('#eff6ff', '#2563eb')}>Receive Date</th>
                  <th style={{ ...thSub('#eff6ff', '#2563eb'), borderRight: '2px solid rgba(0,0,0,0.12)' }}>Confirm</th>
                  {/* SCAN ORIGINAL sub-cols */}
                  <th style={thSub('#f0fdf4', '#16a34a')}>Receive Date</th>
                  <th style={thSub('#f0fdf4', '#16a34a')}>Confirm</th>
                  <th style={{ ...thSub('#f0fdf4', '#16a34a'), borderRight: '2px solid rgba(0,0,0,0.12)' }}>Shared Dept</th>
                  {/* ORIGINAL PHYSICAL sub-cols */}
                  <th style={thSub('#fffbeb', '#b45309')}>Receive Date</th>
                  <th style={thSub('#fffbeb', '#b45309')}>Confirm</th>
                  <th style={thSub('#fffbeb', '#b45309')}>AWB No.</th>
                  <th style={thSub('#fffbeb', '#b45309')}>Shared Dept</th>
                </tr>
              </thead>

              <tbody>
                {monitoringRows.map((row, idx) => (
                  <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--color-canvas)' : 'var(--color-canvas-parchment)' }}>
                    {/* No */}
                    <td style={{ ...tdBase, textAlign: 'center', fontSize: '12px', color: 'var(--color-ink-muted-48)', borderRight: '1px solid var(--color-hairline)', width: '36px' }}>
                      {idx + 1}
                    </td>

                    {/* Nama Dokumen */}
                    <td style={{ ...tdBase, borderRight: '1px solid var(--color-hairline)', width: '200px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginBottom: '2px', fontFamily: 'monospace' }}>{row.kode_dokumen}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-ink)', fontWeight: 500, lineHeight: 1.3 }}>{row.nama_dokumen}</div>
                    </td>

                    {/* Status */}
                    <td style={{ ...tdBase, textAlign: 'center', borderRight: '2px solid var(--color-hairline)', width: '120px' }}>
                      <StatusBadge row={row} />
                    </td>

                    {/* ──── SECTION 1: DRAFT ──────────────────────────────── */}
                    {/* Tracer Date Received */}
                    <td style={{ ...tdBase, backgroundColor: '#f8fbff', width: '130px' }}>
                      <InputDate
                        value={row.draft_received_date}
                        onSave={val => handleSaveField(row.id, 'draft_received_date', val)}
                      />
                    </td>

                    {/* Confirm */}
                    <td style={{ ...tdBase, backgroundColor: '#f8fbff', borderRight: '2px solid rgba(59,130,246,0.2)', width: '130px' }}>
                      {row.draft_confirmed_date ? (
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
                            {(() => {
                              const d = (row.draft_confirmed_date || '').substring(0, 10);
                              if (!d || !d.includes('-')) return d;
                              const [year, month, day] = d.split('-');
                              return `${day}/${month}/${year}`;
                            })()}
                          </div>
                          <div style={{ color: 'var(--color-ink-muted-48)', fontSize: '11px', marginTop: '2px' }}>
                            oleh {row.confirmed_by_nama || 'Unknown'}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmModal(row)}
                          title="Konfirmasi dokumen sudah tidak ada revisi"
                          style={{
                            width: '100%', padding: '5px 10px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: '#2563eb',
                            color: '#fff',
                            border: 'none', transition: 'all 0.15s',
                          }}
                        >
                          Konfirmasi
                        </button>
                      )}
                    </td>

                    {/* ──── SECTION 2: SCAN ORIGINAL ──────────────────────── */}
                    {/* Receive Date */}
                    <td style={{ ...tdBase, backgroundColor: '#f0fdf4', width: '130px', borderLeft: '2px solid rgba(34,197,94,0.2)' }}>
                      <InputDate
                        value={row.scan_receive_date}
                        onSave={val => handleSaveField(row.id, 'scan_receive_date', val)}
                      />
                    </td>

                    {/* Confirm Scan */}
                    <td style={{ ...tdBase, backgroundColor: '#f0fdf4', width: '110px' }}>
                      {row.scan_confirmed_date ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '12px', color: '#16a34a' }}>
                            {(() => {
                              const d = row.scan_confirmed_date.split(' ')[0];
                              if (!d || !d.includes('-')) return d;
                              const [year, month, day] = d.split('-');
                              return `${day}/${month}/${year}`;
                            })()}
                          </div>
                          <div style={{ color: 'var(--color-ink-muted-48)', fontSize: '11px', marginTop: '2px' }}>
                            oleh {row.scan_confirmed_by_nama || 'Unknown'}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ ...row, type: 'scan' })}
                          title="Konfirmasi scan dokumen diterima"
                          style={{
                            width: '100%', padding: '5px 10px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: '#16a34a',
                            color: '#fff',
                            border: 'none', transition: 'all 0.15s',
                          }}
                        >
                          Konfirmasi
                        </button>
                      )}
                    </td>

                    {/* Shared Dept */}
                    <td style={{ ...tdBase, backgroundColor: '#f0fdf4', borderRight: '2px solid rgba(34,197,94,0.2)', width: '150px' }}>
                      <SharedDeptSelect
                        value={row.scan_shared_departemen}
                        onSave={val => handleSaveField(row.id, 'scan_shared_departemen', val)}
                        options={departemenList}
                      />
                    </td>

                    {/* ──── SECTION 3: ORIGINAL PHYSICAL ──────────────────── */}
                    {/* Receive Date */}
                    <td style={{ ...tdBase, backgroundColor: '#fffbeb', width: '130px', borderLeft: '2px solid rgba(245,158,11,0.2)' }}>
                      <InputDate
                        value={row.original_receive_date}
                        onSave={val => handleSaveField(row.id, 'original_receive_date', val)}
                      />
                    </td>

                    {/* Confirm Original */}
                    <td style={{ ...tdBase, backgroundColor: '#fffbeb', width: '110px' }}>
                      {row.original_confirmed_date ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '12px', color: '#b45309' }}>
                            {(() => {
                              const d = row.original_confirmed_date.split(' ')[0];
                              if (!d || !d.includes('-')) return d;
                              const [year, month, day] = d.split('-');
                              return `${day}/${month}/${year}`;
                            })()}
                          </div>
                          <div style={{ color: 'var(--color-ink-muted-48)', fontSize: '11px', marginTop: '2px' }}>
                            oleh {row.original_confirmed_by_nama || 'Unknown'}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ ...row, type: 'original' })}
                          title="Konfirmasi original fisik dokumen diterima"
                          style={{
                            width: '100%', padding: '5px 10px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: '#d97706',
                            color: '#fff',
                            border: 'none', transition: 'all 0.15s',
                          }}
                        >
                          Konfirmasi
                        </button>
                      )}
                    </td>

                    {/* AWB No. */}
                    <td style={{ ...tdBase, backgroundColor: '#fffbeb', width: '140px' }}>
                      <InputText
                        value={row.original_awb_no}
                        onSave={val => handleSaveField(row.id, 'original_awb_no', val)}
                        placeholder="mis. AWB-SQ-12345"
                      />
                    </td>

                    {/* Shared Dept */}
                    <td style={{ ...tdBase, backgroundColor: '#fffbeb', width: '150px' }}>
                      <SharedDeptSelect
                        value={row.original_shared_departemen}
                        onSave={val => handleSaveField(row.id, 'original_shared_departemen', val)}
                        options={departemenList}
                      />
                    </td>

                    {/* Riwayat */}
                    <td style={{ ...tdBase, textAlign: 'center', width: '32px', borderLeft: '1px solid var(--color-hairline)' }}>
                      <button
                        onClick={() => handleViewRiwayat(row)}
                        title="Lihat riwayat perubahan"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '4px' }}
                      >
                        <Clock size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal: Konfirmasi ─────────────────────────────────────────── */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)', borderRadius: '14px',
            padding: '28px 32px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)' }}>
              Konfirmasi {confirmModal.type === 'scan' ? 'Scan Original' : confirmModal.type === 'original' ? 'Physical Document' : 'Penerimaan Draft'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-48)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Anda akan mengkonfirmasi penerimaan {confirmModal.type === 'scan' ? 'scan original' : confirmModal.type === 'original' ? 'physical document' : 'draft'} untuk dokumen:
            </p>
            <div style={{
              padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--color-canvas-parchment)',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontFamily: 'monospace' }}>{confirmModal.kode_dokumen}</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)', marginTop: '2px' }}>{confirmModal.nama_dokumen}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--color-hairline)', background: 'transparent', cursor: 'pointer', fontSize: '14px' }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={confirmingId === confirmModal.id}
                style={{
                  padding: '8px 18px', borderRadius: '8px', border: 'none',
                  background: '#2563eb', color: '#fff', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600,
                  opacity: confirmingId ? 0.7 : 1,
                }}
              >
                {confirmingId ? 'Memproses…' : 'Ya, Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Riwayat Perubahan ────────────────────────────────────────── */}
      {riwayatModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)', borderRadius: '14px',
            padding: '28px 32px', width: '680px', maxHeight: '75vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)' }}>
              Riwayat Perubahan
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', marginBottom: '20px' }}>
              [{riwayatModal.kode_dokumen}] {riwayatModal.nama_dokumen}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-hairline)', borderRadius: '18px', backgroundColor: 'var(--color-canvas)' }}>
              {riwayatLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)', fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>Memuat…</div>
              ) : riwayatData.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)', fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>Belum ada perubahan tercatat.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'SF Pro Text, system-ui, sans-serif', fontSize: '14px' }}>
                  <thead style={{ backgroundColor: 'var(--color-canvas)', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-48)', borderBottom: '1px solid var(--color-divider-soft)' }}>Waktu</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-48)', borderBottom: '1px solid var(--color-divider-soft)' }}>Field</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-48)', borderBottom: '1px solid var(--color-divider-soft)' }}>Perubahan</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-48)', borderBottom: '1px solid var(--color-divider-soft)' }}>Oleh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatData.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--color-divider-soft)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-48)', fontSize: '13px' }}>
                          {new Date(r.diubah_pada).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>
                          {formatFieldName(r.field_diubah)}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }}>
                          {r.nilai_lama && r.nilai_lama !== 'null' ? (
                            <span style={{ color: 'var(--color-ink-muted-48)', textDecoration: 'line-through', marginRight: '8px' }}>
                              {formatFieldValue(r.field_diubah, r.nilai_lama)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-ink-muted-48)', marginRight: '8px' }}>—</span>
                          )}
                          {((r.nilai_lama && r.nilai_lama !== 'null') || (r.nilai_baru && r.nilai_baru !== 'null')) && (
                            <span style={{ color: 'var(--color-ink-muted-80)', marginRight: '8px' }}>→</span>
                          )}
                          <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>
                            {formatFieldValue(r.field_diubah, r.nilai_baru)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-48)' }}>
                          {r.diubah_oleh_nama || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setRiwayatModal(null)}
                style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--color-hairline)', background: 'transparent', cursor: 'pointer', fontSize: '14px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DokumenMonitoringDetail;
