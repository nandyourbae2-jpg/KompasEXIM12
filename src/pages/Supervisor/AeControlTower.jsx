import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Users, FileText, AlertCircle, Clock, Trash2, Settings, X, Save,
  Check, AlertTriangle, Layers, Calendar
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useAeSettingsStore from '../../store/useAeSettingsStore';
import AeAssignmentModal from './components/AeAssignmentModal';
import AppleConfirmModal from '../../components/AppleConfirmModal';
import AppleToast from '../../components/AppleToast';
import { sortAndGroupAEJobs, markVesselGrouping, getWeekSegment, getUrgencyLevel } from '../../utils/aeWorkboardSort';
import './AeControlTower.css';

const getGroupPct = (job, groupKey) => {
  if (!job.job_checklist_group_progress) return 0;
  try {
    const parsed = JSON.parse(job.job_checklist_group_progress);
    return parsed[groupKey] || 0;
  } catch(e) {
    return 0;
  }
};

/**
 * GroupStatusCell — Apple HIG micro indicator
 */
const GroupStatusCell = ({ pct }) => {
  if (pct === 100) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          backgroundColor: 'rgba(52, 199, 89, 0.12)',
          color: '#34c759',
        }}
        title="100% Selesai"
      >
        <Check size={12} strokeWidth={2.8} />
      </span>
    );
  }
  if (pct > 0) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px 7px',
          borderRadius: 'var(--rounded-pill, 9999px)',
          backgroundColor: 'rgba(0, 102, 204, 0.08)',
          color: 'var(--color-primary, #0066cc)',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '-0.2px',
        }}
        title={`${pct}% Berjalan`}
      >
        {pct}%
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: '#d2d2d7',
      }}
      title="Belum Dimulai"
    />
  );
};

