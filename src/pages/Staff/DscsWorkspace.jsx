import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Package, CheckCircle, AlertTriangle, Clock,
  Send, X, History, Fish, Anchor, Layers, ChevronRight, FileText
} from 'lucide-react';
import { api } from '../../lib/api';
import './DscsWorkspace.css';

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const dateStatus = (d) => {
  if (!d) return '';
  const diff = (new Date(d) - new Date()) / 86400000;
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'near';
  return '';
};

const statusConfig = {
  PREPARATION: { label: 'Preparation', cls: 'prep', icon: <Package size={10} /> },
  VERIFICATION: { label: 'Verifikasi', cls: 'verif', icon: <CheckCircle size={10} /> },
  COMPLETED: { label: 'Selesai', cls: 'done', icon: <CheckCircle size={10} /> }
};

// ──────────────────────────────────────────────────────────────────
// DSCS Edit Modal
// ──────────────────────────────────────────────────────────────────
const DscsEditModal = ({ job, onClose, onSaved }) => {
  const [form, setForm] = useState({
    species: job.species || '',
    ds_date: job.ds_date || '',
    fishing_gear: job.fishing_gear || '',
    jml_fv: job.jml_fv || '',
    total_cont_fcl: job.total_cont_fcl || '',
    dscs_status: job.dscs_status || 'PREPARATION',
    dscs_done_date: job.dscs_done_date || '',
    dscs_due_date: job.dscs_due_date || '',
    remarks: job.dscs_remarks || ''
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    setSaving(true); setErr(null);
    try {
      const res = await api(`/v2/ao-workboard/dscs/jobs/${job.job_id}/update`, {
        method: 'PUT', body: JSON.stringify(form)
      });
      if (res.success) { onSaved(); onClose(); }
      else setErr(res.message || 'Gagal menyimpan');
    } catch (e) { setErr(e.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="dscs-modal-overlay" onClick={onClose}>
      <div className="dscs-modal" onClick={e => e.stopPropagation()}>
        <div className="dscs-modal-head">
          <div className="dscs-modal-head-top">
            <div>
              <div className="dscs-modal-title">Update DSCS</div>
              <div className="dscs-modal-meta">{job.invoice_no} · {job.buyer}</div>
            </div>
            <button className="dscs-modal-close" onClick={onClose}><X size={17} /></button>
          </div>
        </div>

        <div className="dscs-modal-body">
          {err && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 10, fontSize: 13, color: '#ff3b30', display: 'flex', gap: 7, alignItems: 'center' }}>
              <AlertTriangle size={15} /> {err}
            </div>
          )}

          {/* Status */}
          <div>
            <span className="dscs-field-label">Status DSCS</span>
            <select className="dscs-modal-select" value={form.dscs_status} onChange={e => set('dscs_status', e.target.value)}>
              <option value="PREPARATION">PREPARATION</option>
              <option value="VERIFICATION">VERIFICATION</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          {/* Species & Fishing Gear */}
          <div className="dscs-modal-row2">
            <div>
              <span className="dscs-field-label">Jenis Ikan (Species)</span>
              <input className="dscs-modal-input" value={form.species} onChange={e => set('species', e.target.value)} placeholder="Misal: Tuna, Grouper..." />
            </div>
            <div>
              <span className="dscs-field-label">Alat Tangkap</span>
              <input className="dscs-modal-input" value={form.fishing_gear} onChange={e => set('fishing_gear', e.target.value)} placeholder="LL, PS, GN..." />
            </div>
          </div>

          {/* Vessel & Container */}
          <div className="dscs-modal-row2">
            <div>
              <span className="dscs-field-label">Jml FV / Vessel</span>
              <input className="dscs-modal-input" value={form.jml_fv} onChange={e => set('jml_fv', e.target.value)} placeholder="Jumlah fishing vessel" />
            </div>
            <div>
              <span className="dscs-field-label">Total Container / FCL</span>
              <input className="dscs-modal-input" value={form.total_cont_fcl} onChange={e => set('total_cont_fcl', e.target.value)} placeholder="Misal: 2x40HC" />
            </div>
          </div>

          {/* DS Date */}
          <div>
            <span className="dscs-field-label">Tanggal DS</span>
            <input className="dscs-modal-input" type="date" value={form.ds_date} onChange={e => set('ds_date', e.target.value)} />
          </div>

          {/* Dates */}
          <div className="dscs-modal-row2">
            <div>
              <span className="dscs-field-label">Due Date DSCS</span>
              <input className="dscs-modal-input" type="date" value={form.dscs_due_date} onChange={e => set('dscs_due_date', e.target.value)} />
            </div>
            <div>
              <span className="dscs-field-label">Tanggal Selesai</span>
              <input className="dscs-modal-input" type="date" value={form.dscs_done_date} onChange={e => set('dscs_done_date', e.target.value)} />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <span className="dscs-field-label">Keterangan</span>
            <textarea className="dscs-modal-textarea" value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Catatan khusus pekerjaan DSCS ini..." rows={3} />
          </div>
        </div>

        <div className="dscs-modal-foot">
          <button className="dscs-btn-cancel" onClick={onClose}>Batal</button>
          <button className="dscs-btn-save" disabled={saving} onClick={handleSave}>
            {saving ? <RefreshCw size={14} className="dscs-spin" /> : <Send size={14} />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// History Panel
// ──────────────────────────────────────────────────────────────────
const HistoryPanel = ({ job, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/v2/ao-workboard/dscs/jobs/${job.job_id}/history`)
      .then(r => { if (r.success) setHistory(r.data || []); })
      .finally(() => setLoading(false));
  }, [job.job_id]);

  return (
    <div className="dscs-history-overlay" onClick={onClose}>
      <div className="dscs-history-panel" onClick={e => e.stopPropagation()}>
        <div className="dscs-history-head">
          <div className="dscs-history-title">Riwayat Perubahan — {job.invoice_no}</div>
          <button className="dscs-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="dscs-history-body">
          {loading && <div style={{ textAlign: 'center', color: '#86868b', padding: 24 }}><RefreshCw size={20} className="dscs-spin" /></div>}
          {!loading && history.length === 0 && <div style={{ textAlign: 'center', color: '#86868b', padding: 24 }}>Belum ada riwayat perubahan</div>}
          {history.map(h => {
            let data = {};
            try { data = JSON.parse(h.new_value || '{}'); } catch {}
            return (
              <div key={h.id} className="dscs-history-item">
                <div className="dscs-history-actor">{h.actor_name} <span style={{ fontWeight: 400, color: '#6e6e73' }}>·</span> {h.action}</div>
                <div className="dscs-history-time">{fmtDate(h.created_at)}</div>
                <div className="dscs-history-data">
                  {Object.entries(data).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// DSCS Job Card
// ──────────────────────────────────────────────────────────────────
const DscsJobCard = ({ job, onEdit, onHistory }) => {
  const status = job.dscs_status || 'PREPARATION';
  const statusCfg = statusConfig[status] || statusConfig.PREPARATION;
  const isCompleted = status === 'COMPLETED';
  const isOverdue = !isCompleted && job.dscs_due_date && dateStatus(job.dscs_due_date) === 'overdue';
  const barCls = isCompleted ? 'completed' : isOverdue ? 'overdue' : '';

  return (
    <div className="dscs-job-card">
      <div className={`dscs-job-card-bar ${barCls}`} />
      <div className="dscs-job-head">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="dscs-job-inv">{job.invoice_no}</div>
            <div className="dscs-job-buyer">{job.buyer} · {job.destination}</div>
            {job.etd && <div className="dscs-job-etd">ETD: {fmtDate(job.etd)}</div>}
          </div>
          <span className={`dscs-status-badge ${statusCfg.cls}`}>
            {statusCfg.icon} {statusCfg.label}
          </span>
        </div>
      </div>

      <div className="dscs-job-fields">
        <div className="dscs-field-item">
          <span className="dscs-field-key"><Fish size={9} style={{ display: 'inline', marginRight: 3 }} />Species</span>
          <span className={`dscs-field-val${!job.species ? ' empty' : ''}`}>{job.species || 'Belum diisi'}</span>
        </div>
        <div className="dscs-field-item">
          <span className="dscs-field-key"><Anchor size={9} style={{ display: 'inline', marginRight: 3 }} />Alat Tangkap</span>
          <span className={`dscs-field-val${!job.fishing_gear ? ' empty' : ''}`}>{job.fishing_gear || 'Belum diisi'}</span>
        </div>
        <div className="dscs-field-item">
          <span className="dscs-field-key">Jml FV</span>
          <span className={`dscs-field-val${!job.jml_fv ? ' empty' : ''}`}>{job.jml_fv || '—'}</span>
        </div>
        <div className="dscs-field-item">
          <span className="dscs-field-key"><Layers size={9} style={{ display: 'inline', marginRight: 3 }} />Container / FCL</span>
          <span className={`dscs-field-val${!job.total_cont_fcl ? ' empty' : ''}`}>{job.total_cont_fcl || '—'}</span>
        </div>
        <div className="dscs-field-item">
          <span className="dscs-field-key">Tanggal DS</span>
          <span className={`dscs-field-val${!job.ds_date ? ' empty' : ''}`}>{job.ds_date ? fmtDate(job.ds_date) : '—'}</span>
        </div>
        <div className="dscs-field-item">
          <span className="dscs-field-key">Due Date</span>
          <span className={`dscs-field-val${!job.dscs_due_date ? ' empty' : ''}`} style={{ color: isOverdue ? '#ff3b30' : 'inherit' }}>
            {job.dscs_due_date ? fmtDate(job.dscs_due_date) : '—'}
            {isOverdue && ' ⚠'}
          </span>
        </div>
        {job.dscs_done_date && (
          <div className="dscs-field-item" style={{ gridColumn: '1 / -1' }}>
            <span className="dscs-field-key">✓ Selesai</span>
            <span className="dscs-field-val" style={{ color: '#34c759' }}>{fmtDate(job.dscs_done_date)}</span>
          </div>
        )}
        {job.dscs_remarks && (
          <div className="dscs-field-item" style={{ gridColumn: '1 / -1' }}>
            <span className="dscs-field-key">Keterangan</span>
            <span className="dscs-field-val" style={{ fontStyle: 'italic', color: '#6e6e73' }}>{job.dscs_remarks}</span>
          </div>
        )}
      </div>

      <div className="dscs-job-foot">
        <button className="dscs-btn-history" onClick={() => onHistory(job)}>
          <History size={13} /> Riwayat
        </button>
        <button className="dscs-btn-edit-job" onClick={() => onEdit(job)}>
          Update DSCS <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Main DscsWorkspace Component
// ──────────────────────────────────────────────────────────────────
const DscsWorkspace = ({ user }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [historyJob, setHistoryJob] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setRefreshing(true); setError(null);
    try {
      const res = await api('/v2/ao-workboard/dscs/my-work');
      if (res.success) setJobs(res.data || []);
      else if (res.message?.includes('tidak memiliki akses')) {
        setError('Workspace DSCS ini khusus untuk Erica. Anda tidak memiliki akses.');
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const pending = jobs.filter(j => !j.dscs_status || j.dscs_status === 'PREPARATION');
  const inVerif = jobs.filter(j => j.dscs_status === 'VERIFICATION');
  const completed = jobs.filter(j => j.dscs_status === 'COMPLETED');
  const overdue = jobs.filter(j => j.dscs_due_date && dateStatus(j.dscs_due_date) === 'overdue' && j.dscs_status !== 'COMPLETED');

  const filteredJobs = activeFilter === 'all' ? jobs
    : activeFilter === 'preparation' ? pending
    : activeFilter === 'verification' ? inVerif
    : activeFilter === 'completed' ? completed
    : activeFilter === 'overdue' ? overdue
    : jobs;

  if (loading) {
    return (
      <div className="dscs-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 14 }}>
          <RefreshCw size={24} className="dscs-spin" style={{ color: '#00c7be' }} />
          <span style={{ fontSize: 15, color: '#6e6e73' }}>Memuat DSCS Workspace...</span>
        </div>
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="dscs-page">
        <div className="dscs-content">
          <div style={{ padding: '40px 24px', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <AlertTriangle size={24} style={{ color: '#ff3b30', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#ff3b30' }}>Akses Ditolak</div>
              <div style={{ fontSize: 13, color: '#6e6e73' }}>{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dscs-page">
      {/* Hero Header */}
      <div className="dscs-hero">
        <div className="dscs-hero-inner">
          <div>
            <div className="dscs-eyebrow">
              <div className="dscs-eyebrow-dot" />
              DSCS Personal Workspace
            </div>
            <h1 className="dscs-title">Bilik Kerja DSCS</h1>
            <p className="dscs-subtitle">
              {user?.nama || 'Erica'} · {jobs.length} pekerjaan DSCS · {overdue.length} overdue
            </p>
          </div>
          <div className="dscs-hero-actions">
            <button className="dscs-btn-ghost" disabled={refreshing} onClick={fetchJobs}>
              <RefreshCw size={14} className={refreshing ? 'dscs-spin' : ''} />
              {refreshing ? 'Memperbarui...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="dscs-content">
        {/* Error banner */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 12, fontSize: 13, color: '#ff3b30', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="dscs-stats-row">
          <div className="dscs-stat-card teal">
            <div className="dscs-stat-icon teal"><FileText size={18} /></div>
            <div className="dscs-stat-val">{jobs.length}</div>
            <div className="dscs-stat-label">Total DSCS</div>
          </div>
          <div className="dscs-stat-card orange">
            <div className="dscs-stat-icon orange"><Clock size={18} /></div>
            <div className="dscs-stat-val">{pending.length}</div>
            <div className="dscs-stat-label">Preparation</div>
          </div>
          <div className="dscs-stat-card purple">
            <div className="dscs-stat-icon purple"><Package size={18} /></div>
            <div className="dscs-stat-val">{inVerif.length}</div>
            <div className="dscs-stat-label">Verifikasi</div>
          </div>
          <div className="dscs-stat-card green">
            <div className="dscs-stat-icon green"><CheckCircle size={18} /></div>
            <div className="dscs-stat-val">{completed.length}</div>
            <div className="dscs-stat-label">Selesai</div>
          </div>
        </div>

        {/* Filter */}
        <div className="dscs-filter-bar">
          <div className="dscs-filter-tabs">
            {[
              { key: 'all', label: `Semua (${jobs.length})` },
              { key: 'preparation', label: `Preparation (${pending.length})` },
              { key: 'verification', label: `Verifikasi (${inVerif.length})` },
              { key: 'completed', label: `Selesai (${completed.length})` },
              ...(overdue.length > 0 ? [{ key: 'overdue', label: `⚠ Overdue (${overdue.length})` }] : [])
            ].map(t => (
              <button key={t.key} className={`dscs-filter-tab${activeFilter === t.key ? ' active' : ''}`} onClick={() => setActiveFilter(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="dscs-empty">
            <div className="dscs-empty-icon"><Fish size={48} style={{ color: '#c7c7cc' }} /></div>
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#6e6e73' }}>Tidak ada pekerjaan DSCS</p>
            <p style={{ fontSize: 12, color: '#86868b', margin: 0 }}>Belum ada DSCS yang ditugaskan dalam filter ini.</p>
          </div>
        ) : (
          <div className="dscs-jobs-grid">
            {filteredJobs.map(job => (
              <DscsJobCard
                key={job.dscs_task_id || job.job_id}
                job={job}
                onEdit={setEditingJob}
                onHistory={setHistoryJob}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingJob && (
        <DscsEditModal job={editingJob} onClose={() => setEditingJob(null)} onSaved={fetchJobs} />
      )}

      {/* History Panel */}
      {historyJob && (
        <HistoryPanel job={historyJob} onClose={() => setHistoryJob(null)} />
      )}
    </div>
  );
};

export default DscsWorkspace;
