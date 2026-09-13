import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Save, Edit2, ShieldCheck, Loader2 } from 'lucide-react';
import useImportOperationalStore from '../../../store/useImportOperationalStore';
import { fmtRupiah } from '../../../utils/importCalc';
import MasterDataDokumen from './MasterDataDokumen';
import { useAppleModal } from '../../../contexts/AppleModalContext';

// ─── Truck Price Route Keys ───────────────────────────────────────────────────
// Mapping antara depo route label → key yang dipakai di truckPrices row
// Kini diambil dari global state (masterData.truckRouteKeys)


// ─── Helpers ──────────────────────────────────────────────────────────────────

const Th = ({ children, right }) => (
  <th style={{
    padding: '9px 12px',
    textAlign: right ? 'right' : 'left',
    fontSize: '11px', fontWeight: '600',
    color: 'var(--color-ink-muted-48)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--color-hairline)',
    backgroundColor: 'var(--color-canvas-parchment)',
  }}>
    {children}
  </th>
);

const Td = ({ children, right, mono, muted }) => (
  <td style={{
    padding: '10px 12px',
    textAlign: right ? 'right' : 'left',
    fontFamily: mono ? 'monospace' : 'inherit',
    fontSize: mono ? '12px' : '13px',
    color: muted ? 'var(--color-ink-muted-48)' : 'var(--color-ink)',
    borderBottom: '1px solid var(--color-hairline)',
    whiteSpace: 'nowrap',
  }}>
    {children}
  </td>
);

const inputSt = {
  padding: '7px 10px',
  border: '1px solid var(--color-hairline)',
  borderRadius: 'var(--rounded-sm)',
  fontSize: '13px',
  fontFamily: 'var(--font-family-body)',
  outline: 'none',
  backgroundColor: 'var(--color-canvas)',
  color: 'var(--color-ink)',
  width: '100%',
  boxSizing: 'border-box',
};

const SectionCard = ({ title, children }) => (
  <div style={{
    backgroundColor: 'var(--color-canvas)',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-lg)',
    overflow: 'hidden',
    marginBottom: '24px',
  }}>
    <div style={{
      padding: '14px 20px',
      borderBottom: '1px solid var(--color-hairline)',
      fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)',
    }}>
      {title}
    </div>
    <div style={{ padding: '16px 20px' }}>
      {children}
    </div>
  </div>
);

// ─── Tab: List Data ───────────────────────────────────────────────────────────

