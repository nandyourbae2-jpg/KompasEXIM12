import { describe, it, expect, vi, beforeEach } from 'vitest';
import useVendorStore from './useVendorStore';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: vi.fn(),
}));

describe('useVendorStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVendorStore.setState({
      vendors: [],
      loading: false,
    });
  });

  describe('fetchVendors', () => {
    it('should fetch vendors successfully', async () => {
      const mockData = [{ id: 1, nama_vendor: 'Vendor A' }];
      api.mockResolvedValueOnce(mockData);

      const promise = useVendorStore.getState().fetchVendors();
      expect(useVendorStore.getState().loading).toBe(true);
      await promise;

      expect(api).toHaveBeenCalledWith('/vendors');
      expect(useVendorStore.getState().loading).toBe(false);
      expect(useVendorStore.getState().vendors).toEqual(mockData);
    });

    it('should handle fetch errors gracefully', async () => {
      api.mockRejectedValueOnce(new Error('Fetch error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await useVendorStore.getState().fetchVendors();
      
      expect(useVendorStore.getState().loading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching vendors:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('addVendor', () => {
    it('should add vendor successfully', async () => {
      const newVendor = { id: 2, nama_vendor: 'Vendor B' };
      api.mockResolvedValueOnce(newVendor);

      const result = await useVendorStore.getState().addVendor({ nama_vendor: 'Vendor B' });

      expect(api).toHaveBeenCalledWith('/vendors', expect.objectContaining({ method: 'POST' }));
      expect(result).toEqual(newVendor);
      expect(useVendorStore.getState().vendors).toContainEqual(newVendor);
    });

    it('should throw error on fail', async () => {
      api.mockRejectedValueOnce(new Error('Fail'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(useVendorStore.getState().addVendor({})).rejects.toThrow('Fail');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('updateVendor', () => {
    it('should update vendor successfully', async () => {
      useVendorStore.setState({ vendors: [{ id: 1, nama_vendor: 'Old' }] });
      const updated = { id: 1, nama_vendor: 'New' };
      api.mockResolvedValueOnce(updated);

      await useVendorStore.getState().updateVendor(1, { nama_vendor: 'New' });
      
      expect(api).toHaveBeenCalledWith('/vendors/1', expect.objectContaining({ method: 'PATCH' }));
      expect(useVendorStore.getState().vendors[0].nama_vendor).toBe('New');
    });

    it('should throw error on fail', async () => {
      api.mockRejectedValueOnce(new Error('Fail'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(useVendorStore.getState().updateVendor(1, {})).rejects.toThrow('Fail');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('deleteVendor', () => {
    it('should delete vendor successfully', async () => {
      useVendorStore.setState({ vendors: [{ id: 1 }, { id: 2 }] });
      api.mockResolvedValueOnce({});

      await useVendorStore.getState().deleteVendor(1);

      expect(api).toHaveBeenCalledWith('/vendors/1', { method: 'DELETE' });
      expect(useVendorStore.getState().vendors).toHaveLength(1);
      expect(useVendorStore.getState().vendors[0].id).toBe(2);
    });

    it('should throw error on fail', async () => {
      api.mockRejectedValueOnce(new Error('Fail'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(useVendorStore.getState().deleteVendor(1)).rejects.toThrow('Fail');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
