import { create } from 'zustand';
import api from '../lib/api';

const usePibStore = create((set, get) => ({
  pibs: [],
  isLoading: false,
  error: null,

  fetchPibs: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api('/pib');
      set({ pibs: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching pibs:', error);
    }
  },

  createPib: async (pibData) => {
    set({ isLoading: true, error: null });
    try {
      const newPib = await api('/pib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pibData)
      });
      set(state => ({
        pibs: [newPib, ...state.pibs],
        isLoading: false
      }));
      return newPib;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updatePibStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/pib/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      set(state => ({
        pibs: state.pibs.map(p => p.id === id ? { ...p, status } : p),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deletePib: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/pib/${id}`, { method: 'DELETE' });
      set(state => ({
        pibs: state.pibs.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));

export default usePibStore;
