import { describe, it, expect, vi, beforeEach } from 'vitest';
import useTaskStore from './useTaskStore';
import api from '../lib/api';
import useAuthStore from './useAuthStore';

vi.mock('../lib/api', () => ({
  default: vi.fn(),
}));

vi.mock('./useAuthStore', () => ({
  default: {
    getState: vi.fn(),
  }
}));

describe('useTaskStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskStore.setState({
      tasks: [],
      isLoading: false,
      error: null,
      filterDepartment: 'All',
      filterPriority: 'All',
    });
  });

  describe('Filters', () => {
    it('should set filters correctly', () => {
      useTaskStore.getState().setFilterDepartment('Import');
      expect(useTaskStore.getState().filterDepartment).toBe('Import');

      useTaskStore.getState().setFilterPriority('High');
      expect(useTaskStore.getState().filterPriority).toBe('High');
    });
  });

  describe('fetchTasks', () => {
    it('should fetch tasks with correct query params for authenticated user', async () => {
      useAuthStore.getState.mockReturnValue({
        user: { id: 1, level_otoritas: 'Staff Dept', departemen: 'Import' }
      });
      
      const mockData = [{
        id: 1,
        judul: 'Test Task',
        departemen: 'Import',
        statusHistory: [{ status_dari: 'Draft', status_ke: 'Open', diubah_pada: '2023-01-01' }]
      }];
      api.mockResolvedValueOnce(mockData);

      await useTaskStore.getState().fetchTasks();

      expect(api).toHaveBeenCalledWith('/tasks?level_otoritas=Staff+Dept&departemen=Import&userId=1');
      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Test Task');
      expect(tasks[0].statusHistory).toHaveLength(1);
      expect(tasks[0].statusHistory[0].label).toBe('Draft → Open');
    });

    it('should fetch tasks without query params if unauthenticated', async () => {
      useAuthStore.getState.mockReturnValue({ user: null });
      api.mockResolvedValueOnce([]);

      await useTaskStore.getState().fetchTasks();

      expect(api).toHaveBeenCalledWith('/tasks');
    });

    it('should handle fetch error', async () => {
      useAuthStore.getState.mockReturnValue({ user: null });
      api.mockRejectedValueOnce(new Error('Fetch failed'));

      await useTaskStore.getState().fetchTasks();

      expect(useTaskStore.getState().error).toBe('Fetch failed');
    });
  });

  // Adding stubs for create, update, delete for partial coverage mapping
  describe('addTask', () => {
    it('should create task', async () => {
      const mockResult = { id: 2, judul: 'New' };
      api.mockResolvedValueOnce(mockResult);

      const promise = useTaskStore.getState().addTask({ title: 'New' });
      const result = await promise;

      expect(api).toHaveBeenCalledWith('/tasks', expect.objectContaining({ method: 'POST' }));
      expect(result.judul).toBe('New');
    });
  });

  describe('moveTask', () => {
    it('should move task status', async () => {
      useTaskStore.setState({ tasks: [{ id: 1, status: 'Akan Dikerjakan' }] });
      api.mockResolvedValueOnce({});
      useAuthStore.getState.mockReturnValue({ user: { id: 1 } });

      await useTaskStore.getState().moveTask(1, 'forward');

      expect(api).toHaveBeenCalledWith('/tasks/1/status', expect.objectContaining({ method: 'PATCH' }));
      // Notice we didn't test if it updated the store synchronously since the hook fetches again
    });
  });
});
