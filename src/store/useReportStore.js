import { create } from 'zustand';

// Tipe: 'Weekday Report', 'Problem Report', 'Progress Update', 'Solve Update'

const initialReports = [];

const useReportStore = create((set, get) => ({
  reports: initialReports,
  
  addReport: (newReport) => set((state) => {
    const id = `RPT-${String(state.reports.length + 1).padStart(3, '0')}`;
    const report = {
      id,
      tanggal: new Date().toISOString(),
      tanggapan_manager: null,
      ditanggapi_oleh: null,
      tanggapan_pada: null,
      ditinjau_manager: false,
      ...newReport,
    };
    return { reports: [report, ...state.reports] };
  }),

  respondToReport: (reportId, responseText, managerName) => set((state) => ({
    reports: state.reports.map(r => 
      r.id === reportId 
        ? { ...r, tanggapan_manager: responseText, ditanggapi_oleh: managerName, tanggapan_pada: new Date().toISOString() }
        : r
    )
  })),

  toggleReviewReport: (reportId) => set((state) => ({
    reports: state.reports.map(r => 
      r.id === reportId 
        ? { ...r, ditinjau_manager: !r.ditinjau_manager }
        : r
    )
  })),

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
