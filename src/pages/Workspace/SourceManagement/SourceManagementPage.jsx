import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../store/useAuthStore';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, XCircle, Info, Clock, ExternalLink, Activity } from 'lucide-react';
import Badge from '../../../components/Badge';
import ValidationPreviewTable from './ValidationPreviewTable';
import ImportHistoryList from './ImportHistoryList';
import CurrentSourcePanel from './CurrentSourcePanel';
import MatchReviewCenter from './MatchReviewCenter';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

const SourceManagementPage = () => {
  const { user } = useAuthStore();
  const token = user?.token;
  const [file, setFile] = useState(null);
  
  // States
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, validated, importing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  // Data
  const [uploadedData, setUploadedData] = useState(null);
  const [validationData, setValidationData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadState('idle');
      setErrorMessage('');
      setUploadedData(null);
      setValidationData(null);
      setImportResult(null);
    }
  };

  const handleUploadAndValidate = async () => {
    if (!file) return;

    setUploadState('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload
      const uploadRes = await fetch(`${API_BASE_URL}/source/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      
      if (!uploadJson.success) {
        throw new Error(uploadJson.error || 'Upload gagal');
      }
      
      const storedName = uploadJson.data.storedName;
      setUploadedData(uploadJson.data);

      // 2. Validate
      setUploadState('validating');
      const validateRes = await fetch(`${API_BASE_URL}/source/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storedName }),
      });
      const validateJson = await validateRes.json();

      if (!validateJson.success) {
        throw new Error(validateJson.error || 'Validasi gagal');
      }

      setValidationData(validateJson.data);
      if (validateJson.data.valid) {
        setUploadState('validated');
      } else {
        setUploadState('error');
        setErrorMessage('File tidak valid. Silakan periksa error di bawah.');
      }
    } catch (err) {
      setUploadState('error');
      setErrorMessage(err.message);
    }
  };

  const handleImport = async () => {
    if (!uploadedData || !uploadedData.storedName) return;

    setUploadState('importing');
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/source/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storedName: uploadedData.storedName,
          fileName: uploadedData.fileName,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Import gagal');
      }

      setImportResult(json.data);
      setUploadState('success');
      setHistoryTrigger(prev => prev + 1);
      setTimeout(() => {
        setShowUploadForm(false);
        resetFlow();
      }, 3000);
    } catch (err) {
      setUploadState('error');
      setErrorMessage(err.message);
    }
  };

  const resetFlow = () => {
    setFile(null);
    setUploadState('idle');
    setErrorMessage('');
    setUploadedData(null);
    setValidationData(null);
    setImportResult(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content', minHeight: 'fit-content' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>Log Schedule Source</h1>
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '14px' }}>External Log Schedule source ingestion for AE/AO operational workflow</p>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertTriangle color="#ef4444" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ color: '#991b1b', fontSize: '14px', lineHeight: '1.5' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Terdapat Kesalahan</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT vs UPLOAD FORM */}
      {!showUploadForm ? (
        <>
          <CurrentSourcePanel 
            apiBaseUrl={API_BASE_URL} 
            token={token} 
            triggerUpload={() => setShowUploadForm(true)} 
          />
          <MatchReviewCenter />
        </>
      ) : (
        <>
          {/* MAIN UPLOAD / IMPORT AREA */}
          {uploadState !== 'success' ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-hairline)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <UploadCloud size={18} />
                  Upload Log Schedule
                </h2>
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    resetFlow();
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '13px', fontWeight: '500'
                  }}
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              </div>
          
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleFileChange}
                disabled={uploadState === 'uploading' || uploadState === 'validating' || uploadState === 'importing'}
                style={{ 
                  padding: '10px 16px', 
                  border: '1px solid var(--color-hairline)', 
                  borderRadius: '6px', 
                  backgroundColor: '#f8fafc',
                  flexGrow: 1,
                  maxWidth: '400px'
                }} 
              />
              <button
                onClick={handleUploadAndValidate}
                disabled={!file || uploadState === 'uploading' || uploadState === 'validating' || uploadState === 'importing'}
                style={{
                  padding: '10px 20px',
                  backgroundColor: file ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: file ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {uploadState === 'uploading' ? 'Mengunggah...' : uploadState === 'validating' ? 'Memvalidasi...' : 'Validasi File'}
              </button>
            </div>

            {/* VALIDATION PREVIEW */}
            {validationData && (
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-hairline)', paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)' }}>Validation Preview</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ padding: '4px 12px', borderRadius: '16px', backgroundColor: '#ecfdf5', color: '#065f46', fontSize: '12px', fontWeight: '600' }}>
                      NEW: {validationData.summary.NEW}
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '12px', fontWeight: '600' }}>
                      UPDATED: {validationData.summary.UPDATED}
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: '16px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: '600' }}>
                      UNCHANGED: {validationData.summary.UNCHANGED}
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: '16px', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '12px', fontWeight: '600' }}>
                      INVALID: {validationData.summary.INVALID}
                    </div>
                  </div>
                </div>

                {!validationData.valid && validationData.fileErrors && validationData.fileErrors.length > 0 && (
                  <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: '600', color: '#991b1b', fontSize: '13px', marginBottom: '4px' }}>File Validation Errors:</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b', fontSize: '13px' }}>
                      {validationData.fileErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                {validationData.invalidRows && validationData.invalidRows.length > 0 && (
                   <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
                   <div style={{ fontWeight: '600', color: '#991b1b', fontSize: '13px', marginBottom: '8px' }}>Row Validation Errors ({validationData.invalidRows.length} rows):</div>
                   <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                     {validationData.invalidRows.map((inv, i) => (
                       <div key={i} style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>
                         <strong>Row {inv.excelRow}:</strong> {inv.errors.join('; ')}
                       </div>
                     ))}
                   </div>
                 </div>
                )}

                {validationData.preview && validationData.preview.length > 0 && (
                  <ValidationPreviewTable preview={validationData.preview} />
                )}

                {/* CONFIRM ACTION */}
                {validationData.valid && (
                  <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Info size={16} color="#3b82f6" />
                      This upload will update source-owned data and create/update internal jobs according to the synchronization rules.
                    </div>
                    <button
                      onClick={handleImport}
                      disabled={uploadState === 'importing'}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: uploadState === 'importing' ? 'not-allowed' : 'pointer',
                        opacity: uploadState === 'importing' ? 0.7 : 1
                      }}
                    >
                      {uploadState === 'importing' ? 'Ingesting...' : 'Confirm Ingestion'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SUCCESS RESULT */
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-hairline)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#10b981', marginBottom: '8px' }}>Ingestion Successful</h2>
            <p style={{ color: '#475569', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px' }}>
              The Log Schedule has been successfully ingested and the active Pipeline has been updated.
              This panel will close shortly.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <div style={{ padding: '12px 24px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>NEW RECORDS</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{importResult.summary.new}</div>
              </div>
              <div style={{ padding: '12px 24px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>UPDATED</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{importResult.summary.updated}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* HISTORY */}
      <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-hairline)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} />
            Log Schedule History
          </h2>
        </div>
        <ImportHistoryList key={historyTrigger} apiBaseUrl={API_BASE_URL} token={token} />
      </div>

    </div>
  );
};

export default SourceManagementPage;
