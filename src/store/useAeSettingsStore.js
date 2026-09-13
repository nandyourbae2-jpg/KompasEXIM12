import { create } from 'zustand';
import { api } from '../lib/api';

const useAeSettingsStore = create((set) => ({
  midweekDays: [1, 2, 3, 4], // Default: Senin, Selasa, Rabu, Kamis
  isLoading: false,

  fetchSettings: async () => {
    try {
      const response = await api('/v2/settings/ae.workboard.midweek_days');
      if (response && response.success && response.data) {
        set({ midweekDays: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch AE settings', error);
      // Biarkan state midweekDays tetap di nilai default jika gagal
    }
  },

  saveSettings: async (days) => {
    set({ isLoading: true });
    try {
      const response = await api('/v2/settings/ae.workboard.midweek_days', {
        method: 'PUT',
        body: JSON.stringify({ value: days }),
      });
      if (response && response.success) {
        set({ midweekDays: days });
      } else {
        throw new Error(response?.message || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Failed to save AE settings', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAeSettingsStore;
