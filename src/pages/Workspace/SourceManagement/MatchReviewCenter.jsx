
import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X, RefreshCw, GitMerge, FilePlus } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import AppleConfirmModal from '../../../components/AppleConfirmModal';
import AppleToast from '../../../components/AppleToast';
import '../../Supervisor/AeControlTower.css'; 

const MatchReviewCenter = () => {
  const { user } = useAuthStore();
  const token = user?.token;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [resolvingId, setResolvingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    resolution: '',
    targetJobId: null,
    title: '',
    message: '',
  });
  const [toast, setToast] = useState({
    isOpen: false,
    type: 'success',
    message: '',
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/source/match-reviews?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || json.error || 'Failed to load match reviews');
      setReviews(json.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReviews();
  }, [token]);

  const handleResolve = (id, resolution, targetJobId = null) => {
    const isNew = resolution === 'NEW';
    setConfirmModal({
      isOpen: true,
      id,
      resolution,
      targetJobId,
      title: isNew ? 'Buat Pekerjaan Baru (New Job)?' : 'Gabungkan Data (Merge Update)?',
      message: isNew
        ? 'Baris data Log Schedule ini akan dibuat sebagai Job Order ekspor baru di sistem.'
        : 'Data Log Schedule ini akan digabungkan (merge) ke Job Order yang dipilih.',
    });
  };

  const executeResolve = async () => {
    const { id, resolution, targetJobId } = confirmModal;
    if (!id) return;
    
    setResolvingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/source/match-reviews/${id}/resolve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ resolution, targetJobId })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || json.error || 'Gagal memproses review');
      
      // Remove resolved item
      setReviews(prev => prev.filter(r => r.id !== id));
      setConfirmModal({ isOpen: false, id: null, resolution: '', targetJobId: null, title: '', message: '' });
      setToast({
        isOpen: true,
        type: 'success',
        message: `Berhasil menyelesaikan review record (${resolution}).`,
      });
    } catch(err) {
      setToast({
        isOpen: true,
        type: 'error',
        message: `Error: ${err.message}`,
      });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', height: 'fit-content' }}>
      <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-hairline, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {/* PANEL HEADER */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-hairline, #e2e8f0)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
              <GitMerge size={20} color="var(--color-primary, #2563eb)" />
              Match Review Center
            </h2>
            <p style={{ color: 'var(--color-ink-muted, #64748b)', fontSize: '13px', margin: 0 }}>
              Resolve ambiguous Log Schedule source records (Missing NO BC).
            </p>
          </div>
          <button 
            onClick={fetchReviews} 
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1',
              borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#334155',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* PANEL BODY */}
        <div style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', fontSize: '13px', marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {reviews.length === 0 && !loading && !error && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              padding: '16px 20px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                backgroundColor: '#ecfdf5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check size={18} color="#10b981" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                  No Pending Reviews
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  All source records have been matched successfully. Tidak ada baris Log Schedule ambigu yang memerlukan review manual.
                </div>
              </div>
            </div>
          )}

          {/* REVIEWS LIST */}
          {reviews.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map(review => (
                <div key={review.id} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 2px 0' }}>Invoice: {review.raw_invoice_no}</h3>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                        From: {review.source_file_name} | Baris belum memiliki NO BC.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleResolve(review.id, 'NEW')}
                        disabled={resolvingId === review.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        <FilePlus size={13} /> Force New Job
                      </button>
                      <button 
                        onClick={() => handleResolve(review.id, 'IGNORE')}
                        disabled={resolvingId === review.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        <X size={13} /> Ignore Row
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Pilih job yang sudah ada untuk menggabungkan update ini:</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {review.candidates && review.candidates.length > 0 ? review.candidates.map(candidate => (
                        <div key={candidate.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff' }}>
                          <div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>{candidate.job_code}</span>
                              <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>{candidate.no_bc || 'NO BC'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                              <span><strong>Buyer:</strong> {candidate.buyer || '-'}</span>
                              <span><strong>Dest:</strong> {candidate.destination || '-'}</span>
                              <span><strong>ETD:</strong> {candidate.etd || '-'}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleResolve(review.id, 'MERGE', candidate.id)}
                            disabled={resolvingId === review.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                          >
                            <GitMerge size={13} /> Merge Update
                          </button>
                        </div>
                      )) : (
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Tidak ditemukan kandidat yang cocok.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apple HIG Confirmation Modal */}
      <AppleConfirmModal
        isOpen={confirmModal.isOpen}
        loading={resolvingId !== null}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeResolve}
        eyebrow="KOMPAS EXIM • LOG SCHEDULE REVIEW"
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Lanjutkan"
        cancelText="Batal"
      />

      {/* Apple HIG Toast */}
      <AppleToast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default MatchReviewCenter;
