import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';
import usePibRequestStore from '../../../store/usePibRequestStore';
import { useAppleModal } from '../../../contexts/AppleModalContext';
import { ArrowLeft, FileText, CheckCircle, Clock, XCircle, ChevronRight, AlertCircle, FileCheck2, Landmark } from 'lucide-react';
import { fmtRupiahSigned } from '../../../utils/importCalc';

const StatusBadge = ({ status }) => {
  const styles = {
    'Draft': { bg: 'var(--color-divider-soft)', text: 'var(--color-ink-muted-80)', icon: <FileText size={12} /> },
    'Submitted': { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)', icon: <Clock size={12} /> },
    'Approved': { bg: 'var(--color-status-info-bg)', text: 'var(--color-status-info)', icon: <CheckCircle size={12} /> },
    'Realized': { bg: '#e0e7ff', text: '#4338ca', icon: <FileCheck2 size={12} /> },
    'Rejected': { bg: 'var(--color-status-danger-bg)', text: 'var(--color-status-danger)', icon: <XCircle size={12} /> },
    'Settled': { bg: 'var(--color-status-success-bg)', text: 'var(--color-status-success)', icon: <Landmark size={12} /> },
  };

  const style = styles[status] || styles['Draft'];
  
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', borderRadius: 'var(--rounded-full)',
      fontSize: '12px', fontWeight: '600',
      backgroundColor: style.bg, color: style.text
    }}>
      {style.icon}
      {status}
    </span>
  );
};

