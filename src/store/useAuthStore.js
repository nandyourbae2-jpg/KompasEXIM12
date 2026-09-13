import { create } from 'zustand';
import api from '../lib/api';
import { setToken, clearToken, getToken } from '../utils/authToken';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ─── Dummy Users ──────────────────────────────────────────────────────────────
// Model 2 dimensi: departemen × level_otoritas.
// Field 'role' lama dihapus sepenuhnya.
//
// Lookup key = `${departemen}__${level_otoritas}` untuk Staff/Head Dept,
// atau `__Manager` untuk Manager (dept = null).

const DUMMY_USERS = [
  // ── Departemen: Import ──────────────────────────────────────────────────────
  // IDs and employee_ids MUST match the database (init.js seed)
  {
    id: 4,
    name: 'Yoda',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-IMP-02',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    id: 5,
    name: 'Katon',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-IMP-03',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    id: 6,
    name: 'Thomas',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-IMP-04',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    id: 7,
    name: 'Keenand',
    tipe_karyawan: 'Karyawan Magang',
    status_aktif: true,
    employee_id: 'EXIM-IMP-05',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },

  // ── Departemen: Export ──────────────────────────────────────────────────────
  {
    id: 8,
    name: 'Andi',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-EXP-01',
    departemen: 'Export',
    level_otoritas: 'Staff Dept',
  },

  // ── Departemen: Administrasi Export (AE) ────────────────────────────────────
  {
    id: 101,
    name: 'Monica',
    nama: 'Monica',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'AE-001',
    departemen: 'Administrasi Export',
    level_otoritas: 'Staff Dept',
  },
  {
    id: 107,
    name: 'Wenny',
    nama: 'Wenny',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'AE-002',
    departemen: 'Administrasi Export',
    level_otoritas: 'Staff Dept',
  },
  {
    id: 108,
    name: 'Ama',
    nama: 'Ama',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'AE-003',
    departemen: 'Administrasi Export',
    level_otoritas: 'Staff Dept',
  },

  // ── Supervisor ──────────────────────────────────────────────────────────────
  {
    id: 2,
    name: 'Bapak SPV Import',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'SPV-IMP-01',
    departemen: 'Import',
    level_otoritas: 'Supervisor',
  },
  {
    id: 3,
    name: 'Ibu SPV Export',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'SPV-EXP-01',
    departemen: 'Export',
    level_otoritas: 'Supervisor',
  },
  {
    id: 102,
    name: 'Amal',
    nama: 'Amal',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'SPV-AE-001',
    departemen: 'Administrasi Export',
    level_otoritas: 'Supervisor',
  },

  // ── Manager ─────────────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Bapak Manager',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'MGR-001',
    departemen: null,
    level_otoritas: 'Manager',
  },
];

// SESSION_KEY has been moved to authToken.js

