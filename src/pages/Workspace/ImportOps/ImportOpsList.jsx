import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Plus, ChevronRight, AlertTriangle, Trash2 } from 'lucide-react';
import useImportOperationalStore from '../../../store/useImportOperationalStore';
import useImportProjectStore from '../../../store/useImportProjectStore';
import useAuthStore from '../../../store/useAuthStore';
import { calcTotals, fmtRupiah } from '../../../utils/importCalc';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const KAT_OPTIONS = ['RM', 'Ind. Food', 'Ind. Pckg', 'Aset', 'Misc', 'Reim', 'Reex'];
const MODE_OPTIONS = ['FCL', 'LCL Sea', 'LCL Air', 'Courier', 'MV'];
const UOM_OPTIONS = ['MT', 'KG', 'PCS', 'CBM', 'CARTON', 'PALLET'];

// Badge warna per Kat
const katBadgeStyle = (kat) => {
  const map = {
    'RM':        { bg: '#e5f1fc', color: '#0066cc' },
    'Ind. Food': { bg: '#e7f8ec', color: '#34c759' },
    'Ind. Pckg': { bg: '#fff2e0', color: '#ff9500' },
    'Aset':      { bg: '#f3effe', color: '#5856d6' },
    'Misc':      { bg: '#f0f0f0', color: '#7a7a7a' },
    'Reim':      { bg: '#ffe9e8', color: '#ff3b30' },
    'Reex':      { bg: '#ffe9e8', color: '#af52de' },
  };
  return map[kat] || { bg: '#f0f0f0', color: '#7a7a7a' };
};

const KatBadge = ({ kat }) => {
  const { bg, color } = katBadgeStyle(kat);
  return (
    <span style={{
      backgroundColor: bg, color,
      fontSize: '11px', fontWeight: '700',
      padding: '3px 8px',
      borderRadius: 'var(--rounded-pill)',
      whiteSpace: 'nowrap',
    }}>
      {kat}
    </span>
  );
};

const ModeBadge = ({ mode }) => (
  <span style={{
    backgroundColor: 'var(--color-canvas-parchment)',
    color: 'var(--color-ink-muted-80)',
    border: '1px solid var(--color-hairline)',
    fontSize: '11px', fontWeight: '500',
    padding: '3px 8px',
    borderRadius: 'var(--rounded-pill)',
    whiteSpace: 'nowrap',
  }}>
    {mode}
  </span>
);

// ─── importType → kat mapping ─────────────────────────────────────────────────

const importTypeToKat = (importType) => {
  if (!importType) return 'Misc';
  if (importType.toLowerCase().includes('raw') || importType === 'Raw Material') return 'RM';
  if (importType.toLowerCase().includes('food')) return 'Ind. Food';
  if (importType.toLowerCase().includes('pack')) return 'Ind. Pckg';
  return 'Misc';
};

// ─── Modal: Tambah Shipment (2-step) ─────────────────────────────────────────

