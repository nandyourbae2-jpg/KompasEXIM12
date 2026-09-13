import React, { useState } from 'react';
import useVendorStore from '../../../store/useVendorStore';
import { X, CheckCircle, XCircle, Edit3 } from 'lucide-react';

const VendorReviewModal = ({ vendor, onClose }) => {
  const { updateVendor, fetchVendors } = useVendorStore();
  const [decision, setDecision] = useState(null); // 'KEEP', 'NON_VENDOR', 'CHANGE_TYPE'
  const [newType, setNewType] = useState('Forwarder');
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Since we only pass 'vendor' with some aggregated stats, we parse total usage.
  // In a real scenario we'd do a dedicated endpoint, but here we can sum up existing jobs if injected.
  const totalUsage = vendor.total_jobs || 0; // The query in /vendors/monitoring includes total_jobs

  const handleDecisionClick = (type) => {
    setDecision(type);
    setShowConfirm(true);
  };

  const getConfirmMessage = () => {
    if (decision === 'KEEP') return "Anda akan mengkonfirmasi vendor ini sebagai Vendor Master aktif.";
    if (decision === 'NON_VENDOR') return "Vendor ini akan dinonaktifkan dari Vendor Master. Historical transactions tetap dipertahankan.";
    if (decision === 'CHANGE_TYPE') return `Vendor Type akan diubah menjadi ${newType} sesuai keputusan Anda.`;
    return "";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        version: vendor.version,
        review_note: reviewNote
      };

      if (decision === 'KEEP') {
        payload.review_status = 'CONFIRMED';
        payload.status = 'Aktif';
      } else if (decision === 'NON_VENDOR') {
        payload.review_status = 'NON_VENDOR';
        payload.status = 'Tidak Aktif';
      } else if (decision === 'CHANGE_TYPE') {
        payload.review_status = 'CONFIRMED';
        payload.status = 'Aktif';
        payload.service_type = newType;
      }

      await updateVendor(vendor.id, payload);
      await fetchVendors(); // Refresh the list
      onClose();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan review. Pastikan Anda memiliki hak akses yang cukup atau refresh halaman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--color-canvas)', width: '100%', maxWidth: '600px',
        borderRadius: 'var(--rounded-xl)', boxShadow: 'var(--shadow-modal)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>Business Review: Vendor Master</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-ink-muted-48)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Vendor Info */}
          <div style={{ marginBottom: '24px', backgroundColor: 'var(--color-canvas-parchment)', padding: '16px', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Vendor Name</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)' }}>{vendor.nama}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', fontFamily: 'monospace', marginTop: '2px' }}>ID: {vendor.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Current Classification</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-ink)' }}>{vendor.service_type}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Current Status</div>
                <div style={{ fontSize: '14px', color: 'var(--color-ink)' }}>{vendor.status}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Review State</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-warning)' }}>{vendor.review_status}</div>
              </div>
            </div>
          </div>

          {/* Usage Evidence */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '12px' }}>Usage Evidence</h3>
            <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '12px' }}>
              {totalUsage > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Job Order Usage</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{totalUsage}</span>
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', fontStyle: 'italic' }}>No transaction usage recorded.</div>
              )}
            </div>
          </div>

          {/* Decisions */}
          {!showConfirm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>Decision</h3>
              
              <button onClick={() => handleDecisionClick('KEEP')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--color-status-success-bg)', border: '1px solid var(--color-status-success)', borderRadius: 'var(--rounded-lg)', cursor: 'pointer', textAlign: 'left' }}>
                <CheckCircle size={24} color="var(--color-status-success)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-success)' }}>KEEP AS VENDOR</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink)', marginTop: '4px' }}>Vendor dikonfirmasi sebagai canonical Vendor Master.</div>
                </div>
              </button>

              <button onClick={() => handleDecisionClick('CHANGE_TYPE')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--color-status-info-bg)', border: '1px solid var(--color-status-info)', borderRadius: 'var(--rounded-lg)', cursor: 'pointer', textAlign: 'left' }}>
                <Edit3 size={24} color="var(--color-status-info)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-info)' }}>Change Vendor Type</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink)', marginTop: '4px' }}>Ubah layanan dari {vendor.service_type} ke entitas valid lainnya.</div>
                </div>
              </button>

              <button onClick={() => handleDecisionClick('NON_VENDOR')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--color-status-error-bg)', border: '1px solid var(--color-status-error)', borderRadius: 'var(--rounded-lg)', cursor: 'pointer', textAlign: 'left' }}>
                <XCircle size={24} color="var(--color-status-error)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-error)' }}>Mark as NON-VENDOR</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink)', marginTop: '4px' }}>Record bukan Vendor Master dan akan dinonaktifkan.</div>
                </div>
              </button>
            </div>
          )}

          {/* Confirmation Step */}
          {showConfirm && (
            <div style={{ backgroundColor: 'var(--color-canvas-parchment)', padding: '20px', borderRadius: 'var(--rounded-lg)', border: `1px solid var(--color-hairline)` }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '12px' }}>
                Konfirmasi Keputusan
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', marginBottom: '16px' }}>
                {getConfirmMessage()}
              </div>

              {decision === 'CHANGE_TYPE' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '6px' }}>Pilih Vendor Type Baru:</label>
                  <select 
                    value={newType} 
                    onChange={e => setNewType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas)' }}
                  >
                    <option value="Forwarder">Forwarder</option>
                    <option value="Trucking">Trucking</option>
                    <option value="Both">Both (Forwarder + Trucking)</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '6px' }}>Review Note (Optional):</label>
                <textarea 
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Tambahkan catatan untuk keputusan ini..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas)', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowConfirm(false)}
                  style={{ padding: '10px 16px', backgroundColor: 'transparent', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', color: 'var(--color-ink)', fontWeight: '500', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{ 
                    padding: '10px 16px', 
                    backgroundColor: decision === 'NON_VENDOR' ? 'var(--color-status-error)' : 'var(--color-primary)', 
                    border: 'none', 
                    borderRadius: 'var(--rounded-md)', 
                    color: 'white', 
                    fontWeight: '500', 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Menyimpan...' : decision === 'NON_VENDOR' ? 'Confirm & Deactivate' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VendorReviewModal;
