import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Plus, 
  Ship, 
  User, 
  Layers,
  ArrowRight,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import useDocumentStore from '../../store/useDocumentStore';
import { UploadCloud } from 'lucide-react';

// 5 Standard Kanban Columns identical to Peta Tugas Import
const COLUMNS = ['Backlog', 'Akan Dikerjakan', 'Dalam Proses', 'Review', 'Selesai'];

// Accent color mapping matching TaskMap.jsx
const columnAccentColor = (col) => {
  const map = {
    'Backlog': 'var(--color-ink-muted-48, #7a7a7a)',
    'Akan Dikerjakan': 'var(--color-badge-medium-prd, #007aff)',
    'Dalam Proses': 'var(--color-status-warning, #ff9500)',
    'Review': 'var(--color-dept-ae, #af52de)',
    'Selesai': 'var(--color-status-success, #34c759)',
  };
  return map[col] || 'var(--color-ink-muted-48, #7a7a7a)';
};

// Map backend status to Kanban Column
const statusToColumn = (status) => {
  if (!status) return 'Backlog';
  const s = status.toUpperCase();
  if (s === 'PENDING' || s === 'BACKLOG') return 'Backlog';
  if (s === 'WAITING' || s === 'AKAN DIKERJAKAN') return 'Akan Dikerjakan';
  if (s === 'IN_PROGRESS' || s === 'DALAM PROSES') return 'Dalam Proses';
  if (s === 'BLOCKED' || s === 'REVIEW') return 'Review';
  if (s === 'COMPLETED' || s === 'SELESAI') return 'Selesai';
  return 'Backlog';
};

// Map Kanban Column to backend status (enforcing database CHECK constraint)
const columnToStatus = (col) => {
  if (col === 'Backlog') return 'PENDING';
  if (col === 'Akan Dikerjakan') return 'WAITING';
  if (col === 'Dalam Proses') return 'IN_PROGRESS';
  if (col === 'Review') return 'BLOCKED';
  if (col === 'Selesai') return 'COMPLETED';
  return 'PENDING';
};

