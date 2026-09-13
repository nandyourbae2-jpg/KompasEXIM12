import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, AlertTriangle, AlertCircle, Clock, CheckCircle2, X,
  MessageSquare, ExternalLink, RefreshCw, Send, Check
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import ActionFormEngine from './ActionFormEngine';
import api from '../../lib/api';
import { sortAndGroupAEJobs, markVesselGrouping, getWeekSegment, getUrgencyLevel } from '../../utils/aeWorkboardSort';
import AeHandoverModal from '../../components/AeHandoverModal';
import AppleToast from '../../components/AppleToast';
import './AeWorkboard.css'; // We'll keep the import, but mostly rely on inline or new styles

const PRIORITY_ORDER = { OVERDUE: 0, CRITICAL: 1, 'AT RISK': 2, NORMAL: 3 };

const RiskBadge = ({ priority }) => {
  const map = {
    OVERDUE:   { bg: '#fee2e2', color: '#991b1b', label: 'OVERDUE' },
    CRITICAL:  { bg: '#fee2e2', color: '#dc2626', label: 'CRITICAL' },
    'AT RISK': { bg: '#fef3c7', color: '#d97706', label: 'AT RISK' },
    NORMAL:    { bg: '#f1f5f9', color: '#475569', label: 'NORMAL' },
  };
  const style = map[priority] || map.NORMAL;
  return (
    <span style={{ backgroundColor: style.bg, color: style.color, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
      {style.label}
    </span>
  );
};

const formatUpdateTime = (dateStr) => {
  if (!dateStr) return '-';
  const iso = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  if (isNaN(d.getTime())) return '-';
  
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  
  if (isToday) {
    return `Hari ini, ${timePart} WIB`;
  }
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${timePart} WIB`;
};

const GroupProgressIndicator = ({ groupProgressStr }) => {
  let progress = {};
  try {
    if (groupProgressStr) progress = JSON.parse(groupProgressStr);
  } catch(e) {}

  const groups = [
    { key: 'DOCUMENT PREPARATION', label: 'PREP' },
    { key: 'SOFT COPY DOCUMENT', label: 'SOFT' },
    { key: 'FINAL DATA', label: 'FINAL' },
    { key: 'DRAFT DOCUMENT', label: 'DRAFT' },
    { key: 'ORIGINAL DOCUMENT', label: 'ORI' },
  ];

  return (
    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
      {groups.map(g => {
        const pct = progress[g.key];
        let bg = 'var(--color-surface-pearl)';
        let color = 'var(--color-ink-muted-48)';
        let border = '1px solid var(--color-hairline)';

        if (pct === 100) {
          bg = '#d1fae5'; 
          color = '#065f46'; 
          border = '1px solid #34d399';
        } else if (pct > 0) {
          bg = '#fef3c7'; 
          color = '#92400e'; 
          border = '1px solid #fbbf24';
        }

        return (
          <span key={g.key} title={`${g.key}: ${pct || 0}%`} style={{
            fontSize: '9px', fontWeight: 700, padding: '2px 4px', borderRadius: '4px',
            backgroundColor: bg, color: color, border: border, letterSpacing: '0.02em',
            display: 'inline-block'
          }}>
            {g.label}
          </span>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SLIDE-OVER EXECUTION PANEL
───────────────────────────────────────────────────────────── */
const ExecutionSlideOver = ({ job, onClose, onComplete }) => {
  const open = !!job;
  const action = job?.pendingActionObj;

  return (
    <>
      {open && <div className="wb-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40 }} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', backgroundColor: '#fff',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', zIndex: 50, transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out', display: 'flex', flexDirection: 'column'
      }}>
        {job && (
          <>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>EKSEKUSI AKTIVITAS</p>
                <h2 style={{ margin: '4px 0 0', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  {action ? `${action.activity_name} — ${action.docName}` : 'Aktivitas'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Invoice {job.invoice_no} {action?.stageName ? `• ${action.stageName}` : ''}
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              {action ? (
                <ActionFormEngine
                  jobId={job.id}
                  item={{ id: action.doc_id || action.id, nama_item: action.docName, nama_group: action.stageName, next_action_mode: 'EXECUTE' }}
                  activity={{ id: action.activity_id || action.id, nama_aktivitas: action.activity_name, urutan: 1 }}
                  onComplete={() => { onClose(); onComplete(job.id); }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <CheckCircle2 size={40} style={{ margin: '0 auto 12px', color: '#10b981' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Tidak ada aksi</p>
                  <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Semua aktivitas untuk tahap ini sudah selesai.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────
   ASSIGNMENT MODAL
───────────────────────────────────────────────────────────── */
const AssignmentModal = ({ job, staffList, onClose, onAssigned }) => {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    try {
      const endpoint = job.ae_assignee_id 
        ? `/ae/supervisor/jobs/${job.id}/reassign`
        : `/ae/supervisor/jobs/${job.id}/assign`;
      
      const json = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({ assignee_id: selectedStaff, remark }),
      });
      if (json.success) {
        onAssigned();
        onClose();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!job) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 60 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff', borderRadius: '12px', width: '400px', p: '24px', zIndex: 70, padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>{job.ae_assignee_id ? 'Reassign Job' : 'Assign Job'}</h3>
        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
          <strong>Invoice:</strong> {job.invoice_no}<br/>
          <strong>Buyer:</strong> {job.buyer}<br/>
          <strong>Destinasi:</strong> {job.destination}
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Assign ke (Staff):</label>
          <select 
            value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="">-- Pilih Staff --</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Catatan (Opsional):</label>
          <input 
            type="text" value={remark} onChange={e => setRemark(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            placeholder="Keterangan assignment..."
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>Batal</button>
          <button 
            disabled={saving || !selectedStaff} onClick={handleAssign}
            style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            {saving ? 'Loading...' : 'Assign Job'}
          </button>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────
   BUKU EKSPEDISI HANDOVER (LEDGER)
───────────────────────────────────────────────────────────── */
const AeHandoverLedger = () => {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api('/v2/ae/my-handovers');
      if (res.success) setHandovers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processed = useMemo(() => {
    let list = handovers;
    if (filter === 'Menunggu Review AO') list = list.filter(h => h.ao_receipt_status === 'Menunggu Review AO');
    if (filter === 'Telah Diterima AO') list = list.filter(h => h.ao_receipt_status === 'Diterima AO');
    
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h => 
        h.invoice_no?.toLowerCase().includes(q) || 
        h.buyer?.toLowerCase().includes(q) ||
        h.handover_type?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [handovers, filter, search]);

  const stats = {
    total: handovers.length,
    pending: handovers.filter(h => h.ao_receipt_status === 'Menunggu Review AO').length,
    accepted: handovers.filter(h => h.ao_receipt_status === 'Diterima AO').length
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Memuat Buku Ekspedisi...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#7a7a7a', fontWeight: 600, marginBottom: '8px' }}>Total Dokumen Diserahkan</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f' }}>{stats.total}</div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#7a7a7a', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9500' }}></span> Menunggu Review AO
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f' }}>{stats.pending}</div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#7a7a7a', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34c759' }}></span> Telah Diterima AO
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f' }}>{stats.accepted}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1, overflowX: 'auto', paddingBottom: '4px' }}>
          {['Semua', 'Menunggu Review AO', 'Telah Diterima AO'].map(f => (
            <button
              key={f} onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                border: filter === f ? 'none' : '1px solid #e0e0e0',
                backgroundColor: filter === f ? '#1d1d1f' : '#fff',
                color: filter === f ? '#fff' : '#7a7a7a'
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#7a7a7a' }} />
          <input 
            type="text" placeholder="Cari invoice, buyer..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f7', borderBottom: '1px solid #e0e0e0', fontSize: '12px', color: '#7a7a7a' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>EKSPEDISI & WAKTU</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>INVOICE & BUYER</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>DOKUMEN DISERAHKAN</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>PENERIMA AO</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS AO</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>CATATAN / REMARKS</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {processed.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#7a7a7a' }}>Belum ada data serah terima.</td></tr>
            ) : processed.map(h => {
              const isAccepted = h.ao_receipt_status === 'Diterima AO';
              return (
                <tr key={h.id} style={{ borderBottom: '1px solid #f0f0f0', fontSize: '14px', backgroundColor: '#fff' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: '#1d1d1f' }}>REF-{h.id}</div>
                    <div style={{ fontSize: '12px', color: '#7a7a7a', marginTop: '4px' }}>
                      {new Date(h.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: '#1d1d1f' }}>{h.invoice_no}</div>
                    <div style={{ fontSize: '12px', color: '#7a7a7a' }}>{h.buyer} • {h.destination}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(() => {
                        let docs = [];
                        try {
                          docs = JSON.parse(h.dokumen_package);
                          if (!Array.isArray(docs)) docs = [h.dokumen_package];
                        } catch(e) {
                          docs = h.handover_type ? h.handover_type.split(',').map(s => s.trim()) : ['Dokumen Export'];
                        }
                        return docs.map((d, i) => (
                          <span key={i} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                            {d}
                          </span>
                        ));
                      })()}
                    </div>
                    {h.is_urgent_force === 1 && (
                      <span style={{ marginTop: '4px', display: 'inline-block', backgroundColor: '#ffe9e8', color: '#ff3b30', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                        URGENT
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: '#1d1d1f' }}>
                    {h.receiver_name || 'Tim AO'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      backgroundColor: isAccepted ? '#e7f8ec' : '#fff2e0',
                      color: isAccepted ? '#15803d' : '#b45309',
                      padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600
                    }}>
                      {isAccepted ? <CheckCircle2 size={14} /> : <Clock size={14} />} 
                      {h.ao_receipt_status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#7a7a7a', fontSize: '13px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.remark || '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      onClick={() => navigate(`/workspace/staff/job-detail/${h.job_id}`)}
                      className="bg-transparent border-none p-1.5 text-[var(--color-ink-muted-48)] hover:text-[var(--color-ink)] cursor-pointer active:scale-95 transition-transform"
                      title="Buka Job Workbench"
                    >
                      <ExternalLink size={16}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const AeStaffWorkboard = ({ jobs, onRefresh, onExecute, onToast }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'jobs';
  
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [handoverJob, setHandoverJob] = useState(null);
  const navigate = useNavigate();

  const processedJobs = useMemo(() => {
    // 1. Filter
    const filtered = jobs.filter(j => {
      if (search) {
        const q = search.toLowerCase();
        if (!j.invoice_no?.toLowerCase().includes(q) && !j.buyer?.toLowerCase().includes(q) && !j.destination?.toLowerCase().includes(q)) {
          return false;
        }
      }
      
      const segment = getWeekSegment(j.closing_docs);
      if (filter === 'Mid Week' && segment !== 'midweek') return false;
      if (filter === 'Endweek' && segment !== 'endweek') return false;
      return true;
    });

    // 2. Sort & Group
    const { complete, incomplete } = sortAndGroupAEJobs(filtered);
    
    // 3. Mark grouping for visuals
    const combined = [...complete, ...incomplete];
    return markVesselGrouping(combined);
  }, [jobs, filter, search]);

  return (
    <div>
      {/* Apple-style Segmented Control for Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', backgroundColor: '#f0f0f0', borderRadius: '9999px', padding: '4px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setSearchParams({ tab: 'jobs' })}
            style={{
              padding: '8px 24px', borderRadius: '9999px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: currentTab === 'jobs' ? '#fff' : 'transparent',
              color: currentTab === 'jobs' ? '#1d1d1f' : '#7a7a7a',
              boxShadow: currentTab === 'jobs' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            📋 Antrean Pekerjaan
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'expedisi' })}
            style={{
              padding: '8px 24px', borderRadius: '9999px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: currentTab === 'expedisi' ? '#fff' : 'transparent',
              color: currentTab === 'expedisi' ? '#1d1d1f' : '#7a7a7a',
              boxShadow: currentTab === 'expedisi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            📦 Buku Ekspedisi Handover
          </button>
        </div>
      </div>

      {currentTab === 'expedisi' ? (
        <AeHandoverLedger />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1, overflowX: 'auto', paddingBottom: '4px' }}>
          {['Semua', 'Mid Week', 'Endweek'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                border: filter === f ? 'none' : '1px solid #cbd5e1',
                backgroundColor: filter === f ? '#1e293b' : '#fff',
                color: filter === f ? '#fff' : '#475569'
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input 
            type="text" placeholder="Cari invoice, buyer..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: '18px', border: '1px solid var(--color-hairline)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>INVOICE</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>BUYER / DESTINASI</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>CLOSING / ETD / ATD</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>PROGRESS</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>CURRENT WORK</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {processedJobs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Belum ada pekerjaan yang ditugaskan kepada Anda atau sesuai filter.
                </td>
              </tr>
            ) : processedJobs.map(job => (
              <React.Fragment key={job.id}>
                {!job.isGroupedWithPrevious && job.vessel && (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px 16px', backgroundColor: 'var(--color-surface-pearl)', fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      KAPAL: {job.vessel}
                    </td>
                  </tr>
                )}
                
                <tr style={{ borderBottom: '1px solid var(--color-hairline)', fontSize: '14px', backgroundColor: job.isGroupedWithPrevious ? 'var(--color-surface-pearl)' : 'var(--color-canvas)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {job.invoice_no} 
                      <RiskBadge priority={job.priority} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>{job.product_type}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{job.buyer}</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>{job.destination}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: 'var(--color-ink)', fontWeight: 500 }}>
                      {job.closing_docs ? new Date(job.closing_docs).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'}
                      {job.closing_docs_time && ` • ${job.closing_docs_time}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>ETD: {job.etd ? new Date(job.etd).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ATD: 
                      <input 
                        type="date" 
                        defaultValue={job.atd ? job.atd.substring(0,10) : ''} 
                        onBlur={async (e) => {
                          const newVal = e.target.value;
                          const oldVal = job.atd ? job.atd.substring(0,10) : '';
                          if (newVal !== oldVal) {
                            try {
                              const res = await api(`/ae/jobs/${job.id}/atd`, { method: 'PUT', body: JSON.stringify({ atd: newVal }) });
                              if (res.success) onRefresh();
                            } catch(err) { alert('Gagal update ATD'); }
                          }
                        }}
                        style={{ padding: '2px 4px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--color-hairline)', backgroundColor: '#fff', color: 'var(--color-ink)', maxWidth: '110px' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '16px', minWidth: '220px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{job.progress}%</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{job.ae_status}</div>
                    {job.ae_handover_status && job.ae_handover_status !== 'Not Started' && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        marginTop: '4px', padding: '2px 8px', borderRadius: '12px',
                        backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
                        fontSize: '11px', fontWeight: 600
                      }}>
                        <Check size={11} /> Handover: {job.ae_handover_status}
                      </div>
                    )}
                    <GroupProgressIndicator groupProgressStr={job.job_checklist_group_progress} />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{job.nextAction || 'Pending Action'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Update: {formatUpdateTime(job.updated_at)}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {(job.nextAction === 'READY FOR DRAFT HANDOVER' || job.nextAction === 'READY FOR FINAL HANDOVER') ? (
                      <button 
                        onClick={() => setHandoverJob(job)}
                        className="bg-[#10b981] text-white border-none py-1.5 px-3 rounded-full text-[12px] font-semibold cursor-pointer inline-flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        {job.nextAction === 'READY FOR DRAFT HANDOVER' ? 'Serahkan Draft' : 'Serahkan Original'} <Send size={12}/>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => onExecute(job)}
                          className="bg-[var(--color-primary)] text-white border-none py-1.5 px-3 rounded-full text-[12px] font-semibold cursor-pointer inline-flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          Kerjakan <Send size={12}/>
                        </button>
                        <button 
                          onClick={() => setHandoverJob(job)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-2.5 rounded-full text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 active:scale-95 transition-transform ml-1.5"
                          title="Handover Dokumen ke AO (Buku Ekspedisi)"
                        >
                          Handover AO <Send size={11}/>
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => navigate(`/workspace/staff/job-detail/${job.id}`)}
                      className="bg-transparent border-none p-1.5 text-[var(--color-ink-muted-48)] hover:text-[var(--color-ink)] cursor-pointer ml-2 active:scale-95 transition-transform"
                      title="Buka Job Workbench"
                    >
                      <ExternalLink size={14}/>
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {handoverJob && (
        <AeHandoverModal 
          job={handoverJob} 
          onClose={() => setHandoverJob(null)}
          onComplete={(msg) => {
            setHandoverJob(null);
            onRefresh();
            if (onToast) onToast(msg);
          }}
        />
      )}
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SUPERVISOR QUEUE
───────────────────────────────────────────────────────────── */
const AeSupervisorQueue = ({ needsAssignment, assigned, staffList, onRefresh, onToast }) => {
  const [tab, setTab] = useState('UNASSIGNED');
  const [assignJob, setAssignJob] = useState(null);
  const [handoverJob, setHandoverJob] = useState(null);
  const navigate = useNavigate();

  const jobs = tab === 'UNASSIGNED' ? needsAssignment : assigned;

  return (
    <div>
      <div className="flex border-b border-[var(--color-hairline)] mb-6">
        <button 
          onClick={() => setTab('UNASSIGNED')}
          className={`py-3 px-5 bg-transparent font-semibold cursor-pointer border-b-2 transition-colors ${tab === 'UNASSIGNED' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-ink-muted-48)] hover:text-[var(--color-ink)]'}`}
        >
          Needs Assignment ({needsAssignment.length})
        </button>
        <button 
          onClick={() => setTab('ASSIGNED')}
          className={`py-3 px-5 bg-transparent font-semibold cursor-pointer border-b-2 transition-colors ${tab === 'ASSIGNED' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-ink-muted-48)] hover:text-[var(--color-ink)]'}`}
        >
          Assigned ({assigned.length})
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--color-canvas)',
        borderRadius: 'var(--rounded-lg)',
        border: '1px solid var(--color-hairline)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-canvas-parchment)' }}>
              <th style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>INVOICE</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>BUYER / DESTINASI</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>CLOSING DOCS</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>STATUS</th>
              {tab === 'ASSIGNED' && <th style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>ASSIGNED TO</th>}
              <th style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)', textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
                  Tidak ada job dalam antrean ini.
                </td>
              </tr>
            ) : jobs.map((job, index) => (
              <tr key={job.id} className={`transition-colors hover:bg-[var(--color-surface-pearl)]`}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '600', color: 'var(--color-ink)' }}>{job.invoice_no}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-hairline)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{job.buyer}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{job.destination}</div>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-hairline)', color: 'var(--color-ink)' }}>{job.closing_docs ? new Date(job.closing_docs).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-hairline)' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '11px', 
                    fontWeight: '600', backgroundColor: 'var(--color-surface-pearl)', 
                    border: '1px solid var(--color-hairline)', textTransform: 'uppercase', letterSpacing: '0.05em' 
                  }}>
                    {job.ae_status}
                  </span>
                  {job.ae_handover_status && job.ae_handover_status !== 'Not Started' && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      marginTop: '4px', padding: '2px 8px', borderRadius: '12px',
                      backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
                      fontSize: '10px', fontWeight: 600
                    }}>
                      <Check size={10} /> Handover: {job.ae_handover_status}
                    </div>
                  )}
                </td>
                {tab === 'ASSIGNED' && (
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '600', color: 'var(--color-primary)' }}>{job.assignee_name || `User ID: ${job.ae_assignee_id}`}</td>
                )}
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-hairline)', textAlign: 'right' }}>
                  <button 
                    onClick={() => setAssignJob(job)}
                    style={{
                      backgroundColor: 'var(--color-surface-pearl)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline)',
                      padding: '6px 12px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    {tab === 'UNASSIGNED' ? 'Assign' : 'Reassign'}
                  </button>
                  <button 
                    onClick={() => setHandoverJob(job)}
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-2.5 rounded-full text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 active:scale-95 transition-transform ml-1.5"
                    title="Handover Dokumen ke AO"
                  >
                    Handover AO <Send size={11}/>
                  </button>
                  <button 
                    onClick={() => navigate(`/workspace/staff/job-detail/${job.id}`)}
                    className="bg-transparent border-none p-1.5 text-[var(--color-ink-muted-48)] hover:text-[var(--color-ink)] cursor-pointer ml-1.5 active:scale-95 transition-transform"
                    title="Buka Job Workbench"
                  >
                    <ExternalLink size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssignmentModal 
        job={assignJob} 
        staffList={staffList} 
        onClose={() => setAssignJob(null)} 
        onAssigned={onRefresh} 
      />

      {handoverJob && (
        <AeHandoverModal 
          job={handoverJob} 
          onClose={() => setHandoverJob(null)}
          onComplete={(msg) => {
            setHandoverJob(null);
            onRefresh();
            if (onToast) onToast(msg);
          }}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function AeWorkboard() {
  const { user } = useAuthStore();
  const isSupervisor = user?.level_otoritas === 'Supervisor';
  
  const [loading, setLoading] = useState(true);
  const [staffJobs, setStaffJobs] = useState([]);
  const [needsAssignment, setNeedsAssignment] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [executeJob, setExecuteJob] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  const handleToast = (msg) => {
    setToast({ isOpen: true, message: msg || 'Dokumen berhasil diserahterimakan ke Tim AO.', type: 'success' });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupervisor) {
        const json = await api('/ae/supervisor/queue');
        if (json.success) {
          setNeedsAssignment(json.data.needsAssignment);
          setAssignedJobs(json.data.assigned);
        }
        const staffRes = await api('/users/assignable');
        setStaffList(staffRes || []);
      } else {
        const json = await api('/ae/my-jobs');
        if (json.success) {
          setStaffJobs(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [isSupervisor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-canvas-parchment)' }}>
      {/* HEADER MATCHING DEPT IMPORT */}
      <div style={{
        padding: '24px 32px 20px',
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px', margin: '0 0 4px', color: 'var(--color-ink)' }}>
            AE Workboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: 0 }}>
            Kelola pekerjaan AE secara real-time
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ 
            fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)', 
            backgroundColor: 'var(--color-surface-pearl)', padding: '6px 12px', 
            borderRadius: 'var(--rounded-pill)', border: '1px solid var(--color-hairline)' 
          }}>
            {user?.nama} ({user?.level_otoritas})
          </span>
          <button 
            onClick={fetchData} disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--rounded-pill)',
              border: '1px solid var(--color-hairline)',
              backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>Loading...</div>
        ) : isSupervisor ? (
          <AeSupervisorQueue 
            needsAssignment={needsAssignment} 
            assigned={assignedJobs} 
            staffList={staffList} 
            onRefresh={fetchData} 
            onToast={handleToast}
          />
        ) : (
          <AeStaffWorkboard 
            jobs={staffJobs} 
            onRefresh={fetchData} 
            onExecute={setExecuteJob} 
            onToast={handleToast}
          />
        )}
      </div>

      <AppleToast 
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

      <ExecutionSlideOver 
        job={executeJob} 
        onClose={() => setExecuteJob(null)} 
        onComplete={(jobId) => {
          fetchData(); // Refresh list after execution
        }} 
      />
    </div>
  );
}
