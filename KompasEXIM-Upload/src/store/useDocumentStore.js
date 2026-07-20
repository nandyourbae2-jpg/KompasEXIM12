import { create } from 'zustand';
import api from '../lib/api';

const useDocumentStore = create((set) => ({
  documents: [],
  isLoading: false,
  error: null,
  filterType: 'Semua',
  filterDepartment: 'Semua',
  filterStatus: 'Semua',
  searchQuery: '',
  
  customDocumentTypes: [],
  
  fetchCustomDocumentTypes: async () => {
    try {
      const data = await api('/document-types');
      if (data && data.documentTypes) {
        set({ customDocumentTypes: data.documentTypes });
      }
    } catch (err) {
      console.error("Failed to fetch document types:", err);
    }
  },
  
  addCustomDocumentType: async (type) => {
    const newType = type.trim();
    if (!newType || newType === 'Semua' || newType === 'Lainnya') return;
    
    // Check locally first
    const currentTypes = useDocumentStore.getState().customDocumentTypes;
    if (currentTypes.includes(newType)) return;
    
    // Optimistic update
    set({ customDocumentTypes: [...currentTypes, newType] });
    
    try {
      await api('/document-types', {
        method: 'POST',
        body: JSON.stringify({ name: newType })
      });
    } catch (err) {
      // Revert on error
      console.error(err);
      set({ customDocumentTypes: currentTypes });
    }
  },

  removeCustomDocumentType: async (typeToRemove) => {
    const currentTypes = useDocumentStore.getState().customDocumentTypes;
    
    // Optimistic update
    set({ customDocumentTypes: currentTypes.filter(t => t !== typeToRemove) });
    
    try {
      await api(`/document-types/${encodeURIComponent(typeToRemove)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      // Revert on error
      console.error(err);
      set({ customDocumentTypes: currentTypes });
    }
  },

  setFilterType: (type) => set({ filterType: type }),
  setFilterDepartment: (dept) => set({ filterDepartment: dept }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api('/documents');
      const documents = data.documents.map(normDoc);
      set({ documents, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  uploadDocument: async (docData, file, currentUser) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('tipe', docData.type || docData.tipe || '');
    formData.append('no_referensi', docData.reference || docData.no_referensi || '');
    formData.append('departemen', docData.department || docData.departemen || '');
    formData.append('tags', JSON.stringify(docData.tags || []));
    formData.append('vendor_id', docData.vendorId || docData.vendor_id || '');
    formData.append('status', 'Aktif');

    try {
      const data = await api('/documents', {
        method: 'POST',
        body: formData,
      });
      const doc = normDoc({ ...data.document, uploadedById: currentUser?.id });
      set(state => ({ documents: [doc, ...state.documents] }));
      return doc;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteDocument: async (docId) => {
    const allDocs = useDocumentStore.getState().documents;
    const doc = allDocs.find(d => d.id === docId);
    if (!doc) return;

    set(state => ({
      documents: state.documents.map(d => d.id === docId ? { ...d, isDeleted: true } : d)
    }));

    try {
      await api(`/documents/${doc.dbId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_deleted: true }),
      });
    } catch (err) {
      set(state => ({
        documents: state.documents.map(d => d.id === docId ? { ...d, isDeleted: false } : d),
        error: err.message
      }));
    }
  },
}));

const normDoc = (d) => ({
  id: d.id,
  dbId: d.id,
  fileName: d.nama_file,
  file_path: d.file_path,
  type: d.tipe,
  reference: d.no_referensi,
  department: d.departemen,
  version: `v${d.versi}`,
  uploadedById: d.upload_oleh?.id || d.uploadedById || null,
  date: new Date(d.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
  size: d.ukuran_kb ? `${d.ukuran_kb} KB` : '—',
  tags: d.tags || [],
  vendorId: d.vendor_id || null,
  status: d.status,
  isDeleted: d.is_deleted || false,
});

export default useDocumentStore;
