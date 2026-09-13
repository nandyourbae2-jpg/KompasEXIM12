import { describe, it, expect, vi, beforeEach } from 'vitest';
import usePibStore from './usePibStore';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: vi.fn(),
}));

describe('usePibStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePibStore.setState({
      pibs: [],
      isLoading: false,
      error: null,
    });
  });

  it('should initialize with default state', () => {
    const state = usePibStore.getState();
    expect(state.pibs).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  describe('fetchPibs', () => {
    it('should fetch pibs successfully', async () => {
      const mockData = [{ id: 1, pib_number: 'PIB-001' }];
      api.mockResolvedValueOnce(mockData);

      const promise = usePibStore.getState().fetchPibs();
      expect(usePibStore.getState().isLoading).toBe(true);

      await promise;

      expect(api).toHaveBeenCalledWith('/pib');
      expect(usePibStore.getState().isLoading).toBe(false);
      expect(usePibStore.getState().pibs).toEqual(mockData);
      expect(usePibStore.getState().error).toBeNull();
    });

    it('should handle fetch error', async () => {
      api.mockRejectedValueOnce(new Error('Fetch failed'));

      await usePibStore.getState().fetchPibs();

      expect(usePibStore.getState().isLoading).toBe(false);
      expect(usePibStore.getState().error).toBe('Fetch failed');
    });

    it('should handle non-array response gracefully', async () => {
      api.mockResolvedValueOnce({ invalid: 'data' });

      await usePibStore.getState().fetchPibs();

      expect(usePibStore.getState().pibs).toEqual([]);
    });
  });

  describe('createPib', () => {
    it('should create pib successfully', async () => {
      const newPib = { id: 2, pib_number: 'PIB-002' };
      api.mockResolvedValueOnce(newPib);

      const pibData = { amount: 1000 };
      const promise = usePibStore.getState().createPib(pibData);
      expect(usePibStore.getState().isLoading).toBe(true);

      const result = await promise;

      expect(api).toHaveBeenCalledWith('/pib', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(pibData)
      }));
      expect(result).toEqual(newPib);
      expect(usePibStore.getState().isLoading).toBe(false);
      expect(usePibStore.getState().pibs).toContainEqual(newPib);
    });

    it('should throw error on create fail', async () => {
      api.mockRejectedValueOnce(new Error('Create failed'));

      await expect(usePibStore.getState().createPib({})).rejects.toThrow('Create failed');
      expect(usePibStore.getState().isLoading).toBe(false);
      expect(usePibStore.getState().error).toBe('Create failed');
    });
  });

  describe('updatePibStatus', () => {
    it('should update status successfully', async () => {
      usePibStore.setState({ pibs: [{ id: 1, status: 'Draft' }] });
      api.mockResolvedValueOnce({});

      await usePibStore.getState().updatePibStatus(1, 'Approved');

      expect(api).toHaveBeenCalledWith('/pib/1/status', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'Approved' })
      }));
      expect(usePibStore.getState().pibs[0].status).toBe('Approved');
    });

    it('should throw error on update fail', async () => {
      api.mockRejectedValueOnce(new Error('Update failed'));

      await expect(usePibStore.getState().updatePibStatus(1, 'Approved')).rejects.toThrow('Update failed');
    });
  });

  describe('deletePib', () => {
    it('should delete pib successfully', async () => {
      usePibStore.setState({ pibs: [{ id: 1 }, { id: 2 }] });
      api.mockResolvedValueOnce({});

      await usePibStore.getState().deletePib(1);

      expect(api).toHaveBeenCalledWith('/pib/1', { method: 'DELETE' });
      expect(usePibStore.getState().pibs).toHaveLength(1);
      expect(usePibStore.getState().pibs[0].id).toBe(2);
    });

    it('should throw error on delete fail', async () => {
      api.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(usePibStore.getState().deletePib(1)).rejects.toThrow('Delete failed');
    });
  });
});
