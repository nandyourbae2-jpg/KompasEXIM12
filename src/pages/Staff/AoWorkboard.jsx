import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw, Inbox, Briefcase, CheckCircle, AlertTriangle,
  FileText, Send, X, ChevronRight, ChevronDown, ChevronUp,
  Clock, Package, Truck, AlertCircle, Layers, Check, Save, Calendar,
  Sparkles, Tag, Ship, Plus
} from 'lucide-react';
import { api } from '../../lib/api';
import { AppleCalendarPopover, formatDisplayDate } from '../../components/AppleCalendarPicker';
import '../../components/AppleCalendarPicker.css';
import './AoWorkboard.css';

// ──────────────────────────────────────────────────────────────────
// Apple Date Input Pill with Glassmorphic Popover Calendar
// - Apple Calendar Picker Pill (Interaktif Penuh untuk Semua Dokumen):
//   - Menggantikan input tanggal bawaan browser yang kaku (`dd/mm/yyyy`) dengan pil kalender interaktif bergaya macOS / iOS yang elegan.
//   - Dapat Diklik Langsung: Seluruh baris dokumen (termasuk dokumen serah terima AE) kini aktif dan dapat langsung diklik untuk menentukan deadline.
//   - Menampilkan teks `"Set Tanggal"` saat kosong dan format tanggal rapi (*contoh: 15 Sep 2026*) saat terisi.
//   - Dilengkapi tombol cepat hapus `(×)` saat ingin mengosongkan tanggal.
//   - Apple Glassmorphic Calendar Popover:
//     - Navigasi bulan & tahun dengan tombol chevron halus.
//     - Pintasan cepat (*Preset*): `⚡ Hari Ini`, `← Kemarin`, `→ Besok`, `+3 Hari`, `+1 Minggu` (klik langsung memilih dan menyimpan tanggal).
//     - Grid kalender dengan penanda hari ini dan tanggal terpilih berlingkar biru Apple (*SF Pro Style*). Cukup klik salah satu tanggal untuk memilih secara instan.
//     - Posisi popover menggunakan *smart fixed viewport positioning* yang presisi di bawah/di atas tombol dan tidak pernah terpotong layar.
// ──────────────────────────────────────────────────────────────────
const AppleDateInput = ({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Pilih Tanggal',
  compact = false,
  fullWidth = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const cleanVal = value ? value.split('T')[0] : '';
  const displayText = cleanVal ? formatDisplayDate(cleanVal) : placeholder;

  if (readOnly) {
    return (
      <div className={`ao-apple-date-pill readonly ${compact ? 'compact' : ''} ${fullWidth ? 'full-width' : ''}`}>
        <Calendar size={compact ? 12 : 14} className="ao-apple-date-icon" />
        <span className="ao-apple-date-text">{cleanVal ? formatDisplayDate(cleanVal) : '—'}</span>
      </div>
    );
  }

  return (
    <div className={`ao-apple-date-wrapper ${fullWidth ? 'full-width' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`ao-apple-date-pill ${cleanVal ? 'has-value' : 'is-empty'} ${isOpen ? 'is-active' : ''} ${compact ? 'compact' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        title="Klik untuk membuka Kalender Apple"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          <Calendar size={compact ? 12 : 14} className="ao-apple-date-icon" />
          <span className="ao-apple-date-text">{displayText}</span>
        </div>
        {cleanVal && (
          <span
            className="ao-apple-date-clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            title="Hapus tanggal"
          >
            <X size={11} />
          </span>
        )}
      </button>

      {isOpen && (
        <AppleCalendarPopover
          value={cleanVal}
          onChange={(newVal) => {
            onChange(newVal || '');
            setIsOpen(false);
          }}
          triggerRef={triggerRef}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
const PENDING_DOC_OPTIONS = [
  'Tracking DHL', 'COA', 'Processing Statement', 'CC', 'COO',
  'Invoice Asli', 'BL Original', 'Packing List Asli', 'Phyto', 'PPEI'
];

// Opsi status operasional dengan penamaan bahasa Indonesia yang mudah dipahami
const OPERATIONAL_STATUS_CONFIG = {
  'IN PROGRESS': {
    label: 'Sedang Diproses (Normal)',
    desc: 'Pengerjaan dokumen berjalan normal dan lancar sesuai jadwal.',
    color: '#0071e3',
    bg: 'rgba(0, 113, 227, 0.08)',
    border: 'rgba(0, 113, 227, 0.25)',
    icon: '🔄'
  },
  'WAITING PAYMENT': {
    label: 'Menunggu Pembayaran Buyer (Tertahan)',
    desc: 'Dokumen asli ditahan sementara hingga ada bukti transfer atau pelunasan dari pembeli.',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.08)',
    border: 'rgba(234, 88, 12, 0.25)',
    icon: '⏳'
  },
  'WAITING DOCS': {
    label: 'Menunggu Dokumen Pendukung',
    desc: 'Tertahan menunggu berkas fisik, sertifikat karantina, hasil uji lab, atau dokumen pabrik.',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.08)',
    border: 'rgba(225, 29, 72, 0.25)',
    icon: '📑'
  },
  'FU SHIPPER': {
    label: 'Hubungi Shipper / Eksportir',
    desc: 'Perlu konfirmasi spesifikasi barang atau kelengkapan data dari pihak shipper.',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.08)',
    border: 'rgba(124, 58, 237, 0.25)',
    icon: '📞'
  },
  'FU PAYMENT': {
    label: 'Follow Up Pembayaran',
    desc: 'Sedang menagih bukti pembayaran atau konfirmasi pelunasan ke buyer/finance.',
    color: '#ca8a04',
    bg: 'rgba(202, 138, 4, 0.08)',
    border: 'rgba(202, 138, 4, 0.25)',
    icon: '💳'
  },
  'COMPLETED': {
    label: 'Selesai Dikerjakan',
    desc: 'Seluruh tahapan dokumen pengerjaan invoice ini telah tuntas dan diserahkan.',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.08)',
    border: 'rgba(22, 163, 74, 0.25)',
    icon: '✅'
  }
};

// Pilihan tindakan cepat (1-klik pasang) dengan istilah praktis sehari-hari
const QUICK_ACTIONS = [
  { label: 'Hubungi Shipper', action: 'Hubungi Shipper untuk konfirmasi data', icon: '📞' },
  { label: 'Cek Pembayaran Buyer', action: 'Cek konfirmasi pelunasan/DP dari buyer', icon: '💳' },
  { label: 'Lacak Resi DHL / Kurir', action: 'Lacak pengiriman dokumen via DHL/kurir', icon: '📦' },
  { label: 'Minta Dokumen Pabrik', action: 'Minta dokumen asli/sertifikat ke pabrik', icon: '📑' },
  { label: 'Kirim Draft ke Buyer', action: 'Kirim draft dokumen ke buyer via email', icon: '✉️' },
  { label: 'Serahkan ke Bank', action: 'Serahkan dokumen asli ke pihak bank', icon: '🏦' },
  { label: 'Cek Jadwal Kapal', action: 'Konfirmasi pembaruan jadwal kapal (ETD/ETA)', icon: '🚢' },
];

// Panduan aksi cerdas sesuai tahapan dokumen
const STAGE_GUIDANCE = {
  PREPARATION: {
    title: 'Tahap 1: Persiapan Awal',
    tip: 'Lengkapi berkas serah terima dari Staf AE & periksa syarat dokumen.',
    action: 'Cek kelengkapan dokumen serah terima AE'
  },
  DRAFT: {
    title: 'Tahap 2: Pengiriman Draft',
    tip: 'Siapkan draft dokumen invoice & packing list, lalu kirimkan via email ke pembeli.',
    action: 'Kirim draft dokumen ke buyer via email'
  },
  FINAL_DRAFT: {
    title: 'Tahap 3: Persetujuan Final Draft',
    tip: 'Pastikan seluruh koreksi pembeli sudah disetujui sebelum mencetak dokumen fisik.',
    action: 'Konfirmasi persetujuan final draft dari buyer'
  },
  ORIGINAL: {
    title: 'Tahap 4: Dokumen Asli (Original)',
    tip: 'Ambil/kumpulkan seluruh dokumen asli (BL Original, COA, Karantina) untuk pengiriman.',
    action: 'Kumpulkan dan verifikasi dokumen fisik asli'
  },
  SUBMIT_BANK: {
    title: 'Tahap 5: Penyerahan Bank / Kurir',
    tip: 'Serahkan berkas asli ke bank penagih atau kirimkan resi DHL ke pembeli.',
    action: 'Serahkan set dokumen asli ke bank / kurir'
  },
  COMPLETED: {
    title: 'Tahap 6: Selesai',
    tip: 'Seluruh proses pengerjaan invoice ini telah tuntas.',
    action: 'Arsipkan berkas pengerjaan invoice'
  }
};

// Tag cepat untuk catatan / remarks
const REMARKS_TAGS = [
  { label: 'Kendala', tag: '[KENDALA] ' },
  { label: 'Info Pembeli', tag: '[INFO BUYER] ' },
  { label: 'Jadwal Kapal', tag: '[JADWAL KAPAL] ' },
  { label: 'Penting / Urgent', tag: '[URGENT] ' },
];

const fmtDate = (d) => {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
};

const dateStatus = (d) => {
  if (!d) return '';
  const diff = (new Date(d) - new Date()) / 86400000;
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'near';
  return '';
};

const parsePendingDocs = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
};

const parseChecklists = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const parseCategoryTracking = (raw, job) => {
  let parsed = {};
  if (raw) {
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== 'object') parsed = {};
    } catch {}
  }
  return {
    AE: {
      draft_date: parsed?.AE?.draft_date || (job?.email_draft_date ? job.email_draft_date.split('T')[0] : ''),
      ori_date: parsed?.AE?.ori_date || (job?.email_ori_date ? job.email_ori_date.split('T')[0] : ''),
    },
    FISHERY: {
      draft_date: parsed?.FISHERY?.draft_date || '',
      ori_date: parsed?.FISHERY?.ori_date || '',
    },
    PABRIK: {
      draft_date: parsed?.PABRIK?.draft_date || '',
      ori_date: parsed?.PABRIK?.ori_date || '',
    }
  };
};

