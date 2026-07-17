import React from 'react';
import Badge from '../../components/Badge';
import { FileText, Eye, Download, Trash2 } from 'lucide-react';
import { getUserName } from '../../utils/userLookup';

const DocumentTable = ({ documents, onDeleteClick }) => {
  if (documents.length === 0) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Tidak ada dokumen ditemukan</div>;
  }
  
  return (
    <div style={{ width: '100%', overflowX: 'auto', backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-80)' }}>
            <th style={{ padding: '16px', fontWeight: '600' }}>Nama Dokumen</th>
            <th style={{ padding: '16px', fontWeight: '600' }}>Tipe Dokumen</th>
            <th style={{ padding: '16px', fontWeight: '600' }}>No. Referensi</th>
            <th style={{ padding: '16px', fontWeight: '600' }}>Versi</th>
            <th style={{ padding: '16px', fontWeight: '600' }}>Upload Oleh</th>
            <th style={{ padding: '16px', fontWeight: '600' }}>Tanggal</th>
            <th style={{ padding: '16px', fontWeight: '600' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, idx) => (
            <tr key={doc.id} style={{ borderBottom: idx !== documents.length -1 ? '1px solid var(--color-hairline)' : 'none', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{doc.fileName}</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <Badge type="docstatus" value={doc.status} />
                </div>
              </td>
              <td style={{ padding: '16px' }}><Badge type="doctype" value={doc.type} /></td>
              <td style={{ padding: '16px' }}>
                <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '500' }}>{doc.reference}</span>
              </td>
              <td style={{ padding: '16px', fontWeight: '600' }}>{doc.version}</td>
              <td style={{ padding: '16px' }}>{getUserName(doc.uploadedById)}</td>
              <td style={{ padding: '16px', color: 'var(--color-ink-muted-80)' }}>{doc.date}</td>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      if (doc.file_path) {
                        window.open(doc.file_path, '_blank');
                      } else {
                        alert('File tidak tersedia');
                      }
                    }}
                    style={{ padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', backgroundColor: 'var(--color-canvas)', cursor: 'pointer', color: 'var(--color-ink-muted-80)' }}>
                    <Eye size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      if (doc.file_path) {
                        window.open(doc.file_path, '_blank');
                      } else {
                        alert('File tidak tersedia');
                      }
                    }}
                    style={{ padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', backgroundColor: 'var(--color-canvas)', cursor: 'pointer', color: 'var(--color-ink-muted-80)' }}>
                    <Download size={14} />
                  </button>
                  {onDeleteClick && (
                    <button onClick={() => onDeleteClick(doc)} style={{ padding: '6px', border: '1px solid var(--color-badge-critical)', borderRadius: 'var(--rounded-sm)', backgroundColor: '#fff', cursor: 'pointer', color: 'var(--color-badge-critical)' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentTable;
