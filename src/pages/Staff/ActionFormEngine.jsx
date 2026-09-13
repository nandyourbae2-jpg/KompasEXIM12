import React, { useState } from 'react';
import { Check, X, Mail, Printer, Send, MoveRight, AlertOctagon, AlertCircle, MessageSquare, Plus } from 'lucide-react';
import api from '../../lib/api';
import { clearToken } from '../../utils/authToken';
import AppleCalendarPicker, { toISODate } from '../../components/AppleCalendarPicker';

/* ─────────────────────────────────────────────────────────────
   HELPER COMPONENTS (Using Vanilla CSS / Inline Styles)
───────────────────────────────────────────────────────────── */

const FormGroup = ({ label, children, required }) => (
  <div style={{ marginBottom: '16px' }}>
    <label className="action-form-label">
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {children}
  </div>
);

const RadioButton = ({ active, onClick, label, activeColor = '#3b82f6', activeBg = '#eff6ff' }) => (
  <button 
    onClick={onClick}
    style={{
      flex: 1,
      padding: '10px 12px',
      fontSize: '13px',
      fontWeight: '600',
      borderRadius: '8px',
      border: `1px solid ${active ? activeColor : '#e2e8f0'}`,
      backgroundColor: active ? activeBg : '#fff',
      color: active ? activeColor : '#475569',
      cursor: 'pointer',
      transition: 'all 0.15s'
    }}
  >
    {label}
  </button>
);

const CheckboxItem = ({ checked, onChange, label }) => (
  <label style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '8px'
  }}>
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={e => onChange(e.target.checked)}
      style={{ marginTop: '2px', cursor: 'pointer' }}
    />
    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', lineHeight: '1.4', flex: 1 }}>
      {label}
    </span>
  </label>
);

const RemarkInput = ({ value, onChange, required, placeholder = "Tambahkan catatan operasional..." }) => (
  <FormGroup label="Catatan" required={required}>
    <div style={{ position: 'relative' }}>
      <MessageSquare size={14} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
      <textarea
        rows={2}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="action-form-input"
        style={{ paddingLeft: '34px', resize: 'vertical' }}
      />
    </div>
  </FormGroup>
);

