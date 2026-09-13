import { create } from 'zustand';
import api from '../lib/api';

const useDokumenMonitoringStore = create((set, get) => ({
  // Summary list (all projects with progress counts)
  monitoringList: [],
  monitoringListLoading: false,

  // Detail rows for a specific project
  monitoringRows: [],
  monitoringRowsLoading: false,

  // Audit trail for a specific row
  riwayat: [],
  riwayatLoading: false,

  // Save indicator
  savingFieldId: null, // which row ID is currently saving

  // ── Summary ──
  fetchMonitoringSummary: async () => {
    set({ monitoringListLoading: true });
    try {
      const data = await api('/dokumen-monitoring/summary');
      set({ monitoringList: data });
    } catch (err) {
      console.error('Failed to fetch monitoring summary:', err);
    } finally {
      set({ monitoringListLoading: false });
    }
  },

  // ── Detail Rows ──
  fetchMonitoringRows: async (projectId) => {
    set({ monitoringRowsLoading: true, monitoringRows: [] });
    try {
      const data = await api(`/dokumen-monitoring?import_project_id=${projectId}`);
      set({ monitoringRows: data });
    } catch (err) {
      console.error('Failed to fetch monitoring rows:', err);
    } finally {
      set({ monitoringRowsLoading: false });
    }
  },

  // ── Update single field (auto-save) ──
  updateMonitoringField: async (id, field, value, userId) => {
    set({ savingFieldId: id });
    try {
      const updated = await api(`/dokumen-monitoring/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value, diubah_oleh_id: userId }),
      });
      set(state => ({
        monitoringRows: state.monitoringRows.map(r => {
          if (r.id !== id) return r;
          // Preserve nama_dokumen/kode_dokumen if backend doesn't return them
          return { ...r, ...updated, kode_dokumen: updated.kode_dokumen || r.kode_dokumen, nama_dokumen: updated.nama_dokumen || r.nama_dokumen };
        }),
        savingFieldId: null,
      }));
      return updated;
    } catch (err) {
      console.error('Failed to update monitoring field:', err);
      set({ savingFieldId: null });
      throw err;
    }
  },

  // ── Confirm Draft ──
  confirmDraft: async (id, userId) => {
    set({ savingFieldId: id });
    try {
      const updated = await api(`/dokumen-monitoring/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      set(state => ({
        monitoringRows: state.monitoringRows.map(r => {
          if (r.id !== id) return r;
          // Preserve nama_dokumen/kode_dokumen if backend doesn't return them
          return { ...r, ...updated, kode_dokumen: updated.kode_dokumen || r.kode_dokumen, nama_dokumen: updated.nama_dokumen || r.nama_dokumen };
        }),
        savingFieldId: null,
      }));
      return updated;
    } catch (err) {
      console.error('Failed to confirm draft:', err);
      set({ savingFieldId: null });
      throw err;
    }
  },

  // ── Confirm Scan ──
  confirmScan: async (id, userId) => {
    set({ savingFieldId: id });
    try {
      const updated = await api(`/dokumen-monitoring/${id}/confirm-scan`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      set(state => ({
        monitoringRows: state.monitoringRows.map(r => {
          if (r.id !== id) return r;
          return { ...r, ...updated, kode_dokumen: updated.kode_dokumen || r.kode_dokumen, nama_dokumen: updated.nama_dokumen || r.nama_dokumen };
        }),
        savingFieldId: null,
      }));
      return updated;
    } catch (err) {
      console.error('Failed to confirm scan:', err);
      set({ savingFieldId: null });
      throw err;
    }
  },

  // ── Confirm Original ──
  confirmOriginal: async (id, userId) => {
    set({ savingFieldId: id });
    try {
      const updated = await api(`/dokumen-monitoring/${id}/confirm-original`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      set(state => ({
        monitoringRows: state.monitoringRows.map(r => {
          if (r.id !== id) return r;
          return { ...r, ...updated, kode_dokumen: updated.kode_dokumen || r.kode_dokumen, nama_dokumen: updated.nama_dokumen || r.nama_dokumen };
        }),
        savingFieldId: null,
      }));
      return updated;
    } catch (err) {
      console.error('Failed to confirm original:', err);
      set({ savingFieldId: null });
      throw err;
    }
  },

  // ── Audit Trail ──
  fetchRiwayat: async (barisId) => {
    set({ riwayatLoading: true, riwayat: [] });
    try {
      const data = await api(`/dokumen-monitoring/${barisId}/riwayat`);
      set({ riwayat: data });
    } catch (err) {
      console.error('Failed to fetch riwayat:', err);
    } finally {
      set({ riwayatLoading: false });
    }
  },
}));

export default useDokumenMonitoringStore;
