import React, { useState } from 'react';
import useDocumentStore from '../../store/useDocumentStore';
import useAuthStore from '../../store/useAuthStore';
import { canDeleteAnyDoc } from '../../utils/authHelpers';
import DocumentSidebar from './DocumentSidebar';
import DocumentTable from './DocumentTable';
import DocumentGrid from './DocumentGrid';
import UploadDocumentModal from './UploadDocumentModal';
import Button from '../../components/Button';
import { Search, LayoutGrid, List as ListIcon, Upload } from 'lucide-react';

const DocumentMap = () => {
  const { documents, filterType, filterDepartment, filterStatus, searchQuery, setSearchQuery, deleteDocument } = useDocumentStore();
  const [viewMode, setViewMode] = useState('list');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const { user } = useAuthStore();
  const canDelete = canDeleteAnyDoc(user);
  
  // Filter logic (AND logic)
  const filteredDocs = documents.filter(d => {
    if (d.isDeleted) return false;
    const matchType = filterType === 'Semua' || d.type === filterType;
    const matchDept = filterDepartment === 'Semua' || d.department === filterDepartment;
    const matchStatus = filterStatus === 'Semua' || d.status === filterStatus;
    
    // Search by file name, reference(B/L), or tags
    const lowerQuery = searchQuery.toLowerCase();
    const matchSearch = searchQuery === '' || 
      d.fileName.toLowerCase().includes(lowerQuery) || 
      d.reference.toLowerCase().includes(lowerQuery) ||
      (d.tags && d.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
      
    return matchType && matchDept && matchStatus && matchSearch;
  });

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <DocumentSidebar />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 32px', 
          borderBottom: '1px solid var(--color-hairline)',
          backgroundColor: 'var(--color-canvas)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '34px', letterSpacing: '-0.374px', marginBottom: '4px' }}>Manajemen Dokumen</h1>
            <p style={{ color: 'var(--color-ink-muted-80)', fontSize: '15px' }}>
              Menampilkan {filteredDocs.length} dari {documents.length} dokumen
            </p>
          </div>
          
          <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} /> Upload Dokumen
            </div>
          </Button>
        </div>
        
        {/* Toolbar (Search & View Toggle) */}
        <div style={{ padding: '24px 32px 0 32px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} color="var(--color-ink-muted-80)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari nama file, B/L, atau tag..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '15px', outline: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', padding: '2px' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{ padding: '8px', border: 'none', background: viewMode === 'list' ? 'var(--color-surface-chip-translucent)' : 'transparent', borderRadius: '4px', cursor: 'pointer' }}
            >
              <ListIcon size={18} color={viewMode === 'list' ? 'var(--color-ink)' : 'var(--color-ink-muted-80)'} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ padding: '8px', border: 'none', background: viewMode === 'grid' ? 'var(--color-surface-chip-translucent)' : 'transparent', borderRadius: '4px', cursor: 'pointer' }}
            >
              <LayoutGrid size={18} color={viewMode === 'grid' ? 'var(--color-ink)' : 'var(--color-ink-muted-80)'} />
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {viewMode === 'list' ? (
            <DocumentTable documents={filteredDocs} onDeleteClick={canDelete ? (doc) => setDocumentToDelete(doc) : undefined} />
          ) : (
            <DocumentGrid documents={filteredDocs} onDeleteClick={canDelete ? (doc) => setDocumentToDelete(doc) : undefined} />
          )}
        </div>
      </div>
      
      {isUploadModalOpen && <UploadDocumentModal onClose={() => setIsUploadModalOpen(false)} />}
      
      {/* Confirmation Modal for Delete */}
      {documentToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)', padding: '32px', borderRadius: 'var(--rounded-lg)',
            width: '450px', boxShadow: 'var(--shadow-product)', display: 'flex', flexDirection: 'column', gap: '16px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '4px', color: 'var(--color-badge-critical)' }}>Konfirmasi Hapus</h2>
            <p style={{ fontSize: '15px', color: 'var(--color-ink-muted-80)', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin menghapus dokumen <strong>"{documentToDelete.fileName}"</strong>?<br/>
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setDocumentToDelete(null)}>Batal</Button>
              <Button variant="primary" onClick={() => {
                deleteDocument(documentToDelete.id);
                setDocumentToDelete(null);
              }} style={{ backgroundColor: 'var(--color-badge-critical)' }}>
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentMap;
