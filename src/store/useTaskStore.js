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

const initialTasks = [
  {
    id: 'TSK-0085',
    title: 'Review dokumen B/L dari Meratus Line',
    department: 'Import',
    priority: 'Kritis',
    status: 'Dalam Proses',
    assigneeId: 2,
    dueDate: '14 Jul',
    importProjectId: 'IMP-0001',
    shipment_un: 'UN-20240710-001',
    sumber_tugas: 'SYSTEM',
    assigned_by_id: 2,
    notes: '',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(6), fromStatus: null },
      { status: 'Akan Dikerjakan', label: 'Backlog → Akan Dikerjakan', timestamp: daysAgo(4), fromStatus: 'Backlog' },
      { status: 'Dalam Proses', label: 'Akan Dikerjakan → Dalam Proses', timestamp: daysAgo(2), fromStatus: 'Akan Dikerjakan' },
    ],
  },
  {
    id: 'TSK-0086',
    title: 'Koordinasi pengiriman EX-4820 ke Ekspor',
    department: 'Export',
    priority: 'Tinggi',
    status: 'Review',
    assigneeId: 2,
    dueDate: '15 Jul',
    importProjectId: null,
    shipment_un: null,
    sumber_tugas: 'MANUAL',
    assigned_by_id: 2,
    notes: 'Koordinasi dengan tim gudang sudah selesai, tinggal tanda tangan SPV.',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(7), fromStatus: null },
      { status: 'Akan Dikerjakan', label: 'Backlog → Akan Dikerjakan', timestamp: daysAgo(5), fromStatus: 'Backlog' },
      { status: 'Dalam Proses', label: 'Akan Dikerjakan → Dalam Proses', timestamp: daysAgo(3), fromStatus: 'Akan Dikerjakan' },
      { status: 'Review', label: 'Dalam Proses → Review', timestamp: daysAgo(1), fromStatus: 'Dalam Proses' },
    ],
  },
  {
    id: 'TSK-0087',
    title: 'Input PIB ke portal Bea Cukai',
    department: 'Import',
    priority: 'Kritis',
    status: 'Akan Dikerjakan',
    assigneeId: 2,
    dueDate: '13 Jul',
    importProjectId: 'IMP-0001',
    shipment_un: 'UN-20240710-001',
    sumber_tugas: 'ESCALATION',
    assigned_by_id: 1,
    notes: 'Menunggu data HS Code dari tim compliance.',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(4), fromStatus: null },
      { status: 'Akan Dikerjakan', label: 'Backlog → Akan Dikerjakan', timestamp: daysAgo(2), fromStatus: 'Backlog' },
    ],
  },
  {
    id: 'TSK-0088',
    title: 'Follow up pembayaran THC ke Samudera',
    department: 'Account Officer',
    priority: 'Tinggi',
    status: 'Backlog',
    assigneeId: 3,
    dueDate: '16 Jul',
    importProjectId: null,
    shipment_un: null,
    sumber_tugas: 'MANUAL',
    assigned_by_id: 3,
    notes: '',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(1), fromStatus: null },
    ],
  },
  {
    id: 'TSK-0089',
    title: 'Buat quotation untuk klien PT. Sinar Mas',
    department: "Administrasi Export (AE)",
    priority: 'Sedang',
    status: 'Dalam Proses',
    assigneeId: 5,
    dueDate: '17 Jul',
    importProjectId: null,
    shipment_un: null,
    sumber_tugas: 'SYSTEM',
    assigned_by_id: 5,
    notes: 'Perlu persetujuan pricing dari manajer sebelum dikirim ke klien.',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(5), fromStatus: null },
      { status: 'Akan Dikerjakan', label: 'Backlog → Akan Dikerjakan', timestamp: daysAgo(3), fromStatus: 'Backlog' },
      { status: 'Dalam Proses', label: 'Akan Dikerjakan → Dalam Proses', timestamp: daysAgo(1), fromStatus: 'Akan Dikerjakan' },
    ],
  },
  {
    id: 'TSK-0090',
    title: 'Arsip dokumen Surat Jalan BL-20240710',
    department: 'Import',
    priority: 'Rendah',
    status: 'Selesai',
    assigneeId: 4,
    dueDate: '10 Jul',
    importProjectId: null,
    shipment_un: 'BL-20240710',
    sumber_tugas: 'MANUAL',
    assigned_by_id: 4,
    notes: 'Selesai, semua dokumen sudah diarsipkan ke sistem.',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(9), fromStatus: null },
      { status: 'Akan Dikerjakan', label: 'Backlog → Akan Dikerjakan', timestamp: daysAgo(7), fromStatus: 'Backlog' },
      { status: 'Dalam Proses', label: 'Akan Dikerjakan → Dalam Proses', timestamp: daysAgo(5), fromStatus: 'Akan Dikerjakan' },
      { status: 'Review', label: 'Dalam Proses → Review', timestamp: daysAgo(3), fromStatus: 'Dalam Proses' },
      { status: 'Selesai', label: 'Review → Selesai', timestamp: daysAgo(1), fromStatus: 'Review' },
    ],
  },
  {
    id: 'TSK-0091',
    title: 'Verifikasi Certificate of Origin EX-4820',
    department: 'Export',
    priority: 'Sedang',
    status: 'Backlog',
    assigneeId: 2,
    dueDate: '18 Jul',
    importProjectId: null,
    shipment_un: null,
    sumber_tugas: 'SYSTEM',
    assigned_by_id: 2,
    notes: '',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(2), fromStatus: null },
    ],
  },
  {
    id: 'TSK-0092',
    title: 'Negosiasi tarif asuransi kargo Jasindo',
    department: "Administrasi Export (AE)",
    priority: 'Tinggi',
    status: 'Akan Dikerjakan',
    assigneeId: 5,
    dueDate: '15 Jul',
    importProjectId: null,
    shipment_un: null,
    sumber_tugas: 'MANUAL',
    assigned_by_id: 5,
    notes: '',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(3), fromStatus: null },
      { status: 'Akan Dikerjakan', label: 'Backlog → Akan Dikerjakan', timestamp: daysAgo(1), fromStatus: 'Backlog' },
    ],
  },
  {
    id: 'TSK-0093',
    title: 'Rekonsiliasi invoice Custom Duty bulan Juni',
    department: 'Account Officer',
    priority: 'Sedang',
    status: 'Dalam Proses',
    assigneeId: 11,
    dueDate: '20 Jul',
    importProjectId: null,
    shipment_un: null,
    sumber_tugas: 'SYSTEM',
    assigned_by_id: 11,
    notes: 'Masih ada 3 invoice yang belum terverifikasi dari Bea Cukai.',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(6), fromStatus: null },
      { status: 'Akan Dikerjakan', label: 'Backlog → Akan Dikerjakan', timestamp: daysAgo(4), fromStatus: 'Backlog' },
      { status: 'Dalam Proses', label: 'Akan Dikerjakan → Dalam Proses', timestamp: daysAgo(2), fromStatus: 'Akan Dikerjakan' },
    ],
  },
  {
    id: 'TSK-0094',
    title: 'Persiapan dokumen DO untuk SPIL',
    department: 'Import',
    priority: 'Tinggi',
    status: 'Review',
    assigneeId: 4,
    dueDate: '12 Jul',
    importProjectId: 'IMP-0002',
    shipment_un: 'UN-20240711-002',
    sumber_tugas: 'ESCALATION',
    assigned_by_id: 1,
    notes: 'DO sudah disiapkan, menunggu review dari SPV.',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(8), fromStatus: null },
      { status: 'Akan Dikerjakan', label: 'Backlog → Akan Dikerjakan', timestamp: daysAgo(6), fromStatus: 'Backlog' },
      { status: 'Dalam Proses', label: 'Akan Dikerjakan → Dalam Proses', timestamp: daysAgo(4), fromStatus: 'Akan Dikerjakan' },
      { status: 'Review', label: 'Dalam Proses → Review', timestamp: daysAgo(2), fromStatus: 'Dalam Proses' },
    ],
  },
  {
    id: 'TSK-0095',
    title: 'Update data free time demurrage ke sistem',
    department: 'Import',
    priority: 'Rendah',
    status: 'Backlog',
    assigneeId: 2,
    dueDate: '21 Jul',
    importProjectId: 'IMP-0003',
    shipment_un: 'UN-20240712-003',
    sumber_tugas: 'SYSTEM',
    assigned_by_id: 2,
    notes: '',
    statusHistory: [
      { status: 'Backlog', label: 'Dibuat', timestamp: daysAgo(0), fromStatus: null },
    ],
  },
];

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

  /**
   * fetchTasks: Load dari dummy data lokal (offline-first, tanpa backend).
   * Dipanggil saat halaman Peta Tugas mount — tidak melakukan HTTP request.
   */
  fetchTasks: () => {
    set({ isLoading: true });
    // Simulasi async sebentar supaya pola panggil tidak perlu diubah
    setTimeout(() => set({ isLoading: false }), 0);
  },

  /**
   * addTask: Tambah tugas baru ke state lokal.
   * Auto-generate ID (TSK-XXXX lanjutan), buat statusHistory awal dengan entry "Dibuat".
   */
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

  /**
   * moveTask: Pindahkan task ke kolom sebelumnya/berikutnya.
   * Append entry baru ke statusHistory setiap kali berhasil berpindah.
   */
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

  /**
   * deleteTask: Hapus task secara permanen dari state lokal.
   * Dipanggil setelah user konfirmasi di DeleteConfirmDialog.
   */
  deleteTask: (taskId) => {
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId),
    }));
  },

  /**
   * updateTaskNotes: Update field catatan progres saja, tanpa menyentuh field lain.
   * Dipanggil onBlur dari area note-progress di TaskCard.
   */
  updateTaskNotes: (taskId, notes) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, notes } : t
      ),
    }));
  },

  /**
   * archiveTasks: Hapus tasks tertentu dari state (dipakai modul lain, dipertahankan).
   */
  archiveTasks: (taskIdsToRemove) =>
    set(state => ({
      tasks: state.tasks.filter(t => !taskIdsToRemove.includes(t.id)),
    })),
}));

export default useTaskStore;
