import { describe, it, expect, vi, beforeEach } from 'vitest';
import useAuthStore, { getDummyUsers } from './useAuthStore';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: vi.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthStore.setState({
      user: null,
      allUsers: [],
      isLoading: false,
      error: null,
    });
  });

  describe('login', () => {
    it('should login successfully and set session', async () => {
      const mockUser = { id: 1, nama: 'Test User' };
      const expectedUser = { id: 1, nama: 'Test User', name: 'Test User', token: 'token123' };
      
      // We mock fetch because useAuthStore's login uses window.fetch directly, not the api wrapper!
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'token123' }),
      });

      const promise = useAuthStore.getState().login('EMP-01', 'password', { tipeAkses: 'Manager', departemen: null });
      expect(useAuthStore.getState().isLoading).toBe(true);

      const success = await promise;

      expect(global.fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({ method: 'POST' }));
      expect(success).toBeTruthy();
      expect(useAuthStore.getState().user).toEqual(expectedUser);
      expect(JSON.parse(sessionStorage.getItem('kompas_exim_session'))).toEqual(expectedUser);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      const success = await useAuthStore.getState().login('EMP-01', 'wrong', { tipeAkses: 'Manager', departemen: null });

      expect(success).toBeNull();
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
      expect(sessionStorage.getItem('kompas_exim_session')).toBeNull();
    });

    it('should handle login for inactive account', async () => {
      const mockUser = { id: 1, nama: 'Test User', status_aktif: false };
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'token123' }),
      });

      const success = await useAuthStore.getState().login('EMP-01', 'password', {});

      expect(success).toBeNull();
      expect(useAuthStore.getState().error).toBe('Akun Anda sudah tidak aktif');
      expect(sessionStorage.getItem('kompas_exim_session')).toBeNull();
    });

    it('should require department for Staff Dept', async () => {
      const mockUser = { id: 1, nama: 'Test User', status_aktif: true, level_otoritas: 'Staff Dept', departemen: null };
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'token123' }),
      });

      const success = await useAuthStore.getState().login('EMP-01', 'password', {});

      expect(success).toBeNull();
      expect(useAuthStore.getState().error).toContain('Departemen wajib ada');
    });

    it('should require department for Supervisor', async () => {
      const mockUser = { id: 1, nama: 'Test User', status_aktif: true, level_otoritas: 'Supervisor', departemen: null };
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'token123' }),
      });

      const success = await useAuthStore.getState().login('EMP-01', 'password', {});

      expect(success).toBeNull();
      expect(useAuthStore.getState().error).toContain('Departemen wajib ada');
    });

    it('should allow Manager without department', async () => {
      const mockUser = { id: 1, nama: 'Test User', status_aktif: true, level_otoritas: 'Manager', departemen: null };
      const expectedUser = { id: 1, nama: 'Test User', status_aktif: true, level_otoritas: 'Manager', departemen: null, name: 'Test User', token: 'token123' };
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'token123' }),
      });

      const success = await useAuthStore.getState().login('EMP-01', 'password', {});

      expect(success).toEqual(expectedUser);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear user state and session storage', () => {
      sessionStorage.setItem('kompas_exim_session', JSON.stringify({ name: 'Test' }));
      useAuthStore.setState({ user: { name: 'Test' } });

      useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(sessionStorage.getItem('kompas_exim_session')).toBeNull();
    });
  });

  describe('fetchAllUsers', () => {
    it('should fetch and format users correctly', async () => {
      const mockUsers = [{ id: 1, nama: 'John' }, { id: 2, nama: 'Jane' }];
      api.mockResolvedValue(mockUsers);

      await useAuthStore.getState().fetchAllUsers();

      expect(api).toHaveBeenCalledWith('/users/all');
      const allUsers = useAuthStore.getState().allUsers;
      expect(allUsers).toHaveLength(2);
      expect(allUsers[0].name).toBe('John');
      expect(allUsers[1].name).toBe('Jane');
    });
  });

  describe('addStaff', () => {
    it('should add staff successfully', async () => {
      const mockNewStaff = { id: 3, nama: 'New Staff' };
      api.mockResolvedValueOnce(mockNewStaff);

      await useAuthStore.getState().addStaff({ name: 'New Staff', employee_id: '123', departemen: 'Import', tipe_karyawan: 'Tetap' });

      expect(api).toHaveBeenCalledWith('/staff', expect.objectContaining({ method: 'POST' }));
      const allUsers = useAuthStore.getState().allUsers;
      expect(allUsers).toHaveLength(1);
      expect(allUsers[0].name).toBe('New Staff');
    });
  });

  describe('updateStaff', () => {
    it('should update staff successfully', async () => {
      useAuthStore.setState({ allUsers: [{ id: 1, name: 'Old Name' }] });
      api.mockResolvedValueOnce({ id: 1, nama: 'New Name' });

      await useAuthStore.getState().updateStaff(1, { name: 'New Name' });

      expect(api).toHaveBeenCalledWith('/staff/1', expect.objectContaining({ method: 'PATCH' }));
      const allUsers = useAuthStore.getState().allUsers;
      expect(allUsers[0].name).toBe('New Name');
    });
  });

  describe('toggleStaffStatus', () => {
    it('should toggle staff status successfully', async () => {
      useAuthStore.setState({ allUsers: [{ id: 1, status_aktif: 1 }] });
      api.mockResolvedValueOnce({});

      await useAuthStore.getState().toggleStaffStatus(1);

      expect(api).toHaveBeenCalledWith('/staff/1/status', expect.objectContaining({ method: 'PATCH' }));
      const allUsers = useAuthStore.getState().allUsers;
      expect(allUsers[0].status_aktif).toBe(0);
    });
  });

  describe('Selectors', () => {
    it('should filter staff by department correctly', () => {
      useAuthStore.setState({
        allUsers: [
          { departemen: 'Import', level_otoritas: 'Staff Dept' },
          { departemen: 'Import', level_otoritas: 'Manager' },
          { departemen: 'Export', level_otoritas: 'Staff Dept' }
        ]
      });

      const importStaff = useAuthStore.getState().getStaffByDept('Import');
      expect(importStaff).toHaveLength(1);
      
      const allStaff = useAuthStore.getState().getAllStaff();
      expect(allStaff).toHaveLength(2);
    });
  });

  describe('checkSession', () => {
    it('should restore session from sessionStorage', async () => {
      const mockUser = { id: 1, name: 'Test', employee_id: 'EMP-01', token: 'token123' };
      sessionStorage.setItem('kompas_exim_session', JSON.stringify(mockUser));
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ employee_id: 'EMP-01', nama: 'Test Real' }])
      });

      await useAuthStore.getState().checkSession();

      const user = useAuthStore.getState().user;
      expect(user.name).toBe('Test Real');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should clear session and redirect on 401 token expired', async () => {
      const mockUser = { id: 1, name: 'Test', employee_id: 'EMP-01', token: 'token123' };
      sessionStorage.setItem('kompas_exim_session', JSON.stringify(mockUser));
      
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        status: 401,
        ok: false
      });

      await useAuthStore.getState().checkSession();

      expect(useAuthStore.getState().user).toBeNull();
      expect(sessionStorage.getItem('kompas_exim_session')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('should clear session on invalid json', async () => {
      sessionStorage.setItem('kompas_exim_session', 'invalid');
      await useAuthStore.getState().checkSession();
      expect(useAuthStore.getState().user).toBeNull();
      expect(sessionStorage.getItem('kompas_exim_session')).toBeNull();
    });
  });
});
