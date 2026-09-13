import React, { useEffect, useState, useMemo } from 'react';
import { useAoStore } from '../store/useAoStore';
import AoHandoverInbox from '../components/AoHandoverInbox';
import AoDocumentStagesMonitor from './Supervisor/components/AoDocumentStagesMonitor';
import CompletedShipmentsVault from './Supervisor/components/CompletedShipmentsVault';
import './Supervisor/AoControlTower.css';
import {
  LayoutDashboard, RefreshCw, AlertTriangle, Clock, CheckCircle2, Inbox,
  Users, TrendingUp, Link2, Ship, MapPin, Calendar, PackageCheck,
  ChevronRight, Star, Search, Filter, ArrowRight, UserCheck, AlertCircle, ShieldCheck, Sparkles, FileText
} from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const TOKEN = {
  canvas: 'var(--color-canvas)',
  parchment: 'var(--color-canvas-parchment)',
  hairline: 'var(--color-hairline)',
  ink: 'var(--color-ink)',
  inkMuted: 'var(--color-ink-muted-48)',
  inkMuted80: 'var(--color-ink-muted-80)',
  danger: 'var(--color-status-danger)',
  dangerBg: 'var(--color-status-danger-bg)',
  warning: 'var(--color-status-warning)',
  warningBg: 'var(--color-status-warning-bg)',
  success: 'var(--color-status-success)',
  successBg: 'var(--color-status-success-bg)',
  rounded: 'var(--rounded-lg)',
  pill: 'var(--rounded-pill)',
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const handoverStatusConfig = {
  'Not Started': { label: 'Belum Handover', color: '#6b7280', bg: '#f3f4f6' },
  'Draft Shared': { label: 'Draft Diterima', color: '#0369a1', bg: '#e0f2fe' },
  'Final Shared': { label: 'Final Diterima', color: '#0891b2', bg: '#cffafe' },
  'Completed': { label: 'Selesai', color: '#16a34a', bg: '#dcfce7' },
};
function getHandoverChip(status) {
  const c = handoverStatusConfig[status] || handoverStatusConfig['Not Started'];
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', padding: '2px 9px', borderRadius: '999px',
      backgroundColor: c.bg, color: c.color, letterSpacing: '0.02em', textTransform: 'uppercase'
    }}>{c.label}</span>
  );
}

function getEtdCountdown(etdStr) {
  if (!etdStr) return null;
  const etd = new Date(etdStr);
  const now = new Date();
  const diffMs = etd - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: '#dc2626', bg: '#fee2e2' };
  if (diffDays <= 3) return { label: `${diffDays}d remaining`, color: '#ea580c', bg: '#ffedd5' };
  if (diffDays <= 7) return { label: `${diffDays}d remaining`, color: '#ca8a04', bg: '#fef9c3' };
  return { label: `${diffDays}d remaining`, color: '#16a34a', bg: '#dcfce7' };
}