// ─── Store ────────────────────────────────────────────────────────────────────
const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  /**
   * login: Autentikasi dummy dengan model 3 opsi.
   *
   * @param {string} employee_id  - Employee ID
   * @param {string} password     - Password
   * @param {Object} authParams
   *   @param {string} authParams.tipeAkses - 'Manager' | 'Supervisor' | 'Staff Departemen'
   *   @param {string} authParams.departemen - dept (hanya jika tipeAkses='Staff Departemen')
   */
  login: async (employee_id, password, { tipeAkses, departemen }) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Vercel Demo Fallback: Jika backend error (karena isu Vercel SQLite), gunakan data dummy
        let dummyUser = DUMMY_USERS.find(u => u.employee_id === employee_id);
        if (dummyUser && password === '123456') {
          if (dummyUser.status_aktif === false || dummyUser.status_aktif === 0) {
            set({ error: 'Akun Anda sudah tidak aktif', isLoading: false });
            return null;
          }
          if (['Staff Dept', 'Supervisor'].includes(dummyUser.level_otoritas) && !dummyUser.departemen) {
            set({ error: `Departemen wajib ada untuk role ${dummyUser.level_otoritas}`, isLoading: false });
            return null;
          }
          console.warn("Backend error, using dummy fallback for demo");
          setToken(dummyUser);
          set({ user: dummyUser, isLoading: false, error: null });
          return dummyUser;
        }

        set({ error: data.error || 'Gagal login', isLoading: false });
        return null;
      }

      let user = { ...data.user, name: data.user.nama, token: data.token };

      // Validasi akun aktif
      if (user.status_aktif === false || user.status_aktif === 0) {
        set({ error: 'Akun Anda sudah tidak aktif', isLoading: false });
        return null;
      }

      // Validasi departemen berdasarkan role
      if (['Staff Dept', 'Supervisor'].includes(user.level_otoritas)) {
        if (!user.departemen) {
          set({ error: `Departemen wajib ada untuk role ${user.level_otoritas}`, isLoading: false });
          return null;
        }
      }

      // Validasi tipe akses yang dipilih di UI sesuai dengan user (opsional jika dibutuhkan, tapi untuk sekarang kita ikut instruksi khusus)

      // Simpan session menggunakan helper authToken
      setToken(user);

      set({ user, isLoading: false, error: null });
      return user;
    } catch (err) {
      // Vercel Demo Fallback: Jika backend mati total, gunakan data dummy
      let dummyUser = DUMMY_USERS.find(u => u.employee_id === employee_id);
      if (dummyUser && password === '123456') {
        if (dummyUser.status_aktif === false || dummyUser.status_aktif === 0) {
          set({ error: 'Akun Anda sudah tidak aktif', isLoading: false });
          return null;
        }
        if (['Staff Dept', 'Supervisor'].includes(dummyUser.level_otoritas) && !dummyUser.departemen) {
          set({ error: `Departemen wajib ada untuk role ${dummyUser.level_otoritas}`, isLoading: false });
          return null;
        }
        console.warn("Backend unreachable, using dummy fallback for demo");
        setToken(dummyUser);
        set({ user: dummyUser, isLoading: false, error: null });
        return dummyUser;
      }

      set({ error: 'Tidak dapat terhubung ke server', isLoading: false });
      return null;
    }
  },

  /**
   * logout: Hapus session dan reset state.
   */
  allUsers: [],

  fetchAllUsers: async () => {
    try {
      const users = await api('/users/all');
      const mappedUsers = users.map(u => ({ ...u, name: u.nama }));
      set({ allUsers: mappedUsers });
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  },

  addStaff: async (staffData) => {
    try {
      const newUserRaw = await api('/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: staffData.name,
          employee_id: staffData.employee_id,
          departemen: staffData.departemen,
          tipe_karyawan: staffData.tipe_karyawan
        })
      });
      const newUser = { ...newUserRaw, name: newUserRaw.nama };
      set(state => ({ allUsers: [...state.allUsers, newUser] }));
    } catch (error) {
      console.error('Error adding staff:', error);
      throw error;
    }
  },

  updateStaff: async (id, staffData) => {
    try {
      const updatedRaw = await api(`/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: staffData.name,
          tipe_karyawan: staffData.tipe_karyawan
        })
      });
      const updated = { ...updatedRaw, name: updatedRaw.nama };
      set(state => ({
        allUsers: state.allUsers.map(u => u.id === id ? updated : u)
      }));
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },

  toggleStaffStatus: async (id) => {
    try {
      const staff = get().allUsers.find(u => u.id === id);
      if (!staff) return;
      const newStatus = staff.status_aktif === 1 ? 0 : 1;
      
      await api(`/staff/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_aktif: newStatus })
      });
      set(state => ({
        allUsers: state.allUsers.map(u => u.id === id ? { ...u, status_aktif: newStatus } : u)
      }));
    } catch (error) {
      console.error('Error toggling staff status:', error);
      throw error;
    }
  },

  getStaffByDept: (dept) => get().allUsers.filter(u => u.departemen === dept && u.level_otoritas === 'Staff Dept'),
  getAllStaff: () => get().allUsers.filter(u => u.level_otoritas === 'Staff Dept'),
  getAllUsers: () => get().allUsers,

  logout: () => {
    clearToken();
    set({ user: null, error: null });
  },

  /**
   * checkSession: Periksa apakah ada session yang tersimpan di sessionStorage.
   * Dipanggil saat App pertama kali load untuk restore state login.
   * MELAKUKAN SINKRONISASI dengan database live agar ID dummy lama diperbarui!
   */
  checkSession: async () => {
    set({ isLoading: true });

    const raw = localStorage.getItem('kompas_exim_session'); // Using raw to test existence
    if (raw) {
      try {
        const user = JSON.parse(raw);
        
        // Coba sinkronisasi dengan database backend agar ID selalu up-to-date (Bugfix)
        try {
          const res = await fetch(`${BASE_URL}/users/all`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          if (res.status === 401) {
            clearToken();
            set({ user: null, isLoading: false });
            console.error('checkSession 401 Redirect Intercepted');
            // window.location.hash = '#/login';
            return;
          }
          if (res.ok) {
            const allUsersRaw = await res.json();
            const realUser = allUsersRaw.find(u => u.employee_id === user.employee_id);
            if (realUser) {
              const updatedUser = { ...realUser, name: realUser.nama, token: user.token };
              setToken(updatedUser);
              set({ user: updatedUser, isLoading: false });
              return;
            }
          }
        } catch(e) { 
          console.error('Session sync failed, using cached data', e); 
        }

        set({ user, isLoading: false });
      } catch {
        clearToken();
        set({ user: null, isLoading: false });
      }
    } else {
      set({ user: null, isLoading: false });
    }
  },
}));

export const getDummyUsers = () => DUMMY_USERS;
export default useAuthStore;
