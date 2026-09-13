import { create } from 'zustand';
import api from '../lib/api';

const useMtbStore = create((set, get) => ({
  periodes: [],
  transaksi: [],
  isLoading: false,
  error: null,

  fetchPeriodes: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api('/mtb-periode');
      set({ periodes: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching periodes:', error);
    }
  },

  createPeriode: async (periodeData) => {
    set({ isLoading: true, error: null });
    try {
      const newPeriode = await api('/mtb-periode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodeData)
      });
      set(state => ({
        periodes: [newPeriode, ...state.periodes],
        isLoading: false
      }));
      return newPeriode;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updatePeriodeStatus: async (id, statusData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api(`/mtb-periode/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData)
      });
      set(state => ({
        periodes: state.periodes.map(p => p.id === id ? updated : p),
        isLoading: false
      }));
      return updated;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },


  deletePeriode: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/mtb-periode/${id}`, { method: 'DELETE' });
      await get().fetchPeriodes();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchTransaksi: async (periodeId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api(`/mtb-periode/${periodeId}/transaksi`);
      set({ transaksi: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching transaksi:', error);
    }
  },

  createTransaksi: async (txData) => {
    set({ isLoading: true, error: null });
    try {
      await api('/mtb-transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      // Refresh the transactions to get updated rolling balances and reload the periodes to get the new total
      await get().fetchTransaksi(txData.periode_id);
      await get().fetchPeriodes();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  bulkCreateTransaksi: async (periodeId, txDataArray) => {
    set({ isLoading: true, error: null });
    try {
      // Execute serially to ensure correct running balance calculation on backend if needed,
      // or Promise.all if they can run concurrently. We will do Promise.all for speed.
      await Promise.all(txDataArray.map(txData => 
        api('/mtb-transaksi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txData)
        })
      ));
      await get().fetchTransaksi(periodeId);
      await get().fetchPeriodes();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTransaksi: async (id, txData) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/mtb-transaksi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      await get().fetchTransaksi(txData.periode_id);
      await get().fetchPeriodes();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteTransaksi: async (id, periodeId) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/mtb-transaksi/${id}`, { method: 'DELETE' });
      await get().fetchTransaksi(periodeId);
      await get().fetchPeriodes();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));

export default useMtbStore;
