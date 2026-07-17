/**
 * authHelpers.js
 * Logika RBAC (Role-Based Access Control) ketat.
 * Model:
 *   - departemen: 'Import' | 'Export' | 'Administrative Export' | 'Account Officer' | null
 *   - level_otoritas: 'Manager' | 'SPV Dept' | 'Staff Dept'
 */

// 1. IDENTIFIKASI ROLE UTAMA
export const isManager = (user) => user?.level_otoritas === 'Manager';

export const isSupervisor = (user) => user?.level_otoritas === 'Supervisor';

export const isOperational = (user) =>
  user?.level_otoritas === 'Staff Dept';


// 2. AKSES MENU SUPERVISOR (Control Tower & Pengawasan)
export const canAccessControlTower = (user) => isSupervisor(user);


// 3. AKSES MENU OPERASIONAL
// 3a. Navigasi Utama (Dapat diakses oleh semua 4 departemen)
//     Termasuk: Peta Tugas, Manajemen Dokumen
export const canAccessOperationalWorkspace = (user) => isOperational(user) || isSupervisor(user);

// 3b. Finansial & Relasi (Hanya Import & Export)
//     Termasuk: Monitoring Pembayaran, Manajemen Vendor
export const canAccessFinanceAndVendor = (user) =>
  (isOperational(user) && (user?.departemen === 'Import' || user?.departemen === 'Export')) || isSupervisor(user);

// 3c. Import Module (Hanya Import)
//     Termasuk: Assign Import Project, Import Operational, PlanGDG, Master Data Import
export const canAccessImportModule = (user) =>
  (isOperational(user) && user?.departemen === 'Import') || isSupervisor(user);


// 4. AKSES KHUSUS (Tumpang tindih / Bersama)
// Halaman Analysis & Status Shipment
export const canAccessAnalysis = (user) => 
  isSupervisor(user) || (isOperational(user) && user?.departemen === 'Import');

export const canAccessStatusShipment = (user) => isSupervisor(user) || isManager(user);


// 5. READ-ONLY ENFORCEMENT & AKSI DATA
// Supervisor (dan Manager) dilarang melakukan aksi tulis/ubah/hapus apa pun di ranah operasional.
export const canWriteData = (user) => isOperational(user);

export const canWritePayment = (user) => canAccessFinanceAndVendor(user) && canWriteData(user);
export const canWriteVendor = (user) => canAccessFinanceAndVendor(user) && canWriteData(user);

export const canViewAcrossDept = (user) => isSupervisor(user) || isManager(user);
export const canViewAllInDept = (user) => isSupervisor(user) || isManager(user);
export const canChangeDepartment = (user) => false;
export const canDeleteAnyDoc = (user) => true; // Mengizinkan semua role menghapus dokumen untuk sementara, atau bisa diubah sesuai kebutuhan
export const canReassignTask = (user) => false; 


// 6. UI HELPERS
export const getUserDisplayLabel = (user) => {
  if (!user) return '—';
  if (isSupervisor(user) || isManager(user)) return user.level_otoritas;
  return `${user.level_otoritas} · ${user.departemen}`;
};

export const getSupervisorPageTitle = (baseTitle, user) => {
  if (isSupervisor(user) && user?.departemen) {
    return `${baseTitle} - Departemen ${user.departemen}`;
  }
  return baseTitle;
};