const ListDataTab = () => {
  const { masterData, addSupplier, removeSupplier, addDepoRoute, removeDepoRoute,
          addWhRoute, removeWhRoute, departemenList, fetchDepartemen, addDepartemen, removeDepartemen } = useImportOperationalStore();
  const { alert: modalAlert, confirm: modalConfirm } = useAppleModal();

  useEffect(() => {
    fetchDepartemen();
  }, [fetchDepartemen]);

  const [newSupplier, setNewSupplier] = useState('');
  const [newDepo, setNewDepo] = useState('');
  const [newWh, setNewWh] = useState('');
  const [newDept, setNewDept] = useState('');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [deptDeletingId, setDeptDeletingId] = useState(null);

  const handleAddDept = async () => {
    const trimmed = (newDept || '').trim();
    if (!trimmed) return;

    if (departemenList.some(d => d.nama_departemen.trim().toLowerCase() === trimmed.toLowerCase())) {
      if (modalAlert) await modalAlert(`Departemen "${trimmed}" sudah terdaftar.`);
      else window.alert(`Departemen "${trimmed}" sudah terdaftar.`);
      return;
    }

    setIsAddingDept(true);
    try {
      await addDepartemen(trimmed);
      setNewDept('');
    } catch (err) {
      const msg = err.message || 'Gagal menambahkan departemen.';
      if (modalAlert) await modalAlert(msg);
      else window.alert(msg);
    } finally {
      setIsAddingDept(false);
    }
  };

  const handleRemoveDept = async (dept) => {
    const isCore = ['import', 'export', 'account officer', 'administrasi export'].includes(dept.nama_departemen.trim().toLowerCase());
    if (isCore) {
      if (modalAlert) await modalAlert(`Departemen "${dept.nama_departemen}" adalah departemen inti sistem dan tidak dapat dihapus.`);
      else window.alert(`Departemen "${dept.nama_departemen}" adalah departemen inti sistem dan tidak dapat dihapus.`);
      return;
    }

    const confirmed = modalConfirm 
      ? await modalConfirm(`Apakah Anda yakin ingin menghapus departemen "${dept.nama_departemen}"?`, 'Konfirmasi Hapus')
      : window.confirm(`Apakah Anda yakin ingin menghapus departemen "${dept.nama_departemen}"?`);
    
    if (!confirmed) return;

    setDeptDeletingId(dept.id);
    try {
      await removeDepartemen(dept.id);
    } catch (err) {
      const msg = err.message || 'Gagal menghapus departemen.';
      if (modalAlert) await modalAlert(msg);
      else window.alert(msg);
    } finally {
      setDeptDeletingId(null);
    }
  };

  const addRowStyle = {
    display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center',
  };

  const addBtnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '7px 14px',
    borderRadius: 'var(--rounded-pill)',
    border: 'none',
    backgroundColor: 'var(--color-primary)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    fontFamily: 'var(--font-family-body)',
    flexShrink: 0,
  };

  const SimpleList = ({ items, onRemove }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.length === 0 && (
        <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>Belum ada data</span>
      )}
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 10px',
          backgroundColor: i % 2 === 0 ? 'var(--color-canvas)' : 'var(--color-canvas-parchment)',
          borderRadius: 'var(--rounded-sm)',
          border: '1px solid var(--color-hairline)',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--color-ink)' }}>{item}</span>
          <button onClick={() => onRemove(i)} style={{
            width: '22px', height: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--color-ink-muted-48)',
            borderRadius: 'var(--rounded-xs)',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-status-danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-ink-muted-48)'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

      {/* Suppliers */}
      <SectionCard title="Supplier">
        <SimpleList items={masterData.suppliers} onRemove={removeSupplier} />
        <div style={addRowStyle}>
          <input type="text" value={newSupplier} onChange={e => setNewSupplier(e.target.value)}
            placeholder="Nama supplier baru..." style={{ ...inputSt, flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter') { addSupplier(newSupplier); setNewSupplier(''); } }}
          />
          <button style={addBtnStyle} onClick={() => { addSupplier(newSupplier); setNewSupplier(''); }}>
            <Plus size={14} /> Tambah
          </button>
        </div>
      </SectionCard>

      {/* Trucking List (Migrated) */}
      <SectionCard title="Trucking List">
        <div style={{
          padding: '16px', backgroundColor: 'var(--color-status-info-bg)', 
          border: '1px solid var(--color-status-info)', borderRadius: 'var(--rounded-md)',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: '1.5' }}>
            <strong>Fitur dipindahkan!</strong> Pengelolaan daftar Trucking dan Forwarder kini telah terpusat di modul baru <strong>Manajemen Vendor</strong>.
          </div>
          <a href="/workspace/vendors" style={{
            fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', 
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center'
          }}>
            Pergi ke Manajemen Vendor →
          </a>
        </div>
      </SectionCard>

      {/* Depo Routes */}
      <SectionCard title="Depo Route List">
        <SimpleList items={masterData.depoRoutes} onRemove={removeDepoRoute} />
        <div style={addRowStyle}>
          <input type="text" value={newDepo} onChange={e => setNewDepo(e.target.value)}
            placeholder="mis. 40' KARAWANG" style={{ ...inputSt, flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter') { addDepoRoute(newDepo); setNewDepo(''); } }}
          />
          <button style={addBtnStyle} onClick={() => { addDepoRoute(newDepo); setNewDepo(''); }}>
            <Plus size={14} /> Tambah
          </button>
        </div>
      </SectionCard>

      {/* Warehouse Routes */}
      <SectionCard title="Warehouse Route List">
        <SimpleList items={masterData.whRoutes} onRemove={removeWhRoute} />
        <div style={addRowStyle}>
          <input type="text" value={newWh} onChange={e => setNewWh(e.target.value)}
            placeholder="mis. Marunda" style={{ ...inputSt, flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter') { addWhRoute(newWh); setNewWh(''); } }}
          />
          <button style={addBtnStyle} onClick={() => { addWhRoute(newWh); setNewWh(''); }}>
            <Plus size={14} /> Tambah
          </button>
        </div>
      </SectionCard>
    {/* Departemen (Shared Dept) */}
      <SectionCard title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Departemen (Shared Dept)</span>
          <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-ink-muted-48)', backgroundColor: 'var(--color-canvas-parchment)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--color-hairline)' }}>
            {departemenList.length} Departemen
          </span>
        </div>
      }>
        <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>
          Kelola referensi departemen tujuan penerima sharing dokumen impor (Scan Dokumen &amp; Fisik Asli) pada Dokumen Monitoring.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {departemenList.length === 0 && (
            <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>Belum ada data departemen</span>
          )}
          {departemenList.map((dept, i) => {
            const isCore = ['import', 'export', 'account officer', 'administrasi export'].includes(dept.nama_departemen.trim().toLowerCase());
            const isDeleting = deptDeletingId === dept.id;

            return (
              <div key={dept.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: i % 2 === 0 ? 'var(--color-canvas)' : 'var(--color-canvas-parchment)',
                borderRadius: 'var(--rounded-sm)',
                border: '1px solid var(--color-hairline)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-ink)', fontWeight: 500 }}>
                    {dept.nama_departemen}
                  </span>
                  {isCore && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: 'var(--color-accent)', 
                      backgroundColor: 'var(--color-accent-subtle, rgba(2, 132, 199, 0.08))', 
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      padding: '1px 6px', 
                      borderRadius: '4px', 
                      fontWeight: 600 
                    }}>
                      Sistem Utama
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleRemoveDept(dept)} 
                  disabled={isDeleting || isCore}
                  title={isCore ? 'Departemen inti sistem tidak dapat dihapus' : 'Hapus departemen'}
                  style={{
                    width: '26px', height: '26px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', background: 'transparent',
                    cursor: isCore ? 'not-allowed' : 'pointer',
                    color: isCore ? 'var(--color-ink-muted-48)' : 'var(--color-ink-muted-48)',
                    opacity: isCore ? 0.35 : (isDeleting ? 0.5 : 1),
                    borderRadius: 'var(--rounded-xs)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isCore && !isDeleting) e.currentTarget.style.color = 'var(--color-status-danger)'; }}
                  onMouseLeave={e => { if (!isCore && !isDeleting) e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
        <div style={addRowStyle}>
          <input 
            type="text" 
            value={newDept} 
            onChange={e => setNewDept(e.target.value)}
            placeholder="Nama departemen baru (mis. Logistik, Gudang, QC)..." 
            style={{ ...inputSt, flex: 1 }}
            disabled={isAddingDept}
            onKeyDown={e => { if (e.key === 'Enter') { handleAddDept(); } }}
          />
          <button 
            style={{
              ...addBtnStyle,
              opacity: (!newDept.trim() || isAddingDept) ? 0.6 : 1,
              cursor: (!newDept.trim() || isAddingDept) ? 'not-allowed' : 'pointer'
            }} 
            disabled={!newDept.trim() || isAddingDept}
            onClick={handleAddDept}
          >
            <Plus size={14} /> {isAddingDept ? 'Menambahkan...' : 'Tambah'}
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Tab: Truck Price ─────────────────────────────────────────────────────────

const TruckPriceTab = () => {
  const { masterData, addTruckPriceRow, updateTruckPriceRow, removeTruckPriceRow, addTruckRouteKey } = useImportOperationalStore();
  const [editCell, setEditCell] = useState(null); // { id, key }
  const [editVal, setEditVal] = useState('');
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptValue, setPromptValue] = useState('');


  const TRUCK_ROUTE_KEYS = masterData.truckRouteKeys || [];

  const startEdit = (id, key, val) => {
    setEditCell({ id, key });
    setEditVal(String(val));
  };

  const commitEdit = () => {
    if (!editCell) return;
    let finalVal;
    if (editCell.key === 'param') {
      finalVal = editVal.trim() || 'NEW';
    } else {
      finalVal = editVal.trim().toUpperCase() === 'N/A'
        ? 'N/A'
        : (Number(editVal.replace(/\./g, '')) || 0);
    }
    updateTruckPriceRow(editCell.id, editCell.key, finalVal);
    setEditCell(null);
    setEditVal('');
  };

  const handleAddRow = () => {
    // Generate default N/A for all existing dynamic routes
    const defaultRoutes = TRUCK_ROUTE_KEYS.reduce((acc, route) => ({ ...acc, [route.key]: 'N/A' }), {});
    addTruckPriceRow({
      param: 'NEW',
      ...defaultRoutes
    });
  };

  const handleAddRoute = () => {
    setIsPromptOpen(true);
    setPromptValue('');
  };

  const confirmAddRoute = () => {
    if (promptValue && promptValue.trim()) {
      addTruckRouteKey(promptValue.trim());
    }
    setIsPromptOpen(false);
  };


  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', marginBottom: '16px' }}>
        Tabel rate trucking per vendor per rute. Klik sel untuk edit. Isi "N/A" jika rute tidak dilayani.
      </p>
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
          <thead>
            <tr>
              <Th>Update</Th>
              <Th>Param (Vendor)</Th>
              {TRUCK_ROUTE_KEYS.map(r => <Th key={r.key} right>{r.label}</Th>)}
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {masterData.truckPrices.map((row, idx) => (
              <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--color-canvas)' : 'var(--color-canvas-parchment)' }}>
                <Td muted>{row.updatedAt}</Td>
                {/* Param editable */}
                <Td>
                  {editCell?.id === row.id && editCell?.key === 'param' ? (
                    <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                      onBlur={commitEdit} onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      style={{ ...inputSt, width: '80px', fontWeight: '700' }} />
                  ) : (
                    <span onClick={() => startEdit(row.id, 'param', row.param)}
                      style={{ fontWeight: '700', color: 'var(--color-primary)', cursor: 'pointer' }}>
                      {row.param}
                    </span>
                  )}
                </Td>
                {/* Route cells */}
                {TRUCK_ROUTE_KEYS.map(r => (
                  <Td key={r.key} right>
                    {editCell?.id === row.id && editCell?.key === r.key ? (
                      <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                        onBlur={commitEdit} onKeyDown={e => e.key === 'Enter' && commitEdit()}
                        style={{ ...inputSt, width: '100px', textAlign: 'right' }} />
                    ) : (
                      <span onClick={() => startEdit(row.id, r.key, row[r.key])}
                        style={{
                          cursor: 'pointer',
                          color: row[r.key] === 'N/A' ? 'var(--color-ink-muted-48)' : 'var(--color-ink)',
                          fontStyle: row[r.key] === 'N/A' ? 'italic' : 'normal',
                        }}>
                        {row[r.key] === 'N/A' ? 'N/A' : `Rp ${fmtRupiah(row[r.key])}`}
                      </span>
                    )}
                  </Td>
                ))}
                {/* Delete */}
                <Td>
                  <button onClick={() => removeTruckPriceRow(row.id)} style={{
                    width: '24px', height: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: 'var(--color-ink-muted-48)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-status-danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-ink-muted-48)'}
                  >
                    <Trash2 size={13} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <button onClick={handleAddRow} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px',
          borderRadius: 'var(--rounded-pill)',
          border: '1px solid var(--color-hairline)',
          backgroundColor: 'var(--color-canvas)', cursor: 'pointer',
          fontSize: '13px', fontFamily: 'var(--font-family-body)',
        }}>
          <Plus size={14} /> Tambah Vendor
        </button>
        <button onClick={handleAddRoute} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px',
          borderRadius: 'var(--rounded-pill)',
          border: '1px solid var(--color-hairline)',
          backgroundColor: 'var(--color-canvas)', cursor: 'pointer',
          fontSize: '13px', fontFamily: 'var(--font-family-body)',
          color: 'var(--color-primary)'
        }}>
          <Plus size={14} /> Tambah Lokasi Baru (Kolom)
        </button>
      </div>

      {/* Apple-style Prompt Modal */}
      {isPromptOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)',
            width: '320px',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column',
            textAlign: 'center',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>
                Tambah Lokasi Baru
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
                Masukkan nama rute tujuan (misal: 40' SEMARANG)
              </p>
              <input 
                autoFocus
                type="text" 
                value={promptValue} 
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmAddRoute(); }}
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1px solid var(--color-hairline)', borderRadius: '6px',
                  fontSize: '14px', outline: 'none', backgroundColor: 'var(--color-canvas)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              borderTop: '1px solid var(--color-hairline)'
            }}>
              <button onClick={() => setIsPromptOpen(false)} style={{
                flex: 1, padding: '14px 0',
                background: 'none', border: 'none', borderRight: '1px solid var(--color-hairline)',
                color: '#007AFF', fontSize: '15px', cursor: 'pointer'
              }}>
                Cancel
              </button>
              <button onClick={confirmAddRoute} style={{
                flex: 1, padding: '14px 0',
                background: 'none', border: 'none',
                color: '#007AFF', fontSize: '15px', fontWeight: '600', cursor: 'pointer'
              }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── Tab: Depo Price ──────────────────────────────────────────────────────────

const DEPO_FIELDS = [
  { key: 'storage',    label: 'Storage' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'recooling',  label: 'Recooling' },
  { key: 'lolo',       label: 'LoLo' },
];

const DepoPriceTab = () => {
  const { masterData, addDepoPriceRow, updateDepoPriceRow, removeDepoPriceRow } = useImportOperationalStore();
  const [editCell, setEditCell] = useState(null);
  const [editVal, setEditVal] = useState('');

  const startEdit = (id, key, val) => { setEditCell({ id, key }); setEditVal(String(val)); };
  const commitEdit = () => {
    if (!editCell) return;
    let v;
    if (editCell.key === 'param') {
      v = editVal; // Do not parse string param as number
    } else {
      v = Number(editVal.replace(/\./g, '')) || 0;
    }
    updateDepoPriceRow(editCell.id, editCell.key, v);
    setEditCell(null); setEditVal('');
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', marginBottom: '16px' }}>
        Tabel rate depo per rute. Klik sel angka untuk edit langsung.
      </p>
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
          <thead>
            <tr>
              <Th>Update</Th>
              <Th>Param (Rute)</Th>
              {DEPO_FIELDS.map(f => <Th key={f.key} right>{f.label}</Th>)}
              <Th right>Total/Hari</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {masterData.depoPrices.map((row, idx) => {
              const total = (row.storage || 0) + (row.monitoring || 0) + (row.recooling || 0) + (row.lolo || 0);
              return (
                <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--color-canvas)' : 'var(--color-canvas-parchment)' }}>
                  <Td muted>{row.updatedAt}</Td>
                  {/* Param */}
                  <Td>
                    {editCell?.id === row.id && editCell?.key === 'param' ? (
                      <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                        onBlur={commitEdit} onKeyDown={e => e.key === 'Enter' && commitEdit()}
                        style={{ ...inputSt, width: '120px', fontWeight: '600' }} />
                    ) : (
                      <span onClick={() => startEdit(row.id, 'param', row.param)}
                        style={{ fontWeight: '600', color: 'var(--color-ink)', cursor: 'pointer' }}>
                        {row.param}
                      </span>
                    )}
                  </Td>
                  {/* Rate fields */}
                  {DEPO_FIELDS.map(f => (
                    <Td key={f.key} right>
                      {editCell?.id === row.id && editCell?.key === f.key ? (
                        <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                          onBlur={commitEdit} onKeyDown={e => e.key === 'Enter' && commitEdit()}
                          style={{ ...inputSt, width: '110px', textAlign: 'right' }} />
                      ) : (
                        <span onClick={() => startEdit(row.id, f.key, row[f.key])}
                          style={{ cursor: 'pointer', color: 'var(--color-ink)' }}>
                          Rp {fmtRupiah(row[f.key] || 0)}
                        </span>
                      )}
                    </Td>
                  ))}
                  {/* Total */}
                  <Td right>
                    <strong>Rp {fmtRupiah(total)}</strong>
                  </Td>
                  {/* Delete */}
                  <Td>
                    <button onClick={() => removeDepoPriceRow(row.id)} style={{
                      width: '24px', height: '24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      color: 'var(--color-ink-muted-48)',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-status-danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-ink-muted-48)'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={() => addDepoPriceRow({ param: 'Rute Baru', storage: 0, monitoring: 0, recooling: 0, lolo: 0 })}
        style={{
          marginTop: '12px',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px',
          borderRadius: 'var(--rounded-pill)',
          border: '1px solid var(--color-hairline)',
          backgroundColor: 'var(--color-canvas)', cursor: 'pointer',
          fontSize: '13px', fontFamily: 'var(--font-family-body)',
        }}>
        <Plus size={14} /> Tambah Rute
      </button>
    </div>
  );
};

// ─── Main: MasterDataPage ─────────────────────────────────────────────────────

const TABS = ['List Data', 'Truck Price', 'Depo Price', 'Dokumen'];

const MasterDataPage = () => {
  const [activeTab, setActiveTab] = useState('List Data');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)' }}>

      {/* Header */}
      <div style={{
        padding: '24px 32px 20px',
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{
            width: '36px', height: '36px',
            backgroundColor: 'var(--color-canvas-parchment)',
            borderRadius: 'var(--rounded-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={18} color="var(--color-ink-muted-80)" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px' }}>
            Master Data Import
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', marginLeft: '48px' }}>
          Kelola data referensi untuk modul Import Operational — supplier, rute, vendor trucking, dan tarif.
        </p>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '16px' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '8px 16px',
              borderRadius: 'var(--rounded-sm)',
              border: 'none',
              backgroundColor: activeTab === t ? 'var(--color-primary)' : 'transparent',
              color: activeTab === t ? '#fff' : 'var(--color-ink-muted-80)',
              fontSize: '13px', fontWeight: activeTab === t ? '600' : '400',
              cursor: 'pointer', fontFamily: 'var(--font-family-body)',
              transition: 'background-color 0.15s, color 0.15s',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {activeTab === 'List Data'   && <ListDataTab />}
        {activeTab === 'Truck Price' && <TruckPriceTab />}
        {activeTab === 'Depo Price'  && <DepoPriceTab />}
        {activeTab === 'Dokumen'     && <MasterDataDokumen />}
      </div>
    </div>
  );
};

export default MasterDataPage;
