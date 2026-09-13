import React, { useState, useEffect } from 'react';
import Badge from '../../../components/Badge';
import { X, Calendar, FileText, Database, AlertTriangle, ArrowRight, User } from 'lucide-react';

const ImportDetailModal = ({ importId, onClose, apiBaseUrl, token }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // records: "all" | "invalid" | "changes"
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchDetail();
  }, [importId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/source/imports/${importId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err) {
      setError('Gagal mengambil detail ingestion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const parseErrors = (errStr) => {
    if (!errStr) return [];
    try {
      return JSON.parse(errStr);
    } catch {
      return [errStr];
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '1000px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* HEADER */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: '12px 12px 0 0' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)', margin: 0 }}>Log Schedule Ingestion Detail: {data?.import?.import_code || 'Loading...'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>Memuat data...</div>
          ) : error ? (
            <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px' }}>{error}</div>
          ) : data ? (
            <>
              {/* SUMMARY CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Date</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{formatDate(data.import.created_at)}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> File</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={data.import.file_name}>{data.import.file_name}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Uploaded By</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{data.import.uploaded_by_name}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /> Status</div>
                  <div><Badge label={data.import.status} variant={data.import.status === 'Success' ? 'success' : data.import.status === 'Warning' ? 'warning' : 'error'} /></div>
                </div>
              </div>

              {/* STATS */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} color="#64748b" />
                  <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Total Rows: {data.import.rows_read}</span>
                </div>
                <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#065f46', fontSize: '13px', fontWeight: '600', border: '1px solid #a7f3d0' }}>
                  NEW: {data.import.records_new}
                </div>
                <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '13px', fontWeight: '600', border: '1px solid #bfdbfe' }}>
                  UPDATED: {data.import.records_updated}
                </div>
                <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                  UNCHANGED: {data.import.records_unchanged}
                </div>
                <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '13px', fontWeight: '600', border: '1px solid #fecaca' }}>
                  INVALID: {data.import.records_invalid}
                </div>
              </div>

              {/* TABS */}
              <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--color-hairline)', marginBottom: '16px' }}>
                <button 
                  onClick={() => setActiveTab('all')}
                  style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'all' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-ink-muted)', fontWeight: activeTab === 'all' ? '600' : '500', cursor: 'pointer' }}
                >
                  All Records ({data.records.length})
                </button>
                {data.import.records_invalid > 0 && (
                  <button 
                    onClick={() => setActiveTab('invalid')}
                    style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'invalid' ? '2px solid #ef4444' : '2px solid transparent', color: activeTab === 'invalid' ? '#ef4444' : 'var(--color-ink-muted)', fontWeight: activeTab === 'invalid' ? '600' : '500', cursor: 'pointer' }}
                  >
                    Invalid Rows ({data.import.records_invalid})
                  </button>
                )}
                {data.changes && data.changes.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('changes')}
                    style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'changes' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'changes' ? '#3b82f6' : 'var(--color-ink-muted)', fontWeight: activeTab === 'changes' ? '600' : '500', cursor: 'pointer' }}
                  >
                    Change History ({data.changes.length})
                  </button>
                )}
              </div>

              {/* TAB CONTENT */}
              {activeTab === 'all' && (
                <div style={{ overflowX: 'auto', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-hairline)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Action</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Business Key</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Internal Job</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Destination</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>ETD</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Closing Docs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.records.map((rec) => (
                        <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#fff' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <Badge 
                              label={rec.sync_action} 
                              variant={rec.sync_action === 'NEW' ? 'success' : rec.sync_action === 'UPDATED' ? 'primary' : rec.sync_action === 'INVALID' ? 'error' : 'default'} 
                            />
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '500' }}>{rec.business_key}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-primary)', fontWeight: '500' }}>{rec.job_code || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>{rec.norm_destination || rec.raw_destination || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>{rec.raw_etd || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>{rec.raw_closing_docs || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'invalid' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.records.filter(r => r.sync_action === 'INVALID').map(rec => (
                    <div key={rec.id} style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600', color: '#991b1b', fontSize: '14px' }}>Business Key: {rec.business_key}</div>
                        <div style={{ fontSize: '13px', color: '#b91c1c' }}>Rows: {rec.source_row_numbers}</div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {parseErrors(rec.validation_errors).map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'changes' && (
                <div style={{ overflowX: 'auto', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-hairline)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Job</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Field Name</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Old Value</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>New Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.changes.map((change) => (
                        <tr key={change.id} style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#fff' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-primary)' }}>{change.job_code}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '500', color: '#0f172a', textTransform: 'capitalize' }}>{change.field_name.replace(/_/g, ' ')}</td>
                          <td style={{ padding: '12px 16px', color: '#ef4444', textDecoration: 'line-through' }}>{change.old_value || '(empty)'}</td>
                          <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ArrowRight size={14} color="#94a3b8" />
                            {change.new_value || '(empty)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ImportDetailModal;
