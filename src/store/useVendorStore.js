import { create } from 'zustand';
import api from '../lib/api';

const useVendorStore = create((set, get) => ({
  vendors: [],
  loading: false,

  fetchVendors: async () => {
    set({ loading: true });
    try {
      const data = await api('/vendors');
      set({ vendors: data });
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      set({ loading: false });
    }
  },

  addVendor: async (vendorData) => {
    try {
      const newVendor = await api('/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorData)
      });
      set(state => ({ vendors: [newVendor, ...state.vendors] }));
      return newVendor;
    } catch (error) {
      console.error('Error adding vendor:', error);
      throw error;
    }
  },

  updateVendor: async (id, vendorData) => {
    try {
      const updated = await api(`/vendors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(vendorData)
      });
      set(state => ({
        vendors: state.vendors.map(v => v.id === id ? updated : v)
      }));
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  toggleVendorStatus: async (id) => {
    try {
      const vendor = get().vendors.find(v => v.id === id);
      if (!vendor) return;
      const newStatus = vendor.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
      
      await api(`/vendors/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      set(state => ({
        vendors: state.vendors.map(v => v.id === id ? { ...v, status: newStatus } : v)
      }));
    } catch (error) {
      console.error('Error toggling vendor status:', error);
      throw error;
    }
  },

  deleteVendor: async (id) => {
    try {
      await api(`/vendors/${id}`, { method: 'DELETE' });
      set(state => ({
        vendors: state.vendors.filter(v => v.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  },

  fetchEvaluations: async (vendorId) => {
    try {
      return await api(`/vendors/${vendorId}/evaluations`);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      throw error;
    }
  },

  addEvaluation: async (vendorId, evaluationData) => {
    try {
      const newEval = await api(`/vendors/${vendorId}/evaluations`, {
        method: 'POST',
        body: JSON.stringify(evaluationData)
      });
      // Refresh vendors to get updated rating and review_count
      await get().fetchVendors();
      return newEval;
    } catch (error) {
      console.error('Error adding evaluation:', error);
      throw error;
    }
  }
}));

export default useVendorStore;