const AeControlTower = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const token = user?.token;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Match Review state
  const [matchReviewsCount, setMatchReviewsCount] = useState(0);
  const [matchReviewsError, setMatchReviewsError] = useState(false);
  
  // Filtering state
  const [filterMode, setFilterMode] = useState('All'); // 'All', 'Unassigned', 'Blocked', 'Overdue', 'Critical', 'At Risk'
  const [weekSegment, setWeekSegment] = useState('midweek');

  // Modals & Apple Toasts
  const [showWipeDialog, setShowWipeDialog] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, type: 'success', message: '' });

  // Settings Popover State
  const { midweekDays, isLoading: isSettingsLoading, fetchSettings, saveSettings } = useAeSettingsStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localMidweekDays, setLocalMidweekDays] = useState([]);
  const settingsRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSettings = () => {
    setLocalMidweekDays([...midweekDays]);
    setIsSettingsOpen(true);
  };

  const toggleDay = (dayIndex) => {
    setLocalMidweekDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex]
    );
  };

  const showToast = (type, message) => {
    setToast({ isOpen: true, type, message });
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings(localMidweekDays);
      showToast('success', 'Pengaturan hari operasional berhasil disimpan.');
      setIsSettingsOpen(false);
    } catch (err) {
      showToast('error', 'Gagal menyimpan pengaturan: ' + err.message);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Gagal memuat jobs');
      setJobs(json.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/source/match-reviews?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) {
        setMatchReviewsError(true);
        return;
      }
      setMatchReviewsCount(json.data ? json.data.length : 0);
      setMatchReviewsError(false);
    } catch (err) {
      setMatchReviewsError(true);
    }
  };

  const executeWipeAll = async () => {
    setShowWipeDialog(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/source/dev/wipe-all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      showToast('success', json.message || 'Semua data telah direset');
      fetchJobs();
      fetchMatchReviews();
    } catch (err) {
      showToast('error', "Gagal menghapus data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMatchReviews();
  }, [token]);

  // KPIs
  const kpis = useMemo(() => {
    const unassigned = jobs.filter(j => !j.ae_assignee_id).length;
    const completed = jobs.filter(j => j.ae_status === 'Completed').length;
    
    const overdue = jobs.filter(j => j.priority === 'OVERDUE').length;
    const critical = jobs.filter(j => j.priority === 'CRITICAL').length;
    const atRisk = jobs.filter(j => j.priority === 'AT RISK').length;
    const blocked = jobs.filter(j => j.blocker).length;

    return { total: jobs.length, unassigned, completed, overdue, critical, atRisk, blocked };
  }, [jobs]);

  // Filtered jobs
  const { groupedComplete, incomplete } = useMemo(() => {
    let filtered = jobs.filter(job => {
      if (filterMode === 'Unassigned') return !job.ae_assignee_id;
      if (filterMode === 'Blocked') return job.blocker;
      if (filterMode === 'Overdue') return job.priority === 'OVERDUE';
      if (filterMode === 'Critical') return job.priority === 'CRITICAL';
      if (filterMode === 'At Risk') return job.priority === 'AT RISK';
      return true;
    });

    const segmented = filtered.filter(j => getWeekSegment(j.closing_docs, midweekDays) === weekSegment);
    const { complete, incomplete: inc } = sortAndGroupAEJobs(segmented);
    const groupedComplete = markVesselGrouping(complete);

    return { groupedComplete, incomplete: inc };
  }, [jobs, filterMode, weekSegment, midweekDays]);

  const displayedJobs = groupedComplete;

  return (
    <div className="ae-control-tower">
      {/* ── MATCH REVIEWS NOTICE BANNER ── */}
      {matchReviewsError ? (
        <div style={{
          backgroundColor: 'rgba(255, 59, 48, 0.06)',
          border: '1px solid rgba(255, 59, 48, 0.2)',
          padding: '12px 18px',
          borderRadius: '14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--color-status-danger, #ff3b30)',
        }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Kendala sinkronisasi Source Match Reviews.</span>
        </div>
      ) : matchReviewsCount > 0 ? (
        <div className="act-review-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b45309' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(255, 149, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertCircle size={17} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink, #1d1d1f)' }}>
                Terdapat {matchReviewsCount} Data Ambigu Memerlukan Review
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48, #7a7a7a)' }}>
                Baris Log Schedule belum memiliki nomor BC atau identitas unik lengkap.
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/workspace/supervisor/match-review')}
            style={{
              backgroundColor: 'var(--color-primary, #0066cc)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 'var(--rounded-pill, 9999px)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.1s ease',
              fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, sans-serif)',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Review Sekarang
          </button>
        </div>
      ) : null}

      {/* ── HEADER ── */}
      <div className="act-header">
        <div>
          <div className="act-eyebrow">KOMPAS EXIM • ADMINISTRASI EXPORT</div>
          <h1 className="act-title">AE Control Tower</h1>
          <p className="act-subtitle">Monitor beban kerja tim, delegasikan penugasan, dan lacak performa pipeline ekspor secara real-time.</p>
        </div>
        <div className="act-header-actions">
          {/* Subtle Dev Reset Button */}
          <button 
            type="button"
            onClick={() => setShowWipeDialog(true)} 
            disabled={loading}
            className="act-btn-dev-reset"
            title="Utilitas Developer untuk reset pipeline pengujian"
          >
            <Trash2 size={13} />
            <span>Reset Pipeline (Dev)</span>
          </button>

          {/* Primary Refresh Button */}
          <button 
            type="button"
            className="act-btn-refresh" 
            onClick={fetchJobs} 
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Memuat…' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI WIDGET GRID (APPLE HIG) ── */}
      <div className="act-kpi-grid">
        {/* 1. Unassigned */}
        <div 
          className="act-kpi-card" 
          onClick={() => setFilterMode(filterMode === 'Unassigned' ? 'All' : 'Unassigned')} 
          data-active={filterMode === 'Unassigned'}
        >
          <div className="act-kpi-header">
            <div className="act-kpi-icon-plate orange"><AlertCircle size={18} /></div>
            {filterMode === 'Unassigned' && <div className="act-kpi-card-active-dot" />}
          </div>
          <div>
            <div className="act-kpi-value">{kpis.unassigned}</div>
            <div className="act-kpi-label">Unassigned</div>
          </div>
        </div>

        {/* 2. Blocked */}
        <div 
          className="act-kpi-card" 
          onClick={() => setFilterMode(filterMode === 'Blocked' ? 'All' : 'Blocked')} 
          data-active={filterMode === 'Blocked'}
        >
          <div className="act-kpi-header">
            <div className="act-kpi-icon-plate red"><AlertTriangle size={18} /></div>
            {filterMode === 'Blocked' && <div className="act-kpi-card-active-dot" />}
          </div>
          <div>
            <div className="act-kpi-value">{kpis.blocked}</div>
            <div className="act-kpi-label">Blocked</div>
          </div>
        </div>

        {/* 3. Overdue */}
        <div 
          className="act-kpi-card" 
          onClick={() => setFilterMode(filterMode === 'Overdue' ? 'All' : 'Overdue')} 
          data-active={filterMode === 'Overdue'}
        >
          <div className="act-kpi-header">
            <div className="act-kpi-icon-plate red"><Clock size={18} /></div>
            {filterMode === 'Overdue' && <div className="act-kpi-card-active-dot" />}
          </div>
          <div>
            <div className="act-kpi-value">{kpis.overdue}</div>
            <div className="act-kpi-label">Overdue</div>
          </div>
        </div>

        {/* 4. Critical (<24h) */}
        <div 
          className="act-kpi-card" 
          onClick={() => setFilterMode(filterMode === 'Critical' ? 'All' : 'Critical')} 
          data-active={filterMode === 'Critical'}
        >
          <div className="act-kpi-header">
            <div className="act-kpi-icon-plate orange"><Clock size={18} /></div>
            {filterMode === 'Critical' && <div className="act-kpi-card-active-dot" />}
          </div>
          <div>
            <div className="act-kpi-value">{kpis.critical}</div>
            <div className="act-kpi-label">Critical (&lt;24h)</div>
          </div>
        </div>

        {/* 5. At Risk (<48h) */}
        <div 
          className="act-kpi-card" 
          onClick={() => setFilterMode(filterMode === 'At Risk' ? 'All' : 'At Risk')} 
          data-active={filterMode === 'At Risk'}
        >
          <div className="act-kpi-header">
            <div className="act-kpi-icon-plate purple"><Clock size={18} /></div>
            {filterMode === 'At Risk' && <div className="act-kpi-card-active-dot" />}
          </div>
          <div>
            <div className="act-kpi-value">{kpis.atRisk}</div>
            <div className="act-kpi-label">At Risk (&lt;48h)</div>
          </div>
        </div>

        {/* 6. Total Jobs */}
        <div 
          className="act-kpi-card" 
          onClick={() => setFilterMode('All')} 
          data-active={filterMode === 'All'}
        >
          <div className="act-kpi-header">
            <div className="act-kpi-icon-plate blue"><FileText size={18} /></div>
            {filterMode === 'All' && <div className="act-kpi-card-active-dot" />}
          </div>
          <div>
            <div className="act-kpi-value">{kpis.total}</div>
            <div className="act-kpi-label">Total Jobs</div>
          </div>
        </div>
      </div>

      {/* ── CONTROLS ROW (APPLE SEGMENTED & SETTINGS) ── */}
      <div className="act-controls-row">
        {/* Apple Segmented Control */}
        <div className="act-segmented-track">
          <button
            type="button"
            onClick={() => setWeekSegment('midweek')}
            className="act-segmented-btn"
            data-active={weekSegment === 'midweek'}
          >
            Mid Week
          </button>
          <button
            type="button"
            onClick={() => setWeekSegment('endweek')}
            className="act-segmented-btn"
            data-active={weekSegment === 'endweek'}
          >
            End Week
          </button>
        </div>

        {/* Pengaturan Kalender Popover Trigger */}
        <div style={{ position: 'relative' }} ref={settingsRef}>
          <button 
            type="button"
            onClick={openSettings}
            style={{ 
              backgroundColor: 'var(--color-canvas, #ffffff)', 
              border: '1px solid var(--color-hairline, #e0e0e0)', 
              borderRadius: 'var(--rounded-pill, 9999px)', 
              padding: '7px 16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: 'var(--color-ink, #1d1d1f)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, sans-serif)',
              transition: 'transform 0.1s ease, background-color 0.15s',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Calendar size={14} color="var(--color-ink-muted-48, #7a7a7a)" />
            <span>Pengaturan Kalender</span>
          </button>
          
          {isSettingsOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              zIndex: 50,
              padding: '18px',
              animation: 'actFadeIn 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-divider-soft, #f0f0f0)', paddingBottom: '12px', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-ink, #1d1d1f)' }}>Midweek Days</h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted-48)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={15} />
                </button>
              </div>
              
              <p style={{ fontSize: '12px', color: 'var(--color-ink-muted-80, #64748b)', marginBottom: '14px', lineHeight: 1.45 }}>
                Pilih hari operasional yang dihitung sebagai <b>Midweek</b>. Hari yang tidak dipilih otomatis dihitung sebagai <b>Endweek</b>.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {[
                  { id: 1, name: 'Senin' },
                  { id: 2, name: 'Selasa' },
                  { id: 3, name: 'Rabu' },
                  { id: 4, name: 'Kamis' },
                  { id: 5, name: 'Jumat' },
                  { id: 6, name: 'Sabtu' },
                  { id: 0, name: 'Minggu' }
                ].map(day => (
                  <label key={day.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-ink, #1d1d1f)' }}>
                    <input 
                      type="checkbox" 
                      checked={localMidweekDays.includes(day.id)}
                      onChange={() => toggleDay(day.id)}
                      style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary, #0066cc)', cursor: 'pointer' }}
                    />
                    {day.name}
                  </label>
                ))}
              </div>
              
              <button 
                onClick={handleSaveSettings}
                disabled={isSettingsLoading}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-primary, #0066cc)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 0',
                  borderRadius: 'var(--rounded-pill, 9999px)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isSettingsLoading ? 'not-allowed' : 'pointer',
                  opacity: isSettingsLoading ? 0.7 : 1,
                  transition: 'transform 0.1s ease',
                }}
                onMouseDown={(e) => !isSettingsLoading && (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={(e) => !isSettingsLoading && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isSettingsLoading ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                <span>{isSettingsLoading ? 'Menyimpan…' : 'Simpan Pengaturan'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── WORKLOAD TABLE (MUSEUM GALLERY GRADE) ── */}
      <div className="act-table-container">
        <div className="act-table-header">
          <h2>
            <span>Job Pipeline</span>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-ink-muted-48, #7a7a7a)',
              backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)',
              padding: '2px 8px',
              borderRadius: 'var(--rounded-pill, 9999px)',
            }}>
              {filterMode} ({displayedJobs.length})
            </span>
          </h2>
        </div>
        
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
            <div className="spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid rgba(0,102,204,0.2)', borderTopColor: 'var(--color-primary, #0066cc)', borderRadius: '50%', marginBottom: '12px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Memuat daftar pekerjaan…</p>
          </div>
        ) : (
          <div className="act-table-scroll">
            <table className="act-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Business Identity</th>
                  <th style={{ width: '18%' }}>Closing Schedule</th>
                  <th style={{ textAlign: 'center', width: '8%' }}>Prep</th>
                  <th style={{ textAlign: 'center', width: '8%' }}>Soft</th>
                  <th style={{ textAlign: 'center', width: '8%' }}>Final</th>
                  <th style={{ textAlign: 'center', width: '8%' }}>Draft</th>
                  <th style={{ textAlign: 'center', width: '8%' }}>Ori</th>
                  <th style={{ width: '14%' }}>AE Assignee</th>
                  <th style={{ width: '6%', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-status-danger)' }}>
                      <AlertCircle size={28} style={{ margin: '0 auto 10px', display: 'block' }} />
                      Data Control Tower gagal dimuat: {error}
                    </td>
                  </tr>
                ) : displayedJobs.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-ink-muted-48)' }}>
                      {filterMode === 'All' ? 'Belum ada pekerjaan AE aktif.' : 'Tidak ada pekerjaan untuk kriteria filter ini.'}
                    </td>
                  </tr>
                ) : (
                  displayedJobs.map(job => (
                    <tr 
                      key={job.id} 
                      className={`urgency-${getUrgencyLevel(job)} ${job.isGroupedWithPrevious ? 'vessel-grouped' : ''}`}
                    >
                      {/* Business Identity */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-ink, #1d1d1f)', fontSize: '14px', letterSpacing: '-0.2px' }}>
                          {job.invoice_no || '-'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48, #7a7a7a)', marginTop: '2px' }}>
                          {job.buyer || '-'} {job.destination ? `• ${job.destination}` : ''}
                        </div>
                      </td>

                      {/* Closing Schedule */}
                      <td>
                        <div style={{ 
                          fontWeight: 500, 
                          color: !job.closing_docs ? 'var(--color-status-danger, #ff3b30)' : 'var(--color-ink, #1d1d1f)', 
                          fontSize: '13px' 
                        }}>
                          {job.closing_docs || 'MISSING'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48, #7a7a7a)', marginTop: '2px' }}>
                          ETD: {job.etd || '-'}
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <span className={`act-status-tag ${
                            job.priority === 'CRITICAL' || job.priority === 'OVERDUE'
                              ? 'overdue'
                              : job.priority === 'AT RISK'
                              ? 'at-risk'
                              : 'normal'
                          }`}>
                            {job.priority || '-'}
                          </span>
                        </div>
                      </td>
                      
                      {/* Milestones */}
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'DOCUMENT PREPARATION')} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'SOFT COPY DOCUMENT')} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'FINAL DATA')} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'DRAFT DOCUMENT')} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'ORIGINAL DOCUMENT')} />
                      </td>

                      {/* AE Assignee */}
                      <td>
                        {job.ae_assignee_name ? (
                          <span className="act-assignee-pill assigned">
                            <Users size={12} />
                            <span>{job.ae_assignee_name}</span>
                          </span>
                        ) : (
                          <span className="act-assignee-pill unassigned">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button"
                          className={`act-btn-assign ${job.ae_assignee_id ? 'is-assigned' : 'is-unassigned'}`}
                          onClick={() => setSelectedJob(job)}
                        >
                          {job.ae_assignee_id ? 'Reassign' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── INCOMPLETE SECTION ── */}
      {incomplete.length > 0 && (
        <div className="incomplete-section">
          <div className="act-table-container">
            <div className="act-table-header">
              <h2>
                <span>Data Belum Lengkap (Pending Source)</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-status-warning, #ff9500)',
                  backgroundColor: 'rgba(255, 149, 0, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 'var(--rounded-pill, 9999px)',
                }}>
                  {incomplete.length}
                </span>
              </h2>
            </div>
            <div className="act-table-scroll">
              <table className="act-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Business Identity</th>
                    <th style={{ width: '18%' }}>Closing Schedule</th>
                    <th style={{ textAlign: 'center', width: '8%' }}>Prep</th>
                    <th style={{ textAlign: 'center', width: '8%' }}>Soft</th>
                    <th style={{ textAlign: 'center', width: '8%' }}>Final</th>
                    <th style={{ textAlign: 'center', width: '8%' }}>Draft</th>
                    <th style={{ textAlign: 'center', width: '8%' }}>Ori</th>
                    <th style={{ width: '14%' }}>AE Assignee</th>
                    <th style={{ width: '6%', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {incomplete.map(job => (
                    <tr key={job.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-ink, #1d1d1f)', fontSize: '14px' }}>
                          {job.invoice_no || '-'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '2px' }}>
                          {job.buyer || '-'} {job.destination ? `• ${job.destination}` : ''}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          color: '#b45309',
                          backgroundColor: 'rgba(255, 149, 0, 0.1)',
                          padding: '3px 8px',
                          borderRadius: 'var(--rounded-pill, 9999px)',
                          fontWeight: 500
                        }}>
                          Pending Source Update
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'DOCUMENT PREPARATION')} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'SOFT COPY DOCUMENT')} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'FINAL DATA')} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'DRAFT DOCUMENT')} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <GroupStatusCell pct={getGroupPct(job, 'ORIGINAL DOCUMENT')} />
                      </td>
                      <td>
                        {job.ae_assignee_name ? (
                          <span className="act-assignee-pill assigned">
                            <Users size={12} />
                            <span>{job.ae_assignee_name}</span>
                          </span>
                        ) : (
                          <span className="act-assignee-pill unassigned">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button"
                          className={`act-btn-assign ${job.ae_assignee_id ? 'is-assigned' : 'is-unassigned'}`}
                          onClick={() => setSelectedJob(job)}
                        >
                          {job.ae_assignee_id ? 'Reassign' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGNMENT MODAL ── */}
      {selectedJob && (
        <AeAssignmentModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)}
          onSuccess={(updatedJob) => {
            setJobs(prev => prev.map(j => j.id === updatedJob.id ? { ...j, ...updatedJob } : j));
            setSelectedJob(null);
            showToast('success', `Pekerjaan ${updatedJob.invoice_no || ''} berhasil didelegasikan.`);
          }}
        />
      )}

      {/* ── APPLE CONFIRMATION MODAL FOR DEV WIPE ALL ── */}
      <AppleConfirmModal
        isOpen={showWipeDialog}
        loading={loading}
        onClose={() => setShowWipeDialog(false)}
        onConfirm={executeWipeAll}
        variant="danger"
        eyebrow="KOMPAS EXIM • RESET PIPELINE (DEV)"
        title="Reset Seluruh Data Pipeline?"
        message="PERINGATAN: Tindakan ini akan menghapus seluruh data pekerjaan ekspor, riwayat serah terima AO, dan data Log Schedule. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Semua Data"
        cancelText="Batal"
      />

      {/* ── APPLE TOAST NOTIFICATION ── */}
      <AppleToast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AeControlTower;
