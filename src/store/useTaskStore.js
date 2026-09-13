import { create } from 'zustand';
import api from '../lib/api';
import useAuthStore from './useAuthStore';

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
      const user = useAuthStore.getState().user;
      let queryParams = '';
      if (user) {
        const params = new URLSearchParams({
          level_otoritas: user.level_otoritas,
          departemen: user.departemen || '',
          userId: user.id
        });
        queryParams = `?${params.toString()}`;
      }

      const data = await api(`/tasks${queryParams}`);
      // Format properties for frontend
      const formattedTasks = data.map(t => {
        const instructionNotes = t.catatan_progress || t.deskripsi || '';
        return {
          id: t.id,
          task_code: t.task_code,
          title: t.judul,
          deskripsi: instructionNotes,
          department: t.departemen,
          priority: t.prioritas,
          status: t.status,
          assigneeId: t.assignee_id,
          assignee: t.assignee, // Added from backend
          assigned_by_id: t.assigned_by_id,
          assigned_by: t.assigned_by, // Added from backend
          importProjectId: t.import_project_id,
          dueDate: t.tenggat,
          progress: t.progress,
          notes: instructionNotes,
          sumber_tugas: t.sumber_tugas,
          statusHistory: t.statusHistory?.map(h => ({
            status: h.status_ke,
            fromStatus: h.status_dari,
            label: h.status_dari ? `${h.status_dari} → ${h.status_ke}` : 'Dibuat',
            timestamp: h.diubah_pada
          })) || []
        };
      });
      set({ tasks: formattedTasks, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ isLoading: false, error: err.message });
    }
  },

  addTask: async (newTaskData) => {
    try {
      const notesContent = newTaskData.notes || newTaskData.deskripsi || newTaskData.catatan_progress || '';
      const payload = {
        title: newTaskData.title,
        notes: notesContent,
        deskripsi: notesContent,
        catatan_progress: notesContent,
        department: newTaskData.department,
        priority: newTaskData.priority,
        status: 'Backlog',
        sumber_tugas: newTaskData.sumber_tugas || 'Manual',
        assigneeId: newTaskData.assigneeId ? Number(newTaskData.assigneeId) : null,
        assigned_by_id: newTaskData.assigned_by_id ? Number(newTaskData.assigned_by_id) : (newTaskData.assigneeId ? Number(newTaskData.assigneeId) : null),
        importProjectId: newTaskData.importProjectId || null,
        dueDate: newTaskData.dueDate || null,
      };

      const res = await api('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await get().fetchTasks();
      const channel = new BroadcastChannel('exim_sync_channel');
      channel.postMessage({ type: 'DATA_UPDATED' });
      channel.close();
      return res;
    } catch (err) {
      console.error('Error adding task:', err);
      throw err;
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

    try {
      await api(`/tasks/${taskId}/move`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          fromStatus: fromStatus,
          label: `${fromStatus} → ${newStatus}`,
          timestamp: new Date().toISOString(),
          diubah_oleh_id: task.assigneeId // Simplification for prototype
        })
      });
      await get().fetchTasks();
      const channel = new BroadcastChannel('exim_sync_channel');
      channel.postMessage({ type: 'DATA_UPDATED' });
      channel.close();
    } catch (err) {
      console.error('Error moving task:', err);
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await api(`/tasks/${taskId}`, { method: 'DELETE' });
      await get().fetchTasks();
      const channel = new BroadcastChannel('exim_sync_channel');
      channel.postMessage({ type: 'DATA_UPDATED' });
      channel.close();
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  },

  updateTaskNotes: async (taskId, notes) => {
    try {
      // Proteksi fallback. Jika undefined/null, kembalikan menjadi string kosong
      const safeNotes = notes ?? ''; 
      
      await api(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: safeNotes })
      });
      await get().fetchTasks();
      const channel = new BroadcastChannel('exim_sync_channel');
      channel.postMessage({ type: 'DATA_UPDATED' });
      channel.close();
    } catch (err) {
      console.error('Error updating task notes:', err);
      throw err;
    }
  },

  archiveTasks: (taskIdsToRemove) =>
    set(state => ({
      tasks: state.tasks.filter(t => !taskIdsToRemove.includes(t.id)),
    })),
}));

export default useTaskStore;
