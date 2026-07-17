import React, { useState } from 'react';
import Badge from '../../components/Badge';
import { FileText, Eye, Download, Trash2 } from 'lucide-react';

const DocumentCard = ({ doc, onDeleteClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
        borderRadius: 'var(--rounded-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px',
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        boxShadow: isHovered ? 'var(--shadow-lg)' : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <FileText size={32} color="var(--color-primary)" />
        <Badge type="docstatus" value={doc.status} />
      </div>
      
      <div>
        <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--color-primary)', wordBreak: 'break-all' }}>{doc.fileName}</div>
        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px' }}>{doc.size} • {doc.date}</div>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        <Badge type="doctype" value={doc.type} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--color-hairline)' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>
          Ref: <strong style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>{doc.reference}</strong>
        </div>
        <div style={{ fontWeight: '600', fontSize: '12px' }}>{doc.version}</div>
      </div>

      {isHovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <button 
            onClick={() => {
              if (doc.file_path) {
                window.open(doc.file_path, '_blank');
              } else {
                alert('File tidak tersedia');
              }
            }}
            style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 12px', backgroundColor: 'var(--color-primary)', color: 'white',
            border: 'none', borderRadius: 'var(--rounded-md)', cursor: 'pointer',
            fontWeight: '500', fontSize: '13px'
          }}>
            <Eye size={16} /> Preview
          </button>
          <button 
            onClick={() => {
              if (doc.file_path) {
                window.open(doc.file_path, '_blank');
              } else {
                alert('File tidak tersedia');
              }
            }}
            style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 12px', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)',
            border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', cursor: 'pointer',
            fontWeight: '500', fontSize: '13px', boxShadow: 'var(--shadow-sm)'
          }}>
            <Download size={16} /> Download
          </button>
          {onDeleteClick && (
            <button onClick={() => onDeleteClick(doc)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px', backgroundColor: '#fee2e2', color: 'var(--color-badge-critical)',
              border: '1px solid var(--color-badge-critical)', borderRadius: 'var(--rounded-md)', cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const DocumentGrid = ({ documents, onDeleteClick }) => {
  if (documents.length === 0) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Tidak ada dokumen ditemukan</div>;
  }
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} onDeleteClick={onDeleteClick} />
      ))}
    </div>
  );
};

export default DocumentGrid;
