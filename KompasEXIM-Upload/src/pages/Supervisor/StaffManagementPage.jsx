import React, { useState } from 'react';
import { Plus, Edit2, ShieldAlert, CheckCircle2, Building2, UserX, Info, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const StaffManagementPage = () => {
  const { user, getAllUsers, addStaff, updateStaff, toggleStaffStatus } = useAuthStore();
  
  const isManager = user?.level_otoritas === 'Manager';
  const [selectedDept, setSelectedDept] = useState(isManager ? 'Import' : user?.departemen);
  
  const allUsers = getAllUsers();
  const staffList = allUsers.filter(u => u.departemen === selectedDept && u.level_otoritas === 'Staff Dept');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    tipe_karyawan: 'Karyawan Tetap',
    departemen: selectedDept
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData({ name: '', employee_id: '', tipe_karyawan: 'Karyawan Tetap', departemen: selectedDept });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setIsEditMode(true);
    setEditId(staff.id);
    setFormData({ 
      name: staff.name, 
      employee_id: staff.employee_id, 
      tipe_karyawan: staff.tipe_karyawan,
      departemen: staff.departemen
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isEditMode) {
      updateStaff(editId, { name: formData.name, tipe_karyawan: formData.tipe_karyawan });
    } else {
      addStaff({ ...formData, departemen: selectedDept });
    }
    setIsModalOpen(false);
  };

  const confirmDeactivate = (staff) => {
    setConfirmModal({ isOpen: true, id: staff.id, name: staff.name });
  };

  const handleDeactivate = () => {
    toggleStaffStatus(confirmModal.id);
    setConfirmModal({ isOpen: false, id: null, name: '' });
  };

  const handleReactivate = (id) => {
    toggleStaffStatus(id);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'var(--font-family-body)', backgroundColor: 'var(--color-slate-50)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
            Manajemen Staff {selectedDept ? `- Departemen ${selectedDept}` : ''}
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-ink-muted-80)', fontSize: '14px' }}>
            Kelola daftar roster staff, hak akses, dan status keanggotaan.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          {isManager && (
            <select 
              value={selectedDept} 
              onChange={e => setSelectedDept(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            >
              <option value="Import">Import</option>
              <option value="Export">Export</option>
              <option value="Administrasi Export (AE)">Administrasi Export (AE)</option>
              <option value="Account Officer">Account Officer</option>
            </select>
          )}
          <button 
            onClick={handleOpenAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', backgroundColor: 'var(--color-primary)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '500', cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Tambah Staff Baru
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-slate-200)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-slate-200)' }}>
            <tr>
              <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--color-slate-600)' }}>Nama</th>
              <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--color-slate-600)' }}>Employee ID</th>
              <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--color-slate-600)' }}>Tipe Karyawan</th>
              <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--color-slate-600)' }}>Status</th>
              <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--color-slate-600)', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-slate-500)' }}>
                  Tidak ada data staff di departemen ini.
                </td>
              </tr>
            ) : staffList.map((staff, idx) => (
              <tr key={staff.id} style={{ borderBottom: idx === staffList.length - 1 ? 'none' : '1px solid var(--color-slate-200)', opacity: staff.status_aktif ? 1 : 0.6 }}>
                <td style={{ padding: '16px 20px', fontWeight: '500', color: 'var(--color-ink)' }}>{staff.name}</td>
                <td style={{ padding: '16px 20px', color: 'var(--color-slate-600)' }}>{staff.employee_id}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '500',
                    backgroundColor: staff.tipe_karyawan === 'Karyawan Tetap' ? '#f0fdf4' : '#fefce8',
                    color: staff.tipe_karyawan === 'Karyawan Tetap' ? '#166534' : '#854d0e',
                    border: staff.tipe_karyawan === 'Karyawan Tetap' ? '1px solid #bbf7d0' : '1px solid #fef08a'
                  }}>
                    {staff.tipe_karyawan}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {staff.status_aktif ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '500' }}>
                      <CheckCircle2 size={14} /> Aktif
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: '500' }}>
                      <UserX size={14} /> Nonaktif
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button onClick={() => handleOpenEdit(staff)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '500', marginRight: '16px' }}>Edit</button>
                  {staff.status_aktif ? (
                    <button onClick={() => confirmDeactivate(staff)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '500' }}>Nonaktifkan</button>
                  ) : (
                    <button onClick={() => handleReactivate(staff.id)} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontWeight: '500' }}>Aktifkan Kembali</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{isEditMode ? 'Edit Profil Staff' : 'Tambah Staff Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-slate-500)', cursor: 'pointer' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--color-slate-700)' }}>Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-slate-300)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--color-slate-700)' }}>Employee ID</label>
                <input required type="text" value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} disabled={isEditMode} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-slate-300)', backgroundColor: isEditMode ? 'var(--color-slate-100)' : '#fff', boxSizing: 'border-box' }} />
                {isEditMode && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-slate-500)' }}>Employee ID tidak dapat diubah (Read-only).</p>}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--color-slate-700)' }}>Tipe Karyawan</label>
                <select value={formData.tipe_karyawan} onChange={e => setFormData({...formData, tipe_karyawan: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-slate-300)', boxSizing: 'border-box' }}>
                  <option value="Karyawan Tetap">Karyawan Tetap</option>
                  <option value="Karyawan Magang">Karyawan Magang</option>
                </select>
              </div>
              
              {!isEditMode && (
                <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: 'var(--color-slate-50)', borderRadius: '8px', border: '1px solid var(--color-slate-200)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Info size={18} color="var(--color-slate-500)" style={{ marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-slate-600)', lineHeight: '1.5' }}>
                    Password awal (default) untuk login adalah <b>123456</b>. Staff akan diminta mengubah password saat pertama kali login.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: '#fff', border: '1px solid var(--color-slate-300)', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{isEditMode ? 'Simpan Perubahan' : 'Tambah Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Deactivate Confirm */}
      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>Nonaktifkan {confirmModal.name}?</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-slate-600)', lineHeight: '1.5' }}>
                Staff ini tidak akan bisa login lagi dan tidak akan muncul di pilihan Assign Tugas baru. <b>Riwayat tugas dan laporan yang sudah ada tetap tersimpan.</b>
              </p>
            </div>
            <div style={{ padding: '16px 24px', backgroundColor: 'var(--color-slate-50)', borderTop: '1px solid var(--color-slate-200)', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button onClick={() => setConfirmModal({isOpen: false, id: null, name: ''})} style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid var(--color-slate-300)', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleDeactivate} style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Ya, Nonaktifkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
