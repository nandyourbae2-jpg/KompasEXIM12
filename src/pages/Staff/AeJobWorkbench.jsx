import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, ArrowLeft, ChevronDown, ChevronRight,
  X, Zap, AlertTriangle, Clock, FileText, BarChart2, MessageSquare, Edit2, Check, Share2, CalendarDays,
  ArrowUpRight
} from 'lucide-react';
import ActionFormEngine from './ActionFormEngine';
import AppleConfirmModal from '../../components/AppleConfirmModal';
import AppleToast from '../../components/AppleToast';
import { AppleCalendarPopover, formatDisplayDate, toISODate } from '../../components/AppleCalendarPicker';
import useAuthStore from '../../store/useAuthStore';
import './AeJobWorkbench.css';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
};

/* ──────────────────────────────────────────────
   SLIDE-OVER
────────────────────────────────────────────── */
const SlideOver = ({ open, onClose, title, subtitle, children }) => (
  <>
    {open && (
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
    )}
    <div className={`slideover-panel ${open ? 'slideover-open' : ''}`}>
      <div className="slideover-header">
        <div>
          <p className="slideover-eyebrow">Eksekusi Aktivitas</p>
          <h2 className="slideover-title">{title}</h2>
          {subtitle && <p className="slideover-subtitle">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="slideover-close">
          <X size={16} />
        </button>
      </div>
      <div className="slideover-body">{children}</div>
    </div>
  </>
);

/* ──────────────────────────────────────────────
   STAGE DATE BADGE — dalam header ProgressGroup
────────────────────────────────────────────── */
const StageDateBadge = ({ milestone, onBadgeClick, badgeRef }) => {
  const today = toISODate(new Date());
  const target = milestone?.target_date;
  const completed = milestone?.completed_date;

  let variant = 'empty';
  let label = '+ Set Tanggal';
  let icon = null;

  if (completed) {
    variant = 'done';
    label = `✓ Selesai: ${formatDisplayDate(completed)}`;
  } else if (target) {
    if (target < today) {
      variant = 'overdue';
      label = `⚠ Target: ${formatDisplayDate(target)}`;
    } else {
      variant = 'on-track';
      label = `📅 Target: ${formatDisplayDate(target)}`;
    }
  }

  return (
    <button
      ref={badgeRef}
      type="button"
      className={`stage-date-badge stage-date-badge--${variant}`}
      onClick={(e) => { e.stopPropagation(); onBadgeClick(); }}
      title={target ? `Target: ${target}${completed ? ` | Selesai: ${completed}` : ''}` : 'Klik untuk set tanggal target stage ini'}
    >
      <CalendarDays size={10} />
      <span>{label}</span>
    </button>
  );
};

/* ──────────────────────────────────────────────
   WORK PROGRESS ACCORDION GROUP
────────────────────────────────────────────── */
const ProgressGroup = ({ groupName, groupItems, currentItemId, onItemClick, onHandoverClick, milestone, onSaveDate }) => {
  const completedCount = groupItems.filter(i => i.next_action_mode === 'DONE').length;
  const isFullyDone = completedCount === groupItems.length;
  const hasCurrentItem = groupItems.some(i => i.id === currentItemId);
  const [open, setOpen] = useState(hasCurrentItem);
  const [showPicker, setShowPicker] = useState(false);
  const badgeRef = useRef(null);

  const targetDocs = ['bl', 'invoice', 'packing list', 'coo', 'data loading'];

  const handlePickerChange = (isoDate) => {
    setShowPicker(false);
    // Save: if group is fully done, save as completed_date; else save as target_date
    if (isFullyDone) {
      onSaveDate(groupName, { completed_date: isoDate });
    } else {
      onSaveDate(groupName, { target_date: isoDate });
    }
  };

  return (
    <div className="progress-group" style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="progress-group-header"
      >
        <div className="progress-group-header-left">
          {isFullyDone
            ? <CheckCircle2 size={16} className="icon-done" />
            : <Circle size={16} className="icon-pending" />}
          <span className="progress-group-name">{groupName}</span>
        </div>
        <div className="progress-group-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* ── Stage Date Badge ── */}
          <StageDateBadge
            milestone={milestone}
            badgeRef={badgeRef}
            onBadgeClick={() => setShowPicker(p => !p)}
          />
          <span className={`progress-count-badge ${isFullyDone ? 'done' : ''}`}>
            {completedCount} / {groupItems.length}
          </span>
          {open ? <ChevronDown size={15} className="icon-chevron" /> : <ChevronRight size={15} className="icon-chevron" />}
        </div>
      </button>

      {/* Apple Calendar Popover */}
      {showPicker && (
        <AppleCalendarPopover
          value={milestone?.target_date || milestone?.completed_date || null}
          onChange={handlePickerChange}
          triggerRef={badgeRef}
          onClose={() => setShowPicker(false)}
        />
      )}

      {open && (
        <div className="progress-group-items">
          {groupItems.map(item => {
            const isDone = item.next_action_mode === 'DONE';
            const isCurrent = item.id === currentItemId;
            const isTargetHandover = targetDocs.includes(item.nama_item.toLowerCase());
            
            // Find the most recent execution date for done items
            const lastExec = isDone && item.executions?.length > 0
              ? item.executions[item.executions.length - 1]
              : null;
            const execDateDisplay = lastExec?.executed_at
              ? formatDisplayDate(lastExec.executed_at.slice(0, 10))
              : null;

            let icon;
            if (isDone) icon = <CheckCircle2 size={15} className="icon-done" />;
            else if (isCurrent) icon = <Zap size={15} className="icon-current" />;
            else icon = <Circle size={13} className="icon-pending" />;

            return (
              <div
                key={item.id}
                onClick={() => !isDone && onItemClick(item)}
                className={`progress-item ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''} ${!isDone ? 'is-clickable' : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div className="progress-item-icon">{icon}</div>
                  <span className="progress-item-name">{item.nama_item}</span>
                  {isCurrent && <span className="current-badge">SEKARANG</span>}
                  {isDone && !isTargetHandover && <span className="done-label">✓</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {/* Execution date badge for done items */}
                  {isDone && execDateDisplay && (
                    <span className="item-exec-date" title={`Diselesaikan: ${execDateDisplay}`}>
                      <CalendarDays size={9} />
                      {execDateDisplay}
                    </span>
                  )}
                  
                  {isDone && isTargetHandover && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onHandoverClick(item.nama_item); }}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: 'var(--color-primary, #0066cc)',
                        color: 'var(--color-on-primary, #ffffff)', 
                        borderRadius: 'var(--rounded-pill, 9999px)',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '600', 
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, sans-serif)',
                        transition: 'transform 0.1s ease, filter 0.15s ease',
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title={`Bagikan ${item.nama_item} ke AO`}
                    >
                      <Share2 size={11} />
                      <span>Share ke AO</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────── */
const AeExecutionDesk = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const token = user?.token;

  const [job, setJob]       = useState(null);
  const [items, setItems]   = useState([]);
  const [history, setHistory] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [slideOverItem, setSlideOverItem] = useState(null);
  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState('');
  const [editingAtd, setEditingAtd] = useState(false);
  const [atdValue, setAtdValue] = useState('');
  // Stage milestones: { 'Document Preparation': { target_date, completed_date, ... }, ... }
  const [stageMilestones, setStageMilestones] = useState({});

  // Apple-style Dialog & Toast States
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    documentName: '',
    submitting: false,
  });
  const [toast, setToast] = useState({
    isOpen: false,
    type: 'success',
    message: '',
  });

  const API = import.meta.env.VITE_API_URL || '/api/v2';

  const fetchJobData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch(`${API}/ae-workbench/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memuat detail pekerjaan');
      }
      
      const newItems = data.items || data.data?.items || [];
      setJob(data.job || data.data?.job || data);
      setItems(newItems);
      setHistory(data.history || data.data?.history || []);
      // Load stage milestones from API response
      if (data.data?.stage_milestones) {
        setStageMilestones(data.data.stage_milestones);
      } else if (data.stage_milestones) {
        setStageMilestones(data.stage_milestones);
      }

      try {
        const remRes = await fetch(`${API}/ae/jobs/${id}/remarks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (remRes.ok) {
          const remData = await remRes.json();
          setRemarks(remData.data || []);
        }
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memuat detail pekerjaan');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id, token, API]);

  useEffect(() => { fetchJobData(); }, [fetchJobData]);

  // Sync qtyValue with job data whenever job loads
  useEffect(() => {
    if (job?.container_qty != null) setQtyValue(String(job.container_qty));
    if (job?.atd != null) setAtdValue(job.atd.substring(0,10));
  }, [job?.container_qty, job?.atd]);

  const saveQtyFcl = async () => {
    const parsed = parseInt(qtyValue, 10);
    if (isNaN(parsed)) { setEditingQty(false); return; }
    try {
      const res = await fetch(`${API}/ae/jobs/${id}/fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ container_qty: parsed })
      });
      if (res.ok) {
        setJob(prev => ({ ...prev, container_qty: parsed }));
      }
    } catch (e) { console.error(e); }
    setEditingQty(false);
  };

  const saveAtd = async () => {
    try {
      const res = await fetch(`${API}/ae/jobs/${id}/atd`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ atd: atdValue || null })
      });
      if (res.ok) {
        setJob(prev => ({ ...prev, atd: atdValue || null }));
      }
    } catch (e) { console.error(e); }
    setEditingAtd(false);
  };

  const handleActionComplete = async () => {
    const currentGroupId = slideOverItem?.nama_group;
    await fetchJobData(true);
    
    setItems(currentItems => {
      const nextItem = currentItems.find(i => i.nama_group === currentGroupId && i.next_action_mode !== 'DONE');
      if (nextItem) {
        setSlideOverItem(nextItem);
      } else {
        setSlideOverItem(null);
      }
      return currentItems;
    });
  };

  const handleHandoverDocument = (documentName) => {
    setConfirmModal({
      isOpen: true,
      documentName,
      submitting: false,
    });
  };

  const executeHandoverDocument = async () => {
    const docName = confirmModal.documentName;
    if (!docName) return;

    setConfirmModal(prev => ({ ...prev, submitting: true }));
    try {
      const res = await fetch(`${API}/ae/jobs/${id}/handover-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ document_name: docName })
      });
      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = { message: 'Format data dari server tidak sesuai.' };
      }

      if (res.ok && data.success !== false) {
        setConfirmModal({ isOpen: false, documentName: '', submitting: false });
        setToast({
          isOpen: true,
          type: 'success',
          message: data.message || `Dokumen ${docName} berhasil dibagikan ke AO.`,
        });
        fetchJobData(true);
      } else {
        setConfirmModal(prev => ({ ...prev, submitting: false }));
        setToast({
          isOpen: true,
          type: 'error',
          message: data.message || 'Gagal membagikan dokumen ke AO.',
        });
      }
    } catch (e) {
      console.error(e);
      setConfirmModal(prev => ({ ...prev, submitting: false }));
      setToast({
        isOpen: true,
        type: 'error',
        message: 'Terjadi kendala koneksi saat membagikan dokumen.',
      });
    }
  };

  /* ── Stage Milestone Save ── */
  const saveStageMilestone = useCallback(async (stageName, fields) => {
    try {
      const res = await fetch(
        `${API}/ae-workbench/jobs/${id}/stages/${encodeURIComponent(stageName)}/date`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(fields),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setStageMilestones(prev => ({
          ...prev,
          [stageName]: data.data,
        }));
        setToast({
          isOpen: true,
          type: 'success',
          message: `Tanggal stage "${stageName}" berhasil disimpan.`,
        });
      } else {
        setToast({ isOpen: true, type: 'error', message: data.message || 'Gagal menyimpan tanggal.' });
      }
    } catch (e) {
      setToast({ isOpen: true, type: 'error', message: 'Koneksi gagal saat menyimpan tanggal.' });
    }
  }, [id, token, API]);

  /* Derived */
  const currentItem = items.find(i => i.next_action_mode !== 'DONE' && i.next_activity);
  const lastItemExecution = currentItem?.executions && currentItem.executions.length > 0
    ? currentItem.executions[currentItem.executions.length - 1]
    : null;
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.nama_group]) acc[item.nama_group] = [];
    acc[item.nama_group].push(item);
    return acc;
  }, {});
  const totalDone  = items.filter(i => i.next_action_mode === 'DONE').length;
  const totalItems = items.length;
  const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // ── Bento Status Computations (Real Data) ──
  const closingInfo = React.useMemo(() => {
    if (!job?.closing_docs) {
      return {
        dateStr: 'Belum Diatur',
        badge: 'Jadwal Kosong',
        status: 'neutral',
        sub: 'Jadwal closing docs belum ditetapkan',
      };
    }
    const todayStr = toISODate(new Date());
    const rawDate = String(job.closing_docs).split('T')[0].split(' ')[0];
    const timeSuffix = job.closing_docs_time ? ` · ${job.closing_docs_time}` : '';
    const dateStr = (formatDisplayDate(rawDate) || rawDate) + timeSuffix;

    const today = new Date(todayStr);
    const target = new Date(rawDate);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        dateStr,
        badge: `Overdue ${Math.abs(diffDays)} Hari`,
        status: 'danger',
        sub: 'Melewati batas cutoff dokumen pelayaran',
      };
    }
    if (diffDays === 0) {
      return {
        dateStr,
        badge: 'Batas Akhir Hari Ini',
        status: 'warning',
        sub: 'Prioritaskan penyelesaian dokumen hari ini',
      };
    }
    if (diffDays <= 2) {
      return {
        dateStr,
        badge: `Sisa ${diffDays} Hari`,
        status: 'warning',
        sub: 'Mendekati batas cutoff pelayaran',
      };
    }
    return {
      dateStr,
      badge: `Sisa ${diffDays} Hari`,
      status: 'success',
      sub: `Kapal: ${job.vessel || 'Sesuai Jadwal'}`,
    };
  }, [job?.closing_docs, job?.closing_docs_time, job?.vessel]);

  const handoverInfo = React.useMemo(() => {
    const status = job?.ae_handover_status;
    const time = job?.ae_handover_at;
    let formattedTime = null;
    if (time) {
      try {
        const d = new Date(time);
        formattedTime = d.toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (e) {
        formattedTime = time;
      }
    }

    if (!status || status === 'Not Handed Over' || status === 'Pending') {
      return {
        title: 'Belum Diserahkan',
        badge: 'Menunggu',
        status: 'neutral',
        sub: 'Serahkan berkas saat tahapan dokumen siap',
      };
    }
    if (status === 'Draft Shared' || status === 'Draft Handed Over') {
      return {
        title: 'Draft Diserahkan',
        badge: 'Draft Terkirim',
        status: 'info',
        sub: formattedTime ? `Diserahkan: ${formattedTime}` : 'Siap ditindaklanjuti tim AO',
      };
    }
    if (status === 'Original Handed Over' || status === 'Handover Complete' || status === 'Complete') {
      return {
        title: 'Original Diserahkan',
        badge: 'Lengkap',
        status: 'success',
        sub: formattedTime ? `Diserahkan: ${formattedTime}` : 'Seluruh berkas fisik telah diserahkan',
      };
    }
    return {
      title: status,
      badge: 'Aktif',
      status: 'info',
      sub: formattedTime ? `Update: ${formattedTime}` : 'Status serah terima diperbarui',
    };
  }, [job?.ae_handover_status, job?.ae_handover_at]);

  const currentStageMilestone = currentItem ? stageMilestones[currentItem.nama_group] : null;

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* ── Loading / Error ── */
  if (loading) return (
    <div className="wb-center-screen">
      <div className="wb-spinner" />
      <p className="wb-loading-text">Memuat data pekerjaan…</p>
    </div>
  );
  if (error) return (
    <div className="wb-center-screen">
      <div className="wb-error-card">
        <AlertTriangle size={32} className="wb-error-icon" />
        <p className="wb-error-msg">{error}</p>
        <button className="wb-retry-btn" onClick={fetchJobData}>Coba Lagi</button>
      </div>
    </div>
  );
  if (!job) return <div className="wb-center-screen"><p className="wb-loading-text">Job tidak ditemukan.</p></div>;

  const infoFields = [
    { label: 'PI / SO',       value: job.pi_so_no || job.pi_no, editable: false },
    { label: 'Qty FCL',       value: job.container_qty != null ? String(job.container_qty) : '—', editable: true, field: 'container_qty' },
    { label: 'Closing Docs',  value: job.closing_docs, editable: false },
    { label: 'ETD',           value: job.etd, editable: false },
    { label: 'ATD',           value: job.atd || '—', editable: true, field: 'atd' },
    { label: 'Liner',         value: job.liner, editable: false },
    { label: 'Buyer',         value: job.buyer, editable: false },
    { label: 'Destination',   value: job.destination, editable: false },
    { label: 'FWD',           value: job.fwd_trucking, editable: false },
    { label: 'Produk',        value: job.product_type, editable: false },
    { label: 'ETA',           value: job.eta, editable: false },
  ].filter(f => f.value !== null && f.value !== undefined);

  const subtitle = [job.buyer, job.destination, job.product_type].filter(Boolean).join(' · ');

  return (
    <div className="wb-page">

      {/* ══════════════════════════════════════════════
          1. JOB HEADER
      ══════════════════════════════════════════════ */}
      <div className="wb-section">
        <div className="wb-header-card">

          {/* Row 1 — Back */}
          <div className="wb-header-back-row">
            <button onClick={() => navigate(-1)} className="wb-back-btn">
              <ArrowLeft size={15} />
              <span>Kembali</span>
            </button>
          </div>

          {/* Row 2 — Invoice + Badges */}
          <div className="wb-header-title-row">
            <div>
              <h1 className="wb-invoice-title">Invoice {job.invoice_no || id}</h1>
              {subtitle && <p className="wb-invoice-sub">{subtitle}</p>}
            </div>
            <div className="wb-badge-group">
              {job.ae_status && (
                <span className="wb-badge wb-badge-blue">{job.ae_status}</span>
              )}
              {(job.is_overdue || job.risk_level === 'HIGH') && (
                <span className="wb-badge wb-badge-red">
                  <AlertTriangle size={10} />
                  OVERDUE
                </span>
              )}
            </div>
          </div>

          {/* Row 3 — Info Grid */}
          {infoFields.length > 0 && (
            <div className="wb-header-info-grid">
              {infoFields.map(f => (
                <div key={f.label} className="wb-info-cell">
                  <span className="wb-info-label">{f.label}</span>
                  {f.editable ? (
                    f.field === 'container_qty' ? (
                      editingQty ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="0"
                            value={qtyValue}
                            onChange={e => setQtyValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveQtyFcl(); if (e.key === 'Escape') setEditingQty(false); }}
                            autoFocus
                            style={{ width: '56px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #93c5fd', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                          />
                          <button onClick={saveQtyFcl} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', padding: '2px' }} title="Simpan">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingQty(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }} title="Batal">
                            <X size={14} />
                          </button>
                        </span>
                      ) : (
                        <span className="wb-info-value" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {f.value}
                          <button onClick={() => { setQtyValue(f.value === '—' ? '' : f.value); setEditingQty(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '1px', opacity: 0.6 }} title="Edit Qty FCL">
                            <Edit2 size={11} />
                          </button>
                        </span>
                      )
                    ) : f.field === 'atd' ? (
                      editingAtd ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="date"
                            value={atdValue}
                            onChange={e => setAtdValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveAtd(); if (e.key === 'Escape') setEditingAtd(false); }}
                            autoFocus
                            style={{ width: '110px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #93c5fd', fontSize: '11px', outline: 'none' }}
                          />
                          <button onClick={saveAtd} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', padding: '2px' }} title="Simpan">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingAtd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }} title="Batal">
                            <X size={14} />
                          </button>
                        </span>
                      ) : (
                        <span className="wb-info-value" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {f.value !== '—' ? new Date(f.value).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : f.value}
                          <button onClick={() => { setAtdValue(job.atd ? job.atd.substring(0,10) : ''); setEditingAtd(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '1px', opacity: 0.6 }} title="Edit ATD">
                            <Edit2 size={11} />
                          </button>
                        </span>
                      )
                    ) : (
                      <span className="wb-info-value">{f.value}</span>
                    )
                  ) : (
                    <span className="wb-info-value">{f.value}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Row 4 — Progress bar */}
          <div className="wb-header-progress-row">
            <span className="wb-progress-label">Progres Pekerjaan</span>
            <div className="wb-progress-track">
              <div className="wb-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="wb-progress-text">{totalDone} / {totalItems} · {pct}%</span>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════
          2. CURRENT WORK  +  JOB STATUS
      ══════════════════════════════════════════════ */}
      <div className="wb-section wb-two-col">

        {/* Current Work */}
        <div className="wb-card wb-current-work">
          <div className="wb-card-header">
            <Zap size={14} className="wb-card-header-icon" />
            <span className="wb-card-header-title">Yang Perlu Dilakukan</span>
            {currentItem && (
              <span className="wb-current-stage-tag">
                {currentItem.nama_group}
              </span>
            )}
          </div>

          {currentItem ? (
            <div className="wb-current-body">
              <div className="wb-current-title-block">
                <p className="wb-current-group">{currentItem.nama_group}</p>
                <h2 className="wb-current-item">{currentItem.nama_item}</h2>
              </div>

              {currentItem.next_activity && (
                <div className="wb-current-activity">
                  <span className="wb-activity-step">{currentItem.next_activity.urutan}</span>
                  <span className="wb-activity-name">{currentItem.next_activity.nama_aktivitas}</span>
                  {currentItem.next_action_mode === 'REVISE' && (
                    <span className="wb-revise-badge">Revisi</span>
                  )}
                </div>
              )}

              {/* ── Stepper Pipeline: Alur Langkah Dokumen (Opsi 1) ── */}
              {currentItem.all_activities && currentItem.all_activities.length > 0 && (
                <div className="wb-stepper-container">
                  <div className="wb-stepper-header">
                    <span className="wb-stepper-label">Alur Aktivitas Dokumen</span>
                    <span className="wb-stepper-counter">
                      Langkah {currentItem.next_activity?.urutan || 1} dari {currentItem.all_activities.length}
                    </span>
                  </div>

                  <div className="wb-stepper-track">
                    {currentItem.all_activities.map((act, idx) => {
                      const currentUrutan = currentItem.next_activity?.urutan || 1;
                      const isDone = act.urutan < currentUrutan;
                      const isCurrent = act.urutan === currentUrutan;
                      const isPending = act.urutan > currentUrutan;

                      return (
                        <React.Fragment key={act.id}>
                          <div
                            className={`wb-stepper-item ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                            title={`Langkah ${act.urutan}: ${act.nama_aktivitas}`}
                          >
                            <span className="wb-stepper-dot">
                              {isDone ? <Check size={10} strokeWidth={3} /> : act.urutan}
                            </span>
                            <span className="wb-stepper-name">{act.nama_aktivitas}</span>
                          </div>
                          {idx < currentItem.all_activities.length - 1 && (
                            <span className={`wb-stepper-arrow ${isDone ? 'done' : ''}`}>
                              <ChevronRight size={12} />
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Audit Trail / Riwayat Terakhir Dokumen Ini (Opsi 2) ── */}
              {currentItem.next_action_mode === 'REVISE' ? (
                <div className="wb-audit-banner wb-audit-revise">
                  <div className="wb-audit-header">
                    <AlertTriangle size={14} className="wb-audit-icon-warning" />
                    <span className="wb-audit-title">Perlu Tindakan Revisi</span>
                    {lastItemExecution?.executed_at && (
                      <span className="wb-audit-time">{formatDateTime(lastItemExecution.executed_at)}</span>
                    )}
                  </div>
                  <p className="wb-audit-text">
                    {lastItemExecution?.remark
                      ? `"${lastItemExecution.remark}"`
                      : 'Terdapat permintaan revisi data pada aktivitas sebelumnya. Silakan periksa kembali sebelum eksekusi.'}
                  </p>
                  {lastItemExecution?.actor_name && (
                    <span className="wb-audit-actor">Oleh: {lastItemExecution.actor_name}</span>
                  )}
                </div>
              ) : (
                <div className="wb-audit-banner wb-audit-normal">
                  <div className="wb-audit-header">
                    {lastItemExecution ? (
                      <>
                        <CheckCircle2 size={13} className="wb-audit-icon-success" />
                        <span className="wb-audit-title">Riwayat Terakhir</span>
                        <span className="wb-audit-time">{formatDateTime(lastItemExecution.executed_at)}</span>
                      </>
                    ) : (
                      <>
                        <Clock size={13} className="wb-audit-icon-neutral" />
                        <span className="wb-audit-title">Status Awal Dokumen</span>
                        <span className="wb-audit-time">Siap Dimulai</span>
                      </>
                    )}
                  </div>
                  <p className="wb-audit-text">
                    {lastItemExecution?.remark
                      ? `"${lastItemExecution.remark}"`
                      : lastItemExecution
                      ? `Aktivitas sebelumnya berhasil diselesaikan oleh ${lastItemExecution.actor_name || 'Staf AE'}.`
                      : 'Belum ada riwayat pengerjaan sebelumnya. Klik tombol di bawah untuk mengeksekusi aktivitas pertama.'}
                  </p>
                </div>
              )}

              <button
                onClick={() => setSlideOverItem(currentItem)}
                className="wb-execute-btn"
              >
                <Zap size={14} />
                Eksekusi Aktivitas Ini
              </button>
            </div>
          ) : (
            <div className="wb-all-done">
              <CheckCircle2 size={36} className="wb-all-done-icon" />
              <p className="wb-all-done-title">Semua Tugas Selesai</p>
              <p className="wb-all-done-sub">Tidak ada aktivitas yang perlu dikerjakan saat ini.</p>
            </div>
          )}
        </div>

        {/* Job Status (Bento Grid) */}
        <div className="wb-card wb-job-status">
          <div className="wb-card-header">
            <BarChart2 size={14} className="wb-card-header-icon" />
            <span className="wb-card-header-title">Status Pekerjaan</span>
            <span className="wb-bento-header-badge">Data Real-Time</span>
          </div>

          <div className="wb-bento-grid">
            {/* Bento 1: Tahap Saat Ini */}
            <div
              className="wb-bento-card clickable"
              onClick={() => scrollToSection('wb-progress-section')}
              title="Klik untuk melihat aktivitas di Work Progress"
            >
              <div className="wb-bento-top">
                <div className="wb-bento-icon-bubble bubble-blue">
                  <Clock size={13} />
                </div>
                <span className="wb-bento-key">Tahap Saat Ini</span>
                <ArrowUpRight size={12} className="wb-bento-arrow" />
              </div>
              <div className="wb-bento-main">
                <h4 className="wb-bento-title">{currentItem?.nama_item || 'Semua Tahap Selesai'}</h4>
                <div className="wb-bento-sub">
                  <span className="wb-bento-group-tag">{currentItem?.nama_group || 'Selesai'}</span>
                  {currentStageMilestone?.target_date && (
                    <span className="wb-bento-target-pill">
                      Target: {formatDisplayDate(currentStageMilestone.target_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bento 2: Deadline Closing Docs */}
            <div className="wb-bento-card">
              <div className="wb-bento-top">
                <div className={`wb-bento-icon-bubble bubble-${closingInfo.status}`}>
                  <CalendarDays size={13} />
                </div>
                <span className="wb-bento-key">Closing Docs</span>
                <span className={`wb-bento-badge badge-${closingInfo.status}`}>
                  {closingInfo.badge}
                </span>
              </div>
              <div className="wb-bento-main">
                <h4 className="wb-bento-title">{closingInfo.dateStr}</h4>
                <p className="wb-bento-sub">{closingInfo.sub}</p>
              </div>
            </div>

            {/* Bento 3: Status Handover ke AO */}
            <div
              className="wb-bento-card clickable"
              onClick={() => scrollToSection('wb-progress-section')}
              title="Klik untuk memeriksa kesiapan serah terima dokumen"
            >
              <div className="wb-bento-top">
                <div className={`wb-bento-icon-bubble bubble-${handoverInfo.status}`}>
                  <Share2 size={13} />
                </div>
                <span className="wb-bento-key">Serah Terima AO</span>
                <span className={`wb-bento-badge badge-${handoverInfo.status}`}>
                  {handoverInfo.badge}
                </span>
              </div>
              <div className="wb-bento-main">
                <h4 className="wb-bento-title">{handoverInfo.title}</h4>
                <p className="wb-bento-sub">{handoverInfo.sub}</p>
              </div>
            </div>

            {/* Bento 4: Catatan Operasional (Real Remarks) */}
            <div
              className="wb-bento-card clickable"
              onClick={() => {
                if (remarks.length > 0) {
                  scrollToSection('wb-remarks-section');
                }
              }}
              title={remarks.length > 0 ? 'Klik untuk melihat catatan operasional' : 'Nihil catatan kendala'}
            >
              <div className="wb-bento-top">
                <div className={`wb-bento-icon-bubble ${remarks.length > 0 ? 'bubble-warning' : 'bubble-success'}`}>
                  <MessageSquare size={13} />
                </div>
                <span className="wb-bento-key">Catatan Kendala</span>
                <span className={`wb-bento-badge ${remarks.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                  {remarks.length > 0 ? `${remarks.length} Catatan` : 'Nihil'}
                </span>
              </div>
              <div className="wb-bento-main">
                <h4 className="wb-bento-title">
                  {remarks.length > 0 ? `${remarks.length} Catatan Aktif` : 'Operasional Normal'}
                </h4>
                <p className="wb-bento-sub">
                  {remarks.length > 0
                    ? `"${remarks[0]?.remark?.length > 25 ? remarks[0].remark.slice(0, 25) + '…' : remarks[0]?.remark}"`
                    : 'Tidak ada kendala terdata'}
                </p>
              </div>
            </div>

            {/* Bento 5: Rangkuman Progres (Full Width) */}
            <div className="wb-bento-card-full">
              <div className="wb-bento-progress-header">
                <div className="wb-bento-progress-left">
                  <span className="wb-bento-progress-title">Progres Pekerjaan</span>
                  <span className="wb-bento-progress-pct">{pct}%</span>
                </div>
                <span className="wb-bento-progress-stat">
                  <strong>{totalDone}</strong> dari <strong>{totalItems}</strong> Selesai ({totalItems - totalDone} tersisa)
                </span>
              </div>
              <div className="wb-bento-track">
                <div
                  className="wb-bento-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════
          3. WORK PROGRESS
      ══════════════════════════════════════════════ */}
      <div className="wb-section" id="wb-progress-section">
        <div className="wb-card">
          <div className="wb-card-header">
            <CheckCircle2 size={14} className="wb-card-header-icon" />
            <span className="wb-card-header-title">Work Progress</span>
            <span className="wb-card-header-sub">{totalDone} dari {totalItems} selesai</span>
          </div>
          <div className="wb-progress-list">
            {Object.entries(groupedItems).map(([groupName, groupItems]) => (
              <ProgressGroup
                key={groupName}
                groupName={groupName}
                groupItems={groupItems}
                currentItemId={currentItem?.id}
                onItemClick={setSlideOverItem}
                onHandoverClick={handleHandoverDocument}
                milestone={stageMilestones[groupName] || null}
                onSaveDate={saveStageMilestone}
              />
            ))}
            {items.length === 0 && (
              <p className="wb-empty-state">Tidak ada aktivitas untuk pekerjaan ini.</p>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          3.5. OPERATIONAL REMARKS
      ══════════════════════════════════════════════ */}
      {remarks.length > 0 && (
        <div className="wb-section" id="wb-remarks-section">
          <div className="wb-card">
            <div className="wb-card-header">
              <MessageSquare size={14} className="wb-card-header-icon" />
              <span className="wb-card-header-title">Catatan Operasional</span>
            </div>
            <div className="wb-history-list">
              {remarks.map(r => (
                <div key={r.id} className="wb-history-item">
                  <div className="wb-history-icon">
                    <MessageSquare size={14} />
                  </div>
                  <div className="wb-history-content">
                    <div className="wb-history-top">
                      <span className="wb-history-action">{r.actor_name || 'Staf'}</span>
                      <span className="wb-history-time">
                        {new Date(r.created_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="wb-history-meta" style={{ color: '#0f172a', fontStyle: 'normal' }}>
                      {r.remark}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          4. ACTIVITY HISTORY
      ══════════════════════════════════════════════ */}
      {history.length > 0 && (
        <div className="wb-section">
          <div className="wb-card">
            <div className="wb-card-header">
              <Clock size={14} className="wb-card-header-icon" />
              <span className="wb-card-header-title">Riwayat Aktivitas</span>
            </div>
            <div className="wb-history-list">
              {history.slice(0, 10).map((h, idx) => (
                <div key={h.id || idx} className="wb-history-item">
                  <div className="wb-history-icon">
                    <FileText size={14} />
                  </div>
                  <div className="wb-history-content">
                    <div className="wb-history-top">
                      <span className="wb-history-action">{h.action || h.activity_name || 'Aktivitas'}</span>
                      <span className="wb-history-time">
                        {new Date(h.created_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="wb-history-meta">
                      {h.actor || h.performed_by || 'Sistem'}
                      {h.result ? ` · ${h.result}` : ''}
                    </p>
                    {h.remark && <p className="wb-history-remark">"{h.remark}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          SLIDE-OVER
      ══════════════════════════════════════════════ */}
      <SlideOver
        open={!!slideOverItem}
        onClose={() => setSlideOverItem(null)}
        title={slideOverItem?.nama_item}
        subtitle={slideOverItem?.nama_group}
      >
        {slideOverItem && slideOverItem.all_activities && (
          <div className="wb-vertical-timeline" style={{ marginBottom: '24px', paddingLeft: '8px', paddingTop: '8px' }}>
            {slideOverItem.all_activities.map((act, index) => {
              const isPast = slideOverItem.next_action_mode === 'DONE' || (slideOverItem.next_activity && act.urutan < slideOverItem.next_activity.urutan);
              const isCurrent = slideOverItem.next_activity && act.id === slideOverItem.next_activity.id;
              
              return (
                <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: index === slideOverItem.all_activities.length - 1 ? '0' : '28px' }}>
                  {/* Timeline Line */}
                  {index !== slideOverItem.all_activities.length - 1 && (
                    <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '0', width: '2px', backgroundColor: isPast ? '#22c55e' : '#e2e8f0' }} />
                  )}
                  {/* Timeline Dot */}
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                    backgroundColor: isPast ? '#22c55e' : isCurrent ? '#3b82f6' : '#f8fafc',
                    color: isPast ? '#fff' : isCurrent ? '#fff' : '#94a3b8',
                    border: isCurrent ? '4px solid #dbeafe' : '2px solid #e2e8f0',
                    boxSizing: 'border-box'
                  }}>
                    {isPast ? <Check size={12} strokeWidth={3} /> : <span style={{ fontSize: '10px', fontWeight: '700' }}>{act.urutan}</span>}
                  </div>
                  {/* Timeline Content */}
                  <div style={{ paddingTop: '2px', flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: isCurrent ? '600' : '500', color: isPast ? '#334155' : isCurrent ? '#0f172a' : '#94a3b8' }}>
                      {act.nama_aktivitas}
                    </p>
                    {isCurrent && slideOverItem.next_action_mode !== 'DONE' && (
                      <div style={{ marginTop: '16px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        {slideOverItem.next_action_mode === 'REVISE' && (
                          <div className="slideover-revise-alert" style={{ marginBottom: '12px' }}>
                            <AlertTriangle size={15} />
                            <div>
                              <p className="slideover-revise-title">Revisi Diperlukan</p>
                              <p className="slideover-revise-sub">Aktivitas ini sebelumnya ditolak. Harap perbaiki dan kirim ulang.</p>
                            </div>
                          </div>
                        )}
                        <ActionFormEngine
                          jobId={job.id}
                          item={slideOverItem}
                          activity={slideOverItem.next_activity}
                          onComplete={handleActionComplete}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {slideOverItem?.next_action_mode === 'DONE' && (
          <div className="slideover-done" style={{ marginTop: '0' }}>
            <CheckCircle2 size={40} className="icon-done" />
            <p className="slideover-done-title">Item Ini Selesai</p>
            <p className="slideover-done-sub">Semua aktivitas untuk <strong>{slideOverItem.nama_item}</strong> telah selesai.</p>
          </div>
        )}
      </SlideOver>

      {/* ══════════════════════════════════════════════
          APPLE HIG CONFIRMATION DIALOG
      ══════════════════════════════════════════════ */}
      <AppleConfirmModal
        isOpen={confirmModal.isOpen}
        loading={confirmModal.submitting}
        onClose={() => !confirmModal.submitting && setConfirmModal({ isOpen: false, documentName: '', submitting: false })}
        onConfirm={executeHandoverDocument}
        eyebrow="KOMPAS EXIM • DOKUMEN OPERASIONAL"
        title={`Bagikan ${confirmModal.documentName} ke AO?`}
        message={
          <>
            Apakah Anda yakin ingin membagikan dokumen{' '}
            <strong style={{ color: 'var(--color-ink, #1d1d1f)', fontWeight: 600 }}>
              {confirmModal.documentName}
            </strong>{' '}
            ke Account Officer (AO)? Dokumen ini akan langsung tersedia di antrean operasional tim AO.
          </>
        }
        confirmText="Bagikan ke AO"
        cancelText="Batal"
        icon={<Share2 size={24} color="var(--color-primary, #0066cc)" />}
      />

      {/* ══════════════════════════════════════════════
          APPLE HIG NOTIFICATION TOAST
      ══════════════════════════════════════════════ */}
      <AppleToast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};

export default AeExecutionDesk;
