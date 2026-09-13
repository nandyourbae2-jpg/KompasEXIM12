import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Ship, Plus, X, Search, FileText } from 'lucide-react';
import '../Supervisor/AeControlTower.css'; // Keep existing table styles

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

const AeHandover = () => {
  const { user } = useAuthStore();
  const token = user?.token;

  const [handovers, setHandovers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [selectedJobId, setSelectedJobId] = useState('');
  const [handoverType, setHandoverType] = useState('');
  const [notes, setNotes] = useState('');

  const fetchHandovers = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch(`${API_BASE_URL}/ae/my-handovers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setHandovers(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setJobs(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch jobs for dropdown:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHandovers();
      fetchJobs();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJobId || !handoverType) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/ae/handovers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: selectedJobId,
          handover_type: handoverType,
          event_type: 'Sent to AO', // Default event for new handover
          notes: notes
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      // Reset form & close modal
      setIsModalOpen(false);
      setSelectedJobId('');
      setHandoverType('');
      setNotes('');
      
      // Silent refetch
      fetchHandovers(true);
    } catch (err) {
      alert(`Failed to create handover: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="ae-control-tower"><div style={{ padding: '32px', textAlign: 'center' }}>Loading Handovers...</div></div>;
  if (error) return <div className="ae-control-tower"><div style={{ color: 'red', padding: '32px' }}>Error: {error}</div></div>;

  const isFormValid = selectedJobId && handoverType;

  return (
    <div className="ae-control-tower">
      <div className="act-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="act-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ship size={24} color="#3b82f6" /> Handover to AO
          </h1>
          <p className="act-subtitle">Lacak dan serah terima dokumen operasional ke Account Officers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            backgroundColor: '#3b82f6', color: '#fff',
            padding: '10px 16px', borderRadius: '8px',
            fontWeight: 500, fontSize: '14px', border: 'none', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <Plus size={16} /> Buat Handover Dokumen
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="act-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>JOB REF</th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>HANDOVER TYPE</th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>EVENT TYPE</th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>CREATED</th>
              <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {handovers.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Belum ada riwayat handover.</td></tr>
            ) : handovers.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{h.invoice_no || `Job ID: ${h.job_id}`}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{h.buyer} {h.destination ? `· ${h.destination}` : ''}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 500 }}>
                    {h.handover_type}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 500 }}>
                    {h.event_type}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
                  {new Date(h.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }} title="View Detail">
                    <FileText size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Handover */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, transition: 'opacity 0.2s ease',
          opacity: isModalOpen ? 1 : 0
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden', transform: isModalOpen ? 'scale(1)' : 'scale(0.95)', transition: 'transform 0.2s ease'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Buat Handover Dokumen</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              
              {/* Job Ref Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>Pilih Invoice / Job <span style={{color:'red'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <select 
                    value={selectedJobId} 
                    onChange={e => setSelectedJobId(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '14px', color: '#334155',
                      appearance: 'none', backgroundColor: '#fff', outline: 'none'
                    }}
                  >
                    <option value="">-- Pilih Job --</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>Inv: {j.invoice_no} ({j.buyer})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Handover Type Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>Tipe Dokumen <span style={{color:'red'}}>*</span></label>
                <select 
                  value={handoverType} 
                  onChange={e => setHandoverType(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #cbd5e1', fontSize: '14px', color: '#334155',
                    backgroundColor: '#fff', outline: 'none'
                  }}
                >
                  <option value="">-- Pilih Tipe --</option>
                  <option value="Draft BL">Draft BL</option>
                  <option value="Original BL">Original BL</option>
                  <option value="Invoice & Packing List">Invoice & Packing List</option>
                  <option value="COO">COO</option>
                  <option value="PEB / NPE">PEB / NPE</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
              </div>

              {/* Notes Field */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>Catatan Tambahan (Opsional)</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ketik catatan untuk AO..."
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #cbd5e1', fontSize: '14px', color: '#334155',
                    backgroundColor: '#fff', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: '#fff', color: '#475569', fontWeight: 500, fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!isFormValid || submitting}
                  style={{
                    padding: '10px 16px', borderRadius: '8px', border: 'none',
                    backgroundColor: isFormValid ? '#3b82f6' : '#94a3b8', 
                    color: '#fff', fontWeight: 500, fontSize: '14px',
                    cursor: isFormValid ? 'pointer' : 'not-allowed',
                    opacity: submitting ? 0.7 : 1, transition: 'background-color 0.2s'
                  }}
                >
                  {submitting ? 'Menyimpan...' : 'Kirim Handover'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AeHandover;
