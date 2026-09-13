import React, { useState, useEffect } from 'react';
import useTaskStore from '../store/useTaskStore';
import useAuthStore from '../store/useAuthStore';
import useImportProjectStore from '../store/useImportProjectStore';
import Button from './Button';
import { Package, X } from 'lucide-react';
import api from '../lib/api';

const TaskFormModal = ({ isOpen, onClose, defaultDepartment = 'Import', defaultAssignee = '', isPersonal = false }) => {
  const { user } = useAuthStore();
  const { addTask } = useTaskStore();
  const { importProjects } = useImportProjectStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Sedang');
  const [newTaskDepartment, setNewTaskDepartment] = useState(defaultDepartment);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskShipmentUn, setNewTaskShipmentUn] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  
  const [formError, setFormError] = useState('');
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loadingAssignable, setLoadingAssignable] = useState(false);

  // Role checks
  const isStaff = user?.level_otoritas === 'Staff Dept';
  const isSpv = user?.level_otoritas === 'Supervisor';
  const isManager = user?.level_otoritas === 'Manager';

  useEffect(() => {
    if (isOpen && user) {
      setNewTaskDepartment(isManager ? defaultDepartment : user.departemen);
      setNewTaskAssignee(isStaff ? user.id : (isPersonal ? user.id : defaultAssignee));
      setNewTaskTitle('');
      setNewTaskPriority('Sedang');
      setNewTaskDueDate('');
      setNewTaskShipmentUn('');
      setNewTaskNotes('');
      setFormError('');

      // Fetch assignable users if Manager or Supervisor
      if (isManager || isSpv) {
        setLoadingAssignable(true);
        const params = new URLSearchParams({
          level_otoritas: user.level_otoritas,
          departemen: user.departemen || ''
        });
        api(`/users/assignable?${params.toString()}`)
          .then(data => {
            setAssignableUsers(data);
            setLoadingAssignable(false);
          })
          .catch(err => {
            console.error('Error fetching assignable users:', err);
            setLoadingAssignable(false);
          });
      }
    }
  }, [isOpen, user, defaultDepartment, defaultAssignee, isPersonal, isStaff, isManager, isSpv]);

  if (!isOpen || !user) return null;

  const finalAssigneeTemp = isStaff ? user.id : (isPersonal ? user.id : newTaskAssignee);
  const sumberTugas = (finalAssigneeTemp === user.id) ? 'Manual' : 'Escalation';
  const assignedById = user.id;

  const activeImportProjects = importProjects.filter(p => p.status !== 'Completed');
  const importProjectOptions = activeImportProjects.map(p => ({
    value: p.id,
    label: `${p.id} — ${p.supplier} (${p.importType})`,
  }));

  const handleSaveTask = () => {
    if (!newTaskTitle.trim()) {
      setFormError('Judul Tugas wajib diisi');
      return;
    }
    if (!newTaskPriority) {
      setFormError('Pilih prioritas');
      return;
    }
    if (!newTaskDueDate) {
      setFormError('Isi tanggal tenggat');
      return;
    }

    const finalAssignee = isStaff ? user.id : (isPersonal ? user.id : newTaskAssignee);
    
    if (!finalAssignee && (isManager || isSpv)) {
      setFormError('Pilih staff/SPV yang akan ditugaskan');
      return;
    }

    let finalDepartment = user.departemen;
    if (isManager || isSpv) {
      finalDepartment = newTaskDepartment;
      // You could also extract from the selected assignable user if they belong to a specific department
      const selectedUser = assignableUsers.find(u => u.id === Number(finalAssignee));
      if (selectedUser && selectedUser.departemen) finalDepartment = selectedUser.departemen;
    }

    addTask({
      title: newTaskTitle.trim(),
      department: finalDepartment,
      priority: newTaskPriority,
      assigneeId: Number(finalAssignee),
      dueDate: newTaskDueDate,
      importProjectId: newTaskShipmentUn || null,
      sumber_tugas: sumberTugas,
      assigned_by_id: assignedById,
      notes: newTaskNotes.trim() || '',
      deskripsi: newTaskNotes.trim() || '',
      catatan_progress: newTaskNotes.trim() || ''
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: 'var(--color-canvas)',
        padding: '32px',
        borderRadius: 'var(--rounded-lg)',
        width: '440px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-product)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'var(--font-family-body)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.374px', margin: 0 }}>
            {isStaff ? 'Tambah Tugas Baru' : 'Assign Tugas Eskalasi'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-ink-muted-48)', padding: '4px', borderRadius: '4px',
            display: 'flex'
          }}>
            <X size={20} />
          </button>
        </div>

        {formError && (
          <div style={{
            backgroundColor: 'var(--color-status-danger-bg)',
            color: 'var(--color-status-danger)',
            padding: '8px 12px',
            borderRadius: 'var(--rounded-sm)',
            fontSize: '13px',
            border: '1px solid var(--color-status-danger)',
          }}>
            {formError}
          </div>
        )}

        {/* Judul Tugas */}
        <div>
          <label style={labelStyle}>Judul Tugas <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
          <input
            type="text"
            value={newTaskTitle}
            onChange={e => { setNewTaskTitle(e.target.value); setFormError(''); }}
            placeholder="Masukkan judul tugas..."
            autoFocus
            style={modalInputStyle}
          />
        </div>

        {/* Tautkan ke Nomor IMP (Wajib) */}
        <div style={{ backgroundColor: 'var(--color-canvas-parchment)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
            <Package size={14} />
            Pilih IMP Number (Opsional)
          </label>
          <select
            value={newTaskShipmentUn}
            onChange={e => setNewTaskShipmentUn(e.target.value)}
            style={modalInputStyle}
          >
            <option value="">— Tidak ditautkan (General Task) —</option>
            {importProjectOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* CONDITIONAL: Departemen (hanya untuk Manager) */}
        {isManager && (
          <div>
            <label style={labelStyle}>Departemen</label>
            <select
              value={newTaskDepartment}
              onChange={e => setNewTaskDepartment(e.target.value)}
              style={modalInputStyle}
            >
              <option value="Import">Import</option>
              <option value="Export">Export</option>
              <option value="Account Officer">Account Officer</option>
              <option value="Administrasi Export">Administrasi Export</option>
            </select>
          </div>
        )}

        {/* Assignee */}
        <div>
          <label style={labelStyle}>Assignee <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
          {isStaff || (isSpv && isPersonal) ? (
            <input
              type="text"
              value={user.nama || user.name}
              disabled
              style={{ ...modalInputStyle, backgroundColor: 'var(--color-canvas-parchment)', cursor: 'not-allowed' }}
            />
          ) : (
            <div>
              {loadingAssignable ? (
                <p style={{fontSize: '13px'}}>Memuat daftar...</p>
              ) : assignableUsers.length === 0 ? (
                <p style={{color: 'var(--color-status-danger)', fontSize: '13px', margin: 0}}>
                  {(isManager || isSpv) ? (assignableUsers.length === 0 ? 'Tidak ada bawahan aktif' : 'Pilih Assignee') : 'Tidak ada staff aktif di departemen ini'}
                </p>
              ) : (
                <select
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  style={modalInputStyle}
                >
                  <option value="" disabled>-- Pilih PIC ({isSpv ? 'Staff Dept' : 'Supervisor'}) --</option>
                  {assignableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nama} {u.departemen ? `(${u.departemen})` : ''} {u.tipe_karyawan === 'Karyawan Magang' ? '· Magang' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* INFORMASI: Untuk Staff */}
        {isStaff && (
          <p style={{fontSize: '0.85rem', color: 'var(--color-ink-muted-48)', margin: '-8px 0 0 0'}}>
            Tugas ini akan ditambahkan ke workdesk Anda sendiri.
          </p>
        )}

        {/* Prioritas & Tenggat */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Prioritas</label>
            <select
              value={newTaskPriority}
              onChange={e => setNewTaskPriority(e.target.value)}
              style={modalInputStyle}
            >
              <option value="Rendah">Rendah</option>
              <option value="Sedang">Sedang</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Kritis">Kritis</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Tenggat Waktu</label>
            <input
              type="text"
              value={newTaskDueDate}
              onChange={e => setNewTaskDueDate(e.target.value)}
              placeholder="cth: 21 Jul"
              style={modalInputStyle}
            />
          </div>
        </div>
        
        {/* Deskripsi */}
        <div>
          <label style={labelStyle}>Deskripsi / Instruksi (Opsional)</label>
          <textarea
            value={newTaskNotes}
            onChange={e => setNewTaskNotes(e.target.value)}
            placeholder="Berikan instruksi tambahan..."
            rows={3}
            style={{ ...modalInputStyle, resize: 'none' }}
          />
        </div>

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button 
            variant="primary" 
            onClick={handleSaveTask}
            disabled={!isStaff && !isPersonal && (!(isManager || isSpv) || assignableUsers.length === 0)}
          >
            {isStaff ? 'Simpan Tugas' : 'Assign Tugas'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--color-ink)',
  marginBottom: '6px',
};

const modalInputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--rounded-sm)',
  border: '1px solid var(--color-hairline)',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'var(--font-family-body)',
  color: 'var(--color-ink)',
  backgroundColor: 'var(--color-canvas)',
  boxSizing: 'border-box',
};

export default TaskFormModal;