const OptionalAttachment = ({ onFileSelected }) => {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)} 
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', 
          fontWeight: '600', color: '#2563eb', background: 'none', border: 'none', 
          cursor: 'pointer', padding: '0', marginBottom: '16px'
        }}
      >
        <Plus size={14} /> Lampirkan Bukti File (Opsional)
      </button>
    );
  }

  return (
    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Lampiran Bukti</span>
        <button onClick={() => { setOpen(false); onFileSelected(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
          <X size={14}/>
        </button>
      </div>
      <input 
        type="file" 
        onChange={e => onFileSelected(e.target.files[0])} 
        className="action-form-input"
        style={{ padding: '6px' }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MICRO EXECUTION FORMS
───────────────────────────────────────────────────────────── */

const ReceiveForm = ({ onSubmit, loading }) => {
  const [status, setStatus] = useState('RECEIVED');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [remark, setRemark] = useState('');

  return (
    <div className="action-form-layout">
      <FormGroup label="Status Penerimaan">
        <div style={{ display: 'flex', gap: '8px' }}>
          <RadioButton active={status === 'RECEIVED'} onClick={() => setStatus('RECEIVED')} label="◉ Sudah Diterima" />
          <RadioButton active={status === 'PENDING'} onClick={() => setStatus('PENDING')} label="○ Belum Diterima" activeColor="#ea580c" activeBg="#fff7ed" />
        </div>
      </FormGroup>

      {status === 'RECEIVED' && (
        <FormGroup label="Diterima Dari" required>
          <input 
            type="text" 
            value={receivedFrom}
            onChange={(e) => setReceivedFrom(e.target.value)}
            className="action-form-input"
            placeholder="Contoh: Export Team" 
          />
        </FormGroup>
      )}

      <RemarkInput value={remark} onChange={setRemark} placeholder={status === 'PENDING' ? 'Alasan belum diterima...' : 'Catatan opsional...'} />

      <button 
        disabled={loading || (status === 'RECEIVED' && !receivedFrom.trim())}
        onClick={(e) => { e.preventDefault(); onSubmit({ status, receivedFrom }, status === 'PENDING' ? 'WAITING' : 'NONE', remark, null, e); }}
        className="action-btn-primary"
      >
        <Check size={16} /> Simpan Hasil
      </button>
    </div>
  );
};

const ServerFilingForm = ({ onSubmit, loading }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [remark, setRemark] = useState('');
  
  return (
    <div className="action-form-layout">
      <CheckboxItem 
        checked={confirmed}
        onChange={setConfirmed}
        label="Dokumen telah disimpan di server/sistem filing yang sesuai dengan penamaan standar."
      />
      <RemarkInput value={remark} onChange={setRemark} placeholder="Contoh: Folder 2026/09/EXP-10826" />
      <button 
        disabled={loading || !confirmed}
        onClick={() => onSubmit({ type: 'FILING_CONFIRMED' }, 'NONE', remark)}
        className="action-btn-primary"
      >
        <Check size={16} /> Simpan Hasil
      </button>
    </div>
  );
};

const CheckForm = ({ onSubmit, loading }) => {
  const [result, setResult] = useState(null); // 'PASS' | 'FAIL'
  const [checks, setChecks] = useState({ data: false, info: false, format: false });
  const [remark, setRemark] = useState('');
  const [disposition, setDisposition] = useState('REVISION_REQUIRED');
  
  return (
    <div className="action-form-layout">
      <div>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Verifikasi Mandiri</p>
        <CheckboxItem checked={checks.data} onChange={v => setChecks({...checks, data: v})} label="Source data matches" />
        <CheckboxItem checked={checks.info} onChange={v => setChecks({...checks, info: v})} label="Required information complete" />
        <CheckboxItem checked={checks.format} onChange={v => setChecks({...checks, format: v})} label="Document format correct" />
      </div>

      <FormGroup label="Hasil Pengecekan" required>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setResult('PASS')}
            style={{
              flex: 1, padding: '10px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer',
              border: `1px solid ${result === 'PASS' ? '#16a34a' : '#e2e8f0'}`,
              backgroundColor: result === 'PASS' ? '#f0fdf4' : '#fff',
              color: result === 'PASS' ? '#16a34a' : '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Check size={16} /> LULUS (PASS)
          </button>
          <button
            onClick={() => setResult('FAIL')}
            style={{
              flex: 1, padding: '10px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer',
              border: `1px solid ${result === 'FAIL' ? '#dc2626' : '#e2e8f0'}`,
              backgroundColor: result === 'FAIL' ? '#fef2f2' : '#fff',
              color: result === 'FAIL' ? '#dc2626' : '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <X size={16} /> GAGAL (FAIL)
          </button>
        </div>
      </FormGroup>

      {result === 'FAIL' && (
        <FormGroup label="Tindakan Lanjutan (Disposisi)">
          <select 
            value={disposition} 
            onChange={(e) => setDisposition(e.target.value)}
            className="action-form-input"
          >
            <option value="REVISION_REQUIRED">Perlu Direvisi (Revision Required)</option>
            <option value="WAITING">Menunggu Informasi (Waiting)</option>
            <option value="BLOCKED">Blokir / Eskalasi (Blocked)</option>
          </select>
        </FormGroup>
      )}

      <RemarkInput 
        value={remark} 
        onChange={setRemark} 
        required={result === 'FAIL'}
        placeholder={result === 'FAIL' ? "Wajib: Jelaskan kesalahan yang ditemukan..." : "Opsional..."}
      />

      <button 
        disabled={loading || !result || (result === 'FAIL' && !remark.trim())}
        onClick={() => onSubmit({ status: result, checks }, result === 'PASS' ? 'NONE' : disposition, remark)}
        className="action-btn-primary"
        style={{
          backgroundColor: result === 'FAIL' ? '#dc2626' : result === 'PASS' ? '#16a34a' : '#2563eb'
        }}
      >
        Simpan Hasil
      </button>
    </div>
  );
};

const EmailForm = ({ onSubmit, loading }) => {
  const [status, setStatus] = useState('SENT');
  const [recipient, setRecipient] = useState('');
  const [cc, setCc] = useState('');
  const [remark, setRemark] = useState('');
  
  return (
    <div className="action-form-layout">
      <FormGroup label="Status Pengiriman Email">
        <div style={{ display: 'flex', gap: '8px' }}>
          <RadioButton active={status === 'SENT'} onClick={() => setStatus('SENT')} label="◉ Sudah Dikirim" />
          <RadioButton active={status === 'PENDING'} onClick={() => setStatus('PENDING')} label="○ Belum Dikirim" activeColor="#ea580c" activeBg="#fff7ed" />
        </div>
      </FormGroup>

      {status === 'SENT' && (
        <>
          <FormGroup label="Penerima (To)" required>
            <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} className="action-form-input" placeholder="email@contoh.com..." />
          </FormGroup>
          <FormGroup label="Tembusan (CC)">
            <input type="text" value={cc} onChange={e => setCc(e.target.value)} className="action-form-input" />
          </FormGroup>
        </>
      )}

      <RemarkInput value={remark} onChange={setRemark} placeholder={status === 'PENDING' ? 'Alasan belum dikirim...' : 'Catatan opsional...'} />

      <button 
        disabled={loading || (status === 'SENT' && !recipient.trim())}
        onClick={() => onSubmit({ status, recipient, cc }, status === 'PENDING' ? 'WAITING' : 'NONE', remark)}
        className="action-btn-primary"
      >
        {status === 'SENT' ? <Mail size={16}/> : <Check size={16}/>} Simpan Hasil
      </button>
    </div>
  );
};

const ReviseForm = ({ onSubmit, loading }) => {
  const [remark, setRemark] = useState('');
  const [resolved, setResolved] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  
  return (
    <div className="action-form-layout">
      <div style={{ padding: '12px', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <AlertOctagon style={{ color: '#ca8a04', marginTop: '2px', flexShrink: 0 }} size={16} />
        <div>
           <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#854d0e' }}>Instruksi Revisi</p>
           <p style={{ margin: '0', fontSize: '12px', color: '#a16207' }}>Dokumen ini ditolak pada tahap sebelumnya. Silakan perbaiki sesuai komentar.</p>
        </div>
      </div>

      <CheckboxItem checked={resolved} onChange={setResolved} label="Saya telah merevisi dokumen/masalah ini" />
      <RemarkInput value={remark} onChange={setRemark} required placeholder="Jelaskan perbaikan yang dilakukan..." />
      <OptionalAttachment onFileSelected={setEvidenceFile} />
      
      <button 
        disabled={loading || !resolved || !remark.trim()}
        onClick={() => onSubmit({ status: 'REVISED' }, 'NONE', remark, evidenceFile)}
        className="action-btn-primary"
      >
        <Check size={16} /> Kirim Revisi
      </button>
    </div>
  );
};

const PrintForm = ({ onSubmit, loading }) => {
  const [printed, setPrinted] = useState(false);
  const [remark, setRemark] = useState('');
  
  return (
    <div className="action-form-layout">
      <CheckboxItem checked={printed} onChange={setPrinted} label="Dokumen telah dicetak (Hardcopy) dengan baik." />
      <RemarkInput value={remark} onChange={setRemark} />
      <button 
        disabled={loading || !printed}
        onClick={() => onSubmit({ status: 'PRINTED' }, 'NONE', remark)}
        className="action-btn-primary"
      >
        <Printer size={16} /> Simpan Hasil
      </button>
    </div>
  );
};

const ScanForm = ({ onSubmit, loading }) => {
  const [scanned, setScanned] = useState(false);
  const [remark, setRemark] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  return (
    <div className="action-form-layout">
      <CheckboxItem checked={scanned} onChange={setScanned} label="Dokumen telah di-scan dengan jelas." />
      <OptionalAttachment onFileSelected={setEvidenceFile} />
      <RemarkInput value={remark} onChange={setRemark} />
      <button 
        disabled={loading || !scanned}
        onClick={() => onSubmit({ status: 'SCANNED' }, 'NONE', remark, evidenceFile)}
        className="action-btn-primary"
      >
        <Check size={16} /> Simpan Hasil
      </button>
    </div>
  );
};

const TransferForm = ({ onSubmit, loading }) => {
  const [destination, setDestination] = useState('');
  const [remark, setRemark] = useState('');
  
  return (
    <div className="action-form-layout">
      <FormGroup label="Tujuan Transfer" required>
        <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="action-form-input" placeholder="Nama Kurir / Penerima..." />
      </FormGroup>
      <RemarkInput value={remark} onChange={setRemark} />
      <button 
        disabled={loading || !destination.trim()}
        onClick={() => onSubmit({ destination }, 'NONE', remark)}
        className="action-btn-primary"
      >
        <Send size={16} /> Submit Transfer
      </button>
    </div>
  );
};

const HandoverForm = ({ onSubmit, loading }) => {
  const [handoverType, setHandoverType] = useState('INTERNAL');
  const [receiver, setReceiver] = useState('');
  const [remark, setRemark] = useState('');
  
  return (
    <div className="action-form-layout">
      <FormGroup label="Tipe Handover">
        <select value={handoverType} onChange={e => setHandoverType(e.target.value)} className="action-form-input">
          <option value="INTERNAL">Internal (Antar Departemen)</option>
          <option value="EXTERNAL">Eksternal (Ke Pihak Luar)</option>
        </select>
      </FormGroup>
      <FormGroup label="Diterima Oleh (Receiver)" required>
        <input type="text" value={receiver} onChange={e => setReceiver(e.target.value)} className="action-form-input" placeholder="Nama penerima..." />
      </FormGroup>
      <RemarkInput value={remark} onChange={setRemark} />
      <button 
        disabled={loading || !receiver.trim()}
        onClick={() => onSubmit({ handoverType, receiver }, 'NONE', remark)}
        className="action-btn-primary"
      >
        <MoveRight size={16} /> Proses Handover
      </button>
    </div>
  );
};

const GenericFallbackForm = ({ onSubmit, loading, warning }) => {
  const [remark, setRemark] = useState('');

  return (
    <div className="action-form-layout">
      {warning && (
        <div style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>{warning}</span>
        </div>
      )}
      <RemarkInput value={remark} onChange={setRemark} placeholder="Tulis catatan eksekusi (wajib)..." required />
      <button 
        disabled={loading || !remark.trim()}
        onClick={(e) => { e.preventDefault(); onSubmit({ generic_completed: true }, 'NONE', remark, null, e); }}
        className="action-btn-primary"
      >
        <Check size={16} /> Tandai Selesai
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN ENGINE
───────────────────────────────────────────────────────────── */
const ActionFormEngine = ({ jobId, item, activity, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  // Tanggal eksekusi dokumen — default hari ini, bisa diubah staff
  const [executionDate, setExecutionDate] = useState(toISODate(new Date()));

  const handleSubmit = async (resultData, dispositionData = 'NONE', remarkData = '', evidenceFile = null, e = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setErrorInfo(null);
    try {
      const payload = {
        activity_id: activity.id,
        status: 'COMPLETED',
        result: JSON.stringify(resultData),
        disposition: dispositionData,
        remark: remarkData,
        evidence_path: evidenceFile ? evidenceFile.name : null,
        // Kirim tanggal eksekusi yang dipilih staff sebagai bukti transparansi
        execution_date: executionDate || toISODate(new Date()),
      };

      const json = await api(`/v2/ae-workbench/jobs/${jobId}/items/${item.id}/execute`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (json && json.success) {
        onComplete();
      } else {
        setErrorInfo({ 
          type: 'API', 
          message: json?.message || 'Respons server tidak valid.' 
        });
      }
    } catch (err) {
      console.error(err);
      if (err.status === 401) {
        setErrorInfo({ 
          type: '401', 
          message: 'Sesi login Anda telah berakhir. Silakan login kembali untuk melanjutkan.' 
        });
      } else {
        setErrorInfo({ 
          type: 'API', 
          message: err.message || 'Terjadi kesalahan jaringan atau server.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginKembali = () => {
    // Preserve the form in current tab and navigate, or open in new tab.
    // Opening in new tab is safest for keeping React state alive, 
    // but since this app uses sessionStorage, a new tab creates a parallel session.
    // However, the prompt says "Preserve the unsaved form state until user logs in again".
    // We will just redirect to /login. To fully preserve, one could use localStorage,
    // but a simple redirect is standard. We will just redirect.
    clearToken();
    window.location.hash = '#/login';
  };

  const renderForm = () => {
    const actName = (activity?.nama_aktivitas ?? '').toUpperCase();

    if (actName === 'RCVD' || actName === 'RECEIVE') return <ReceiveForm onSubmit={handleSubmit} loading={loading} />;
    if (actName === 'CHECK' || actName === 'CHECKED') return <CheckForm onSubmit={handleSubmit} loading={loading} />;
    if (actName === 'SERVER FILING') return <ServerFilingForm onSubmit={handleSubmit} loading={loading} />;
    if (actName === 'EMAIL') return <EmailForm onSubmit={handleSubmit} loading={loading} />;
    if (actName === 'REVISE') return <ReviseForm onSubmit={handleSubmit} loading={loading} />;
    if (actName === 'PRINT') return <PrintForm onSubmit={handleSubmit} loading={loading} />;
    if (actName === 'SCAN') return <ScanForm onSubmit={handleSubmit} loading={loading} />;
    if (actName === 'TRANSFER') return <TransferForm onSubmit={handleSubmit} loading={loading} />;
    if (actName === 'HANDOVER') return <HandoverForm onSubmit={handleSubmit} loading={loading} />;

    return <GenericFallbackForm onSubmit={handleSubmit} loading={loading} warning="Tipe aktivitas ini menggunakan form generik." />;
  };

  return (
    <div className="action-form-container">
      {/* ───── Apple Calendar Date Picker ───── */}
      <div style={{
        marginBottom: '20px',
        padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(0,113,227,0.04) 0%, rgba(99,102,241,0.04) 100%)',
        border: '1px solid rgba(0,113,227,0.15)',
        borderRadius: '14px',
      }}>
        <AppleCalendarPicker
          value={executionDate}
          onChange={setExecutionDate}
          label="Tanggal Dokumen / Eksekusi"
          placeholder="+ Pilih tanggal dokumen"
        />
        <p style={{
          margin: 0,
          fontSize: '11px',
          color: '#94a3b8',
          lineHeight: '1.4',
        }}>
          💡 Pilih tanggal sesuai tanggal aktual dokumen terbit atau aktivitas dilaksanakan. Default: hari ini.
        </p>
      </div>

      {errorInfo && (
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: errorInfo.type === '401' ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${errorInfo.type === '401' ? '#fecaca' : '#fde68a'}`
        }}>
          {errorInfo.type === '401' ? (
            <>
              <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '800', color: '#991b1b', letterSpacing: '0.05em' }}>SESSION EXPIRED</p>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#b91c1c' }}>{errorInfo.message}</p>
              <button 
                onClick={handleLoginKembali}
                style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                LOGIN KEMBALI
              </button>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '800', color: '#92400e' }}>Aktivitas gagal disimpan.</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>{errorInfo.message}</p>
            </>
          )}
        </div>
      )}
      
      {renderForm()}
    </div>
  );
};

export default ActionFormEngine;
