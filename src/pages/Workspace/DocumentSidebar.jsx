import React, { useState, useEffect } from 'react';
import useDocumentStore from '../../store/useDocumentStore';
import useAuthStore from '../../store/useAuthStore';
import { canViewAcrossDept } from '../../utils/authHelpers';

const DocumentSidebar = () => {
  const { user } = useAuthStore();
  const { 
    documents, filterType, filterDepartment, filterStatus, 
    setFilterType, setFilterDepartment, setFilterStatus,
    customDocumentTypes, addCustomDocumentType, removeCustomDocumentType
  } = useDocumentStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState('');
  
  // STATE BARU: Untuk melacak kursor (hover) dan mengatur pop-up
  const [hoveredType, setHoveredType] = useState(null);
  const [typeToDelete, setTypeToDelete] = useState(null);

  useEffect(() => {
    if (user && user.departemen && !canViewAcrossDept(user)) {
      setFilterDepartment(user.departemen);
    }
  }, [user, setFilterDepartment]);
  
  const docsForTypeCount = documents.filter(d => 
    !d.isDeleted &&
    (filterDepartment === 'Semua' || d.department === filterDepartment) &&
    (filterStatus === 'Semua' || d.status === filterStatus)
  );

  const getTypeCount = (typeName) => {
    if (typeName === 'Semua') return docsForTypeCount.length;
    return docsForTypeCount.filter(d => (d.type || d.tipe) === typeName).length;
  };

  const types = ["Semua", ...customDocumentTypes, "Lainnya"];
  
  const depts = ["Semua", "Import", "Export", "Administrasi Export (AE)", "Account Officer"];
  const statuses = ["Semua", "Tervalidasi", "Menunggu Validasi", "Kadaluarsa"];

  const handleAddNewType = () => {
    if (newType.trim()) {
      addCustomDocumentType(newType);
    }
    setNewType('');
    setIsAdding(false);
  };

  // Eksekusi hapus yang dipanggil dari Pop-up
  const confirmDelete = () => {
    if (typeToDelete) {
      removeCustomDocumentType(typeToDelete);
      if (filterType === typeToDelete) setFilterType('Semua');
      setTypeToDelete(null); // Tutup pop-up
    }
  };

  return (
    <>
      <div style={{ width: '280px', minWidth: '280px', padding: '24px', borderRight: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', overflowY: 'auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', marginBottom: '16px' }}>Tipe Dokumen</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {types.map(t => {
              const count = getTypeCount(t);
              const isActive = filterType === t;
              const isDeletable = t !== 'Semua' && t !== 'Lainnya'; 
              
              return (
                <div 
                  key={t}
                  onClick={() => setFilterType(t)}
                  onMouseEnter={() => setHoveredType(t)} // Kursor masuk
                  onMouseLeave={() => setHoveredType(null)} // Kursor keluar
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '8px 12px', borderRadius: 'var(--rounded-sm)', cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? 'var(--color-on-primary)' : 'var(--color-ink)'
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: isActive ? '600' : '400' }}>{t}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-chip-translucent)',
                      padding: '2px 8px', borderRadius: '10px'
                    }}>{count}</span>
                    
                    {/* TOMBOL HAPUS (Hanya Muncul Jika isDeletable DAN Kursor Sedang Hover) */}
                    {isDeletable && hoveredType === t && (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTypeToDelete(t); // Tampilkan Pop-up
                        }}
                        style={{ 
                          fontSize: '18px', lineHeight: '1', fontWeight: 'bold', cursor: 'pointer', 
                          padding: '0 4px', marginLeft: '4px',
                          color: isActive ? 'rgba(255,255,255,0.9)' : '#ff3b30'
                        }}
                        title="Hapus tipe dokumen ini"
                      >
                        ×
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isAdding ? (
              <div style={{ marginTop: '4px' }}>
                <input 
                  type="text" 
                  autoFocus
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNewType()}
                  onBlur={handleAddNewType}
                  placeholder="Nama tipe baru..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-primary)', fontSize: '14px', outline: 'none' }}
                />
              </div>
            ) : (
              <div 
                onClick={() => setIsAdding(true)}
                style={{ 
                  marginTop: '8px', cursor: 'pointer', color: 'var(--color-primary)', 
                  fontSize: '14px', fontWeight: '600', padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span>+ Tambah Tipe Baru</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', marginBottom: '16px' }}>Departemen</h3>
          <select 
            value={filterDepartment} 
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '15px', outline: 'none', backgroundColor: canViewAcrossDept(user) ? 'var(--color-canvas)' : 'var(--color-canvas-parchment)' }}
            disabled={!canViewAcrossDept(user)}
          >
            {depts.map(d => <option key={d} value={d}>{d === 'Export' ? 'Ekspor' : d}</option>)}
          </select>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', marginBottom: '16px' }}>Status</h3>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '15px', outline: 'none' }}
          >
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* POP-UP KONFIRMASI (Visual Clean UI ala Apple) */}
      {typeToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)', padding: '24px', borderRadius: 'var(--rounded-lg)',
            width: '360px', boxShadow: 'var(--shadow-product)', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)', margin: 0 }}>Hapus Tipe Dokumen?</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', margin: 0, lineHeight: '1.4' }}>
              Apakah Anda yakin ingin menghapus <strong>"{typeToDelete}"</strong>?
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setTypeToDelete(null)}
                style={{
                  backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline)',
                  padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: '14px', cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                style={{
                  backgroundColor: '#ff3b30', color: '#fff', border: 'none',
                  padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentSidebar;
