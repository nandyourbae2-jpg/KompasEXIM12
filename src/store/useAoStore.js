import { create } from 'zustand';
import { getToken } from '../utils/authToken';

const BASE_URL = '/api/v2/ao-workboard'; // Based on our backend routing

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export const useAoStore = create((set, get) => ({
  kpiSummary: { overdue: 0, dueToday: 0, waiting: 0, completed: 0, incoming: 0, unpaired: 0 },
  workloadMatrix: [],
  unassignedJobs: [],
  incomingHandovers: [],
  pairingJobs: [],
  stagesMonitoring: [],
  completedShipments: [],
  aoStaffList: [],
  dscsStaffList: [],
  staffTasks: [],
  activeJobDetail: null,
  operationalAlerts: [],

  isLoading: false,
  error: null,

  fetchSupervisorData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [tasksRes, workloadRes, handoversRes, pairingRes, aoStaffRes, dscsStaffRes, stagesRes, completedRes] = await Promise.all([
        fetch(`${BASE_URL}/supervisor/tasks`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/supervisor/workload`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/supervisor/handovers`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/supervisor/pairing-jobs`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/supervisor/ao-staff`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/supervisor/dscs-staff`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/supervisor/stages-monitoring`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/supervisor/completed-shipments`, { headers: getHeaders() })
      ]);

      if (!tasksRes.ok || !workloadRes.ok || !handoversRes.ok) throw new Error('Failed to fetch supervisor data');

      const tasksData = await tasksRes.json();
      const workloadData = await workloadRes.json();
      const handoversData = await handoversRes.json();
      const pairingData = pairingRes.ok ? await pairingRes.json() : { data: [] };
      const aoStaffData = aoStaffRes.ok ? await aoStaffRes.json() : { data: [] };
      const dscsStaffData = dscsStaffRes.ok ? await dscsStaffRes.json() : { data: [] };
      const stagesData = stagesRes.ok ? await stagesRes.json() : { data: [] };
      const completedData = completedRes.ok ? await completedRes.json() : { data: [] };

      const tasks = tasksData.data || [];
      const unassigned = tasks.filter(t => !t.assigned_to);
      const pairingJobs = pairingData.data || [];
      const unpairedCount = pairingJobs.filter(j => !j.ao_assignee_id).length;

      // Compute KPI Summary (extended)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const kpi = tasks.reduce((acc, t) => {
        if (t.status === 'COMPLETED') acc.completed++;
        else if (t.status === 'WAITING') acc.waiting++;
        else if (t.status === 'BLOCKED' || (t.due_date && new Date(t.due_date) < today)) acc.overdue++;
        else {
            const taskDate = t.due_date ? new Date(t.due_date) : null;
            if (taskDate && taskDate.getDate() === today.getDate() && taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear()) {
                acc.dueToday++;
            }
        }
        return acc;
      }, { overdue: 0, dueToday: 0, waiting: 0, completed: 0, incoming: 0, unpaired: unpairedCount });

      kpi.incoming = (handoversData.data || []).length;

      // Extract unique operational alerts
      const alertsSet = new Set();
      tasks.forEach(t => {
        if (t.operational_alerts) {
            alertsSet.add(t.operational_alerts);
        }
      });

      set({
        kpiSummary: kpi,
        workloadMatrix: workloadData.data || [],
        unassignedJobs: unassigned,
        incomingHandovers: handoversData.data || [],
        pairingJobs,
        stagesMonitoring: stagesData.data || [],
        completedShipments: completedData.data || [],
        aoStaffList: aoStaffData.data || [],
        dscsStaffList: dscsStaffData.data || [],
        operationalAlerts: Array.from(alertsSet),
        isLoading: false
      });
    } catch (error) {
      set({ error: `[DEBUG] ${error.name}: ${error.message} - ${error.stack}`, isLoading: false });
    }
  },

  fetchStaffTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/staff/tasks`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch staff tasks');
      const json = await res.json();
      
      set({ staffTasks: json.data || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchJobDetail: async (jobId) => {
    // Usually fetches all tasks for a specific job, but since we already have the global lists:
    // we can filter them locally, or make a dedicated endpoint. 
    // Assuming we filter locally for now to populate activeJobDetail
    const tasks = get().staffTasks;
    const jobTasks = tasks.filter(t => t.job_id === jobId);
    
    // We assume context (like operational alerts) is embedded in the task objects
    const context = jobTasks.length > 0 ? {
        job_code: jobTasks[0].job_code,
        invoice_no: jobTasks[0].invoice_no,
        buyer: jobTasks[0].buyer,
        destination: jobTasks[0].destination,
        vessel: jobTasks[0].vessel,
        operational_alerts: jobTasks[0].operational_alerts
    } : null;

    set({ activeJobDetail: { context, tasks: jobTasks } });
  },

  assignTask: async (taskId, staffId, dueDate) => {
    set({ isLoading: true, error: null });
    try {
      const payload = { assigned_to: staffId };
      if (dueDate) payload.due_date = dueDate;
      
      const res = await fetch(`${BASE_URL}/supervisor/tasks/${taskId}/assign`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to assign task');
      
      // Refresh supervisor view
      await get().fetchSupervisorData();
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateOperationalAlerts: async (jobId, alerts) => {
    try {
      const res = await fetch(`${BASE_URL}/supervisor/jobs/${jobId}/alerts`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ operational_alerts: alerts })
      });
      if (res.ok) {
        get().fetchSupervisorData();
      }
    } catch (error) {
      console.error('Error updating alerts:', error);
    }
  },

  acceptHandover: async (jobId) => {
    try {
      const res = await fetch(`${BASE_URL}/supervisor/handovers/${jobId}/accept`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Gagal accept handover');
      get().fetchSupervisorData();
    } catch (error) {
      console.error('Error accept handover:', error);
      throw error;
    }
  },

  // AE → AO Pairing action
  pairStaffAo: async (jobId, aoAssigneeId, remarks, dscsAssigneeId, dscsDueDate, incoterm, paymentTerm) => {
    try {
      const res = await fetch(`${BASE_URL}/supervisor/jobs/${jobId}/pair`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ 
          ao_assignee_id: aoAssigneeId, 
          remarks, 
          dscs_assignee_id: dscsAssigneeId || null,
          dscs_due_date: dscsDueDate || null,
          terms_incoterm: incoterm || null,
          terms_payment: paymentTerm || null
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal melakukan pairing');
      }
      const data = await res.json();
      // Refresh pairing jobs & supervisor data
      await get().fetchSupervisorData();
      return data;
    } catch (error) {
      console.error('Error in pairStaffAo:', error);
      throw error;
    }
  },

  updateTaskStatus: async (taskId, status, remarks) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/staff/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, remarks })
      });
      if (!res.ok) throw new Error('Failed to update task status');

      // Refresh staff view
      await get().fetchStaffTasks();
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }

}));