export default function AoTaskMap() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);

  // Filters & Modes
  const [viewMode, setViewMode] = useState(() => {
    const role = useAuthStore.getState().user?.level_otoritas;
    const isLdr = ['Director', 'Manager', 'Supervisor'].includes(role);
    return isLdr ? 'Tim' : 'Personal';
  });
  const [selectedStaff, setSelectedStaff] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterWorkstream, setFilterWorkstream] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    job_id: '',
    workstream: 'DOC',
    task_type: '',
    description: '',
    assigned_to: '',
    priority: 'NORMAL',
    due_date: ''
  });
  const [creatingTask, setCreatingTask] = useState(false);

  // Document Upload State
  const { documents, fetchDocuments, uploadDocument } = useDocumentStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const isLeader = user?.level_otoritas === 'Manager' || user?.level_otoritas === 'Supervisor';

  useEffect(() => {
    if (user?.level_otoritas) {
      const isLdr = ['Director', 'Manager', 'Supervisor'].includes(user.level_otoritas);
      setViewMode(isLdr ? 'Tim' : 'Personal');
    }
  }, [user?.level_otoritas]);

  useEffect(() => {
    fetchStaffList();
    fetchTasks();
    fetchDocuments();
    fetchJobOptions();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api('/v2/ao-workboard/supervisor/tasks');
      if (res && res.success) {
        setTasks(res.data || []);
      } else {
        toast.error('Gagal mengambil daftar tugas AO');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Terjadi kesalahan memuat data tugas');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await api('/v2/ao-workboard/supervisor/ao-staff');
      if (res && res.success) {
        setStaffList(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobOptions = async () => {
    try {
      const res = await api('/v2/ao-workboard/supervisor/doc-planner/jobs');
      if (res && res.success) {
        setJobOptions(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Move Task handler (for quick arrows and modal change)
  const handleMoveTask = async (taskId, targetCol) => {
    const targetStatus = columnToStatus(targetCol);
    const prevTasks = [...tasks];
    
    // Optimistic UI
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => ({ ...prev, status: targetStatus }));
    }

    try {
      const res = await api(`/v2/ao-workboard/staff/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });

      if (res && res.success) {
        toast.success(`Tugas dipindahkan ke ${targetCol}`);
      } else {
        setTasks(prevTasks);
        toast.error(res?.message || 'Gagal memindahkan tugas');
      }
    } catch (err) {
      setTasks(prevTasks);
      toast.error(err.message || 'Terjadi kesalahan jaringan');
    }
  };

  // Drag and Drop
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetCol) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id.toString() === taskId);
    if (!task) return;
    if (statusToColumn(task.status) === targetCol) return;
    handleMoveTask(task.id, targetCol);
  };
  // Document Upload Handlers
  const handleDragOverDoc = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeaveDoc = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDropDoc = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!selectedTask) return;
    
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validasi Ekstensi File
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      toast.error('Format file tidak didukung. Hanya PDF/JPG yang diizinkan.');
      return;
    }
    
    setUploadingDoc(true);
    try {
      await uploadDocument({
        fileName: file.name,
        type: 'Task Attachment',
        reference: `TASK-${selectedTask.id}`,
        department: 'Account Officer',
        vendorId: '',
        tags: ['AO_TASK']
      }, file, user);
      
      toast.success('Dokumen berhasil diunggah');
      fetchDocuments(); // Refresh list
    } catch (err) {
      toast.error('Gagal mengunggah dokumen: ' + (err.message || 'Error unknown'));
    } finally {
      setUploadingDoc(false);
    }
  };

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.job_id || !newTaskForm.task_type) {
      toast.error('Invoice dan Nama Tugas wajib diisi');
      return;
    }

    setCreatingTask(true);
    try {
      const res = await api('/v2/ao-workboard/supervisor/tasks', {
        method: 'POST',
        body: JSON.stringify(newTaskForm)
      });

      if (res && res.success) {
        toast.success('Tugas baru berhasil dibuat');
        setIsAddModalOpen(false);
        setNewTaskForm({
          job_id: '',
          workstream: 'DOC',
          task_type: '',
          description: '',
          assigned_to: '',
          priority: 'NORMAL',
          due_date: ''
        });
        fetchTasks();
      } else {
        toast.error(res?.message || 'Gagal membuat tugas');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat tugas baru');
    } finally {
      setCreatingTask(false);
    }
  };

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // 1. View Mode (Personal vs Tim)
      if (viewMode === 'Personal' && t.assigned_to?.toString() !== user?.id?.toString()) {
        return false;
      }

      // 2. Staff Filter (when in Tim mode)
      if (viewMode === 'Tim' && selectedStaff !== 'ALL' && t.assigned_to?.toString() !== selectedStaff.toString()) {
        return false;
      }

      // 3. Priority Filter
      if (filterPriority !== 'All' && (t.priority || '').toUpperCase() !== filterPriority.toUpperCase()) {
        return false;
      }

      // 4. Workstream Filter
      if (filterWorkstream !== 'ALL' && (t.workstream || '').toUpperCase() !== filterWorkstream.toUpperCase()) {
        return false;
      }

      // 5. Search
      if (search) {
        const query = search.toLowerCase();
        const matchInvoice = (t.invoice_no || '').toLowerCase().includes(query);
        const matchBuyer = (t.buyer || '').toLowerCase().includes(query);
        const matchType = (t.task_type || '').toLowerCase().includes(query);
        const matchAssignee = (t.assignee_name || '').toLowerCase().includes(query);
        if (!matchInvoice && !matchBuyer && !matchType && !matchAssignee) return false;
      }

      return true;
    });
  }, [tasks, viewMode, selectedStaff, filterPriority, filterWorkstream, search, user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', position: 'relative', backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)', fontFamily: 'var(--font-family-body, -apple-system, sans-serif)', color: 'var(--color-ink, #1d1d1f)', textAlign: 'left' }}>

      {/* ── TOOLBAR HEADER (IDENTICAL TO PETA TUGAS IMPORT) ── */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid var(--color-hairline, #e0e0e0)',
        backgroundColor: 'var(--color-canvas, #ffffff)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Left Side: Title, Subtitle, & ViewMode Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px', margin: '0 0 2px 0', color: 'var(--color-ink, #1d1d1f)', lineHeight: 1.2 }}>
              Peta Tugas AO
            </h1>
            <p style={{ color: 'var(--color-ink-muted-48, #7a7a7a)', fontSize: '13px', margin: 0 }}>
              {viewMode === 'Personal' ? 'Meja Kerja Pribadi' : 'Tugas Seluruh Tim AO'}
              {' · '}
              {filterPriority === 'All' ? 'Semua Prioritas' : `Prioritas: ${filterPriority}`}
              {' · '}
              {filteredTasks.length} tugas
            </p>
          </div>

          <div style={{ display: 'flex', backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)', padding: '4px', borderRadius: 'var(--rounded-lg, 14px)', border: '1px solid var(--color-hairline, #e0e0e0)' }}>
            <button 
              type="button"
              onClick={() => setViewMode('Personal')}
              style={{
                padding: '6px 16px', borderRadius: 'var(--rounded-md, 10px)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                backgroundColor: viewMode === 'Personal' ? 'var(--color-canvas, #ffffff)' : 'transparent',
                color: viewMode === 'Personal' ? 'var(--color-primary, #0066cc)' : 'var(--color-ink-muted-48, #7a7a7a)',
                boxShadow: viewMode === 'Personal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Pribadi
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('Tim')}
              style={{
                padding: '6px 16px', borderRadius: 'var(--rounded-md, 10px)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: viewMode === 'Tim' ? 'var(--color-canvas, #ffffff)' : 'transparent',
                color: viewMode === 'Tim' ? 'var(--color-primary, #0066cc)' : 'var(--color-ink-muted-48, #7a7a7a)',
                boxShadow: viewMode === 'Tim' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Tim AO
            </button>
          </div>
        </div>

        {/* Right Side: Filters, Search, & Action Button */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Segmented Workstream Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)',
            border: '1px solid var(--color-hairline, #e0e0e0)',
            borderRadius: 'var(--rounded-sm, 8px)',
            padding: '3px',
            gap: '2px',
          }}>
            {[
              { value: 'ALL', label: 'Semua' },
              { value: 'DOC', label: 'Dokumen' },
              { value: 'BANK', label: 'Bank/LC' },
              { value: 'LOGISTICS', label: 'Logistik' }
            ].map(({ value, label }) => {
              const isActive = filterWorkstream === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterWorkstream(value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    backgroundColor: isActive ? 'var(--color-canvas, #ffffff)' : 'transparent',
                    color: isActive ? 'var(--color-primary, #0066cc)' : 'var(--color-ink-muted-48, #7a7a7a)',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)',
            border: '1px solid var(--color-hairline, #e0e0e0)',
            borderRadius: 'var(--rounded-sm, 8px)',
            padding: '4px 10px'
          }}>
            <Search size={14} color="var(--color-ink-muted-48, #7a7a7a)" />
            <input 
              type="text" 
              placeholder="Cari invoice, tugas, staf..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: 'var(--color-ink, #1d1d1f)',
                width: '160px',
                padding: 0,
                margin: 0
              }}
            />
            {search && (
              <button 
                type="button"
                onClick={() => setSearch('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: '#86868b' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Staff Filter (Tim Mode) */}
          {viewMode === 'Tim' && (
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--rounded-sm, 8px)',
                border: '1px solid var(--color-hairline, #e0e0e0)',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: 'var(--color-canvas, #ffffff)',
                color: 'var(--color-ink, #1d1d1f)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Semua Staf AO</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--rounded-sm, 8px)',
              border: '1px solid var(--color-hairline, #e0e0e0)',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: 'var(--color-canvas, #ffffff)',
              color: 'var(--color-ink, #1d1d1f)',
              cursor: 'pointer'
            }}
          >
            <option value="All">Semua Prioritas</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Tinggi</option>
            <option value="CRITICAL">Kritis</option>
          </select>

          {/* Add Task Button (Supervisor) */}
          {isLeader && (
            <button 
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                backgroundColor: 'var(--color-primary, #0066cc)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--rounded-sm, 8px)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Plus size={15} /> Tambah Tugas
            </button>
          )}
        </div>
      </div>

      {/* ── KANBAN BOARD CONTAINER (MATCHING TASKMAP IMPORT) ── */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflowX: 'auto',
        padding: '24px 32px',
        gap: '20px',
        backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)',
      }}>
        {COLUMNS.map((col, colIdx) => {
          const colTasks = filteredTasks.filter(t => statusToColumn(t.status) === col);
          const accentColor = columnAccentColor(col);

          return (
            <div 
              key={col} 
              data-testid={`kanban-column-${col.replace(/\s+/g, '-')}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
              style={{
                width: '288px',
                minWidth: '288px',
                backgroundColor: 'var(--color-canvas, #ffffff)',
                borderRadius: 'var(--rounded-lg, 18px)',
                border: '1px solid var(--color-hairline, #e0e0e0)',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 180px)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              {/* Column Header with 3px Accent Border */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-hairline, #e0e0e0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: 'var(--rounded-lg, 18px) var(--rounded-lg, 18px) 0 0',
                borderTop: `3px solid ${accentColor}`,
                backgroundColor: '#ffffff'
              }}>
                <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-ink, #1d1d1f)' }}>
                  {col}
                </span>
                <span style={{
                  backgroundColor: colTasks.length > 0
                    ? accentColor
                    : 'var(--color-canvas-parchment, #f5f5f7)',
                  color: colTasks.length > 0 ? '#fff' : 'var(--color-ink-muted-48, #7a7a7a)',
                  padding: '2px 8px',
                  borderRadius: 'var(--rounded-pill, 9999px)',
                  fontSize: '11px',
                  fontWeight: '700',
                  minWidth: '22px',
                  textAlign: 'center',
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div style={{
                padding: '12px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: '#fafafc'
              }}>
                {colTasks.map(task => {
                  const prioColor = 
                    task.priority === 'CRITICAL' ? { bg: '#feecec', text: '#ff3b30' } :
                    task.priority === 'HIGH' ? { bg: '#fff2e0', text: '#ff9500' } :
                    { bg: '#f0f0f2', text: '#48484a' };

                  return (
                    <div
                      key={task.id}
                      data-testid={`task-card-${task.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      style={{
                        backgroundColor: 'var(--color-canvas, #ffffff)',
                        border: '1px solid var(--color-hairline, #e0e0e0)',
                        borderRadius: 'var(--rounded-lg, 14px)',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary, #0066cc)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-hairline, #e0e0e0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Card Header Row: Invoice Badge & Priority */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)',
                          color: 'var(--color-ink, #1d1d1f)',
                          letterSpacing: '-0.2px'
                        }}>
                          {task.invoice_no ? `INV-${task.invoice_no}` : task.job_code || 'JOB'}
                        </span>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: prioColor.bg,
                          color: prioColor.text,
                          textTransform: 'uppercase'
                        }}>
                          {task.priority || 'NORMAL'}
                        </span>
                      </div>

                      {/* Task Title */}
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--color-ink, #1d1d1f)',
                        lineHeight: 1.35,
                        marginBottom: '4px'
                      }}>
                        {task.task_type}
                      </div>

                      {/* Buyer & Vessel Info */}
                      {(task.buyer || task.vessel) && (
                        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48, #7a7a7a)', marginBottom: '8px' }}>
                          {task.buyer}{task.vessel && ` · ${task.vessel}`}
                        </div>
                      )}

                      {/* Progress / Reminder Alert Notes */}
                      {task.description && (
                        <div style={{
                          fontSize: '12px',
                          color: '#48484a',
                          backgroundColor: '#f5f5f7',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          lineHeight: 1.4,
                          marginBottom: '10px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {task.description}
                        </div>
                      )}

                      {/* Card Footer: Assignee, Due Date & Column Move Controls */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: '1px solid #f2f2f7',
                        fontSize: '11px',
                        color: 'var(--color-ink-muted-48, #7a7a7a)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#e5f1fc',
                            color: '#0066cc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: '700'
                          }}>
                            {(task.assignee_name || '?').charAt(0)}
                          </div>
                          <span style={{ fontWeight: '500', color: '#1d1d1f', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.assignee_name || 'Unassigned'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {task.due_date && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#86868b' }}>
                              <Clock size={11} /> {new Date(task.due_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                            </span>
                          )}

                          {/* Quick Column Shift Arrows */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                            {colIdx > 0 && (
                              <button
                                type="button"
                                title={`Pindahkan ke ${COLUMNS[colIdx - 1]}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveTask(task.id, COLUMNS[colIdx - 1]);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: '#86868b',
                                  borderRadius: '4px',
                                  display: 'flex'
                                }}
                              >
                                <ChevronLeft size={13} />
                              </button>
                            )}
                            {colIdx < COLUMNS.length - 1 && (
                              <button
                                type="button"
                                title={`Pindahkan ke ${COLUMNS[colIdx + 1]}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveTask(task.id, COLUMNS[colIdx + 1]);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: '#86868b',
                                  borderRadius: '4px',
                                  display: 'flex'
                                }}
                              >
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty State when Column has 0 tasks */}
                {colTasks.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--color-ink-muted-48, #7a7a7a)',
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

      {/* ── TASK DETAIL MODAL ── */}
      {selectedTask && (
        <>
          <div
            onClick={() => setSelectedTask(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 1100,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '520px',
              maxWidth: '92vw',
              backgroundColor: 'var(--color-canvas, #ffffff)',
              borderRadius: 'var(--rounded-lg, 18px)',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              zIndex: 1101,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              textAlign: 'left'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  backgroundColor: '#f5f5f7',
                  color: '#0066cc',
                  marginBottom: '8px',
                  display: 'inline-block'
                }}>
                  {selectedTask.invoice_no ? `INV-${selectedTask.invoice_no}` : selectedTask.job_code}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '4px 0 0 0', color: '#1d1d1f' }}>
                  {selectedTask.task_type}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#86868b', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f5f5f7', padding: '14px', borderRadius: '12px' }}>
                <div>
                  <span style={{ color: '#86868b', fontSize: '11px', display: 'block' }}>BUYER</span>
                  <strong style={{ color: '#1d1d1f' }}>{selectedTask.buyer || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#86868b', fontSize: '11px', display: 'block' }}>KAPAL</span>
                  <strong style={{ color: '#1d1d1f' }}>{selectedTask.vessel || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#86868b', fontSize: '11px', display: 'block' }}>ASSIGNEE STAF AO</span>
                  <strong style={{ color: '#0066cc' }}>{selectedTask.assignee_name || 'Belum di-assign'}</strong>
                </div>
                <div>
                  <span style={{ color: '#86868b', fontSize: '11px', display: 'block' }}>TENGGAT (DUE DATE)</span>
                  <strong style={{ color: '#1d1d1f' }}>{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}</strong>
                </div>
              </div>

              {selectedTask.description && (
                <div>
                  <span style={{ color: '#86868b', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Deskripsi & Catatan:</span>
                  <p style={{ margin: 0, lineHeight: 1.5, color: '#1d1d1f', background: '#fffdf5', border: '1px solid #f5e6b3', padding: '12px 14px', borderRadius: '10px' }}>
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Upload Document Section */}
              <div style={{ marginTop: '4px', borderTop: '1px solid #f2f2f7', paddingTop: '12px' }}>
                <span style={{ color: '#86868b', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Dokumen Pendukung:</span>
                
                {/* Drag and Drop Zone */}
                <div 
                  data-testid="document-dropzone"
                  onDragOver={handleDragOverDoc}
                  onDragLeave={handleDragLeaveDoc}
                  onDrop={handleDropDoc}
                  onClick={() => document.getElementById('hidden-file-input').click()}
                  style={{
                    border: isDragging ? '2px dashed #007aff' : '2px dashed #d2d2d7',
                    backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '12px'
                  }}
                >
                  <UploadCloud size={24} style={{ color: isDragging ? '#007aff' : '#86868b', marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: '#1d1d1f', fontWeight: '500' }}>
                    {uploadingDoc ? 'Mengunggah...' : 'Drag & Drop atau klik untuk upload file dokumen'}
                  </p>
                  <span style={{ fontSize: '11px', color: '#86868b' }}>(.pdf, .jpg, .png | Max 5MB)</span>
                  <input
                    id="hidden-file-input"
                    type="file"
                    data-testid="hidden-file-input"
                    style={{ display: 'none' }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleDropDoc({
                          preventDefault: () => {},
                          dataTransfer: { files: e.target.files }
                        });
                      }
                    }}
                  />
                </div>

                {/* Document List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {documents.filter(d => d.reference === `TASK-${selectedTask.id}`).length > 0 ? (
                    documents.filter(d => d.reference === `TASK-${selectedTask.id}`).map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f5f5f7', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="#007aff" />
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{doc.fileName}</span>
                        </div>
                        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${doc.file_path}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#007aff', textDecoration: 'none', fontWeight: '600' }}>
                          Lihat
                        </a>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: '#86868b', fontStyle: 'italic' }}>Belum ada dokumen yang dilampirkan.</div>
                  )}
                </div>
              </div>

              {/* Move Status Selector */}
              <div>
                <span style={{ color: '#86868b', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Status Saat Ini di Kanban:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {COLUMNS.map(col => {
                    const isCurrent = statusToColumn(selectedTask.status) === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleMoveTask(selectedTask.id, col)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isCurrent ? `2px solid ${columnAccentColor(col)}` : '1px solid #e0e0e0',
                          backgroundColor: isCurrent ? columnAccentColor(col) : '#ffffff',
                          color: isCurrent ? '#ffffff' : '#1d1d1f',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #f2f2f7' }}>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f5f5f7',
                  border: '1px solid #e0e0e0',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#1d1d1f'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL TAMBAH TUGAS (SUPERVISOR) ── */}
      {isAddModalOpen && (
        <>
          <div
            onClick={() => setIsAddModalOpen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 1100,
            }}
          />
          <form
            onSubmit={handleCreateTask}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '540px',
              maxWidth: '92vw',
              backgroundColor: 'var(--color-canvas, #ffffff)',
              borderRadius: 'var(--rounded-lg, 18px)',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              zIndex: 1101,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1d1d1f' }}>
                Tambah Tugas Baru AO
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#86868b', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              {/* Select Invoice */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1d1d1f' }}>
                  Pilih Invoice / Shipment *
                </label>
                <select
                  required
                  data-testid="add-task-invoice"
                  value={newTaskForm.job_id}
                  onChange={e => setNewTaskForm({ ...newTaskForm, job_id: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '13px', background: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="">-- Pilih Invoice --</option>
                  {jobOptions.map(job => (
                    <option key={job.id} value={job.id}>
                      INV-{job.invoice_no} · {job.buyer} ({job.vessel || 'Vessel TBA'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Type / Judul Tugas */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1d1d1f' }}>
                  Nama Tugas *
                </label>
                <input
                  type="text"
                  required
                  data-testid="add-task-name"
                  placeholder="Contoh: Pengecekan B/L Draft, Konfirmasi LC..."
                  value={newTaskForm.task_type}
                  onChange={e => setNewTaskForm({ ...newTaskForm, task_type: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '13px', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              {/* Workstream & Priority Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1d1d1f' }}>
                    Kategori (Workstream)
                  </label>
                  <select
                    value={newTaskForm.workstream}
                    onChange={e => setNewTaskForm({ ...newTaskForm, workstream: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '13px', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="DOC">Dokumen (DOC)</option>
                    <option value="BANK">Perbankan / LC</option>
                    <option value="LOGISTICS">Logistik & Trucking</option>
                    <option value="DSCS">DSCS & Catch Cert</option>
                    <option value="AO_CORE">Operasional Utama</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1d1d1f' }}>
                    Prioritas
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '13px', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Tinggi</option>
                    <option value="CRITICAL">Kritis</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Due Date Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1d1d1f' }}>
                    Tugaskan Kepada (Staf AO)
                  </label>
                  <select
                    data-testid="add-task-assignee"
                    value={newTaskForm.assigned_to}
                    onChange={e => setNewTaskForm({ ...newTaskForm, assigned_to: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '13px', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Belum Ditugaskan --</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1d1d1f' }}>
                    Tenggat Waktu
                  </label>
                  <input
                    type="date"
                    value={newTaskForm.due_date}
                    onChange={e => setNewTaskForm({ ...newTaskForm, due_date: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '13px', background: '#ffffff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1d1d1f' }}>
                  Instruksi / Catatan Tambahan
                </label>
                <textarea
                  rows={3}
                  data-testid="add-task-description"
                  placeholder="Tuliskan instruksi atau catatan khusus untuk staf pelaksana..."
                  value={newTaskForm.description}
                  onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '13px', background: '#ffffff', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f2f2f7' }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#f5f5f7',
                  border: '1px solid #e0e0e0',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#1d1d1f'
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                data-testid="add-task-submit"
                disabled={creatingTask}
                style={{
                  padding: '8px 22px',
                  backgroundColor: '#0066cc',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#ffffff',
                  opacity: creatingTask ? 0.6 : 1
                }}
              >
                {creatingTask ? 'Menyimpan...' : 'Simpan Tugas'}
              </button>
            </div>
          </form>
        </>
      )}

    </div>
  );
}
