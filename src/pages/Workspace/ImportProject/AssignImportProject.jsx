import React, { useState, useEffect, useRef } from 'react';
import useImportProjectStore from '../../../store/useImportProjectStore';
import useDocumentStore from '../../../store/useDocumentStore';
import { Edit3, Plus, X, Package, AlertCircle } from 'lucide-react';
import { useFormSubmit } from '../../../hooks/useFormSubmit';

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
  documentRequirements: [],
  shipmentConfig: 'Single',
  splitShipments: [],
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
    fetchImportProjects,
    editingProject,
    addImportProject,
    updateImportProject,
    setEditingProject,
  } = useImportProjectStore();

  const { customDocumentTypes, fetchCustomDocumentTypes } = useDocumentStore();

  useEffect(() => {
    fetchCustomDocumentTypes();
    fetchImportProjects();
  }, [fetchCustomDocumentTypes, fetchImportProjects]);

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
        documentRequirements: editingProject.documentRequirements || [],
        shipmentConfig: editingProject.shipmentConfig || 'Single',
        splitShipments: editingProject.splitShipments || [],
      });
      // Scroll ke form saat mode edit aktif
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingProject]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (docId) => {
    setForm(prev => {
      const current = prev.documentRequirements || [];
      if (current.includes(docId)) {
        return { ...prev, documentRequirements: current.filter(id => id !== docId) };
      }
      return { ...prev, documentRequirements: [...current, docId] };
    });
  };

  const validate = () => {
    const required = [
      'supplier', 'trade', 'importType', 'shipmentTerm',
      'invoiceNo', 'etd', 'eta', 'hsCode', 'freeTimeDestination',
    ];
    if (form.shipmentConfig === 'Single') {
      required.push('billOfLadingNo');
    }
    const newErrors = {};
    required.forEach(field => {
      if (!form[field] || (typeof form[field] === 'string' && !form[field].trim())) {
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

    if (!form.documentRequirements || form.documentRequirements.length === 0) {
      newErrors['documentRequirements'] = 'Pilih minimal 1 Document Requirements';
    }

    if (form.shipmentConfig === 'Split') {
      if (!form.splitShipments || form.splitShipments.length === 0) {
        newErrors['splitShipments'] = 'Minimal tambahkan 1 Shipment untuk Split BL';
      } else {
        const hasEmptyContainer = form.splitShipments.some(s => !s.container);
        if (hasEmptyContainer) {
          newErrors['splitShipments'] = 'Container wajib diisi di setiap shipment';
        }
      }
    }

    return newErrors;
  };

  const handleAddSplitShipment = () => {
    setForm(prev => ({
      ...prev,
      splitShipments: [...prev.splitShipments, { id: Date.now() + Math.random(), houseBl: '', container: '' }]
    }));
  };

  const handleUpdateSplitShipment = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      splitShipments: prev.splitShipments.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleRemoveSplitShipment = (id) => {
    setForm(prev => ({
      ...prev,
      splitShipments: prev.splitShipments.filter(s => s.id !== id)
    }));
  };

  const { handleSubmit, loading, error, fieldErrors, setFieldErrors } = useFormSubmit(
    async () => {
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        throw new Error('Beberapa field wajib belum diisi.');
      }

      if (editingProject) {
        await updateImportProject(editingProject.id, form);
        setSavedId(editingProject.id);
      } else {
        const project = await addImportProject(form);
        setSavedId(project.id);
        setForm(EMPTY_FORM);
      }
      setFieldErrors({});
      setTimeout(() => setSavedId(null), 2500);
    }
  );

  const handleReset = () => {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
  };

  const isEditMode = !!editingProject;

  // Urutkan: terbaru di atas (by tanggalInput desc, lalu by id desc)
  const sortedProjects = [...importProjects].sort((a, b) => {
    const tA = String(a.tanggalInput || '');
    const tB = String(b.tanggalInput || '');
    if (tB !== tA) return tB.localeCompare(tA);
    return String(b.id || '').localeCompare(String(a.id || ''));
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
            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: '#fff1f1',
                color: '#d32f2f',
                padding: '12px',
                borderRadius: 'var(--rounded-sm)',
                marginBottom: '20px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Grid 2 kolom */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px 24px',
            }}>
              <FormField label="Supplier" required error={fieldErrors.supplier}>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={e => handleChange('supplier', e.target.value)}
                  placeholder="mis. PT. Hana Steel Indonesia"
                  style={inputStyle(!!fieldErrors.supplier)}
                />
              </FormField>

              <FormField label="Trade (Negara Asal)" required error={fieldErrors.trade}>
                <input
                  type="text"
                  value={form.trade}
                  onChange={e => handleChange('trade', e.target.value)}
                  placeholder="mis. Korea Selatan"
                  style={inputStyle(!!fieldErrors.trade)}
                />
              </FormField>

              <FormField label="Import Type" required error={fieldErrors.importType}>
                <select
                  value={form.importType}
                  onChange={e => handleChange('importType', e.target.value)}
                  style={inputStyle(!!fieldErrors.importType)}
                >
                  {IMPORT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Shipment Term" required error={fieldErrors.shipmentTerm}>
                <input
                  type="text"
                  value={form.shipmentTerm}
                  onChange={e => handleChange('shipmentTerm', e.target.value)}
                  placeholder="mis. CIF, FOB, CFR"
                  style={inputStyle(!!fieldErrors.shipmentTerm)}
                />
              </FormField>

              <FormField label="Invoice No." required error={fieldErrors.invoiceNo}>
                <input
                  type="text"
                  value={form.invoiceNo}
                  onChange={e => handleChange('invoiceNo', e.target.value)}
                  placeholder="mis. INV-2026-0001"
                  style={inputStyle(!!fieldErrors.invoiceNo)}
                />
              </FormField>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '12px', display: 'block' }}>Shipment Configuration</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-ink)' }}>
                    <input type="radio" name="shipmentConfig" value="Single" checked={form.shipmentConfig === 'Single'} onChange={() => handleChange('shipmentConfig', 'Single')} style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }} />
                    Single Bill of Lading
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-ink)' }}>
                    <input type="radio" name="shipmentConfig" value="Split" checked={form.shipmentConfig === 'Split'} onChange={() => handleChange('shipmentConfig', 'Split')} style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }} />
                    Split Bill of Lading
                  </label>
                </div>
              </div>

              <FormField label={form.shipmentConfig === 'Split' ? "Master BL Number" : "Bill of Lading No."} required={form.shipmentConfig === 'Single'} error={fieldErrors.billOfLadingNo}>
                <input
                  type="text"
                  value={form.billOfLadingNo}
                  onChange={e => handleChange('billOfLadingNo', e.target.value)}
                  placeholder="mis. BL-20260712-001"
                  style={inputStyle(!!fieldErrors.billOfLadingNo)}
                />
              </FormField>

              {form.shipmentConfig === 'Split' && (
                <div style={{ gridColumn: '1 / -1', marginTop: '4px', backgroundColor: 'var(--color-canvas-parchment)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>
                      Daftar House BL <span style={{ color: 'var(--color-ink-muted-48)', fontWeight: '400', marginLeft: '6px' }}>({form.splitShipments.length} Shipment)</span>
                    </div>
                    <button type="button" onClick={handleAddSplitShipment} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', backgroundColor: 'var(--color-status-info-bg)', padding: '6px 12px', borderRadius: 'var(--rounded-pill)', border: '1px solid var(--color-primary)', cursor: 'pointer' }}>
                      <Plus size={14} /> Add Shipment
                    </button>
                  </div>
                  {fieldErrors.splitShipments && (
                    <div style={{ color: 'var(--color-status-danger)', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-status-danger-bg)', padding: '8px 12px', borderRadius: 'var(--rounded-sm)' }}>
                      <AlertCircle size={14} /> {fieldErrors.splitShipments}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {form.splitShipments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-ink-muted-48)', fontSize: '13px', fontStyle: 'italic', border: '1px dashed var(--color-hairline)', borderRadius: 'var(--rounded-sm)' }}>
                        Belum ada shipment yang ditambahkan. Klik tombol Add Shipment.
                      </div>
                    ) : form.splitShipments.map((shipment, index) => (
                      <div key={shipment.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', backgroundColor: '#fff', padding: '16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ flex: 1 }}>
                          <FormField label={`Shipment ${String.fromCharCode(65 + index)} (House BL)`}>
                            <input type="text" value={shipment.houseBl} onChange={e => handleUpdateSplitShipment(shipment.id, 'houseBl', e.target.value)} placeholder="mis. OOLU001" style={inputStyle()} />
                          </FormField>
                        </div>
                        <div style={{ flex: 1 }}>
                          <FormField label="Container" required>
                            <input type="text" value={shipment.container} onChange={e => handleUpdateSplitShipment(shipment.id, 'container', e.target.value)} placeholder="mis. 1 x 40 Reefer" style={inputStyle()} />
                          </FormField>
                        </div>
                        <button type="button" onClick={() => handleRemoveSplitShipment(shipment.id)} style={{ marginTop: '24px', padding: '10px', backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', border: 'none', borderRadius: 'var(--rounded-sm)', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ffdbdb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-status-danger-bg)'} title="Hapus Shipment">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormField label="ETD (Est. Time of Departure)" required error={fieldErrors.etd}>
                <input
                  type="date"
                  value={form.etd}
                  onChange={e => handleChange('etd', e.target.value)}
                  style={inputStyle(!!fieldErrors.etd)}
                />
              </FormField>

              <FormField label="ETA (Est. Time of Arrival)" required error={fieldErrors.eta}>
                <input
                  type="date"
                  value={form.eta}
                  onChange={e => handleChange('eta', e.target.value)}
                  style={inputStyle(!!fieldErrors.eta)}
                />
              </FormField>

              <FormField label="HS Code" required error={fieldErrors.hsCode}>
                <input
                  type="text"
                  value={form.hsCode}
                  onChange={e => handleChange('hsCode', e.target.value)}
                  placeholder="mis. 7209.17.00"
                  style={inputStyle(!!fieldErrors.hsCode)}
                />
              </FormField>

              <FormField label="Free Time Destination (hari)" required error={fieldErrors.freeTimeDestination}>
                <input
                  type="text"
                  value={form.freeTimeDestination}
                  onChange={e => handleChange('freeTimeDestination', e.target.value)}
                  placeholder="mis. 14"
                  style={inputStyle(!!fieldErrors.freeTimeDestination)}
                />
              </FormField>
            </div>

            {/* Dokumen Persyaratan */}
            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px dashed var(--color-hairline)'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-ink)',
                marginBottom: '16px',
                display: 'block'
              }}>
                Dokumen Persyaratan (Checklist)
              </label>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px 20px'
              }}>
                {customDocumentTypes.filter(doc => doc.is_active === 1 || doc.is_active === true || form.documentRequirements.includes(doc.id)).map(doc => {
                  const isChecked = form.documentRequirements.includes(doc.id);
                  return (
                    <label key={doc.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--color-ink)',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(doc.id)}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: 'var(--color-primary)',
                          cursor: 'pointer',
                          marginTop: '1px'
                        }}
                      />
                      <span style={{
                        color: isChecked ? 'var(--color-ink)' : 'var(--color-ink-muted-64)',
                        transition: 'color 0.2s',
                        lineHeight: '1.4'
                      }}>
                        {doc.nama_dokumen}
                      </span>
                    </label>
                  );
                })}
              </div>
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
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
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
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--color-ink-muted-48)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid var(--color-hairline)',
                        backgroundColor: 'var(--color-canvas-parchment)',
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
                    const isSplit = project.shipments && project.shipments.length > 1;
                    return (
                      <React.Fragment key={project.id}>
                        <tr
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
                              {project.taskUniqueNumber || project.id}
                              {isSplit && (
                                <span style={{ marginLeft: '4px', backgroundColor: '#e5f1fc', color: '#0066cc', fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--rounded-sm)', fontWeight: '600' }}>Split BL</span>
                              )}
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
                          {project.invoiceNo || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {project.billOfLadingNo || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {formatDate(project.etd)}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {formatDate(project.eta)}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {project.hsCode || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink-muted-80)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {project.freeTimeDestination ? `${project.freeTimeDestination} hr` : '—'}
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
                      {isSplit && (
                        <tr style={{ backgroundColor: 'var(--color-canvas)' }}>
                          <td colSpan="12" style={{ padding: '0', borderBottom: '1px solid var(--color-hairline)' }}>
                            <div style={{ padding: '12px 14px 12px 40px', backgroundColor: '#fafafa', display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px dashed var(--color-hairline)' }}>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', display: 'flex', alignItems: 'center', marginRight: '8px' }}>House BL:</div>
                              {project.shipments.map((shipment, sIdx) => (
                                <div key={shipment.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#fff', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>Shipment {String.fromCharCode(65 + sIdx)}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', fontFamily: 'monospace' }}>{shipment.house_bl}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
