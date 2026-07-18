import { create } from 'zustand';

// ─── Dummy Data ─────────────────────────────────────────────────────────────
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
  tasks: initialTasks,
  isLoading: false,
  error: null,
  filterDepartment: 'All',
  filterPriority: 'All',

  setFilterDepartment: (dept) => set({ filterDepartment: dept }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),

  fetchTasks: () => {
    set({ isLoading: true });
    setTimeout(() => set({ isLoading: false }), 0);
  },

  addTask: (newTaskData) => {
    const tasks = get().tasks;
    const id = generateTaskId(tasks);
    const now = new Date().toISOString();

    const task = {
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
          fromStatus: null,
        },
      ],
    };

    set(state => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  moveTask: (taskId, direction) => {
    const columns = ['Backlog', 'Akan Dikerjakan', 'Dalam Proses', 'Review', 'Selesai'];
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIndex = columns.indexOf(task.status);
    const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const fromStatus = task.status;
    const newStatus = columns[newIndex];
    const historyEntry = {
      status: newStatus,
      label: `${fromStatus} → ${newStatus}`,
      timestamp: new Date().toISOString(),
      fromStatus,
    };

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              statusHistory: [...(t.statusHistory || []), historyEntry],
            }
          : t
      ),
    }));
  },

  deleteTask: (taskId) => {
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId),
    }));
  },

  updateTaskNotes: (taskId, notes) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, notes } : t
      ),
    }));
  },

  archiveTasks: (taskIdsToRemove) =>
    set(state => ({
      tasks: state.tasks.filter(t => !taskIdsToRemove.includes(t.id)),
    })),
}));

export default useTaskStore;
