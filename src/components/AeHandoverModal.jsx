import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, FileText, Check, Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';

const DEFAULT_DOCUMENTS = [
  { id: 'draft_bl', label: 'Draft BL', desc: 'Draft Bill of Lading untuk review liner' },
  { id: 'original_bl', label: 'Original BL', desc: 'Bill of Lading asli' },
  { id: 'invoice', label: 'Commercial Invoice', desc: 'Faktur komersial ekspor' },
  { id: 'packing_list', label: 'Packing List', desc: 'Daftar rincian muatan & kontainer' },
  { id: 'coo', label: 'COO (Certificate of Origin)', desc: 'Surat Keterangan Asal barang' },
  { id: 'peb_npe', label: 'PEB / NPE', desc: 'Pemberitahuan Ekspor Barang & Nota Pelayanan' },
  { id: 'shipping_instruction', label: 'Shipping Instruction', desc: 'Instruksi pengapalan / Data loading' },
  { id: 'health_cert', label: 'Fumigasi / Health Cert', desc: 'Sertifikat karantina & perlakuan' }
];

const AeHandoverModal = ({ job, onClose, onComplete }) => {
  // Per-document selection state (set of document labels)
  const [selectedDocs, setSelectedDocs] = useState(['Draft BL', 'Commercial Invoice', 'Packing List']);
  const [customDocInput, setCustomDocInput] = useState('');
  const [customDocs, setCustomDocs] = useState([]);

  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // No staff selection — routing is determined by Ka Vicky (AO Supervisor) via Pairing Center

  const toggleDoc = (docLabel) => {
    setSelectedDocs(prev => 
      prev.includes(docLabel) 
        ? prev.filter(d => d !== docLabel)
        : [...prev, docLabel]
    );
  };

  const handleAddCustomDoc = (e) => {
    e.preventDefault();
    const trimmed = customDocInput.trim();
    if (!trimmed) return;
    if (!customDocs.includes(trimmed) && !DEFAULT_DOCUMENTS.some(d => d.label.toLowerCase() === trimmed.toLowerCase())) {
      setCustomDocs(prev => [...prev, trimmed]);
      setSelectedDocs(prev => [...prev, trimmed]);
    }
    setCustomDocInput('');
  };

  const removeCustomDoc = (docLabel) => {
    setCustomDocs(prev => prev.filter(d => d !== docLabel));
    setSelectedDocs(prev => prev.filter(d => d !== docLabel));
  };

  const applyPreset = (type) => {
    if (type === 'draft') {
      setSelectedDocs(['Draft BL', 'Commercial Invoice', 'Packing List', 'Shipping Instruction']);
    } else if (type === 'original') {
      setSelectedDocs(['Original BL', 'Commercial Invoice', 'Packing List', 'COO (Certificate of Origin)', 'PEB / NPE']);
    } else if (type === 'all') {
      setSelectedDocs([...DEFAULT_DOCUMENTS.map(d => d.label), ...customDocs]);
    } else if (type === 'clear') {
      setSelectedDocs([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDocs.length === 0) {
      setError('Silakan pilih minimal satu dokumen untuk diserahterimakan.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await api(`/v2/ae/jobs/${job.id}/handover`, {
        method: 'POST',
        body: JSON.stringify({
          documents: selectedDocs,
          handover_type: selectedDocs.length === 1 ? selectedDocs[0] : selectedDocs.join(', '),
          dokumen_package: JSON.stringify(selectedDocs),
          // receiver_id NOT sent by AE — will be set automatically from ao_assignee_id (Vicky's pairing)
          remark,
          is_urgent_force: false
        })
      });
      if (res.success) {
        onComplete(res.message || 'Handover dokumen berhasil diserahkan ke Tim AO.');
      } else {
        setError(res.message || 'Gagal melakukan serah terima.');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 1000 }} 
        onClick={onClose} 
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff', borderRadius: '20px', width: '560px', maxWidth: '94vw', maxHeight: '92vh', zIndex: 1010,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Serah Terima Dokumen ke Tim AO
              </h2>
              <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                AE → DEPT AO
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Inv: <strong style={{ color: '#1e293b' }}>{job?.invoice_no}</strong> · Buyer: <strong style={{ color: '#1e293b' }}>{job?.buyer}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '8px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '10px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* ── Banner Routing Handover (Ditentukan Ka Vicky) ── */}
          {job?.ao_assignee_id ? (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(240, 253, 244, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid #86efac',
              borderRadius: '14px',
              display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📌</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d' }}>
                  Sudah Dicocokkan oleh Ka Vicky (AO Supervisor)
                </span>
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Otomatis
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#166534', paddingLeft: '26px' }}>
                Dokumen akan diterima oleh <strong>{job.ao_assignee_name ? `${job.ao_assignee_name} (Staf AO)` : `Staf AO #${job.ao_assignee_id}`}</strong> di Inboks Handover mereka.
              </div>
              {job?.ao_remarks && (
                <div style={{ fontSize: '12px', color: '#166534', paddingLeft: '26px', fontStyle: 'italic', borderTop: '1px dashed #bbf7d0', paddingTop: '8px', marginTop: '2px' }}>
                  💬 Catatan Ka Vicky: "{job.ao_remarks}"
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(239, 246, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid #93c5fd',
              borderRadius: '14px',
              display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>ℹ️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', marginBottom: '3px' }}>Menunggu Pencocokan Ka Vicky</div>
                <div style={{ fontSize: '12px', color: '#3730a3' }}>Handover ini akan masuk ke <strong>AO Control Tower</strong> dan Ka Vicky akan menentukan Staf AO yang menerima tugas ini.</div>
              </div>
            </div>
          )}

          {/* Section: Document Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                Pilih Dokumen yang Diserahkan <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => applyPreset('draft')}
                  style={{ background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                >
                  Paket Draft
                </button>
                <button 
                  type="button" 
                  onClick={() => applyPreset('original')}
                  style={{ background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                >
                  Paket Original
                </button>
                <button 
                  type="button" 
                  onClick={() => applyPreset('clear')}
                  style={{ background: 'none', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#64748b', cursor: 'pointer' }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Document Checklist Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '220px', overflowY: 'auto', padding: '2px' }}>
              {DEFAULT_DOCUMENTS.map(doc => {
                const isSelected = selectedDocs.includes(doc.label);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDoc(doc.label)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                      border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#fff',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '5px', marginTop: '2px',
                      border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                      backgroundColor: isSelected ? '#3b82f6' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#1d4ed8' : '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {doc.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {doc.desc}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Custom Added Docs */}
              {customDocs.map(docLabel => {
                const isSelected = selectedDocs.includes(docLabel);
                return (
                  <div
                    key={docLabel}
                    onClick={() => toggleDoc(docLabel)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                      border: isSelected ? '1.5px solid #8b5cf6' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#f5f3ff' : '#fff',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '5px',
                        border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                        backgroundColor: isSelected ? '#8b5cf6' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#6d28d9' : '#1e293b' }}>
                        {docLabel}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeCustomDoc(docLabel); }}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Document Input */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={customDocInput}
                onChange={e => setCustomDocInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustomDoc(e)}
                placeholder="+ Tambah dokumen khusus lainnya (misal: CoA, Asuransi...)"
                style={{ flex: 1, padding: '7px 12px', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
              {customDocInput.trim() && (
                <button 
                  type="button" 
                  onClick={handleAddCustomDoc}
                  style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> Tambah
                </button>
              )}
            </div>
            
            {/* Selected Count Badge */}
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} /> {selectedDocs.length} dokumen dipilih untuk diserahkan ke AO
            </div>
          </div>

          <form id="handover-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Remarks */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Catatan Serah Terima (Opsional)
              </label>
              <textarea 
                value={remark} 
                onChange={e => setRemark(e.target.value)}
                placeholder="Contoh: Draft BL & Packing List telah disesuaikan dengan instruksi buyer..."
                rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {selectedDocs.length === 0 ? 'Pilih dokumen terlebih dahulu' : `${selectedDocs.length} dokumen siap dikirim`}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '8px 16px', border: 'none', background: 'none', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
            >
              Batal
            </button>
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={submitting || selectedDocs.length === 0}
              style={{ 
                padding: '9px 20px', backgroundColor: selectedDocs.length === 0 ? '#94a3b8' : '#10b981', color: '#fff', borderRadius: '10px', border: 'none', 
                fontWeight: 600, fontSize: '13px', cursor: (submitting || selectedDocs.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: selectedDocs.length > 0 ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {submitting ? 'Mengirim Dokumen...' : (
                <>Serahkan ({selectedDocs.length}) Dokumen <Send size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AeHandoverModal;
