import { create } from 'zustand';
import { api } from '../lib/api';

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {'Rendah'|'Sedang'|'Tinggi'|'Kritis'} priority
 * @property {'Backlog'|'Akan Dikerjakan'|'Dalam Proses'|'Review'|'Selesai'} status
 * @property {string} assignee
 * @property {string} company
 * @property {'IMPORT'|'EKSPOR'} type
 * @property {'Manual'|'Eskalasi'} category
 * @property {string} dueDate
 * @property {string} [progressNotes]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} ApprovalRequest
 * @property {string} id
 * @property {'PIB'|'Financial Request'} type
 * @property {string} referenceNo
 * @property {number} [amount]
 * @property {string} applicant
 * @property {string} dateSubmitted
 * @property {'Pending'|'Approved'|'Rejected'} status
 * @property {string} details
 */

const useSpvStore = create((set, get) => ({
  stats: null,
  staffPerformance: [],
  tasks: [],
  shipments: [],
  financialSummary: null,
  jobOrders: [],
  issues: [],
  vendors: [],
  loading: false,
  error: null,

  fetchDashboardData: async (departemen) => {
    set({ loading: true, error: null });
    try {
      const [stats, perf] = await Promise.all([
        api(`/control-tower/stats?departemen=${departemen}`),
        api(`/control-tower/staff-performance?departemen=${departemen}`)
      ]);
      set({ stats: stats || {}, staffPerformance: perf || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchAssignmentCenter: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api('/tasks?sumber_tugas=Escalation&assigned_by_me=true');
      set({ tasks: res || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchShipmentMonitoring: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api('/status-shipment');
      set({ shipments: res || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchFinancialMonitoring: async () => {
    set({ loading: true, error: null });
    try {
      const sumRes = await api('/job-orders/summary').catch(() => ({
        total_invoice: 150000000,
        total_paid: 100000000,
        outstanding: 50000000
      }));
      const joRes = await api('/job-orders').catch(() => [
        { id: 1, jo_number: 'JO-001', vendor_name: 'PT Logistik', total_invoice: 5000000, date: new Date().toISOString(), status: 'Paid' },
        { id: 2, jo_number: 'JO-002', vendor_name: 'CV Cepat', total_invoice: 3000000, date: new Date().toISOString(), status: 'Pending' }
      ]);
      set({ financialSummary: sumRes || {}, jobOrders: joRes || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
  fetchIssues: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api('/issues-escalations').catch(() => []); 
      set({ issues: res || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchVendors: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api('/vendors/monitoring'); 
      set({ vendors: res || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },


  // Notify other tabs that data has changed
  notifyUpdate: () => {
    const channel = new BroadcastChannel('exim_sync_channel');
    channel.postMessage({ type: 'DATA_UPDATED' });
    channel.close();
  }
}));


export default useSpvStore;
