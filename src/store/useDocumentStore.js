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

  setFilterType: (type) => set({ filterType: type }),
  setFilterDepartment: (dept) => set({ filterDepartment: dept }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  /**
   * fetchDocuments: Ambil semua dokumen dari backend.
   */
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

  /**
   * uploadDocument: Upload dokumen via POST /api/documents (multipart/form-data).
   * Gunakan FormData untuk menyertakan file fisik.
   */
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
        // JANGAN set Content-Type — biarkan browser set boundary multipart secara otomatis
      });
      const doc = normDoc({ ...data.document, uploadedById: currentUser?.id });
      set(state => ({ documents: [doc, ...state.documents] }));
      return doc;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  /**
   * deleteDocument: Soft delete via PATCH /api/documents/:id
   * Dokumen tidak benar-benar dihapus dari DB — hanya is_deleted = true.
   */
  deleteDocument: async (docId) => {
    // Temukan dbId dari dokumen
    const allDocs = useDocumentStore.getState().documents;
    const doc = allDocs.find(d => d.id === docId);
    if (!doc) return;

    // Optimistic update
    set(state => ({
      documents: state.documents.map(d => d.id === docId ? { ...d, isDeleted: true } : d)
    }));

    try {
      await api(`/documents/${doc.dbId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_deleted: true }),
      });
    } catch (err) {
      // Rollback
      set(state => ({
        documents: state.documents.map(d => d.id === docId ? { ...d, isDeleted: false } : d),
        error: err.message
      }));
    }
  },
}));

/**
 * normDoc: Normalisasi shape document dari backend ke format yang dipakai UI.
 */
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
