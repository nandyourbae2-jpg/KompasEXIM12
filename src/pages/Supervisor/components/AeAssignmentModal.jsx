import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

const AeAssignmentModal = ({ job, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const token = user?.token;
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(job?.ae_assignee_id || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [workbench, setWorkbench] = useState({});
  const [loadingWorkbench, setLoadingWorkbench] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  useEffect(() => {
    fetchStaff();
    fetchWorkbench();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/staff-workload`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Gagal memuat daftar staff');
      setStaffList(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchWorkbench = async () => {
    setLoadingWorkbench(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${job.id}/workbench`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
          setWorkbench(json.data.workbench || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWorkbench(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${job.id}/assignment`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          assigneeId: selectedStaffId ? parseInt(selectedStaffId, 10) : null
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Gagal menyimpan assignment');
      onSuccess(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      animation: 'actFadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '88vh',
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        color: 'var(--color-ink, #1d1d1f)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-divider-soft, #f0f0f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          flexShrink: 0
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--color-ink-muted-48, #7a7a7a)', marginBottom: '2px' }}>
              DELEGASI PENUGASAN AE
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-ink, #1d1d1f)', margin: 0, letterSpacing: '-0.3px' }}>
              Invoice {job?.invoice_no || 'Unknown'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-ink-muted-48, #7a7a7a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.09)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 59, 48, 0.08)',
              color: 'var(--color-status-danger, #ff3b30)',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid rgba(255, 59, 48, 0.2)'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink, #1d1d1f)', marginBottom: '8px', letterSpacing: '-0.15px' }}>
                Tugaskan kepada Staf AE
              </label>
              {loading ? (
                <div style={{ padding: '12px', color: 'var(--color-ink-muted-48, #7a7a7a)', fontSize: '13px' }}>
                  Memuat daftar staf…
                </div>
              ) : (
                <select 
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-hairline, #e0e0e0)', 
                    fontSize: '13px',
                    color: 'var(--color-ink, #1d1d1f)',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">— Belum Ditugaskan (Unassigned) —</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.nama} ({staff.workload.inProgress} job aktif)
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div style={{
              padding: '14px 18px',
              backgroundColor: 'var(--color-surface-pearl, #fafafc)',
              borderRadius: '14px',
              fontSize: '12px',
              color: 'var(--color-ink-muted-80, #333333)',
              border: '1px solid var(--color-hairline, #e0e0e0)'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--color-ink, #1d1d1f)', fontSize: '13px' }}>
                Ringkasan Job
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><span style={{ color: 'var(--color-ink-muted-48, #7a7a7a)' }}>Dest:</span> <b>{job?.destination || '-'}</b></div>
                <div><span style={{ color: 'var(--color-ink-muted-48, #7a7a7a)' }}>Buyer:</span> <b>{job?.buyer || '-'}</b></div>
                <div><span style={{ color: 'var(--color-ink-muted-48, #7a7a7a)' }}>Closing:</span> <b>{job?.closing_docs || '-'}</b></div>
                <div><span style={{ color: 'var(--color-ink-muted-48, #7a7a7a)' }}>ETD:</span> <b>{job?.etd || '-'}</b></div>
              </div>
            </div>
          </div>
          
          {/* Drilldown Workbench */}
          <div>
            <h3 style={{
              margin: '0 0 14px 0',
              fontSize: '14px',
              color: 'var(--color-ink, #1d1d1f)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              letterSpacing: '-0.2px'
            }}>
              <Layers size={15} color="var(--color-primary, #0066cc)" />
              <span>Pipeline &amp; Milestone Drilldown</span>
            </h3>
            
            {loadingWorkbench ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-muted-48, #7a7a7a)', fontSize: '13px' }}>
                Memuat rincian checklist…
              </div>
            ) : Object.keys(workbench).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-ink-muted-48, #7a7a7a)', background: 'var(--color-surface-pearl, #fafafc)', borderRadius: '12px', fontSize: '13px' }}>
                Checklist belum diinisialisasi untuk job ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.keys(workbench).map(stageName => (
                  <div key={stageName} style={{ border: '1px solid var(--color-hairline, #e0e0e0)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{
                      padding: '8px 16px',
                      background: 'var(--color-canvas-parchment, #f5f5f7)',
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: 'var(--color-ink-muted-48, #7a7a7a)',
                      borderBottom: '1px solid var(--color-hairline, #e0e0e0)'
                    }}>
                      {stageName}
                    </div>
                    <div style={{ padding: '14px 16px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.keys(workbench[stageName]).map(docName => {
                        const docData = workbench[stageName][docName];
                        return (
                          <div key={docName} style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '10px', borderBottom: '1px dashed var(--color-divider-soft, #f0f0f0)' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink, #1d1d1f)' }}>
                              {docName} <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48, #7a7a7a)', fontWeight: 500, marginLeft: '6px' }}>V{docData.activities[0]?.version || 1}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {docData.activities.map(act => (
                                <span key={act.id} style={{ 
                                  fontSize: '11px',
                                  padding: '3px 10px',
                                  borderRadius: 'var(--rounded-pill, 9999px)', 
                                  background: act.status === 'COMPLETED' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                                  color: act.status === 'COMPLETED' ? '#248a3d' : 'var(--color-ink-muted-48, #7a7a7a)',
                                  fontWeight: act.status === 'COMPLETED' ? 600 : 500
                                }}>
                                  {act.status === 'COMPLETED' ? '✓ ' : '○ '}{act.activity_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-divider-soft, #f0f0f0)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          backgroundColor: '#ffffff',
          flexShrink: 0
        }}>
          <button 
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--rounded-pill, 9999px)',
              border: '1px solid var(--color-hairline, #e0e0e0)',
              backgroundColor: '#ffffff',
              color: 'var(--color-ink, #1d1d1f)',
              fontWeight: 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Batal
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              padding: '8px 22px',
              borderRadius: 'var(--rounded-pill, 9999px)',
              border: 'none',
              backgroundColor: 'var(--color-primary, #0066cc)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: (saving || loading) ? 'not-allowed' : 'pointer',
              opacity: (saving || loading) ? 0.7 : 1,
              transition: 'transform 0.1s ease',
              boxShadow: '0 1px 2px rgba(0, 102, 204, 0.2)'
            }}
            onMouseDown={(e) => !(saving || loading) && (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => !(saving || loading) && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {saving ? 'Menyimpan…' : 'Simpan Penugasan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AeAssignmentModal;
