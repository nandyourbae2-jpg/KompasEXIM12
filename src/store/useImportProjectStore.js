import { create } from 'zustand';
import api from '../lib/api';
import useAuthStore from './useAuthStore';

const formatProject = (project) => {
  let docs = [];
  if (typeof project.document_requirements === 'string') {
    try { docs = JSON.parse(project.document_requirements); } catch(e) {}
  } else if (Array.isArray(project.document_requirements)) {
    docs = project.document_requirements;
  }

  return {
    id: project.id || project.task_unique_number,
    dbId: project.id,
    taskUniqueNumber: project.task_unique_number,
    supplier: project.supplier,
    trade: project.trade,
    importType: project.import_type,
    shipmentTerm: project.shipment_term,
    invoiceNo: project.invoice_no,
    poCoNo: project.po_co_no,
    billOfLadingNo: project.bl_no,
    etd: project.etd,
    eta: project.eta,
    hsCode: project.hs_code,
    freeTimeDestination: project.free_time_destination,
    documentRequirements: docs,
    tanggalInput: project.tanggal_input || (project.created_at ? project.created_at.replace(' ', 'T') : ''),
    createdById: project.created_by_id,
    status: project.status
  };
};

const useImportProjectStore = create((set, get) => ({
  importProjects: [],
  loading: false,
  editingProject: null,

  fetchImportProjects: async () => {
    set({ loading: true });
    try {
      const data = await api('/import-projects');
      const formattedData = data.map(formatProject);
      set({ importProjects: formattedData });
    } catch (error) {
      console.error('Error fetching import projects:', error);
    } finally {
      set({ loading: false });
    }
  },

  addImportProject: async (data) => {
    try {
      const user = useAuthStore.getState().user;

      // Convert camelCase to snake_case for backend
      const payload = {
        supplier: data.supplier,
        trade: data.trade,
        import_type: data.importType,
        shipment_term: data.shipmentTerm,
        invoice_no: data.invoiceNo,
        po_co_no: data.poCoNo,
        bl_no: data.billOfLadingNo,
        etd: data.etd,
        eta: data.eta,
        hs_code: data.hsCode,
        free_time_destination: data.freeTimeDestination,
        document_requirements: data.documentRequirements,
        created_by_id: user?.id || null, // Use logged-in user ID, not hardcoded
      };

      const newProject = await api('/import-projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const formattedProject = formatProject(newProject);
      set(state => ({ importProjects: [formattedProject, ...state.importProjects] }));
      return formattedProject;
    } catch (error) {
      console.error('Error adding import project:', error);
      throw error;
    }
  },

  updateImportProject: async (id, data) => {
    try {
      const payload = {
        supplier: data.supplier,
        trade: data.trade,
        import_type: data.importType,
        shipment_term: data.shipmentTerm,
        invoice_no: data.invoiceNo,
        po_co_no: data.poCoNo,
        bl_no: data.billOfLadingNo,
        etd: data.etd,
        eta: data.eta,
        hs_code: data.hsCode,
        free_time_destination: data.freeTimeDestination,
        document_requirements: data.documentRequirements,
      };

      const updatedProject = await api(`/import-projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      const formattedProject = formatProject(updatedProject);
      set(state => ({
        importProjects: state.importProjects.map(p => p.dbId === id ? formattedProject : p),
        editingProject: null
      }));
      return formattedProject;
    } catch (error) {
      console.error('Error updating import project:', error);
      throw error;
    }
  },

  deleteImportProject: async (id) => {
    try {
      await api(`/import-projects/${id}`, { method: 'DELETE' });
      set(state => ({
        importProjects: state.importProjects.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting import project:', error);
      throw error;
    }
  },

  setEditingProject: (project) => set({ editingProject: project }),

  getProjectById: (id) => {
    if (!id) return null;
    return get().importProjects.find(p => p.id === id) || null;
  },
}));

export default useImportProjectStore;
