import React, { useState } from 'react';
import Badge from '../../../components/Badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ValidationPreviewTable = ({ preview }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (businessKey) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(businessKey)) {
      newExpanded.delete(businessKey);
    } else {
      newExpanded.add(businessKey);
    }
    setExpandedRows(newExpanded);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'NEW': return <Badge label="NEW" variant="success" />;
      case 'UPDATED': return <Badge label="UPDATED" variant="primary" />;
      case 'UNCHANGED': return <Badge label="UNCHANGED" variant="default" />;
      case 'INVALID': return <Badge label="INVALID" variant="error" />;
      default: return <Badge label={action} variant="default" />;
    }
  };

  return (
    <div style={{ marginTop: '16px', border: '1px solid var(--color-hairline)', borderRadius: '8px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-hairline)' }}>
          <tr>
            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Action</th>
            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Invoice</th>
            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>No BC</th>
            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Buyer</th>
            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Destination</th>
            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>ETD</th>
            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>Closing Docs</th>
            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {preview.map((row) => (
            <React.Fragment key={row.businessKey}>
              <tr style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#fff' }}>
                <td style={{ padding: '12px 16px' }}>{getActionBadge(row.action)}</td>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{row.invoiceNo || '-'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted)' }}>{row.noBc || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{row.buyer || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{row.destination || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{row.etd || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{row.closingDocs || '-'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {row.action === 'UPDATED' && row.changes && row.changes.length > 0 && (
                    <button 
                      onClick={() => toggleRow(row.businessKey)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {expandedRows.has(row.businessKey) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </td>
              </tr>
              {expandedRows.has(row.businessKey) && row.changes && row.changes.length > 0 && (
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-hairline)' }}>
                  <td colSpan={8} style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted)', marginBottom: '8px' }}>DETECTED CHANGES:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                      {row.changes.map((change, idx) => (
                        <div key={idx} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '8px', textTransform: 'capitalize' }}>
                            {change.field.replace(/_/g, ' ')}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{change.old || '(empty)'}</span>
                            <span style={{ color: '#94a3b8' }}>→</span>
                            <span style={{ color: '#10b981', fontWeight: '500' }}>{change.new || '(empty)'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {preview.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                No records to preview.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ValidationPreviewTable;