// ─── Apple Bento Glassmorphic KPI Card ─────────────────────────────────────────
const KpiCard = ({ title, value, icon, colorScheme = 'blue', subtitle, isActive, onClick, urgent, badgeText }) => {
  return (
    <div
      className={`ao-bento-card ${colorScheme} ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="ao-bento-header">
        <div className={`ao-bento-icon-plate ${colorScheme}`}>
          {React.cloneElement(icon, { size: 18, strokeWidth: 2.2 })}
        </div>
        {urgent ? (
          <span className="ao-bento-badge urgent">
            <span className={`ao-bento-pulse-dot ${colorScheme === 'purple' ? 'purple' : 'red'}`} />
            Perlu Aksi
          </span>
        ) : badgeText ? (
          <span className="ao-bento-badge warning">{badgeText}</span>
        ) : isActive ? (
          <span className="ao-bento-badge active-indicator">Aktif</span>
        ) : null}
      </div>
      <div className="ao-bento-body">
        <div className="ao-bento-value">{value}</div>
        <div className="ao-bento-title">{title}</div>
        {subtitle && <div className="ao-bento-subtitle" title={subtitle}>{subtitle}</div>}
      </div>
    </div>
  );
};

// ─── Pairing Card Component ───────────────────────────────────────────────────
const PairingCard = ({ job, aoStaffList, dscsStaffList, onPair }) => {
  const [selectedAo, setSelectedAo] = useState(job.ao_assignee_id || '');
  const [selectedDscs, setSelectedDscs] = useState(job.dscs_assignee_id || '');
  const [remarks, setRemarks] = useState(job.ao_remarks || '');
  const [dscsDueDate, setDscsDueDate] = useState(job.dscs_due_date || '');
  const [incoterm, setIncoterm] = useState(job.terms_incoterm || '');
  const [paymentTerm, setPaymentTerm] = useState(job.terms_payment || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(!job.ao_assignee_id);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setSelectedAo(job.ao_assignee_id || '');
    setSelectedDscs(job.dscs_assignee_id || '');
    setRemarks(job.ao_remarks || '');
    setDscsDueDate(job.dscs_due_date || '');
    setIncoterm(job.terms_incoterm || '');
    setPaymentTerm(job.terms_payment || '');
  }, [job.ao_assignee_id, job.dscs_assignee_id, job.ao_remarks, job.dscs_due_date, job.terms_incoterm, job.terms_payment]);

  const etdInfo = getEtdCountdown(job.etd);
  const isPaired = !!job.ao_assignee_id;

  // Fish / Marine commodity smart detection
  const isFishCommodity =
    /ikan|fish|tuna|yf|wr|loin|shrimp|udang|grouper|be |sj /i.test(job.description_goods || '') ||
    /ikan|fish|tuna|yf|wr|loin|shrimp|udang|grouper/i.test(job.product_type || '');

  // Find Erica or default specialist in DSCS staff
  const ericaStaff = dscsStaffList?.find(s => /erica/i.test(s.nama)) || dscsStaffList?.[0];

  const handleSave = async () => {
    if (!selectedAo) return;
    setSaving(true);
    try {
      await onPair(job.id, Number(selectedAo), remarks, selectedDscs ? Number(selectedDscs) : null, dscsDueDate, incoterm, paymentTerm);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setExpanded(false);
    } catch(e) {
      alert('Gagal menyimpan pairing: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddChip = (chipText) => {
    setRemarks(prev => {
      if (!prev || !prev.trim()) return chipText;
      if (prev.includes(chipText)) return prev;
      return `${prev.trim()} • ${chipText}`;
    });
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        border: `1.5px solid ${isPaired ? '#86efac' : isHovered ? '#cbd5e1' : '#e2e8f0'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-3px)' : 'none',
        boxShadow: isHovered
          ? '0 12px 28px -4px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)'
          : isPaired
            ? '0 3px 12px -2px rgba(34, 197, 94, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.02)'
            : '0 3px 12px -2px rgba(0, 0, 0, 0.04), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Accent Gradient Bar */}
      <div style={{
        height: '3.5px',
        width: '100%',
        background: isPaired
          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)'
      }} />

      {/* Card Header */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        backgroundColor: isPaired ? 'rgba(240, 253, 244, 0.5)' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '5px' }}>
              <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.01em'
              }}>
                #{job.invoice_no || job.job_code || `Job-${job.id}`}
              </span>
              {getHandoverChip(job.ae_handover_status || 'Not Started')}
              {etdInfo && (
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: etdInfo.bg,
                  color: etdInfo.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                  <Clock size={10} />
                  ETD {etdInfo.label}
                </span>
              )}
            </div>

            <div style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={job.buyer || ''}>
              {job.buyer || '—'}
            </div>
          </div>

          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: expanded ? '#f1f5f9' : (isPaired ? '#f8fafc' : '#eff6ff'),
              border: `1px solid ${expanded ? '#cbd5e1' : (isPaired ? '#e2e8f0' : '#bfdbfe')}`,
              cursor: 'pointer',
              padding: '6px 11px',
              borderRadius: '8px',
              color: expanded ? '#475569' : (isPaired ? '#334155' : '#1d4ed8'),
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11.5px',
              fontWeight: '700',
              flexShrink: 0,
              boxShadow: expanded ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            {expanded ? 'Tutup' : (isPaired ? 'Ubah' : 'Cocokkan')}
            <ChevronRight size={13} style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      {/* Smart Advisory: Marine / Fish Commodity Callout */}
      {isFishCommodity && (
        <div style={{
          margin: '10px 18px 2px',
          padding: '10px 12px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.95), rgba(224, 242, 254, 0.7))',
          border: '1px solid rgba(186, 230, 253, 0.9)',
          boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '18px', lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}>🐟</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369a1', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Komoditas Hasil Laut
                <span style={{ fontSize: '9px', fontWeight: '800', background: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: '999px', textTransform: 'uppercase' }}>DSCS</span>
              </div>
              <div style={{ fontSize: '11px', color: '#0c4a6e', opacity: 0.85, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Disarankan assign PIC DSCS untuk sertifikasi mutu / HC.
              </div>
            </div>
          </div>

          {ericaStaff && String(selectedDscs) !== String(ericaStaff.id) ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDscs(String(ericaStaff.id));
                if (!expanded) setExpanded(true);
              }}
              style={{
                flexShrink: 0,
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#0284c7',
                backgroundColor: '#ffffff',
                border: '1px solid #7dd3fc',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(3, 105, 161, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
              title="Pilih Erica langsung sebagai PIC DSCS"
            >
              <Sparkles size={11} color="#0284c7" />
              Pilih Erica
            </button>
          ) : ericaStaff && String(selectedDscs) === String(ericaStaff.id) ? (
            <span style={{
              flexShrink: 0,
              padding: '3px 8px',
              fontSize: '10.5px',
              fontWeight: '700',
              color: '#0369a1',
              backgroundColor: '#e0f2fe',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ✓ DSCS Aktif
            </span>
          ) : null}
        </div>
      )}

      {/* Shipment Info Bento Grid */}
      <div style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px' }}>
        <InfoRow icon={<MapPin size={13} />} label="Tujuan" value={job.destination || '—'} />
        <InfoRow icon={<Ship size={13} />} label="Kapal / Liner" value={[job.vessel, job.liner].filter(Boolean).join(' · ') || '—'} />
        <InfoRow icon={<Calendar size={13} />} label="ETD" value={job.etd ? new Date(job.etd).toLocaleDateString('id-ID') : '—'} />
        <InfoRow icon={<PackageCheck size={13} />} label="Volume" value={job.container_qty ? `${job.container_qty} Container` : '—'} />
      </div>

      {/* Handover Workflow Bridge (AE ➔ AO & DSCS) */}
      <div style={{
        margin: '0 18px 14px',
        padding: '10px 12px',
        borderRadius: '12px',
        backgroundColor: isPaired ? 'rgba(240, 253, 244, 0.6)' : 'rgba(248, 250, 252, 0.85)',
        border: isPaired ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '7px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
            Alur Penugasan Staf
          </span>
          <span style={{
            fontSize: '10.5px',
            fontWeight: '600',
            color: isPaired ? '#15803d' : '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isPaired ? (
              <>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                Tim Lengkap & Siap
              </>
            ) : (
              <>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                Menunggu AO
              </>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Staf AE Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '999px',
            backgroundColor: '#ede9fe',
            border: '1px solid #ddd6fe',
            color: '#5b21b6',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            <span style={{ fontSize: '8.5px', fontWeight: '800', backgroundColor: '#8b5cf6', color: '#fff', padding: '1px 5px', borderRadius: '999px' }}>AE</span>
            <span>{job.ae_assignee_name || '—'}</span>
            <span style={{ opacity: 0.65, fontSize: '10px' }}>({job.ae_employee_id || 'AE'})</span>
          </div>

          <ArrowRight size={12} color="#94a3b8" />

          {/* Staf AO Badge */}
          {job.ao_assignee_id ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '999px',
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              color: '#15803d',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              <span style={{ fontSize: '8.5px', fontWeight: '800', backgroundColor: '#22c55e', color: '#fff', padding: '1px 5px', borderRadius: '999px' }}>AO</span>
              <span>{job.ao_assignee_name}</span>
              <span style={{ opacity: 0.65, fontSize: '10px' }}>({job.ao_employee_id || 'AO'})</span>
            </div>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 9px',
              borderRadius: '999px',
              backgroundColor: '#fef3c7',
              border: '1px dashed #fcd34d',
              color: '#b45309',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              Belum Dicocokkan
            </span>
          )}

          {/* DSCS Specialist Badge (if assigned) */}
          {job.dscs_assignee_id && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '999px',
              backgroundColor: '#e0f2fe',
              border: '1px solid #7dd3fc',
              color: '#0369a1',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              <ShieldCheck size={12} />
              <span style={{ fontSize: '8.5px', fontWeight: '800', backgroundColor: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: '999px' }}>DSCS</span>
              <span>{job.dscs_assignee_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pairing Controls Form — when expanded */}
      {expanded && (
        <div style={{
          padding: '16px 18px',
          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
          backgroundColor: '#fafbfc',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* AO Staff Selection with Workload Indicator */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={12} color="#3b82f6" />
                Pilih Staf AO Pendamping
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>Wajib diisi</span>
            </div>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedAo}
                onChange={e => setSelectedAo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 32px 9px 12px',
                  borderRadius: '10px',
                  border: selectedAo ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '14px',
                }}
              >
                <option value="">— Pilih Staf AO —</option>
                {aoStaffList.map(staff => {
                  const tasks = Number(staff.active_tasks || 0);
                  const loadIndicator = tasks <= 2 ? '🟢' : tasks <= 5 ? '🟡' : '🔴';
                  const loadText = tasks <= 2 ? 'Kapasitas Siap' : tasks <= 5 ? 'Beban Sedang' : 'Beban Padat';
                  return (
                    <option key={staff.id} value={staff.id}>
                      {loadIndicator} {staff.nama} ({staff.employee_id}) — {tasks} tugas ({loadText})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* DSCS Staff Selection */}
          <div style={{
            padding: '10px 12px',
            borderRadius: '12px',
            backgroundColor: isFishCommodity ? 'rgba(240, 249, 255, 0.7)' : '#ffffff',
            border: isFishCommodity ? '1px solid #bae6fd' : '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: isFishCommodity ? '#0369a1' : '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={13} color={isFishCommodity ? '#0284c7' : '#64748b'} />
                PIC DSCS (Opsional — Jika Butuh Dokumen DSCS)
              </label>
              {isFishCommodity && (
                <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '1px 6px', borderRadius: '6px' }}>
                  Disarankan
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedDscs}
                onChange={e => setSelectedDscs(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 12px',
                  borderRadius: '10px',
                  border: selectedDscs ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '14px',
                }}
              >
                <option value="">— Tidak Memerlukan DSCS —</option>
                {dscsStaffList && dscsStaffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    🛡️ {staff.nama} ({staff.employee_id}) — Spesialis Dokumen DSCS
                  </option>
                ))}
              </select>
            </div>
            
            {selectedDscs && (
              <div style={{ marginTop: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Target Due Date DSCS</label>
                <input
                  type="date"
                  value={dscsDueDate}
                  onChange={e => setDscsDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Terms SO (Incoterm & Payment Terms) */}
          <div style={{
            padding: '10px 12px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={13} color="#64748b" />
                Setting Terms SO (Opsional)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Incoterms</label>
                <input
                  type="text"
                  placeholder="FOB, CIF..."
                  value={incoterm}
                  onChange={e => setIncoterm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Payment Terms</label>
                <input
                  type="text"
                  placeholder="LC, TT..."
                  value={paymentTerm}
                  onChange={e => setPaymentTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Remarks with quick template chips */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Catatan Instruksi (Opsional)
              </label>
            </div>

            {/* Quick template chips */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {[
                'Pantau Draft BL',
                'Koordinasi LC Bank',
                'Cek DSCS Hasil Laut',
                'Prioritas Closing Dekat'
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAddChip(chip)}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: '600',
                    color: '#475569',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                >
                  + {chip}
                </button>
              ))}
            </div>

            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Contoh: Koordinasi LC & follow-up draft BL dengan Bank BCA cabang Denpasar..."
              rows={2}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={e => { e.target.style.borderColor = '#cbd5e1'; }}
            />
          </div>

          {/* Action Save Button */}
          <button
            onClick={handleSave}
            disabled={!selectedAo || saving}
            style={{
              marginTop: '4px',
              padding: '11px 18px',
              borderRadius: '11px',
              border: 'none',
              cursor: selectedAo && !saving ? 'pointer' : 'not-allowed',
              background: saved
                ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                : (!selectedAo
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'),
              color: '#fff',
              fontSize: '13.5px',
              fontWeight: '700',
              opacity: selectedAo && !saving ? 1 : 0.65,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              boxShadow: selectedAo && !saving ? '0 4px 14px rgba(37, 99, 235, 0.28)' : 'none'
            }}
          >
            {saving ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Menyimpan Pairing...</span>
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={16} />
                <span>Pairing Berhasil Disimpan!</span>
              </>
            ) : (
              <>
                <Link2 size={15} />
                <span>Simpan Pairing</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      backgroundColor: '#f8fafc',
      borderRadius: '10px',
      padding: '7px 10px',
      border: '1px solid #f1f5f9',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: 0,
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
        flexShrink: 0,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ fontSize: '11.5px', color: '#0f172a', fontWeight: '600', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(value)}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

// ─── Main SupervisorDashboard ──────────────────────────────────────────────────
const SupervisorDashboard = () => {
  const {
    kpiSummary,
    workloadMatrix,
    unassignedJobs,
    incomingHandovers,
    pairingJobs,
    aoStaffList,
    dscsStaffList,
    fetchSupervisorData,
    assignTask,
    acceptHandover,
    pairStaffAo,
    isLoading,
    error
  } = useAoStore();

  const [taskDueDates, setTaskDueDates] = useState({});
  const [pairingFilter, setPairingFilter] = useState('all'); // 'all' | 'unpaired' | 'paired'
  const [pairingSearch, setPairingSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pairing'); // 'pairing' | 'handovers' | 'tasks'

  useEffect(() => {
    fetchSupervisorData();
  }, [fetchSupervisorData]);

  const handleDateChange = (taskId, dateStr) => {
    setTaskDueDates(prev => ({ ...prev, [taskId]: dateStr }));
  };

  const handleAssign = (taskId, staffId) => {
    if (staffId) {
      assignTask(taskId, staffId, taskDueDates[taskId]);
    }
  };

  // Filtered pairing jobs
  const filteredPairingJobs = useMemo(() => {
    let list = pairingJobs || [];
    if (pairingFilter === 'unpaired') list = list.filter(j => !j.ao_assignee_id);
    if (pairingFilter === 'paired') list = list.filter(j => !!j.ao_assignee_id);
    if (pairingSearch.trim()) {
      const q = pairingSearch.toLowerCase();
      list = list.filter(j =>
        (j.invoice_no || '').toLowerCase().includes(q) ||
        (j.buyer || '').toLowerCase().includes(q) ||
        (j.vessel || '').toLowerCase().includes(q) ||
        (j.ae_assignee_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [pairingJobs, pairingFilter, pairingSearch]);

  if (isLoading && !pairingJobs.length && !workloadMatrix.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: TOKEN.inkMuted }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px' }}>Memuat AO Control Tower...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px', backgroundColor: TOKEN.dangerBg, borderRadius: TOKEN.rounded, margin: '24px', border: `1px solid ${TOKEN.danger}` }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: TOKEN.danger }}>
          <AlertCircle size={18} />
          <span style={{ fontWeight: '600' }}>Error memuat data:</span>
        </div>
        <pre style={{ fontSize: '12px', marginTop: '8px', color: TOKEN.danger, whiteSpace: 'pre-wrap' }}>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: TOKEN.parchment }}>

      {/* ── PAGE HEADER ── */}
      <div style={{
        padding: '24px 32px 20px',
        backgroundColor: TOKEN.canvas,
        borderBottom: `1px solid ${TOKEN.hairline}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <LayoutDashboard size={22} style={{ color: '#1d4ed8' }} />
              <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.4px', margin: 0, color: TOKEN.ink }}>
                AO Control Tower
              </h1>
              {kpiSummary.unpaired > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#fff3cd', color: '#92400e', border: '1px solid #fbbf24' }}>
                  {kpiSummary.unpaired} invoice perlu dicocokkan
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: TOKEN.inkMuted, margin: 0 }}>
              Pusat kendali pencocokan Staf AE ↔ Staf AO · Monitoring Handover & Distribusi Beban Kerja
            </p>
          </div>
          <button
            onClick={() => fetchSupervisorData()}
            disabled={isLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', borderRadius: TOKEN.pill,
              border: `1px solid ${TOKEN.hairline}`,
              backgroundColor: TOKEN.canvas, color: TOKEN.ink,
              fontSize: '13px', fontWeight: '500', cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <RefreshCw size={14} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* KPI CARDS — Apple Bento Glassmorphic 6 Metrics */}
        <div className="ao-bento-grid">
          <KpiCard
            title="Perlu Dicocokkan"
            value={kpiSummary.unpaired}
            icon={<Link2 />}
            colorScheme="purple"
            subtitle="Invoice AE belum di-pair ke AO"
            urgent={kpiSummary.unpaired > 0}
            isActive={activeTab === 'pairing' && pairingFilter === 'unpaired'}
            onClick={() => {
              setActiveTab('pairing');
              setPairingFilter(prev => prev === 'unpaired' ? 'all' : 'unpaired');
            }}
          />
          <KpiCard
            title="Handover Masuk"
            value={kpiSummary.incoming}
            icon={<Inbox />}
            colorScheme="blue"
            subtitle="Menunggu penerimaan"
            badgeText={kpiSummary.incoming > 0 ? `${kpiSummary.incoming} Baru` : null}
            isActive={activeTab === 'handovers'}
            onClick={() => setActiveTab('handovers')}
          />
          <KpiCard
            title="Overdue / Blocked"
            value={kpiSummary.overdue}
            icon={<AlertTriangle />}
            colorScheme="red"
            subtitle="Tugas melewati batas waktu"
            urgent={kpiSummary.overdue > 0}
            isActive={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
          />
          <KpiCard
            title="Due Today"
            value={kpiSummary.dueToday}
            icon={<Clock />}
            colorScheme="orange"
            subtitle="Jatuh tempo hari ini"
            badgeText={kpiSummary.dueToday > 0 ? 'Hari Ini' : null}
          />
          <KpiCard
            title="Waiting"
            value={kpiSummary.waiting}
            icon={<TrendingUp />}
            colorScheme="yellow"
            subtitle="Menunggu aksi upstream"
          />
          <KpiCard
            title="Completed"
            value={kpiSummary.completed}
            icon={<CheckCircle2 />}
            colorScheme="green"
            subtitle="Tugas selesai dikerjakan"
          />
        </div>

        {/* ── TAB NAVIGATION ── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${TOKEN.hairline}`, gap: '0' }}>
          {[
            { id: 'pairing', label: `Pusat Pencocokan Staf (${pairingJobs.length})`, icon: <Link2 size={14} /> },
            { id: 'handovers', label: `Buku Ekspedisi Masuk (${incomingHandovers.length})`, icon: <Inbox size={14} /> },
            { id: 'tasks', label: `Monitoring 5 Tahapan Dokumen`, icon: <FileText size={14} /> },
            { id: 'completed', label: `Completed Vault`, icon: <CheckCircle2 size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #1d4ed8' : '2px solid transparent',
                background: 'none', cursor: 'pointer', fontSize: '13px',
                fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? '#1d4ed8' : TOKEN.inkMuted80,
                transition: 'all 0.15s',
                marginBottom: '-1px',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT: PAIRING CENTER ── */}
        {activeTab === 'pairing' && (
          <div>
            {/* Controls bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: TOKEN.inkMuted }} />
                <input
                  type="text"
                  placeholder="Cari Invoice, Buyer, Kapal, Staf AE..."
                  value={pairingSearch}
                  onChange={e => setPairingSearch(e.target.value)}
                  style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', border: `1px solid ${TOKEN.hairline}`, fontSize: '13px', backgroundColor: TOKEN.canvas, color: TOKEN.ink, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              {/* Filter chips */}
              {[['all', 'Semua'], ['unpaired', `Perlu Dicocokkan (${pairingJobs.filter(j => !j.ao_assignee_id).length})`], ['paired', `Sudah Dipasangkan (${pairingJobs.filter(j => !!j.ao_assignee_id).length})`]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPairingFilter(val)}
                  style={{
                    padding: '7px 16px', borderRadius: '999px', border: `1px solid ${pairingFilter === val ? '#1d4ed8' : TOKEN.hairline}`,
                    backgroundColor: pairingFilter === val ? '#dbeafe' : TOKEN.canvas,
                    color: pairingFilter === val ? '#1d4ed8' : TOKEN.inkMuted80,
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredPairingJobs.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 24px', backgroundColor: TOKEN.canvas,
                borderRadius: TOKEN.rounded, border: `1px dashed ${TOKEN.hairline}`, color: TOKEN.inkMuted
              }}>
                <Link2 size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <div style={{ fontSize: '15px', fontWeight: '600', color: TOKEN.inkMuted80 }}>Tidak ada invoice yang cocok</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Coba ubah filter atau kata kunci pencarian.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {filteredPairingJobs.map(job => (
                  <PairingCard
                    key={job.id}
                    job={job}
                    aoStaffList={aoStaffList}
                    dscsStaffList={dscsStaffList}
                    onPair={pairStaffAo}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: INCOMING HANDOVERS ── */}
        {activeTab === 'handovers' && <AoHandoverInbox />}

        {/* ── TAB CONTENT: TASK POOL (now Stages Monitor) ── */}
        {activeTab === 'tasks' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px', margin: '0 0 12px', color: TOKEN.ink, display: 'flex', alignItems: 'center', gap: '7px' }}>
                <FileText size={16} /> Monitoring 5 Tahapan Dokumen AO
              </h2>
              <AoDocumentStagesMonitor />
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: COMPLETED VAULT ── */}
        {activeTab === 'completed' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px', margin: '0 0 12px', color: TOKEN.ink, display: 'flex', alignItems: 'center', gap: '7px' }}>
                <CheckCircle2 size={16} /> Penampung Shipment Selesai
              </h2>
              <CompletedShipmentsVault />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SupervisorDashboard;
