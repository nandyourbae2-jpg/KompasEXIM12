import React, { useEffect } from 'react';
import { useAoStore } from '../store/useAoStore';
import AoTaskCard from '../components/AoTaskCard';
import AoJobDetail from '../components/AoJobDetail';
import { isOverdue, isToday } from '../utils/dateHelpers';

const TaskSection = ({ title, count, children, variant = 'gray' }) => {
  const headerColors = {
    red: 'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)] border border-[var(--color-status-danger)] border-opacity-20',
    orange: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)] border border-[var(--color-status-warning)] border-opacity-20',
    yellow: 'bg-[var(--color-annotation-highlight-bg)] text-yellow-800 border border-[var(--color-annotation-highlight-border)] border-opacity-50',
    gray: 'bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)]'
  };

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex justify-between items-center px-4 py-3 rounded-[18px] ${headerColors[variant]}`}>
        <h2 className="font-semibold tracking-tight text-[17px]">{title}</h2>
        <span className="font-semibold bg-white px-3 py-1 rounded-full text-sm opacity-90 border border-[var(--color-hairline)] shadow-sm">{count} Tasks</span>
      </div>
      
      {count === 0 ? (
        <div className="p-8 text-center text-[var(--color-ink-muted-48)] bg-[var(--color-canvas)] rounded-[18px] border border-dashed border-[var(--color-hairline)]">
          No tasks in this bucket. You're all caught up!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children}
        </div>
      )}
    </div>
  );
};

const AoWorkboard = () => {
  const { staffTasks, fetchStaffTasks, fetchJobDetail, isLoading, error } = useAoStore();

  useEffect(() => {
    fetchStaffTasks();
  }, [fetchStaffTasks]);

  // Handlers
  const handleUpdateStatus = (task) => alert(`Update Status clicked for task ${task.id}`);
  const handleAddNote = (task) => alert(`Tambah Catatan clicked for task ${task.id}`);
  const handleOpenDetail = (task) => {
    fetchJobDetail(task.job_id);
  };

  if (isLoading) return <div className="p-6">Loading Workboard...</div>;
  if (error) return <div className="p-6 text-[var(--color-status-danger)]">Error: {error}</div>;

  // Filter logic
  const overdueTasks = staffTasks.filter(t => t.status === 'BLOCKED' || (t.status !== 'COMPLETED' && isOverdue(t.due_date)));
  const todayTasks = staffTasks.filter(t => isToday(t.due_date) && t.status !== 'COMPLETED' && t.status !== 'BLOCKED' && !isOverdue(t.due_date));
  const waitingTasks = staffTasks.filter(t => t.status === 'WAITING');
  const upcomingTasks = staffTasks.filter(t => 
    t.status !== 'COMPLETED' && 
    t.status !== 'BLOCKED' && 
    t.status !== 'WAITING' && 
    !isToday(t.due_date) && 
    !isOverdue(t.due_date)
  );

  return (
    <div className="flex flex-col gap-8 p-6 bg-[var(--color-canvas-parchment)] min-h-screen">
      <div className="flex justify-between items-center border-b border-[var(--color-hairline)] pb-4">
        <div>
          <h1 className="text-[34px] font-semibold text-[var(--color-ink)] tracking-tight leading-tight">My AO Workboard</h1>
          <p className="text-[17px] text-[var(--color-ink-muted-48)] mt-1 tracking-tight">Manage and execute your assigned tasks efficiently.</p>
        </div>
        <button 
          onClick={() => fetchStaffTasks()}
          className="text-[14px] bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] px-4 py-2 rounded-full shadow-sm hover:bg-[var(--color-surface-pearl)] font-medium active:scale-95 transition-transform"
        >
          Refresh Data
        </button>
      </div>

      {/* TUGAS AKTIF & HANDOVER MASUK */}
      <TaskSection title="📋 TUGAS AKTIF & HANDOVER MASUK" count={upcomingTasks.length} variant="gray">
        {upcomingTasks.map(task => (
          <AoTaskCard 
            key={task.id} 
            task={task} 
            onUpdateStatus={handleUpdateStatus}
            onAddNote={handleAddNote}
            onOpenDetail={handleOpenDetail}
          />
        ))}
      </TaskSection>

      {/* OVERDUE / BLOCKED */}
      <TaskSection title="🚨 OVERDUE / BLOCKED" count={overdueTasks.length} variant="red">
        {overdueTasks.map(task => (
          <AoTaskCard 
            key={task.id} 
            task={task} 
            onUpdateStatus={handleUpdateStatus}
            onAddNote={handleAddNote}
            onOpenDetail={handleOpenDetail}
          />
        ))}
      </TaskSection>

      {/* DUE TODAY */}
      <TaskSection title="⚠️ DUE TODAY" count={todayTasks.length} variant="orange">
        {todayTasks.map(task => (
          <AoTaskCard 
            key={task.id} 
            task={task} 
            onUpdateStatus={handleUpdateStatus}
            onAddNote={handleAddNote}
            onOpenDetail={handleOpenDetail}
          />
        ))}
      </TaskSection>

      {/* WAITING */}
      <TaskSection title="⏳ WAITING" count={waitingTasks.length} variant="yellow">
        {waitingTasks.map(task => (
          <AoTaskCard 
            key={task.id} 
            task={task} 
            onUpdateStatus={handleUpdateStatus}
            onAddNote={handleAddNote}
            onOpenDetail={handleOpenDetail}
          />
        ))}
      </TaskSection>

      <AoJobDetail />
    </div>
  );
};

export default AoWorkboard;
