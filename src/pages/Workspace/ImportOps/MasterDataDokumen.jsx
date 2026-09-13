import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Check, Save, FileText, AlertCircle } from 'lucide-react';
import useDocumentStore from '../../../store/useDocumentStore';
import { useAppleModal } from '../../../contexts/AppleModalContext';

const MasterDataDokumen = () => {
  const { 
    customDocumentTypes, 
    fetchCustomDocumentTypes, 
    addCustomDocumentType, 
    updateDocumentType, 
    deleteDocumentType 
  } = useDocumentStore();

  const { confirm, alert } = useAppleModal();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ nama_dokumen: '', keterangan: '', is_active: true });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomDocumentTypes();
  }, [fetchCustomDocumentTypes]);

  const handleOpenModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({ 
        nama_dokumen: doc.nama_dokumen, 
        keterangan: doc.keterangan || '',
        is_active: doc.is_active === 1 || doc.is_active === true
      });
    } else {
      setEditingDoc(null);
      setFormData({ nama_dokumen: '', keterangan: '', is_active: true });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
    setFormData({ nama_dokumen: '', keterangan: '', is_active: true });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama_dokumen.trim()) {
      errors.nama_dokumen = 'Nama dokumen wajib diisi';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (editingDoc) {
        // Pass the whole object if we updated the store to handle objects
        await updateDocumentType(editingDoc.id, formData);
      } else {
        await addCustomDocumentType(formData);
      }
      handleCloseModal();
      // Optional: re-fetch to ensure sync with DB, or let the store handle optimistic updates
      fetchCustomDocumentTypes();
    } catch (error) {
      console.error('Failed to save document type:', error);
      setFormErrors({ submit: 'Gagal menyimpan data. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (await confirm(`Apakah Anda yakin ingin menghapus dokumen "${nama}"?`)) {
      try {
        await deleteDocumentType(id);
        fetchCustomDocumentTypes();
      } catch (error) {
        console.error('Failed to delete document type:', error);
        await alert(error.message || 'Gagal menghapus data.');
      }
    }
  };

  // Filter based on search
  const filteredDocs = customDocumentTypes.filter(doc => {
    if (typeof doc === 'string') return doc.toLowerCase().includes(searchQuery.toLowerCase());
    return (
      doc.nama_dokumen?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.kode_dokumen?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ flex: 1 }}>
        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: 0, marginBottom: '12px' }}>
              Kelola daftar master data jenis dokumen (termasuk penambahan tipe dokumen kustom).
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'var(--color-canvas)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--rounded-pill)',
              padding: '8px 16px',
              width: '320px',
            }}>
              <Search size={16} color="var(--color-ink-muted-48)" />
              <input
                type="text"
                placeholder="Cari kode atau nama dokumen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '13px',
                  fontFamily: 'var(--font-family-body)',
                  backgroundColor: 'transparent',
                }}
              />
            </div>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: 'var(--rounded-pill)',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-body)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={16} /> Tambah Dokumen
          </button>
        </div>


        {/* ── Table ── */}
        <div style={{
          backgroundColor: 'var(--color-canvas)',
          borderRadius: 'var(--rounded-lg)',
          border: '1px solid var(--color-hairline)',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}>
          {filteredDocs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
              <FileText size={48} color="var(--color-hairline)" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink-muted-80)' }}>
                Tidak Ada Dokumen
              </div>
              <div style={{ fontSize: '14px' }}>
                {searchQuery ? 'Tidak ada dokumen yang cocok dengan pencarian.' : 'Belum ada master data dokumen yang terdaftar.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-canvas-parchment)' }}>
                  <th style={thStyle}>Kode Dokumen</th>
                  <th style={thStyle}>Nama Dokumen</th>
                  <th style={thStyle}>Keterangan</th>
                  <th style={{ ...thStyle, width: '100px', textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle, width: '100px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, idx) => {
                  const isString = typeof doc === 'string';
                  const id = isString ? doc : doc.id;
                  const kode = isString ? '-' : doc.kode_dokumen;
                  const nama = isString ? doc : doc.nama_dokumen;
                  const keterangan = isString ? '-' : (doc.keterangan || '-');
                  
                  return (
                    <tr 
                      key={id}
                      style={{ 
                        borderBottom: idx === filteredDocs.length - 1 ? 'none' : '1px solid var(--color-hairline)',
                        backgroundColor: 'var(--color-canvas)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas)'}
                    >
                      <td style={tdStyle}>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '13px',
                          color: 'var(--color-ink-muted-80)',
                          backgroundColor: 'var(--color-canvas-parchment)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-hairline)'
                        }}>
                          {kode}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '500', color: 'var(--color-ink)' }}>{nama}</td>
                      <td style={{ ...tdStyle, color: 'var(--color-ink-muted-80)' }}>{keterangan}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {!isString && (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: doc.is_active ? 'var(--color-status-success-bg)' : 'var(--color-status-danger-bg)',
                            color: doc.is_active ? 'var(--color-status-success)' : 'var(--color-status-danger)',
                          }}>
                            {doc.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            title="Edit Dokumen"
                            onClick={() => handleOpenModal(isString ? null : doc)}
                            style={actionBtnStyle('var(--color-primary)')}
                            disabled={isString} // Disable if it's legacy string format
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            title="Hapus Dokumen"
                            onClick={() => handleDelete(id, nama)}
                            style={actionBtnStyle('var(--color-status-danger)')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal Tambah/Edit ── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)',
            borderRadius: 'var(--rounded-xl)',
            width: '480px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-canvas-parchment)',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>
                {editingDoc ? 'Edit Dokumen' : 'Tambah Dokumen'}
              </h2>
              <button 
                onClick={handleCloseModal}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-ink-muted-48)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {formErrors.submit && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--color-status-danger-bg)', 
                  color: 'var(--color-status-danger)', 
                  borderRadius: 'var(--rounded-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <AlertCircle size={16} />
                  {formErrors.submit}
                </div>
              )}

              <form id="doc-form" onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>
                    Nama Dokumen <span style={{ color: 'var(--color-status-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_dokumen}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, nama_dokumen: e.target.value }));
                      if (formErrors.nama_dokumen) setFormErrors(prev => ({ ...prev, nama_dokumen: null }));
                    }}
                    placeholder="mis. Bill of Lading"
                    style={inputStyle(!!formErrors.nama_dokumen)}
                  />
                  {formErrors.nama_dokumen && (
                    <div style={errorStyle}>{formErrors.nama_dokumen}</div>
                  )}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={labelStyle}>Keterangan (Opsional)</label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                    placeholder="mis. Wajib versi asli..."
                    style={{ ...inputStyle(false), minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '20px', marginTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--color-primary)'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--color-ink)' }}>Dokumen Aktif (Tersedia untuk Assign Import Project)</span>
                  </label>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--color-hairline)',
              backgroundColor: 'var(--color-canvas-parchment)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}>
              <button 
                type="button" 
                onClick={handleCloseModal}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--rounded-pill)',
                  border: '1px solid var(--color-hairline)',
                  backgroundColor: 'var(--color-canvas)',
                  color: 'var(--color-ink)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-body)',
                }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="doc-form"
                disabled={isSubmitting}
                style={{
                  padding: '9px 24px',
                  borderRadius: 'var(--rounded-pill)',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family-body)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Menyimpan...' : (
                  <>
                    <Check size={16} /> {editingDoc ? 'Simpan Perubahan' : 'Tambah'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Styles ───
const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px', 
  fontWeight: '600',
  color: 'var(--color-ink-muted-48)',
  textTransform: 'uppercase', 
  letterSpacing: '0.5px',
  borderBottom: '1px solid var(--color-hairline)',
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: '14px',
};

const actionBtnStyle = (color) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-ink-muted-48)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px',
  borderRadius: '4px',
  transition: 'all 0.15s',
  ':hover': {
    color: color,
    backgroundColor: 'var(--color-canvas-parchment)',
  }
});

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--color-ink)',
  marginBottom: '6px',
  letterSpacing: '-0.1px',
};

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--rounded-sm)',
  border: `1px solid ${hasError ? 'var(--color-status-danger)' : 'var(--color-hairline)'}`,
  fontSize: '14px',
  fontFamily: 'var(--font-family-body)',
  outline: 'none',
  backgroundColor: 'var(--color-canvas)',
  color: 'var(--color-ink)',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
});

const errorStyle = {
  fontSize: '12px',
  color: 'var(--color-status-danger)',
  marginTop: '4px',
};

export default MasterDataDokumen;