// ──────────────────────────────────────────────────────────────────
// Kategori Tracking Dokumen (AE, Fishery, Pabrik)
// Dijabarkan per-masing masing dokumen individual dengan tanggal draft & ori
// ──────────────────────────────────────────────────────────────────
const TRACKING_CATEGORIES = [
  {
    key: 'AE',
    title: 'DOKUMEN AE',
    badgeText: '📂 DOKUMEN AE',
    sub: 'Dokumen serah terima dari Staf AE (Commercial Invoice, PL, BL, PEB)',
    draftLabel: 'Tanggal Email Draft AE',
    draftPlaceholder: 'Pilih Tgl Draft AE',
    oriLabel: 'Tanggal Dokumen Asli / Ori AE',
    oriPlaceholder: 'Pilih Tgl Ori AE',
    emptyNotice: 'Belum ada dokumen serah terima dari Staf AE pada invoice ini.',
    badgeClass: 'ae',
    defaultDocs: [
      'Commercial Invoice',
      'Packing List',
      'Bill of Lading (B/L)',
      'PEB / NPE',
      'COO (Certificate of Origin)'
    ]
  },
  {
    key: 'FISHERY',
    title: 'DOKUMEN FISHERY',
    badgeText: '🐟 DOKUMEN FISHERY',
    sub: 'Persyaratan karantina & sertifikat ikan yang di-generate dari Setting SO (Ka Vicky)',
    draftLabel: 'Tanggal Draft Pengajuan Karantina',
    draftPlaceholder: 'Pilih Tgl Draft Pengajuan',
    oriLabel: 'Tanggal Sertifikat Asli Terbit',
    oriPlaceholder: 'Pilih Tgl Sertifikat Terbit',
    emptyNotice: 'Belum ada dokumen Fishery yang di-generate dari Setting SO Ka Vicky.',
    badgeClass: 'fishery',
    defaultDocs: [
      'Health Certificate (HC)',
      'Catch Certificate / DSCS',
      'Sertifikat Karantina Ikan',
      'Surat Jalan Fishery'
    ]
  },
  {
    key: 'PABRIK',
    title: 'DOKUMEN PABRIK',
    badgeText: '🏭 DOKUMEN PABRIK',
    sub: 'Persyaratan sertifikat & uji mutu pabrik yang di-generate dari Setting SO (Ka Vicky)',
    draftLabel: 'Tanggal Permintaan / Draft Pabrik',
    draftPlaceholder: 'Pilih Tgl Draft Pabrik',
    oriLabel: 'Tanggal Dokumen Asli Diterima',
    oriPlaceholder: 'Pilih Tgl Asli Pabrik',
    emptyNotice: 'Belum ada dokumen Pabrik yang di-generate dari Setting SO Ka Vicky.',
    badgeClass: 'pabrik',
    defaultDocs: [
      'COA (Certificate of Analysis)',
      'Health Certificate Pabrik',
      'Packing List Pabrik',
      'Processing Statement Pabrik'
    ]
  }
];

const STAGES = [
  { key: 'PREPARATION', label: '1. Preparation', step: 1 },
  { key: 'DRAFT', label: '2. Draft', step: 2 },
  { key: 'FINAL_DRAFT', label: '3. Final Draft', step: 3 },
  { key: 'ORIGINAL', label: '4. Original', step: 4 },
  { key: 'SUBMIT_BANK', label: '5. Submit Bank', step: 5 },
  { key: 'COMPLETED', label: '6. Completed', step: 6 },
];

