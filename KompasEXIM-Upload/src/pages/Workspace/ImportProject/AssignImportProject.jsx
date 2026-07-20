import React, { useState, useEffect, useRef } from 'react';
import useImportProjectStore from '../../../store/useImportProjectStore';
import { Edit3, Plus, X, Package, AlertCircle } from 'lucide-react';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const IMPORT_TYPES = [
  'Raw Material',
  'Indirect Mat. Food',
  'Indirect Mat. Packaging',
  'Aset',
  'Miscellaneous',
  'Reimport',
  'Reexport',
];

const EMPTY_FORM = {
  supplier: '',
  trade: '',
  importType: 'Raw Material',
  shipmentTerm: '',
  invoiceNo: '',
  billOfLadingNo: '',
  etd: '',
  eta: '',
  hsCode: '',
  freeTimeDestination: '',
};

// ─── Badge Import Type ────────────────────────────────────────────────────────
const importTypeBadgeColor = (type) => {
  const map = {
    'Raw Material': { bg: '#e5f1fc', color: '#0066cc' },
    'Indirect Mat. Food': { bg: '#e7f8ec', color: '#34c759' },
    'Indirect Mat. Packaging': { bg: '#fff2e0', color: '#ff9500' },
    'Aset': { bg: '#f0f0f0', color: '#7a7a7a' },
    'Miscellaneous': { bg: '#f0f0f0', color: '#7a7a7a' },
    'Reimport': { bg: '#ffe9e8', color: '#ff3b30' },
    'Reexport': { bg: '#f3effe', color: '#5856d6' },
  };
  return map[type] || { bg: '#f0f0f0', color: '#7a7a7a' };
};

const ImportTypeBadge = ({ value }) => {
  const { bg, color } = importTypeBadgeColor(value);
  return (
    <span style={{
      display: 'inline-block',
      backgroundColor: bg,
      color,
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: 'var(--rounded-pill)',
      padding: '3px 10px',
      whiteSpace: 'nowrap',
    }}>
      {value}
    </span>
  );
};

// ─── Form Field Component ─────────────────────────────────────────────────────
const FormField = ({ label, required, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--color-ink)',
      letterSpacing: '-0.1px',
    }}>
      {label}
      {required && <span style={{ color: 'var(--color-status-danger)', marginLeft: '3px' }}>*</span>}
    </label>
    {children}
    {error && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        color: 'var(--color-status-danger)',
        marginTop: '2px',
      }}>
        <AlertCircle size={12} />
        {error}
      </div>
    )}
  </div>
);

const inputStyle = (hasError = false) => ({
  padding: '9px 12px',
  borderRadius: 'var(--rounded-sm)',
  border: `1px solid ${hasError ? 'var(--color-status-danger)' : 'var(--color-hairline)'}`,
  fontSize: '14px',
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-family-body)',
  outline: 'none',
  backgroundColor: 'var(--color-canvas)',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
});

