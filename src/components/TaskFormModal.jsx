import React, { useState, useEffect } from 'react';
import useTaskStore from '../store/useTaskStore';
import useAuthStore from '../store/useAuthStore';
import useImportProjectStore from '../store/useImportProjectStore';
import Button from './Button';
import { Package, X } from 'lucide-react';

const TaskFormModal = ({ isOpen, onClose, defaultDepartment = 'Import', defaultAssignee = '', isPersonal = false }) => {
  const { user, getStaffByDept, getAllUsers } = useAuthStore();
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

  useEffect(() => {
    if (isOpen && user) {
      if (user.level_otoritas === 'Staff Dept') {
        setNewTaskDepartment(user.departemen);
        setNewTaskAssignee(user.id);
      } else if (user.level_otoritas === 'Supervisor') {
        setNewTaskDepartment(user.departemen);
        setNewTaskAssignee(isPersonal ? user.id : (defaultAssignee || user.id));
      } else if (user.level_otoritas === 'Manager') {
        setNewTaskDepartment(defaultDepartment);
        setNewTaskAssignee(defaultAssignee);
      }
      setNewTaskTitle('');
      setNewTaskPriority('Sedang');
      setNewTaskDueDate('');
      setNewTaskShipmentUn('');
      setNewTaskNotes('');
      setFormError('');
    }
  }, [isOpen, user, defaultDepartment]);

  if (!isOpen || !user) return null;

  // Determine role-based logic
  const isStaff = user.level_otoritas === 'Staff Dept';
  const isSpv = user.level_otoritas === 'Supervisor';
  const isManager = user.level_otoritas === 'Manager';

  const sumberTugas = isStaff ? 'MANUAL' : 'ESCALATION';
  const assignedById = user.id;

  // Populate Assignee Options
  let assigneeOptions = [];
  if (isSpv) {
    if (isPersonal) {
      assigneeOptions = [user];
    } else {
      assigneeOptions = [user, ...getStaffByDept(user.departemen).filter(s => s.status_aktif !== false)];
    }
  } else if (isManager) {
    assigneeOptions = getAllUsers().filter(s => s.level_otoritas === 'Supervisor' && s.status_aktif !== false);
  }

  // Populate Import Projects
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
    if (!newTaskAssignee && !isStaff) {
      setFormError('Assignee wajib dipilih');
      return;
    }


    let finalDepartment = user.departemen;
    if (isManager) {
      const selectedSpv = assigneeOptions.find(s => s.id === Number(newTaskAssignee));
      finalDepartment = selectedSpv ? selectedSpv.departemen : 'Import';
    }

    addTask({
      title: newTaskTitle,
      department: finalDepartment,
      priority: newTaskPriority,
      assigneeId: Number(newTaskAssignee) || user.id,
      dueDate: newTaskDueDate || null,
      importProjectId: null,
      shipment_un: newTaskShipmentUn || null,
      sumber_tugas: sumberTugas,
      assigned_by_id: assignedById,
      notes: newTaskNotes
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)', // slate-900 with opacity
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

        {/* ── Tautkan ke Nomor IMP (Wajib) ── */}
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

        {/* Assignee */}
        <div>
          <label style={labelStyle}>Assignee <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
          {isStaff || (isSpv && isPersonal) ? (
            <input
              type="text"
              value={isSpv ? user.name : user.name} // Since isPersonal locks to user
              disabled
              style={{ ...modalInputStyle, backgroundColor: 'var(--color-canvas-parchment)', cursor: 'not-allowed' }}
            />
          ) : (
            <select
              value={newTaskAssignee}
              onChange={e => setNewTaskAssignee(e.target.value)}
              style={modalInputStyle}
            >
              <option value="" disabled>-- Pilih PIC ({isSpv ? 'Staff Dept' : 'Supervisor'}) --</option>
              {assigneeOptions.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
          )}
        </div>

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
          <Button variant="primary" onClick={handleSaveTask}>{isStaff ? 'Simpan Tugas' : 'Assign Tugas'}</Button>
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
