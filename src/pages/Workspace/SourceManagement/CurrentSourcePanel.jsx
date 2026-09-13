import React, { useState, useEffect } from 'react';
import { Database, FileText, Clock, FileSpreadsheet, AlertTriangle, List, ArrowRight } from 'lucide-react';

const CurrentSourcePanel = ({ apiBaseUrl, token, triggerUpload }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveSource();
  }, []);

  const fetchActiveSource = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/source/imports/active/changes?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || json.error || 'Gagal memuat sumber aktif');
      setData(json.data);
    } catch (err) {
      setError(err.message);
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

  if (loading) return <div style={{ padding: '24px' }}>Loading active source...</div>;
  if (error) return <div style={{ padding: '24px', color: '#ef4444' }}>Error: {error}</div>;

  const { activeImport, changes } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. ACTIVE SOURCE HEADER & SUMMARY */}
      <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-hairline)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Database size={20} color="var(--color-primary)" />
              Current Source Layer
            </h2>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '13px', margin: 0 }}>
              The current active version of Log Schedule governing Pipeline data.
            </p>
          </div>
          <button
            onClick={triggerUpload}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-ink)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileSpreadsheet size={16} />
            Ingest New Version
          </button>
        </div>
        
        {activeImport ? (
          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Active Import Code</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-primary)' }}>{activeImport.import_code}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Source File</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={activeImport.file_name}>
                  {activeImport.file_name}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Ingestion Date</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{formatDate(activeImport.created_at)}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Uploaded By</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{activeImport.uploaded_by_name}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Source Row Count</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{activeImport.rows_read}</div>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '12px' }}>Import Result Summary</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#065f46', fontSize: '14px', fontWeight: '600', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between' }}>
                <span>NEW CREATED</span>
                <span>{activeImport.records_new}</span>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '14px', fontWeight: '600', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between' }}>
                <span>JOBS UPDATED</span>
                <span>{activeImport.records_updated}</span>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '14px', fontWeight: '600', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>UNCHANGED</span>
                <span>{activeImport.records_unchanged}</span>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '14px', fontWeight: '600', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between' }}>
                <span>INVALID ROWS</span>
                <span>{activeImport.records_invalid}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: '500' }}>No Active Source</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>Please ingest a Log Schedule file to populate the pipeline.</div>
          </div>
        )}
      </div>

      {/* 2. SOURCE CHANGES LIST */}
      {activeImport && (
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-hairline)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <List size={18} color="var(--color-ink-muted-80)" />
              Value Changes Enforced by Source
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
              Showing {changes.length} field modifications applied to existing Jobs.
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1, boxShadow: '0 1px 0 var(--color-hairline)' }}>
                <tr>
                  <th style={{ padding: '12px 24px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Affected Job</th>
                  <th style={{ padding: '12px 24px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Shipment Context</th>
                  <th style={{ padding: '12px 24px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Field Name</th>
                  <th style={{ padding: '12px 24px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Previous Value</th>
                  <th style={{ padding: '12px 24px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>New Value (Source)</th>
                </tr>
              </thead>
              <tbody>
                {changes.length > 0 ? changes.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#fff' }}>
                    <td style={{ padding: '12px 24px', fontWeight: '600', color: 'var(--color-primary)' }}>{c.job_code}</td>
                    <td style={{ padding: '12px 24px' }}>
                      <div style={{ fontWeight: '500' }}>{c.buyer}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>{c.destination} • {c.vessel || 'TBA'}</div>
                    </td>
                    <td style={{ padding: '12px 24px', fontWeight: '500', color: '#475569' }}>{c.field_name}</td>
                    <td style={{ padding: '12px 24px', color: '#94a3b8', textDecoration: 'line-through' }}>{c.old_value || '-'}</td>
                    <td style={{ padding: '12px 24px', color: '#059669', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ArrowRight size={14} color="#059669" />
                      {c.new_value || '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                      No modifications were made to existing Jobs during this ingestion.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentSourcePanel;
