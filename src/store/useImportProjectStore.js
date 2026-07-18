import { create } from 'zustand';

// ─── Dummy Data ─────────────────────────────────────────────────────────────
const initialProjects = [];

// ─── Helper ──────────────────────────────────────────────────────────────────
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
  editingProject: null,

  addImportProject: (data) => {
    const projects = get().importProjects;
    const id = generateImportId(projects);
    const tanggalInput = new Date().toISOString().split('T')[0]; 

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
      tanggalInput, 
    };

    set(state => ({
      importProjects: [project, ...state.importProjects],
    }));
    return project;
  },

  updateImportProject: (id, data) => {
    set(state => ({
      importProjects: state.importProjects.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
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
      editingProject: null,
    }));
  },

  setEditingProject: (project) => set({ editingProject: project }),

  getProjectById: (id) => {
    if (!id) return null;
    return get().importProjects.find(p => p.id === id) || null;
  },
}));

export default useImportProjectStore;
