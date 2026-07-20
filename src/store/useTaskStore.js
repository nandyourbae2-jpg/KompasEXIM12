import { create } from 'zustand';

// ─── Dummy Data ─────────────────────────────────────────────────────────────
// TSK-0085 s.d. TSK-0095, sesuai PRD bagian 7.1
// Diperlengkapi dengan field baru Fase 5:
//   importProjectId, notes, statusHistory
//
// statusHistory: array log perubahan status dengan timestamp.
// Entry pertama selalu "Dibuat", timestamp disimulasikan secara retroaktif.

const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

const initialTasks = [];

// ─── Helper ──────────────────────────────────────────────────────────────────
const generateTaskId = (tasks) => {
  const nums = tasks.map(t => {
    const match = t.id.match(/TSK-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const highest = nums.length > 0 ? Math.max(...nums) : 85;
  return `TSK-${String(highest + 1).padStart(4, '0')}`;
};

// ─── Store ────────────────────────────────────────────────────────────────────
const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  filterDepartment: 'All',
  filterPriority: 'All',

  setFilterDepartment: (dept) => set({ filterDepartment: dept }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const data = await api('/tasks');
      set({ tasks: data.tasks || [], isLoading: false });
    } catch (err) {
      console.error(err);
      set({ isLoading: false, error: err.message });
    }
  },

  addTask: async (newTaskData) => {
    const tasks = get().tasks;
    const id = generateTaskId(tasks);
    const now = new Date().toISOString();

    const taskData = {
      id,
      title: newTaskData.title,
      department: newTaskData.department,
      priority: newTaskData.priority,
      status: 'Backlog',
      assigneeId: newTaskData.assigneeId || null,
      dueDate: newTaskData.dueDate || null,
      importProjectId: newTaskData.importProjectId || null,
      shipment_un: newTaskData.shipment_un || null,
      sumber_tugas: newTaskData.sumber_tugas || 'MANUAL',
      assigned_by_id: newTaskData.assigned_by_id || newTaskData.assigneeId,
      notes: newTaskData.notes || '',
      statusHistory: [
        {
          status: 'Backlog',
          label: 'Dibuat',
          timestamp: now,
        },
      ],
    };

    // Optimistic update
    set(state => ({ tasks: [taskData, ...state.tasks] }));
    
    try {
      const created = await api('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      // Replace with real data (including proper relations/ids)
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? created : t)
      }));
      return created;
    } catch (err) {
      console.error(err);
      // Revert if error
      set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    }
  },

  moveTask: async (taskId, direction) => {
    const columns = ['Backlog', 'Akan Dikerjakan', 'Dalam Proses', 'Review', 'Selesai'];
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIndex = columns.indexOf(task.status);
    const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const fromStatus = task.status;
    const newStatus = columns[newIndex];
    const timestamp = new Date().toISOString();
    const label = `${fromStatus} → ${newStatus}`;

    // Optimistic Update
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              statusHistory: [...(t.statusHistory || []), { status: newStatus, label, timestamp, fromStatus }],
            }
          : t
      ),
    }));

    try {
      await api(`/tasks/${taskId}/move`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus, label, fromStatus, timestamp })
      });
    } catch (err) {
      console.error(err);
      get().fetchTasks(); // Reload on error
    }
  },

  deleteTask: async (taskId) => {
    // Optimistic update
    const previousTasks = get().tasks;
    set({ tasks: previousTasks.filter(t => t.id !== taskId) });
    try {
      await api(`/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      set({ tasks: previousTasks }); // Revert
    }
  },

  updateTaskNotes: async (taskId, notes) => {
    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, notes } : t
      ),
    }));
    try {
      await api(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes })
      });
    } catch (err) {
      console.error(err);
      get().fetchTasks();
    }
  },

  archiveTasks: (taskIdsToRemove) =>
    set(state => ({
      tasks: state.tasks.filter(t => !taskIdsToRemove.includes(t.id)),
    })),
}));

export default useTaskStore;