// ─── Format Tanggal ───────────────────────────────────────────────────────────
const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AssignImportProject = () => {
  const {
    importProjects,
    editingProject,
    addImportProject,
    updateImportProject,
    setEditingProject,
  } = useImportProjectStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [savedId, setSavedId] = useState(null); // ID yang baru saja disimpan (untuk highlight)
  const formRef = useRef(null);

  // Sinkronkan form dengan editingProject (mode edit)
  useEffect(() => {
    if (editingProject) {
      setForm({
        supplier: editingProject.supplier,
        trade: editingProject.trade,
        importType: editingProject.importType,
        shipmentTerm: editingProject.shipmentTerm,
        invoiceNo: editingProject.invoiceNo,
        billOfLadingNo: editingProject.billOfLadingNo,
        etd: editingProject.etd,
        eta: editingProject.eta,
        hsCode: editingProject.hsCode,
        freeTimeDestination: editingProject.freeTimeDestination,
      });
      setErrors({});
      // Scroll ke form saat mode edit aktif
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingProject]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Validasi semua field wajib
  const validate = () => {
    const required = [
      'supplier', 'trade', 'importType', 'shipmentTerm',
      'invoiceNo', 'billOfLadingNo', 'etd', 'eta', 'hsCode', 'freeTimeDestination',
    ];
    const newErrors = {};
    required.forEach(field => {
      if (!form[field]?.trim()) {
        const labelMap = {
          supplier: 'Supplier',
          trade: 'Trade',
          importType: 'Import Type',
          shipmentTerm: 'Shipment Term',
          invoiceNo: 'Invoice No.',
          billOfLadingNo: 'Bill of Lading No.',
          etd: 'ETD',
          eta: 'ETA',
          hsCode: 'HS Code',
          freeTimeDestination: 'Free Time Destination',
        };
        newErrors[field] = `${labelMap[field] || field} wajib diisi`;
      }
    });
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (editingProject) {
      updateImportProject(editingProject.id, form);
      setSavedId(editingProject.id);
    } else {
      const project = addImportProject(form);
      setSavedId(project.id);
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setTimeout(() => setSavedId(null), 2500);
  };

  const handleReset = () => {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
  };

  const isEditMode = !!editingProject;

  // Urutkan: terbaru di atas (by tanggalInput desc, lalu by id desc)
  const sortedProjects = [...importProjects].sort((a, b) => {
    if (b.tanggalInput !== a.tanggalInput) return b.tanggalInput.localeCompare(a.tanggalInput);
    return b.id.localeCompare(a.id);
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      backgroundColor: 'var(--color-canvas-parchment)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '28px 40px 24px',
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: 'var(--rounded-md)',
            backgroundColor: 'var(--color-status-info-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Package size={18} color="var(--color-primary)" />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            letterSpacing: '-0.374px',
            color: 'var(--color-ink)',
          }}>
            Assign Import Project
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', marginLeft: '48px' }}>
          Buat dan kelola Import Project. Setiap project akan mendapatkan Task Unique Number (IMP-XXXX) yang dapat dihubungkan ke tugas di Peta Tugas.
        </p>
      </div>

      <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* ── Form Section ── */}
        <div
          ref={formRef}
          style={{
            backgroundColor: 'var(--color-canvas)',
            borderRadius: 'var(--rounded-lg)',
            border: '1px solid var(--color-hairline)',
            overflow: 'hidden',
          }}
        >
          {/* Form Header */}
          <div style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--color-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isEditMode ? 'var(--color-status-info-bg)' : 'var(--color-canvas)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isEditMode ? <Edit3 size={18} color="var(--color-primary)" /> : <Plus size={18} color="var(--color-ink-muted-48)" />}
              <h2 style={{
                fontSize: '17px',
                fontWeight: '600',
                color: isEditMode ? 'var(--color-primary)' : 'var(--color-ink)',
                letterSpacing: '-0.374px',
              }}>
                {isEditMode
                  ? `Edit Import Project — ${editingProject.id}`
                  : 'Tambah Import Project Baru'}
              </h2>
            </div>
            {isEditMode && (
              <button
                onClick={handleReset}
                title="Batalkan edit"
                style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  border: '1px solid var(--color-hairline)',
                  backgroundColor: 'var(--color-canvas)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} color="var(--color-ink-muted-48)" />
              </button>
            )}
          </div>

          {/* Form Body */}
          <div style={{ padding: '28px' }}>
            {/* Grid 2 kolom */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px 24px',
            }}>
              <FormField label="Supplier" required error={errors.supplier}>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={e => handleChange('supplier', e.target.value)}
                  placeholder="mis. PT. Hana Steel Indonesia"
                  style={inputStyle(!!errors.supplier)}
                />
              </FormField>

              <FormField label="Trade (Negara Asal)" required error={errors.trade}>
                <input
                  type="text"
                  value={form.trade}
                  onChange={e => handleChange('trade', e.target.value)}
                  placeholder="mis. Korea Selatan"
                  style={inputStyle(!!errors.trade)}
                />
              </FormField>

              <FormField label="Import Type" required error={errors.importType}>
                <select
                  value={form.importType}
                  onChange={e => handleChange('importType', e.target.value)}
                  style={inputStyle(!!errors.importType)}
                >
                  {IMPORT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Shipment Term" required error={errors.shipmentTerm}>
                <input
                  type="text"
                  value={form.shipmentTerm}
                  onChange={e => handleChange('shipmentTerm', e.target.value)}
                  placeholder="mis. CIF, FOB, CFR"
                  style={inputStyle(!!errors.shipmentTerm)}
                />
              </FormField>

              <FormField label="Invoice No." required error={errors.invoiceNo}>
                <input
                  type="text"
                  value={form.invoiceNo}
                  onChange={e => handleChange('invoiceNo', e.target.value)}
                  placeholder="mis. INV-2026-0001"
                  style={inputStyle(!!errors.invoiceNo)}
                />
              </FormField>

              <FormField label="Bill of Lading No." required error={errors.billOfLadingNo}>
                <input
                  type="text"
                  value={form.billOfLadingNo}
                  onChange={e => handleChange('billOfLadingNo', e.target.value)}
                  placeholder="mis. BL-20260712-001"
                  style={inputStyle(!!errors.billOfLadingNo)}
                />
              </FormField>

              <FormField label="ETD (Est. Time of Departure)" required error={errors.etd}>
                <input
                  type="date"
                  value={form.etd}
                  onChange={e => handleChange('etd', e.target.value)}
                  style={inputStyle(!!errors.etd)}
                />
              </FormField>

              <FormField label="ETA (Est. Time of Arrival)" required error={errors.eta}>
                <input
                  type="date"
                  value={form.eta}
                  onChange={e => handleChange('eta', e.target.value)}
                  style={inputStyle(!!errors.eta)}
                />
              </FormField>

              <FormField label="HS Code" required error={errors.hsCode}>
                <input
                  type="text"
                  value={form.hsCode}
                  onChange={e => handleChange('hsCode', e.target.value)}
                  placeholder="mis. 7209.17.00"
                  style={inputStyle(!!errors.hsCode)}
                />
              </FormField>

              <FormField label="Free Time Destination (hari)" required error={errors.freeTimeDestination}>
                <input
                  type="text"
                  value={form.freeTimeDestination}
                  onChange={e => handleChange('freeTimeDestination', e.target.value)}
                  placeholder="mis. 14"
                  style={inputStyle(!!errors.freeTimeDestination)}
                />
              </FormField>

              {/* Tanggal Input — read-only */}
              <FormField label="Tanggal Input">
                <input
                  type="text"
                  value={
                    isEditMode
                      ? formatDate(editingProject.tanggalInput)
                      : formatDate(new Date().toISOString().split('T')[0])
                  }
                  readOnly
                  style={{
                    ...inputStyle(),
                    backgroundColor: 'var(--color-canvas-parchment)',
                    color: 'var(--color-ink-muted-48)',
                    cursor: 'not-allowed',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>
                  Otomatis terisi saat pertama kali disimpan
                </span>
              </FormField>
            </div>

            {/* Tombol Aksi */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-hairline)',
            }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 22px',
                  borderRadius: 'var(--rounded-pill)',
                  border: '1px solid var(--color-hairline)',
                  backgroundColor: 'var(--color-canvas)',
                  color: 'var(--color-ink)',
                  fontSize: '14px',
                  fontWeight: '400',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-body)',
                }}
              >
                {isEditMode ? 'Batalkan Edit' : 'Reset Form'}
              </button>

              <button
                onClick={handleSubmit}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--rounded-pill)',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-body)',
                  transition: 'transform 0.1s',
                }}
              >
                {isEditMode ? `Update ${editingProject.id}` : '+ Simpan Import Project'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabel List Import Project ── */}
        <div style={{
          backgroundColor: 'var(--color-canvas)',
          borderRadius: 'var(--rounded-lg)',
          border: '1px solid var(--color-hairline)',
          overflow: 'hidden',
        }}>
          {/* Tabel Header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--color-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{
              fontSize: '17px',
              fontWeight: '600',
              color: 'var(--color-ink)',
              letterSpacing: '-0.374px',
            }}>
              Daftar Import Project
            </h2>
            <span style={{
              fontSize: '13px',
              color: 'var(--color-ink-muted-48)',
              backgroundColor: 'var(--color-canvas-parchment)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--rounded-pill)',
              padding: '3px 12px',
            }}>
              {sortedProjects.length} project
            </span>
          </div>

          {sortedProjects.length === 0 ? (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: 'var(--color-ink-muted-48)',
            }}>
              <Package size={40} color="var(--color-hairline)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
                Belum ada Import Project
              </div>
              <div style={{ fontSize: '13px' }}>
                Gunakan form di atas untuk menambahkan project pertama Anda.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-canvas-parchment)' }}>
                    {[
                      'Task Unique No.',
                      'Supplier',
                      'Trade',
                      'Import Type',
                      'Invoice No.',
                      'B/L No.',
                      'ETD',
                      'ETA',
                      'HS Code',
                      'Free Time (hr)',
                      'Tgl. Input',
                      'Aksi',
                    ].map(col => (
                      <th key={col} style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--color-ink-muted-48)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid var(--color-hairline)',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProjects.map((project, idx) => {
                    const isHighlighted = project.id === savedId;
                    const isOdd = idx % 2 === 1;
                    return (
                      <tr
                        key={project.id}
                        style={{
                          backgroundColor: isHighlighted
                            ? 'var(--color-status-info-bg)'
                            : isOdd
                              ? 'var(--color-canvas-parchment)'
                              : 'var(--color-canvas)',
                          transition: 'background-color 0.4s',
                        }}
                      >
                        {/* Task Unique Number */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: 'var(--color-primary)',
                            fontFamily: 'var(--font-family-body)',
                          }}>
                            <Package size={12} />
                            {project.id}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink)', fontWeight: '500', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.supplier}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {project.trade}
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <ImportTypeBadge value={project.importType} />
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {project.invoiceNo}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {project.billOfLadingNo}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {formatDate(project.etd)}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {formatDate(project.eta)}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {project.hsCode}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {project.freeTimeDestination} hr
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-48)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                          {formatDate(project.tanggalInput)}
                        </td>
                        {/* Aksi */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleEditClick(project)}
                            title={`Edit ${project.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: 'var(--rounded-pill)',
                              border: '1px solid var(--color-hairline)',
                              backgroundColor: 'var(--color-canvas)',
                              color: 'var(--color-ink)',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-family-body)',
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = 'var(--color-status-info-bg)';
                              e.currentTarget.style.color = 'var(--color-primary)';
                              e.currentTarget.style.borderColor = 'var(--color-primary)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'var(--color-canvas)';
                              e.currentTarget.style.color = 'var(--color-ink)';
                              e.currentTarget.style.borderColor = 'var(--color-hairline)';
                            }}
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignImportProject;
