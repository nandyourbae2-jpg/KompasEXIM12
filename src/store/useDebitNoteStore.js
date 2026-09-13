import { create } from 'zustand';
import api from '../lib/api';

const useDebitNoteStore = create((set, get) => ({
  debitNotes: [],
  summary: { total_klaim: 0, total_recovery: 0, outstanding: 0, dn_aktif: 0 },
  availableMonths: [],
  currentDebitNote: null,
  loading: false,
  error: null,

  fetchDebitNotes: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'Semua Status') params.append('status', filters.status);
      if (filters.kategori && filters.kategori !== 'Semua Kategori') params.append('kategori', filters.kategori);
      if (filters.bulan && filters.bulan !== 'Semua Bulan') params.append('bulan', filters.bulan);
      if (filters.search) params.append('search', filters.search);

      const data = await api(`/debit-notes?${params.toString()}`);
      set({ debitNotes: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSummary: async (bulan) => {
    try {
      const params = new URLSearchParams();
      if (bulan && bulan !== 'Semua Bulan') params.append('bulan', bulan);
      const data = await api(`/debit-notes/summary?${params.toString()}`);
      set({ summary: data });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  },

  fetchAvailableMonths: async () => {
    try {
      const data = await api('/debit-notes/available-months');
      set({ availableMonths: data });
    } catch (error) {
      console.error('Failed to fetch available months:', error);
    }
  },

  fetchDebitNoteById: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await api(`/debit-notes/${id}`);
      set({ currentDebitNote: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createDebitNote: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await api('/debit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await get().fetchDebitNotes();
      set({ loading: false });
      return result;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateDebitNote: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api(`/debit-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await get().fetchDebitNotes();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateStatus: async (id, status_ke, catatan, nomor_dn) => {
    set({ loading: true, error: null });
    try {
      await api(`/debit-notes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_ke, catatan, nomor_dn })
      });
      await get().fetchDebitNotes();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateRecovery: async (id, jumlah_recovery, tanggal_recovery) => {
    set({ loading: true, error: null });
    try {
      await api(`/debit-notes/${id}/recovery`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jumlah_recovery, tanggal_recovery })
      });
      await get().fetchDebitNotes();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteDebitNote: async (id) => {
    set({ loading: true, error: null });
    try {
      await api(`/debit-notes/${id}`, {
        method: 'DELETE'
      });
      await get().fetchDebitNotes();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));

export default useDebitNoteStore;