const AddShipmentModal = ({ onClose }) => {
  const { addShipment, masterData } = useImportOperationalStore();
  const { importProjects } = useImportProjectStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const emptyForm = {
    un: '', kat: 'RM', supplier: '',
    trade: '', shipmentTerm: '',
    inv: '', blSwbAwb: '', etd: '', eta: '',
    hsCode: '', freeTimeDest: '',
    modeTransport: 'FCL', cont: '',
    qtty: '', qttyUom: 'MT', depo: '', gudang: '',
    importProjectId: null,
  };

  const [step, setStep] = useState('choose');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [form, setFormState] = useState(emptyForm);
  const [error, setError] = useState('');

  const setField = (field, val) => setFormState(prev => ({ ...prev, [field]: val }));

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    if (!projectId) return;
    const project = importProjects.find(p => p.id === projectId);
    if (!project) return;
    setFormState(prev => ({
      ...prev,
      un: project.id,
      kat: importTypeToKat(project.importType),
      supplier: project.supplier,
      trade: project.trade || '',
      shipmentTerm: project.shipmentTerm || '',
      inv: project.invoiceNo || '',
      blSwbAwb: project.billOfLadingNo || '',
      etd: project.etd || '',
      eta: project.eta || '',
      hsCode: project.hsCode || '',
      freeTimeDest: project.freeTimeDestination || '',
      importProjectId: project.id,
    }));
  };

  const goBack = () => {
    setStep('choose');
    setSelectedProjectId('');
    setFormState(emptyForm);
    setError('');
  };

  const handleSubmit = () => {
    if (!form.un.trim()) { setError('Kode UN wajib diisi'); return; }
    if (!form.supplier)  { setError('Supplier wajib dipilih'); return; }
    if (!form.inv.trim()) { setError('Invoice Number wajib diisi'); return; }

    const shipment = addShipment({ ...form, createdById: user?.id || null });
    onClose();
    navigate(`/workspace/import-operational/${shipment.id}`);
  };

  const inputSt = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-sm)',
    fontSize: '14px', fontFamily: 'var(--font-family-body)',
    outline: 'none', backgroundColor: 'var(--color-canvas)',
    color: 'var(--color-ink)', boxSizing: 'border-box',
  };

  const autoFilledSt = {
    ...inputSt,
    backgroundColor: 'var(--color-status-info-bg)',
    borderColor: 'var(--color-status-info)',
  };

  const labelSt = {
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: 'var(--color-ink)', marginBottom: '5px',
  };

  const isFromProject = step === 'project';
  const hasProjectSelected = isFromProject && !!selectedProjectId;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1100,
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 1101,
        width: step === 'choose' ? '480px' : '640px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: '90vh', overflowY: 'auto',
        backgroundColor: 'var(--color-canvas)',
        borderRadius: 'var(--rounded-lg)',
        boxShadow: 'var(--shadow-product)',
        padding: '32px',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>

        {step === 'choose' && (
          <>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.374px', margin: '0 0 6px' }}>
                Tambah Shipment Baru
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: 0 }}>
                Pilih jalur pembuatan shipment.
              </p>
            </div>

            <button onClick={() => setStep('project')} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              padding: '20px', border: '2px solid var(--color-primary)',
              borderRadius: 'var(--rounded-lg)', backgroundColor: 'var(--color-status-info-bg)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                📋
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '4px' }}>
                  Buat dari Import Project
                  <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: '700', padding: '2px 6px', backgroundColor: 'var(--color-primary)', color: '#fff', borderRadius: '4px' }}>DISARANKAN</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', lineHeight: '1.5' }}>
                  Pilih IMP-XXXX yang sudah terdaftar. 9 field akan diisi otomatis: UN, Supplier, Trade, Invoice, BL, ETD, ETA, HS Code, Free Time.
                </div>
              </div>
            </button>

            <button onClick={() => setStep('manual')} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              padding: '20px', border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--rounded-lg)', backgroundColor: 'var(--color-canvas)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid var(--color-hairline)' }}>
                ✏️
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '4px' }}>
                  Buat Manual (Tanpa Import Project)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', lineHeight: '1.5' }}>
                  Isi semua field secara manual. Untuk shipment yang belum didaftarkan lewat Assign Import Project.
                </div>
              </div>
            </button>

            <button onClick={onClose} style={{ alignSelf: 'center', padding: '8px 20px', borderRadius: 'var(--rounded-pill)', border: '1px solid var(--color-hairline)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-family-body)', color: 'var(--color-ink-muted-80)' }}>
              Batal
            </button>
          </>
        )}

        {(step === 'project' || step === 'manual') && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={goBack} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                ←
              </button>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.374px', margin: 0 }}>
                  {isFromProject ? 'Dari Import Project' : 'Shipment Manual'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: '2px 0 0' }}>
                  {isFromProject ? 'Pilih Import Project lalu lengkapi data operasional.' : 'Isi semua field identitas shipment baru.'}
                </p>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-status-danger-bg)', border: '1px solid var(--color-status-danger)', color: 'var(--color-status-danger)', padding: '8px 12px', borderRadius: 'var(--rounded-sm)', fontSize: '13px' }}>
                <AlertTriangle size={14} />{error}
              </div>
            )}

            {isFromProject && (
              <div>
                <label style={labelSt}>Pilih Import Project <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
                <select value={selectedProjectId} onChange={e => handleSelectProject(e.target.value)}
                  style={{ ...inputSt, borderColor: selectedProjectId ? 'var(--color-primary)' : 'var(--color-hairline)' }} autoFocus>
                  <option value="">— Pilih IMP-XXXX —</option>
                  {importProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} — {p.supplier} ({p.importType})</option>
                  ))}
                </select>
                {selectedProjectId && (
                  <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '6px' }}>
                    ✓ 9 field telah diisi otomatis. Anda tetap bisa mengeditnya.
                  </div>
                )}
              </div>
            )}

            {isFromProject && selectedProjectId && (
              <div style={{ backgroundColor: 'var(--color-status-info-bg)', border: '1px solid var(--color-status-info)', borderRadius: 'var(--rounded-md)', padding: '10px 14px', fontSize: '12px', color: 'var(--color-primary)' }}>
                Field berwarna biru = diisi otomatis dari <strong>{selectedProjectId}</strong>. Field putih = wajib diisi manual.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

              <div>
                <label style={labelSt}>Kode UN <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
                <input type="text" value={form.un} onChange={e => setField('un', e.target.value)}
                  placeholder={isFromProject ? 'IMP-XXXX (dari project)' : 'mis. UN-001'}
                  style={hasProjectSelected ? autoFilledSt : inputSt}
                  readOnly={isFromProject && !!selectedProjectId} />
              </div>

              <div>
                <label style={labelSt}>Kategori (Kat)</label>
                <select value={form.kat} onChange={e => setField('kat', e.target.value)}
                  style={hasProjectSelected ? autoFilledSt : inputSt}>
                  {KAT_OPTIONS.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelSt}>Supplier <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
                <select value={form.supplier} onChange={e => setField('supplier', e.target.value)}
                  style={hasProjectSelected ? autoFilledSt : inputSt}>
                  <option value="">— Pilih Supplier —</option>
                  {masterData.suppliers.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={labelSt}>Trade (Asal Negara)</label>
                <input type="text" value={form.trade} onChange={e => setField('trade', e.target.value)}
                  placeholder="mis. Korea Selatan" style={hasProjectSelected ? autoFilledSt : inputSt} />
              </div>

              <div>
                <label style={labelSt}>Shipment Term</label>
                <input type="text" value={form.shipmentTerm} onChange={e => setField('shipmentTerm', e.target.value)}
                  placeholder="mis. CIF, FOB, CFR" style={hasProjectSelected ? autoFilledSt : inputSt} />
              </div>

              <div>
                <label style={labelSt}>Invoice No. <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
                <input type="text" value={form.inv} onChange={e => setField('inv', e.target.value)}
                  placeholder="mis. INV-2026-0001" style={hasProjectSelected ? autoFilledSt : inputSt} />
              </div>

              <div>
                <label style={labelSt}>BL / SWB / AWB</label>
                <input type="text" value={form.blSwbAwb} onChange={e => setField('blSwbAwb', e.target.value)}
                  placeholder="mis. BL-20260712-001" style={hasProjectSelected ? autoFilledSt : inputSt} />
              </div>

              <div>
                <label style={labelSt}>ETD (Keberangkatan)</label>
                <input type="date" value={form.etd} onChange={e => setField('etd', e.target.value)}
                  style={hasProjectSelected ? autoFilledSt : inputSt} />
              </div>

              <div>
                <label style={labelSt}>ETA (Kedatangan)</label>
                <input type="date" value={form.eta} onChange={e => setField('eta', e.target.value)}
                  style={hasProjectSelected ? autoFilledSt : inputSt} />
              </div>

              <div>
                <label style={labelSt}>HS Code</label>
                <input type="text" value={form.hsCode} onChange={e => setField('hsCode', e.target.value)}
                  placeholder="mis. 7209.17.00" style={hasProjectSelected ? autoFilledSt : inputSt} />
              </div>

              <div>
                <label style={labelSt}>Free Time Destination (Hari)</label>
                <input type="number" min="0" value={form.freeTimeDest} onChange={e => setField('freeTimeDest', e.target.value)}
                  placeholder="0" style={hasProjectSelected ? autoFilledSt : inputSt} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ borderTop: '1px dashed var(--color-hairline)', margin: '4px 0 8px' }} />
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Data Operasional (Wajib Diisi Manual)
                </div>
              </div>

              <div>
                <label style={labelSt}>Mode Transport</label>
                <select value={form.modeTransport} onChange={e => setField('modeTransport', e.target.value)} style={inputSt}>
                  {MODE_OPTIONS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={labelSt}>No. Kontainer</label>
                <input type="text" value={form.cont} onChange={e => setField('cont', e.target.value)}
                  placeholder="mis. TCKU1234567" style={inputSt} />
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>
                  Kontainer tambahan bisa ditambahkan di Detail Shipment.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 2 }}>
                  <label style={labelSt}>Qtty</label>
                  <input type="number" value={form.qtty} onChange={e => setField('qtty', e.target.value)}
                    placeholder="0" min="0" style={inputSt} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelSt}>UoM</label>
                  <select value={form.qttyUom} onChange={e => setField('qttyUom', e.target.value)} style={inputSt}>
                    {UOM_OPTIONS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelSt}>Depo Route</label>
                <select value={form.depo} onChange={e => setField('depo', e.target.value)} style={inputSt}>
                  <option value="">— Pilih Depo —</option>
                  {masterData.depoRoutes.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={labelSt}>Gudang</label>
                <select value={form.gudang} onChange={e => setField('gudang', e.target.value)} style={inputSt}>
                  <option value="">— Pilih Gudang —</option>
                  {masterData.whRoutes.map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 'var(--rounded-pill)', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-family-body)' }}>
                Batal
              </button>
              <button onClick={handleSubmit}
                disabled={isFromProject && !selectedProjectId}
                style={{ padding: '10px 20px', borderRadius: 'var(--rounded-pill)', border: 'none', backgroundColor: isFromProject && !selectedProjectId ? 'var(--color-ink-muted-48)' : 'var(--color-primary)', color: '#fff', cursor: isFromProject && !selectedProjectId ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-family-body)' }}>
                Buat & Buka Detail
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ─── Main: ImportOpsList ──────────────────────────────────────────────────────

const ImportOpsList = () => {
  const { shipments, deleteShipment } = useImportOperationalStore();
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  // Sort: terbaru di atas
  const sorted = [...shipments].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleDelete = (id) => {
    deleteShipment(id);
    setConfirmDeleteId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)' }}>

      {/* Header */}
      <div style={{
        padding: '24px 32px 20px',
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '36px', height: '36px',
              backgroundColor: 'var(--color-status-info-bg)',
              borderRadius: 'var(--rounded-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ship size={18} color="var(--color-primary)" />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px' }}>
              Import Operational
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', marginLeft: '48px' }}>
            Monitoring landed cost & operasional shipment import · {sorted.length} shipment
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px',
            borderRadius: 'var(--rounded-pill)',
            border: 'none',
            backgroundColor: 'var(--color-primary)', color: '#fff',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            fontFamily: 'var(--font-family-body)',
            flexShrink: 0,
          }}
        >
          <Plus size={16} />
          Tambah Shipment
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{
          backgroundColor: 'var(--color-canvas)',
          borderRadius: 'var(--rounded-lg)',
          border: '1px solid var(--color-hairline)',
          overflow: 'hidden',
        }}>
          {sorted.length === 0 ? (
            <div style={{
              padding: '60px 24px', textAlign: 'center',
              color: 'var(--color-ink-muted-48)',
            }}>
              <Ship size={40} color="var(--color-hairline)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
                Belum ada data shipment
              </div>
              <div style={{ fontSize: '13px' }}>
                Klik "+ Tambah Shipment" untuk membuat entri pertama.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-canvas-parchment)' }}>
                    {['ID', 'UN', 'Kat', 'Supplier', 'Invoice', 'ETA', 'Mode', 'Kontainer', 'Gudang', 'Grand Total (+Tax)', 'Landed/Kg', ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: '11px', fontWeight: '600',
                        color: 'var(--color-ink-muted-48)',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid var(--color-hairline)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s, idx) => {
                    const totals = calcTotals(s.costs, s.qtty);
                    const isOdd = idx % 2 === 1;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/workspace/import-operational/${s.id}`)}
                        style={{
                          backgroundColor: isOdd ? 'var(--color-canvas-parchment)' : 'var(--color-canvas)',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-status-info-bg)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isOdd ? 'var(--color-canvas-parchment)' : 'var(--color-canvas)'}
                      >
                        {/* ID */}
                        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)' }}>
                            {s.id}
                          </span>
                        </td>
                        {/* UN */}
                        <td style={{ padding: '13px 14px', fontWeight: '600', color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
                          {s.un || '—'}
                        </td>
                        {/* Kat */}
                        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                          <KatBadge kat={s.kat} />
                        </td>
                        {/* Supplier */}
                        <td style={{ padding: '13px 14px', color: 'var(--color-ink)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.supplier || '—'}
                        </td>
                        {/* Invoice */}
                        <td style={{ padding: '13px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {s.inv || '—'}
                        </td>
                        {/* ETA */}
                        <td style={{ padding: '13px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {formatDate(s.eta)}
                        </td>
                        {/* Mode */}
                        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                          <ModeBadge mode={s.modeTransport} />
                        </td>
                        {/* Kontainer */}
                        <td style={{ padding: '13px 14px', color: 'var(--color-ink-muted-80)', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {s.containers?.length > 1 
                            ? `${s.containers.length} Kontainer` 
                            : (s.containers?.[0]?.cont || '—')}
                        </td>
                        {/* Gudang */}
                        <td style={{ padding: '13px 14px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>
                          {s.gudang || '—'}
                        </td>
                        {/* Grand Total */}
                        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {totals.grandTotal > 0 ? (
                            <span style={{ fontWeight: '700', color: 'var(--color-ink)' }}>
                              Rp {fmtRupiah(Math.round(totals.grandTotal))}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-ink-muted-48)' }}>—</span>
                          )}
                        </td>
                        {/* Landed/Kg */}
                        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {totals.landedPerKg > 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>
                              Rp {fmtRupiah(Math.round(totals.landedPerKg))}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-ink-muted-48)' }}>—</span>
                          )}
                        </td>
                        {/* Aksi */}
                        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/workspace/import-operational/${s.id}`); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '5px 12px',
                                borderRadius: 'var(--rounded-pill)',
                                border: '1px solid var(--color-hairline)',
                                backgroundColor: 'var(--color-canvas)',
                                fontSize: '12px', cursor: 'pointer',
                                fontFamily: 'var(--font-family-body)',
                              }}
                            >
                              Detail <ChevronRight size={12} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                              title="Hapus shipment"
                              style={{
                                width: '28px', height: '28px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid var(--color-hairline)',
                                borderRadius: 'var(--rounded-sm)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--color-ink-muted-48)',
                                transition: 'color 0.15s, background-color 0.15s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.color = 'var(--color-status-danger)';
                                e.currentTarget.style.backgroundColor = 'var(--color-status-danger-bg)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = 'var(--color-ink-muted-48)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

      {/* Modal Tambah */}
      {isAddOpen && <AddShipmentModal onClose={() => setIsAddOpen(false)} />}

      {/* Confirm Delete */}
      {confirmDeleteId && (() => {
        const ship = shipments.find(s => s.id === confirmDeleteId);
        return (
          <>
            <div onClick={() => setConfirmDeleteId(null)} style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1200,
            }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 1201,
              width: '380px', maxWidth: 'calc(100vw - 48px)',
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--rounded-lg)',
              boxShadow: 'var(--shadow-product)',
              padding: '28px',
              display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: 'var(--color-status-danger-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AlertTriangle size={20} color="var(--color-status-danger)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '6px' }}>
                    Hapus Shipment?
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', lineHeight: 1.5 }}>
                    <strong>{ship?.id}</strong> — {ship?.un} akan dihapus permanen beserta seluruh data biayanya.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setConfirmDeleteId(null)} style={{
                  padding: '9px 18px', borderRadius: 'var(--rounded-pill)',
                  border: '1px solid var(--color-hairline)',
                  backgroundColor: 'var(--color-canvas)', cursor: 'pointer',
                  fontSize: '14px', fontFamily: 'var(--font-family-body)',
                }}>Batal</button>
                <button onClick={() => handleDelete(confirmDeleteId)} style={{
                  padding: '9px 18px', borderRadius: 'var(--rounded-pill)',
                  border: 'none', backgroundColor: 'var(--color-status-danger)',
                  color: '#fff', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-family-body)',
                }}>Hapus</button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default ImportOpsList;
