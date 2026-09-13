import { create } from 'zustand';
import api from '../lib/api';

const useReportStore = create((set, get) => ({
  reports: [],
  loading: false,

  fetchReports: async () => {
    set({ loading: true });
    try {
      const data = await api('/reports');
      // Format properties for frontend
      const formatted = data.map(r => ({
        id: r.id,
        tipe: r.tipe,
        judul: r.judul,
        isi: r.isi,
        departemen: r.departemen,
        dibuatOlehId: r.dibuat_oleh_id,
        tanggal: r.tanggal,
        problem_report_id: r.problem_report_id,
        tanggapan_manager: r.tanggapan_manager,
        ditanggapi_oleh: r.ditanggapi_oleh_id,
        tanggapan_pada: r.tanggapan_pada,
        ditinjau_manager: Boolean(r.ditinjau_manager),
      }));
      set({ reports: formatted });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  addReport: async (newReport) => {
    try {
      const payload = {
        tipe: newReport.tipe || newReport.report_type, // Support both field names
        judul: newReport.judul || newReport.title,
        isi: newReport.isi || newReport.desc,
        departemen: newReport.departemen,
        // dibuat_oleh_id is resolved from token server-side, no need to hardcode
        problem_report_id: newReport.problem_report_id || null,
      };
      await api('/reports', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await get().fetchReports();
    } catch (error) {
      console.error('Error adding report:', error);
      throw error;
    }
  },

  respondToReport: async (reportId, responseText, managerId) => {
    try {
      await api(`/reports/${reportId}/tanggapan`, {
        method: 'PATCH',
        body: JSON.stringify({ tanggapan_manager: responseText, ditanggapi_oleh_id: managerId })
      });
      await get().fetchReports();
    } catch (error) {
      console.error('Error responding to report:', error);
      throw error;
    }
  },

  toggleReviewReport: async (reportId) => {
    try {
      // Backend api just sets it to 1 (ditinjau_manager = 1)
      await api(`/reports/${reportId}/tinjau`, {
        method: 'PATCH'
      });
      await get().fetchReports();
    } catch (error) {
      console.error('Error reviewing report:', error);
      throw error;
    }
  },

  // Computed properties
  getComputedReports: () => {
    const { reports } = get();
    
    // Hitung status untuk Problem Report
    return reports.map(r => {
      if ((r.report_type || r.tipe) === 'Problem Report') {
        const hasSolveUpdate = reports.some(
          sub => sub.problem_report_id === r.id && (sub.report_type || sub.tipe) === 'Solve Update'
        );
        return { ...r, status: hasSolveUpdate ? 'Solved' : 'Open' };
      }
      return r;
    });
  },
}));

export default useReportStore;
