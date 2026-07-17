import { create } from 'zustand';
import api from '../lib/api';

const useArchiveStore = create((set) => ({
  archives: [],
  isLoading: false,
  error: null,

  /**
   * fetchHistory: Ambil list snapshot triwulan dari backend.
   * Dipakai untuk dropdown Riwayat Triwulan di DashboardManager.
   */
  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api('/archive/history');
      set({ archives: data.archives, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * archiveQuarter: Simpan snapshot dan arsipkan data triwulan via backend.
   * Backend akan:
   *  1. Simpan snapshot ke archive_snapshots
   *  2. Delete task berstatus Selesai
   *  3. Delete job order berstatus Lunas (beserta payment logs-nya)
   */
  archiveQuarter: async (periode, snapshotData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api('/archive/close-quarter', {
        method: 'POST',
        body: JSON.stringify({ periode, snapshot_data: snapshotData }),
      });

      // Tambahkan snapshot baru ke state lokal
      set(state => ({
        archives: [data.snapshot, ...state.archives.filter(a => a.periode !== periode)],
        isLoading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  getArchiveByPeriod: (period) => {
    return useArchiveStore.getState().archives.find(a => a.periode === period);
  },
}));

export default useArchiveStore;
