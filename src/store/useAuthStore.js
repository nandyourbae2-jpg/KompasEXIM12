import { create } from 'zustand';

// ─── Dummy Users ──────────────────────────────────────────────────────────────
// Model 2 dimensi: departemen × level_otoritas.
// Field 'role' lama dihapus sepenuhnya.
//
// Lookup key = `${departemen}__${level_otoritas}` untuk Staff/Head Dept,
// atau `__Manager` untuk Manager (dept = null).

const DUMMY_USERS = [
  // ── Departemen: Import ──────────────────────────────────────────────────────
  {
    id: 2,
    name: 'Yoda',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-IMP-02',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    id: 3,
    name: 'Katon',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-IMP-03',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    id: 4,
    name: 'Thomas',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-IMP-04',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    id: 5,
    name: 'Keenand',
    tipe_karyawan: 'Karyawan Magang',
    status_aktif: true,
    employee_id: 'EXIM-IMP-05',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },

  // ── Departemen: Export ──────────────────────────────────────────────────────
  {
    id: 7,
    name: 'Nita L.',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-EXP-02',
    departemen: 'Export',
    level_otoritas: 'Staff Dept',
  },

  // ── Departemen: Administrasi Export (AE) ────────────────────────────────────
  {
    id: 9,
    name: 'Maya C.',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-AE-02',
    departemen: 'Administrasi Export (AE)',
    level_otoritas: 'Staff Dept',
  },

  // ── Departemen: Account Officer ────────────────────────────────────────────
  {
    id: 10,
    name: 'Anton D.',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-AO-01',
    departemen: 'Account Officer',
    level_otoritas: 'Staff Dept',
  },

  // ── Supervisor (sekarang per departemen) ──────────────────────────────────
  {
    id: 1,
    name: 'Bapak SPV Import',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-SPV-IMP',
    departemen: 'Import',
    level_otoritas: 'Supervisor',
  },
  {
    id: 101,
    name: 'Ibu SPV Export',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-SPV-EXP',
    departemen: 'Export',
    level_otoritas: 'Supervisor',
  },
  {
    id: 102,
    name: 'Bapak SPV AE',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-SPV-AE',
    departemen: 'Administrasi Export (AE)',
    level_otoritas: 'Supervisor',
  },
  {
    id: 103,
    name: 'Ibu SPV AO',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-SPV-AO',
    departemen: 'Account Officer',
    level_otoritas: 'Supervisor',
  },

  // ── Manager (lintas semua departemen) ─────────────────────────────────────
  {
    id: 11,
    name: 'Rina P.',
    tipe_karyawan: 'Karyawan Tetap',
    status_aktif: true,
    employee_id: 'EXIM-MGR-01',
    departemen: null,
    level_otoritas: 'Manager',
  },
];

const SESSION_KEY = 'kompas_exim_session';

// ─── Store ────────────────────────────────────────────────────────────────────
const useAuthStore = create((set) => ({
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
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ error: data.error || 'Gagal login', isLoading: false });
        return null;
      }

      const user = data.user;

      // Simpan session ke sessionStorage agar persist selama tab terbuka
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));

      set({ user, isLoading: false, error: null });
      return user;
    } catch (err) {
      set({ error: 'Tidak dapat terhubung ke server', isLoading: false });
      return null;
    }
  },

  /**
   * logout: Hapus session dan reset state.
   */
  /**
   * Manajemen Staff (Supervisor & Manager)
   */
  addStaff: (staffData) => set(state => {
    // Determine new ID (max id + 1)
    const newId = Math.max(...DUMMY_USERS.map(u => u.id)) + 1 + Math.floor(Math.random() * 100);
    const newUser = {
      id: newId,
      name: staffData.name,
      employee_id: staffData.employee_id,
      departemen: staffData.departemen,
      level_otoritas: 'Staff Dept',
      tipe_karyawan: staffData.tipe_karyawan,
      status_aktif: true
    };
    DUMMY_USERS.push(newUser);
    // Not updating state.user since this is just DUMMY_USERS mutation
    return { ...state }; 
  }),

  updateStaff: (id, staffData) => set(state => {
    const idx = DUMMY_USERS.findIndex(u => u.id === id);
    if (idx !== -1) {
      DUMMY_USERS[idx] = { ...DUMMY_USERS[idx], ...staffData };
    }
    return { ...state };
  }),

  toggleStaffStatus: (id) => set(state => {
    const idx = DUMMY_USERS.findIndex(u => u.id === id);
    if (idx !== -1) {
      DUMMY_USERS[idx].status_aktif = !DUMMY_USERS[idx].status_aktif;
    }
    return { ...state };
  }),

  getStaffByDept: (dept) => DUMMY_USERS.filter(u => u.departemen === dept && u.level_otoritas === 'Staff Dept'),
  getAllStaff: () => DUMMY_USERS.filter(u => u.level_otoritas === 'Staff Dept'),
  getAllUsers: () => DUMMY_USERS, // Expose for lookup

  logout: () => {
    sessionStorage.removeItem(SESSION_KEY);
    set({ user: null, error: null });
  },

  /**
   * checkSession: Periksa apakah ada session yang tersimpan di sessionStorage.
   * Dipanggil saat App pertama kali load untuk restore state login.
   */
  checkSession: async () => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 0));

    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        set({ user, isLoading: false });
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
        set({ user: null, isLoading: false });
      }
    } else {
      set({ user: null, isLoading: false });
    }
  },
}));

export const getDummyUsers = () => DUMMY_USERS;
export default useAuthStore;