const AoInlineWorkstation = ({ job, onClose, onSaved }) => {
  const [form, setForm] = useState({
    operational_status: job.operational_status || '',
    current_action: job.current_action || '',
    pending_docs: parsePendingDocs(job.pending_docs),
    remarks: job.remarks || '',
    email_draft_date: job.email_draft_date ? job.email_draft_date.split('T')[0] : '',
    email_ori_date: job.email_ori_date ? job.email_ori_date.split('T')[0] : '',
    cc_due_date: job.cc_due_date ? job.cc_due_date.split('T')[0] : '',
    cc_done_date: job.cc_done_date ? job.cc_done_date.split('T')[0] : '',
    dscs_due_date: job.dscs_due_date ? job.dscs_due_date.split('T')[0] : '',
    dscs_done_date: job.dscs_done_date ? job.dscs_done_date.split('T')[0] : '',
    dscs_status: job.dscs_status || 'PREPARATION',
    courier_status: job.courier_status || '',
    bank_submission_status: job.bank_submission_status || '',
    eta_update: job.eta_update ? job.eta_update.split('T')[0] : '',
    document_stage: job.document_stage || 'PREPARATION',
    document_checklists: parseChecklists(job.document_checklists),
    category_tracking: parseCategoryTracking(job.category_tracking, job)
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [saveToast, setSaveToast] = useState(false);
  const [activeTrackCat, setActiveTrackCat] = useState('AE');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const addDoc = (category) => setForm(f => ({
    ...f,
    document_checklists: [
      ...f.document_checklists,
      {
        id: `${(category || 'others').toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: '',
        category: category,
        hasDeadline: true,
        deadline: '',
        draft_date: '',
        ori_date: '',
        isCompleted: false,
        source: category === 'AE' ? 'AE_HANDOVER' : 'SPV_AO'
      }
    ]
  }));

  const loadPresetDocs = (categoryKey, defaultList) => {
    setForm(f => {
      const existingNames = new Set(
        f.document_checklists
          .filter(d => (d.category || 'OTHERS') === categoryKey)
          .map(d => (d.name || '').toLowerCase().trim())
      );

      const toAdd = defaultList
        .filter(name => !existingNames.has(name.toLowerCase().trim()))
        .map(name => ({
          id: `${categoryKey.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          name,
          category: categoryKey,
          hasDeadline: true,
          deadline: '',
          draft_date: '',
          ori_date: '',
          isCompleted: false,
          source: categoryKey === 'AE' ? 'AE_HANDOVER' : 'SPV_AO'
        }));

      if (toAdd.length === 0) return f;

      return {
        ...f,
        document_checklists: [...f.document_checklists, ...toAdd]
      };
    });
  };

  const updateDoc = (id, field, value) => setForm(f => {
    const updatedChecklists = f.document_checklists.map(d => {
      if (d.id !== id) return d;
      const updated = { ...d, [field]: value };
      if (field === 'ori_date' && value) {
        updated.isCompleted = true;
      }
      return updated;
    });

    const aeDocs = updatedChecklists.filter(d => (d.category || 'OTHERS') === 'AE');
    const fisheryDocs = updatedChecklists.filter(d => (d.category || 'OTHERS') === 'FISHERY');
    const pabrikDocs = updatedChecklists.filter(d => (d.category || 'OTHERS') === 'PABRIK');

    const getLatestOri = (docs) => {
      const list = docs.map(d => d.ori_date).filter(Boolean).sort();
      return list.length > 0 ? list[list.length - 1] : '';
    };
    const getEarliestDraft = (docs) => {
      const list = docs.map(d => d.draft_date).filter(Boolean).sort();
      return list.length > 0 ? list[0] : '';
    };

    const newCatTracking = {
      AE: {
        draft_date: getEarliestDraft(aeDocs) || f.category_tracking?.AE?.draft_date || '',
        ori_date: getLatestOri(aeDocs) || f.category_tracking?.AE?.ori_date || ''
      },
      FISHERY: {
        draft_date: getEarliestDraft(fisheryDocs) || f.category_tracking?.FISHERY?.draft_date || '',
        ori_date: getLatestOri(fisheryDocs) || f.category_tracking?.FISHERY?.ori_date || ''
      },
      PABRIK: {
        draft_date: getEarliestDraft(pabrikDocs) || f.category_tracking?.PABRIK?.draft_date || '',
        ori_date: getLatestOri(pabrikDocs) || f.category_tracking?.PABRIK?.ori_date || ''
      }
    };

    return {
      ...f,
      document_checklists: updatedChecklists,
      category_tracking: newCatTracking,
      email_draft_date: newCatTracking.AE.draft_date || f.email_draft_date,
      email_ori_date: newCatTracking.AE.ori_date || f.email_ori_date
    };
  });

  const toggleDoc = (id) => setForm(f => ({
    ...f,
    document_checklists: f.document_checklists.map(d => d.id === id ? { ...d, isCompleted: !d.isCompleted } : d)
  }));

  const removeDoc = (id) => setForm(f => ({
    ...f,
    document_checklists: f.document_checklists.filter(d => d.id !== id)
  }));

  const uncompletedDocs = form.document_checklists.filter(d => !d.isCompleted);
  const totalDocsCount = form.document_checklists.length;
  const completedDocsCount = form.document_checklists.filter(d => d.isCompleted).length;
  const docCompletionPct = totalDocsCount === 0 ? 0 : Math.round((completedDocsCount / totalDocsCount) * 100);
  const currentStatusCfg = OPERATIONAL_STATUS_CONFIG[form.operational_status];
  const currentStageTip = STAGE_GUIDANCE[form.document_stage];

  const handleAddRemarksTag = (tag) => {
    setForm(f => ({
      ...f,
      remarks: f.remarks ? `${f.remarks}\n${tag}` : tag
    }));
  };

  const setCategoryDate = (catKey, field, val) => {
    setForm(f => {
      const updatedCat = {
        ...(f.category_tracking[catKey] || {}),
        [field]: val
      };
      const updatedTracking = {
        ...f.category_tracking,
        [catKey]: updatedCat
      };
      return {
        ...f,
        category_tracking: updatedTracking,
        email_draft_date: catKey === 'AE' && field === 'draft_date' ? val : f.email_draft_date,
        email_ori_date: catKey === 'AE' && field === 'ori_date' ? val : f.email_ori_date,
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await api(`/v2/ao-workboard/staff/jobs/${job.id}/execution`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          pending_docs: JSON.stringify(form.pending_docs),
          document_checklists: JSON.stringify(form.document_checklists),
          category_tracking: JSON.stringify(form.category_tracking)
        })
      });
      if (res.success) {
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
        onSaved();
      } else {
        setErr(res.message || 'Gagal menyimpan data');
      }
    } catch (e) {
      setErr(e.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Anda yakin ingin menyelesaikan shipment ini? Job akan dipindahkan ke Vault.")) return;
    setSaving(true);
    setErr(null);
    try {
      await api(`/v2/ao-workboard/staff/jobs/${job.id}/execution`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          pending_docs: JSON.stringify(form.pending_docs),
          document_checklists: JSON.stringify(form.document_checklists),
          category_tracking: JSON.stringify(form.category_tracking)
        })
      });
      const res = await api(`/v2/ao-workboard/jobs/${job.id}/complete`, { method: 'PUT' });
      if (res.success) {
        onSaved();
        onClose();
      } else {
        setErr(res.message || 'Gagal menyelesaikan shipment');
      }
    } catch (e) {
      setErr(e.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ao-wb-inline-workstation">
      {/* ── Top Bar: Job Info & Stepper ── */}
      <div className="ao-wb-workstation-head">
        <div className="ao-wb-workstation-title-group">
          <div className="ao-wb-ws-badge">LEMBAR PENGERJAAN AO</div>
          <div className="ao-wb-ws-inv">
            Invoice: <span className="ao-wb-mono">{job.invoice_no}</span> · {job.buyer}
            <span className="ao-wb-ws-port">({job.destination})</span>
          </div>
        </div>
        <button type="button" className="ao-wb-ws-btn-collapse" onClick={onClose} title="Tutup Panel">
          <ChevronUp size={16} /> Tutup
        </button>
      </div>

      {/* ── Interactive Stage Stepper ── */}
      <div className="ao-wb-stepper-container">
        <div className="ao-wb-stepper-title">
          <Layers size={14} style={{ color: '#0071e3' }} />
          <span>Tahapan Pengerjaan Dokumen</span>
          <span className="ao-wb-stepper-hint">(Klik tahapan untuk mengubah status secara langsung)</span>
        </div>
        <div className="ao-wb-stepper-bar">
          {STAGES.map((s, idx) => {
            const currentIdx = STAGES.findIndex(item => item.key === form.document_stage);
            const isActive = form.document_stage === s.key;
            const isPast = currentIdx > idx;
            return (
              <button
                key={s.key}
                type="button"
                className={`ao-wb-stepper-step ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}`}
                onClick={() => set('document_stage', s.key)}
              >
                <div className="ao-wb-stepper-circle">
                  {isPast ? <Check size={12} strokeWidth={3} /> : s.step}
                </div>
                <span className="ao-wb-stepper-name">{s.label.replace(/^\d+\.\s*/, '')}</span>
                {idx < STAGES.length - 1 && <div className="ao-wb-stepper-line" />}
              </button>
            );
          })}
        </div>
      </div>

      {err && (
        <div className="ao-wb-alert-banner error">
          <AlertTriangle size={15} /> {err}
        </div>
      )}

      {/* ── 2-Column Bento Layout ── */}
      <div className="ao-wb-workstation-grid">
        {/* Kolom Kiri: Checklist Dokumen */}
        <div className="ao-wb-workstation-col">
          <div className="ao-wb-card-box">
            <div className="ao-wb-box-header">
              <FileText size={15} style={{ color: '#0071e3' }} />
              <span>Checklist Kebutuhan Dokumen</span>
            </div>

            {/* Urutan Kategori: DOKUMEN AE -> DOKUMEN FISHERY -> DOKUMEN PABRIK -> DOKUMEN OTHERS */}
            {[
              {
                key: 'AE',
                title: 'DOKUMEN AE',
                sub: 'Dokumen Handover dari Staf AE',
                emptyText: 'Belum ada dokumen yang diserahkan dari Staf AE',
                canAdd: false
              },
              {
                key: 'FISHERY',
                title: 'DOKUMEN FISHERY',
                sub: 'Persyaratan dari Setting SO (Ka Vicky)',
                emptyText: 'Belum ada dokumen Fishery (ditambahkan dari Setting SO Ka Vicky)',
                canAdd: true,
                addLabel: '+ Tambah Dokumen Fishery'
              },
              {
                key: 'PABRIK',
                title: 'DOKUMEN PABRIK',
                sub: 'Persyaratan dari Setting SO (Ka Vicky)',
                emptyText: 'Belum ada dokumen Pabrik (ditambahkan dari Setting SO Ka Vicky)',
                canAdd: true,
                addLabel: '+ Tambah Dokumen Pabrik'
              },
              {
                key: 'OTHERS',
                title: 'DOKUMEN OTHERS',
                sub: 'Dokumen Tambahan / Lainnya',
                emptyText: 'Belum ada dokumen tambahan lainnya',
                canAdd: true,
                addLabel: '+ Tambah Dokumen Lainnya'
              }
            ].map(cat => {
              const categoryDocs = form.document_checklists.filter(d => (d.category || 'OTHERS') === cat.key);
              const completedCount = categoryDocs.filter(d => d.isCompleted).length;
              const percentage = categoryDocs.length === 0 ? 0 : Math.round((completedCount / categoryDocs.length) * 100);

              return (
                <div key={cat.key} className="ao-wb-checklist-group">
                  <div className="ao-wb-checklist-group-head">
                    <div>
                      <span className="ao-wb-cat-tag">{cat.title}</span>
                      <div style={{ fontSize: 10, color: '#86868b', marginTop: 1 }}>{cat.sub}</div>
                    </div>
                    <div className="ao-wb-cat-progress">
                      <span className="ao-wb-cat-pct" style={{ color: percentage === 100 && categoryDocs.length > 0 ? '#10b981' : '#64748b' }}>
                        {percentage}% ({completedCount}/{categoryDocs.length})
                      </span>
                    </div>
                  </div>

                  {categoryDocs.length > 0 && (
                    <div className="ao-wb-progress-track">
                      <div 
                        className="ao-wb-progress-fill" 
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: percentage === 100 ? '#10b981' : '#0071e3' 
                        }} 
                      />
                    </div>
                  )}

                  {categoryDocs.length === 0 ? (
                    <div className="ao-wb-cat-empty-box">
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>{cat.emptyText}</span>
                      {cat.canAdd && (
                        <button
                          type="button"
                          className="ao-wb-btn-add-doc"
                          onClick={() => addDoc(cat.key)}
                        >
                          {cat.addLabel}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="ao-wb-checklist-items">
                      {categoryDocs.map(doc => (
                        <div key={doc.id} className={`ao-wb-checklist-item ${doc.isCompleted ? 'is-done' : ''}`}>
                          <button
                            type="button"
                            className={`ao-wb-check-toggle ${doc.isCompleted ? 'checked' : ''}`}
                            onClick={() => toggleDoc(doc.id)}
                            title={doc.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
                          >
                            <Check size={13} strokeWidth={3} />
                          </button>
                          <input
                            type="text"
                            className="ao-wb-doc-name-input"
                            value={doc.name}
                            onChange={e => updateDoc(doc.id, 'name', e.target.value)}
                            placeholder="Nama Dokumen"
                            readOnly={cat.key === 'AE'}
                          />
                          <AppleDateInput
                            value={doc.deadline || ''}
                            onChange={val => updateDoc(doc.id, 'deadline', val)}
                            placeholder="Set Tanggal"
                            compact
                          />
                          {cat.key !== 'AE' && (
                            <button
                              type="button"
                              className="ao-wb-doc-del-btn"
                              onClick={() => removeDoc(doc.id)}
                              title="Hapus Dokumen"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}

                      {cat.canAdd && (
                        <button
                          type="button"
                          className="ao-wb-btn-add-doc"
                          onClick={() => addDoc(cat.key)}
                        >
                          {cat.addLabel}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Operasional, Tracking & Supervisor Reminder */}
        <div className="ao-wb-workstation-col">
          {/* Reminder Notes from Supervisor (Ka Vicky) */}
          {job.reminder_notes && (
            <div className="ao-wb-spv-banner">
              <AlertCircle size={18} className="ao-wb-spv-icon" />
              <div>
                <div className="ao-wb-spv-title">PESAN DARI SUPERVISOR (KA VICKY)</div>
                <div className="ao-wb-spv-desc">{job.reminder_notes}</div>
              </div>
            </div>
          )}

          {/* Status Pengerjaan & Tindakan (Action) */}
          <div className="ao-wb-card-box">
            <div className="ao-wb-box-header">
              <Briefcase size={15} style={{ color: '#0071e3' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Status Pengerjaan & Tindakan Lanjutan</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: '#86868b' }}>
                  Pantau kondisi invoice, pilih tindakan berikutnya, dan beri catatan pengerjaan
                </span>
              </div>
            </div>

            <div className="ao-wb-form-grid-2">
              {/* Kolom 1: Status Pengerjaan */}
              <div>
                <label className="ao-wb-field-label">Status Pengerjaan Saat Ini</label>
                <select 
                  className="ao-wb-select"
                  value={form.operational_status}
                  onChange={e => set('operational_status', e.target.value)}
                >
                  <option value="">-- Pilih Kondisi Dokumen --</option>
                  {Object.entries(OPERATIONAL_STATUS_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>
                      {cfg.icon} {cfg.label}
                    </option>
                  ))}
                </select>

                {/* Deskripsi status terpilih */}
                {currentStatusCfg && (
                  <div 
                    className="ao-wb-status-desc-banner" 
                    style={{ background: currentStatusCfg.bg, borderColor: currentStatusCfg.border }}
                  >
                    <span className="ao-wb-status-desc-icon">{currentStatusCfg.icon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span className="ao-wb-status-desc-label" style={{ color: currentStatusCfg.color }}>
                        {currentStatusCfg.label}
                      </span>
                      <p className="ao-wb-status-desc-text">{currentStatusCfg.desc}</p>
                    </div>
                  </div>
                )}

                {/* ── Widget Ringkasan Ketentuan SO & Info Pengiriman ── */}
                <div className="ao-wb-so-summary-card">
                  <div className="ao-wb-so-card-title">
                    <Ship size={12} color="#0071e3" />
                    <span>Ketentuan SO & Info Pengiriman</span>
                  </div>

                  <div className="ao-wb-so-grid">
                    <div className="ao-wb-so-item">
                      <span className="ao-wb-so-label">Incoterm</span>
                      <span className="ao-wb-so-badge incoterm">
                        {job.terms_incoterm || 'FOB'}
                      </span>
                    </div>
                    <div className="ao-wb-so-item">
                      <span className="ao-wb-so-label">Syarat Bayar</span>
                      <span className="ao-wb-so-badge payment" title={job.terms_payment || 'Belum ditentukan'}>
                        {job.terms_payment || 'T/T DP & Pelunasan'}
                      </span>
                    </div>
                    <div className="ao-wb-so-item">
                      <span className="ao-wb-so-label">Tujuan</span>
                      <span className="ao-wb-so-val" title={job.destination || '—'}>{job.destination || '—'}</span>
                    </div>
                    <div className="ao-wb-so-item">
                      <span className="ao-wb-so-label">Kapal / Liner</span>
                      <span className="ao-wb-so-val" title={[job.vessel, job.liner].filter(Boolean).join(' · ') || '—'}>
                        {[job.vessel, job.liner].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </div>
                    <div className="ao-wb-so-item">
                      <span className="ao-wb-so-label">Jadwal Kapal</span>
                      <span className="ao-wb-so-val">
                        {job.atd ? `ATD: ${fmtDate(job.atd)}` : job.etd ? `ETD: ${fmtDate(job.etd)}` : '—'}
                      </span>
                    </div>
                    <div className="ao-wb-so-item">
                      <span className="ao-wb-so-label">Volume Kargo</span>
                      <span className="ao-wb-so-val">
                        {job.container_qty ? `${job.container_qty} FCL / Container` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Meter Ringkas Kesiapan Dokumen */}
                  <div className="ao-wb-so-doc-meter">
                    <div className="ao-wb-so-meter-head">
                      <span>Kesiapan Berkas Dokumen:</span>
                      <strong style={{ color: totalDocsCount > 0 && completedDocsCount === totalDocsCount ? '#16a34a' : '#0071e3' }}>
                        {completedDocsCount}/{totalDocsCount} ({docCompletionPct}%)
                      </strong>
                    </div>
                    <div className="ao-wb-so-meter-bar">
                      <div 
                        className="ao-wb-so-meter-fill" 
                        style={{ 
                          width: `${docCompletionPct}%`,
                          backgroundColor: completedDocsCount === totalDocsCount && totalDocsCount > 0 ? '#16a34a' : '#0071e3'
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom 2: Tindakan Selanjutnya */}
              <div>
                <label className="ao-wb-field-label">Tindakan / Langkah Selanjutnya</label>
                <input 
                  className="ao-wb-input"
                  value={form.current_action}
                  onChange={e => set('current_action', e.target.value)}
                  placeholder="Ketik tindakan atau pilih tombol cepat di bawah..."
                />

                {/* Pilihan Aksi Cepat (1-Klik Pasang) */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={11} color="#0071e3" /> Pilihan Tindakan Cepat (1-Klik):
                  </div>
                  <div className="ao-wb-quick-chips-wrap">
                    {QUICK_ACTIONS.map(qa => (
                      <button
                        key={qa.label}
                        type="button"
                        className="ao-wb-quick-chip"
                        onClick={() => set('current_action', qa.action)}
                        title={qa.action}
                      >
                        <span>{qa.icon}</span>
                        <span>{qa.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Panduan Pintar Sesuai Tahapan */}
            {currentStageTip && (
              <div className="ao-wb-stage-tip-box">
                <span className="ao-wb-stage-tip-icon">💡</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="ao-wb-stage-tip-title">{currentStageTip.title}:</span>
                  <span className="ao-wb-stage-tip-text"> {currentStageTip.tip}</span>
                </div>
                <button
                  type="button"
                  className="ao-wb-btn-apply-tip"
                  onClick={() => set('current_action', currentStageTip.action)}
                  title="Gunakan rekomendasi ini sebagai tindakan aktif"
                >
                  Gunakan Aksi
                </button>
              </div>
            )}

            {/* Ringkasan Dokumen Belum Selesai (Blocker Otomatis) */}
            {uncompletedDocs.length > 0 && (
              <div className="ao-wb-pending-summary-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <AlertTriangle size={13} color="#ea580c" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9a3412' }}>
                    {uncompletedDocs.length} Dokumen Belum Selesai:
                  </span>
                  <span style={{ fontSize: 11.5, color: '#c2410c' }}>
                    {uncompletedDocs.slice(0, 3).map(d => d.name || 'Dokumen tanpa nama').join(', ')}
                    {uncompletedDocs.length > 3 ? ` (+${uncompletedDocs.length - 3} lainnya)` : ''}
                  </span>
                </div>
                <span style={{ fontSize: 10.5, color: '#9a3412', fontStyle: 'italic' }}>
                  Periksa checklist di sebelah kiri
                </span>
              </div>
            )}

            {/* Catatan & Keterangan Tambahan */}
            <div style={{ marginTop: 14 }}>
              <div className="ao-wb-remarks-header">
                <label className="ao-wb-field-label" style={{ marginBottom: 0 }}>
                  Catatan Pengerjaan & Kendala
                </label>
                <div className="ao-wb-remarks-tags">
                  <span style={{ fontSize: 10, color: '#86868b', marginRight: 2 }}>Sisipkan Tag:</span>
                  {REMARKS_TAGS.map(t => (
                    <button
                      key={t.label}
                      type="button"
                      className="ao-wb-tag-btn"
                      onClick={() => handleAddRemarksTag(t.tag)}
                      title={`Tambahkan ${t.tag} ke catatan`}
                    >
                      +{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="ao-wb-textarea"
                rows={2}
                value={form.remarks}
                onChange={e => set('remarks', e.target.value)}
                placeholder="Tuliskan catatan pengerjaan, instruksi khusus pembeli, atau kendala yang dihadapi..."
              />
            </div>
          </div>

          {/* Tracking Jadwal & Delivery */}
          <div className="ao-wb-card-box">
            <div className="ao-wb-box-header">
              <Clock size={15} style={{ color: '#0071e3' }} />
              <span>Tracking Jadwal, Dokumen & Delivery</span>
            </div>

            {/* ── Segmented Control Tabs (AE, Fishery, Pabrik, Semua) ── */}
            <div className="ao-wb-tracking-segmented-tabs">
              {TRACKING_CATEGORIES.map(cat => {
                const count = form.document_checklists.filter(d => (d.category || 'OTHERS') === cat.key).length;
                const isSelected = activeTrackCat === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    className={`ao-wb-seg-tab ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveTrackCat(cat.key)}
                  >
                    <span className="ao-wb-seg-tab-icon">{cat.badgeText.split(' ')[0]}</span>
                    <span className="ao-wb-seg-tab-label">{cat.title}</span>
                    <span className={`ao-wb-seg-tab-badge ${count > 0 ? 'has-count' : ''}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                className={`ao-wb-seg-tab ${activeTrackCat === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTrackCat('ALL')}
              >
                <span className="ao-wb-seg-tab-icon">📑</span>
                <span className="ao-wb-seg-tab-label">Tampilkan Semua</span>
                <span className="ao-wb-seg-tab-badge has-count">
                  {form.document_checklists.length}
                </span>
              </button>
            </div>

            {/* ── Jadwal & Penyelesaian Dokumen per-masing-masing dokumen (AE, Fishery, Pabrik) ── */}
            <div className={`ao-wb-cat-tracking-list ${activeTrackCat === 'ALL' ? 'all-mode' : ''}`}>
              {(activeTrackCat === 'ALL' ? TRACKING_CATEGORIES : TRACKING_CATEGORIES.filter(c => c.key === activeTrackCat)).map(cat => {
                const categoryDocs = form.document_checklists.filter(d => (d.category || 'OTHERS') === cat.key);
                const completedDocs = categoryDocs.filter(d => d.ori_date || d.isCompleted);
                const readyPct = categoryDocs.length > 0 ? Math.round((completedDocs.length / categoryDocs.length) * 100) : 0;
                const isFixedCard = activeTrackCat !== 'ALL';

                return (
                  <div key={cat.key} className={`ao-wb-cat-tracking-card ${cat.badgeClass} ${isFixedCard ? 'fixed-mode' : ''}`}>
                    <div className="ao-wb-cat-tracking-head">
                      <div className="ao-wb-cat-tracking-title">
                        <span className={`ao-wb-cat-tracking-badge ${cat.badgeClass}`}>{cat.badgeText}</span>
                        <span className="ao-wb-cat-tracking-sub">{cat.sub}</span>
                      </div>
                      <div>
                        {categoryDocs.length > 0 ? (
                          <span className={`ao-wb-cat-status-tag ${readyPct === 100 ? 'done' : readyPct > 0 ? 'draft' : 'empty'}`}>
                            {completedDocs.length}/{categoryDocs.length} Siap ({readyPct}%)
                          </span>
                        ) : (
                          <span className="ao-wb-cat-status-tag empty">Belum Ada Dokumen</span>
                        )}
                      </div>
                    </div>

                    {categoryDocs.length === 0 ? (
                      <div className={`ao-wb-doc-track-empty ${isFixedCard ? 'in-fixed' : ''}`}>
                        <p>{cat.emptyNotice}</p>
                        <div className="ao-wb-preset-actions">
                          <button
                            type="button"
                            className="ao-wb-btn-preset"
                            onClick={() => loadPresetDocs(cat.key, cat.defaultDocs)}
                          >
                            <Sparkles size={12} style={{ color: '#0071e3' }} />
                            Muat Rekomendasi Dokumen ({cat.defaultDocs.length} Berkas)
                          </button>
                          <button
                            type="button"
                            className="ao-wb-btn-preset"
                            onClick={() => addDoc(cat.key)}
                          >
                            <Plus size={12} />
                            + Tambah Dokumen Manual
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="ao-wb-doc-track-scroll-area">
                          {categoryDocs.map((doc, idx) => {
                            const hasOri = !!doc.ori_date;
                            const hasDraft = !!doc.draft_date;
                            return (
                              <div key={doc.id || idx} className={`ao-wb-doc-track-row ${hasOri ? 'is-complete' : ''}`}>
                                <div className="ao-wb-doc-track-top">
                                  <div className="ao-wb-doc-track-name">
                                    <span className={`ao-wb-doc-track-dot ${hasOri ? 'done' : hasDraft ? 'draft' : 'empty'}`} />
                                    <input
                                      type="text"
                                      className="ao-wb-doc-inline-name"
                                      value={doc.name || ''}
                                      onChange={e => updateDoc(doc.id, 'name', e.target.value)}
                                      placeholder="Nama Dokumen"
                                      readOnly={cat.key === 'AE'}
                                    />
                                    {doc.source === 'SPV_AO' && (
                                      <span className="ao-wb-doc-source-tag vicky">Setting SO Ka Vicky</span>
                                    )}
                                    {doc.source === 'AE_HANDOVER' && (
                                      <span className="ao-wb-doc-source-tag ae">Handover AE</span>
                                    )}
                                  </div>
                                  <div className="ao-wb-doc-track-status">
                                    {hasOri ? (
                                      <span className="ao-wb-cat-status-tag done">✓ Dokumen Asli Siap</span>
                                    ) : hasDraft ? (
                                      <span className="ao-wb-cat-status-tag draft">Draft Terkirim</span>
                                    ) : (
                                      <span className="ao-wb-cat-status-tag empty">Belum Diisi</span>
                                    )}
                                    {cat.key !== 'AE' && (
                                      <button
                                        type="button"
                                        className="ao-wb-doc-del-btn"
                                        onClick={() => removeDoc(doc.id)}
                                        title="Hapus Dokumen"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="ao-wb-doc-track-dates">
                                  <div>
                                    <label className="ao-wb-mini-label">{cat.draftLabel}</label>
                                    <AppleDateInput
                                      value={doc.draft_date || ''}
                                      onChange={val => updateDoc(doc.id, 'draft_date', val)}
                                      placeholder={cat.draftPlaceholder}
                                      compact
                                      fullWidth
                                    />
                                  </div>
                                  <div>
                                    <label className="ao-wb-mini-label">{cat.oriLabel}</label>
                                    <AppleDateInput
                                      value={doc.ori_date || ''}
                                      onChange={val => updateDoc(doc.id, 'ori_date', val)}
                                      placeholder={cat.oriPlaceholder}
                                      compact
                                      fullWidth
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', justifyContent: 'flex-start' }}>
                          <button
                            type="button"
                            className="ao-wb-btn-add-item"
                            onClick={() => addDoc(cat.key)}
                          >
                            <Plus size={12} /> + Tambah Dokumen {cat.title} Baru
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Dokumen Others jika ada dan mode ALL */}
              {activeTrackCat === 'ALL' && (() => {
                const otherDocs = form.document_checklists.filter(d => (d.category || 'OTHERS') === 'OTHERS');
                if (otherDocs.length === 0) return null;
                return (
                  <div className="ao-wb-cat-tracking-card others" style={{ borderLeft: '4px solid #8b5cf6', background: '#faf8ff' }}>
                    <div className="ao-wb-cat-tracking-head">
                      <div className="ao-wb-cat-tracking-title">
                        <span className="ao-wb-cat-tracking-badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
                          📑 DOKUMEN OTHERS
                        </span>
                        <span className="ao-wb-cat-tracking-sub">Dokumen Tambahan / Operasional Lainnya</span>
                      </div>
                      <span className="ao-wb-cat-status-tag draft">{otherDocs.length} Dokumen</span>
                    </div>

                    <div className="ao-wb-doc-track-scroll-area">
                      {otherDocs.map((doc, idx) => {
                        const hasOri = !!doc.ori_date;
                        const hasDraft = !!doc.draft_date;
                        return (
                          <div key={doc.id || idx} className={`ao-wb-doc-track-row ${hasOri ? 'is-complete' : ''}`}>
                            <div className="ao-wb-doc-track-top">
                              <div className="ao-wb-doc-track-name">
                                <span className={`ao-wb-doc-track-dot ${hasOri ? 'done' : hasDraft ? 'draft' : 'empty'}`} />
                                <input
                                  type="text"
                                  className="ao-wb-doc-inline-name"
                                  value={doc.name || ''}
                                  onChange={e => updateDoc(doc.id, 'name', e.target.value)}
                                  placeholder="Nama Dokumen"
                                />
                              </div>
                              <div className="ao-wb-doc-track-status">
                                {hasOri ? (
                                  <span className="ao-wb-cat-status-tag done">✓ Dokumen Asli Siap</span>
                                ) : hasDraft ? (
                                  <span className="ao-wb-cat-status-tag draft">Draft Terkirim</span>
                                ) : (
                                  <span className="ao-wb-cat-status-tag empty">Belum Diisi</span>
                                )}
                                <button
                                  type="button"
                                  className="ao-wb-doc-del-btn"
                                  onClick={() => removeDoc(doc.id)}
                                  title="Hapus Dokumen"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="ao-wb-doc-track-dates">
                              <div>
                                <label className="ao-wb-mini-label">Tanggal Draft</label>
                                <AppleDateInput
                                  value={doc.draft_date || ''}
                                  onChange={val => updateDoc(doc.id, 'draft_date', val)}
                                  placeholder="Pilih Tanggal Draft"
                                  compact
                                  fullWidth
                                />
                              </div>
                              <div>
                                <label className="ao-wb-mini-label">Tanggal Dokumen Asli / Selesai</label>
                                <AppleDateInput
                                  value={doc.ori_date || ''}
                                  onChange={val => updateDoc(doc.id, 'ori_date', val)}
                                  placeholder="Pilih Tanggal Asli"
                                  compact
                                  fullWidth
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Sub-divider Sertifikat & Ekspedisi ── */}
            <div className="ao-wb-cat-sub-divider">
              <span>Sertifikat Khusus & Ekspedisi Pengiriman</span>
            </div>

            <div className="ao-wb-form-grid-2" style={{ marginTop: 12 }}>
              <div>
                <label className="ao-wb-field-label">CC Due Date</label>
                <AppleDateInput
                  value={form.cc_due_date}
                  onChange={val => set('cc_due_date', val)}
                  placeholder="Due Date CC"
                  fullWidth
                />
              </div>
              <div>
                <label className="ao-wb-field-label">CC Done Date</label>
                <AppleDateInput
                  value={form.cc_done_date}
                  onChange={val => set('cc_done_date', val)}
                  placeholder="CC Selesai"
                  fullWidth
                />
              </div>
            </div>

            <div className="ao-wb-form-grid-3" style={{ marginTop: 12 }}>
              <div>
                <label className="ao-wb-field-label">Status DSCS</label>
                <select 
                  className="ao-wb-select" 
                  value={form.dscs_status} 
                  onChange={e => set('dscs_status', e.target.value)}
                >
                  <option value="PREPARATION">PREPARATION</option>
                  <option value="VERIFICATION">VERIFICATION</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <div>
                <label className="ao-wb-field-label">DSCS Due Date</label>
                <AppleDateInput
                  value={form.dscs_due_date}
                  onChange={val => set('dscs_due_date', val)}
                  placeholder="Due Date DSCS"
                  fullWidth
                />
              </div>
              <div>
                <label className="ao-wb-field-label">DSCS Done Date</label>
                <AppleDateInput
                  value={form.dscs_done_date}
                  onChange={val => set('dscs_done_date', val)}
                  placeholder="DSCS Selesai"
                  fullWidth
                />
              </div>
            </div>

            <div className="ao-wb-form-grid-2" style={{ marginTop: 12 }}>
              <div>
                <label className="ao-wb-field-label">Status Kurir / Resi</label>
                <input 
                  className="ao-wb-input" 
                  value={form.courier_status} 
                  onChange={e => set('courier_status', e.target.value)} 
                  placeholder="DHL, Telex, No. Resi..." 
                />
              </div>
              <div>
                <label className="ao-wb-field-label">Status Submit Bank</label>
                <input 
                  className="ao-wb-input" 
                  value={form.bank_submission_status} 
                  onChange={e => set('bank_submission_status', e.target.value)} 
                  placeholder="Status Bank / Pembayaran..." 
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="ao-wb-field-label">Update Estimasi Kedatangan (ETA Update)</label>
              <AppleDateInput
                value={form.eta_update}
                onChange={val => set('eta_update', val)}
                placeholder="Pilih Pembaruan ETA"
                fullWidth
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Bar Footer ── */}
      <div className="ao-wb-workstation-footer">
        <div className="ao-wb-footer-left">
          <button type="button" className="ao-wb-btn-close-drawer" onClick={onClose}>
            <ChevronUp size={14} /> Tutup Pengerjaan
          </button>
          {saveToast && (
            <span className="ao-wb-toast-inline">
              <CheckCircle size={15} color="#16a34a" /> Data pengerjaan berhasil disimpan!
            </span>
          )}
        </div>

        <div className="ao-wb-footer-right">
          {form.document_stage === 'COMPLETED' && (
            <button
              type="button"
              className="ao-wb-btn-complete-shipment"
              data-testid="ao-workboard-complete"
              disabled={saving}
              onClick={handleComplete}
            >
              {saving ? <RefreshCw size={14} className="ao-spin" /> : <CheckCircle size={14} />}
              {saving ? 'Menyelesaikan...' : 'Selesaikan Shipment (Vault)'}
            </button>
          )}
          <button
            type="button"
            className="ao-wb-btn-save-inline"
            data-testid="ao-workboard-save"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? <RefreshCw size={14} className="ao-spin" /> : <Save size={14} />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Handover Card Component (Buku Ekspedisi Masuk)
// ──────────────────────────────────────────────────────────────────
const HandoverCard = ({ item, onAccept, accepting }) => {
  const isAccepted = item.status === 'ACCEPTED';
  const docs = item.documents && item.documents.length > 0
    ? item.documents
    : (item.handover_type ? item.handover_type.split(',').map(s => s.trim()) : ['Dokumen Ekspor']);

  return (
    <div className={`ao-wb-handover-card${isAccepted ? ' accepted' : ''}`}>
      <div className="ao-wb-handover-head">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <div className="ao-wb-handover-inv">INV: {item.invoice_no}</div>
            <div className="ao-wb-handover-meta">{item.buyer} · {item.destination}</div>
          </div>
          <span className={`ao-wb-status-pill ${isAccepted ? 'accepted' : 'pending'}`}>
            {isAccepted ? <><CheckCircle size={11} /> Diterima</> : <><Clock size={11} /> Menunggu</>}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Pengirim: <strong style={{ color: '#1e293b' }}>{item.ae_sender_name || 'Staff AE'}</strong></span>
          <span>{fmtDate(item.handover_at)}</span>
        </div>
      </div>

      <div className="ao-wb-handover-docs">
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Dokumen Diserahkan ({docs.length}):
        </div>
        <div className="ao-wb-doc-list">
          {docs.map((doc, idx) => (
            <span key={idx} className="ao-wb-doc-chip">
              <FileText size={11} /> {doc}
            </span>
          ))}
        </div>
        {item.handover_remark && (
          <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginTop: '4px', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            "{item.handover_remark}"
          </div>
        )}
      </div>

      <div className="ao-wb-handover-foot">
        {isAccepted ? (
          <div className="ao-wb-accepted-label">
            <CheckCircle size={15} /> Telah Diterima ({fmtDate(item.accepted_at)})
          </div>
        ) : (
          <button 
            type="button"
            className="ao-wb-btn-accept"
            onClick={() => onAccept(item)}
            disabled={accepting === item.id}
          >
            {accepting === item.id ? (
              <><RefreshCw size={14} className="animate-spin" /> Memproses...</>
            ) : (
              <><CheckCircle size={14} /> Terima Dokumen ({docs.length})</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Job Row Component
// ──────────────────────────────────────────────────────────────────
const JobRow = ({ job, isExpanded, onToggle }) => {
  const dscsChip = job.dscs_status === 'COMPLETED' ? 'done' : job.dscs_due_date ? dateStatus(job.dscs_due_date) : '';
  const ccChip = job.cc_done_date ? 'done' : job.cc_due_date ? dateStatus(job.cc_due_date) : '';
  const stage = job.document_stage || 'PREPARATION';

  return (
    <tr 
      className={`ao-wb-table-row clickable-row ${isExpanded ? 'is-expanded' : ''}`}
      onClick={(e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;
        onToggle();
      }}
      title="Klik baris ini untuk membuka/menutup lembar pengerjaan dokumen"
    >
      <td className="ao-wb-cell-inv">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className={`ao-wb-expand-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            title={isExpanded ? 'Tutup Pengerjaan' : 'Buka Pengerjaan'}
          >
            <ChevronRight size={14} className="ao-wb-chevron-icon" />
          </button>
          <div>
            <div className="ao-wb-inv-mono">{job.invoice_no}</div>
            {job.job_code && <div style={{ fontSize: 10, color: '#86868b', marginTop: 2 }}>{job.job_code}</div>}
          </div>
        </div>
      </td>
      <td>
        <div className="ao-wb-buyer">{job.buyer}</div>
        <div className="ao-wb-port">{job.destination}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', fontSize: '10px', color: '#64748b' }}>
          <div><strong>ETD:</strong> {fmtDate(job.etd)} | <strong>ATD:</strong> {fmtDate(job.atd)}</div>
          <div><strong>ETA:</strong> {fmtDate(job.eta)} | <strong>ETA Update:</strong> {fmtDate(job.eta_update)}</div>
        </div>
      </td>
      <td>
        <div className="ao-wb-status-model">
          {job.current_action && <span className="ao-wb-action-pill"><ChevronRight size={10} />{job.current_action}</span>}
          {!job.current_action && job.operational_status && (
            <span className="ao-wb-action-pill">
              {OPERATIONAL_STATUS_CONFIG[job.operational_status]?.label || job.operational_status}
            </span>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
            <span style={{ fontWeight: stage === 'PREPARATION' ? 700 : 400, color: stage === 'PREPARATION' ? '#1d4ed8' : 'inherit' }}>Prep</span>
            <ChevronRight size={8} />
            <span style={{ fontWeight: stage === 'DRAFT' ? 700 : 400, color: stage === 'DRAFT' ? '#1d4ed8' : 'inherit' }}>Draft</span>
            <ChevronRight size={8} />
            <span style={{ fontWeight: stage === 'FINAL_DRAFT' ? 700 : 400, color: stage === 'FINAL_DRAFT' ? '#1d4ed8' : 'inherit' }}>Fin</span>
            <ChevronRight size={8} />
            <span style={{ fontWeight: stage === 'ORIGINAL' ? 700 : 400, color: stage === 'ORIGINAL' ? '#1d4ed8' : 'inherit' }}>Ori</span>
            <ChevronRight size={8} />
            <span style={{ fontWeight: stage === 'SUBMIT_BANK' ? 700 : 400, color: stage === 'SUBMIT_BANK' ? '#1d4ed8' : 'inherit' }}>Bank</span>
          </div>

          {/* Quick Progress Bar for all docs */}
          {(() => {
            const docs = parseChecklists(job.document_checklists);
            if (docs.length === 0) return null;
            const completed = docs.filter(d => d.isCompleted).length;
            const pct = Math.round((completed / docs.length) * 100);
            return (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748b', marginBottom: 2 }}>
                  <span>Kelengkapan Dokumen</span>
                  <span style={{ color: pct === 100 ? '#10b981' : 'inherit', fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 3, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: pct === 100 ? '#10b981' : '#3b82f6', width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })()}

          {job.remarks && <div className="ao-wb-remark" style={{ marginTop: 6 }}>{job.remarks}</div>}
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {job.email_draft_date && <span className="ao-wb-date-chip"><Send size={10} /> Draft {fmtDate(job.email_draft_date)}</span>}
          {job.email_ori_date && <span className="ao-wb-date-chip done"><Send size={10} /> ORI {fmtDate(job.email_ori_date)}</span>}
          {!job.email_draft_date && !job.email_ori_date && <span style={{ fontSize: 11, color: '#c7c7cc' }}>—</span>}
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className={`ao-wb-date-chip ${dscsChip}`}>
            <Package size={10} />
            {job.dscs_status || 'PREPARATION'}
            {job.dscs_due_date && ` · ${fmtDate(job.dscs_due_date)}`}
          </span>
          <span className={`ao-wb-date-chip ${ccChip}`}>
            <FileText size={10} />
            CC {job.cc_done_date ? `Done` : job.cc_due_date ? fmtDate(job.cc_due_date) : '—'}
          </span>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {job.courier_status && <span className="ao-wb-date-chip"><Truck size={10} />{job.courier_status}</span>}
          {job.bank_submission_status && <span className="ao-wb-date-chip done">{job.bank_submission_status}</span>}
          {!job.courier_status && !job.bank_submission_status && <span style={{ fontSize: 11, color: '#c7c7cc' }}>—</span>}
        </div>
      </td>
      <td>
        <button 
          type="button"
          className={`ao-wb-btn-edit ${isExpanded ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title={isExpanded ? 'Tutup Pengerjaan' : 'Buka Pengerjaan Dokumen'}
        >
          {isExpanded ? (
            <>Tutup <ChevronUp size={12} /></>
          ) : (
            <>Pengerjaan <ChevronDown size={12} /></>
          )}
        </button>
      </td>
    </tr>
  );
};

// ──────────────────────────────────────────────────────────────────
// Main AoWorkboard Component
// ──────────────────────────────────────────────────────────────────
const AoWorkboard = ({ user }) => {
  const [handovers, setHandovers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [handoverTab, setHandoverTab] = useState('pending'); // 'pending' | 'all'
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true); setError(null);
    try {
      const [hRes, jRes] = await Promise.all([
        api('/v2/ao-workboard/staff/handovers'),
        api('/v2/ao-workboard/staff/my-jobs')
      ]);
      if (hRes.success) setHandovers(hRes.data || []);
      if (jRes.success) setJobs(jRes.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAccept = async (h) => {
    setAccepting(h.id);
    try {
      const res = await api(`/v2/ao-workboard/staff/handovers/${h.id}/accept`, { method: 'POST' });
      if (res.success) {
        setHandovers(prev => prev.map(x => x.id === h.id ? { ...x, status: 'ACCEPTED', accepted_at: new Date().toISOString() } : x));
        await fetchData();
      } else { alert(res.message || 'Gagal menerima handover'); }
    } catch (e) { alert(e.message); }
    finally { setAccepting(null); }
  };

  // Computed KPIs
  const pendingHandovers = handovers.filter(h => h.status === 'PENDING');
  const inProgressJobs = jobs.filter(j => j.ao_status === 'In Progress');
  const criticalJobs = jobs.filter(j => j.etd && (new Date(j.etd) - new Date()) / 86400000 <= 3);

  // Filter jobs
  const filteredJobs = activeFilter === 'all' ? jobs
    : activeFilter === 'in_progress' ? jobs.filter(j => j.ao_status === 'In Progress')
    : activeFilter === 'critical' ? criticalJobs
    : jobs;

  if (loading) {
    return (
      <div className="ao-wb-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 14 }}>
          <RefreshCw size={24} className="ao-spin" style={{ color: '#00c7be' }} />
          <span style={{ fontSize: 15, color: '#6e6e73' }}>Memuat Workboard AO...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ao-wb-page">
      {/* Header */}
      <div className="ao-wb-header">
        <div className="ao-wb-header-top">
          <div>
            <div className="ao-wb-eyebrow">AO Staff Workboard</div>
            <h1 className="ao-wb-title">Pekerjaan Saya</h1>
            <p className="ao-wb-subtitle">
              Halo, <strong>{user?.nama || 'Staff AO'}</strong> · {jobs.length} job aktif · {pendingHandovers.length} handover masuk
            </p>
          </div>
          <button className="ao-wb-btn-refresh" disabled={refreshing} onClick={fetchData}>
            <RefreshCw size={15} className={refreshing ? 'ao-spin' : ''} />
            {refreshing ? 'Memperbarui...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="ao-wb-content">
        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 12, fontSize: 13, color: '#ff3b30', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* JANGAN LUPA DI BACA Banner */}
        <div style={{ padding: '16px', marginBottom: '24px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#1e3a8a' }}>🚨 JANGAN LUPA DI BACA! 🚨</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
              Pastikan Anda selalu <strong>update dokumen tahap demi tahap</strong>. Gunakan filter <strong>Monitoring 5 Tahapan</strong> untuk mengecek mana yang belum diselesaikan. Status ETD, ATD, ETA, dan ETA Update sangat kritikal, pastikan datanya akurat!
            </p>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="ao-wb-kpi-grid">
          <div className="ao-wb-kpi-card kpi-teal">
            <div className="ao-wb-kpi-header">
              <div className="ao-wb-kpi-icon teal"><Briefcase size={17} /></div>
              <Clock size={13} style={{ color: '#86868b' }} />
            </div>
            <div className="ao-wb-kpi-value">{jobs.length}</div>
            <div className="ao-wb-kpi-label">Total Job Aktif</div>
            <div className="ao-wb-kpi-sub">{inProgressJobs.length} In Progress</div>
          </div>
          <div className="ao-wb-kpi-card kpi-orange">
            <div className="ao-wb-kpi-header">
              <div className="ao-wb-kpi-icon orange"><Inbox size={17} /></div>
            </div>
            <div className="ao-wb-kpi-value">{filteredJobs.length}</div>
            <div className="ao-wb-kpi-label">Pekerjaan Tersaring</div>
            <div className="ao-wb-kpi-sub">Sesuai filter aktif</div>
          </div>
          <div className="ao-wb-kpi-card kpi-red">
            <div className="ao-wb-kpi-header">
              <div className="ao-wb-kpi-icon red"><AlertTriangle size={17} /></div>
              {criticalJobs.length > 0 && <div className="ao-wb-pulse-dot red" />}
            </div>
            <div className="ao-wb-kpi-value">{criticalJobs.length}</div>
            <div className="ao-wb-kpi-label">Kritis ≤ 3 Hari</div>
            <div className="ao-wb-kpi-sub">ETD terdekat</div>
          </div>
          <div className="ao-wb-kpi-card kpi-purple">
            <div className="ao-wb-kpi-header">
              <div className="ao-wb-kpi-icon purple"><CheckCircle size={17} /></div>
            </div>
            <div className="ao-wb-kpi-value">{jobs.filter(j => j.dscs_status === 'COMPLETED').length}</div>
            <div className="ao-wb-kpi-label">DSCS Selesai</div>
            <div className="ao-wb-kpi-sub">dari {jobs.length} total job</div>
          </div>
        </div>

        {/* Buku Ekspedisi Masuk (Handover Inbox dari AE) */}
        {handovers.length > 0 && (
          <div className="ao-wb-section" style={{ marginBottom: '24px' }}>
            <div className="ao-wb-section-header">
              <div className="ao-wb-section-title">
                <Inbox size={18} style={{ color: '#0071e3' }} />
                Buku Ekspedisi Masuk — Dokumen dari AE
                {pendingHandovers.length > 0 && (
                  <span style={{ 
                    fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', 
                    color: '#0071e3', padding: '3px 9px', borderRadius: '999px', border: '1px solid #bfdbfe',
                    marginLeft: '8px', letterSpacing: '0.02em'
                  }}>
                    {pendingHandovers.length} Menunggu Diterima
                  </span>
                )}
              </div>
              <div className="ao-wb-filter-tabs">
                <button 
                  className={`ao-wb-filter-tab${handoverTab === 'pending' ? ' active' : ''}`} 
                  onClick={() => setHandoverTab('pending')}
                >
                  Menunggu Diterima ({pendingHandovers.length})
                </button>
                <button 
                  className={`ao-wb-filter-tab${handoverTab === 'all' ? ' active' : ''}`} 
                  onClick={() => setHandoverTab('all')}
                >
                  Semua Riwayat ({handovers.length})
                </button>
              </div>
            </div>

            {((handoverTab === 'pending' ? pendingHandovers : handovers).length === 0) ? (
              <div className="ao-wb-empty" style={{ padding: '36px 20px', textAlign: 'center' }}>
                <CheckCircle size={36} style={{ color: '#34c759', marginBottom: '8px', display: 'inline-block' }} />
                <div style={{ fontWeight: 600, color: '#1d1d1f', fontSize: '14px' }}>Semua Dokumen Telah Diterima</div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
                  Tidak ada dokumen serah terima dari AE yang menunggu konfirmasi saat ini.
                </div>
              </div>
            ) : (
              <div className="ao-wb-handover-grid">
                {(handoverTab === 'pending' ? pendingHandovers : handovers).map(h => (
                  <HandoverCard 
                    key={h.id} 
                    item={h} 
                    onAccept={handleAccept} 
                    accepting={accepting} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Jobs Table */}
        <div className="ao-wb-section">
          <div className="ao-wb-section-header">
            <div className="ao-wb-section-title">
              <Briefcase size={18} style={{ color: '#0071e3' }} />
              Job Saya — 7 Grup Operasional
            </div>
            <div className="ao-wb-filter-tabs">
              {[
                { key: 'all', label: `Semua (${jobs.length})` },
                { key: 'in_progress', label: `In Progress (${inProgressJobs.length})` },
                { key: 'critical', label: `⚠ Kritis (${criticalJobs.length})` }
              ].map(t => (
                <button key={t.key} className={`ao-wb-filter-tab${activeFilter === t.key ? ' active' : ''}`} onClick={() => setActiveFilter(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ao-wb-table-container">
            {filteredJobs.length === 0 ? (
              <div className="ao-wb-empty">
                <div className="ao-wb-empty-icon"><Briefcase size={44} /></div>
                <p className="ao-wb-empty-title">Tidak ada job ditemukan</p>
                <p className="ao-wb-empty-sub">Belum ada job yang ditugaskan kepada Anda saat ini.</p>
              </div>
            ) : (
              <table className="ao-wb-table">
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Buyer / Tujuan</th>
                    <th>Status & Action</th>
                    <th>Email</th>
                    <th>DSCS & CC</th>
                    <th>Delivery</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => {
                    const isExpanded = expandedJobId === job.id;
                    return (
                      <React.Fragment key={job.id}>
                        <JobRow
                          job={job}
                          isExpanded={isExpanded}
                          onToggle={() => setExpandedJobId(prev => prev === job.id ? null : job.id)}
                        />
                        {isExpanded && (
                          <tr className="ao-wb-expand-row">
                            <td colSpan={7} style={{ padding: 0 }}>
                              <AoInlineWorkstation
                                job={job}
                                onClose={() => setExpandedJobId(null)}
                                onSaved={fetchData}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AoWorkboard;
