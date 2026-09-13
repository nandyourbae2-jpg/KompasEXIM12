import { create } from 'zustand';
import { api } from '../lib/api';

const usePibRequestStore = create((set, get) => ({
  requests: [],
  summary: null,
  pendingApproval: [],
  isLoading: false,
  error: null,
  history: [],

  fetchRequests: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const qs = new URLSearchParams(params).toString();
      const data = await api(`/pib-requests${qs ? `?${qs}` : ''}`);
      set({ requests: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const data = await api('/pib-requests/summary');
      set({ summary: data });
    } catch (error) {
      console.error(error);
    }
  },

  fetchPending: async () => {
    set({ isLoading: true });
    try {
      const data = await api('/pib-requests/pending');
      set({ pendingApproval: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createRequest: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api('/pib-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      set(state => ({
        requests: [res, ...state.requests],
        isLoading: false
      }));
      return res;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateRequest: async (id, payload, version) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/pib-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, version })
      });
      await get().fetchRequests();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  submitRequest: async (id, version) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/pib-requests/${id}/submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version })
      });
      await get().fetchRequests();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  approveRequest: async (id, catatan, version) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/pib-requests/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catatan, version })
      });
      await get().fetchRequests();
      await get().fetchPending();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rejectRequest: async (id, catatan, version) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/pib-requests/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catatan, version })
      });
      await get().fetchRequests();
      await get().fetchPending();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchHistory: async (id) => {
    try {
      const data = await api(`/pib-requests/${id}/history`);
      set({ history: data });
      return data;
    } catch (error) {
      console.error(error);
    }
  },

  realizeRequest: async (id, aktualData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api(`/pib-requests/${id}/realize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aktualData)
      });
      await get().fetchRequests();
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  settleRequest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api(`/pib-requests/${id}/settle`, { method: 'PATCH' });
      await get().fetchRequests();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));

export default usePibRequestStore;