const TimelineNode = ({ status, active, date, label }) => {
  const isActive = active;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10, flex: 1 }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: 'var(--rounded-full)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-divider-soft)'}`, 
        backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-canvas)',
        color: isActive ? 'white' : 'var(--color-ink-muted-48)',
        transition: 'all 0.2s ease'
      }}>
        {isActive ? <CheckCircle size={14} /> : <div style={{ width: '6px', height: '6px', borderRadius: 'var(--rounded-full)', backgroundColor: 'var(--color-divider-soft)' }} />}
      </div>
      <div style={{ marginTop: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted-48)' }}>{status}</div>
        {date && <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '2px' }}>{date}</div>}
        {label && <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{label}</div>}
      </div>
    </div>
  );
};

const PibRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, history, fetchRequests, fetchHistory, submitRequest, approveRequest, rejectRequest, realizeRequest, settleRequest, isLoading } = usePibRequestStore();
  const { user } = useAuthStore();
  const { confirm, alert } = useAppleModal();

  const [request, setRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRealizeModal, setShowRealizeModal] = useState(false);
  const [aktualBm, setAktualBm] = useState('');
  const [aktualPpn, setAktualPpn] = useState('');
  const [aktualPph, setAktualPph] = useState('');
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchRequests();
    fetchHistory(id);
  }, [id, fetchRequests, fetchHistory]);

  useEffect(() => {
    if (requests.length > 0) {
      const found = requests.find(r => String(r.id) === String(id));
      if (found) setRequest(found);
    }
  }, [requests, id]);

  const handleSubmit = async () => {
    if (await confirm('Yakin ingin submit PIB Request ini untuk di-approve?')) {
      setError(null);
      try {
        await submitRequest(id, request.version);
        fetchHistory(id);
      } catch (e) {
        setError(e.message);
      }
    }
  };

  const handleApprove = async () => {
    if (await confirm('Approve PIB Request ini? Data akan diteruskan ke Import Operational & Realisasi PIB.')) {
      setError(null);
      try {
        await approveRequest(id, 'Approved by SPV', request.version);
        fetchHistory(id);
      } catch (e) {
        setError(e.message);
      }
    }
  };

  const handleReject = async () => {
    setError(null);
    try {
      await rejectRequest(id, rejectReason, request.version);
      setShowRejectModal(false);
      fetchHistory(id);
    } catch (e) {
      setError(e.message);
    }
  };

  const openRealizeModal = () => {
    setAktualBm(request.aktual_bm !== null ? String(request.aktual_bm) : String(request.estimasi_bm || 0));
    setAktualPpn(request.aktual_ppn !== null ? String(request.aktual_ppn) : String(request.estimasi_ppn || 0));
    setAktualPph(request.aktual_pph !== null ? String(request.aktual_pph) : String(request.estimasi_pph || 0));
    setShowRealizeModal(true);
  };

  const handleRealize = async () => {
    setError(null);
    try {
      await realizeRequest(request.id, {
        aktual_bm: parseFloat(aktualBm) || 0,
        aktual_ppn: parseFloat(aktualPpn) || 0,
        aktual_pph: parseFloat(aktualPph) || 0
      });
      setShowRealizeModal(false);
      fetchHistory(id);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSettle = async () => {
    if (await confirm('Tandai PIB Request ini sebagai Settled? Proses ini tidak bisa dibatalkan.')) {
      setError(null);
      try {
        await settleRequest(id);
        fetchHistory(id);
      } catch (e) {
        setError(e.message);
      }
    }
  };


  if (!request) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Memuat detail request...</div>;
  }

  const estTotal = request.estimasi_total || 0;
  const actTotal = request.aktual_total || 0;
  const kasbon = request.kasbon_diminta || 0;
  const selisihBm = (request.aktual_bm || 0) - (request.estimasi_bm || 0);
  const selisihPpn = (request.aktual_ppn || 0) - (request.estimasi_ppn || 0);
  const selisihPph = (request.aktual_pph || 0) - (request.estimasi_pph || 0);
  const selisihTotal = actTotal - estTotal;
  const lebihKurang = request.lebih_kurang || 0;

  const isSpv = user?.level_otoritas === 'Supervisor' || user?.level_otoritas === 'Manager';

  const cardSt = {
    backgroundColor: 'var(--color-canvas)',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-lg)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden'
  };

  const cardHeaderSt = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-hairline)',
    backgroundColor: 'var(--color-canvas-parchment)',
    fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)'
  };

  const btnPrimarySt = {
    backgroundColor: 'var(--color-primary)', color: 'white', border: '1px solid var(--color-primary)',
    padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease'
  };

  const btnSuccessSt = {
    backgroundColor: 'var(--color-status-success)', color: 'white', border: '1px solid var(--color-status-success)',
    padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease'
  };

  const btnDangerSt = {
    backgroundColor: 'var(--color-canvas)', color: 'var(--color-status-danger)', border: '1px solid var(--color-status-danger)',
    padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.15s ease'
  };

  const btnOutlineSt = {
    backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-divider-soft)',
    padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease'
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'var(--font-family-body)' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/workspace/pib-request')} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', color: 'var(--color-ink-muted-48)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Kembali ke Daftar
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fff1f1', color: '#d32f2f', padding: '12px 16px', borderRadius: 'var(--rounded-md)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #fecaca' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Header Card */}
      <div style={{ ...cardSt, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.5px' }}>{request.request_number}</h1>
              <StatusBadge status={request.status} />
            </div>
            
            {/* Metadata Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', color: 'var(--color-ink)', fontSize: '13px' }}>
              <div><span style={{ color: 'var(--color-ink-muted-48)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Import Project</span> <span style={{ fontWeight: '600' }}>{request.import_project_number}</span></div>
              <div><span style={{ color: 'var(--color-ink-muted-48)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>No. AJU PIB</span> <span style={{ fontWeight: '600' }}>{request.aju_pib}</span></div>
              <div><span style={{ color: 'var(--color-ink-muted-48)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Tanggal Pengajuan</span> <span style={{ fontWeight: '600' }}>{request.tanggal_pengajuan}</span></div>
              <div><span style={{ color: 'var(--color-ink-muted-48)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>No. Invoice PIB</span> <span style={{ fontWeight: '500' }}>{request.no_invoice_pib || '-'}</span></div>
              <div><span style={{ color: 'var(--color-ink-muted-48)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>BL Number</span> <span style={{ fontWeight: '500' }}>{request.bl_number || '-'}</span></div>
              <div><span style={{ color: 'var(--color-ink-muted-48)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>No. Shipment</span> <span style={{ fontWeight: '500' }}>{request.shipment?.un || request.shipment_code || request.shipment_manual_text || '-'}</span></div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {request.status === 'Draft' && (
              <button onClick={handleSubmit} disabled={isLoading} style={btnPrimarySt}>
                Submit untuk Approval
              </button>
            )}
            {request.status === 'Submitted' && isSpv && (
              <>
                <button onClick={() => setShowRejectModal(true)} disabled={isLoading} style={btnDangerSt}>Reject</button>
                <button onClick={handleApprove} disabled={isLoading} style={btnSuccessSt}>Approve</button>
              </>
            )}
            {request.status === 'Approved' && (
              <button onClick={openRealizeModal} style={{ ...btnSuccessSt, backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                <FileCheck2 size={14} /> Input Realisasi PIB
              </button>
            )}
            {request.status === 'Realized' && (
              <>
                <button onClick={openRealizeModal} style={{ ...btnOutlineSt, color: '#0284c7', borderColor: '#bae6fd' }}>
                  <FileCheck2 size={14} /> Edit Realisasi PIB
                </button>
                {isSpv && (
                  <button onClick={handleSettle} disabled={isLoading} style={btnSuccessSt}>
                    Tandai Settled <CheckCircle size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>


        {/* Progress Bar (Horizontal Timeline) */}
        <div style={{ position: 'relative', paddingTop: '24px', borderTop: '1px solid var(--color-hairline)' }}>
          <div style={{ position: 'absolute', top: '38px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--color-divider-soft)', zIndex: 0 }} />
          {/* Active line indicator */}
          <div style={{ 
            position: 'absolute', top: '38px', left: '10%', height: '2px', backgroundColor: 'var(--color-primary)', zIndex: 1, transition: 'width 0.3s ease',
            width: ['Submitted','Approved','Realized','Settled'].includes(request.status) ? (
              request.status === 'Settled' ? '80%' : 
              request.status === 'Realized' ? '60%' : 
              request.status === 'Approved' ? '40%' : '20%'
            ) : '0%'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'relative', zIndex: 10 }}>
            <TimelineNode status="Draft" active={true} date={request.created_at?.slice(0, 10)} label={request.pic_nama} />
            <TimelineNode status="Submitted" active={['Submitted', 'Approved', 'Realized', 'Settled'].includes(request.status)} date={request.submitted_at?.slice(0, 10)} />
            <TimelineNode status="Approved" active={['Approved', 'Realized', 'Settled'].includes(request.status)} date={request.approved_at?.slice(0, 10)} label={request.approved_by_nama} />
            <TimelineNode status="Realized" active={['Realized', 'Settled'].includes(request.status)} />
            <TimelineNode status="Settled" active={request.status === 'Settled'} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN - Financials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ ...cardSt, padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Kasbon Diminta</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '4px' }}>{fmtRupiahSigned(kasbon)}</div>
            </div>
            <div style={{ ...cardSt, padding: '16px 20px', borderLeft: '4px solid #6366f1' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Estimasi Total PIB</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '4px' }}>{fmtRupiahSigned(estTotal)}</div>
            </div>
            <div style={{ ...cardSt, padding: '16px 20px', borderLeft: `4px solid ${request.aktual_total !== null ? (lebihKurang >= 0 ? '#10b981' : '#ef4444') : 'var(--color-divider-soft)'}` }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Aktual Total PIB</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: request.aktual_total !== null ? 'var(--color-ink)' : 'var(--color-ink-muted-48)', marginTop: '4px' }}>
                {request.aktual_total !== null ? fmtRupiahSigned(actTotal) : 'Belum Realisasi'}
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div style={cardSt}>
            <div style={{ ...cardHeaderSt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Rincian Estimasi vs Aktual</span>
              {['Approved', 'Realized'].includes(request.status) && (
                <button onClick={openRealizeModal} style={{
                  background: 'none', border: 'none', color: '#0284c7', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FileCheck2 size={13} /> {request.status === 'Approved' ? '+ Input Aktual PIB' : 'Edit Aktual PIB'}
                </button>
              )}
            </div>
            <div style={{ padding: '0' }}>

              <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>
                    <th style={{ padding: '14px 20px', fontWeight: '600', width: '30%' }}>Komponen Biaya</th>
                    <th style={{ padding: '14px 20px', fontWeight: '600', width: '25%', textAlign: 'right' }}>Estimasi (Rp)</th>
                    <th style={{ padding: '14px 20px', fontWeight: '600', width: '25%', textAlign: 'right' }}>Aktual (Rp)</th>
                    <th style={{ padding: '14px 20px', fontWeight: '600', width: '20%', textAlign: 'right' }}>Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--color-ink)', fontWeight: '500' }}>Bea Masuk (BM)</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>{fmtRupiahSigned(request.estimasi_bm || 0)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: request.aktual_bm !== null ? '500' : '400' }}>
                      {request.aktual_bm !== null ? fmtRupiahSigned(request.aktual_bm) : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '500', color: selisihBm > 0 ? 'var(--color-status-danger)' : selisihBm < 0 ? 'var(--color-status-success)' : 'var(--color-ink-muted-48)' }}>
                      {request.aktual_bm !== null ? (selisihBm > 0 ? '+' : '') + fmtRupiahSigned(selisihBm) : '—'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--color-ink)', fontWeight: '500' }}>PPN Impor</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>{fmtRupiahSigned(request.estimasi_ppn || 0)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: request.aktual_ppn !== null ? '500' : '400' }}>
                      {request.aktual_ppn !== null ? fmtRupiahSigned(request.aktual_ppn) : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '500', color: selisihPpn > 0 ? 'var(--color-status-danger)' : selisihPpn < 0 ? 'var(--color-status-success)' : 'var(--color-ink-muted-48)' }}>
                      {request.aktual_ppn !== null ? (selisihPpn > 0 ? '+' : '') + fmtRupiahSigned(selisihPpn) : '—'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--color-ink)', fontWeight: '500' }}>PPH Ps 22</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>{fmtRupiahSigned(request.estimasi_pph || 0)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: request.aktual_pph !== null ? '500' : '400' }}>
                      {request.aktual_pph !== null ? fmtRupiahSigned(request.aktual_pph) : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '500', color: selisihPph > 0 ? 'var(--color-status-danger)' : selisihPph < 0 ? 'var(--color-status-success)' : 'var(--color-ink-muted-48)' }}>
                      {request.aktual_pph !== null ? (selisihPph > 0 ? '+' : '') + fmtRupiahSigned(selisihPph) : '—'}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--color-ink)' }}>TOTAL PIB</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '700', color: 'var(--color-ink)' }}>{fmtRupiahSigned(estTotal)}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '700', color: 'var(--color-ink)' }}>{request.aktual_total !== null ? fmtRupiahSigned(actTotal) : '—'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '700', color: selisihTotal > 0 ? 'var(--color-status-danger)' : selisihTotal < 0 ? 'var(--color-status-success)' : 'var(--color-ink)' }}>
                      {request.aktual_total !== null ? (selisihTotal > 0 ? '+' : '') + fmtRupiahSigned(selisihTotal) : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement Info Banner (Appears when Realized) */}
          {request.status === 'Realized' && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 'var(--rounded-lg)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(21, 128, 61, 0.05)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Landmark size={18} color="#15803d" />
                  <p style={{ margin: 0, fontWeight: '700', color: '#15803d', fontSize: '15px' }}>
                    Realisasi PIB Selesai — Siap di-Settle
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#166534', marginTop: '6px' }}>
                  {lebihKurang >= 0
                    ? `Terdapat sisa kasbon sebesar ` 
                    : `Terdapat kekurangan dana sebesar `}
                  <strong style={{ fontSize: '15px' }}>{fmtRupiahSigned(Math.abs(lebihKurang))}</strong>
                  {lebihKurang >= 0 ? ' yang harus dikembalikan.' : ' yang harus dilunasi.'}
                </p>
              </div>
              <button
                onClick={handleSettle}
                disabled={isLoading}
                style={{
                  background: '#16a34a',
                  color: 'white', border: 'none',
                  borderRadius: 'var(--rounded-md)',
                  padding: '10px 24px',
                  fontSize: '14px', fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                }}
              >
                Tandai Settled ✓
              </button>
            </div>
          )}

          {/* Settled Confirmation Banner */}
          {request.status === 'Settled' && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--rounded-lg)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--rounded-full)', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-ink)', fontSize: '15px' }}>
                  PIB Request Telah Selesai (Settled)
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
                  {lebihKurang >= 0
                    ? `Sisa kasbon ${fmtRupiahSigned(lebihKurang)} sudah dikembalikan ke Finance.`
                    : `Kekurangan dana ${fmtRupiahSigned(Math.abs(lebihKurang))} sudah dilunasi.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardSt}>
            <div style={cardHeaderSt}>Riwayat Status</div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '9px', width: '2px', backgroundColor: 'var(--color-divider-soft)' }} />
                {history.map((log, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 10 }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: 'var(--rounded-full)', backgroundColor: 'var(--color-canvas)', border: '2px solid var(--color-primary)', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: 'var(--rounded-full)', backgroundColor: 'var(--color-primary)' }} />
                    </div>
                    <div style={{ flex: '1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{log.status_ke}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', whiteSpace: 'nowrap' }}>
                          {new Date(log.dilakukan_pada).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: log.catatan ? '8px' : 0 }}>
                        Oleh: <span style={{ fontWeight: '500' }}>{log.dilakukan_oleh_nama}</span>
                      </div>
                      {log.catatan && (
                        <div style={{ fontSize: '12px', backgroundColor: 'var(--color-canvas-parchment)', padding: '10px 12px', borderRadius: 'var(--rounded-sm)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline)' }}>
                          {log.catatan}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-hairline)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Tolak PIB Request</h2>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)', marginBottom: '8px' }}>Alasan Penolakan</label>
              <textarea
                rows="4"
                style={{ width: '100%', padding: '12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', outline: 'none', fontFamily: 'var(--font-family-body)', fontSize: '13px', boxSizing: 'border-box' }}
                placeholder="Berikan alasan kenapa ditolak..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setShowRejectModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--color-divider-soft)', backgroundColor: 'var(--color-surface-pearl)', borderRadius: 'var(--rounded-pill)', cursor: 'pointer', fontSize: '13px' }}>
                  Batal
                </button>
                <button onClick={handleReject} disabled={!rejectReason} style={{ padding: '8px 16px', border: 'none', backgroundColor: 'var(--color-status-danger)', color: 'white', borderRadius: 'var(--rounded-pill)', cursor: 'pointer', fontSize: '13px', opacity: rejectReason ? 1 : 0.5 }}>
                  Tolak Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRealizeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--color-ink)' }}>Input Realisasi Aktual PIB</h2>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
                Masukkan nominal pembayaran aktual sesuai dokumen bukti bayar PIB resmi.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '6px' }}>
                  Bea Masuk (BM) Aktual (Rp)
                </label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="0"
                  value={aktualBm}
                  onChange={(e) => setAktualBm(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '6px' }}>
                  PPN Impor Aktual (Rp)
                </label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="0"
                  value={aktualPpn}
                  onChange={(e) => setAktualPpn(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '6px' }}>
                  PPH Ps 22 Aktual (Rp)
                </label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="0"
                  value={aktualPph}
                  onChange={(e) => setAktualPph(e.target.value)}
                />
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--rounded-sm)', fontSize: '13px', color: '#0369a1', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                <span>Total Aktual PIB:</span>
                <span>{fmtRupiahSigned((parseFloat(aktualBm) || 0) + (parseFloat(aktualPpn) || 0) + (parseFloat(aktualPph) || 0))}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button onClick={() => setShowRealizeModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--color-divider-soft)', backgroundColor: 'var(--color-surface-pearl)', borderRadius: 'var(--rounded-pill)', cursor: 'pointer', fontSize: '13px' }}>
                  Batal
                </button>
                <button onClick={handleRealize} disabled={isLoading} style={{ padding: '8px 18px', border: 'none', backgroundColor: '#0284c7', color: 'white', borderRadius: 'var(--rounded-pill)', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  Simpan Realisasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default PibRequestDetail;
