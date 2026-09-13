import { describe, it, expect, vi, beforeEach } from 'vitest';
import useMtbStore from './useMtbStore';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: vi.fn(),
}));

describe('useMtbStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMtbStore.setState({
      periodes: [],
      transaksi: [],
      isLoading: false,
      error: null,
    });
  });

  describe('fetchPeriodes', () => {
    it('should fetch periodes successfully', async () => {
      const mockData = [{ id: 1, nama_periode: 'Maret 2023' }];
      api.mockResolvedValueOnce(mockData);

      const promise = useMtbStore.getState().fetchPeriodes();
      expect(useMtbStore.getState().isLoading).toBe(true);
      await promise;

      expect(api).toHaveBeenCalledWith('/mtb-periode');
      expect(useMtbStore.getState().isLoading).toBe(false);
      expect(useMtbStore.getState().periodes).toEqual(mockData);
    });

    it('should handle fetch errors', async () => {
      api.mockRejectedValueOnce(new Error('Network Error'));
      await useMtbStore.getState().fetchPeriodes();
      
      expect(useMtbStore.getState().isLoading).toBe(false);
      expect(useMtbStore.getState().error).toBe('Network Error');
    });
  });

  describe('createPeriode', () => {
    it('should create periode successfully', async () => {
      const newPeriode = { id: 2, nama_periode: 'April 2023' };
      api.mockResolvedValueOnce(newPeriode);

      const promise = useMtbStore.getState().createPeriode({ nama_periode: 'April 2023' });
      expect(useMtbStore.getState().isLoading).toBe(true);
      const result = await promise;

      expect(api).toHaveBeenCalledWith('/mtb-periode', expect.objectContaining({ method: 'POST' }));
      expect(result).toEqual(newPeriode);
      expect(useMtbStore.getState().periodes).toContainEqual(newPeriode);
      expect(useMtbStore.getState().isLoading).toBe(false);
    });

    it('should throw error on fail', async () => {
      api.mockRejectedValueOnce(new Error('Fail'));
      await expect(useMtbStore.getState().createPeriode({})).rejects.toThrow('Fail');
      expect(useMtbStore.getState().error).toBe('Fail');
    });
  });

  describe('updatePeriodeStatus', () => {
    it('should update periode status successfully', async () => {
      useMtbStore.setState({ periodes: [{ id: 1, status: 'Draft' }] });
      const updated = { id: 1, status: 'Submitted' };
      api.mockResolvedValueOnce(updated);

      const result = await useMtbStore.getState().updatePeriodeStatus(1, { status: 'Submitted' });
      
      expect(api).toHaveBeenCalledWith('/mtb-periode/1/status', expect.objectContaining({ method: 'PATCH' }));
      expect(result).toEqual(updated);
      expect(useMtbStore.getState().periodes[0].status).toBe('Submitted');
    });

    it('should throw error on fail', async () => {
      api.mockRejectedValueOnce(new Error('Fail'));
      await expect(useMtbStore.getState().updatePeriodeStatus(1, {})).rejects.toThrow('Fail');
    });
  });

  describe('deletePeriode', () => {
    it('should delete periode successfully', async () => {
      useMtbStore.setState({ periodes: [{ id: 1 }, { id: 2 }] });
      
      // api is called twice: once for DELETE, once for GET /mtb-periode (from fetchPeriodes)
      api.mockResolvedValueOnce({});
      api.mockResolvedValueOnce([{ id: 2 }]);

      await useMtbStore.getState().deletePeriode(1);

      expect(api).toHaveBeenCalledWith('/mtb-periode/1', { method: 'DELETE' });
      expect(api).toHaveBeenCalledWith('/mtb-periode');
      expect(useMtbStore.getState().periodes).toHaveLength(1);
      expect(useMtbStore.getState().periodes[0].id).toBe(2);
    });
    
    it('should throw error on fail', async () => {
      api.mockRejectedValueOnce(new Error('Fail'));
      await expect(useMtbStore.getState().deletePeriode(1)).rejects.toThrow('Fail');
    });
  });
});
