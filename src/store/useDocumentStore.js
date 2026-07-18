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
  
  // FITUR BARU: Custom Document Types (disimpan di localStorage agar permanen)
  customDocumentTypes: JSON.parse(localStorage.getItem('customDocTypes') || '[]'),
  addCustomDocumentType: (type) => set(state => {
    const newType = type.trim();
    const defaultTypes = ["Invoice", "Packing List", "Health Certificate", "Certificate Of Origin", "Bill Of Lading", "Catch Certificate", "Captain Statement", "Dolphin Safe Certificate", "Certificate Of Analysis", "Prior Notice", "Manifest", "Lainnya"];
    
    // Tolak jika kosong atau tipe tersebut sudah pernah ada
    if (!newType || state.customDocumentTypes.includes(newType) || defaultTypes.includes(newType)) return state;
    
    const newList = [...state.customDocumentTypes, newType];
    localStorage.setItem('customDocTypes', JSON.stringify(newList));
    return { customDocumentTypes: newList };
  }),

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
