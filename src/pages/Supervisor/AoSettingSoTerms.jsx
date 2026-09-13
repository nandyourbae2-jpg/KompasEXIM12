import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search as SearchIcon, 
  Plus as PlusIcon, 
  Save as SaveIcon, 
  Ship as ShipIcon, 
  CheckCircle as CheckCircleIcon, 
  Clock as ClockIcon, 
  FileText as FileTextIcon, 
  AlertCircle as AlertCircleIcon, 
  Import as ImportIcon, 
  Fish as FishIcon, 
  Factory as FactoryIcon, 
  X as XIcon,
  Sparkles,
  Calendar,
  Check,
  ChevronRight,
  Zap,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import './AoSettingSoTerms.css';

export default function AoSettingSoTerms() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'CONFIGURED' | 'URGENT'
  
  // Selected Job State
  const [selectedJob, setSelectedJob] = useState(null);
  const [documentChecklists, setDocumentChecklists] = useState([]);
  const [reminderNotes, setReminderNotes] = useState('');
  const [termsIncoterm, setTermsIncoterm] = useState('');
  const [termsPayment, setTermsPayment] = useState('');
  const [saving, setSaving] = useState(false);

  const fisheryDocs = [
    "Surat Jalan Fishery", 
    "Bukti Timbang", 
    "Logsheet Nelayan", 
    "Catch Certificate/DSCS", 
    "Uji Mutu Organoleptik"
  ];
  
  const pabrikDocs = [
    "Surat Jalan Pabrik", 
    "Packing List Pabrik", 
    "COA (Certificate of Analysis)", 
    "Health Certificate Pabrik", 
    "Faktur Pabrik"
  ];

  const incotermOptions = [
    { code: "FOB", label: "FOB — Free On Board (Pelabuhan Muat)" },
    { code: "CIF", label: "CIF — Cost, Insurance & Freight (Tujuan)" },
    { code: "CFR", label: "CFR — Cost & Freight (Tujuan)" },
    { code: "EXW", label: "EXW — Ex Works (Pabrik)" },
    { code: "DAP", label: "DAP — Delivered at Place" },
    { code: "DDP", label: "DDP — Delivered Duty Paid" },
    { code: "FAS", label: "FAS — Free Alongside Ship" },
    { code: "CIP", label: "CIP — Carriage and Insurance Paid to" },
    { code: "FCA", label: "FCA — Free Carrier" }
  ];

  const paymentSuggestions = [
    "30% DP, 70% against BL copy",
    "LC at Sight 100%",
    "TT 100% in Advance",
    "20% DP, 80% CAD (Cash Against Docs)",
    "Net 30 Days from BL Date",
    "50% DP, 50% Before Stuffing"
  ];

  const presets = [
    {
      id: 'tuna',
      title: '🐟 Ikan Tuna / Pelagis',
      desc: 'Dokumen cold chain tuna loin/steak standar ekspor',
      incoterm: 'FOB',
      payment: '30% DP, 70% against BL copy',
      fishery: ['Surat Jalan Fishery', 'Bukti Timbang', 'Catch Certificate/DSCS', 'Uji Mutu Organoleptik', 'Logsheet Nelayan'],
      pabrik: ['Surat Jalan Pabrik', 'Packing List Pabrik', 'COA (Certificate of Analysis)', 'Health Certificate Pabrik', 'Faktur Pabrik']
    },
    {
      id: 'udang',
      title: '🦐 Udang Beku',
      desc: 'Uji residu antibiotik & mikrobiologi standar BKIPM',
      incoterm: 'CIF',
      payment: 'LC at Sight 100%',
      fishery: ['Surat Jalan Tambak', 'Bukti Timbang Raw Material', 'Hasil Uji Residu Antibiotik'],
      pabrik: ['Processing Sheet Pabrik', 'Packing List Pabrik', 'COA Mikrobiologi', 'Health Certificate (BKIPM)', 'Faktur Pabrik']
    },
    {
      id: 'gurita',
      title: '🐙 Gurita / Cumi',
      desc: 'Uji mutu logam berat & grading tangkapan laut',
      incoterm: 'CFR',
      payment: '20% DP, 80% CAD (Cash Against Docs)',
      fishery: ['Surat Jalan Supplier', 'Bukti Timbang Grading', 'Sertifikat Hasil Tangkapan Ikan (SHTI)'],
      pabrik: ['Packing List Pabrik', 'COA Uji Logam Berat', 'Health Certificate Pabrik', 'Faktur Pabrik']
    },
    {
      id: 'umum',
      title: '📦 Standar Ekspor Umum',
      desc: 'Set dasar dokumen operasional pabrik & fishery',
      incoterm: 'FOB',
      payment: '30% DP, 70% against BL copy',
      fishery: ['Surat Jalan Fishery', 'Bukti Timbang'],
      pabrik: ['Surat Jalan Pabrik', 'Packing List Pabrik', 'Health Certificate Pabrik', 'COA (Certificate of Analysis)']
    }
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api('/v2/ao-workboard/supervisor/doc-planner/jobs');
      if (res && res.success) {
        setJobs(res.data || []);
      } else {
        toast.error('Gagal memuat data SO Terms');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      toast.error('Terjadi kesalahan memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setDocumentChecklists(job.document_checklists || []);
    setReminderNotes(job.reminder_notes || '');
    setTermsIncoterm(job.terms_incoterm || '');
    setTermsPayment(job.terms_payment || '');
  };

  const handleAddDocument = (category, defaultName = '') => {
    setDocumentChecklists(prev => [...prev, {
      id: `${category.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      category: category,
      name: defaultName,
      isCompleted: false,
      deadline: null,
      source: 'SPV_AO'
    }]);
  };

  const updateDocument = (id, field, value) => {
    setDocumentChecklists(prev => prev.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const removeDocument = (id) => {
    setDocumentChecklists(prev => prev.filter(doc => doc.id !== id));
  };

  const handleApplyPreset = (preset) => {
    if (!selectedJob) return;

    if (!termsIncoterm && preset.incoterm) {
      setTermsIncoterm(preset.incoterm);
    }
    if (!termsPayment && preset.payment) {
      setTermsPayment(preset.payment);
    }

    const existingNames = new Set(documentChecklists.map(d => d.name.toLowerCase().trim()));
    const newDocs = [];

    preset.fishery.forEach(docName => {
      if (!existingNames.has(docName.toLowerCase().trim())) {
        newDocs.push({
          id: `fishery_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          category: 'FISHERY',
          name: docName,
          isCompleted: false,
          deadline: null,
          source: 'SPV_AO'
        });
      }
    });

    preset.pabrik.forEach(docName => {
      if (!existingNames.has(docName.toLowerCase().trim())) {
        newDocs.push({
          id: `pabrik_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          category: 'PABRIK',
          name: docName,
          isCompleted: false,
          deadline: null,
          source: 'SPV_AO'
        });
      }
    });

    setDocumentChecklists(prev => [...prev, ...newDocs]);
    toast.success(`Template ${preset.title} diterapkan`);
  };

  const handleSave = async () => {
    if (!selectedJob) return;
    setSaving(true);
    try {
      const result = await api(`/v2/ao-workboard/supervisor/jobs/${selectedJob.id}/doc-plan`, {
        method: 'PUT',
        body: JSON.stringify({
          document_checklists: documentChecklists,
          reminder_notes: reminderNotes,
          terms_incoterm: termsIncoterm,
          terms_payment: termsPayment
        })
      });

      if (result && result.success) {
        toast.success('SO Terms & Matrix Dokumen berhasil disimpan');
        
        const updatedJob = { 
          ...selectedJob, 
          document_checklists: documentChecklists, 
          reminder_notes: reminderNotes, 
          terms_incoterm: termsIncoterm, 
          terms_payment: termsPayment 
        };
        setSelectedJob(updatedJob);
        setJobs(prev => prev.map(j => j.id === selectedJob.id ? updatedJob : j));
      } else {
        toast.error(result?.message || 'Gagal menyimpan SO Terms');
      }
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Gagal menyimpan SO Terms');
    } finally {
      setSaving(false);
    }
  };

  const getDaysUntilEtd = (etdString) => {
    if (!etdString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const etdDate = new Date(etdString);
    etdDate.setHours(0, 0, 0, 0);
    const diffTime = etdDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isJobConfigured = (job) => {
    const hasTerms = Boolean(job.terms_incoterm || job.terms_payment);
    const hasDocs = Array.isArray(job.document_checklists) && job.document_checklists.length > 0;
    return hasTerms || hasDocs;
  };

  // Stats Counters
  const stats = useMemo(() => {
    let pending = 0;
    let configured = 0;
    let urgent = 0;

    jobs.forEach(job => {
      const configuredStatus = isJobConfigured(job);
      const days = getDaysUntilEtd(job.etd);

      if (configuredStatus) {
        configured += 1;
      } else {
        pending += 1;
      }

      if (days !== null && days <= 5 && days >= 0 && !configuredStatus) {
        urgent += 1;
      }
    });

    return { total: jobs.length, pending, configured, urgent };
  }, [jobs]);

  // Filtered List
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = 
        (j.invoice_no || '').toLowerCase().includes(search.toLowerCase()) || 
        (j.buyer || '').toLowerCase().includes(search.toLowerCase()) ||
        (j.vessel || '').toLowerCase().includes(search.toLowerCase()) ||
        (j.ao_assignee_name || '').toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      const configured = isJobConfigured(j);
      const days = getDaysUntilEtd(j.etd);

      if (filterTab === 'PENDING') return !configured;
      if (filterTab === 'CONFIGURED') return configured;
      if (filterTab === 'URGENT') return days !== null && days <= 5 && days >= 0 && !configured;

      return true;
    });
  }, [jobs, search, filterTab]);

  return (
    <div className="so-container">
      
      {/* ── TOP HEADER & METRIC PILLS BAR ───────────────────────────── */}
      <header className="so-header">
        <div>
          <div className="so-eyebrow">
            <ClipboardList size={13} /> MODUL SUPERVISOR AO
          </div>
          <h1 className="so-title">
            Setting SO Terms
          </h1>
          <p className="so-subtitle">
            Konfigurasi ketentuan komersial (Incoterms & Payment) serta matriks persyaratan dokumen per invoice.
          </p>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="so-metrics-bar">
          <button 
            type="button"
            onClick={() => setFilterTab(filterTab === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`so-metric-pill ${filterTab === 'PENDING' ? 'active-pending' : ''}`}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff9500' }}></span>
            <span>Perlu Setting</span>
            <span className="so-metric-count">{stats.pending}</span>
          </button>

          <button 
            type="button"
            onClick={() => setFilterTab(filterTab === 'CONFIGURED' ? 'ALL' : 'CONFIGURED')}
            className={`so-metric-pill ${filterTab === 'CONFIGURED' ? 'active-configured' : ''}`}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34c759' }}></span>
            <span>Siap Operasional</span>
            <span className="so-metric-count">{stats.configured}</span>
          </button>

          {stats.urgent > 0 && (
            <button 
              type="button"
              onClick={() => setFilterTab(filterTab === 'URGENT' ? 'ALL' : 'URGENT')}
              className={`so-metric-pill ${filterTab === 'URGENT' ? 'active-urgent' : ''}`}
            >
              <ShieldAlert size={14} color="#ff3b30" />
              <span style={{ color: '#ff3b30' }}>Urgent ETD</span>
              <span className="so-metric-count" style={{ color: '#ff3b30', background: '#feecec' }}>{stats.urgent}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── WORKSPACE SPLIT-VIEW ────────────────────────────────────── */}
      <div className="so-workspace">
        
        {/* ── LEFT PANEL: INVOICE NAVIGATOR ──────────────────────────── */}
        <aside className="so-sidebar">
          
          {/* Search Bar - Native Flex Layout */}
          <div className="so-search-box">
            <div className="so-search-wrap">
              <SearchIcon size={16} color="#86868b" style={{ flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Cari Invoice, Buyer, Kapal..." 
                className="so-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#86868b' }}
                  title="Hapus pencarian"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>

            {/* Segmented Control Bar */}
            <div className="so-segmented-bar">
              <button 
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`so-segmented-tab ${filterTab === 'ALL' ? 'active' : ''}`}
              >
                Semua ({jobs.length})
              </button>
              <button 
                type="button"
                onClick={() => setFilterTab('PENDING')}
                className={`so-segmented-tab ${filterTab === 'PENDING' ? 'active' : ''}`}
              >
                Perlu Set ({stats.pending})
              </button>
              <button 
                type="button"
                onClick={() => setFilterTab('CONFIGURED')}
                className={`so-segmented-tab ${filterTab === 'CONFIGURED' ? 'active' : ''}`}
              >
                Selesai ({stats.configured})
              </button>
            </div>
          </div>

          {/* List of Invoice Cards */}
          <div className="so-invoice-list">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: '#86868b' }}>
                <div style={{ width: 22, height: 22, border: '2px solid #0066cc', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 8 }}></div>
                <span style={{ fontSize: 13 }}>Memuat data invoice...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, textAlign: 'center', padding: '0 16px', color: '#86868b' }}>
                <SearchIcon size={26} color="#d2d2d7" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Tidak ada invoice</div>
                <div style={{ fontSize: 12, color: '#86868b', marginTop: 4 }}>
                  {search ? 'Coba ubah kata kunci pencarian Anda' : 'Tidak ada invoice pada kategori ini'}
                </div>
                {(search || filterTab !== 'ALL') && (
                  <button 
                    type="button"
                    onClick={() => { setSearch(''); setFilterTab('ALL'); }}
                    style={{ marginTop: 10, fontSize: 12, color: '#0066cc', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              filteredJobs.map(job => {
                const isSelected = selectedJob?.id === job.id;
                const configured = isJobConfigured(job);
                const days = getDaysUntilEtd(job.etd);
                const isUrgent = days !== null && days <= 5 && days >= 0 && !configured;
                const docsCount = Array.isArray(job.document_checklists) ? job.document_checklists.length : 0;

                return (
                  <div 
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`so-invoice-card ${isSelected ? 'selected' : ''}`}
                  >
                    {/* Header Row: Dot Status + Invoice + ETD Badge */}
                    <div className="so-card-header-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isUrgent ? '#ff3b30' : configured ? '#34c759' : '#ff9500',
                          flexShrink: 0
                        }} />
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#1d1d1f', letterSpacing: '-0.2px' }}>
                          {job.invoice_no}
                        </span>
                      </div>

                      {/* ETD Countdown Chip */}
                      {days !== null ? (
                        <span className={`so-invoice-badge ${days <= 3 ? 'urgent' : days <= 7 ? 'warning' : 'neutral'}`}>
                          {days < 0 ? 'ETD Lewat' : days === 0 ? 'ETD Hari Ini' : `H-${days} ETD`}
                        </span>
                      ) : (
                        <span className="so-invoice-badge neutral">No ETD</span>
                      )}
                    </div>

                    {/* Buyer & Destination */}
                    <div className="so-invoice-buyer">
                      {job.buyer || 'Tanpa Nama Buyer'}
                      {job.destination && <span style={{ color: '#86868b', fontWeight: 400 }}> · {job.destination}</span>}
                    </div>

                    {/* Footer Row: Vessel & Status Chip */}
                    <div className="so-invoice-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <ShipIcon size={12} color="#86868b" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.vessel || 'Vessel TBA'}</span>
                      </div>

                      <div>
                        {configured ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#1d6f31', background: '#eaf8ee', padding: '2px 7px', borderRadius: 4 }}>
                            <Check size={10} /> {docsCount} Dokumen
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#996500', background: '#fff9e6', padding: '2px 7px', borderRadius: 4 }}>
                            Belum Diset
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT PANEL: SO TERMS STUDIO WORKSPACE ─────────────────── */}
        <main className="so-studio">
          {selectedJob ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              
              {/* Sticky Top Header (Apple Glass Blur) */}
              <div className="so-studio-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: '#1d1d1f' }}>
                      Invoice {selectedJob.invoice_no}
                    </h2>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f', padding: '3px 10px', borderRadius: 9999, background: '#f0f0f2' }}>
                      {selectedJob.buyer}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#86868b', marginTop: 4 }}>
                    <span>Kapal: <strong style={{ color: '#1d1d1f', fontWeight: 600 }}>{selectedJob.vessel || '-'}</strong></span>
                    <span>•</span>
                    <span>ETD: <strong style={{ color: '#1d1d1f', fontWeight: 600 }}>{selectedJob.etd ? new Date(selectedJob.etd).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'TBA'}</strong></span>
                    <span>•</span>
                    <span>Assignee AO: <strong style={{ color: '#0066cc', fontWeight: 600 }}>{selectedJob.ao_assignee_name || 'Belum di-assign'}</strong></span>
                  </div>
                </div>

                <div>
                  <button 
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="so-btn-primary"
                  >
                    {saving ? (
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #ffffff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <SaveIcon size={16} />
                    )}
                    <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Form Content with Generous Padding */}
              <div className="so-studio-body">
                
                {/* 📌 CARD 1: CATATAN INSTRUKSI SPV (Apple Notes Callout) */}
                <div className="so-card-callout">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#996500', fontWeight: 700, fontSize: 13, letterSpacing: '0.2px' }}>
                      <AlertCircleIcon size={16} /> INSTRUKSI KHUSUS UNTUK STAF AO (OPERASIONAL)
                    </div>
                    <span style={{ fontSize: 11, color: '#b38033', fontWeight: 600 }}>Otomatis tampil di Peta Tugas Staf</span>
                  </div>
                  <textarea 
                    value={reminderNotes}
                    onChange={(e) => setReminderNotes(e.target.value)}
                    placeholder="Tulis instruksi khusus untuk Staf AO (Contoh: Buyer sensitif dengan tanggal expired Certificate of Health, koordinasikan segera ke BKIPM)..."
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: '#1d1d1f',
                      minHeight: 65,
                      outline: 'none',
                      resize: 'none',
                      padding: 0,
                      margin: 0,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 📋 CARD 2: KETENTUAN KOMERSIAL (Incoterms & Payment Terms) */}
                <div className="so-card">
                  <div className="so-card-title">
                    <FileTextIcon size={17} color="#0066cc" />
                    <span>Ketentuan Komersial SO (Sales Order)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                    {/* Incoterms Selector */}
                    <div>
                      <label className="so-form-label">
                        Incoterms Standar
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select 
                          value={termsIncoterm}
                          onChange={(e) => setTermsIncoterm(e.target.value)}
                          className="so-form-select"
                        >
                          <option value="">-- Pilih Incoterm --</option>
                          {incotermOptions.map(opt => (
                            <option key={opt.code} value={opt.code}>{opt.label}</option>
                          ))}
                        </select>
                        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#86868b', fontSize: 11 }}>
                          ▼
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#86868b', marginTop: 6, lineHeight: 1.4 }}>
                        Menentukan titik tanggung jawab biaya & risiko logistik pengiriman.
                      </div>
                    </div>

                    {/* Payment Terms Input + Quick Suggestions */}
                    <div>
                      <label className="so-form-label">
                        Syarat Pembayaran (Payment Terms)
                      </label>
                      <input 
                        type="text" 
                        value={termsPayment}
                        onChange={(e) => setTermsPayment(e.target.value)}
                        placeholder="Ketik atau pilih saran di bawah..."
                        className="so-form-input"
                      />
                      {/* Suggestion Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {paymentSuggestions.map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => setTermsPayment(sugg)}
                            className="so-quick-chip"
                          >
                            + {sugg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ⚡ CARD 3: 1-CLICK COMMODITY PRESETS */}
                <div className="so-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f2f2f7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                      <Zap size={16} color="#ff9500" />
                      <span>Terapkan Template Komoditas (1-Click Preset)</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#86868b' }}>Otomatis mengisi matrix dokumen standar</span>
                  </div>

                  <div className="so-preset-grid">
                    {presets.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => handleApplyPreset(p)}
                        className="so-preset-item"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>
                          <span>{p.title}</span>
                          <PlusIcon size={14} color="#0066cc" />
                        </div>
                        <div style={{ fontSize: 11, color: '#86868b', marginTop: 4, lineHeight: 1.4 }}>
                          {p.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 📥 CARD 4: DOKUMEN HANDOVER STAF AE */}
                <div className="so-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f2f2f7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                      <ImportIcon size={16} color="#5856d6" />
                      <span>Dokumen Handover dari Staf AE</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#86868b' }}>Dokumen sumber awal dari tim AE</span>
                  </div>

                  <div>
                    {documentChecklists.filter(d => d.category === 'AE').length === 0 ? (
                      <div style={{ padding: '16px 20px', borderRadius: 12, background: '#f5f5f7', textAlign: 'center', color: '#86868b', fontSize: 13 }}>
                        Belum ada dokumen yang diserahkan oleh Staf AE untuk invoice ini.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                        {documentChecklists.filter(d => d.category === 'AE').map(doc => (
                          <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: '#f5f5f7', border: '1px solid #e5e5ea' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <CheckCircleIcon size={16} color="#34c759" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#e8e8ed', color: '#48484a', flexShrink: 0 }}>
                              dari: {doc.sender_staff_name || 'AE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 🐟 CARD 5: DOKUMEN PERSYARATAN FISHERY */}
                <div className="so-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f2f2f7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                      <FishIcon size={17} color="#0066cc" />
                      <span>Persyaratan Dokumen Fishery</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#86868b' }}>Dari nelayan, supplier, grading, dan logsheet</span>
                  </div>
                  
                  {/* Quick Chips to Add */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {fisheryDocs.map(doc => (
                      <button 
                        key={doc} 
                        type="button"
                        onClick={() => handleAddDocument('FISHERY', doc)}
                        className="so-quick-chip"
                      >
                        <PlusIcon size={12} /> {doc}
                      </button>
                    ))}
                  </div>

                  {/* Document Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {documentChecklists.filter(d => d.category === 'FISHERY').map(doc => (
                      <div key={doc.id} className="so-doc-row">
                        <input 
                          type="text" 
                          value={doc.name}
                          onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                          placeholder="Nama Dokumen Fishery..."
                          className="so-doc-input"
                        />
                        <div className="so-doc-date">
                          <Calendar size={13} color="#86868b" />
                          <input 
                            type="date"
                            value={doc.deadline || ''}
                            onChange={(e) => updateDocument(doc.id, 'deadline', e.target.value)}
                            style={{ fontSize: 12, color: '#1d1d1f', border: 'none', outline: 'none', background: 'transparent' }}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeDocument(doc.id)} 
                          style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: '#86868b', cursor: 'pointer', display: 'flex' }}
                          title="Hapus Dokumen"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    ))}

                    <button 
                      type="button"
                      onClick={() => handleAddDocument('FISHERY')} 
                      style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0066cc', background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 0', alignSelf: 'flex-start' }}
                    >
                      <PlusIcon size={15}/> Tambah Dokumen Fishery Kustom
                    </button>
                  </div>
                </div>

                {/* 🏭 CARD 6: DOKUMEN PERSYARATAN PABRIK */}
                <div className="so-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f2f2f7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                      <FactoryIcon size={17} color="#ff9500" />
                      <span>Persyaratan Dokumen Pabrik</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#86868b' }}>Dari pengolahan pabrik, lab uji, dan karantina</span>
                  </div>
                  
                  {/* Quick Chips to Add */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {pabrikDocs.map(doc => (
                      <button 
                        key={doc} 
                        type="button"
                        onClick={() => handleAddDocument('PABRIK', doc)}
                        className="so-quick-chip"
                      >
                        <PlusIcon size={12} /> {doc}
                      </button>
                    ))}
                  </div>

                  {/* Document Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {documentChecklists.filter(d => d.category === 'PABRIK').map(doc => (
                      <div key={doc.id} className="so-doc-row">
                        <input 
                          type="text" 
                          value={doc.name}
                          onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                          placeholder="Nama Dokumen Pabrik..."
                          className="so-doc-input"
                        />
                        <div className="so-doc-date">
                          <Calendar size={13} color="#86868b" />
                          <input 
                            type="date"
                            value={doc.deadline || ''}
                            onChange={(e) => updateDocument(doc.id, 'deadline', e.target.value)}
                            style={{ fontSize: 12, color: '#1d1d1f', border: 'none', outline: 'none', background: 'transparent' }}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeDocument(doc.id)} 
                          style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: '#86868b', cursor: 'pointer', display: 'flex' }}
                          title="Hapus Dokumen"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    ))}

                    <button 
                      type="button"
                      onClick={() => handleAddDocument('PABRIK')} 
                      style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0066cc', background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 0', alignSelf: 'flex-start' }}
                    >
                      <PlusIcon size={15}/> Tambah Dokumen Pabrik Kustom
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* ── SMART EMPTY STATE / EXECUTIVE WELCOME HUB ───────────── */
            <div className="so-empty-hub">
              <div className="so-empty-wrap">
                
                {/* Visual Icon Badge */}
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ffffff', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0066cc', marginBottom: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <Sparkles size={28} />
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.3px', margin: '0 0 8px 0' }}>
                  Studio Setting SO Terms
                </h2>
                <p style={{ fontSize: 14, color: '#86868b', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                  Pilih salah satu invoice dari daftar di sebelah kiri untuk mengatur Incoterms, syarat pembayaran, serta checklist dokumen operasional untuk Staf AO.
                </p>

                {/* Priority Action Card: 2-3 most urgent invoices */}
                {jobs.filter(j => !isJobConfigured(j)).length > 0 && (
                  <div style={{ width: '100%', background: '#ffffff', borderRadius: 16, border: '1px solid #e0e0e0', padding: 20, marginBottom: 24, textAlign: 'left', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ClockIcon size={16} color="#ff9500" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>
                          Invoice Menunggu Konfigurasi Segera
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#86868b' }}>Klik untuk langsung atur</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {jobs.filter(j => !isJobConfigured(j)).slice(0, 3).map(urgentJob => (
                        <div 
                          key={urgentJob.id}
                          onClick={() => handleSelectJob(urgentJob)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: '#f5f5f7',
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>
                              {urgentJob.invoice_no} · <span style={{ fontWeight: 400, color: '#48484a' }}>{urgentJob.buyer}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#86868b', marginTop: 2 }}>
                              Vessel: {urgentJob.vessel || 'TBA'} {urgentJob.etd && `· ETD ${new Date(urgentJob.etd).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#0066cc', flexShrink: 0 }}>
                            Atur Sekarang <ChevronRight size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3-Step Flow Infographic */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', textAlign: 'left' }}>
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: '#ffffff', border: '1px solid #e0e0e0' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0066cc', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Langkah 1</span>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>Pilih & Set Terms</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#86868b', lineHeight: 1.4 }}>Tentukan Incoterm & kesepakatan pembayaran.</p>
                  </div>
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: '#ffffff', border: '1px solid #e0e0e0' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0066cc', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Langkah 2</span>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>Susun Dokumen</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#86868b', lineHeight: 1.4 }}>Gunakan template 1-klik atau tambah dokumen.</p>
                  </div>
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: '#ffffff', border: '1px solid #e0e0e0' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0066cc', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Langkah 3</span>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>Sinkron ke AO</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#86868b', lineHeight: 1.4 }}>Staf otomatis melihat instruksi di Peta Tugas.</p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
