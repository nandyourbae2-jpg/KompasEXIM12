import { create } from 'zustand';

// ─── Dummy Data ─────────────────────────────────────────────────────────────
// 3 Import Project contoh agar halaman Assign Import Project tidak kosong
// saat pertama dibuka. tanggalInput sudah diset, id tidak berubah setelah dibuat.

const initialProjects = [];

// ─── Helper ──────────────────────────────────────────────────────────────────
/**
 * generateImportId: Generate ID IMP-XXXX lanjutan dari nomor tertinggi yang ada.
 * Format selalu 4 digit dengan zero-padding (IMP-0001, IMP-0002, ..., IMP-1000).
 * ID yang sudah dibuat TIDAK PERNAH berubah — ini hanya dipanggil saat addImportProject().
 */
const generateImportId = (projects) => {
  const nums = projects.map(p => {
    const match = p.id.match(/IMP-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const highest = nums.length > 0 ? Math.max(...nums) : 0;
  return `IMP-${String(highest + 1).padStart(4, '0')}`;
};

// ─── Store ────────────────────────────────────────────────────────────────────
const useImportProjectStore = create((set, get) => ({
  importProjects: initialProjects,

  /**
   * editingProject: Project yang sedang di-edit via tombol "Edit" di tabel.
   * null = mode tambah baru, objek = mode edit (form pre-filled).
   */
  editingProject: null,

  /**
   * addImportProject: Tambah Import Project baru.
   * Auto-generate ID IMP-XXXX (immutable setelah dibuat).
   * tanggalInput diset ke tanggal hari ini dan tidak bisa diubah setelahnya.
   */
  addImportProject: (data) => {
    const projects = get().importProjects;
    const id = generateImportId(projects);
    const tanggalInput = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    const project = {
      id,
      supplier: data.supplier.trim(),
      trade: data.trade.trim(),
      importType: data.importType,
      shipmentTerm: data.shipmentTerm.trim(),
      invoiceNo: data.invoiceNo.trim(),
      billOfLadingNo: data.billOfLadingNo.trim(),
      etd: data.etd,
      eta: data.eta,
      hsCode: data.hsCode.trim(),
      freeTimeDestination: data.freeTimeDestination.trim(),
      tanggalInput, // Set otomatis, tidak bisa di-override
    };

    set(state => ({
      importProjects: [project, ...state.importProjects],
    }));
    return project;
  },

  /**
   * updateImportProject: Edit Import Project yang sudah ada.
   * id dan tanggalInput TIDAK PERNAH diubah, walau data di-payload berisi keduanya.
   */
  updateImportProject: (id, data) => {
    set(state => ({
      importProjects: state.importProjects.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          // Immutable: id dan tanggalInput dipertahankan dari object asli
          supplier: data.supplier.trim(),
          trade: data.trade.trim(),
          importType: data.importType,
          shipmentTerm: data.shipmentTerm.trim(),
          invoiceNo: data.invoiceNo.trim(),
          billOfLadingNo: data.billOfLadingNo.trim(),
          etd: data.etd,
          eta: data.eta,
          hsCode: data.hsCode.trim(),
          freeTimeDestination: data.freeTimeDestination.trim(),
        };
      }),
      editingProject: null, // Reset setelah update berhasil
    }));
  },

  /**
   * setEditingProject: Simpan project yang akan di-edit ke state.
   * Dipanggil saat tombol "Edit" di tabel diklik.
   * Pass null untuk kembali ke mode tambah baru.
   */
  setEditingProject: (project) => set({ editingProject: project }),

  /**
   * getProjectById: Helper untuk mendapatkan project berdasarkan ID.
   * Dipakai oleh TaskDetailModal dan TaskCard untuk menampilkan info project.
   */
  getProjectById: (id) => {
    if (!id) return null;
    return get().importProjects.find(p => p.id === id) || null;
  },
}));

export default useImportProjectStore;
