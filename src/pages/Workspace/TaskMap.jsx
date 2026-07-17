import React, { useState, useEffect } from 'react';
import useTaskStore from '../../store/useTaskStore';
import useAuthStore from '../../store/useAuthStore';
import useImportProjectStore from '../../store/useImportProjectStore';
import {
  canViewAcrossDept,
  canViewAllInDept,
  canChangeDepartment,
  canReassignTask
} from '../../utils/authHelpers';
import TaskCard from '../../components/TaskCard';
import TaskDetailModal from '../../components/TaskDetailModal';
import TaskFormModal from '../../components/TaskFormModal';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';
import Button from '../../components/Button';
import { Filter, Package } from 'lucide-react';

const COLUMNS = ['Backlog', 'Akan Dikerjakan', 'Dalam Proses', 'Review', 'Selesai'];

// Warna aksen header kolom
const columnAccentColor = (col) => {
  const map = {
    'Backlog': 'var(--color-ink-muted-48)',
    'Akan Dikerjakan': 'var(--color-badge-medium-prd)',
    'Dalam Proses': 'var(--color-status-warning)',
    'Review': 'var(--color-dept-ae)',
    'Selesai': 'var(--color-status-success)',
  };
  return map[col] || 'var(--color-ink-muted-48)';
};

const TaskMap = () => {
  const {
    tasks,
    filterDepartment,
    setFilterDepartment,
    filterPriority,
    setFilterPriority,
    addTask,
    deleteTask,
  } = useTaskStore();

  const [filterType, setFilterType] = useState('All');

  const { user } = useAuthStore();
  const { importProjects } = useImportProjectStore();

  // ── Modal & Dialog State ──────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);       // TaskDetailModal
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); // DeleteConfirmDialog


  // ── Filter Logic ──────────────────────────────────────────────────────────
  const filteredTasks = tasks.filter(t => {
    const matchAssignee = t.assigneeId === user?.id;
    const matchPrio = filterPriority === 'All' || t.priority === filterPriority;
    const matchType = filterType === 'All' || t.sumber_tugas === filterType;
    return matchAssignee && matchPrio && matchType;
  });

  // Hitung jumlah tugas eskalasi aktif khusus untuk user yang login
  const activeEscalationCount = React.useMemo(() => {
    return tasks.filter(t => 
      t.assigneeId === user?.id && 
      t.sumber_tugas === 'ESCALATION' && 
      t.status !== 'Review' && 
      t.status !== 'Selesai'
    ).length;
  }, [tasks, user]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCardClick = (task) => {
    setSelectedTask(task);
  };

  const handleDeleteClick = (taskId) => {
    setConfirmingDeleteId(taskId);
  };

  const handleDeleteConfirm = () => {
    if (confirmingDeleteId) {
      deleteTask(confirmingDeleteId);
      setConfirmingDeleteId(null);
      // Tutup juga TaskDetailModal jika task yang di-delete sedang terbuka
      if (selectedTask?.id === confirmingDeleteId) setSelectedTask(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmingDeleteId(null);
  };


  // Task yang sedang dikonfirmasi delete (untuk menampilkan judulnya di dialog)
  const taskToDelete = tasks.find(t => t.id === confirmingDeleteId);

  // Dropdown Import Project: format "IMP-0001 — [Supplier] ([Import Type])"
  const activeImportProjects = importProjects.filter(p => p.status !== 'Completed');
  const importProjectOptions = activeImportProjects.map(p => ({
    value: p.id,
    label: `${p.id} — ${p.supplier} (${p.importType})`,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* ── Toolbar Header ── */}
      <div style={{
        padding: '20px 32px',
        borderBottom: '1px solid var(--color-hairline)',
        backgroundColor: 'var(--color-canvas)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px', marginBottom: '2px' }}>
            Peta Tugas
          </h1>
          <p style={{ color: 'var(--color-ink-muted-48)', fontSize: '13px' }}>
            Meja Kerja Pribadi
            {' · '}
            {filterPriority === 'All' ? 'Semua Prioritas' : `Prioritas: ${filterPriority}`}
            {' · '}
            {filteredTasks.length} tugas
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
            
            {/* Segmented Control: Filter Tipe Tugas (All / System / Escalation / Manual) */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--color-canvas-parchment)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--rounded-sm)',
              padding: '3px',
              gap: '2px',
              marginRight: '4px',
            }}>
              {[
                { value: 'All', label: 'Semua' },
                { value: 'SYSTEM', label: 'Sistem' },
                { value: 'ESCALATION', label: 'Eskalasi' },
                { value: 'MANUAL', label: 'Manual' },
              ].map(({ value, label }) => {
                const isActive = filterType === value;
                return (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: isActive ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      backgroundColor: isActive ? 'var(--color-canvas)' : 'transparent',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {value === 'ESCALATION' ? (
                      <div className="relative flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{label}</span>
                        {activeEscalationCount > 0 && (
                          <span className="bg-rose-500 text-white font-bold rounded-full text-center flex items-center justify-center animate-pulse-subtle" 
                                style={{ 
                                  backgroundColor: '#f43f5e', color: '#fff', fontWeight: '700', borderRadius: '9999px',
                                  fontSize: '10px', 
                                  minWidth: '18px', 
                                  height: '18px', 
                                  padding: '0 5px',
                                  lineHeight: '1',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }}>
                            {activeEscalationCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      label
                    )}
                  </button>
                );
              })}
            </div>

            <Filter size={14} />


            <select
              id="filter-priority"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--rounded-sm)',
                border: '1px solid var(--color-hairline)',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: 'var(--color-canvas)',
                color: 'var(--color-ink)',
              }}
            >
              <option value="All">Semua Prioritas</option>
              <option value="Rendah">Rendah</option>
              <option value="Sedang">Sedang</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Kritis">Kritis</option>
            </select>
          </div>

          {user?.level_otoritas !== 'Manager' && (
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              + Tambah Tugas
            </Button>
          )}
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflowX: 'auto',
        padding: '24px 32px',
        gap: '20px',
        alignItems: 'flex-start',
        backgroundColor: 'var(--color-canvas-parchment)',
      }}>
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col);
          const accentColor = columnAccentColor(col);

          return (
            <div key={col} style={{
              width: '288px',
              minWidth: '288px',
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--rounded-lg)',
              border: '1px solid var(--color-hairline)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 180px)',
            }}>
              {/* Column Header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: 'var(--rounded-lg) var(--rounded-lg) 0 0',
                borderTop: `3px solid ${accentColor}`,
              }}>
                <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-ink)' }}>
                  {col}
                </span>
                <span style={{
                  backgroundColor: colTasks.length > 0
                    ? accentColor
                    : 'var(--color-canvas-parchment)',
                  color: colTasks.length > 0 ? '#fff' : 'var(--color-ink-muted-48)',
                  padding: '2px 8px',
                  borderRadius: 'var(--rounded-pill)',
                  fontSize: '11px',
                  fontWeight: '700',
                  minWidth: '22px',
                  textAlign: 'center',
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards */}
              <div style={{
                padding: '12px',
                overflowY: 'auto',
                flex: 1,
              }}>
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onCardClick={handleCardClick}
                    onDeleteClick={handleDeleteClick}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--color-ink-muted-48)',
                    fontSize: '13px',
                    padding: '32px 16px',
                    lineHeight: 1.6,
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.4 }}>—</div>
                    Tidak ada tugas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal Tambah Tugas ── */}
      <TaskFormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        defaultDepartment="Import"
        isPersonal={true}
      />

      {/* ── Task Detail Modal ── */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* ── Delete Confirm Dialog ── */}
      {confirmingDeleteId && taskToDelete && (
        <DeleteConfirmDialog
          taskTitle={taskToDelete.title}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

// ─── Style Helpers ─────────────────────────────────────────────────────────────
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

export default TaskMap;
